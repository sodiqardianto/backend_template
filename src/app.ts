import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { menuRoutes } from "./features/menus/index.js";
import { authRoutes } from "./features/auth/index.js";
import { userRoutes } from "./features/users/index.js";
import { permissionRoutes } from "./features/permissions/index.js";
import { roleRoutes } from "./features/roles/index.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";
import { apiLimiter } from "./shared/middlewares/rate-limiter.js";
import { authMiddleware } from "./shared/middlewares/auth.middleware.js";

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://localhost:3010",
      "http://localhost:8080"
    ],
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use("/api/auth", apiLimiter, authRoutes);
  app.use("/api/menus", apiLimiter, authMiddleware, menuRoutes);
  app.use("/api/users", apiLimiter, authMiddleware, userRoutes);
  app.use("/api/permissions", apiLimiter, authMiddleware, permissionRoutes);
  app.use("/api/roles", apiLimiter, authMiddleware, roleRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found",
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
