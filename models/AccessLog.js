import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const AccessLog = sequelize.define('AccessLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  userId: { type: DataTypes.INTEGER, allowNull: true },
  userRole: { type: DataTypes.STRING(32), allowNull: true },

  recipientId: { type: DataTypes.INTEGER, allowNull: true },

  category: {
    type: DataTypes.ENUM('passport', 'scans', 'contacts', 'medical'),
    allowNull: false
  },

  action: {
    type: DataTypes.ENUM('view', 'download', 'denied'),
    allowNull: false
  },

  reasonCode: { type: DataTypes.STRING(64), allowNull: true },
  reasonText: { type: DataTypes.STRING(500), allowNull: true },

  scanId: { type: DataTypes.INTEGER, allowNull: true },

  ip: { type: DataTypes.STRING(64), allowNull: true },
  userAgent: { type: DataTypes.STRING(255), allowNull: true },

  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'AccessLogs',
  timestamps: false,
  indexes: [
    { name: 'al_user_time', fields: ['userId', 'createdAt'] },
    { name: 'al_recipient_time', fields: ['recipientId', 'createdAt'] },
    { name: 'al_time', fields: ['createdAt'] }
  ]
});

export default AccessLog;
