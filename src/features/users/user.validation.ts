import { z } from "zod";

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  isActive: z.boolean().optional(),
});

/**
 * ID param validation
 */
export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});

// Type inference
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
