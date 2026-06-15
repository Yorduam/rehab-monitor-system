import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const CRGDesc = sequelize.define('CRGDesc', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(265), allowNull: false },
  code: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'CRGDesc',
  timestamps: false
});

export default CRGDesc;
