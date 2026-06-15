import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'employee', 'recipient'), defaultValue: 'recipient' }
}, {
  tableName: 'Users',
  timestamps: false
});

export default User;
