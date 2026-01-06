import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { authRepository } from "./auth.repository.js";
import { createAuthService } from "./auth.service.js";
import type { RegisterInput, LoginInput, RefreshTokenInput } from "./auth.validation.js";

// Create service instance with repository (Dependency Injection)
const authService = createAuthService(authRepository);

/**
 * Auth Controller - HTTP request handlers for authentication
 */
export class AuthController {
  /**
   * POST /api/auth/register
   * Register new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as RegisterInput;
    const result = await authService.register(data);
    ApiResponse.created(res, result, "User registered successfully");
  });

  /**
   * POST /api/auth/login
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as LoginInput;
    const result = await authService.login(data);
    ApiResponse.success(res, result, "Login successful");
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const tokens = await authService.refreshToken(refreshToken);
    ApiResponse.success(res, tokens, "Token refreshed successfully");
  });

  /**
   * POST /api/auth/logout
   * Logout user - invalidate refresh token
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshTokenInput;
    await authService.logout(refreshToken);
    ApiResponse.success(res, null, "Logged out successfully");
  });
}

// Export singleton instance
export const authController = new AuthController();
export default authController;
