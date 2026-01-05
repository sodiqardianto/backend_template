import { z } from "zod";

/**
 * Create menu validation schema
 */
export const createMenuSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  path: z
    .string()
    .min(1, "Path is required")
    .regex(/^\//, "Path must start with /")
    .max(200, "Path must be less than 200 characters"),
  icon: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  permission: z.string().optional(),
  isActive: z.boolean().default(true),
});

/**
 * Update menu validation schema (all fields optional except partial)
 */
export const updateMenuSchema = createMenuSchema.partial();

/**
 * ID param validation
 */
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid menu ID"),
});

/**
 * Reorder request validation
 */
export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
});

// Type inference
export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type ReorderInput = z.infer<typeof reorderSchema>;
