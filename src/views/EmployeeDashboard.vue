<template>
  <div class="db-page">

    <div class="page-head">
      <div class="page-head-text">
        <div class="page-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          Сотрудник
        </div>
        <h1 class="page-title">Панель сотрудника</h1>
        <p class="page-sub">Сводка по контингенту, контроль заполнения документов и назначенные диагностики.</p>
      </div>
      <button class="db-btn db-btn-primary" type="button" @click="goTo('documents', 'Документы')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Экспорт отчёта
      </button>
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
            <div class="ch-title">Статистика реабилитантов</div>
            <div class="ch-sub">Распределение контингента по статусам</div>
          </div>
          <div class="ch-actions">
            <button class="db-btn db-btn-sm db-btn-secondary" type="button" @click="goTo('recipients', 'Реабилитанты')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Список
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
                <span class="ring-num">{{ stats.recipients }}</span>
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
              <div class="st-num">{{ stats.activeCount }}</div>
              <div class="st-label">Активные</div>
            </div>
            <div class="stat-tile amber">
              <div class="st-num">{{ stats.draftCount }}</div>
              <div class="st-label">Черновики</div>
            </div>
            <div class="stat-tile blue">
              <div class="st-num">{{ stats.groups }}</div>
              <div class="st-label">Группы</div>
            </div>
          </div>
        </div>
      </div>

      <div class="db-card">
        <div class="card-head">
          <div class="ch-icon amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="ch-body">
            <div class="ch-title">Незаполненные документы</div>
            <div class="ch-sub">Реабилитанты с неполным пакетом документов</div>
          </div>
          <div class="ch-actions">
            <span class="db-badge" :class="missingCount ? 'db-badge-warn' : 'db-badge-active'" role="status">
              {{ missingCount }} требуют внимания
            </span>
          </div>
        </div>

        <ul class="docs-list" role="list" aria-label="Реабилитанты с неполными документами">
          <li v-if="loadingDocs" class="docs-empty">Загрузка…</li>
          <li v-else-if="!missingDocs.length" class="docs-empty">Все документы заполнены</li>
          <li v-for="r in missingDocs" :key="r.id" class="docs-row" @click="goTo('documents', 'Документы')">
            <div class="dr-avatar" :class="r.docCount === 0 ? 'av-rose' : 'av-amber'" aria-hidden="true">
              {{ initials(r.fullName) }}
            </div>
            <div class="dr-info">
              <div class="dr-name">{{ r.fullName }}</div>
              <div class="dr-meta">{{ r.groupName }} · куратор {{ r.curator }}</div>
            </div>
            <span class="dr-badge" :class="r.docCount === 0 ? 'dr-bad' : 'dr-warn'">
              {{ r.docCount === 0 ? 'нет' : r.docCount + ' док.' }}
            </span>
          </li>
        </ul>

        <div class="docs-foot">
          <span class="docs-foot-note">Показаны записи с наименьшим числом документов</span>
          <button class="db-btn db-btn-sm db-btn-ghost" type="button" @click="goTo('recipients', 'Реабилитанты')">
            Все реабилитанты
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="db-card">
      <div class="card-head">
        <div class="ch-icon blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div class="ch-body">
          <div class="ch-title">Назначенные диагностики</div>
          <div class="ch-sub">Список назначенных диагностик реабилитантов по датам</div>
        </div>
        <div class="ch-actions">
          <button class="db-btn db-btn-sm db-btn-secondary" type="button" @click="goTo('diagnostics', 'Диагностика')">
            Все диагностики
          </button>
        </div>
      </div>

      <div class="diag-wrap">
        <div v-if="loadingDiag" class="docs-empty">Загрузка…</div>
        <table v-else-if="diagnostics.length" class="diag-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Реабилитант</th>
              <th>Направление</th>
              <th>Специалист</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in diagnostics" :key="d.id">
              <td class="dg-date">{{ formatDate(d.date) }}</td>
              <td>{{ d.recipientName }}</td>
              <td>{{ d.direction }}</td>
              <td>{{ d.specialist }}</td>
              <td>
                <span class="dg-status" :class="d.published ? 'dg-pub' : 'dg-pending'">
                  {{ d.published ? 'Опубликовано' : 'Назначено' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="docs-empty">Назначенных диагностик нет</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import api from '../api';

const pageStore = usePageStore();
const goTo = (page, label) => pageStore.setPage(page, label || page);

const stats = ref({
  recipients: 0, activeCount: 0, draftCount: 0, archivedCount: 0,
  groups: 0, resultsTotal: 0, resultsPublished: 0, resultsPending: 0
});
const missingDocs = ref([]);
const missingCount = ref(0);
const diagnostics = ref([]);
const loadingDocs = ref(true);
const loadingDiag = ref(true);

const initials = (name) => {
  const parts = (name || '').split(' ').filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '—';
};
const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const C   = 2 * Math.PI * 38;
const GAP = 2;
const donutSegments = computed(() => {
  const s = stats.value;
  const total = s.recipients || 0;
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
  const s = stats.value;
  const total = Math.max(s.recipients || 1, 1);
  return [
    { color: '#5F7E45', label: 'Активные',  value: s.activeCount   || 0, pct: Math.round(((s.activeCount   || 0) / total) * 100) },
    { color: '#B07223', label: 'Черновики', value: s.draftCount    || 0, pct: Math.round(((s.draftCount    || 0) / total) * 100) },
    { color: '#D6CFBE', label: 'В архиве',  value: s.archivedCount || 0, pct: Math.round(((s.archivedCount || 0) / total) * 100) }
  ];
});

const loadStats = async () => {
  try {
    const { data } = await api.get('/dashboard/stats');
    stats.value = { ...stats.value, ...data.stats };
  } catch (e) {
    console.error('stats:', e);
  }
};
const loadMissingDocs = async () => {
  loadingDocs.value = true;
  try {
    const { data } = await api.get('/dashboard/missing-docs');
    missingDocs.value = data.list || [];
    missingCount.value = data.missingCount || 0;
  } catch (e) {
    console.error('missing-docs:', e);
  } finally {
    loadingDocs.value = false;
  }
};
const loadDiagnostics = async () => {
  loadingDiag.value = true;
  try {
    const { data } = await api.get('/dashboard/diagnostics', { params: { page: 1, limit: 8 } });
    diagnostics.value = data.data || [];
  } catch (e) {
    console.error('diagnostics:', e);
  } finally {
    loadingDiag.value = false;
  }
};

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadStats();
  loadMissingDocs();
  loadDiagnostics();
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

  --db-sage-700: #2F4A2F;
  --db-sage-500: #5F7E45;
  --db-sage-100: #E0EBD1;
  --db-sage-50:  #EEF4E2;

  --db-amber-700: #6F4514;
  --db-amber-500: #B07223;
  --db-amber-100: #F5E3C4;
  --db-amber-50:  #FBF1DD;

  --db-rose-700: #6E2B22;
  --db-rose-100: #F3D8CE;
  --db-rose-50:  #FAE9E0;

  --db-blue-700: #1F3D52;
  --db-blue-100: #D4E1EB;
  --db-blue-50:  #E8EFF5;

  --db-font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --db-font-sans:  'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --db-radius-md: 0.75rem;
  --db-radius-lg: 1.125rem;
  --db-shadow-sm: 0 0.0625rem 0.125rem rgba(30,47,30,0.04), 0 0.0625rem 0 rgba(30,47,30,0.02);

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
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1.5rem; margin-bottom: 1.75rem; flex-wrap: wrap;
}
.page-head-text { flex: 1 1 20rem; min-width: 0; }
.page-eyebrow {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: var(--db-sage-700); font-weight: 600; margin-bottom: 0.4375rem;
}
.page-eyebrow svg { width: 0.875rem; height: 0.875rem; }
.page-title {
  font-family: var(--db-font-serif); font-size: 1.875rem; line-height: 1.15;
  font-weight: 500; letter-spacing: -0.02em; color: var(--db-ink-strong); margin-bottom: 0.375rem;
}
.page-sub { font-size: 0.9375rem; color: var(--db-ink-muted); max-width: 44rem; line-height: 1.55; }
.db-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem 1rem; min-height: 2.75rem; border-radius: 0.625rem;
  border: 0.0625rem solid transparent; font-size: 0.9375rem; font-weight: 500;
  font-family: var(--db-font-sans); transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap; cursor: pointer;
}
.db-btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.db-btn-primary  { background: var(--db-sage-700); color: #F4F8EC; border-color: var(--db-sage-700); }
.db-btn-primary:hover { background: #25391f; border-color: #25391f; }
.db-btn-secondary { background: var(--db-paper); color: var(--db-ink); border-color: var(--db-line-strong); }
.db-btn-secondary:hover { background: var(--db-paper-soft); border-color: var(--db-ink-muted); }
.db-btn-ghost { color: var(--db-ink-muted); }
.db-btn-ghost:hover { background: var(--db-paper-soft); color: var(--db-ink); }
.db-btn-sm { padding: 0.4375rem 0.75rem; min-height: 2.125rem; font-size: 0.875rem; }
.db-card {
  background: var(--db-paper); border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-lg); box-shadow: var(--db-shadow-sm);
  overflow: hidden; margin-bottom: 1.25rem;
}
.card-head {
  padding: 1.125rem 1.5rem 0.875rem; border-bottom: 0.0625rem solid var(--db-line-soft);
  display: flex; align-items: flex-start; gap: 0.875rem;
}
.ch-icon {
  width: 2.25rem; height: 2.25rem; border-radius: 0.625rem;
  display: grid; place-items: center; flex: 0 0 2.25rem;
  background: var(--db-sage-50); color: var(--db-sage-700);
}
.ch-icon.amber { background: var(--db-amber-50); color: var(--db-amber-700); }
.ch-icon.blue  { background: var(--db-blue-50);  color: var(--db-blue-700); }
.ch-icon svg   { width: 1.125rem; height: 1.125rem; }
.ch-body       { flex: 1; min-width: 0; }
.ch-title {
  font-family: var(--db-font-serif); font-size: 1.125rem; font-weight: 500;
  letter-spacing: -0.015em; color: var(--db-ink-strong); line-height: 1.2; margin-bottom: 0.2rem;
}
.ch-sub    { font-size: 0.875rem; color: var(--db-ink-muted); }
.ch-actions { display: flex; gap: 0.5rem; align-items: center; flex-shrink: 0; }
.db-badge {
  display: inline-flex; align-items: center; gap: 0.3125rem;
  padding: 0.25rem 0.625rem; border-radius: 999px; font-size: 0.8125rem;
  font-weight: 500; white-space: nowrap; border: 0.0625rem solid transparent;
}
.db-badge-active { background: var(--db-sage-50); color: var(--db-sage-700); border-color: var(--db-sage-100); }
.db-badge-warn   { background: var(--db-amber-50); color: var(--db-amber-700); border-color: var(--db-amber-100); }
.av-amber { background: var(--db-amber-100); color: var(--db-amber-700); }
.av-rose  { background: var(--db-rose-100);  color: var(--db-rose-700);  }
.dash-top {
  display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
  margin-bottom: 1.25rem; align-items: start;
}
@media (max-width: 72rem) { .dash-top { grid-template-columns: 1fr; } }
.info-body  { padding: 1.5rem 1.5rem 1.25rem; }
.info-main  { display: flex; align-items: center; gap: 2rem; margin-bottom: 1.5rem; }
.info-ring  { flex: 0 0 7.5rem; width: 7.5rem; height: 7.5rem; position: relative; }
.info-ring svg { width: 100%; height: 100%; display: block; transform: rotate(-90deg); }
.ring-label {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.0625rem; pointer-events: none;
}
.ring-num {
  font-family: var(--db-font-serif); font-size: 2.125rem; font-weight: 500;
  line-height: 1; letter-spacing: -0.03em; color: var(--db-ink-strong);
}
.ring-cap {
  font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.07em;
  font-weight: 500; color: var(--db-ink-subtle);
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
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
  padding-top: 1.25rem; border-top: 0.0625rem solid var(--db-line-soft);
}
.stat-tile {
  background: var(--db-paper-soft); border: 0.0625rem solid var(--db-line);
  border-radius: var(--db-radius-md); padding: 0.875rem 0.875rem 0.75rem; text-align: center;
}
.stat-tile .st-num {
  font-family: var(--db-font-serif); font-size: 1.875rem; font-weight: 500;
  line-height: 1; letter-spacing: -0.03em; color: var(--db-ink-strong); margin-bottom: 0.3125rem;
}
.stat-tile .st-label { font-size: 0.75rem; color: var(--db-ink-muted); line-height: 1.35; }
.stat-tile.green { background: var(--db-sage-50);  border-color: var(--db-sage-100);  }
.stat-tile.green .st-num { color: var(--db-sage-700); }
.stat-tile.amber { background: var(--db-amber-50); border-color: var(--db-amber-100); }
.stat-tile.amber .st-num { color: var(--db-amber-700); }
.stat-tile.blue  { background: var(--db-blue-50);  border-color: var(--db-blue-100);  }
.stat-tile.blue  .st-num { color: var(--db-blue-700); }
.docs-list { list-style: none; }
.docs-empty { padding: 1.75rem 1.5rem; text-align: center; color: var(--db-ink-subtle); font-size: 0.875rem; }
.docs-row {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 0.875rem 1.5rem; border-bottom: 0.0625rem solid var(--db-line-soft);
  transition: background 0.1s; cursor: pointer;
}
.docs-row:last-child { border-bottom: none; }
.docs-row:hover { background: var(--db-paper-soft); }
.dr-avatar {
  width: 2.25rem; height: 2.25rem; border-radius: 50%; flex: 0 0 2.25rem;
  display: grid; place-items: center; font-size: 0.8125rem; font-weight: 600;
  font-family: var(--db-font-serif);
}
.dr-info { flex: 1; min-width: 0; }
.dr-name { font-weight: 500; font-size: 0.9375rem; color: var(--db-ink-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dr-meta { font-size: 0.8125rem; color: var(--db-ink-muted); margin-top: 0.0625rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dr-badge {
  display: inline-flex; align-items: center; font-size: 0.8125rem; font-weight: 600;
  padding: 0.25rem 0.6875rem; border-radius: 999px; flex: 0 0 auto;
  border: 0.0625rem solid transparent; white-space: nowrap;
}
.dr-warn { background: var(--db-amber-50); color: var(--db-amber-700); border-color: var(--db-amber-100); }
.dr-bad  { background: var(--db-rose-50);  color: var(--db-rose-700);  border-color: var(--db-rose-100); }
.docs-foot {
  padding: 0.875rem 1.5rem; border-top: 0.0625rem solid var(--db-line-soft);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}
.docs-foot-note { font-size: 0.8125rem; color: var(--db-ink-muted); }
.diag-wrap { padding: 0.5rem 0.5rem 0.75rem; overflow-x: auto; }
.diag-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.diag-table th {
  text-align: left; padding: 0.625rem 1rem; font-weight: 600;
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--db-ink-subtle); border-bottom: 0.0625rem solid var(--db-line);
}
.diag-table td {
  padding: 0.75rem 1rem; border-bottom: 0.0625rem solid var(--db-line-soft);
  color: var(--db-ink); vertical-align: middle;
}
.diag-table tbody tr:last-child td { border-bottom: none; }
.diag-table tbody tr:hover { background: var(--db-paper-soft); }
.dg-date { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--db-ink-strong); white-space: nowrap; }
.dg-status {
  display: inline-flex; align-items: center; font-size: 0.75rem; font-weight: 600;
  padding: 0.1875rem 0.625rem; border-radius: 999px; white-space: nowrap;
  border: 0.0625rem solid transparent;
}
.dg-pub     { background: var(--db-sage-50);  color: var(--db-sage-700);  border-color: var(--db-sage-100); }
.dg-pending { background: var(--db-amber-50); color: var(--db-amber-700); border-color: var(--db-amber-100); }
@media (max-width: 36rem) {
  .info-main  { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
  .info-stats { grid-template-columns: 1fr 1fr; }
}
</style>
