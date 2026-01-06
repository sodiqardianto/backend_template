import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { userRepository } from "./user.repository.js";
import { createUserService } from "./user.service.js";
import type { UpdateUserInput } from "./user.validation.js";

// Create service instance with repository (Dependency Injection)
const userService = createUserService(userRepository);

/**
 * User Controller - HTTP request handlers
 * Single Responsibility: Only handles HTTP requests/responses
 */
export class UserController {
  /**
   * GET /api/users
   * Get all users
   */
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();
    ApiResponse.success(res, users, "Users retrieved successfully");
  });

  /**
   * GET /api/users/:id
   * Get single user by ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    ApiResponse.success(res, user, "User retrieved successfully");
  });

  /**
   * PUT /api/users/:id
   * Update existing user
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateUserInput;
    const user = await userService.updateUser(id, data);
    ApiResponse.success(res, user, "User updated successfully");
  });

  /**
   * DELETE /api/users/:id
   * Delete user
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await userService.deleteUser(id);
    ApiResponse.success(res, null, "User deleted successfully");
  });
}

// Export singleton instance
export const userController = new UserController();
export default userController;
