import type { User } from "@prisma/client";
import { AppError } from "../../shared/errors/app-error.js";
import { mapUserResponse, type UserResponse } from "../../shared/utils/user-mapper.js";
import type { IUserRepository } from "./user.repository.js";
import type { UpdateUserInput } from "./user.validation.js";

export interface IUserService {
  getAllUsers(): Promise<UserResponse[]>;
  getUserById(id: string): Promise<UserResponse>;
  updateUser(id: string, data: UpdateUserInput): Promise<UserResponse>;
  deleteUser(id: string): Promise<UserResponse>;
}

/**
 * User Service - Business logic
 * Single Responsibility: Only handles business logic
 * Dependency Inversion: Depends on repository interface
 */
export class UserService implements IUserService {
  constructor(private readonly repository: IUserRepository) {}

  /**
   * Get all users
   */
  async getAllUsers(): Promise<UserResponse[]> {
    const users = await this.repository.findAll();
    return users.map(mapUserResponse);
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    
    if (!user) {
      throw AppError.notFound("User not found");
    }
    
    return mapUserResponse(user);
  }

  /**
   * Update existing user
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<UserResponse> {
    // Check if user exists
    const existingUser = await this.repository.findById(id);
    
    if (!existingUser) {
      throw AppError.notFound("User not found");
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const userWithEmail = await this.repository.findByEmail(data.email);
      if (userWithEmail) {
        throw AppError.conflict(`User with email "${data.email}" already exists`);
      }
    }

    const updatedUser = await this.repository.update(id, data);
    return mapUserResponse(updatedUser);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<UserResponse> {
    const user = await this.repository.findById(id);
    
    if (!user) {
      throw AppError.notFound("User not found");
    }

    const deletedUser = await this.repository.delete(id);
    return mapUserResponse(deletedUser);
  }
}

// Factory function for dependency injection
export function createUserService(repository: IUserRepository): IUserService {
  return new UserService(repository);
}
