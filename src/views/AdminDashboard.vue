<template>
  <div class="db-page">

    <div class="page-head">
      <div class="page-head-text">
        <div class="page-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
            <path d="M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2"/>
          </svg>
          Администрирование
        </div>
        <h1 class="page-title">Панель администратора</h1>
        <p class="page-sub">Сводка по записям в базе данных и статистике контингента учреждения.</p>
      </div>
      <button class="db-btn db-btn-primary" type="button" @click="goTo('admin-users')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить пользователя
      </button>
    </div>

    <div class="db-card records-wrap">
      <div class="card-head">
        <div class="ch-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14a9 3 0 0 0 18 0V5"/>
            <path d="M3 12a9 3 0 0 0 18 0"/>
          </svg>
        </div>
        <div class="ch-body">
          <div class="ch-title">Записи в базе данных</div>
          <div class="ch-sub">Количество записей по основным сущностям системы</div>
        </div>
        <div class="ch-actions">
          <span class="db-badge db-badge-active" role="status">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ totalRecords }} записей всего
          </span>
        </div>
      </div>

      <div class="records-grid">
        <div v-if="loading" class="records-empty">Загрузка…</div>
        <div
          v-for="rec in records" :key="rec.key"
          class="rec-tile"
          :class="recTone(rec.key)"
        >
          <div class="rec-ico" v-html="RECORD_ICONS[rec.key] || RECORD_ICONS.default" aria-hidden="true"></div>
          <div class="rec-num">{{ rec.value }}</div>
          <div class="rec-label">{{ rec.label }}</div>
        </div>
      </div>
    </div>

    <div class="dash-top">

      <div class="db-card">
        <div class="card-head">
          <div class="ch-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="ch-body">
            <div class="ch-title">Реабилитанты</div>
            <div class="ch-sub">Распределение контингента по статусам</div>
          </div>
          <div class="ch-actions">
            <button class="db-btn db-btn-sm db-btn-secondary" type="button" @click="goTo('recipients')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
              </svg>
              Аналитика
            </button>
          </div>
        </div>

        <div class="info-body">
          <div class="info-main">

            <div class="info-ring" aria-hidden="true">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#EDE8DD" stroke-width="11"/>
                <circle
                  v-for="(seg, i) in donutSegments" :key="i"
                  cx="50" cy="50" r="38" fill="none"
                  :stroke="seg.color"
                  stroke-width="11"
                  :stroke-dasharray="seg.dasharray"
                  :stroke-dashoffset="seg.dashoffset"
                  stroke-linecap="round"
                />
              </svg>
              <div class="ring-label">
                <span class="ring-num">{{ recipientStats.total }}</span>
                <span class="ring-cap">всего</span>
              </div>
            </div>

            <div class="info-kpi">
              <div class="info-kpi-title">По статусам</div>
              <div class="info-kpi-sub">Актуально на сегодня</div>
              <div v-for="row in kpiRows" :key="row.label" class="kpi-row">
                <span class="kpi-dot" :style="{ background: row.color }" aria-hidden="true"></span>
                <span class="kpi-label">{{ row.label }}</span>
                <div class="kpi-track" aria-hidden="true">
                  <div class="kpi-fill" :style="{ width: row.pct + '%', background: row.color }"></div>
                </div>
                <span class="kpi-val">{{ row.value }}</span>
              </div>
            </div>
          </div>

          <div class="info-stats">
            <div class="stat-tile green">
              <div class="st-num">{{ recipientStats.activeCount }}</div>
              <div class="st-label">Активные</div>
            </div>
            <div class="stat-tile amber">
              <div class="st-num">{{ recipientStats.draftCount }}</div>
              <div class="st-label">Черновики</div>
            </div>
            <div class="stat-tile blue">
              <div class="st-num">{{ recipientStats.archivedCount }}</div>
              <div class="st-label">В архиве</div>
            </div>
          </div>
        </div>
      </div>

      <div class="db-card">
        <div class="card-head">
          <div class="ch-icon plum">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
          </div>
          <div class="ch-body">
            <div class="ch-title">Пользователи</div>
            <div class="ch-sub">Распределение учётных записей по ролям</div>
          </div>
          <div class="ch-actions">
            <button class="db-btn db-btn-sm db-btn-secondary" type="button" @click="goTo('admin-users')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Управление
            </button>
          </div>
        </div>

        <ul class="docs-list" role="list" aria-label="Пользователи по ролям">
          <li v-for="r in roleRows" :key="r.key" class="docs-row">
            <div class="dr-avatar" :class="r.av" aria-hidden="true" v-html="r.icon"></div>
            <div class="dr-info">
              <div class="dr-name">{{ r.label }}</div>
              <div class="dr-meta">{{ r.pct }}% от всех учётных записей</div>
            </div>
            <span class="dr-badge dr-ok">{{ r.value }}</span>
          </li>
        </ul>

        <div class="docs-foot">
          <span class="docs-foot-note">Всего учётных записей: {{ recordValue('users') }}</span>
          <button class="db-btn db-btn-sm db-btn-ghost" type="button" @click="goTo('admin-users')">
            Все пользователи
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import api from '../api';

const pageStore = usePageStore();
const goTo = (page) => {
  const titles = { recipients: 'Реабилитанты', 'admin-users': 'Пользователи' };
  pageStore.setPage(page, titles[page] || page);
};

const loading = ref(true);
const records = ref([]);
const roles   = ref({ admin: 0, teacher: 0, employee: 0, recipient: 0 });
const recipientStats = ref({
  total: 0, activeCount: 0, draftCount: 0, archivedCount: 0
});

const totalRecords = computed(() => records.value.reduce((s, r) => s + (r.value || 0), 0));
const recordValue = (key) => records.value.find(r => r.key === key)?.value ?? 0;

const RECORD_ICONS = {
  users:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>',
  recipients:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  groups:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3h4a2 2 0 0 1 2 2v4M3 17v4a2 2 0 0 0 2 2h4M17 21h4a2 2 0 0 0 2-2v-4M7 3H5a2 2 0 0 0-2 2v4"/></svg>',
  diagnostics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  documents:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  specialists: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  results:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  directions:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
  nozology:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2z"/></svg>',
  default:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
};
const REC_TONES = {
  users: 'tone-plum',  recipients: 'tone-sage', groups: 'tone-amber', diagnostics: 'tone-blue',
  documents: 'tone-rose', specialists: 'tone-teal', results: 'tone-sage', directions: 'tone-amber',
  nozology: 'tone-plum'
};
const recTone = (key) => REC_TONES[key] || 'tone-blue';

const C   = 2 * Math.PI * 38;
const GAP = 2;
const donutSegments = computed(() => {
  const s = recipientStats.value;
  const total = s.total || 0;
  if (total === 0) return [];

  const raw = [
    { value: s.activeCount,   color: '#5F7E45' },
    { value: s.draftCount,    color: '#B07223' },
    { value: s.archivedCount, color: '#D6CFBE' }
  ].filter(seg => seg.value > 0);
  if (raw.length === 0) return [];

  const effectiveC     = C - raw.length * GAP;
  const INITIAL_OFFSET = -C / 4;
  let accumulatedArc   = 0;

  return raw.map((seg, i) => {
    const arcLen     = (seg.value / total) * effectiveC;
    const dashoffset = INITIAL_OFFSET - accumulatedArc - i * GAP;
    accumulatedArc  += arcLen;
    return {
      color:     seg.color,
      dasharray: `${arcLen.toFixed(2)} ${C.toFixed(2)}`,
      dashoffset: dashoffset.toFixed(2)
    };
  });
});

const kpiRows = computed(() => {
  const s = recipientStats.value;
  const total = Math.max(s.total || 1, 1);
  return [
    { color: '#5F7E45', label: 'Активные',  value: s.activeCount   || 0, pct: Math.round(((s.activeCount   || 0) / total) * 100) },
    { color: '#B07223', label: 'Черновики', value: s.draftCount    || 0, pct: Math.round(((s.draftCount    || 0) / total) * 100) },
    { color: '#D6CFBE', label: 'В архиве',  value: s.archivedCount || 0, pct: Math.round(((s.archivedCount || 0) / total) * 100) }
  ];
});

const ROLE_META = {
  admin:     { label: 'Администраторы', av: 'av-rose',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2"/></svg>' },
  teacher:   { label: 'Преподаватели',  av: 'av-sage',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
  employee:  { label: 'Сотрудники',     av: 'av-teal',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' },
  recipient: { label: 'Реципиенты',     av: 'av-blue',  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>' }
};
const roleRows = computed(() => {
  const total = Math.max(Object.values(roles.value).reduce((s, n) => s + n, 0), 1);
  return ['admin', 'teacher', 'employee', 'recipient'].map(key => ({
    key,
    label: ROLE_META[key].label,
    av:    ROLE_META[key].av,
    icon:  ROLE_META[key].icon,
    value: roles.value[key] || 0,
    pct:   Math.round(((roles.value[key] || 0) / total) * 100)
  }));
});

const loadAdminStats = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/dashboard/admin-stats');
    records.value        = data.records || [];
    roles.value          = data.roles || roles.value;
    recipientStats.value = { ...recipientStats.value, ...data.recipientStats };
  } catch (e) {
    console.error('admin-stats:', e);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadAdminStats();
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
});
</script>

<!-- Font import (global, loaded once) -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
</style>

<style scoped>
.db-page {
  --db-canvas:       #F7F4ED;
  --db-paper:        #FFFFFF;
  --db-paper-soft:   #F3EEE4;
  --db-paper-sunken: #EDE8DD;
  --db-ink:          #1A211A;
  --db-ink-strong:   #0F140F;
  --db-ink-muted:    #4F564A;
  --db-ink-subtle:   #6E7368;
  --db-line:         #E4DECF;
  --db-line-soft:    #EFEADC;
  --db-line-strong:  #D6CFBE;

  --db-sage-900: #1E2F1E;
  --db-sage-800: #2A4129;
  --db-sage-700: #2F4A2F;
  --db-sage-500: #5F7E45;
  --db-sage-400: #8AAB6A;
  --db-sage-100: #E0EBD1;
  --db-sage-50:  #EEF4E2;

  --db-amber-700: #6F4514;
  --db-amber-500: #B07223;
  --db-amber-100: #F5E3C4;
  --db-amber-50:  #FBF1DD;

  --db-rose-700: #6E2B22;
  --db-rose-500: #B0533F;
  --db-rose-100: #F3D8CE;
  --db-rose-50:  #FAE9E0;

  --db-blue-700: #1F3D52;
  --db-blue-500: #4A7390;
  --db-blue-100: #D4E1EB;
  --db-blue-50:  #E8EFF5;

  --db-plum-700: #4C2B52;
  --db-plum-500: #845B8B;
  --db-plum-100: #E5D6E8;
  --db-plum-50:  #F2E8F5;

  --db-teal-700: #1E4A4A;
  --db-teal-500: #437A7A;
  --db-teal-100: #D0E5E5;
  --db-teal-50:  #E5F0F0;

  --db-font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --db-font-sans:  'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --db-radius-sm: 0.5rem;
  --db-radius-md: 0.75rem;
  --db-radius-lg: 1.125rem;
  --db-shadow-sm: 0 0.0625rem 0.125rem rgba(30,47,30,0.04), 0 0.0625rem 0 rgba(30,47,30,0.02);
  --db-shadow-md: 0 0.25rem 0.875rem rgba(30,47,30,0.05), 0 0.0625rem 0.125rem rgba(30,47,30,0.04);
  --db-focus-ring: 0 0 0 0.1875rem rgba(95,126,69,0.35);

  font-family: var(--db-font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--db-ink);
  animation: dbPageIn 0.4s cubic-bezier(0.2,0.7,0.2,1);
}
@keyframes dbPageIn {
  from { opacity: 0; transform: translateY(0.4rem); }
  to   { opacity: 1; transform: none; }
}
.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}
.page-head-text { flex: 1 1 20rem; min-width: 0; }
.page-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--db-sage-700);
  font-weight: 600;
  margin-bottom: 0.4375rem;
}
.page-eyebrow svg { width: 0.875rem; height: 0.875rem; }
.page-title {
  font-family: var(--db-font-serif);
  font-size: 1.875rem;
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--db-ink-strong);
  margin-bottom: 0.375rem;
}
.page-sub { font-size: 0.9375rem; color: var(--db-ink-muted); max-width: 44rem; line-height: 1.55; }
.db-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  min-height: 2.75rem;
  border-radius: 0.625rem;
  border: 0.0625rem solid transparent;
  font-size: 0.9375rem;
  font-weight: 500;
  font-family: var(--db-font-sans);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
  cursor: pointer;
}
.db-btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.db-btn-primary  { background: var(--db-sage-900); color: #F4F8EC; border-color: var(--db-sage-900); }
.db-btn-primary:hover { background: var(--db-sage-800); border-color: var(--db-sage-800); }
.db-btn-secondary { background: var(--db-paper); color: var(--db-ink); border-color: var(--db-line-strong); }
.db-btn-secondary:hover { background: var(--db-paper-soft); border-color: var(--db-ink-muted); }
.db-btn-ghost { color: var(--db-ink-muted); }
.db-btn-ghost:hover { background: var(--db-paper-soft); color: var(--db-ink); }
.db-btn-sm { padding: 0.4375rem 0.75rem; min-height: 2.125rem; font-size: 0.875rem; }
.db-card {
  background: var(--db-paper);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-lg);
  box-shadow: var(--db-shadow-sm);
  overflow: hidden;
}
.card-head {
  padding: 1.125rem 1.5rem 0.875rem;
  border-bottom: 0.0625rem solid var(--db-line-soft);
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}
.ch-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: grid;
  place-items: center;
  flex: 0 0 2.25rem;
  background: var(--db-sage-50);
  color: var(--db-sage-700);
}
.ch-icon.amber { background: var(--db-amber-50); color: var(--db-amber-700); }
.ch-icon.blue  { background: var(--db-blue-50);  color: var(--db-blue-700); }
.ch-icon.rose  { background: var(--db-rose-50);  color: var(--db-rose-700); }
.ch-icon.plum  { background: var(--db-plum-50);  color: var(--db-plum-700); }
.ch-icon svg   { width: 1.125rem; height: 1.125rem; }
.ch-body       { flex: 1; min-width: 0; }
.ch-title {
  font-family: var(--db-font-serif);
  font-size: 1.125rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--db-ink-strong);
  line-height: 1.2;
  margin-bottom: 0.2rem;
}
.ch-sub    { font-size: 0.875rem; color: var(--db-ink-muted); }
.ch-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
.db-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  border: 0.0625rem solid transparent;
}
.db-badge svg { width: 0.6875rem; height: 0.6875rem; flex: 0 0 0.6875rem; }
.db-badge-active  { background: var(--db-sage-50); color: var(--db-sage-700); border-color: var(--db-sage-100); }
.av-blue  { background: var(--db-blue-100);  color: var(--db-blue-700);  }
.av-plum  { background: var(--db-plum-100);  color: var(--db-plum-700);  }
.av-teal  { background: var(--db-teal-100);  color: var(--db-teal-700);  }
.av-amber { background: var(--db-amber-100); color: var(--db-amber-700); }
.av-rose  { background: var(--db-rose-100);  color: var(--db-rose-700);  }
.av-sage  { background: var(--db-sage-100);  color: var(--db-sage-700);  }
.records-wrap { margin-bottom: 1.25rem; }
.records-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.875rem;
  padding: 1.5rem;
}
.records-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 1.5rem;
  color: var(--db-ink-subtle);
}
.rec-tile {
  position: relative;
  background: var(--db-paper-soft);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-md);
  padding: 0.875rem 1.125rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}
.rec-ico {
  width: 2.5rem; height: 2.5rem;
  border-radius: 0.625rem;
  display: grid; place-items: center;
  flex: 0 0 2.5rem;
}
.rec-ico :deep(svg) { width: 1.375rem; height: 1.375rem; }
.rec-num {
  font-family: var(--db-font-serif);
  font-size: 2.25rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--db-ink-strong);
  font-variant-numeric: tabular-nums;
}
.rec-label { font-size: 1.0625rem; font-weight: 500; color: var(--db-ink-muted); }

.rec-tile.tone-sage  { background: var(--db-sage-50);  border-color: var(--db-sage-100);  }
.rec-tile.tone-sage  .rec-ico { background: var(--db-sage-100);  color: var(--db-sage-700);  }
.rec-tile.tone-sage  .rec-num { color: var(--db-sage-700); }
.rec-tile.tone-amber { background: var(--db-amber-50); border-color: var(--db-amber-100); }
.rec-tile.tone-amber .rec-ico { background: var(--db-amber-100); color: var(--db-amber-700); }
.rec-tile.tone-amber .rec-num { color: var(--db-amber-700); }
.rec-tile.tone-blue  { background: var(--db-blue-50);  border-color: var(--db-blue-100);  }
.rec-tile.tone-blue  .rec-ico { background: var(--db-blue-100);  color: var(--db-blue-700);  }
.rec-tile.tone-blue  .rec-num { color: var(--db-blue-700); }
.rec-tile.tone-rose  { background: var(--db-rose-50);  border-color: var(--db-rose-100);  }
.rec-tile.tone-rose  .rec-ico { background: var(--db-rose-100);  color: var(--db-rose-700);  }
.rec-tile.tone-rose  .rec-num { color: var(--db-rose-700); }
.rec-tile.tone-plum  { background: var(--db-plum-50);  border-color: var(--db-plum-100);  }
.rec-tile.tone-plum  .rec-ico { background: var(--db-plum-100);  color: var(--db-plum-700);  }
.rec-tile.tone-plum  .rec-num { color: var(--db-plum-700); }
.rec-tile.tone-teal  { background: var(--db-teal-50);  border-color: var(--db-teal-100);  }
.rec-tile.tone-teal  .rec-ico { background: var(--db-teal-100);  color: var(--db-teal-700);  }
.rec-tile.tone-teal  .rec-num { color: var(--db-teal-700); }
.dash-top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  align-items: start;
}
@media (max-width: 72rem) {
  .dash-top { grid-template-columns: 1fr; }
}
.info-body  { padding: 1.5rem 1.5rem 1.25rem; }
.info-main  { display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; }

.info-ring  { flex: 0 0 7.5rem; width: 7.5rem; height: 7.5rem; position: relative; }
.info-ring svg {
  width: 100%; height: 100%;
  display: block;
  transform: rotate(-90deg);
}
.ring-label {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 0.0625rem;
  pointer-events: none;
}
.ring-num {
  font-family: var(--db-font-serif);
  font-size: 2.125rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--db-ink-strong);
}
.ring-cap {
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 500;
  color: var(--db-ink-subtle);
}

.info-kpi        { flex: 1; min-width: 0; }
.info-kpi-title  { font-family: var(--db-font-serif); font-size: 1.0625rem; font-weight: 500; color: var(--db-ink-strong); margin-bottom: 0.125rem; }
.info-kpi-sub    { font-size: 0.8125rem; color: var(--db-ink-muted); margin-bottom: 1rem; }

.kpi-row   { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 0.5625rem; }
.kpi-dot   { width: 0.5rem; height: 0.5rem; border-radius: 50%; flex: 0 0 0.5rem; }
.kpi-label { font-size: 0.875rem; color: var(--db-ink-muted); flex: 1; min-width: 0; }
.kpi-track { width: 5rem; height: 0.375rem; background: var(--db-line-soft); border-radius: 999px; overflow: hidden; flex: 0 0 5rem; }
.kpi-fill  { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.2,0.7,0.2,1); }
.kpi-val   { font-size: 0.875rem; font-weight: 600; color: var(--db-ink-strong); min-width: 1.25rem; text-align: right; }

.info-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 0.0625rem solid var(--db-line-soft);
}
.stat-tile {
  background: var(--db-paper-soft);
  border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-md);
  padding: 0.875rem 0.875rem 0.75rem;
  text-align: center;
}
.stat-tile .st-num {
  font-family: var(--db-font-serif);
  font-size: 1.875rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--db-ink-strong);
  margin-bottom: 0.3125rem;
}
.stat-tile .st-label { font-size: 0.75rem; color: var(--db-ink-muted); line-height: 1.35; }
.stat-tile.green { background: var(--db-sage-50);  border-color: var(--db-sage-100);  }
.stat-tile.green .st-num { color: var(--db-sage-700); }
.stat-tile.amber { background: var(--db-amber-50); border-color: var(--db-amber-100); }
.stat-tile.amber .st-num { color: var(--db-amber-700); }
.stat-tile.blue  { background: var(--db-blue-50);  border-color: var(--db-blue-100);  }
.stat-tile.blue  .st-num { color: var(--db-blue-700); }
.docs-list { list-style: none; }
.docs-row {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.5rem;
  border-bottom: 0.0625rem solid var(--db-line-soft);
  transition: background 0.1s;
}
.docs-row:last-child { border-bottom: none; }
.docs-row:hover { background: var(--db-paper-soft); }
.dr-avatar {
  width: 2.25rem; height: 2.25rem;
  border-radius: 50%;
  flex: 0 0 2.25rem;
  display: grid; place-items: center;
}
.dr-avatar :deep(svg) { width: 1.0625rem; height: 1.0625rem; }
.dr-info { flex: 1; min-width: 0; }
.dr-name { font-weight: 500; font-size: 0.9375rem; color: var(--db-ink-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dr-meta { font-size: 0.8125rem; color: var(--db-ink-muted); margin-top: 0.0625rem; }
.dr-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.6875rem;
  border-radius: 999px;
  flex: 0 0 auto;
  border: 0.0625rem solid transparent;
  white-space: nowrap;
}
.dr-ok   { background: var(--db-sage-50);  color: var(--db-sage-700);  border-color: var(--db-sage-100); }
.docs-foot {
  padding: 0.875rem 1.5rem;
  border-top: 0.0625rem solid var(--db-line-soft);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.docs-foot-note { font-size: 0.8125rem; color: var(--db-ink-muted); }
@media (max-width: 60rem) {
  .records-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 36rem) {
  .records-grid { grid-template-columns: 1fr; }
  .info-main  { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
  .info-stats { grid-template-columns: 1fr 1fr; }
}
</style>
