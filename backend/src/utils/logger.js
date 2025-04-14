const winston = require('winston');
const path = require('path');

// Helper to safely stringify objects, including errors and circular references
function safeStringify(obj) {
   const seen = new WeakSet();
   return JSON.stringify(obj, function(key, value) {
       if (typeof value === "object" && value !== null) {
           if (seen.has(value)) return "[Circular]";
           seen.add(value);
       }
       if (value instanceof Error) {
           return {
               message: value.message,
               stack: value.stack,
               name: value.name,
               ...Object.getOwnPropertyNames(value).reduce((acc, prop) => {
                   acc[prop] = value[prop];
                   return acc;
               }, {})
           };
       }
       return value;
   });
}

// Custom formatter to ensure info.message is always a string and handle Error objects at the top level
const ensureStringMessage = winston.format((info) => {
    // If info itself is an Error object (Winston may pass errors this way)
    if (info instanceof Error) {
        const errorObj = {
            message: info.message,
            stack: info.stack,
            name: info.name
        };
        info.message = JSON.stringify(errorObj);
        info.stack = info.stack;
        return info;
    }
    // If info.message is an Error object
    if (info.message instanceof Error) {
        const errorObj = {
            message: info.message.message,
            stack: info.message.stack,
            name: info.message.name
        };
        info.message = JSON.stringify(errorObj);
        info.stack = info.message.stack;
        return info;
    }
    // If info.message is an object (including circular)
    if (typeof info.message === "object") {
        try {
            info.message = safeStringify(info.message);
        } catch (e) {
            info.message = '[Unstringifiable object]';
        }
    }
    // Ensure message is a string
    if (info.message === undefined) {
        info.message = 'undefined';
    }
    return info;
});

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
const env = process.env.NODE_ENV;
let logLevel = process.env.LOG_LEVEL;
if (!logLevel) {
   logLevel = env === "development" ? "debug" : "info";
}
const logger = winston.createLogger({
   levels,
   level: logLevel,
   format: winston.format.combine(
       ensureStringMessage(),
       winston.format.timestamp(),
       winston.format.json()
   ),
   transports: [
       new winston.transports.Console({
           format: winston.format.combine(
               ensureStringMessage(),
               winston.format.colorize(),
               winston.format.simple()
           )
       })
   ]
});

// Add console transport if not in production
// (Already added above; avoid duplicate console transports)

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

// Override the error method to ensure Error objects are properly logged
const originalErrorMethod = logger.error;
logger.error = function(message, ...args) {
    // If message is an Error object, convert it to a structured log entry
    if (message instanceof Error) {
        const errorObj = {
            message: message.message,
            stack: message.stack,
            name: message.name
        };
        message = JSON.stringify(errorObj);
    }
    
    // Call the original error method
    originalErrorMethod.call(this, message, ...args);
};

// Export the logger instance
module.exports = logger;