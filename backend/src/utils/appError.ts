export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    const errorResponse: Record<string, unknown> = {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message
    };

    if (this.details) {
      errorResponse.details = this.details;
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = this.stack;
    }

    return errorResponse;
  }

  // Factory methods for common error types
  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 400, details);
  }

  static unauthorized(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 401, details);
  }

  static forbidden(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 403, details);
  }

  static notFound(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 404, details);
  }

  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 409, details);
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 422, details);
  }

  static internal(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 500, details);
  }

  static serviceUnavailable(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, 503, details);
  }
}