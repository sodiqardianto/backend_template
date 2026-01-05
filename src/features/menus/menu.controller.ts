import type { Request, Response } from "express";
import { ApiResponse } from "../../shared/utils/api-response.js";
import { asyncHandler } from "../../shared/middlewares/async-handler.js";
import { menuRepository } from "./menu.repository.js";
import { MenuService, createMenuService } from "./menu.service.js";
import type { CreateMenuInput, UpdateMenuInput, ReorderInput } from "./menu.validation.js";

// Create service instance with repository (Dependency Injection)
const menuService = createMenuService(menuRepository);

/**
 * Menu Controller - HTTP request handlers
 * Single Responsibility: Only handles HTTP requests/responses
 */
export class MenuController {
  /**
   * GET /api/menus
   * Get all menus
   */
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const menus = await menuService.getAllMenus();
    ApiResponse.success(res, menus, "Menus retrieved successfully");
  });

  /**
   * GET /api/menus/:id
   * Get single menu by ID
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const menu = await menuService.getMenuById(id);
    ApiResponse.success(res, menu, "Menu retrieved successfully");
  });

  /**
   * POST /api/menus
   * Create new menu
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateMenuInput;
    const menu = await menuService.createMenu(data);
    ApiResponse.created(res, menu, "Menu created successfully");
  });

  /**
   * PUT /api/menus/:id
   * Update existing menu
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateMenuInput;
    const menu = await menuService.updateMenu(id, data);
    ApiResponse.success(res, menu, "Menu updated successfully");
  });

  /**
   * DELETE /api/menus/:id
   * Delete menu
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await menuService.deleteMenu(id);
    ApiResponse.success(res, null, "Menu deleted successfully");
  });

  /**
   * PATCH /api/menus/reorder
   * Bulk reorder menus
   */
  reorder = asyncHandler(async (req: Request, res: Response) => {
    const { items } = req.body as ReorderInput;
    await menuService.reorderMenus(items);
    ApiResponse.success(res, null, "Menus reordered successfully");
  });
}

// Export singleton instance
export const menuController = new MenuController();
export default menuController;
