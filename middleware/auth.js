import User from '../models/User.js';
import { makeAuthMiddleware } from './sessionAuth.js';
import { isTwoFactorRequired } from '../services/twoFactorPolicy.js';

export { makeAuthMiddleware };

export const authMiddleware = makeAuthMiddleware((id) => User.findByPk(id), {
  requiresSecondFactor: isTwoFactorRequired
});

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
