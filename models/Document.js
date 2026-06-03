import { DataTypes } from '@sequelize/core';
import sequelize from '../config/database.js';

const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  type: DataTypes.STRING,
  name: DataTypes.STRING,
  url: DataTypes.STRING,
  size: DataTypes.INTEGER,
  recipientId: DataTypes.INTEGER
});
export default Document;