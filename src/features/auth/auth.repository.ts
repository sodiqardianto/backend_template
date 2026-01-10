import type { User, RefreshToken } from "@prisma/client";
import prisma from "../../config/database.js";
import type { RegisterInput } from "./auth.validation.js";

export interface IAuthRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  findUserByEmailWithPermissions(email: string): Promise<UserWithPermissions | null>;
  findUserByIdWithPermissions(id: string): Promise<UserWithPermissions | null>;
  createUser(data: RegisterInput & { password: string }): Promise<User>;
  createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteUserRefreshTokens(userId: string): Promise<void>;
  countUserRefreshTokens(userId: string): Promise<number>;
  deleteOldestRefreshTokens(userId: string, keepCount: number): Promise<void>;
}

// Type for user with permissions
export type UserWithPermissions = User & {
  roles: {
    role: {
      permissions: {
        permission: {
          name: string;
        };
      }[];
    };
  }[];
};

/**
 * Auth Repository - Database operations for authentication
 */
export class AuthRepository implements IAuthRepository {
  /**
   * Find user by email (exclude soft deleted)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
  }

  /**
   * Find user by ID (exclude soft deleted)
   */
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  /**
   * Find user by email with permissions (exclude soft deleted)
   */
  async findUserByEmailWithPermissions(email: string): Promise<UserWithPermissions | null> {
    return prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find user by ID with permissions (exclude soft deleted)
   */
  async findUserByIdWithPermissions(id: string): Promise<UserWithPermissions | null> {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create new user
   */
  async createUser(data: RegisterInput & { password: string }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });
  }

  /**
   * Create refresh token
   */
  async createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Find refresh token with user
   */
  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  /**
   * Delete refresh token
   */
  async deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({
      where: { token },
    }).catch(() => {
      // Ignore if token doesn't exist
    });
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteUserRefreshTokens(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Count refresh tokens for a user
   */
  async countUserRefreshTokens(userId: string): Promise<number> {
    return prisma.refreshToken.count({
      where: { userId },
    });
  }

  /**
   * Delete oldest refresh tokens, keeping only the specified count
   */
  async deleteOldestRefreshTokens(userId: string, keepCount: number): Promise<void> {
    // Get all tokens ordered by creation date (oldest first)
    const tokens = await prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    // Calculate how many to delete
    const deleteCount = tokens.length - keepCount;
    if (deleteCount <= 0) return;

    // Get IDs of tokens to delete (oldest ones)
    const idsToDelete = tokens.slice(0, deleteCount).map((t) => t.id);

    // Delete oldest tokens
    await prisma.refreshToken.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }
}

// Export singleton instance
export const authRepository = new AuthRepository();
export default authRepository;
