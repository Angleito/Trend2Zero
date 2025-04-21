export class AppError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        const errorResponse = {
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
    static badRequest(message, details) {
        return new AppError(message, 400, details);
    }
    static unauthorized(message, details) {
        return new AppError(message, 401, details);
    }
    static forbidden(message, details) {
        return new AppError(message, 403, details);
    }
    static notFound(message, details) {
        return new AppError(message, 404, details);
    }
    static conflict(message, details) {
        return new AppError(message, 409, details);
    }
    static validation(message, details) {
        return new AppError(message, 422, details);
    }
    static internal(message, details) {
        return new AppError(message, 500, details);
    }
    static serviceUnavailable(message, details) {
        return new AppError(message, 503, details);
    }
}
