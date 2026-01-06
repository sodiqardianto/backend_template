import { Router } from "express";
import { userController } from "./user.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  updateUserSchema,
  userIdParamSchema,
} from "./user.validation.js";

const router = Router();

/**
 * User Routes
 * All routes are protected by authMiddleware applied in app.ts
 * 
 * GET    /api/users          - Get all users
 * GET    /api/users/:id      - Get single user
 * PUT    /api/users/:id      - Update user
 * DELETE /api/users/:id      - Delete user
 */

// Get all users
router.get("/", userController.getAll);

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

export { router as userRoutes };
export default router;
