import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'employee', 'recipient'), defaultValue: 'recipient' },
  firstName: { type: DataTypes.STRING(100), allowNull: true },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  // Проф. ориентированность преподавателя (ссылка на Direction). Заполняется только для роли teacher.
  directionId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'Users',
  timestamps: false
});

export default User;
