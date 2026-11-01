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
  canFillForOthers: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  failedLoginCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  lockedUntil: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  twoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  twoFactorMode: {
    type: DataTypes.ENUM('inherit', 'required', 'exempt'),
    allowNull: false,
    defaultValue: 'inherit'
  },
  certThumbprint: { type: DataTypes.CHAR(40), allowNull: true, unique: 'users_cert_thumbprint' },
  certPem: { type: DataTypes.TEXT, allowNull: true },
  certSubject: { type: DataTypes.STRING(255), allowNull: true },
  certValidTo: { type: DataTypes.DATE, allowNull: true },
  twoFactorBoundAt: { type: DataTypes.DATE, allowNull: true },
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
