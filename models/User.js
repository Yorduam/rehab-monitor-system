import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'employee', 'recipient'), defaultValue: 'recipient' },
  firstName: { type: DataTypes.STRING(100), allowNull: true },
  lastName: { type: DataTypes.STRING(100), allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  cabinet: { type: DataTypes.STRING(10), allowNull: true },
  directionId: { type: DataTypes.INTEGER, allowNull: true },
  canConclude: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  canViewAllResults: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  failedLoginCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lockedUntil: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  fullName: {
    type: DataTypes.VIRTUAL,
    get() {
      const name = [this.lastName, this.firstName].filter(Boolean).join(' ').trim();
      return name || this.getDataValue('email') || '';
    }
  }
}, {
  tableName: 'Users',
  timestamps: false
});

export default User;
