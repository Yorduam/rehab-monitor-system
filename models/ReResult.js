import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const ReResult = sequelize.define('ReResult', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  idRecipient: { type: DataTypes.INTEGER, allowNull: false },
  idDirection: { type: DataTypes.INTEGER, allowNull: false },
  idSpecialist: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  results: { type: DataTypes.JSON, allowNull: false },
  published: { type: DataTypes.BOOLEAN, allowNull: false }
}, {
  tableName: 'ReResults',
  timestamps: false
});

export default ReResult;
