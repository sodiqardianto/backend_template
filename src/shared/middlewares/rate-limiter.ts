import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/api-response.js";
import type { Request, Response } from "express";

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later",
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(res, "Too many requests, please try again later", 429, "TOO_MANY_REQUESTS");
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for login endpoint
 * 5 attempts per 15 minutes
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes",
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(
      res,
      "Too many login attempts, please try again after 15 minutes",
      429,
      "TOO_MANY_LOGIN_ATTEMPTS"
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Rate limiter for registration endpoint
 * 3 attempts per 30 minutes
 */
export const registerLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  message: "Too many registration attempts, please try again later",
  handler: (_req: Request, res: Response) => {
    ApiResponse.error(
      res,
      "Too many registration attempts, please try again later",
      429,
      "TOO_MANY_REGISTER_ATTEMPTS"
    );
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default { apiLimiter, loginLimiter, registerLimiter };
