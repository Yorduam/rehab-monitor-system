import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const DocType = sequelize.define('DocType', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(100), allowNull: false },
  name: { type: DataTypes.STRING(128), allowNull: false },
  category: { type: DataTypes.ENUM('scan', 'generated', 'signed'), allowNull: false },
  isRequired: { type: DataTypes.BOOLEAN, allowNull: false },
  appliesTo: { type: DataTypes.ENUM('rehabilitant', 'representative', 'both'), allowNull: false }
}, {
  tableName: 'DocType',
  timestamps: false
});

export default DocType;
