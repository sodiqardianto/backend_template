import { Router } from "express";
import { roleController } from "./role.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createRoleSchema,
  updateRoleSchema,
  idParamSchema,
  syncPermissionsSchema,
  bulkDeleteRoleSchema,
} from "./role.validation.js";

const router = Router();

/**
 * Role Routes
 *
 * GET    /api/roles                    - Get all roles
 * GET    /api/roles/:id                - Get single role
 * POST   /api/roles                    - Create role
 * PUT    /api/roles/:id                - Update role
 * DELETE /api/roles/:id                - Delete role
 * PATCH  /api/roles/:id/permissions    - Sync role permissions
 */

// Get all roles
router.get("/", roleController.getAll);

// Get single role
router.get(
  "/:id",
  validate({ params: idParamSchema }),
  roleController.getById
);

// Create role
router.post(
  "/",
  validate({ body: createRoleSchema }),
  roleController.create
);

// Update role
router.put(
  "/:id",
  validate({ params: idParamSchema, body: updateRoleSchema }),
  roleController.update
);

// Bulk delete roles (must be before /:id to avoid route conflict)
router.delete(
  "/bulk",
  validate({ body: bulkDeleteRoleSchema }),
  roleController.bulkDelete
);

// Delete role
router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  roleController.delete
);

// Sync permissions
router.patch(
  "/:id/permissions",
  validate({ params: idParamSchema, body: syncPermissionsSchema }),
  roleController.syncPermissions
);

export { router as roleRoutes };
export default router;
