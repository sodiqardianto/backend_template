import express, { type Express } from "express";
import cors from "cors";
import { menuRoutes } from "./features/menus/index.js";
import { authRoutes } from "./features/auth/index.js";
import { errorHandler } from "./shared/middlewares/error-handler.js";
import { apiLimiter } from "./shared/middlewares/rate-limiter.js";

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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use("/api/auth", apiLimiter, authRoutes);
  app.use("/api/menus", apiLimiter, menuRoutes);

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
