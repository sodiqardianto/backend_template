import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { permissionRepository } from "./permission.repository.js";
import { createPermissionService } from "./permission.service.js";
import type { CreatePermissionInput, UpdatePermissionInput, BulkDeleteInput } from "./permission.validation.js";

// Create service instance with repository (Dependency Injection)
const permissionService = createPermissionService(permissionRepository);

/**
 * Permission Controller - HTTP request handlers
 */
export class PermissionController {
  /**
   * GET /api/permissions
   * Get all permissions
   */
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const permissions = await permissionService.getAllPermissions();
    ApiResponse.success(res, permissions, "Permissions retrieved successfully");
  });

  /**
   * GET /api/permissions/:id
   * Get single permission by ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const permission = await permissionService.getPermissionById(id);
    ApiResponse.success(res, permission, "Permission retrieved successfully");
  });

  /**
   * POST /api/permissions
   * Create new permission
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreatePermissionInput;
    const permission = await permissionService.createPermission(data);
    ApiResponse.created(res, permission, "Permission created successfully");
  });

  /**
   * PUT /api/permissions/:id
   * Update existing permission
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdatePermissionInput;
    const permission = await permissionService.updatePermission(id, data);
    ApiResponse.success(res, permission, "Permission updated successfully");
  });

  /**
   * DELETE /api/permissions/:id
   * Delete permission
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await permissionService.deletePermission(id);
    ApiResponse.success(res, null, "Permission deleted successfully");
  });

  /**
   * DELETE /api/permissions/bulk
   * Bulk delete permissions
   */
  bulkDelete = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body as BulkDeleteInput;
    const count = await permissionService.deletePermissions(ids);
    ApiResponse.success(res, { deletedCount: count }, `${count} permission(s) deleted successfully`);
  });
}

// Export singleton instance
export const permissionController = new PermissionController();
export default permissionController;
