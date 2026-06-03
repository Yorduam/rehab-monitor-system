import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';
import User from './User.js';

const Group = sequelize.define('Group', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  curatorId: { type: DataTypes.INTEGER, allowNull: true },
  direction: { type: DataTypes.STRING }
});

Group.belongsTo(User, { as: 'curator', foreignKey: 'curatorId' });

export default Group;