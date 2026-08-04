
import sequelize from '../config/database.js';

import User from './User.js';
import ReGroup from './ReGroup.js';
import Nozology from './Nozology.js';
import CRG from './CRG.js';
import CRGDesc from './CRGDesc.js';
import CRGRecipientSec from './CRGRecipientSec.js';
import LegalRepresentative from './LegalRepresentative.js';
import Direction from './Direction.js';
import DocType from './DocType.js';
import Recipient from './Recipient.js';
import RecipientDoc from './RecipientDoc.js';
import RecipientDocVersion from './RecipientDocVersion.js';
import RecipientScanDoc from './RecipientScanDoc.js';
import ReResult from './ReResult.js';
import ScheduleEvent from './ScheduleEvent.js';
import DiagnosticAssignment from './DiagnosticAssignment.js';
import DiagnosticSession from './DiagnosticSession.js';
import DiagnosticConclusion from './DiagnosticConclusion.js';

Recipient.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasOne(Recipient, { as: 'recipient', foreignKey: 'userId' });

User.belongsTo(Direction, { as: 'direction', foreignKey: 'directionId' });

Recipient.belongsTo(ReGroup, { as: 'group', foreignKey: 'groupId' });
ReGroup.hasMany(Recipient, { as: 'recipients', foreignKey: 'groupId' });

Recipient.belongsTo(LegalRepresentative, { as: 'representative', foreignKey: 'representativeId' });
LegalRepresentative.hasMany(Recipient, { as: 'recipients', foreignKey: 'representativeId' });

Recipient.belongsTo(Nozology, { as: 'nozologyRef', foreignKey: 'nozology' });
Nozology.hasMany(Recipient, { as: 'recipients', foreignKey: 'nozology', inverse: { as: 'nozologyRef' } });

Recipient.belongsTo(CRG, { as: 'crgMain', foreignKey: 'CRGMain' });
CRG.hasMany(Recipient, { as: 'recipients', foreignKey: 'CRGMain' });

ReGroup.belongsTo(User, { as: 'curatorUser', foreignKey: 'curatorUserId' });
User.hasMany(ReGroup, { as: 'curatedGroups', foreignKey: 'curatorUserId' });

CRGDesc.belongsTo(CRG, { as: 'category', foreignKey: 'categoryId' });
CRG.hasMany(CRGDesc, { as: 'descriptions', foreignKey: 'categoryId' });

Recipient.belongsToMany(CRGDesc, {
  through: CRGRecipientSec, as: 'secondaryCRG',
  foreignKey: 'idRecipient', otherKey: 'idCRGDesc'
});
CRGDesc.belongsToMany(Recipient, {
  through: CRGRecipientSec, as: 'recipients',
  foreignKey: 'idCRGDesc', otherKey: 'idRecipient'
});

RecipientDoc.belongsTo(Recipient, { as: 'recipient', foreignKey: 'recipientId' });
Recipient.hasMany(RecipientDoc, { as: 'docs', foreignKey: 'recipientId' });

RecipientDocVersion.belongsTo(RecipientDoc, { as: 'doc', foreignKey: 'docId' });
RecipientDoc.hasMany(RecipientDocVersion, { as: 'versions', foreignKey: 'docId' });
RecipientDocVersion.belongsTo(User, { as: 'author', foreignKey: 'changedBy' });

RecipientScanDoc.belongsTo(Recipient, { as: 'recipient', foreignKey: 'recipId' });
RecipientScanDoc.belongsTo(LegalRepresentative, { as: 'representative', foreignKey: 'represId' });
RecipientScanDoc.belongsTo(DocType, { as: 'docTypeRef', foreignKey: 'docType' });
RecipientScanDoc.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
Recipient.hasMany(RecipientScanDoc, { as: 'scans', foreignKey: 'recipId' });

ReResult.belongsTo(Recipient, { as: 'recipient', foreignKey: 'idRecipient' });
ReResult.belongsTo(Direction, { as: 'direction', foreignKey: 'idDirection' });
ReResult.belongsTo(User, { as: 'specialist', foreignKey: 'idSpecialist' });
Recipient.hasMany(ReResult, { as: 'results', foreignKey: 'idRecipient' });

DiagnosticAssignment.belongsTo(Recipient, { as: 'recipient', foreignKey: 'recipientId' });
DiagnosticAssignment.belongsTo(Direction, { as: 'direction', foreignKey: 'directionId' });
DiagnosticAssignment.belongsTo(User, { as: 'specialist', foreignKey: 'specialistUserId' });
Recipient.hasMany(DiagnosticAssignment, { as: 'assignments', foreignKey: 'recipientId' });

ScheduleEvent.belongsTo(User, { as: 'specialist', foreignKey: 'specialistUserId' });
ScheduleEvent.belongsTo(Recipient, { as: 'recipient', foreignKey: 'recipientId' });
ScheduleEvent.belongsTo(Direction, { as: 'direction', foreignKey: 'directionId' });
ScheduleEvent.belongsTo(DiagnosticAssignment, { as: 'assignment', foreignKey: 'assignmentId' });
DiagnosticAssignment.hasOne(ScheduleEvent, { as: 'event', foreignKey: 'assignmentId' });

DiagnosticSession.belongsTo(Recipient, { as: 'recipient', foreignKey: 'recipientId' });
Recipient.hasMany(DiagnosticSession, { as: 'diagnosticSessions', foreignKey: 'recipientId' });
DiagnosticSession.belongsTo(User, { as: 'author', foreignKey: 'createdBy' });

DiagnosticSession.hasMany(DiagnosticAssignment, { as: 'assignments', foreignKey: 'diagnosticSessionId' });
DiagnosticAssignment.belongsTo(DiagnosticSession, { as: 'session', foreignKey: 'diagnosticSessionId' });

DiagnosticConclusion.belongsTo(DiagnosticSession, { as: 'session', foreignKey: 'sessionId' });
DiagnosticSession.hasOne(DiagnosticConclusion, { as: 'conclusion', foreignKey: 'sessionId' });
DiagnosticConclusion.belongsTo(Recipient, { as: 'recipient', foreignKey: 'recipientId' });
DiagnosticConclusion.belongsTo(User, { as: 'author', foreignKey: 'authorId' });

export {
  sequelize,
  User,
  ReGroup,
  Nozology,
  CRG,
  CRGDesc,
  CRGRecipientSec,
  LegalRepresentative,
  Direction,
  DocType,
  Recipient,
  RecipientDoc,
  RecipientDocVersion,
  RecipientScanDoc,
  ReResult,
  ScheduleEvent,
  DiagnosticAssignment,
  DiagnosticSession,
  DiagnosticConclusion
};
