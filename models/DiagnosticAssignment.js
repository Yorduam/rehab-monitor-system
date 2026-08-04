import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const DiagnosticAssignment = sequelize.define('DiagnosticAssignment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sessionId: { type: DataTypes.STRING(64), allowNull: true },
  diagnosticSessionId: { type: DataTypes.INTEGER, allowNull: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  directionId: { type: DataTypes.INTEGER, allowNull: false },
  specialistUserId: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  blockStatus: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'assigned' },
  results: { type: DataTypes.JSON, allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'DiagnosticAssignments',
  timestamps: true
});

export default DiagnosticAssignment;
