import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/app-error.js";
import { mapUserResponse, type UserResponse } from "../../shared/utils/user-mapper.js";
import type { IUserRepository, UserWithRoles } from "./user.repository.js";
import type { CreateUserInput, UpdateUserInput } from "./user.validation.js";
import type { IRoleRepository } from "../roles/role.repository.js";

const SALT_ROUNDS = Number(process.env.SALT_ROUNDS || 10);

export interface UserWithRolesResponse extends UserResponse {
  roles: {
    id: string;
    name: string;
    description: string | null;
  }[];
}

export interface IUserService {
  getAllUsers(): Promise<UserWithRolesResponse[]>;
  getUserById(id: string): Promise<UserWithRolesResponse>;
  createUser(data: CreateUserInput): Promise<UserWithRolesResponse>;
  updateUser(id: string, data: UpdateUserInput): Promise<UserWithRolesResponse>;
  deleteUser(id: string): Promise<UserResponse>;
  deleteUsers(ids: string[]): Promise<number>;
  syncRoles(userId: string, roleIds: string[]): Promise<UserWithRolesResponse>;
}

function mapUserWithRoles(user: UserWithRoles): UserWithRolesResponse {
  return {
    ...mapUserResponse(user),
    roles: user.roles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      description: ur.role.description,
    })),
  };
}

/**
 * User Service - Business logic
 */
export class UserService implements IUserService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly roleRepository: IRoleRepository
  ) {}

  /**
   * Get all users with roles
   */
  async getAllUsers(): Promise<UserWithRolesResponse[]> {
    const users = await this.repository.findAll();
    return users.map(mapUserWithRoles);
  }

  /**
   * Get user by ID with roles
   */
  async getUserById(id: string): Promise<UserWithRolesResponse> {
    const user = await this.repository.findById(id);
    
    if (!user) {
      throw AppError.notFound("User not found");
    }
    
    return mapUserWithRoles(user);
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserInput): Promise<UserWithRolesResponse> {
    // Check email uniqueness
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict(`User with email "${data.email}" already exists`);
    }

    // Validate role IDs if provided
    if (data.roleIds?.length) {
      await this.validateRoleIds(data.roleIds);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await this.repository.create(
      {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        isActive: data.isActive,
      },
      data.roleIds || []
    );

    return mapUserWithRoles(user);
  }

  /**
   * Update existing user
   */
  async updateUser(id: string, data: UpdateUserInput): Promise<UserWithRolesResponse> {
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

    // Validate role IDs if provided
    if (data.roleIds?.length) {
      await this.validateRoleIds(data.roleIds);
    }

    // Hash password if provided
    const updateData = { ...data };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }

    const updatedUser = await this.repository.update(id, updateData);
    return mapUserWithRoles(updatedUser);
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

  /**
   * Delete multiple users
   */
  async deleteUsers(ids: string[]): Promise<number> {
    return this.repository.deleteMany(ids);
  }

  /**
   * Sync user roles
   */
  async syncRoles(userId: string, roleIds: string[]): Promise<UserWithRolesResponse> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found");
    }

    if (roleIds.length > 0) {
      await this.validateRoleIds(roleIds);
    }

    const updatedUser = await this.repository.syncRoles(userId, roleIds);
    return mapUserWithRoles(updatedUser);
  }

  /**
   * Validate that all role IDs exist
   */
  private async validateRoleIds(roleIds: string[]): Promise<void> {
    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw AppError.badRequest(`Role with ID "${roleId}" not found`);
      }
    }
  }
}

// Factory function for dependency injection
export function createUserService(
  repository: IUserRepository,
  roleRepository: IRoleRepository
): IUserService {
  return new UserService(repository, roleRepository);
}
