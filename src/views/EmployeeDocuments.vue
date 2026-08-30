<template>
  <div class="ed-page">

    <div class="ed-head">
      <div>
        <div class="ed-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          Документы
        </div>
        <h1 class="ed-title">Экспорт отчёта по реабилитанту</h1>
        <p class="ed-sub">Выберите реабилитанта и сформируйте отчёт с документами и назначенными диагностиками.</p>
      </div>
    </div>

    <div class="ed-grid">

      <div class="ed-card">
        <div class="ed-card-head">
          <div class="ed-ch-title">Реабилитанты</div>
          <span class="ed-count">{{ filtered.length }}</span>
        </div>
        <div class="ed-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="search" type="text" placeholder="Поиск по ФИО…">
        </div>
        <ul class="ed-list" role="list">
          <li v-if="loadingList" class="ed-empty">Загрузка…</li>
          <li v-else-if="!filtered.length" class="ed-empty">Ничего не найдено</li>
          <li
            v-for="r in filtered" :key="r.id"
            class="ed-item"
            :class="{ active: selected?.id === r.id }"
            @click="select(r)"
          >
            <div class="ed-avatar">{{ initials(fullName(r)) }}</div>
            <div class="ed-item-info">
              <div class="ed-item-name">{{ fullName(r) }}</div>
              <div class="ed-item-meta">{{ r.group?.groupName || '—' }}</div>
            </div>
          </li>
        </ul>
      </div>

      <div class="ed-card">
        <div class="ed-card-head">
          <div class="ed-ch-title">Отчёт</div>
          <button
            class="ed-btn"
            type="button"
            :disabled="!selected || building"
            @click="exportReport"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ building ? 'Формирование…' : 'Экспорт отчёта' }}
          </button>
        </div>

        <div v-if="!selected" class="ed-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <p>Выберите реабилитанта слева, чтобы сформировать отчёт</p>
        </div>

        <div v-else class="ed-preview">
          <div v-if="loadingDetail" class="ed-empty">Загрузка карточки…</div>
          <template v-else>
            <div class="ed-rep-name">{{ fullName(detail) }}</div>
            <div class="ed-rep-sub">{{ detail.diagnosis || 'Диагноз не указан' }}</div>

            <div class="ed-section-label">Общие сведения</div>
            <div class="ed-rows">
              <div class="ed-row"><span>Дата рождения</span><b>{{ formatDate(detail.birthDate) }}</b></div>
              <div class="ed-row"><span>Группа</span><b>{{ detail.group?.groupName || '—' }}</b></div>
              <div class="ed-row"><span>Куратор</span><b>{{ detail.group?.curatorUser?.fullName || '—' }}</b></div>
              <div class="ed-row"><span>Статус</span><b>{{ statusLabel(detail.status) }}</b></div>
              <div class="ed-row"><span>Группа инвалидности</span><b>{{ detail.disableGroup || '—' }}</b></div>
            </div>

            <div class="ed-section-label">Документы</div>
            <div v-if="docList.length" class="ed-rows">
              <div v-for="d in docList" :key="d.id" class="ed-doc">
                <div class="ed-row"><span>Тип</span><b>{{ d.docType }}</b></div>
                <div class="ed-row"><span>Серия / номер</span><b>{{ d.docSeries }} {{ d.docNumber }}</b></div>
                <div class="ed-row"><span>СНИЛС</span><b>{{ d.snils || '—' }}</b></div>
                <div class="ed-row"><span>МСЭ действительна до</span><b>{{ mseValidText(d) }}</b></div>
              </div>
            </div>
            <div v-else class="ed-muted">Документы не заполнены</div>

            <div class="ed-section-label">Назначенные диагностики ({{ recDiagnostics.length }})</div>
            <div v-if="recDiagnostics.length" class="ed-rows">
              <div v-for="dg in recDiagnostics" :key="dg.id" class="ed-row">
                <span>{{ formatDate(dg.date) }} · {{ dg.direction }}</span>
                <b>{{ dg.published ? 'Опубликовано' : 'Назначено' }}</b>
              </div>
            </div>
            <div v-else class="ed-muted">Диагностики не назначены</div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { fullName } from '../utils/recipient';
import api from '../api';

const recipients = ref([]);
const selected = ref(null);
const detail = ref({});
const docList = ref([]);
const allDiagnostics = ref([]);
const search = ref('');
const loadingList = ref(true);
const loadingDetail = ref(false);
const building = ref(false);

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return recipients.value;
  return recipients.value.filter(r => fullName(r).toLowerCase().includes(q));
});

const recDiagnostics = computed(() => {
  const name = fullName(detail.value).toLowerCase();
  if (!name) return [];
  return allDiagnostics.value.filter(d => (d.recipientName || '').toLowerCase() === name);
});

const initials = (name) => {
  const p = (name || '').split(' ').filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '—';
};
const formatDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const mseValidText = (d) => (d?.mseIndefinite ? 'Бессрочно' : formatDate(d?.mseValidDate));
const statusLabel = (s) => ({ active: 'Активный', draft: 'Черновик', archived: 'В архиве' }[s] || s || '—');

const loadRecipients = async () => {
  loadingList.value = true;
  try {
    const { data } = await api.get('/recipients', { params: { limit: 200 } });
    recipients.value = data.data || [];
  } catch (e) {
    console.error(e);
  } finally {
    loadingList.value = false;
  }
};
const loadDiagnostics = async () => {
  try {
    const { data } = await api.get('/dashboard/diagnostics', { params: { page: 1, limit: 500 } });
    allDiagnostics.value = data.data || [];
  } catch (e) {
    console.error(e);
  }
};
const select = async (r) => {
  selected.value = r;
  loadingDetail.value = true;
  detail.value = {};
  docList.value = [];
  try {
    const { data } = await api.get(`/recipients/${r.id}`);
    detail.value = data;
    docList.value = data.docs || [];
  } catch (e) {
    console.error(e);
    detail.value = r;
  } finally {
    loadingDetail.value = false;
  }
};

const esc = (s) => String(s ?? '—')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildHtml = () => {
  const d = detail.value;
  const now = new Date().toLocaleString('ru-RU');
  const docsHtml = docList.value.length
    ? docList.value.map(doc => `
      <table class="kv">
        <tr><td>Тип документа</td><th>${esc(doc.docType)}</th></tr>
        <tr><td>Серия / номер</td><th>${esc(doc.docSeries)} ${esc(doc.docNumber)}</th></tr>
        <tr><td>Кем выдан</td><th>${esc(doc.docIssuer)}</th></tr>
        <tr><td>Дата выдачи</td><th>${esc(formatDate(doc.docIssuerDate))}</th></tr>
        <tr><td>СНИЛС</td><th>${esc(doc.snils)}</th></tr>
        <tr><td>МСЭ выдана</td><th>${esc(formatDate(doc.mseIssueDate))}</th></tr>
        <tr><td>МСЭ действительна до</td><th>${esc(mseValidText(doc))}</th></tr>
        <tr><td>Адрес регистрации</td><th>${esc(doc.regAddress)}</th></tr>
        <tr><td>Место обучения</td><th>${esc(doc.educationPlace)}</th></tr>
      </table>`).join('')
    : '<p class="muted">Документы не заполнены</p>';

  const diagHtml = recDiagnostics.value.length
    ? `<table class="grid">
        <thead><tr><th>Дата</th><th>Направление</th><th>Специалист</th><th>Статус</th></tr></thead>
        <tbody>${recDiagnostics.value.map(dg => `
          <tr><td>${esc(formatDate(dg.date))}</td><td>${esc(dg.direction)}</td>
          <td>${esc(dg.specialist)}</td><td>${dg.published ? 'Опубликовано' : 'Назначено'}</td></tr>`).join('')}
        </tbody></table>`
    : '<p class="muted">Диагностики не назначены</p>';

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">
  <title>Отчёт — ${esc(fullName(d))}</title>
  <style>
    body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a211a;max-width:800px;margin:2rem auto;padding:0 1.5rem;line-height:1.5}
    h1{font-size:1.6rem;border-bottom:2px solid #5F7E45;padding-bottom:.5rem;color:#2F4A2F}
    h2{font-size:1.1rem;margin-top:1.6rem;color:#2F4A2F}
    .sub{color:#4F564A;margin-top:-.4rem}
    table{width:100%;border-collapse:collapse;margin-top:.5rem}
    table.kv td{color:#4F564A;padding:.4rem .6rem;width:40%;border-bottom:1px solid #eee}
    table.kv th{text-align:left;padding:.4rem .6rem;border-bottom:1px solid #eee}
    table.grid th,table.grid td{border:1px solid #ddd;padding:.5rem .6rem;text-align:left;font-size:.9rem}
    table.grid thead th{background:#EEF4E2;color:#2F4A2F}
    .muted{color:#6E7368;font-style:italic}
    .foot{margin-top:2rem;border-top:1px solid #ddd;padding-top:.6rem;color:#6E7368;font-size:.8rem}
    .doc-block{margin-bottom:1rem}
  </style></head><body>
    <h1>Отчёт по реабилитанту</h1>
    <p class="sub">${esc(fullName(d))} · ${esc(d.diagnosis || 'диагноз не указан')}</p>

    <h2>Общие сведения</h2>
    <table class="kv">
      <tr><td>Дата рождения</td><th>${esc(formatDate(d.birthDate))}</th></tr>
      <tr><td>Группа</td><th>${esc(d.group?.groupName)}</th></tr>
      <tr><td>Куратор</td><th>${esc(d.group?.curatorUser?.fullName)}</th></tr>
      <tr><td>Статус</td><th>${esc(statusLabel(d.status))}</th></tr>
      <tr><td>Группа инвалидности</td><th>${esc(d.disableGroup)}</th></tr>
      <tr><td>Эл. почта</td><th>${esc(d.email)}</th></tr>
      <tr><td>Телефон</td><th>${esc(d.telephone)}</th></tr>
    </table>

    <h2>Документы</h2>
    ${docsHtml}

    <h2>Назначенные диагностики (${recDiagnostics.value.length})</h2>
    ${diagHtml}

    <div class="foot">Отчёт сформирован ${esc(now)} · ERP-Реабилитация, ЦСИ Дианы Гурцкая</div>
  </body></html>`;
};

const exportReport = async () => {
  if (!selected.value) return;
  building.value = true;
  try {
    const html = buildHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = fullName(detail.value).replace(/\s+/g, '_') || 'recipient';
    a.href = url;
    a.download = `Отчёт_${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert('Не удалось сформировать отчёт');
  } finally {
    building.value = false;
  }
};

onMounted(() => {
  loadRecipients();
  loadDiagnostics();
});
</script>

<style scoped>
.ed-page {
  font-family: 'Inter', system-ui, sans-serif;
  color: #1a211a;
  animation: edIn 0.35s cubic-bezier(0.2,0.7,0.2,1);
}
@keyframes edIn { from { opacity: 0; transform: translateY(0.4rem); } to { opacity: 1; transform: none; } }

.ed-head { margin-bottom: 1.5rem; }
.ed-eyebrow {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em;
  color: #2F4A2F; font-weight: 600; margin-bottom: 0.4375rem;
}
.ed-eyebrow svg { width: 0.875rem; height: 0.875rem; }
.ed-title {
  font-family: 'Lora', Georgia, serif; font-size: 1.75rem; font-weight: 500;
  letter-spacing: -0.02em; color: #0F140F; margin-bottom: 0.375rem;
}
.ed-sub { font-size: 0.9375rem; color: #4F564A; max-width: 44rem; }

.ed-grid { display: grid; grid-template-columns: 22rem 1fr; gap: 1.25rem; align-items: start; }
@media (max-width: 60rem) { .ed-grid { grid-template-columns: 1fr; } }

.ed-card {
  background: #fff; border: 0.0625rem solid #E4DECF; border-radius: 1.125rem;
  box-shadow: 0 0.0625rem 0.125rem rgba(30,47,30,0.04); overflow: hidden;
}
.ed-card-head {
  padding: 1rem 1.25rem; border-bottom: 0.0625rem solid #EFEADC;
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;
}
.ed-ch-title { font-family: 'Lora', Georgia, serif; font-size: 1.0625rem; font-weight: 500; color: #0F140F; }
.ed-count { font-size: 0.8125rem; font-weight: 600; color: #4F564A; background: #F3EEE4; padding: 0.125rem 0.5rem; border-radius: 999px; }

.ed-search {
  display: flex; align-items: center; gap: 0.5rem; margin: 0.75rem 1.25rem;
  padding: 0.5rem 0.75rem; border: 0.0625rem solid #E4DECF; border-radius: 0.625rem; background: #F7F4ED;
}
.ed-search svg { width: 1rem; height: 1rem; color: #6E7368; flex-shrink: 0; }
.ed-search input { border: none; background: none; outline: none; width: 100%; font-size: 0.875rem; color: #1a211a; font-family: inherit; }

.ed-list { list-style: none; max-height: 28rem; overflow-y: auto; }
.ed-empty { padding: 1.5rem; text-align: center; color: #6E7368; font-size: 0.875rem; }
.ed-item {
  display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1.25rem;
  cursor: pointer; transition: background 0.1s; border-left: 3px solid transparent;
}
.ed-item:hover { background: #F7F4ED; }
.ed-item.active { background: #EEF4E2; border-left-color: #5F7E45; }
.ed-avatar {
  width: 2rem; height: 2rem; border-radius: 50%; flex: 0 0 2rem;
  display: grid; place-items: center; font-size: 0.75rem; font-weight: 600;
  font-family: 'Lora', serif; background: #E0EBD1; color: #2F4A2F;
}
.ed-item-info { min-width: 0; }
.ed-item-name { font-weight: 500; font-size: 0.875rem; color: #0F140F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ed-item-meta { font-size: 0.75rem; color: #6E7368; }

.ed-btn {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.875rem;
  border-radius: 0.625rem; border: none; background: #2F4A2F; color: #F4F8EC;
  font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.ed-btn:hover:not(:disabled) { background: #25391f; }
.ed-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.ed-btn svg { width: 0.9375rem; height: 0.9375rem; }

.ed-placeholder {
  padding: 3.5rem 1.5rem; text-align: center; color: #6E7368;
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
}
.ed-placeholder svg { width: 2.75rem; height: 2.75rem; color: #C9C3B2; }

.ed-preview { padding: 1.25rem 1.5rem 1.75rem; }
.ed-rep-name { font-family: 'Lora', Georgia, serif; font-size: 1.375rem; font-weight: 500; color: #0F140F; }
.ed-rep-sub { font-size: 0.875rem; color: #4F564A; margin-bottom: 0.5rem; }
.ed-section-label {
  font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em;
  font-weight: 600; color: #5F7E45; margin: 1.25rem 0 0.5rem;
}
.ed-rows { display: flex; flex-direction: column; gap: 0.375rem; }
.ed-row {
  display: flex; justify-content: space-between; gap: 1rem;
  padding-bottom: 0.375rem; border-bottom: 0.0625rem solid #EFEADC; font-size: 0.875rem;
}
.ed-row span { color: #6E7368; }
.ed-row b { color: #0F140F; font-weight: 600; text-align: right; }
.ed-doc { padding: 0.5rem 0.75rem; background: #F7F4ED; border-radius: 0.5rem; margin-bottom: 0.5rem; }
.ed-doc .ed-row:last-child { border-bottom: none; padding-bottom: 0; }
.ed-muted { color: #6E7368; font-style: italic; font-size: 0.875rem; }

@media (max-width: 768px) {
  .ed-title { font-size: 1.375rem; }
  .ed-sub { font-size: 0.875rem; }
  .ed-head { margin-bottom: 1rem; }
  .ed-card-head { padding: 0.875rem 1rem; flex-wrap: wrap; }
  .ed-btn { flex: 1 1 100%; justify-content: center; min-height: var(--tap, 2.75rem); }
  .ed-search { padding-left: 1rem; padding-right: 1rem; }
  .ed-list { max-height: 17rem; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
  .ed-item { min-height: var(--tap, 2.75rem); padding-left: 1rem; padding-right: 1rem; }
  .ed-preview { padding: 1rem 1rem 1.25rem; }
  .ed-placeholder { padding: 2.25rem 1rem; }
  .ed-row { flex-direction: column; gap: 0.125rem; }
  .ed-row b { text-align: left; }
}
@media (hover: none) {
  .ed-item:hover { background: transparent; }
  .ed-item.active:hover { background: #EEF4E2; }
  .ed-btn:hover:not(:disabled) { background: #2F4A2F; }
}
</style>
