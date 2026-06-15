import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const Specialist = sequelize.define('Specialist', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fullName: { type: DataTypes.STRING(150), allowNull: false },
  dateBirth: { type: DataTypes.DATEONLY, allowNull: false },
  cabinet: { type: DataTypes.STRING(3), allowNull: false },
  telephone: { type: DataTypes.STRING(20), allowNull: false, unique: true }
}, {
  tableName: 'Specialists',
  timestamps: false
});

export default Specialist;
