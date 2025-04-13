/**
 * Custom error class for application-specific errors
 * @extends Error
 */
class AppError extends Error {
    /**
     * Creates an AppError instance
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {Object} [details] - Additional error details
     */
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON representation
     * @returns {Object} JSON representation of error
     */
    toJSON() {
        const response = {
            status: this.status,
            statusCode: this.statusCode,
            message: this.message
        };

        if (this.details) {
            response.details = this.details;
        }

        if (process.env.NODE_ENV === 'development') {
            response.stack = this.stack;
        }

        return response;
    }

    /**
     * Create a 400 Bad Request error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static badRequest(message, details) {
        return new AppError(message, 400, details);
    }

    /**
     * Create a 401 Unauthorized error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static unauthorized(message, details) {
        return new AppError(message, 401, details);
    }

    /**
     * Create a 403 Forbidden error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static forbidden(message, details) {
        return new AppError(message, 403, details);
    }

    /**
     * Create a 404 Not Found error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static notFound(message, details) {
        return new AppError(message, 404, details);
    }

    /**
     * Create a 409 Conflict error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static conflict(message, details) {
        return new AppError(message, 409, details);
    }

    /**
     * Create a 422 Validation error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static validation(message, details) {
        return new AppError(message, 422, details);
    }

    /**
     * Create a 500 Internal Server error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static internal(message, details) {
        return new AppError(message, 500, details);
    }

    /**
     * Create a 503 Service Unavailable error
     * @param {string} message - Error message
     * @param {Object} [details] - Additional error details
     * @returns {AppError}
     */
    static serviceUnavailable(message, details) {
        return new AppError(message, 503, details);
    }
}

module.exports = AppError;
