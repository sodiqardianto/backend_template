import { z } from "zod";

/**
 * Create role validation schema
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-z][a-z0-9-]*$/, "Name must be lowercase, start with letter, and contain only letters, numbers, and hyphens"),
  description: z.string().max(255).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

/**
 * Update role validation schema
 */
export const updateRoleSchema = createRoleSchema.partial();

/**
 * ID param validation
 */
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid role ID"),
});

/**
 * Sync permissions validation
 */
export const syncPermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

// Type inference
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SyncPermissionsInput = z.infer<typeof syncPermissionsSchema>;

/**
 * Bulk delete validation schema
 */
export const bulkDeleteRoleSchema = z.object({
  ids: z.array(z.string().uuid("Invalid role ID")).min(1, "At least one ID is required"),
});

export type BulkDeleteRoleInput = z.infer<typeof bulkDeleteRoleSchema>;
