import express from 'express';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import {
  User, Recipient, ReGroup, Specialist, Direction, Nozology,
  ReResult, RecipientDoc
} from '../models/index.js';

const router = express.Router();

function recipientFullName(r) {
  return [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ') || 'Без имени';
}

router.get('/admin-stats', authMiddleware, roleMiddleware('admin'), async (req, res, next) => {
  try {
    const [
      usersCount, recipientsCount, groupsCount, specialistsCount,
      resultsCount, docsCount, directionsCount, nozologyCount
    ] = await Promise.all([
      User.count(), Recipient.count(), ReGroup.count(), Specialist.count(),
      ReResult.count(), RecipientDoc.count(), Direction.count(), Nozology.count()
    ]);

    const users = await User.findAll({ attributes: ['role'], raw: true });
    const roleCounts = { admin: 0, teacher: 0, employee: 0, recipient: 0 };
    users.forEach(u => {
      if (roleCounts[u.role] != null) roleCounts[u.role] += 1;
    });

    const recipients = await Recipient.findAll({ attributes: ['status'], raw: true });
    const statusCounts = { draft: 0, active: 0, archived: 0 };
    recipients.forEach(r => {
      if (statusCounts[r.status] != null) statusCounts[r.status] += 1;
    });

    res.json({
      records: [
        { key: 'users',       label: 'Пользователи', value: usersCount },
        { key: 'recipients',  label: 'Реабилитанты', value: recipientsCount },
        { key: 'groups',      label: 'Группы',       value: groupsCount },
        { key: 'specialists', label: 'Специалисты',  value: specialistsCount },
        { key: 'results',     label: 'Результаты',   value: resultsCount },
        { key: 'documents',   label: 'Документы',    value: docsCount },
        { key: 'directions',  label: 'Направления',  value: directionsCount },
        { key: 'nozology',    label: 'Нозологии',    value: nozologyCount }
      ],
      roles: roleCounts,
      recipientStats: {
        total: recipientsCount,
        activeCount: statusCounts.active,
        draftCount: statusCounts.draft,
        archivedCount: statusCounts.archived
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/stats', authMiddleware, async (req, res, next) => {
  try {
    const recipients = await Recipient.findAll({ attributes: ['status'], raw: true });
    const statusCounts = { draft: 0, active: 0, archived: 0 };
    recipients.forEach(r => {
      if (statusCounts[r.status] != null) statusCounts[r.status] += 1;
    });

    const groupsCount = await ReGroup.count();
    const resultsTotal = await ReResult.count();
    const resultsPublished = await ReResult.count({ where: { published: true } });

    res.json({
      stats: {
        recipients: recipients.length,
        activeCount: statusCounts.active,
        draftCount: statusCounts.draft,
        archivedCount: statusCounts.archived,
        groups: groupsCount,
        resultsTotal,
        resultsPublished,
        resultsPending: Math.max(0, resultsTotal - resultsPublished)
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/missing-docs', authMiddleware, async (req, res, next) => {
  try {
    const recipients = await Recipient.findAll({
      attributes: ['id', 'firstName', 'middleName', 'lastName'],
      include: [{
        model: ReGroup,
        as: 'group',
        attributes: ['id', 'groupName'],
        include: [{ model: Specialist, as: 'curatorRef', attributes: ['fullName'] }]
      }],
      order: [['id', 'DESC']]
    });

    const allDocs = await RecipientDoc.findAll({ attributes: ['recipientId'], raw: true });
    const countMap = {};
    allDocs.forEach(d => {
      if (d.recipientId != null) {
        countMap[d.recipientId] = (countMap[d.recipientId] || 0) + 1;
      }
    });

    const list = recipients.map(r => ({
      id: r.id,
      fullName: recipientFullName(r),
      groupName: r.group?.groupName || '—',
      curator: r.group?.curatorRef?.fullName || '—',
      docCount: countMap[r.id] || 0
    }));

    list.sort((a, b) => a.docCount - b.docCount);
    const missingCount = list.filter(r => r.docCount === 0).length;

    res.json({ list: list.slice(0, 5), missingCount });
  } catch (err) {
    next(err);
  }
});

router.get('/diagnostics', authMiddleware, async (req, res, next) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim().toLowerCase();

    const results = await ReResult.findAll({
      include: [
        { model: Recipient, as: 'recipient', attributes: ['id', 'firstName', 'middleName', 'lastName'] },
        { model: Direction, as: 'direction', attributes: ['id', 'name'] },
        { model: Specialist, as: 'specialist', attributes: ['id', 'fullName'] }
      ],
      order: [['date', 'DESC']]
    });

    let enriched = results.map(r => ({
      id: r.id,
      date: r.date,
      published: r.published,
      results: r.results,
      recipientName: r.recipient ? recipientFullName(r.recipient) : 'Неизвестно',
      direction: r.direction?.name || '—',
      specialist: r.specialist?.fullName || '—'
    }));

    if (search) {
      enriched = enriched.filter(d =>
        d.recipientName.toLowerCase().includes(search) ||
        d.direction.toLowerCase().includes(search) ||
        d.specialist.toLowerCase().includes(search)
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
