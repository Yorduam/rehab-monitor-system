import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RecipientDraft = sequelize.define('RecipientDraft', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  lastName: { type: DataTypes.STRING(50), allowNull: true },
  firstName: { type: DataTypes.STRING(50), allowNull: true },
  middleName: { type: DataTypes.STRING(50), allowNull: true },
  birthDate: { type: DataTypes.DATEONLY, allowNull: true },
  repName: { type: DataTypes.STRING(150), allowNull: true },

  payload: { type: DataTypes.JSON, allowNull: false },

  createdBy: { type: DataTypes.INTEGER, allowNull: true },
  createdByName: { type: DataTypes.STRING(150), allowNull: true },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedByName: { type: DataTypes.STRING(150), allowNull: true },

  createdAt: { type: DataTypes.DATE, allowNull: false },
  updatedAt: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'RecipientDrafts',
  timestamps: false
});

export default RecipientDraft;
