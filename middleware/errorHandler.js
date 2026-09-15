import { AppError } from '../exceptions/AppError.js';
import logger from '../config/logger.js';

const BODY_ERRORS = new Map([
  ['entity.too.large', {
    statusCode: 413,
    message: 'Слишком большой объём данных в одном запросе. Загрузите файлы по одному или уменьшите их размер.'
  }],
  ['entity.parse.failed', {
    statusCode: 400,
    message: 'Запрос повреждён и не может быть прочитан. Обновите страницу и повторите действие.'
  }]
]);

export const errorHandler = (err, req, res, next) => {
  const isKnown = err instanceof AppError;
  const bodyError = BODY_ERRORS.get(err?.type);
  const statusCode = isKnown ? err.statusCode : bodyError ? bodyError.statusCode : 500;

  logger.error({
    requestId: req.requestId,
    statusCode,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  if (bodyError) {
    return res.status(statusCode).json({ success: false, message: bodyError.message, requestId: req.requestId || null });
  }

  if (!isKnown) {
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера. Сообщите администратору номер запроса.',
      requestId: req.requestId || null
    });
  }

  res.status(statusCode).json({ success: false, message: err.message, requestId: req.requestId || null });
};
