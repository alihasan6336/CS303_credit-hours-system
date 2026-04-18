import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// AppError class for operational errors
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async wrapper to eliminate try/catch in controllers
export const asyncWrap = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global error handler - must be registered last in server.ts
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // MongoDB duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. This ${field} already exists.`,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
    return;
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
    });
    return;
  }

  // JWT invalid
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
    return;
  }

  // Operational error (AppError)
  if ((err as AppError).isOperational) {
    res.status((err as AppError).statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown error
  console.error('UNHANDLED ERROR:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  } else {
    res.status(500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }
};
