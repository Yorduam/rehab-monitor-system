import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const Nozology = sequelize.define('Nozology', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  class: { type: DataTypes.STRING(10), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  code: { type: DataTypes.STRING(20), allowNull: false }
}, {
  tableName: 'Nozology',
  timestamps: false
});

export default Nozology;
