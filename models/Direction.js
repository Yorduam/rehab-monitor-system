import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const Direction = sequelize.define('Direction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false }
}, {
  tableName: 'Direction',
  timestamps: false
});

export default Direction;
