const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const logger = require('../../utils/logger');

jest.mock('../../utils/logger');

describe('catchAsync Utility', () => {
    let mockReq;
    let mockRes;
    let mockNext;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        mockReq = {
            path: '/test',
            method: 'GET'
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('Successful Execution', () => {
        it('should execute the wrapped function successfully', async () => {
            const successFn = async (req, res) => {
                res.status(200).json({ success: true });
            };
            const wrappedFn = catchAsync(successFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ success: true });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should pass AppError directly to next', async () => {
            const appError = new AppError('Test error', 400);
            const errorFn = async () => {
                throw appError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(appError);
            expect(logger.error).toHaveBeenCalled();
        });

        it('should handle ValidationError', async () => {
            const validationError = new Error('Validation failed');
            validationError.name = 'ValidationError';
            validationError.errors = { field: 'Invalid value' };

            const errorFn = async () => {
                throw validationError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 422,
                    message: 'Validation failed'
                })
            );
        });

        it('should handle CastError', async () => {
            const castError = new Error('Cast failed');
            castError.name = 'CastError';
            castError.path = 'id';
            castError.value = 'invalid';

            const errorFn = async () => {
                throw castError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 400,
                    message: 'Invalid id: invalid'
                })
            );
        });

        it('should handle duplicate key error', async () => {
            const duplicateError = new Error('Duplicate key');
            duplicateError.code = 11000;
            duplicateError.keyPattern = { email: 1 };

            const errorFn = async () => {
                throw duplicateError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 409,
                    message: 'Duplicate field value: email'
                })
            );
        });

        it('should handle JWT errors', async () => {
            const jwtError = new Error('Invalid token');
            jwtError.name = 'JsonWebTokenError';

            const errorFn = async () => {
                throw jwtError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    message: 'Invalid token'
                })
            );
        });

        it('should handle expired token error', async () => {
            const tokenError = new Error('Token expired');
            tokenError.name = 'TokenExpiredError';

            const errorFn = async () => {
                throw tokenError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 401,
                    message: 'Token expired'
                })
            );
        });

        it('should handle unknown errors', async () => {
            const unknownError = new Error('Unknown error');

            const errorFn = async () => {
                throw unknownError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 500,
                    message: 'Something went wrong'
                })
            );
        });
    });

    describe('Development Mode', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'development';
        });

        it('should include original error details in development', async () => {
            const originalError = new Error('Original error');
            const errorFn = async () => {
                throw originalError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: {
                        originalError: {
                            name: 'Error',
                            message: 'Original error',
                            stack: expect.any(String)
                        }
                    }
                })
            );
        });
    });

    describe('Production Mode', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
        });

        it('should not include original error details in production', async () => {
            const originalError = new Error('Original error');
            const errorFn = async () => {
                throw originalError;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            const calledError = mockNext.mock.calls[0][0];
            expect(calledError.details).toBeUndefined();
        });
    });

    describe('Logging', () => {
        it('should log error details', async () => {
            const error = new Error('Test error');
            const errorFn = async () => {
                throw error;
            };
            const wrappedFn = catchAsync(errorFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(logger.error).toHaveBeenCalledWith('Request Error:', {
                path: '/test',
                method: 'GET',
                error: 'Test error',
                stack: expect.any(String)
            });
        });
    });
});