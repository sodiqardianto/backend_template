import type { User } from "@prisma/client";

export type UserResponse = Omit<User, "password" | "deletedAt">;

/**
 * Exclude password and sensitive fields from user object
 */
export function mapUserResponse(user: User): UserResponse {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, deletedAt, ...userResponse } = user;
  return userResponse;
}
