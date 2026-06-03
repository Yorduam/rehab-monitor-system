// models/User.js
import { DataTypes } from '@sequelize/core'
import sequelize from '../config/database.js'

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false }, // обязательно passwordHash
  fullName: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'teacher', 'employee', 'recipient'), defaultValue: 'recipient' }
})

export default User