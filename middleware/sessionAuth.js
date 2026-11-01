import { SESSION_COOKIE, verifySessionToken } from '../services/session.js';

export const makeAuthMiddleware = (findUser, { requiresSecondFactor = async () => false } = {}) => async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) {
    return res.status(401).json({ message: 'Вы не вошли в систему' });
  }
  try {
    const decoded = verifySessionToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Сессия истекла — войдите заново' });
    }
    const user = await findUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Учётная запись не найдена' });
    }
    if (decoded.mfa !== true && (user.twoFactorEnabled || await requiresSecondFactor(user))) {
      return res.status(401).json({ code: 'MFA_REQUIRED', message: 'Войдите заново с ключом электронной подписи' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Сессия истекла — войдите заново' });
  }
};
