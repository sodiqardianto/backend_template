import { Router } from "express";
import { menuController } from "./menu.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createMenuSchema,
  updateMenuSchema,
  idParamSchema,
  reorderSchema,
} from "./menu.validation.js";

const router = Router();

/**
 * Menu Routes
 * 
 * GET    /api/menus          - Get all menus
 * GET    /api/menus/:id      - Get single menu
 * POST   /api/menus          - Create menu
 * PUT    /api/menus/:id      - Update menu
 * DELETE /api/menus/:id      - Delete menu
 * PATCH  /api/menus/reorder  - Bulk reorder menus
 */

// Get all menus
router.get("/", menuController.getAll);

// Get single menu
router.get(
  "/:id",
  validate({ params: idParamSchema }),
  menuController.getById
);

// Create menu
router.post(
  "/",
  validate({ body: createMenuSchema }),
  menuController.create
);

// Update menu
router.put(
  "/:id",
  validate({ params: idParamSchema, body: updateMenuSchema }),
  menuController.update
);

// Delete menu
router.delete(
  "/:id",
  validate({ params: idParamSchema }),
  menuController.delete
);

// Bulk reorder
router.patch(
  "/reorder",
  validate({ body: reorderSchema }),
  menuController.reorder
);

export { router as menuRoutes };
export default router;
