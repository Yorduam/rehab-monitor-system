import Joi from 'joi';
import Diagnostic from '../models/Diagnostic.js';
import TimelineEvent from '../models/TimelineEvent.js';
import { sequelize } from '../config/database.js';
import { NotFoundError, ValidationError } from '../exceptions/AppError.js';

const diagnosticSchema = Joi.object({
  name: Joi.string().required(),
  recipientId: Joi.number().integer().required(),
  date: Joi.date().required(),
  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  specialist: Joi.string().required(),
  status: Joi.string().valid('planned', 'done').default('planned'),
  type: Joi.string().valid('diagnostic', 'lesson', 'meeting').default('diagnostic')
});

export class DiagnosticService {
  async create(data) {
    const { error, value } = diagnosticSchema.validate(data);
    if (error) throw new ValidationError(error.details[0].message);

    const transaction = await sequelize.transaction();
    try {
      const diagnostic = await Diagnostic.create(value, { transaction });
      await TimelineEvent.create({
        title: diagnostic.name,
        date: diagnostic.date,
        time: diagnostic.time,
        type: diagnostic.type,
        recipientId: diagnostic.recipientId,
        specialist: diagnostic.specialist,
        status: diagnostic.status
      }, { transaction });
      await transaction.commit();
      return diagnostic;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async update(id, data) {
    const { error, value } = diagnosticSchema.validate(data);
    if (error) throw new ValidationError(error.details[0].message);
    const diagnostic = await Diagnostic.findByPk(id);
    if (!diagnostic) throw new NotFoundError('Diagnostic');
    const transaction = await sequelize.transaction();
    try {
      await diagnostic.update(value, { transaction });
      const timelineEvent = await TimelineEvent.findOne({
        where: { recipientId: diagnostic.recipientId, title: diagnostic.name, date: diagnostic.date, type: diagnostic.type }
      });
      if (timelineEvent) {
        await timelineEvent.update({
          title: diagnostic.name, date: diagnostic.date, time: diagnostic.time,
          type: diagnostic.type, specialist: diagnostic.specialist, status: diagnostic.status
        }, { transaction });
      } else {
        await TimelineEvent.create({ ...value, title: value.name }, { transaction });
      }
      await transaction.commit();
      return diagnostic;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async delete(id) {
    const diagnostic = await Diagnostic.findByPk(id);
    if (!diagnostic) throw new NotFoundError('Diagnostic');
    const transaction = await sequelize.transaction();
    try {
      await TimelineEvent.destroy({
        where: { recipientId: diagnostic.recipientId, title: diagnostic.name, date: diagnostic.date, type: diagnostic.type }
      }, { transaction });
      await diagnostic.destroy({ transaction });
      await transaction.commit();
      return { success: true };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}