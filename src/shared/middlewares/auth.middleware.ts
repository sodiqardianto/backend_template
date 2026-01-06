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
 * Auth Middleware - Protects routes that require authentication
 * Verifies JWT token from Authorization header
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw AppError.unauthorized("No token provided");
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw AppError.unauthorized("Token format invalid. Use: Bearer <token>");
  }

  const token = parts[1];

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
