import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const SpecialistDirect = sequelize.define('SpecialistDirect', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  idSpecialist: { type: DataTypes.INTEGER, allowNull: false },
  idDirection: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'SpecialistDirect',
  timestamps: false
});

export default SpecialistDirect;
