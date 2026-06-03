import { DataTypes } from '@sequelize/core'
import sequelize from '../config/database.js'
import Recipient from './Recipient.js'

const Document = sequelize.define('Document', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING }, // договор, справка, результат теста и т.д.
  fileUrl: { type: DataTypes.STRING }, // ссылка на файл
  uploadDate: { type: DataTypes.DATEONLY },
  expiryDate: { type: DataTypes.DATEONLY }, // срок действия
  description: { type: DataTypes.TEXT }
})

Document.belongsTo(Recipient, { foreignKey: 'recipientId' })
Recipient.hasMany(Document, { foreignKey: 'recipientId' })

export default Document