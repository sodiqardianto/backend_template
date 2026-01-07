import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { userRepository } from "./user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { createUserService } from "./user.service.js";
import type { CreateUserInput, UpdateUserInput, SyncRolesInput } from "./user.validation.js";

// Create service instance with repositories (Dependency Injection)
const userService = createUserService(userRepository, roleRepository);

/**
 * User Controller - HTTP request handlers
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
   * POST /api/users
   * Create new user
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateUserInput;
    const user = await userService.createUser(data);
    ApiResponse.created(res, user, "User created successfully");
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

  /**
   * PATCH /api/users/:id/roles
   * Sync user roles
   */
  syncRoles = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { roleIds } = req.body as SyncRolesInput;
    const user = await userService.syncRoles(id, roleIds);
    ApiResponse.success(res, user, "User roles synced successfully");
  });
}

// Export singleton instance
export const userController = new UserController();
export default userController;
