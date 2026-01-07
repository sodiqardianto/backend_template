import type { Permission } from "@prisma/client";
import prisma from "../../config/database.js";
import type { CreatePermissionInput, UpdatePermissionInput } from "./permission.validation.js";

export interface IPermissionRepository {
  findAll(): Promise<Permission[]>;
  findById(id: string): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  create(data: CreatePermissionInput): Promise<Permission>;
  update(id: string, data: UpdatePermissionInput): Promise<Permission>;
  delete(id: string): Promise<Permission>;
}

/**
 * Permission Repository - Database operations
 */
export class PermissionRepository implements IPermissionRepository {
  /**
   * Get all permissions ordered by name
   */
  async findAll(): Promise<Permission[]> {
    return prisma.permission.findMany({
      orderBy: { name: "asc" },
    });
  }

  /**
   * Find permission by ID
   */
  async findById(id: string): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { id },
    });
  }

  /**
   * Find permission by name
   */
  async findByName(name: string): Promise<Permission | null> {
    return prisma.permission.findUnique({
      where: { name },
    });
  }

  /**
   * Create new permission
   */
  async create(data: CreatePermissionInput): Promise<Permission> {
    return prisma.permission.create({
      data,
    });
  }

  /**
   * Update existing permission
   */
  async update(id: string, data: UpdatePermissionInput): Promise<Permission> {
    return prisma.permission.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete permission
   */
  async delete(id: string): Promise<Permission> {
    return prisma.permission.delete({
      where: { id },
    });
  }
}

// Export singleton instance
export const permissionRepository = new PermissionRepository();
export default permissionRepository;
