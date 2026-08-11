import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RecipientDraftScan = sequelize.define('RecipientDraftScan', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  draftId: { type: DataTypes.INTEGER, allowNull: false },
  docKey: { type: DataTypes.STRING(50), allowNull: false },
  originalName: { type: DataTypes.STRING(255), allowNull: false },
  mimeType: { type: DataTypes.STRING(100), allowNull: false },
  sizeBytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  fileData: { type: DataTypes.BLOB('long'), allowNull: true },
  uploadedBy: { type: DataTypes.INTEGER, allowNull: true },
  uploadedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'RecipientDraftScans',
  timestamps: false
});

export default RecipientDraftScan;
