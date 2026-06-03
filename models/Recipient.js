import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';
import User from './User.js';
import Group from './Group.js';

const Recipient = sequelize.define('Recipient', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  photo: { type: DataTypes.STRING },
  fullName: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER },
  address: { type: DataTypes.STRING },
  program: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  enrollmentDate: { type: DataTypes.DATEONLY },
  groupName: { type: DataTypes.STRING },
  legalRepresentative: { type: DataTypes.STRING },
  contacts: { type: DataTypes.STRING },
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  diagnosis: { type: DataTypes.STRING },
  curator: { type: DataTypes.STRING },
  attendance: { type: DataTypes.INTEGER, defaultValue: 0 },
  commScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  groupScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  creativityScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  selfScore: { type: DataTypes.INTEGER, defaultValue: 0 },
  groupId: { type: DataTypes.INTEGER, allowNull: true },

  // Новые поля
  aggressionLevel: { type: DataTypes.INTEGER, defaultValue: 1, validate: { min: 1, max: 5 } },
  showAggression: { type: DataTypes.BOOLEAN, defaultValue: true },
  aggressionNote: { type: DataTypes.STRING(255), allowNull: true },
  completionStatus: { type: DataTypes.ENUM('in_progress', 'completed'), defaultValue: 'in_progress' }
});

// Ассоциации
Recipient.belongsTo(Group, { as: 'group', foreignKey: 'groupId' });

export default Recipient;