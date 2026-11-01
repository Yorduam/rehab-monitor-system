import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const TwoFactorChallenge = sequelize.define('TwoFactorChallenge', {
  id: { type: DataTypes.CHAR(36), primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  purpose: { type: DataTypes.ENUM('login', 'bind'), allowNull: false },
  nonce: { type: DataTypes.CHAR(44), allowNull: false },
  thumbprint: { type: DataTypes.CHAR(40), allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'used', 'failed', 'expired'),
    allowNull: false,
    defaultValue: 'pending'
  },
  failReason: { type: DataTypes.STRING(40), allowNull: true },
  ip: { type: DataTypes.STRING(64), allowNull: true },
  userAgent: { type: DataTypes.STRING(255), allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'TwoFactorChallenges',
  timestamps: false,
  indexes: [
    { name: 'tfc_user_purpose_status', fields: ['userId', 'purpose', 'status'] },
    { name: 'tfc_created', fields: ['createdAt'] },
    { name: 'tfc_status_expires', fields: ['status', 'expiresAt'] }
  ]
});

export default TwoFactorChallenge;
