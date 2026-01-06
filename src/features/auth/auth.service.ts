import type { User } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { AppError } from "../../shared/errors/app-error.js";
import { mapUserResponse, type UserResponse } from "../../shared/utils/user-mapper.js";
import type { IAuthRepository } from "./auth.repository.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

// JWT Configuration
const JWT_SECRET_VALUE = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN || "15m") as StringValue;
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as StringValue;
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

if (!JWT_SECRET_VALUE) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Type assertion after validation - TypeScript knows this is definitely a string
const JWT_SECRET: string = JWT_SECRET_VALUE;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

export interface IAuthService {
  register(data: RegisterInput): Promise<AuthResponse>;
  login(data: LoginInput): Promise<AuthResponse>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
}

/**
 * Auth Service - Business logic for authentication
 */
export class AuthService implements IAuthService {
  constructor(private readonly repository: IAuthRepository) {}

  /**
   * Register new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.repository.findUserByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict("Email already registered");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const user = await this.repository.createUser({
      ...data,
      password: hashedPassword,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: mapUserResponse(user),
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await this.repository.findUserByEmail(data.email);
    if (!user) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw AppError.forbidden("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: mapUserResponse(user),
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find refresh token in database
    const storedToken = await this.repository.findRefreshToken(refreshToken);
    if (!storedToken) {
      throw AppError.unauthorized("Invalid refresh token");
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      await this.repository.deleteRefreshToken(refreshToken);
      throw AppError.unauthorized("Refresh token expired");
    }

    // Find user
    const user = await this.repository.findUserById(storedToken.userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized("User not found or inactive");
    }

    // Delete old refresh token
    await this.repository.deleteRefreshToken(refreshToken);

    // Generate new tokens
    return this.generateTokens(user);
  }

  /**
   * Logout - invalidate refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    await this.repository.deleteRefreshToken(refreshToken);
  }

  /**
   * Generate access and refresh tokens
   * Max 4 devices - oldest tokens are removed when limit exceeded
   */
  private async generateTokens(user: User): Promise<AuthTokens> {
    const MAX_DEVICES = 4;

    // Generate access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRES_IN }
    );

    // Generate refresh token
    const refreshTokenValue = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Check token count and delete oldest if limit exceeded
    const tokenCount = await this.repository.countUserRefreshTokens(user.id);
    if (tokenCount >= MAX_DEVICES) {
      // Keep only (MAX_DEVICES - 1) to make room for new token
      await this.repository.deleteOldestRefreshTokens(user.id, MAX_DEVICES - 1);
    }

    // Store refresh token in database
    await this.repository.createRefreshToken(user.id, refreshTokenValue, expiresAt);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }
}

// Factory function for dependency injection
export function createAuthService(repository: IAuthRepository): IAuthService {
  return new AuthService(repository);
}
