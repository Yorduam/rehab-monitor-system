import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const ScheduleEvent = sequelize.define('ScheduleEvent', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  specialistUserId: { type: DataTypes.INTEGER, allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: true },
  directionId: { type: DataTypes.INTEGER, allowNull: true },
  assignmentId: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'lesson' },
  title: { type: DataTypes.STRING(255), allowNull: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  startTime: { type: DataTypes.TIME, allowNull: false },
  endTime: { type: DataTypes.TIME, allowNull: false },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'scheduled' },
  createdBy: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'ScheduleEvents',
  timestamps: true
});

export default ScheduleEvent;
