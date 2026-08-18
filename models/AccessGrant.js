import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const AccessGrant = sequelize.define('AccessGrant', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  userId: { type: DataTypes.INTEGER, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },

  category: {
    type: DataTypes.ENUM('passport', 'scans', 'contacts', 'medical'),
    allowNull: false
  },

  reasonCode: { type: DataTypes.STRING(64), allowNull: true },

  expiresAt: { type: DataTypes.DATE, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'AccessGrants',
  timestamps: false,
  indexes: [
    { name: 'ag_unique', unique: true, fields: ['userId', 'recipientId', 'category'] },
    { name: 'ag_user_expires', fields: ['userId', 'expiresAt'] }
  ]
});

export default AccessGrant;
