import type { Response } from "@google-cloud/functions-framework/build/src/functions.js";
import { logger } from "./logger.js";

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
  timestamp: string;
  request?: RequestInfo | undefined;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  timestamp: string;
}

/**
 * Send success response
 */
export function sendSuccess(
  res: Response,
  message: string,
  data?: unknown,
  request?: RequestInfo,
  statusCode: number = 200
): void {
  const response: ApiResponse = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    request,
  };

  res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  error: unknown,
  statusCode: number = 500
): void {
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
  };

  logger.error("API Error", { message, error, statusCode });
  res.status(statusCode).json(errorResponse);
}

/**
 * Create request info object
 */
export interface RequestInfo {
  method?: string | undefined;
  url?: string | undefined;
  query?: unknown;
  headers?: Record<string, string | string[] | undefined> | undefined;
}

export function createRequestInfo(
  req: Partial<
    RequestInfo & {
      query?: unknown;
      headers?: Record<string, string | string[] | undefined> | undefined;
    }
  >
): RequestInfo {
  return {
    method: req.method,
    url: req.url,
    query: req.query,
    headers: req.headers,
  };
}
