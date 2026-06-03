import Joi from 'joi';
import TimelineEvent from '../models/TimelineEvent.js';
import Diagnostic from '../models/Diagnostic.js';
import { sequelize } from '../config/database.js';
import { NotFoundError, ValidationError } from '../exceptions/AppError.js';

const timelineSchema = Joi.object({
  title: Joi.string().required(),
  date: Joi.date().required(),
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  type: Joi.string().valid('diagnostic', 'lesson', 'meeting').required(),
  recipientId: Joi.when('type', { is: 'diagnostic', then: Joi.number().integer().required(), otherwise: Joi.optional() }),
  groupId: Joi.when('type', { is: 'lesson', then: Joi.number().integer().required(), otherwise: Joi.optional() }),
  specialist: Joi.string().optional(),
  status: Joi.string().valid('planned', 'done').default('planned')
});

export class TimelineService {
  async findAll() {
    return await TimelineEvent.findAll({ order: [['date', 'ASC']] });
  }

  async create(data) {
    const { error, value } = timelineSchema.validate(data);
    if (error) throw new ValidationError(error.details[0].message);
    const transaction = await sequelize.transaction();
    try {
      const event = await TimelineEvent.create(value, { transaction });
      if (event.type === 'diagnostic' && event.recipientId) {
        const [diagnostic, created] = await Diagnostic.findOrCreate({
          where: { recipientId: event.recipientId, name: event.title, date: event.date },
          defaults: {
            name: event.title, recipientId: event.recipientId, date: event.date,
            time: event.time, specialist: event.specialist, status: event.status, type: event.type
          },
          transaction
        });
        if (!created) {
          await diagnostic.update({
            time: event.time, specialist: event.specialist, status: event.status, type: event.type
          }, { transaction });
        }
      }
      await transaction.commit();
      return event;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async update(id, data) {
    const event = await TimelineEvent.findByPk(id);
    if (!event) throw new NotFoundError('TimelineEvent');
    const { error, value } = timelineSchema.validate(data);
    if (error) throw new ValidationError(error.details[0].message);
    const transaction = await sequelize.transaction();
    try {
      await event.update(value, { transaction });
      if (event.type === 'diagnostic' && event.recipientId) {
        const diagnostic = await Diagnostic.findOne({
          where: { recipientId: event.recipientId, name: event.title, date: event.date },
          transaction
        });
        if (diagnostic) {
          await diagnostic.update({
            name: event.title, date: event.date, time: event.time,
            specialist: event.specialist, status: event.status, type: event.type
          }, { transaction });
        } else {
          await Diagnostic.create({
            name: event.title, recipientId: event.recipientId, date: event.date,
            time: event.time, specialist: event.specialist, status: event.status, type: event.type
          }, { transaction });
        }
      }
      await transaction.commit();
      return event;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async delete(id) {
    const event = await TimelineEvent.findByPk(id);
    if (!event) throw new NotFoundError('TimelineEvent');
    const transaction = await sequelize.transaction();
    try {
      if (event.type === 'diagnostic' && event.recipientId) {
        await Diagnostic.destroy({
          where: { recipientId: event.recipientId, name: event.title, date: event.date, type: event.type },
          transaction
        });
      }
      await event.destroy({ transaction });
      await transaction.commit();
      return { success: true };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}