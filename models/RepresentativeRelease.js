import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const RepresentativeRelease = sequelize.define('RepresentativeRelease', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  representativeId: { type: DataTypes.INTEGER, allowNull: false },
  relation: { type: DataTypes.STRING(50), allowNull: true },
  releasedAt: { type: DataTypes.DATE, allowNull: false },
  releasedBy: { type: DataTypes.INTEGER, allowNull: true },
  reason: { type: DataTypes.STRING(500), allowNull: false }
}, {
  tableName: 'RepresentativeReleases',
  timestamps: false
});

export default RepresentativeRelease;
