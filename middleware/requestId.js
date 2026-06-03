export const requestId = (req, res, next) => {
  // Устанавливаем requestId, если его ещё нет
  if (!req.requestId) {
    req.requestId = req.headers['x-request-id'] || 'no-id';
  }
  next();
};