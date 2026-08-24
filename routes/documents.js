import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import { RecipientDoc, RecipientDocVersion, Recipient, User } from '../models/index.js';
import { generateDocument } from '../services/documentGenerator.js';

const router = express.Router();

router.post('/generate', authMiddleware, async (req, res, next) => {
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

router.get('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res, next) => {
  try {
    const docs = await RecipientDoc.findAll({
      include: [recipientInclude],
      order: [['id', 'DESC']]
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

const DOC_FIELDS = [
  'recipientId', 'docType', 'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate',
  'snils', 'mseIssueDate', 'mseValidDate', 'mseIndefinite', 'regAddress', 'factAddress',
  'factSameReg', 'educationPlace', 'specialNote'
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

router.get('/recipient/:id', authMiddleware, async (req, res, next) => {
  try {
    const docs = await RecipientDoc.findAll({ where: { recipientId: req.params.id } });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const doc = await RecipientDoc.create(pickFields(req.body));
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/history', authMiddleware, async (req, res, next) => {
  try {
    const doc = await RecipientDoc.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Документ не найден' });
    const versions = await RecipientDocVersion.findAll({
      where: { docId: doc.id },
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email', 'fullName'] }],
      order: [['changedAt', 'DESC'], ['id', 'DESC']]
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
    await RecipientDocVersion.destroy({ where: { docId: doc.id } });
    await doc.destroy();
    res.json({ message: 'Документ удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
