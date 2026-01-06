import type { User } from "@prisma/client";
import prisma from "../../config/database.js";
import type { UpdateUserInput } from "./user.validation.js";

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<User>;
}

/**
 * User Repository - Database operations
 * Single Responsibility: Only handles database operations
 */
export class UserRepository implements IUserRepository {
  /**
   * Get all active users
   */
  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      where: { deletedAt: null },
    });
  }

  /**
   * Find active user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { 
        id,
        deletedAt: null 
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
   * Update existing user
   */
  async update(id: string, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
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
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;


