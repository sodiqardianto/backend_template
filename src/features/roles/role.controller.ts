import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { roleRepository } from "./role.repository.js";
import { permissionRepository } from "../permissions/permission.repository.js";
import { createRoleService } from "./role.service.js";
import type { CreateRoleInput, UpdateRoleInput, SyncPermissionsInput } from "./role.validation.js";

// Create service instance with repositories (Dependency Injection)
const roleService = createRoleService(roleRepository, permissionRepository);

/**
 * Role Controller - HTTP request handlers
 */
export class RoleController {
  /**
   * GET /api/roles
   * Get all roles
   */
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const roles = await roleService.getAllRoles();
    ApiResponse.success(res, roles, "Roles retrieved successfully");
  });

  /**
   * GET /api/roles/:id
   * Get single role by ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const role = await roleService.getRoleById(id);
    ApiResponse.success(res, role, "Role retrieved successfully");
  });

  /**
   * POST /api/roles
   * Create new role
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateRoleInput;
    const role = await roleService.createRole(data);
    ApiResponse.created(res, role, "Role created successfully");
  });

  /**
   * PUT /api/roles/:id
   * Update existing role
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateRoleInput;
    const role = await roleService.updateRole(id, data);
    ApiResponse.success(res, role, "Role updated successfully");
  });

  /**
   * DELETE /api/roles/:id
   * Delete role
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await roleService.deleteRole(id);
    ApiResponse.success(res, null, "Role deleted successfully");
  });

  /**
   * PATCH /api/roles/:id/permissions
   * Sync role permissions
   */
  syncPermissions = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { permissionIds } = req.body as SyncPermissionsInput;
    const role = await roleService.syncPermissions(id, permissionIds);
    ApiResponse.success(res, role, "Role permissions synced successfully");
  });
}

// Export singleton instance
export const roleController = new RoleController();
export default roleController;
