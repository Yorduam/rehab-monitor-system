import { Op } from '@sequelize/core';
import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sequelize from '../config/database.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  Recipient, ReGroup, LegalRepresentative,
  Nozology, CRG, CRGDesc, User,
  RecipientDoc, RecipientScanDoc, ReResult, CRGRecipientSec, DocType,
  ScheduleEvent, Direction
} from '../models/index.js';

const router = express.Router();

const groupInclude = {
  model: ReGroup,
  as: 'group',
  include: [{ model: User, as: 'curatorUser', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'fullName'] }]
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

const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Дополняет список реабилитантов вычисляемыми сигналами для карточек:
//  - ближайшее занятие в горизонте недели (attendsToday / attendsTomorrow / nextClassDate)
//  - истечение справки МСЭ (docExpiring / docExpiryDate) — жёлтый флаг
//  - «особые отметки» из документов (attentionNote) — красный флаг
// teacherUserId (необязательно): если задан, буллеты «Сегодня/Завтра/На неделе»
// считаются только по занятиям этого преподавателя (для роли teacher — куратора).
async function enrichRecipients(rows, teacherUserId = null) {
  const ids = rows.map((r) => r.id);
  if (!ids.length) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const soon = new Date(today); soon.setDate(today.getDate() + 30);
  const todayStr = fmtDate(today);
  const tomorrowStr = fmtDate(tomorrow);
  const weekEndStr = fmtDate(weekEnd);
  const soonStr = fmtDate(soon);

  // Ближайшее (минимальное) занятие каждого реабилитанта в пределах недели.
  const nextByRecipient = new Map();
  const eventWhere = {
    recipientId: { [Op.in]: ids },
    status: { [Op.ne]: 'cancelled' },
    date: { [Op.between]: [todayStr, weekEndStr] }
  };
  if (teacherUserId) eventWhere.specialistUserId = teacherUserId;
  const events = await ScheduleEvent.findAll({
    where: eventWhere,
    attributes: ['recipientId', 'date'],
    order: [['date', 'ASC']]
  });
  for (const ev of events) {
    const d = String(ev.date);
    const prev = nextByRecipient.get(ev.recipientId);
    if (!prev || d < prev) nextByRecipient.set(ev.recipientId, d);
  }

  // Документы: ближайшая дата окончания справки МСЭ + непустые «особые отметки».
  const docByRecipient = new Map();
  const docs = await RecipientDoc.findAll({
    where: { recipientId: { [Op.in]: ids } },
    attributes: ['recipientId', 'mseValidDate', 'specialNote']
  });
  for (const doc of docs) {
    const cur = docByRecipient.get(doc.recipientId) || { mseValidDate: null, specialNote: '' };
    if (doc.mseValidDate) {
      const v = String(doc.mseValidDate);
      if (!cur.mseValidDate || v < cur.mseValidDate) cur.mseValidDate = v;
    }
    if (!cur.specialNote && doc.specialNote && String(doc.specialNote).trim()) {
      cur.specialNote = String(doc.specialNote).trim();
    }
    docByRecipient.set(doc.recipientId, cur);
  }

  return rows.map((r) => {
    const json = r.toJSON();
    const nextClassDate = nextByRecipient.get(r.id) || null;
    const doc = docByRecipient.get(r.id) || { mseValidDate: null, specialNote: '' };
    json.attendsToday = nextClassDate === todayStr;
    json.attendsTomorrow = nextClassDate === tomorrowStr;
    json.attendsThisWeek = !!nextClassDate;
    json.nextClassDate = nextClassDate;
    json.docExpiring = !!doc.mseValidDate && doc.mseValidDate <= soonStr;
    json.docExpiryDate = doc.mseValidDate || null;
    json.attentionNote = doc.specialNote || null;
    return json;
  });
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

    // Преподаватель (куратор) видит только тех реабилитантов, которые записаны
    // конкретно к нему — то есть у кого есть занятие с этим специалистом
    // (ScheduleEvent.specialistUserId = его userId).
    const teacherUserId = req.user.role === 'teacher' ? req.user.id : null;
    if (teacherUserId) {
      const myEvents = await ScheduleEvent.findAll({
        where: { specialistUserId: teacherUserId, status: { [Op.ne]: 'cancelled' } },
        attributes: ['recipientId']
      });
      const myRecipientIds = [...new Set(
        myEvents.map((e) => e.recipientId).filter((v) => v != null)
      )];
      // Если у преподавателя нет записанных реабилитантов — отдаём пустой список.
      if (!myRecipientIds.length) {
        return res.json({ data: [], total: 0, page, limit, totalPages: 0 });
      }
      where.id = where.id ? { [Op.and]: [where.id, { [Op.in]: myRecipientIds }] } : { [Op.in]: myRecipientIds };
    }

    const { count, rows } = await Recipient.findAndCountAll({
      where,
      limit,
      offset,
      include: listInclude,
      order: [['id', 'DESC']]
    });

    const data = await enrichRecipients(rows, teacherUserId);

    res.json({ data, total: count, page, limit, totalPages: Math.ceil(count / limit) });
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

// Лента событий реабилитанта из расписания (ScheduleEvent) с преподавателем и
// направлением. Используется карточкой реабилитанта для блоков «Последние
// занятия», «Ближайшие события» и «Команда сопровождения», а также счётчиков
// вкладок. Отменённые события (status='cancelled') исключаем.
router.get('/:id/agenda', authMiddleware, async (req, res, next) => {
  try {
    const events = await ScheduleEvent.findAll({
      where: { recipientId: req.params.id, status: { [Op.ne]: 'cancelled' } },
      include: [
        { model: User, as: 'specialist', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'fullName'] },
        { model: Direction, as: 'direction', attributes: ['id', 'name'] }
      ],
      order: [['date', 'ASC'], ['startTime', 'ASC']]
    });
    res.json({ events });
  } catch (err) {
    next(err);
  }
});

const onlyDigits = (s) => (s || '').replace(/\D/g, '');

router.post('/intake', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
  const { recipient = {}, representative = {}, doc = {}, nozologyClasses = [], crg = {}, groupId } = req.body;

  if (!recipient.firstName || !recipient.lastName) {
    return res.status(400).json({ message: 'Не заполнено ФИО реабилитанта' });
  }

  try {
    // СНИЛС уникален (один человек — одна карта). Проверяем заранее и отдаём
    // понятное сообщение вместо сырого «Validation error» из БД.
    if (doc.snils) {
      const dup = await RecipientDoc.findOne({ where: { snils: doc.snils } });
      if (dup) {
        return res.status(409).json({ message: `Реабилитант с таким СНИЛС (${doc.snils}) уже зарегистрирован в системе` });
      }
    }

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

      // Синтетические e-mail — это лишь технические плейсхолдеры (аккаунты
      // никогда не логинятся, пароль случайный). Они ОБЯЗАНЫ быть уникальными,
      // иначе повторное сохранение или совпадение СНИЛС/телефона роняет всю
      // транзакцию по UNIQUE-констрейнту. Добавляем случайный суффикс.
      const uniqSuffix = crypto.randomBytes(5).toString('hex');

      const repPhone = representative.telephone || '';
      const rep = await LegalRepresentative.create({
        firstName: representative.firstName || '',
        middleName: representative.middleName || '',
        lastName: representative.lastName || '',
        telephone: repPhone,
        email: `lr-${onlyDigits(repPhone) || 'na'}-${uniqSuffix}@intake.local`,
        passportSeries: representative.passportSeries || '',
        passportNumber: representative.passportNumber || '',
        passportIssuer: representative.passportIssuer || '',
        passportIssuerDate: representative.passportIssuerDate || null,
        passportDeptCode: representative.passportDeptCode || '',
        passportReg: representative.passportReg || ''
      }, { transaction: t });

      const recEmail = `rcp-${onlyDigits(doc.snils) || 'na'}-${uniqSuffix}@intake.local`;
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
        groupId: groupId || null,
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
    // Страховка: любое нарушение уникальности превращаем в понятное сообщение,
    // а не в 500 «Validation error».
    if (err?.name === 'SequelizeUniqueConstraintError') {
      const path = err?.errors?.[0]?.path || '';
      const msg = /snils/i.test(path)
        ? 'Реабилитант с таким СНИЛС уже зарегистрирован в системе'
        : `Запись с такими данными уже существует (${path || 'дубликат'})`;
      return res.status(409).json({ message: msg });
    }
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

router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
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

// Отметка посещения на «сегодня»: 'present' | 'absent' | 'left' | null (снять).
// Ставит преподаватель на вкладке «Реабилитанты». Именно статус 'present'
// открывает карточку реабилитанта на вкладке «Диагностика» (если он направлен
// на диагностику именно к этому преподавателю). Дата фиксируется на серверный
// «сегодня», чтобы отметка действовала только в пределах текущего дня.
router.put('/:id/attendance', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const raw = req.body?.status;
    const allowed = ['present', 'absent', 'left'];
    const status = raw == null || raw === '' ? null : String(raw);
    if (status !== null && !allowed.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус посещения' });
    }

    await recipient.update({
      attendanceStatus: status,
      attendanceDate: status ? fmtDate(new Date()) : null
    });

    res.json({
      id: recipient.id,
      attendanceStatus: recipient.attendanceStatus,
      attendanceDate: recipient.attendanceDate
    });
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

const ENTITY_TYPES = ['rehabilitant', 'representative'];

router.post('/:id/scans', authMiddleware, roleMiddleware('admin', 'teacher', 'employee'), async (req, res, next) => {
  try {
    const recipient = await Recipient.findByPk(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const scans = Array.isArray(req.body.scans) ? req.body.scans : [];
    if (!scans.length) return res.status(400).json({ message: 'Нет файлов для сохранения' });

    const docTypes = await DocType.findAll();
    const codeToId = new Map(docTypes.map((d) => [d.code, d.id]));

    const created = [];
    for (const scan of scans) {
      const { docKey, entityType, originalName, mimeType, base64 } = scan;
      if (!docKey || !base64) continue;

      const docTypeId = codeToId.get(docKey);
      if (!docTypeId) continue;

      const buffer = Buffer.from(base64, 'base64');
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      const et = ENTITY_TYPES.includes(entityType) ? entityType : 'rehabilitant';

      const row = await RecipientScanDoc.create({
        entityType: et,
        recipId: recipient.id,
        represId: recipient.representativeId,
        docType: docTypeId,
        storageKey: `db://${checksum}`,
        originalName: originalName || `${docKey}.bin`,
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: buffer.length,
        checksum_sha256: checksum,
        fileData: buffer
      });
      created.push(row.id);
    }

    res.status(201).json({ saved: created.length, ids: created });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/scans', authMiddleware, async (req, res, next) => {
  try {
    const scans = await RecipientScanDoc.findAll({
      where: { recipId: req.params.id },
      attributes: { exclude: ['fileData'] },
      include: [{ model: DocType, as: 'docTypeRef' }],
      order: [['id', 'ASC']]
    });
    res.json(scans);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/scans/:scanId/file', authMiddleware, async (req, res, next) => {
  try {
    const scan = await RecipientScanDoc.findOne({
      where: { id: req.params.scanId, recipId: req.params.id }
    });
    if (!scan || !scan.fileData) return res.status(404).json({ message: 'Файл не найден' });

    res.setHeader('Content-Type', scan.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(scan.originalName)}"`);
    res.send(scan.fileData);
  } catch (err) {
    next(err);
  }
});

export default router;
