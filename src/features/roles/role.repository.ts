import type { Role } from "@prisma/client";
import prisma from "../../config/database.js";
import type { CreateRoleInput, UpdateRoleInput } from "./role.validation.js";

export interface RoleWithPermissions extends Role {
  permissions: {
    permission: {
      id: string;
      name: string;
    };
  }[];
}

export interface IRoleRepository {
  findAll(): Promise<RoleWithPermissions[]>;
  findById(id: string): Promise<RoleWithPermissions | null>;
  findByName(name: string): Promise<Role | null>;
  create(data: CreateRoleInput): Promise<RoleWithPermissions>;
  update(id: string, data: UpdateRoleInput): Promise<RoleWithPermissions>;
  delete(id: string): Promise<Role>;
  syncPermissions(roleId: string, permissionIds: string[]): Promise<RoleWithPermissions>;
}

/**
 * Role Repository - Database operations
 */
export class RoleRepository implements IRoleRepository {
  /**
   * Get all roles with permissions
   */
  async findAll(): Promise<RoleWithPermissions[]> {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find role by ID with permissions
   */
  async findById(id: string): Promise<RoleWithPermissions | null> {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  /**
   * Create new role with optional permissions
   */
  async create(data: CreateRoleInput): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data;

    return prisma.role.create({
      data: {
        ...roleData,
        permissions: permissionIds?.length
          ? {
              create: permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  /**
   * Update existing role
   */
  async update(id: string, data: UpdateRoleInput): Promise<RoleWithPermissions> {
    const { permissionIds, ...roleData } = data;

    return prisma.$transaction(async (tx) => {
      // Update role data
      await tx.role.update({
        where: { id },
        data: roleData,
      });

      // Sync permissions if provided
      if (permissionIds !== undefined) {
        // Delete existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Create new permissions
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      // Return updated role with permissions
      return tx.role.findUniqueOrThrow({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Delete role
   */
  async delete(id: string): Promise<Role> {
    return prisma.role.delete({
      where: { id },
    });
  }

  /**
   * Sync role permissions (replace all)
   */
  async syncPermissions(roleId: string, permissionIds: string[]): Promise<RoleWithPermissions> {
    return prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new permissions
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }

      // Return updated role
      return tx.role.findUniqueOrThrow({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    });
  }
}

// Export singleton instance
export const roleRepository = new RoleRepository();
export default roleRepository;
