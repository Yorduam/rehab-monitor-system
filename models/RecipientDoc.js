import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RecipientDoc = sequelize.define('RecipientDoc', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  docType: { type: DataTypes.ENUM('Свидетельство', 'Паспорт'), allowNull: false },
  docSeries: { type: DataTypes.STRING(16), allowNull: true },
  docNumber: { type: DataTypes.STRING(16), allowNull: true },
  docIssuer: { type: DataTypes.STRING(255), allowNull: true },
  docIssuerDate: { type: DataTypes.DATEONLY, allowNull: true },
  snils: { type: DataTypes.CHAR(14), allowNull: true, unique: true },
  mseIssueDate: { type: DataTypes.DATEONLY, allowNull: true },
  mseValidDate: { type: DataTypes.DATEONLY, allowNull: true },
  mseIndefinite: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  regAddress: { type: DataTypes.STRING(500), allowNull: true },
  factAddress: { type: DataTypes.STRING(500), allowNull: true },
  factSameReg: { type: DataTypes.BOOLEAN, defaultValue: false },
  district: { type: DataTypes.STRING(64), allowNull: true },
  area: { type: DataTypes.STRING(120), allowNull: true },
  educationPlace: { type: DataTypes.STRING(255), allowNull: true },
  specialNote: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'RecipientDocs',
  timestamps: false
});

export default RecipientDoc;
