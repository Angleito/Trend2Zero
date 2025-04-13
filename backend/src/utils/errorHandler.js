const logger = require('./logger');
const AppError = require('./appError');

class ErrorHandler {
  static handleApiError(error, service, operation) {
    logger.error(`${service} API Error during ${operation}:`, {
      message: error.message,
      stack: error.stack,
      service,
      operation
    });

    if (error.response) {
      logger.error('API Response Error Details:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    return new AppError(
      `Failed to ${operation} in ${service}`,
      error.response?.status || 500
    );
  }

  static handleNetworkError(error, service, operation) {
    logger.error(`${service} Network Error during ${operation}:`, {
      message: error.message,
      stack: error.stack
    });

    return new AppError(
      `Network error occurred while ${operation} in ${service}`,
      503
    );
  }

  static handleValidationError(error) {
    const errors = Object.values(error.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    
    logger.error('Validation Error:', {
      errors,
      originalError: error
    });

    return new AppError(message, 400);
  }

  static handleDuplicateKeyError(error) {
    const duplicatedField = Object.keys(error.keyValue)[0];
    const message = `Duplicate field value: ${duplicatedField}. Please use another value.`;
    
    logger.error('Duplicate Key Error:', {
      field: duplicatedField,
      value: error.keyValue[duplicatedField]
    });

    return new AppError(message, 400);
  }

  static handleCastError(error) {
    const message = `Invalid ${error.path}: ${error.value}`;
    
    logger.error('Cast Error:', {
      path: error.path,
      value: error.value
    });

    return new AppError(message, 400);
  }

  static handleJWTError() {
    logger.error('JWT Authentication Error');
    return new AppError('Invalid token. Please log in again.', 401);
  }

  static handleJWTExpiredError() {
    logger.error('JWT Token Expired Error');
    return new AppError('Your token has expired. Please log in again.', 401);
  }

  static globalErrorHandler(err, req, res, _next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    logger.error('Global Error Handler:', {
      method: req.method,
      path: req.path,
      error: err
    });

    if (process.env.NODE_ENV === 'development') {
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    } else {
      let error = { ...err, message: err.message };

      if (error.name === 'CastError') error = this.handleCastError(error);
      if (error.code === 11000) error = this.handleDuplicateKeyError(error);
      if (error.name === 'ValidationError') error = this.handleValidationError(error);
      if (error.name === 'JsonWebTokenError') error = this.handleJWTError();
      if (error.name === 'TokenExpiredError') error = this.handleJWTExpiredError();

      res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    }
  }
}

module.exports = ErrorHandler;