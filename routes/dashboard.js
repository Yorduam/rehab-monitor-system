import express from 'express';
import { Op } from '@sequelize/core';
import { authMiddleware } from '../middleware/auth.js';
import Recipient from '../models/Recipient.js';
import Group from '../models/Group.js';
import Diagnostic from '../models/Diagnostic.js';
import Document from '../models/Document.js';

const router = express.Router();

/* ── GET /dashboard/stats ─────────────────────────────────── */
router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const recipientsCount = await Recipient.count();
    const activeCount    = await Recipient.count({ where: { completionStatus: 'in_progress' } });
    const completedCount = await Recipient.count({ where: { completionStatus: 'completed' } });
    const pendingCount   = Math.max(0, recipientsCount - activeCount - completedCount);

    const groupsCount    = await Group.count();
    const newRecipients  = await Recipient.count({
      where: { createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });

    const diagDone    = await Diagnostic.count({ where: { status: 'done' } });
    const diagPlanned = await Diagnostic.count({ where: { status: 'planned' } });

    res.json({
      stats: {
        recipients: recipientsCount,
        activeCount,
        pendingCount,
        completedCount,
        newRecipients,
        groups: groupsCount,
        diagDone,
        diagPlanned,
        lessonsThisWeek: 0
      }
    });
  } catch (err) {
    next(err);
  }
});

/* ── GET /dashboard/missing-docs ──────────────────────────── */
router.get('/missing-docs', authMiddleware, async (req, res, next) => {
  try {
    const recipients = await Recipient.findAll({
      attributes: ['id', 'fullName', 'groupName', 'curator'],
      order: [['createdAt', 'DESC']],
      raw: true
    });

    // JS-side count — avoids GROUP BY / ONLY_FULL_GROUP_BY issues
    const allDocs = await Document.findAll({ attributes: ['recipientId'], raw: true });
    const countMap = {};
    allDocs.forEach(d => {
      if (d.recipientId != null) {
        countMap[d.recipientId] = (countMap[d.recipientId] || 0) + 1;
      }
    });

    const list = recipients.map(r => ({
      id:        r.id,
      fullName:  r.fullName  || 'Без имени',
      groupName: r.groupName || '—',
      curator:   r.curator   || '—',
      docCount:  countMap[r.id] || 0
    }));

    // Sort: missing (0) first, then ascending doc count
    list.sort((a, b) => a.docCount - b.docCount);

    const missingCount = list.filter(r => r.docCount === 0).length;

    res.json({ list: list.slice(0, 5), missingCount });
  } catch (err) {
    next(err);
  }
});

/* ── GET /dashboard/diagnostics ───────────────────────────── */
router.get('/diagnostics', authMiddleware, async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const statusFilter = req.query.status || 'all';

    const where = {};
    if (statusFilter !== 'all') where.status = statusFilter;

    const allDiagnostics = await Diagnostic.findAll({
      where,
      order: [['date', 'DESC'], ['time', 'ASC']],
      raw: true
    });

    // Enrich with recipient data (JS-side join — safe for all MySQL modes)
    const allRecipients = await Recipient.findAll({
      attributes: ['id', 'fullName', 'groupName'],
      raw: true
    });
    const recipientMap = {};
    allRecipients.forEach(r => { recipientMap[r.id] = r; });

    let enriched = allDiagnostics.map(d => ({
      ...d,
      recipientName: recipientMap[d.recipientId]?.fullName || 'Неизвестно',
      groupName:     recipientMap[d.recipientId]?.groupName || '—'
    }));

    if (search) {
      const q = search.toLowerCase();
      enriched = enriched.filter(d =>
        d.recipientName.toLowerCase().includes(q) ||
        (d.name       || '').toLowerCase().includes(q) ||
        (d.specialist || '').toLowerCase().includes(q)
      );
    }

    const total      = enriched.length;
    const paginated  = enriched.slice(offset, offset + limit);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({ data: paginated, total, page, limit, totalPages });
  } catch (err) {
    next(err);
  }
});

export default router;
