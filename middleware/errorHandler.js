import { AppError } from '../exceptions/AppError.js';
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error({
    requestId: req.requestId,
    statusCode,
    message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(statusCode).json({ success: false, message });
};