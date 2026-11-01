import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const TwoFactorRolePolicy = sequelize.define('TwoFactorRolePolicy', {
  role: { type: DataTypes.STRING(32), primaryKey: true },
  required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
  updatedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'TwoFactorRolePolicies',
  timestamps: false
});

export default TwoFactorRolePolicy;
