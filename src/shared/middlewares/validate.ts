import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "../errors/app-error.js";
import { ApiResponse } from "../utils/api-response.js";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Zod validation middleware factory
 * Validates request body, query, and params against provided schemas
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {

      next(error);
    }
  };
}

export default validate;
