import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/app-error.js";

const JWT_SECRET = process.env.JWT_SECRET || "";

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Extract token from request
 * Priority: 1. Cookie (browser) 2. Authorization header (Postman/mobile)
 */
function extractToken(req: Request): string | null {
  // 1. Try cookie first (for browser clients)
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }

  // 2. Fall back to Authorization header (for Postman/mobile)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      return parts[1];
    }
  }

  return null;
}

/**
 * Auth Middleware - Protects routes that require authentication
 * Verifies JWT token from cookie or Authorization header
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    throw AppError.unauthorized("No token provided");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized("Invalid token");
    }
    throw AppError.unauthorized("Token verification failed");
  }
}

export default authMiddleware;

