const AppError = require('../../utils/appError');

describe('AppError', () => {
    describe('Constructor', () => {
        it('should create error with default status code', () => {
            const error = new AppError('Test error');
            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.status).toBe('error');
            expect(error.isOperational).toBe(true);
            expect(error.stack).toBeDefined();
        });

        it('should create error with custom status code', () => {
            const error = new AppError('Test error', 400);
            expect(error.statusCode).toBe(400);
            expect(error.status).toBe('fail');
        });

        it('should create error with details', () => {
            const details = { field: 'test', code: 'invalid' };
            const error = new AppError('Test error', 400, details);
            expect(error.details).toEqual(details);
        });
    });

    describe('toJSON', () => {
        const originalEnv = process.env.NODE_ENV;

        afterEach(() => {
            process.env.NODE_ENV = originalEnv;
        });

        it('should return error response object in production', () => {
            process.env.NODE_ENV = 'production';
            const error = new AppError('Test error', 400, { field: 'test' });
            const response = error.toJSON();

            expect(response).toEqual({
                status: 'fail',
                statusCode: 400,
                message: 'Test error',
                details: { field: 'test' }
            });
            expect(response.stack).toBeUndefined();
        });

        it('should include stack trace in development', () => {
            process.env.NODE_ENV = 'development';
            const error = new AppError('Test error');
            const response = error.toJSON();

            expect(response.stack).toBeDefined();
        });

        it('should omit details if not provided', () => {
            const error = new AppError('Test error');
            const response = error.toJSON();

            expect(response.details).toBeUndefined();
        });
    });

    describe('Static Factory Methods', () => {
        it('should create bad request error', () => {
            const error = AppError.badRequest('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid input');
        });

        it('should create unauthorized error', () => {
            const error = AppError.unauthorized('Not authenticated');
            expect(error.statusCode).toBe(401);
            expect(error.message).toBe('Not authenticated');
        });

        it('should create forbidden error', () => {
            const error = AppError.forbidden('Not allowed');
            expect(error.statusCode).toBe(403);
            expect(error.message).toBe('Not allowed');
        });

        it('should create not found error', () => {
            const error = AppError.notFound('Resource not found');
            expect(error.statusCode).toBe(404);
            expect(error.message).toBe('Resource not found');
        });

        it('should create conflict error', () => {
            const error = AppError.conflict('Resource exists');
            expect(error.statusCode).toBe(409);
            expect(error.message).toBe('Resource exists');
        });

        it('should create validation error', () => {
            const error = AppError.validation('Invalid data');
            expect(error.statusCode).toBe(422);
            expect(error.message).toBe('Invalid data');
        });

        it('should create internal error', () => {
            const error = AppError.internal('Server error');
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Server error');
        });

        it('should create service unavailable error', () => {
            const error = AppError.serviceUnavailable('Service down');
            expect(error.statusCode).toBe(503);
            expect(error.message).toBe('Service down');
        });

        it('should include details in factory methods', () => {
            const details = { field: 'test' };
            const error = AppError.badRequest('Invalid input', details);
            expect(error.details).toEqual(details);
        });
    });

    describe('Error Inheritance', () => {
        it('should be instance of Error', () => {
            const error = new AppError('Test error');
            expect(error).toBeInstanceOf(Error);
        });

        it('should be instance of AppError', () => {
            const error = new AppError('Test error');
            expect(error).toBeInstanceOf(AppError);
        });

        it('should have correct name property', () => {
            const error = new AppError('Test error');
            expect(error.name).toBe('Error');
        });
    });

    describe('Error Status', () => {
        it('should set fail status for 4xx errors', () => {
            const clientErrors = [400, 401, 403, 404, 422, 429];
            clientErrors.forEach(code => {
                const error = new AppError('Test error', code);
                expect(error.status).toBe('fail');
            });
        });

        it('should set error status for 5xx errors', () => {
            const serverErrors = [500, 502, 503, 504];
            serverErrors.forEach(code => {
                const error = new AppError('Test error', code);
                expect(error.status).toBe('error');
            });
        });
    });
});