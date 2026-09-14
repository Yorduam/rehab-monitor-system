
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ message: 'Вы не вошли в систему' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Учётная запись не найдена' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Сессия истекла — войдите заново' });
  }
};

export const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Вы не вошли в систему' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'У вашей роли нет доступа к этому разделу' });
    }
    next();
  };
};

export const STAFF_ROLES = ['admin', 'employee', 'teacher'];

export const staffOnly = roleMiddleware(...STAFF_ROLES);
