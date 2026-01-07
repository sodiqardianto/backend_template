import { z } from "zod";

/**
 * Create user validation schema
 */
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isActive: z.boolean().optional().default(true),
  roleIds: z.array(z.string().uuid()).optional().default([]),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
});

/**
 * ID param validation
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

/**
 * Sync roles validation
 */
export const syncRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

// Type inference
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SyncRolesInput = z.infer<typeof syncRolesSchema>;
