import type { Menu, Prisma } from "@prisma/client";
import prisma from "../../config/database.js";
import type { CreateMenuInput, UpdateMenuInput } from "./menu.validation.js";

export interface IMenuRepository {
  findAll(): Promise<Menu[]>;
  findById(id: string): Promise<Menu | null>;
  findByPath(path: string): Promise<Menu | null>;
  create(data: CreateMenuInput): Promise<Menu>;
  update(id: string, data: UpdateMenuInput): Promise<Menu>;
  delete(id: string): Promise<Menu>;
  getNextOrder(): Promise<number>;
  reorder(items: { id: string; order: number }[]): Promise<void>;
}

/**
 * Menu Repository - Database operations
 * Single Responsibility: Only handles database operations
 */
export class MenuRepository implements IMenuRepository {
  /**
   * Get all menus ordered by order field
   */
  async findAll(): Promise<Menu[]> {
    return prisma.menu.findMany({
      orderBy: { order: "asc" },
      include: {
        parent: {
          select: { id: true, title: true },
        },
      },
    });
  }

  /**
   * Find menu by ID
   */
  async findById(id: string): Promise<Menu | null> {
    return prisma.menu.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, title: true },
        },
        children: {
          select: { id: true, title: true, path: true },
          orderBy: { order: "asc" },
        },
      },
    });
  }

  /**
   * Find menu by path
   */
  async findByPath(path: string): Promise<Menu | null> {
    return prisma.menu.findUnique({
      where: { path },
    });
  }

  /**
   * Create new menu
   * Uses transaction to prevent race condition on order assignment
   */
  async create(data: CreateMenuInput): Promise<Menu> {
    return prisma.$transaction(async (tx) => {
      // Get next order within transaction (atomic)
      const lastMenu = await tx.menu.findFirst({
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const nextOrder = (lastMenu?.order ?? 0) + 1;

      // Create menu with guaranteed unique order
      return tx.menu.create({
        data: {
          ...data,
          order: nextOrder,
        },
      });
    });
  }

  /**
   * Update existing menu
   */
  async update(id: string, data: UpdateMenuInput): Promise<Menu> {
    return prisma.menu.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete menu
   */
  async delete(id: string): Promise<Menu> {
    return prisma.menu.delete({
      where: { id },
    });
  }

  /**
   * Get next order number for new menu
   */
  async getNextOrder(): Promise<number> {
    const lastMenu = await prisma.menu.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });
    
    return (lastMenu?.order ?? 0) + 1;
  }

  /**
   * Bulk reorder menus
   */
  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await prisma.$transaction(
      items.map((item) =>
        prisma.menu.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );
  }
}

// Export singleton instance
export const menuRepository = new MenuRepository();
export default menuRepository;
