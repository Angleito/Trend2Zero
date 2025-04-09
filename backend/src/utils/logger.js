const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define level colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define file transport options
const fileOptions = {
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
};

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels,
    format,
    transports: [
        // Write all logs with level 'error' and below to error.log
        new winston.transports.File({
            ...fileOptions,
            filename: path.join('logs', 'error.log'),
            level: 'error'
        }),
        // Write all logs with level 'info' and below to combined.log
        new winston.transports.File({
            ...fileOptions,
            filename: path.join('logs', 'combined.log')
        })
    ]
});

// Add console transport if not in production
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Create a stream object for Morgan middleware
logger.stream = {
    write: (message) => logger.http(message.trim())
};

// Add convenience methods for common log patterns
logger.logError = (err, req = null) => {
    const logMessage = {
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    };

    if (req) {
        logMessage.method = req.method;
        logMessage.url = req.url;
        logMessage.headers = req.headers;
        logMessage.body = req.body;
    }

    logger.error(JSON.stringify(logMessage));
};

logger.logAPIRequest = (req, res) => {
    logger.info(JSON.stringify({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        responseTime: res.get('X-Response-Time'),
        timestamp: new Date().toISOString()
    }));
};

logger.logPerformance = (label, duration) => {
    logger.debug(JSON.stringify({
        label,
        duration,
        timestamp: new Date().toISOString()
    }));
};

// Export the logger instance
module.exports = logger;