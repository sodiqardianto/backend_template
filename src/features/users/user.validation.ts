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

/**
 * Bulk delete validation schema
 */
export const bulkDeleteUserSchema = z.object({
  ids: z.array(z.string().uuid("Invalid user ID")).min(1, "At least one ID is required"),
});

export type BulkDeleteUserInput = z.infer<typeof bulkDeleteUserSchema>;

/**
 * List users query validation schema (server-side pagination)
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort: z.string().optional(), // format: "field:asc" or "field:desc"
  search: z.string().optional(), // search by name or email
  isActive: z.enum(["true", "false"]).optional(), // filter by active status
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
