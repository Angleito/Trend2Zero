class MockAppError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.status = this.determineStatus(statusCode);
  }

  determineStatus(statusCode) {
    return statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
  }

  static badRequest(message, details) {
    return new MockAppError(message, 400, details);
  }

  static unauthorized(message, details) {
    return new MockAppError(message, 401, details);
  }

  static forbidden(message, details) {
    return new MockAppError(message, 403, details);
  }

  static notFound(message, details) {
    return new MockAppError(message, 404, details);
  }

  static conflict(message, details) {
    return new MockAppError(message, 409, details);
  }

  static validation(message, details) {
    return new MockAppError(message, 422, details);
  }

  static internal(message, details) {
    return new MockAppError(message, 500, details);
  }

  static serviceUnavailable(message, details) {
    return new MockAppError(message, 503, details);
  }
}

module.exports = MockAppError;