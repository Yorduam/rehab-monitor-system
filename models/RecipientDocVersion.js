import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RecipientDocVersion = sequelize.define('RecipientDocVersion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  docId: { type: DataTypes.INTEGER, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  snapshot: { type: DataTypes.JSON, allowNull: true },
  changedFields: { type: DataTypes.JSON, allowNull: true },
  reason: { type: DataTypes.TEXT, allowNull: false },
  changedBy: { type: DataTypes.INTEGER, allowNull: true },
  changedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'RecipientDocVersions',
  timestamps: false
});

export default RecipientDocVersion;
