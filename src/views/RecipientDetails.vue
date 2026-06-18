<template>
  <div class="rd-page">
    <div v-if="loading" class="rd-loading">
      <div class="spinner"></div>
      <p>Загрузка профиля…</p>
    </div>

    <div v-else-if="!recipient" class="rd-empty">
      <p>Реабилитант не найден</p>
      <button class="btn-secondary" @click="goBack">← К списку</button>
    </div>

    <template v-else>

      <div class="rd-breadcrumb">
        <span class="rd-bc-link" @click="goBack">Реабилитанты</span>
        <span class="rd-bc-sep">/</span>
        <span class="rd-bc-curr">{{ fullName(recipient) }}</span>
      </div>

      <section class="rd-hero">
        <img v-if="photoUrl" :src="photoUrl" class="rd-avatar-img" alt="" />
        <div v-else class="rd-avatar">{{ initials(recipient) }}</div>
        <div class="rd-hero-info">
          <div class="rd-hero-top">
            <span class="rd-id-chip">R-{{ recipientCode }}</span>
            <span class="rd-status" :class="'rd-status-' + (recipient.status || 'draft')">{{ statusLabel(recipient.status) }}</span>
          </div>
          <h1 class="rd-name">{{ fullName(recipient) }}</h1>
          <div class="rd-tags">
            <span v-if="age != null" class="badge badge-gray">{{ age }} лет</span>
            <span v-if="recipient.diagnosis" class="badge badge-blue">{{ recipient.diagnosis }}</span>
            <span v-if="groupName" class="badge badge-gray">{{ groupName }}</span>
            <span v-if="curatorName" class="badge badge-gray">Куратор: {{ curatorName }}</span>
          </div>
        </div>
      </section>

      <nav class="rd-tabs">
        <button v-for="t in tabs" :key="t.id"
          :class="['rd-tab', { active: activeTab === t.id }]"
          @click="activeTab = t.id">{{ t.label }}</button>
      </nav>

      <div v-if="activeTab === 'overview'" class="rd-card">
        <div class="rd-card-head"><h2>Ключевые сведения</h2></div>
        <div class="rd-card-body">
          <dl class="rd-kv-grid">
            <div class="rd-kv"><dt>Дата рождения</dt><dd>{{ formatDate(recipient.birthDate) }}{{ age != null ? ` · ${age} лет` : '' }}</dd></div>
            <div class="rd-kv"><dt>Статус</dt><dd>{{ statusLabel(recipient.status) }}</dd></div>
            <div class="rd-kv"><dt>Телефон</dt><dd>{{ recipient.telephone || '—' }}</dd></div>
            <div class="rd-kv"><dt>E-mail</dt><dd>{{ recipient.email || recipient.user?.email || '—' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Диагноз</dt><dd>{{ recipient.diagnosis || '—' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Нозология</dt><dd>{{ nozologyText }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>ЦРГ (основная)</dt><dd>{{ crgText }}</dd></div>
            <div v-if="secondaryCrgText" class="rd-kv rd-kv-full"><dt>ЦРГ (дополнительные)</dt><dd>{{ secondaryCrgText }}</dd></div>
            <div class="rd-kv"><dt>Группа</dt><dd>{{ groupName || '—' }}</dd></div>
            <div class="rd-kv"><dt>Куратор</dt><dd>{{ curatorName || '—' }}</dd></div>
            <div v-if="doc" class="rd-kv"><dt>СНИЛС</dt><dd>{{ doc.snils || '—' }}</dd></div>
            <div v-if="doc" class="rd-kv"><dt>Место обучения</dt><dd>{{ doc.educationPlace || '—' }}</dd></div>
          </dl>
        </div>
      </div>

      <div v-else-if="activeTab === 'documents'" class="rd-card">
        <div class="rd-card-head"><h2>Документы</h2></div>
        <div class="rd-card-body">
          <div v-if="!doc" class="rd-inline-empty">Документ не заполнен</div>
          <dl v-else class="rd-kv-grid">
            <div class="rd-kv"><dt>Тип документа</dt><dd>{{ doc.docType || '—' }}</dd></div>
            <div class="rd-kv"><dt>Серия / номер</dt><dd>{{ [doc.docSeries, doc.docNumber].filter(Boolean).join(' ') || '—' }}</dd></div>
            <div class="rd-kv"><dt>Кем выдан</dt><dd>{{ doc.docIssuer || '—' }}</dd></div>
            <div class="rd-kv"><dt>Дата выдачи</dt><dd>{{ formatDate(doc.docIssuerDate) }}</dd></div>
            <div class="rd-kv"><dt>СНИЛС</dt><dd>{{ doc.snils || '—' }}</dd></div>
            <div class="rd-kv"><dt>МСЭ выдана</dt><dd>{{ formatDate(doc.mseIssueDate) }}</dd></div>
            <div class="rd-kv"><dt>МСЭ действительна до</dt><dd>{{ formatDate(doc.mseValidDate) }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Адрес регистрации</dt><dd>{{ doc.regAddress || '—' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Адрес проживания</dt><dd>{{ (doc.factSameReg ? doc.regAddress : doc.factAddress) || '—' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Место обучения</dt><dd>{{ doc.educationPlace || '—' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Особые отметки</dt><dd>{{ doc.specialNote || '—' }}</dd></div>
          </dl>
        </div>
      </div>

      <div v-else-if="activeTab === 'group'" class="rd-card">
        <div class="rd-card-head">
          <h2>{{ groupName || 'Группа не назначена' }}</h2>
          <span v-if="curatorName" class="rd-card-sub">Куратор: {{ curatorName }}</span>
        </div>
        <div class="rd-card-body">
          <div class="rd-group-select">
            <label class="rd-gs-label">Выбрать группу</label>
            <div class="rd-gs-row">
              <select v-model.number="selectedGroupId" class="rd-gs-input" :disabled="groupsLoading || savingGroup">
                <option v-if="groupsLoading" :value="null" disabled>Загрузка групп…</option>
                <option v-for="g in allGroups" :key="g.id" :value="g.id">
                  {{ g.name }}{{ g.curator ? ' · ' + g.curator : '' }}
                </option>
              </select>
              <button class="btn-primary" :disabled="!groupChanged || savingGroup" @click="saveGroup">
                {{ savingGroup ? 'Сохранение…' : 'Сохранить' }}
              </button>
            </div>
          </div>

          <div v-if="!recipient.groupId" class="rd-inline-empty">Реабилитант не состоит в группе</div>
          <div v-else-if="groupMembersLoading" class="rd-loading" style="min-height:120px"><div class="spinner"></div></div>
          <div v-else-if="!groupMembers.length" class="rd-inline-empty">В группе пока нет участников</div>
          <div v-else class="rd-members">
            <div v-for="m in groupMembers" :key="m.id" :class="['rd-member', { self: m.id == recipientId }]">
              <img v-if="m.photo" :src="m.photo" class="rd-member-av-img" alt="" />
              <div v-else class="rd-member-av">{{ initials(m) }}</div>
              <div class="rd-member-info">
                <div class="rd-member-name">{{ fullName(m) }}<span v-if="m.id == recipientId" class="rd-self-badge">текущий</span></div>
                <div class="rd-member-meta">{{ memberMeta(m) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'representative'" class="rd-card">
        <div class="rd-card-head"><h2>Законный представитель</h2></div>
        <div class="rd-card-body">
          <div v-if="!recipient.representative" class="rd-inline-empty">Представитель не указан</div>
          <dl v-else class="rd-kv-grid">
            <div class="rd-kv rd-kv-full"><dt>ФИО</dt><dd>{{ fullName(recipient.representative) || '—' }}</dd></div>
            <div class="rd-kv"><dt>Телефон</dt><dd>{{ recipient.representative.telephone || '—' }}</dd></div>
            <div class="rd-kv"><dt>E-mail</dt><dd>{{ recipient.representative.email || '—' }}</dd></div>
            <div class="rd-kv"><dt>Паспорт серия / номер</dt><dd>{{ [recipient.representative.passportSeries, recipient.representative.passportNumber].filter(Boolean).join(' ') || '—' }}</dd></div>
            <div class="rd-kv"><dt>Код подразделения</dt><dd>{{ recipient.representative.passportDeptCode || '—' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Кем выдан</dt><dd>{{ recipient.representative.passportIssuer || '—' }}{{ recipient.representative.passportIssuerDate ? ` · ${formatDate(recipient.representative.passportIssuerDate)}` : '' }}</dd></div>
            <div class="rd-kv rd-kv-full"><dt>Адрес регистрации</dt><dd>{{ recipient.representative.passportReg || '—' }}</dd></div>
          </dl>
        </div>
      </div>

      <div v-else-if="activeTab === 'diagnostics'" class="rd-card">
        <div class="rd-card-head"><h2>Назначение на диагностику</h2></div>
        <div class="rd-card-body">
          <div class="rd-assign">
            <div class="rd-assign-grid">
              <label class="rd-assign-field">
                <span class="rd-assign-label">Направление</span>
                <select v-model.number="assignForm.directionId" class="rd-gs-input" :disabled="directionsLoading || assigning">
                  <option :value="null" disabled>{{ directionsLoading ? 'Загрузка…' : 'Выберите направление' }}</option>
                  <option v-for="d in directions" :key="d.id" :value="d.id">{{ d.name }}</option>
                </select>
              </label>
              <label class="rd-assign-field">
                <span class="rd-assign-label">Психолог / специалист</span>
                <select v-model.number="assignForm.specialistId" class="rd-gs-input" :disabled="specialistsLoading || assigning">
                  <option :value="null" disabled>{{ specialistsLoading ? 'Загрузка…' : 'Выберите специалиста' }}</option>
                  <option v-for="s in specialists" :key="s.id" :value="s.id">{{ s.fullName }}{{ s.cabinet ? ' · каб. ' + s.cabinet : '' }}</option>
                </select>
              </label>
              <label class="rd-assign-field">
                <span class="rd-assign-label">Дата</span>
                <input type="date" v-model="assignForm.date" :min="todayStr" class="rd-gs-input" :disabled="assigning" />
              </label>
              <div class="rd-assign-action">
                <button class="btn-primary" :disabled="!canAssign || assigning" @click="createAssignment">
                  {{ assigning ? 'Назначение…' : 'Назначить' }}
                </button>
              </div>
            </div>
            <p v-if="assignError" class="rd-assign-err">{{ assignError }}</p>
          </div>

          <h3 class="rd-assign-subtitle">Назначенные диагностики</h3>
          <div v-if="assignmentsLoading" class="rd-loading" style="min-height:80px"><div class="spinner"></div></div>
          <div v-else-if="!assignments.length" class="rd-inline-empty">Пока нет назначений</div>
          <table v-else class="rd-assign-table">
            <thead>
              <tr><th>Направление</th><th>Специалист</th><th>Дата</th><th>Статус</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="a in assignments" :key="a.id">
                <td>{{ a.direction?.name || '—' }}</td>
                <td>{{ a.specialist?.fullName || '—' }}</td>
                <td>{{ formatDate(a.date) }}</td>
                <td><span :class="['rd-status-badge', a.published ? 'done' : 'pending']">{{ a.published ? 'Проведена' : 'Назначена' }}</span></td>
                <td>
                  <button v-if="!a.published" class="rd-cancel-btn" :disabled="cancelingId === a.id" @click="cancelAssignment(a)">
                    {{ cancelingId === a.id ? '…' : 'Отменить' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <template v-if="publishedAssignments.length">
            <h3 class="rd-assign-subtitle" style="margin-top: 1.75rem;">Результаты проведённых диагностик</h3>
            <div v-for="a in publishedAssignments" :key="'res-' + a.id" class="rd-result">
              <div class="rd-result-head">
                <span class="rd-result-dir">{{ a.direction?.name || '—' }}</span>
                <span class="rd-result-meta">{{ a.specialist?.fullName || '—' }} · {{ formatDate(a.date) }}</span>
              </div>
              <div v-if="!resultBlocks(a).length" class="rd-result-empty">Результаты не заполнены</div>
              <div v-else>
                <div v-for="(b, i) in resultBlocks(a)" :key="i" class="rd-result-block">
                  <div class="rd-result-block-title">{{ blockTitle(b) }}</div>
                  <div v-if="b.specialists && b.specialists.length" class="rd-result-spec">
                    Специалисты: {{ b.specialists.join(', ') }}
                  </div>
                  <p v-if="b.recs" class="rd-result-recs">{{ b.recs }}</p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="rd-footer">
        <span>ID R-{{ recipientCode }}</span>
        <button class="btn-secondary" @click="goBack">← К списку</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePageStore } from '../stores/page';
import api from '../api';
import { fullName, initials, recipientAge, statusLabel } from '../utils/recipient';

const pageStore = usePageStore();
const recipientId = pageStore.params?.recipientId;

const loading = ref(true);
const recipient = ref(null);
const groupMembers = ref([]);
const groupMembersLoading = ref(false);
const activeTab = ref('overview');

const allGroups = ref([]);
const groupsLoading = ref(false);
const selectedGroupId = ref(null);
const savingGroup = ref(false);

const directions = ref([]);
const directionsLoading = ref(false);
const specialists = ref([]);
const specialistsLoading = ref(false);
const assignments = ref([]);
const assignmentsLoading = ref(false);
const assigning = ref(false);
const cancelingId = ref(null);
const assignError = ref('');
const assignForm = ref({ directionId: null, specialistId: null, date: '' });
const todayStr = new Date().toISOString().slice(0, 10);
const canAssign = computed(() =>
  !!assignForm.value.directionId && !!assignForm.value.specialistId && !!assignForm.value.date
);
const publishedAssignments = computed(() => assignments.value.filter(a => a.published));

const groupChanged = computed(
  () => (selectedGroupId.value ?? null) !== (recipient.value?.groupId ?? null)
);

const tabs = [
  { id: 'overview', label: 'Обзор' },
  { id: 'documents', label: 'Документы' },
  { id: 'group', label: 'Группа' },
  { id: 'representative', label: 'Представитель' },
  { id: 'diagnostics', label: 'Диагностики' },
];

const doc = computed(() => recipient.value?.docs?.[0] || null);
const age = computed(() => recipientAge(recipient.value));
const groupName = computed(() => recipient.value?.group?.groupName || '');
const curatorName = computed(() => recipient.value?.group?.curatorRef?.fullName || '');
const photoUrl = computed(() => {
  const p = recipient.value?.photo;
  return p && /^(https?:|data:)/.test(p) ? p : '';
});
const recipientCode = computed(() =>
  recipient.value?.id ? String(recipient.value.id).padStart(6, '0') : '000000'
);

const nozologyText = computed(() => {
  const n = recipient.value?.nozologyRef;
  if (!n) return '—';
  return [n.class, n.name, n.code].filter(Boolean).join(' · ') || '—';
});

const crgText = computed(() => {
  const c = recipient.value?.crgMain;
  if (!c) return '—';
  const label = [c.code, c.name].filter(Boolean).join(' · ');
  return (label || '—') + (c.child ? ' (детская)' : '');
});

const secondaryCrgText = computed(() => {
  const list = recipient.value?.secondaryCRG;
  if (!Array.isArray(list) || !list.length) return '';
  return list.map(c => [c.code, c.name].filter(Boolean).join(' ')).filter(Boolean).join(', ');
});

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const m = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;
}

function memberMeta(m) {
  const a = recipientAge(m);
  return [a != null ? `${a} лет` : '', m.diagnosis || ''].filter(Boolean).join(' · ');
}

// Заполненные блоки результата диагностики (results.blocks из формы Diagnostics.vue).
// Показываем только блоки с реальным содержимым (рекомендации или специалисты).
function resultBlocks(a) {
  const blocks = a?.results?.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.filter(b =>
    (b && typeof b.recs === 'string' && b.recs.trim()) ||
    (b && Array.isArray(b.specialists) && b.specialists.length)
  );
}

function blockTitle(b) {
  return String(b?.sub || b?.direction || 'Блок').replace(/\s*\n\s*/g, ' ').trim();
}

const goBack = () => {
  pageStore.setPage('recipients', 'Реабилитанты', {});
};

const loadRecipient = async () => {
  if (!recipientId) { loading.value = false; return; }
  try {
    const { data } = await api.get(`/recipients/${recipientId}`);
    recipient.value = data;
    selectedGroupId.value = data.groupId ?? null;
  } catch (err) {
    console.error('loadRecipient', err);
  } finally {
    loading.value = false;
  }
};

const loadGroups = async () => {
  if (allGroups.value.length || groupsLoading.value) return;
  groupsLoading.value = true;
  try {
    const { data } = await api.get('/groups', { params: { limit: 200 } });
    allGroups.value = Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('loadGroups', err);
    allGroups.value = [];
  } finally {
    groupsLoading.value = false;
  }
};

const saveGroup = async () => {
  if (!groupChanged.value) return;
  savingGroup.value = true;
  try {
    const { data } = await api.put(`/recipients/${recipientId}`, { groupId: selectedGroupId.value });
    recipient.value = data;
    selectedGroupId.value = data.groupId ?? null;
    groupMembers.value = [];
    await loadGroupMembers();
  } catch (err) {
    console.error('saveGroup', err);
    alert('Не удалось сохранить группу');
  } finally {
    savingGroup.value = false;
  }
};

const loadGroupMembers = async () => {
  const gId = recipient.value?.groupId;
  if (!gId) return;
  groupMembersLoading.value = true;
  try {
    const { data } = await api.get(`/groups/${gId}/recipients`);
    groupMembers.value = Array.isArray(data) ? data : [];
  } catch {
    groupMembers.value = [];
  } finally {
    groupMembersLoading.value = false;
  }
};

const loadDiagnosticRefs = async () => {
  if (!directions.value.length && !directionsLoading.value) {
    directionsLoading.value = true;
    try {
      const { data } = await api.get('/lists/directions');
      directions.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('loadDirections', err);
      directions.value = [];
    } finally {
      directionsLoading.value = false;
    }
  }
  if (!specialists.value.length && !specialistsLoading.value) {
    specialistsLoading.value = true;
    try {
      const { data } = await api.get('/lists/curators');
      specialists.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('loadSpecialists', err);
      specialists.value = [];
    } finally {
      specialistsLoading.value = false;
    }
  }
};

const loadAssignments = async () => {
  if (!recipientId) return;
  assignmentsLoading.value = true;
  try {
    const { data } = await api.get('/diagnostics', { params: { recipientId, limit: 100 } });
    assignments.value = Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('loadAssignments', err);
    assignments.value = [];
  } finally {
    assignmentsLoading.value = false;
  }
};

const createAssignment = async () => {
  if (!canAssign.value || assigning.value) return;
  assigning.value = true;
  assignError.value = '';
  try {
    await api.post('/diagnostics', {
      idRecipient: Number(recipientId),
      idDirection: assignForm.value.directionId,
      idSpecialist: assignForm.value.specialistId,
      date: assignForm.value.date,
      results: {},
      published: false
    });
    assignForm.value = { directionId: null, specialistId: null, date: '' };
    await loadAssignments();
  } catch (err) {
    console.error('createAssignment', err);
    assignError.value = err?.response?.data?.message || 'Не удалось создать назначение';
  } finally {
    assigning.value = false;
  }
};

const cancelAssignment = async (a) => {
  if (cancelingId.value) return;
  cancelingId.value = a.id;
  try {
    await api.delete(`/diagnostics/${a.id}`);
    await loadAssignments();
  } catch (err) {
    console.error('cancelAssignment', err);
    alert('Не удалось отменить назначение');
  } finally {
    cancelingId.value = null;
  }
};

watch(activeTab, (tab) => {
  if (tab === 'group') {
    loadGroups();
    if (!groupMembers.value.length && !groupMembersLoading.value) loadGroupMembers();
  } else if (tab === 'diagnostics') {
    loadDiagnosticRefs();
    loadAssignments();
  }
});

onMounted(loadRecipient);
</script>

<style scoped>
.rd-page { max-width: 1000px; margin: 0 auto; }
.rd-loading, .rd-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 300px; gap: 1rem; color: var(--text-secondary);
}
.spinner {
  width: 40px; height: 40px;
  border: 4px solid rgba(75, 86, 117, 0.2);
  border-top-color: #4b5675; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.rd-breadcrumb {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem;
}
.rd-bc-link { cursor: pointer; }
.rd-bc-link:hover { color: var(--text-primary); text-decoration: underline; }
.rd-bc-curr { color: var(--text-primary); font-weight: 600; }

.rd-hero {
  display: flex; align-items: center; gap: 1.25rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 1.25rem;
}
.rd-avatar, .rd-avatar-img {
  width: 84px; height: 84px; border-radius: 50%; flex-shrink: 0;
}
.rd-avatar {
  display: grid; place-items: center;
  background: var(--bg-surface-sunken); color: var(--text-primary);
  font-size: 1.8rem; font-weight: 700;
}
.rd-avatar-img { object-fit: cover; }
.rd-hero-info { min-width: 0; }
.rd-hero-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
.rd-id-chip {
  font-size: 0.7rem; font-weight: 600; letter-spacing: 0.04em;
  background: var(--bg-surface-sunken); color: var(--text-secondary);
  padding: 0.15rem 0.5rem; border-radius: 4px;
}
.rd-status { font-size: 0.75rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 20px; }
.rd-status-draft { background: #e9f0fa; color: #2c4c7c; }
.rd-status-active { background: #cce5ff; color: #0a2f5a; }
.rd-status-archived { background: #eee; color: #666; }
.rd-name { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.5rem; word-break: break-word; }
.rd-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.badge { font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 20px; font-weight: 500; }
.badge-blue { background: #d4e6ff; color: #1a3a6b; }
.badge-gray { background: #e9f0fa; color: #2c4c7c; }

.rd-tabs {
  display: flex; gap: 0.25rem; flex-wrap: wrap;
  border-bottom: 1px solid var(--border); margin-bottom: 1.25rem;
}
.rd-tab {
  padding: 0.6rem 0.9rem; background: none; border: none; cursor: pointer;
  font-size: 0.9rem; font-weight: 500; color: var(--text-secondary);
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.rd-tab:hover { color: var(--text-primary); }
.rd-tab.active { color: var(--text-primary); border-bottom-color: #4b5675; font-weight: 600; }

.rd-card {
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); overflow: hidden;
}
.rd-card-head {
  padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
  display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap;
}
.rd-card-head h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
.rd-card-sub { font-size: 0.8rem; color: var(--text-secondary); }
.rd-card-body { padding: 1.5rem; }

.rd-kv-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.25rem 1.5rem; margin: 0; }
.rd-kv { padding: 0.6rem 0; border-bottom: 1px solid var(--border-light); min-width: 0; }
.rd-kv-full { grid-column: 1 / -1; }
.rd-kv dt { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--text-tertiary); margin-bottom: 0.25rem; }
.rd-kv dd { margin: 0; font-size: 0.92rem; color: var(--text-primary); word-break: break-word; }

.rd-inline-empty { text-align: center; padding: 1.5rem; color: var(--text-secondary); }

.rd-group-select { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); }
.rd-gs-label { display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--text-tertiary); margin-bottom: 0.5rem; }
.rd-gs-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.rd-gs-input {
  flex: 1 1 240px; min-width: 0;
  padding: 0.55rem 0.75rem; font-size: 0.92rem;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: var(--bg-surface); color: var(--text-primary); cursor: pointer;
}
.rd-gs-input:disabled { opacity: 0.6; cursor: default; }
.btn-primary {
  background: #4b5675; border: 1px solid #4b5675; color: #fff;
  padding: 0.55rem 1.1rem; border-radius: var(--radius-md); cursor: pointer;
  font-size: 0.9rem; font-weight: 600; white-space: nowrap;
}
.btn-primary:hover:not(:disabled) { background: #3c455e; }
.btn-primary:disabled { opacity: 0.5; cursor: default; }

.rd-assign { margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-light); }
.rd-assign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; align-items: end; }
.rd-assign-field { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
.rd-assign-field .rd-gs-input { flex: none; width: 100%; }
.rd-assign-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: var(--text-tertiary); }
.rd-assign-action { display: flex; align-items: flex-end; }
.rd-assign-action .btn-primary { width: 100%; }
.rd-assign-err { margin: 0.6rem 0 0; color: #c0392b; font-size: 0.85rem; }
.rd-assign-subtitle { font-size: 0.95rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--text-primary); }
.rd-assign-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.rd-assign-table th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-tertiary); font-weight: 600; padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); }
.rd-assign-table td { padding: 0.6rem; border-bottom: 1px solid var(--border-light); color: var(--text-primary); }
.rd-status-badge { display: inline-block; font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; }
.rd-status-badge.pending { background: #fff3cd; color: #7a5b00; }
.rd-status-badge.done { background: #d4edda; color: #14532d; }
.rd-cancel-btn { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); padding: 0.3rem 0.7rem; border-radius: var(--radius-md); cursor: pointer; font-size: 0.82rem; }
.rd-cancel-btn:hover:not(:disabled) { border-color: #c0392b; color: #c0392b; }
.rd-cancel-btn:disabled { opacity: 0.5; cursor: default; }
.rd-result { border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 0.9rem 1rem; margin-bottom: 0.85rem; background: var(--bg-subtle, #fafbfc); }
.rd-result-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 0.75rem; margin-bottom: 0.65rem; }
.rd-result-dir { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
.rd-result-meta { font-size: 0.82rem; color: var(--text-tertiary); }
.rd-result-empty { font-size: 0.85rem; color: var(--text-tertiary); font-style: italic; }
.rd-result-block { padding: 0.55rem 0 0.1rem; }
.rd-result-block + .rd-result-block { border-top: 1px solid var(--border-light); margin-top: 0.55rem; }
.rd-result-block-title { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.3rem; }
.rd-result-spec { font-size: 0.82rem; color: var(--text-tertiary); margin-bottom: 0.3rem; }
.rd-result-recs { margin: 0; font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); white-space: pre-wrap; }
@media (max-width: 640px) { .rd-assign-grid { grid-template-columns: 1fr; } }

.rd-members { display: flex; flex-direction: column; }
.rd-member { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0; border-bottom: 1px solid var(--border-light); }
.rd-member:last-child { border-bottom: none; }
.rd-member.self { background: var(--bg-surface-sunken); border-radius: var(--radius-md); padding-left: 0.6rem; padding-right: 0.6rem; }
.rd-member-av, .rd-member-av-img { width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0; }
.rd-member-av { display: grid; place-items: center; background: var(--bg-surface-sunken); color: var(--text-secondary); font-size: 0.8rem; font-weight: 600; }
.rd-member-av-img { object-fit: cover; }
.rd-member-info { min-width: 0; }
.rd-member-name { font-weight: 600; font-size: 0.92rem; display: flex; align-items: center; gap: 0.5rem; }
.rd-self-badge { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; background: #cce5ff; color: #0a2f5a; padding: 0.1rem 0.4rem; border-radius: 4px; }
.rd-member-meta { font-size: 0.78rem; color: var(--text-tertiary); margin-top: 1px; }

.rd-footer {
  margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  font-size: 0.8rem; color: var(--text-tertiary);
}
.btn-secondary {
  background: transparent; border: 1px solid var(--border);
  padding: 0.5rem 1rem; border-radius: var(--radius-md); cursor: pointer;
  color: var(--text-primary);
}
.btn-secondary:hover { background: var(--bg-surface-sunken); }

@media (max-width: 600px) {
  .rd-kv-grid { grid-template-columns: 1fr; }
  .rd-hero { flex-direction: column; text-align: center; }
}
</style>
