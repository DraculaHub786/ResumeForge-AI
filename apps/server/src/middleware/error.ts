/**
 * Error handling middleware.
 *
 * Converts thrown errors / rejected promises into consistent JSON responses.
 * In production, internal error details are never leaked to the client.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/index.js';

/** An error with an explicit HTTP status code. */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Not Found',
    message: `No route matches ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod validation errors → 400 with field-level details.
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'The request payload is invalid.',
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.name,
      message: err.message,
      details: err.details,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  const status = typeof (err as { status?: number })?.status === 'number'
    ? (err as { status: number }).status
    : 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : 'Request Error',
    message: status >= 500 && env.NODE_ENV === 'production' ? 'Something went wrong.' : message,
  });
}

/** Wraps an async route handler so rejected promises reach the error handler. */
export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}
