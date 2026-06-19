import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const LegalRepresentative = sequelize.define('LegalRepresentative', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  firstName: { type: DataTypes.STRING(50), allowNull: false },
  middleName: { type: DataTypes.STRING(50), allowNull: false },
  lastName: { type: DataTypes.STRING(50), allowNull: false },
  telephone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passportSeries: { type: DataTypes.CHAR(4), allowNull: false },
  passportNumber: { type: DataTypes.CHAR(6), allowNull: false },
  passportIssuer: { type: DataTypes.STRING(255), allowNull: false },
  passportIssuerDate: { type: DataTypes.DATEONLY, allowNull: true },
  passportDeptCode: { type: DataTypes.CHAR(7), allowNull: false },
  passportReg: { type: DataTypes.STRING(255), allowNull: false }
}, {
  tableName: 'LegalRepresentatives',
  timestamps: false
});

export default LegalRepresentative;
