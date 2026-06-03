import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';
// Импортируем модели для ассоциаций
import Recipient from './Recipient.js';
import Group from './Group.js';

const TimelineEvent = sequelize.define('TimelineEvent', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATEONLY },
  time: { type: DataTypes.STRING(10) },
  type: { type: DataTypes.STRING(50), defaultValue: 'diagnostic' },
  recipientId: { type: DataTypes.INTEGER, allowNull: true },
  groupId: { type: DataTypes.INTEGER, allowNull: true },
  specialist: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('planned', 'done'), defaultValue: 'planned' }
});

// Ассоциации определяем отдельно
TimelineEvent.belongsTo(Recipient, { foreignKey: 'recipientId', as: 'recipient' });
TimelineEvent.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

export default TimelineEvent;