import { AppError } from "../../shared/errors/app-error.js";
import type { IRoleRepository, RoleWithPermissions } from "./role.repository.js";
import type { CreateRoleInput, UpdateRoleInput } from "./role.validation.js";
import type { IPermissionRepository } from "../permissions/permission.repository.js";

export interface IRoleService {
  getAllRoles(): Promise<RoleWithPermissions[]>;
  getRoleById(id: string): Promise<RoleWithPermissions>;
  createRole(data: CreateRoleInput): Promise<RoleWithPermissions>;
  updateRole(id: string, data: UpdateRoleInput): Promise<RoleWithPermissions>;
  deleteRole(id: string): Promise<void>;
  deleteRoles(ids: string[]): Promise<number>;
  syncPermissions(roleId: string, permissionIds: string[]): Promise<RoleWithPermissions>;
}

/**
 * Role Service - Business logic
 */
export class RoleService implements IRoleService {
  constructor(
    private readonly repository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository
  ) {}

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<RoleWithPermissions[]> {
    return this.repository.findAll();
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<RoleWithPermissions> {
    const role = await this.repository.findById(id);

    if (!role) {
      throw AppError.notFound("Role not found");
    }

    return role;
  }

  /**
   * Create new role
   */
  async createRole(data: CreateRoleInput): Promise<RoleWithPermissions> {
    // Check if name already exists
    const existing = await this.repository.findByName(data.name);

    if (existing) {
      throw AppError.conflict(`Role "${data.name}" already exists`);
    }

    // Validate permission IDs if provided
    if (data.permissionIds?.length) {
      await this.validatePermissionIds(data.permissionIds);
    }

    return this.repository.create(data);
  }

  /**
   * Update existing role
   */
  async updateRole(id: string, data: UpdateRoleInput): Promise<RoleWithPermissions> {
    const existing = await this.repository.findById(id);

    if (!existing) {
      throw AppError.notFound("Role not found");
    }

    // Check if new name conflicts with another role
    if (data.name && data.name !== existing.name) {
      const roleWithName = await this.repository.findByName(data.name);
      if (roleWithName) {
        throw AppError.conflict(`Role "${data.name}" already exists`);
      }
    }

    // Validate permission IDs if provided
    if (data.permissionIds?.length) {
      await this.validatePermissionIds(data.permissionIds);
    }

    return this.repository.update(id, data);
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.repository.findById(id);

    if (!role) {
      throw AppError.notFound("Role not found");
    }

    await this.repository.delete(id);
  }

  /**
   * Delete multiple roles
   */
  async deleteRoles(ids: string[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }

  /**
   * Sync role permissions
   */
  async syncPermissions(roleId: string, permissionIds: string[]): Promise<RoleWithPermissions> {
    const role = await this.repository.findById(roleId);

    if (!role) {
      throw AppError.notFound("Role not found");
    }

    // Validate permission IDs
    if (permissionIds.length > 0) {
      await this.validatePermissionIds(permissionIds);
    }

    return this.repository.syncPermissions(roleId, permissionIds);
  }

  /**
   * Validate that all permission IDs exist
   */
  private async validatePermissionIds(permissionIds: string[]): Promise<void> {
    for (const permissionId of permissionIds) {
      const permission = await this.permissionRepository.findById(permissionId);
      if (!permission) {
        throw AppError.badRequest(`Permission with ID "${permissionId}" not found`);
      }
    }
  }
}

// Factory function for dependency injection
export function createRoleService(
  repository: IRoleRepository,
  permissionRepository: IPermissionRepository
): IRoleService {
  return new RoleService(repository, permissionRepository);
}
