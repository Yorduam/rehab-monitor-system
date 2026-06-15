import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const CRG = sequelize.define('CRG', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  code: { type: DataTypes.STRING(20), allowNull: false },
  child: { type: DataTypes.BOOLEAN, allowNull: false }
}, {
  tableName: 'CRG',
  timestamps: false
});

export default CRG;
