import type { Prisma, User } from "@prisma/client";
import prisma from "../../config/database.js";
import type { CreateUserInput, UpdateUserInput } from "./user.validation.js";

export interface UserWithRoles extends User {
  roles: {
    roleId: string;
    assignedAt: Date;
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Options for paginated query
 */
export interface FindAllPaginatedOptions {
  page: number;
  limit: number;
  sort?: { field: string; order: "asc" | "desc" };
  search?: string;
  isActive?: boolean;
}

export interface IUserRepository {
  findAll(): Promise<UserWithRoles[]>;
  findAllPaginated(options: FindAllPaginatedOptions): Promise<PaginatedResult<UserWithRoles>>;
  findById(id: string): Promise<UserWithRoles | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<CreateUserInput, "roleIds"> & { password: string }, roleIds: string[]): Promise<UserWithRoles>;
  update(id: string, data: UpdateUserInput): Promise<UserWithRoles>;
  delete(id: string): Promise<User>;
  deleteMany(ids: string[]): Promise<number>;
  syncRoles(userId: string, roleIds: string[]): Promise<UserWithRoles>;
}

/**
 * User Repository - Database operations
 */
export class UserRepository implements IUserRepository {
  /**
   * Get all active users with roles
   */
  async findAll(): Promise<UserWithRoles[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
    });
  }

  /**
   * Get all active users with pagination, sorting, and filtering
   */
  async findAllPaginated(options: FindAllPaginatedOptions): Promise<PaginatedResult<UserWithRoles>> {
    const { page, limit, sort, search, isActive } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // Search filter (name or email)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Active status filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy - support nested sorting for roles count or direct fields
    const validSortFields = ["name", "email", "createdAt", "isActive"];
    let orderBy: Prisma.UserOrderByWithRelationInput = { createdAt: "desc" };
    
    if (sort && validSortFields.includes(sort.field)) {
      orderBy = { [sort.field]: sort.order };
    }

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          roles: {
            include: {
              role: {
                select: { id: true, name: true, description: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find active user by ID with roles
   */
  async findById(id: string): Promise<UserWithRoles | null> {
    return prisma.user.findFirst({
      where: { 
        id,
        deletedAt: null 
      },
      include: {
        roles: {
          include: {
            role: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
    });
  }

  /**
   * Find active user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { 
        email,
        deletedAt: null 
      },
    });
  }

  /**
   * Create new user with optional roles
   */
  async create(
    data: Omit<CreateUserInput, "roleIds"> & { password: string },
    roleIds: string[]
  ): Promise<UserWithRoles> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: data.password,
          isActive: data.isActive ?? true,
        },
      });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          roles: {
            include: {
              role: {
                select: { id: true, name: true, description: true },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Update existing user with optional role sync
   */
  async update(id: string, data: UpdateUserInput): Promise<UserWithRoles> {
    const { roleIds, ...userData } = data;

    return prisma.$transaction(async (tx) => {
      // Update user data
      await tx.user.update({
        where: { id },
        data: userData,
      });

      // Sync roles if provided
      if (roleIds !== undefined) {
        await tx.userRole.deleteMany({
          where: { userId: id },
        });

        if (roleIds.length > 0) {
          await tx.userRole.createMany({
            data: roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          });
        }
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: {
          roles: {
            include: {
              role: {
                select: { id: true, name: true, description: true },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Soft delete user
   */
  async delete(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Soft delete multiple users
   */
  async deleteMany(ids: string[]): Promise<number> {
    const result = await prisma.user.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }

  /**
   * Sync user roles (replace all)
   */
  async syncRoles(userId: string, roleIds: string[]): Promise<UserWithRoles> {
    return prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: { userId },
      });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId,
            roleId,
          })),
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                select: { id: true, name: true, description: true },
              },
            },
          },
        },
      });
    });
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;
