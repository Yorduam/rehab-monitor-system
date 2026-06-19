import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RecipientDoc = sequelize.define('RecipientDoc', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  docType: { type: DataTypes.ENUM('Свидетельство', 'Паспорт'), allowNull: false },
  docSeries: { type: DataTypes.STRING(16), allowNull: false },
  docNumber: { type: DataTypes.STRING(16), allowNull: false },
  docIssuer: { type: DataTypes.STRING(255), allowNull: false },
  docIssuerDate: { type: DataTypes.DATEONLY, allowNull: false },
  snils: { type: DataTypes.CHAR(14), allowNull: false, unique: true },
  mseIssueDate: { type: DataTypes.DATEONLY, allowNull: false },
  mseValidDate: { type: DataTypes.DATEONLY, allowNull: false },
  regAddress: { type: DataTypes.STRING(500), allowNull: false },
  factAddress: { type: DataTypes.STRING(500), allowNull: false },
  factSameReg: { type: DataTypes.BOOLEAN, defaultValue: false },
  educationPlace: { type: DataTypes.STRING(255), allowNull: false },
  specialNote: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'RecipientDocs',
  timestamps: false
});

export default RecipientDoc;
