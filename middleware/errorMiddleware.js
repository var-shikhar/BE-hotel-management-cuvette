/*
|--------------------------------------------------------------------------
| Custom Error Class & Error Middleware
|--------------------------------------------------------------------------
|
| This file defines a custom error class (`CustomError`) for consistent error handling,
| and an `errorMiddleware` to log and respond to errors in a centralized way.
|
| - `CustomError`: Extends the native `Error` class to include a `statusCode` property.
| - `errorMiddleware`: Catches errors, logs them using Winston (to both console and file),
|   and responds with the error message and status code.
| - Logs are stored in the `logs` directory (created if not present), with different log files
|   for general logs, errors, and daily logs.
|
| Winston is used for logging, ensuring structured and persistent error tracking.
|
*/

import fs from 'fs';
import path from 'path';
import winston from 'winston';
import { fileURLToPath } from 'url';

// Custom Error Class
export class CustomError extends Error {
    statusCode;

    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, CustomError.prototype);
    }
}

// Create a log directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Create a Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({ format: winston.format.simple() }),
        new winston.transports.File({
            filename: path.join(logDirectory, 'combined.log'),
            level: 'info',
        }),
        new winston.transports.File({
            filename: path.join(logDirectory, 'error.log'),
            level: 'error',
        }),
        new winston.transports.File({
            // Use dynamic file name with the current date
            filename: path.join(logDirectory, `${new Date().toISOString().split('T')[0]}.log`),
            level: 'info',
        }),
    ],
});

const errorMiddleware = (err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const errorDetails = {
        timestamp: timestamp,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        status: statusCode,
        message: message,
        stack: err.stack,
    };

    // Log error details to file using Winston
    logger.error(errorDetails);
    console.error(errorDetails);

    if (statusCode === 440) {
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
    }

    res.status(statusCode).json({ message: message });
};

export default errorMiddleware;