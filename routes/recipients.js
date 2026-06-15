import { Op } from '@sequelize/core';
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sequelize from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  Recipient, ReGroup, Specialist, LegalRepresentative,
  Nozology, CRG, CRGDesc, User,
  RecipientDoc, RecipientScanDoc, ReResult, CRGRecipientSec
} from '../models/index.js';

const router = express.Router();

const groupInclude = {
  model: ReGroup,
  as: 'group',
  include: [{ model: Specialist, as: 'curatorRef', attributes: ['id', 'fullName'] }]
};
const listInclude = [groupInclude];
const detailInclude = [
  groupInclude,
  { model: User, as: 'user', attributes: ['id', 'email', 'role'] },
  { model: LegalRepresentative, as: 'representative' },
  { model: Nozology, as: 'nozologyRef' },
  { model: CRG, as: 'crgMain' },
  { model: CRGDesc, as: 'secondaryCRG' },
  { model: RecipientDoc, as: 'docs' }
];

const RECIPIENT_FIELDS = [
  'userId', 'firstName', 'middleName', 'lastName', 'birthDate', 'email',
  'telephone', 'photo', 'representativeId', 'status', 'disableGroup',
  'diagnosis', 'nozology', 'groupId', 'CRGMain'
];

function pickFields(body) {
  const out = {};
  for (const key of RECIPIENT_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const diagnosis = req.query.diagnosis;
    const groupId = req.query.groupId ? parseInt(req.query.groupId) : undefined;

    const where = {};
    if (search) {
      where[Op.or] = [
        { lastName: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { middleName: { [Op.like]: `%${search}%` } }
      ];
    }
    if (diagnosis && diagnosis !== 'all') where.diagnosis = diagnosis;
    if (groupId) where.groupId = groupId;

    const { count, rows } = await Recipient.findAndCountAll({
      where,
      limit,
      offset,
      include: listInclude,
      order: [['id', 'DESC']]
    });

    res.json({ data: rows, total: count, page, limit, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id, { include: detailInclude });
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });
    res.json(recipient);
  } catch (err) {
    next(err);
  }
});

const onlyDigits = (s) => (s || '').replace(/\D/g, '');

router.post('/intake', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  const { recipient = {}, representative = {}, doc = {}, nozologyClasses = [], crg = {}, groupId } = req.body;

  if (!recipient.firstName || !recipient.lastName) {
    return res.status(400).json({ message: 'Не заполнено ФИО реабилитанта' });
  }
  if (!groupId) {
    return res.status(400).json({ message: 'Не выбрана группа' });
  }

  try {
    const result = await sequelize.transaction(async (t) => {

      let nozId = null;
      if (nozologyClasses.length) {
        const noz = await Nozology.findOne({ where: { class: { [Op.in]: nozologyClasses } }, transaction: t });
        nozId = noz?.id ?? null;
      }
      if (nozId == null) {
        const fallback = await Nozology.findOne({ order: [['id', 'ASC']], transaction: t });
        nozId = fallback?.id ?? null;
      }
      if (nozId == null) throw new Error('Справочник нозологий пуст');

      let crgId = null;
      if (crg.code) {
        const row = await CRG.findOne({ where: { code: String(crg.code), child: !!crg.child }, transaction: t });
        crgId = row?.id ?? null;
      }
      if (crgId == null) {
        const fallback = await CRG.findOne({ order: [['id', 'ASC']], transaction: t });
        crgId = fallback?.id ?? null;
      }
      if (crgId == null) throw new Error('Справочник ЦРГ пуст');

      const repPhone = representative.telephone || '';
      const rep = await LegalRepresentative.create({
        firstName: representative.firstName || '',
        middleName: representative.middleName || '',
        lastName: representative.lastName || '',
        telephone: repPhone,
        email: `lr-${onlyDigits(repPhone) || Date.now()}@intake.local`,
        passportSeries: representative.passportSeries || '',
        passportNumber: representative.passportNumber || '',
        passportIssuer: representative.passportIssuer || '',
        passportIssuerDate: representative.passportIssuerDate || null,
        passportDeptCode: representative.passportDeptCode || '',
        passportReg: representative.passportReg || ''
      }, { transaction: t });

      const recEmail = `rcp-${onlyDigits(doc.snils) || Date.now()}@intake.local`;
      const tempHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
      const user = await User.create({ email: recEmail, passwordHash: tempHash, role: 'recipient' }, { transaction: t });

      const created = await Recipient.create({
        userId: user.id,
        representativeId: rep.id,
        firstName: recipient.firstName,
        middleName: recipient.middleName || '',
        lastName: recipient.lastName,
        birthDate: recipient.birthDate || null,
        email: recEmail,
        telephone: repPhone || recEmail,
        photo: '',
        status: recipient.status || 'draft',
        diagnosis: recipient.diagnosis || '',
        nozology: nozId,
        groupId,
        CRGMain: crgId
      }, { transaction: t });

      const docReady = doc.snils && doc.docSeries && doc.docNumber && doc.docIssuer &&
        doc.docIssuerDate && doc.mseIssueDate && doc.mseValidDate && doc.regAddress && doc.educationPlace;
      if (docReady) {
        await RecipientDoc.create({
          recipientId: created.id,
          docType: doc.docType === 'passport' ? 'Паспорт' : 'Свидетельство',
          docSeries: doc.docSeries,
          docNumber: doc.docNumber,
          docIssuer: doc.docIssuer,
          docIssuerDate: doc.docIssuerDate,
          snils: doc.snils,
          mseIssueDate: doc.mseIssueDate,
          mseValidDate: doc.mseValidDate,
          regAddress: doc.regAddress,
          factAddress: doc.factSameReg ? doc.regAddress : (doc.factAddress || doc.regAddress),
          factSameReg: !!doc.factSameReg,
          educationPlace: doc.educationPlace,
          specialNote: doc.specialNote || ''
        }, { transaction: t });
      }

      return created.id;
    });

    const full = await Recipient.findByPk(result, { include: detailInclude });
    res.status(201).json(full);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const data = pickFields(req.body);
    const recipient = await Recipient.create(data);

    if (Array.isArray(req.body.secondaryCRG) && req.body.secondaryCRG.length) {
      await recipient.setSecondaryCRG(req.body.secondaryCRG);
    }

    const fullRecipient = await Recipient.findByPk(recipient.id, { include: detailInclude });
    res.status(201).json(fullRecipient);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    await recipient.update(pickFields(req.body));

    if (Array.isArray(req.body.secondaryCRG)) {
      await recipient.setSecondaryCRG(req.body.secondaryCRG);
    }

    const updated = await Recipient.findByPk(recipient.id, { include: detailInclude });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    await CRGRecipientSec.destroy({ where: { idRecipient: recipient.id } });
    await RecipientDoc.destroy({ where: { recipientId: recipient.id } });
    await RecipientScanDoc.destroy({ where: { recipId: recipient.id } });
    await ReResult.destroy({ where: { idRecipient: recipient.id } });
    await recipient.destroy();

    res.json({ message: 'Реабилитант удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
