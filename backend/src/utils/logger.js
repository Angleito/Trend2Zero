import winston from 'winston';
import path from 'path';
import fs from 'fs';
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, errors } = format;
// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${stack || ''} ${metaStr}`;
});
// Define log directory
const logDir = path.join(process.cwd(), 'logs');
// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
// Create logger instance
const logger = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    transports: [
        // Console transport with colors for development
        new transports.Console({
            format: combine(colorize(), logFormat)
        }),
        // File transport for errors
        new transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // File transport for all logs
        new transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ],
    exceptionHandlers: [
        new transports.File({
            filename: path.join(logDir, 'exceptions.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ],
    rejectionHandlers: [
        new transports.File({
            filename: path.join(logDir, 'rejections.log'),
            maxsize: 5242880,
            maxFiles: 5
        })
    ]
});
export default logger;
