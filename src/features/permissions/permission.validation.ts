import { z } from "zod";

/**
 * Create permission validation schema
 */
export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-z]+(-[a-z]+)*:[a-z]+(-[a-z]+)*$/, "Name must be in format 'resource:action' (e.g., users:create, master-data:view)"),
});

/**
 * Update permission validation schema
 */
export const updatePermissionSchema = createPermissionSchema.partial();

/**
 * ID param validation
 */
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid permission ID"),
});

// Type inference
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
