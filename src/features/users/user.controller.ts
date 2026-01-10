import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { AppError } from "../../shared/errors/app-error.js";
import { userRepository } from "./user.repository.js";
import { roleRepository } from "../roles/role.repository.js";
import { authRepository } from "../auth/auth.repository.js";
import { createUserService } from "./user.service.js";
import type { CreateUserInput, UpdateUserInput, SyncRolesInput, BulkDeleteUserInput } from "./user.validation.js";

// Create service instance with repositories (Dependency Injection)
const userService = createUserService(userRepository, roleRepository);

/**
 * User Controller - HTTP request handlers
 */
export class UserController {
  /**
   * GET /api/users/me
   * Get current authenticated user with permissions
   */
  getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw AppError.unauthorized("User not found in request");
    }
    
    // Get user with permissions (same format as login response)
    const user = await authRepository.findUserByIdWithPermissions(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Extract unique permissions from all roles
    const permissions = [...new Set(
      user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.name)
      )
    )];

    // Return user with permissions (matching login response format)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions,
    };

    ApiResponse.success(res, userResponse, "Current user retrieved successfully");
  });

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
   * DELETE /api/users/bulk
   * Bulk delete users
   */
  bulkDelete = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body as BulkDeleteUserInput;
    const count = await userService.deleteUsers(ids);
    ApiResponse.success(res, { deletedCount: count }, `${count} user(s) deleted successfully`);
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
