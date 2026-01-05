import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { ApiResponse } from "../utils/api-response.js";

/**
 * Global error handler middleware
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    ApiResponse.error(res, "Validation failed", 422, "VALIDATION_ERROR", details);
    return;
  }

  // Log error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    ApiResponse.error(res, err.message, err.statusCode, err.code);
    return;
  }

  // Handle Prisma errors
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
    
    if (prismaError.code === "P2002") {
      const field = prismaError.meta?.target?.[0] || "field";
      ApiResponse.error(res, `${field} already exists`, 409, "CONFLICT");
      return;
    }
    
    if (prismaError.code === "P2025") {
      ApiResponse.error(res, "Record not found", 404, "NOT_FOUND");
      return;
    }
  }

  // Handle unknown errors
  ApiResponse.error(
    res,
    process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err.message,
    500,
    "INTERNAL_ERROR"
  );
};

export default errorHandler;
