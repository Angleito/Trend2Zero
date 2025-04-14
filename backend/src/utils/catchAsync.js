const logger = require('./logger');
const AppError = require('./appError');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');

/**
 * Wraps an async function to catch any errors and pass them to Express error handling middleware
 * @param {Function} fn - The async function to wrap
 * @returns {Function} Express middleware function
 */
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(error => {
            // Log error details
            logger.error('Request Error:', {
                path: req.path,
                method: req.method,
                error: error.message,
                stack: error.stack
            });

            // If it's already an AppError, pass it through
            if (error instanceof AppError) {
                return next(error);
            }

            // Transform known error types
            let transformedError;

            if (error.name === 'ValidationError') {
                transformedError = new AppError('Validation failed', 422);
            } else if (error.name === 'CastError') {
                transformedError = new AppError(`Invalid id: ${error.value}`, 400);
            } else if (error.code === 11000) { // MongoDB duplicate key error
                if (error.keyValue) {
                  transformedError = new AppError(`Duplicate field value: ${Object.keys(error.keyValue)[0]}`, 409);
                } else {
                  transformedError = new AppError('Duplicate field error occurred', 409);
                }
            } else if (error instanceof JsonWebTokenError) {
                transformedError = new AppError('Invalid token', 401);
            } else if (error instanceof TokenExpiredError) {
                transformedError = new AppError('Token expired', 401);
            } else {
                transformedError = new AppError('Something went wrong', 500);
            }

            // Add error details in development mode
            if (process.env.NODE_ENV === 'development') {
                transformedError.details = {
                    originalError: {
                        message: error.message,
                        name: error.name,
                        stack: error.stack
                    }
                };
            }

            next(transformedError);
        });
    };
};
