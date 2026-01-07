import { Router } from "express";
import { userController } from "./user.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  syncRolesSchema,
} from "./user.validation.js";

const router = Router();

/**
 * User Routes
 * All routes are protected by authMiddleware applied in app.ts
 * 
 * GET    /api/users              - Get all users
 * POST   /api/users              - Create new user
 * GET    /api/users/:id          - Get single user
 * PUT    /api/users/:id          - Update user
 * DELETE /api/users/:id          - Delete user
 * PATCH  /api/users/:id/roles    - Sync user roles
 */

// Get all users
router.get("/", userController.getAll);

// Create new user
router.post(
  "/",
  validate({ body: createUserSchema }),
  userController.create
);

// Get single user
router.get(
  "/:id",
  validate({ params: userIdParamSchema }),
  userController.getById
);

// Update user
router.put(
  "/:id",
  validate({ params: userIdParamSchema, body: updateUserSchema }),
  userController.update
);

// Delete user
router.delete(
  "/:id",
  validate({ params: userIdParamSchema }),
  userController.delete
);

// Sync roles
router.patch(
  "/:id/roles",
  validate({ params: userIdParamSchema, body: syncRolesSchema }),
  userController.syncRoles
);

export { router as userRoutes };
export default router;
