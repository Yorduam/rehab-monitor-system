import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const LegalRepFamilyStatus = sequelize.define('LegalRepFamilyStatus', {
  representativeId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  statusId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },

  setBy: { type: DataTypes.INTEGER, allowNull: true },
  setAt: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'LegalRepFamilyStatuses',
  timestamps: false
});

export default LegalRepFamilyStatus;
