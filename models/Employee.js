import { DataTypes } from '@sequelize/core'
import sequelize from '../config/database.js'
import User from './User.js'

const Employee = sequelize.define('Employee', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  position: { type: DataTypes.STRING },
  contacts: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  direction: { type: DataTypes.STRING }
})

Employee.belongsTo(User, { foreignKey: 'userId' })
User.hasOne(Employee, { foreignKey: 'userId' })

export default Employee