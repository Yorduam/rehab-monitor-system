import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const DiagnosticSession = sequelize.define('DiagnosticSession', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
  note: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  closedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'DiagnosticSessions',
  timestamps: true
});

export default DiagnosticSession;
