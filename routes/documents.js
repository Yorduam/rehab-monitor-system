import express from 'express';
import { authMiddleware, roleMiddleware, staffOnly } from '../middleware/auth.js';
import { RecipientDoc, RecipientDocVersion, Recipient, User } from '../models/index.js';
import { generateDocument } from '../services/documentGenerator.js';
import { loadGrants, hasGrant, logAccess, redactDocRow, CATEGORIES } from '../services/dataAccess.js';

const router = express.Router();

router.post('/generate', authMiddleware, staffOnly, async (req, res, next) => {
  try {
    const { docType, form } = req.body || {};
    if (!docType || !form) {
      return res.status(400).json({ message: 'Требуются docType и form' });
    }
    const { buffer, filename, contentType } = generateDocument(docType, form);
    const ext = filename.split('.').pop();
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="document.${ext}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.send(buffer);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

const recipientInclude = {
  model: Recipient,
  as: 'recipient',
  attributes: ['id', 'firstName', 'middleName', 'lastName']
};

router.get('/', authMiddleware, roleMiddleware('admin', 'teacher'), loadGrants, async (req, res, next) => {
  try {
    const docs = await RecipientDoc.findAll({
      include: [recipientInclude],
      order: [['id', 'DESC']]
    });
    if (docs.length) {
      await logAccess(req, {
        recipientId: null,
        category: 'passport',
        action: 'view',
        reasonText: `Общий список документов (${docs.length} записей)`
      });
    }
    res.json(docs.map((d) => redactDocRow(d, req)));
  } catch (err) {
    next(err);
  }
});

const DOC_FIELDS = [
  'recipientId', 'docType', 'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate',
  'snils', 'mseIssueDate', 'mseValidDate', 'mseIndefinite', 'regAddress', 'factAddress',
  'factSameReg', 'district', 'area', 'educationPlace', 'specialNote'
];

function pickFields(body) {
  const out = {};
  for (const key of DOC_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (out.mseIndefinite !== undefined) {
    out.mseIndefinite = out.mseIndefinite === true || out.mseIndefinite === 'true' || out.mseIndefinite === 1;
    if (out.mseIndefinite) out.mseValidDate = null;
  }
  if (out.mseValidDate === '') out.mseValidDate = null;
  return out;
}

const cmp = (v) => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'boolean') return v ? '1' : '0';
  return String(v);
};

function diffFields(doc, patch) {
  const changed = [];
  for (const [key, value] of Object.entries(patch)) {
    const before = doc.get(key);
    const isDate = /Date$/.test(key);
    const a = isDate ? String(before ?? '').slice(0, 10) : cmp(before);
    const b = isDate ? String(value ?? '').slice(0, 10) : cmp(value);
    if (a !== b) changed.push(key);
  }
  return changed;
}

const authorName = (u) =>
  u ? (u.fullName || [u.lastName, u.firstName].filter(Boolean).join(' ').trim() || u.email) : null;

router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const recipient = await Recipient.findOne({ where: { userId: req.user.id }, attributes: ['id'] });
    if (!recipient) return res.json([]);
    const docs = await RecipientDoc.findAll({ where: { recipientId: recipient.id } });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/recipient/:id', authMiddleware, staffOnly, loadGrants, async (req, res, next) => {
  try {
    const recipientId = Number(req.params.id);
    const docs = await RecipientDoc.findAll({ where: { recipientId } });
    if (docs.length) {
      await logAccess(req, { recipientId, category: 'passport', action: 'view' });
    }
    res.json(docs.map((d) => redactDocRow(d, req)));
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res, next) => {
  try {
    const fields = pickFields(req.body);
    const recipientId = Number(fields.recipientId);
    if (!Number.isInteger(recipientId) || recipientId <= 0) {
      return res.status(400).json({ message: 'Не указан реабилитант' });
    }
    const recipient = await Recipient.findByPk(recipientId, { attributes: ['id'] });
    if (!recipient) return res.status(404).json({ message: 'Реабилитант не найден' });

    const existing = await RecipientDoc.count({ where: { recipientId } });
    if (existing) {
      return res.status(409).json({
        message: 'У этого реабилитанта анкета документов уже заведена — правьте её в карточке реабилитанта'
      });
    }

    const doc = await RecipientDoc.create({ ...fields, recipientId });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/history', authMiddleware, roleMiddleware('admin', 'employee'), loadGrants, async (req, res, next) => {
  try {
    const doc = await RecipientDoc.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });

    if (!hasGrant(req, doc.recipientId, 'passport')) {
      await logAccess(req, { recipientId: doc.recipientId, category: 'passport', action: 'denied' });
      return res.status(403).json({
        message: 'Нет доступа к истории изменений. Откройте паспортные данные карточки с указанием причины.',
        category: 'passport'
      });
    }

    const versions = await RecipientDocVersion.findAll({
      where: { docId: doc.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'fullName'] }],
      order: [['changedAt', 'DESC'], ['id', 'DESC']]
    });

    await logAccess(req, {
      recipientId: doc.recipientId,
      category: 'passport',
      action: 'view',
      reasonText: 'История изменений документов'
    });

    res.json(versions.map((v) => ({
      id: v.id,
      docId: v.docId,
      recipientId: v.recipientId,
      reason: v.reason,
      changedFields: v.changedFields || [],
      changedAt: v.changedAt,
      changedBy: v.changedBy,
      authorName: authorName(v.author),
      snapshot: v.snapshot || null
    })));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res, next) => {
  try {
    const doc = await RecipientDoc.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });

    const reason = String(req.body?.reason ?? '').trim();
    if (reason.length < 3) {
      return res.status(400).json({
        message: 'Укажите причину обновления документов (обязательное поле, не менее 3 символов)',
        field: 'reason'
      });
    }

    const patch = pickFields(req.body);
    const changedFields = diffFields(doc, patch);
    if (!changedFields.length) {
      return res.status(400).json({ message: 'Данные документа не изменились' });
    }

    const snapshot = doc.toJSON();
    await RecipientDocVersion.create({
      docId: doc.id,
      recipientId: doc.recipientId,
      snapshot,
      changedFields,
      reason,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    await doc.update(patch);
    res.json({ doc, changedFields, reason });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authMiddleware, roleMiddleware('admin', 'employee'), async (req, res, next) => {
  try {
    const doc = await RecipientDoc.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });

    const reason = String(req.body?.reason ?? '').trim();
    if (reason.length < 3) {
      return res.status(400).json({
        message: 'Укажите причину удаления анкеты документов (не менее 3 символов)',
        field: 'reason'
      });
    }

    await RecipientDocVersion.create({
      docId: null,
      recipientId: doc.recipientId,
      snapshot: doc.toJSON(),
      changedFields: ['deleted'],
      reason,
      changedBy: req.user.id,
      changedAt: new Date()
    });

    await doc.destroy();
    res.json({ message: 'Документ удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
