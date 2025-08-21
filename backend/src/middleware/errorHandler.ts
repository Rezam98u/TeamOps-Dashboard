import { Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
	err: AppError | ZodError | Error,
	req: Request,
	res: Response
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = null;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.issues.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    }));
  }
  // Handle custom operational errors
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Handle other known errors
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if ((err as unknown as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value';
  }

  // Log error in development
  if (process.env['NODE_ENV'] === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
    });
  }

  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (details) {
    response['details'] = details;
  }

  if (process.env['NODE_ENV'] === 'development' && err.stack) {
    response['stack'] = err.stack;
  }

  res.status(statusCode).json(response);
};
