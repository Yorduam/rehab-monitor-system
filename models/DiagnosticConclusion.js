import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const DiagnosticConclusion = sequelize.define('DiagnosticConclusion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  sessionId: { type: DataTypes.INTEGER, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  verdict: { type: DataTypes.STRING(20), allowNull: true },
  summary: { type: DataTypes.TEXT, allowNull: false },
  recommendations: { type: DataTypes.TEXT, allowNull: true },
  authorId: { type: DataTypes.INTEGER, allowNull: true },
  issuedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'DiagnosticConclusions',
  timestamps: true
});

export default DiagnosticConclusion;
