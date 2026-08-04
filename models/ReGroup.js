import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const ReGroup = sequelize.define('ReGroup', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  groupName: { type: DataTypes.STRING(50), allowNull: false },
  curatorUserId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'ReGroup',
  timestamps: false
});

export default ReGroup;
