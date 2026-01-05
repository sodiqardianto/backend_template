import type { Response } from "express";

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
}

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface PaginatedResponse<T> extends SuccessResponse<T> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Standardized API Response Utility
 */
export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(
    res: Response,
    data: T,
    message = "Success",
    statusCode = 200
  ): Response<SuccessResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Created response (201)
   */
  static created<T>(
    res: Response,
    data: T,
    message = "Created successfully"
  ): Response<SuccessResponse<T>> {
    return this.success(res, data, message, 201);
  }

  /**
   * No content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  /**
   * Error response
   */
  static error(
    res: Response,
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details: unknown = null
  ): Response<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (details) {
      response.error.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Paginated response
   */
  static paginated<T>(
    res: Response,
    data: T,
    pagination: PaginationInfo,
    message = "Success"
  ): Response<PaginatedResponse<T>> {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.pageSize),
      },
    });
  }
}

export default ApiResponse;
