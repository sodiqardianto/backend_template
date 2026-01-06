import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validate } from "../../shared/middlewares/validate.js";
import { loginLimiter, registerLimiter } from "../../shared/middlewares/rate-limiter.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "./auth.validation.js";

const router = Router();

/**
 * Auth Routes
 *
 * POST /api/auth/register  - Register new user
 * POST /api/auth/login     - Login user
 * POST /api/auth/refresh   - Refresh access token
 * POST /api/auth/logout    - Logout user
 */

// Register (rate limited: 5 per 30 minutes)
router.post(
  "/register",
  registerLimiter,
  validate({ body: registerSchema }),
  authController.register
);

// Login (rate limited: 5 per 15 minutes)
router.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  authController.login
);

// Refresh token
router.post(
  "/refresh",
  validate({ body: refreshTokenSchema }),
  authController.refresh
);

// Logout
router.post(
  "/logout",
  validate({ body: refreshTokenSchema }),
  authController.logout
);

export { router as authRoutes };
export default router;

