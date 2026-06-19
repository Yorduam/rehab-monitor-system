import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RecipientScanDoc = sequelize.define('RecipientScanDoc', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  entityType: { type: DataTypes.ENUM('rehabilitant', 'representative'), allowNull: false },
  recipId: { type: DataTypes.INTEGER, allowNull: false },
  represId: { type: DataTypes.INTEGER, allowNull: false },
  docType: { type: DataTypes.INTEGER, allowNull: false },
  storageKey: { type: DataTypes.STRING(500), allowNull: false },
  originalName: { type: DataTypes.STRING(255), allowNull: false },
  mimeType: { type: DataTypes.STRING(100), allowNull: false },
  sizeBytes: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  checksum_sha256: { type: DataTypes.CHAR(64), allowNull: false },
  fileData: { type: DataTypes.BLOB('long'), allowNull: true }
}, {
  tableName: 'RecipientScanDocs',
  timestamps: false
});

export default RecipientScanDoc;
