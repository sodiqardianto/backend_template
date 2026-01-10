import { Router } from "express";
import { permissionController } from "./permission.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createPermissionSchema,
  updatePermissionSchema,
  idParamSchema,
  bulkDeleteSchema,
} from "./permission.validation.js";

const router = Router();

/**
 * Permission Routes
 *
 * GET    /api/permissions          - Get all permissions
 * GET    /api/permissions/:id      - Get single permission
 * POST   /api/permissions          - Create permission
 * PUT    /api/permissions/:id      - Update permission
 * DELETE /api/permissions/:id      - Delete permission
 */

// Get all permissions
router.get("/", permissionController.getAll);

// Get single permission
router.get(
  "/:id",
  validate({ params: idParamSchema }),
  permissionController.getById
);

// Create permission
router.post(
  "/",
  validate({ body: createPermissionSchema }),
  permissionController.create
);

// Update permission
router.put(
  "/:id",
  validate({ params: idParamSchema, body: updatePermissionSchema }),
  permissionController.update
);

// Bulk delete permissions (must be before /:id to avoid route conflict)
router.delete(
  "/bulk",
  validate({ body: bulkDeleteSchema }),
  permissionController.bulkDelete
);

// Delete permission
router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  permissionController.delete
);

export { router as permissionRoutes };
export default router;
