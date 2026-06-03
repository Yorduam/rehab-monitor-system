import { DataTypes } from '@sequelize/core'
import sequelize from '../config/database.js'

const Program = sequelize.define('Program', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  totalHours: { type: DataTypes.INTEGER },
  totalWeeks: { type: DataTypes.INTEGER },
  subjects: { type: DataTypes.JSON, defaultValue: [] },
  metrics: { type: DataTypes.JSON, defaultValue: [] },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 }
})

export default Program