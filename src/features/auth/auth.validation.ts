import { z } from "zod";

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters"),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(1, "Password is required"),
});

/**
 * Refresh token validation schema
 * Optional since token can come from httpOnly cookie
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required")
    .optional(),
});

/**
 * Logout validation schema
 * Allow empty body since token comes from httpOnly cookie
 */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

// Type inference
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;

