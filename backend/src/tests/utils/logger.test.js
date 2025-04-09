const winston = require('winston');
const logger = require('../../utils/logger');

describe('Logger Utility', () => {
    let consoleOutput = [];
    const originalEnv = process.env.NODE_ENV;

    // Mock console output
    beforeEach(() => {
        consoleOutput = [];
        const mockTransport = new winston.transports.Console({
            format: winston.format.printf(info => {
                consoleOutput.push(info);
                return info.message;
            })
        });

        logger.clear(); // Clear existing transports
        logger.add(mockTransport);
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('Log Levels', () => {
        it('should have correct log levels', () => {
            expect(logger.levels).toEqual({
                error: 0,
                warn: 1,
                info: 2,
                debug: 3
            });
        });

        it('should log at error level', () => {
            logger.error('test error message');
            expect(consoleOutput[0].level).toBe('error');
            expect(consoleOutput[0].message).toBe('test error message');
        });

        it('should log at warn level', () => {
            logger.warn('test warning message');
            expect(consoleOutput[0].level).toBe('warn');
            expect(consoleOutput[0].message).toBe('test warning message');
        });

        it('should log at info level', () => {
            logger.info('test info message');
            expect(consoleOutput[0].level).toBe('info');
            expect(consoleOutput[0].message).toBe('test info message');
        });

        it('should log at debug level', () => {
            logger.debug('test debug message');
            expect(consoleOutput[0].level).toBe('debug');
            expect(consoleOutput[0].message).toBe('test debug message');
        });
    });

    describe('Environment Configuration', () => {
        it('should set debug level in development', () => {
            process.env.NODE_ENV = 'development';
            const devLogger = require('../../utils/logger');
            expect(devLogger.level).toBe('debug');
        });

        it('should set info level in production', () => {
            process.env.NODE_ENV = 'production';
            const prodLogger = require('../../utils/logger');
            expect(prodLogger.level).toBe('info');
        });
    });

    describe('Morgan Stream', () => {
        it('should have a stream for Morgan integration', () => {
            expect(logger.stream).toBeDefined();
            expect(typeof logger.stream.write).toBe('function');
        });

        it('should log Morgan messages at info level', () => {
            logger.stream.write('test morgan message\n');
            expect(consoleOutput[0].level).toBe('info');
            expect(consoleOutput[0].message).toBe('test morgan message');
        });
    });

    describe('Error Handling', () => {
        it('should handle Error objects', () => {
            const error = new Error('test error');
            logger.error(error);
            expect(consoleOutput[0].level).toBe('error');
            expect(consoleOutput[0].message).toContain('test error');
        });

        it('should handle objects with circular references', () => {
            const circularObj = { a: 1 };
            circularObj.self = circularObj;
            logger.info(circularObj);
            expect(consoleOutput[0].level).toBe('info');
            expect(consoleOutput[0].message).toBeDefined();
        });
    });

    describe('Production Configuration', () => {
        beforeEach(() => {
            process.env.NODE_ENV = 'production';
            jest.resetModules();
        });

        it('should create file transports in production', () => {
            const prodLogger = require('../../utils/logger');
            const fileTransports = prodLogger.transports.filter(
                t => t instanceof winston.transports.File
            );
            expect(fileTransports).toHaveLength(2);
        });

        it('should configure error log file correctly', () => {
            const prodLogger = require('../../utils/logger');
            const errorTransport = prodLogger.transports.find(
                t => t instanceof winston.transports.File && t.level === 'error'
            );
            expect(errorTransport).toBeDefined();
            expect(errorTransport.filename).toBe('logs/error.log');
        });

        it('should configure combined log file correctly', () => {
            const prodLogger = require('../../utils/logger');
            const combinedTransport = prodLogger.transports.find(
                t => t instanceof winston.transports.File && !t.level
            );
            expect(combinedTransport).toBeDefined();
            expect(combinedTransport.filename).toBe('logs/combined.log');
        });
    });

    describe('Format', () => {
        it('should include timestamp in log messages', () => {
            logger.info('test message');
            expect(consoleOutput[0].timestamp).toBeDefined();
        });

        it('should format errors with stack traces', () => {
            const error = new Error('test error');
            logger.error(error);
            expect(consoleOutput[0].message).toContain('test error');
            expect(consoleOutput[0].stack).toBeDefined();
        });
    });
});