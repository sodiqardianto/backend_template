import type { Menu } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import type { IMenuRepository } from "./menu.repository.js";
import type { CreateMenuInput, UpdateMenuInput } from "./menu.validation.js";

export interface IMenuService {
  getAllMenus(): Promise<Menu[]>;
  getMenuById(id: string): Promise<Menu>;
  createMenu(data: CreateMenuInput): Promise<Menu>;
  updateMenu(id: string, data: UpdateMenuInput): Promise<Menu>;
  deleteMenu(id: string): Promise<Menu>;
  reorderMenus(items: { id: string; order: number }[]): Promise<void>;
}

/**
 * Menu Service - Business logic
 * Single Responsibility: Only handles business logic
 * Dependency Inversion: Depends on repository interface
 */
export class MenuService implements IMenuService {
  constructor(private readonly repository: IMenuRepository) {}

  /**
   * Get all menus
   */
  async getAllMenus(): Promise<Menu[]> {
    return this.repository.findAll();
  }

  /**
   * Get menu by ID
   */
  async getMenuById(id: string): Promise<Menu> {
    const menu = await this.repository.findById(id);
    
    if (!menu) {
      throw AppError.notFound("Menu not found");
    }
    
    return menu;
  }

  /**
   * Create new menu
   */
  async createMenu(data: CreateMenuInput): Promise<Menu> {
    // Check if path already exists
    const existingMenu = await this.repository.findByPath(data.path);
    
    if (existingMenu) {
      throw AppError.conflict(`Menu with path "${data.path}" already exists`);
    }

    // Validate parent exists if parentId is provided
    if (data.parentId) {
      const parentMenu = await this.repository.findById(data.parentId);
      if (!parentMenu) {
        throw AppError.badRequest("Parent menu not found");
      }
    }

    return this.repository.create(data);
  }

  /**
   * Update existing menu
   */
  async updateMenu(id: string, data: UpdateMenuInput): Promise<Menu> {
    // Check if menu exists
    const existingMenu = await this.repository.findById(id);
    
    if (!existingMenu) {
      throw AppError.notFound("Menu not found");
    }

    // Check if new path conflicts with another menu
    if (data.path && data.path !== existingMenu.path) {
      const menuWithPath = await this.repository.findByPath(data.path);
      if (menuWithPath) {
        throw AppError.conflict(`Menu with path "${data.path}" already exists`);
      }
    }

    // Prevent circular parent reference
    if (data.parentId === id) {
      throw AppError.badRequest("Menu cannot be its own parent");
    }

    return this.repository.update(id, data);
  }

  /**
   * Delete menu
   */
  async deleteMenu(id: string): Promise<Menu> {
    const menu = await this.repository.findById(id);
    
    if (!menu) {
      throw AppError.notFound("Menu not found");
    }

    return this.repository.delete(id);
  }

  /**
   * Reorder menus
   */
  async reorderMenus(items: { id: string; order: number }[]): Promise<void> {
    // Validate all IDs exist
    for (const item of items) {
      const menu = await this.repository.findById(item.id);
      if (!menu) {
        throw AppError.badRequest(`Menu with ID "${item.id}" not found`);
      }
    }

    return this.repository.reorder(items);
  }
}

// Factory function for dependency injection
export function createMenuService(repository: IMenuRepository): IMenuService {
  return new MenuService(repository);
}
