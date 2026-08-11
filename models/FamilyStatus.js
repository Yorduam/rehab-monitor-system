import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const FamilyStatus = sequelize.define('FamilyStatus', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  code: { type: DataTypes.STRING(40), allowNull: false, unique: true },

  name: { type: DataTypes.STRING(100), allowNull: false },

  hint: { type: DataTypes.STRING(255), allowNull: true },

  groupKey: { type: DataTypes.STRING(30), allowNull: true },

  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'FamilyStatuses',
  timestamps: false
});

export default FamilyStatus;
