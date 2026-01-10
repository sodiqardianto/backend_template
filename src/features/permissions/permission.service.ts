import type { Permission } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import type { IPermissionRepository } from "./permission.repository.js";
import type { CreatePermissionInput, UpdatePermissionInput } from "./permission.validation.js";

export interface IPermissionService {
  getAllPermissions(): Promise<Permission[]>;
  getPermissionById(id: string): Promise<Permission>;
  createPermission(data: CreatePermissionInput): Promise<Permission>;
  updatePermission(id: string, data: UpdatePermissionInput): Promise<Permission>;
  deletePermission(id: string): Promise<Permission>;
  deletePermissions(ids: string[]): Promise<number>;
}

/**
 * Permission Service - Business logic
 */
export class PermissionService implements IPermissionService {
  constructor(private readonly repository: IPermissionRepository) {}

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return this.repository.findAll();
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission> {
    const permission = await this.repository.findById(id);

    if (!permission) {
      throw AppError.notFound("Permission not found");
    }

    return permission;
  }

  /**
   * Create new permission
   */
  async createPermission(data: CreatePermissionInput): Promise<Permission> {
    // Check if name already exists
    const existing = await this.repository.findByName(data.name);

    if (existing) {
      throw AppError.conflict(`Permission "${data.name}" already exists`);
    }

    return this.repository.create(data);
  }

  /**
   * Update existing permission
   */
  async updatePermission(id: string, data: UpdatePermissionInput): Promise<Permission> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw AppError.notFound("Permission not found");
    }

    // Check if new name conflicts with another permission
    if (data.name && data.name !== existing.name) {
      const permissionWithName = await this.repository.findByName(data.name);
      if (permissionWithName) {
        throw AppError.conflict(`Permission "${data.name}" already exists`);
      }
    }

    return this.repository.update(id, data);
  }

  /**
   * Delete permission
   */
  async deletePermission(id: string): Promise<Permission> {
    const permission = await this.repository.findById(id);

    if (!permission) {
      throw AppError.notFound("Permission not found");
    }

    return this.repository.delete(id);
  }

  /**
   * Delete multiple permissions
   */
  async deletePermissions(ids: string[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }
}

// Factory function for dependency injection
export function createPermissionService(repository: IPermissionRepository): IPermissionService {
  return new PermissionService(repository);
}
