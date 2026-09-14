import { AppError } from '../exceptions/AppError.js';
import logger from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const isKnown = err instanceof AppError;
  const statusCode = isKnown ? err.statusCode : 500;

  logger.error({
    requestId: req.requestId,
    statusCode,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (!isKnown) {
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера. Сообщите администратору номер запроса.',
      requestId: req.requestId || null
    });
  }

  res.status(statusCode).json({ success: false, message: err.message, requestId: req.requestId || null });
};
