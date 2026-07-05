<template>
  <div class="progress-page">
    <header class="p-header">
      <div>
        <h1 class="p-title">Прогресс</h1>
        <p class="p-sub">Динамика показателей реабилитантов.</p>
      </div>
    </header>
    <div class="toolbar">
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" v-model="search" placeholder="Поиск по имени…" @input="onSearchInput" />
      </div>
      <select v-model="filterDiagnosis" class="styled-select" @change="onFilterChange">
        <option value="all">Все диагнозы</option>
        <option value="РАС">РАС</option>
        <option value="ЗПР">ЗПР</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state"><div class="spinner"></div></div>
    <div v-else-if="recipients.length === 0" class="empty-state"><p>Нет реабилитантов</p></div>
    <div v-else class="items-grid">
      <div v-for="r in recipients" :key="r.id" class="item-card" :class="{ active: selectedRecipient?.id === r.id }" @click="selectRecipient(r)">
        <img :src="r.photo || defaultPhoto" class="avatar" />
        <div class="info">
          <div class="name">{{ fullName(r) }}</div>
          <div class="sub">{{ recipientAge(r) != null ? recipientAge(r) + ' лет · ' : '' }}{{ r.group?.curatorRef?.fullName || '—' }}</div>
          <div class="tags">
            <span class="badge-blue">{{ r.diagnosis }}</span>
            <span class="badge-gray">{{ r.group?.groupName || '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :limit="limit" @update:page="changePage" @update:limit="changeLimit" />

    <div v-if="selectedRecipient" class="progress-detail">
      <div class="card">
        <div class="card-header"><div class="card-title">Динамика показателей: {{ fullName(selectedRecipient) }}</div></div>
        <div class="card-body">
          <canvas v-if="hasScores" id="radarChart" style="max-height:400px;"></canvas>
          <div v-else class="empty-state"><p>Данные о динамике показателей появятся после проведения диагностики.</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import api from '../api';
import { fullName, recipientAge } from '../utils/recipient';
import Pagination from '../components/Pagination.vue';
import Chart from 'chart.js/auto';

const recipients = ref([]);
const search = ref('');
const filterDiagnosis = ref('all');
const page = ref(1);
const limit = ref(15);
const totalPages = ref(1);
const loading = ref(false);
const selectedRecipient = ref(null);
const defaultPhoto = 'https://via.placeholder.com/100';
let chart = null;
let searchTimeout = null;

const SCORE_FIELDS = ['commScore', 'groupScore', 'selfScore', 'creativityScore'];
const hasScores = computed(() => {
  const r = selectedRecipient.value;
  return !!r && SCORE_FIELDS.some((k) => Number(r[k]) > 0);
});

const loadRecipients = async () => {
  loading.value = true;
  try {
    const params = { page: page.value, limit: limit.value, search: search.value || undefined, diagnosis: filterDiagnosis.value !== 'all' ? filterDiagnosis.value : undefined };
    const res = await api.get('/recipients', { params });
    recipients.value = res.data.data;
    totalPages.value = res.data.totalPages;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadRecipients();
  }, 300);
};
const onFilterChange = () => {
  page.value = 1;
  loadRecipients();
};
const changePage = (newPage) => { page.value = newPage; loadRecipients(); };
const changeLimit = (newLimit) => { limit.value = newLimit; page.value = 1; loadRecipients(); };
const selectRecipient = (r) => {
  selectedRecipient.value = r;
  renderRadar();
};

const renderRadar = () => {
  if (!selectedRecipient.value || !hasScores.value) return;
  nextTick(() => {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    if (chart) chart.destroy();
    const ctx = canvas.getContext('2d');
    const labels = ['Коммуникация', 'Включение в группу', 'Самостоятельность', 'Творчество'];
    const scores = [
      selectedRecipient.value.commScore || 0,
      selectedRecipient.value.groupScore || 0,
      selectedRecipient.value.selfScore || 0,
      selectedRecipient.value.creativityScore || 0
    ];
    const targetScores = [4, 3, 3, 4];
    const isDark = document.body.classList.contains('dark');
    const textColor = isDark ? '#9bb4c9' : '#4F564A';
    const gridColor = isDark ? '#2d4255' : '#E4DECF';
    chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          { label: 'Текущий уровень', data: scores, borderColor: '#3F6E3F', backgroundColor: 'rgba(63,110,63,0.2)', pointBackgroundColor: '#3F6E3F', borderWidth: 2 },
          { label: 'Целевой уровень', data: targetScores, borderColor: '#B97718', backgroundColor: 'rgba(185,119,24,0.12)', borderDash: [5,5], pointBackgroundColor: '#B97718', borderWidth: 2 }
        ]
      },
      options: { responsive: true, scales: { r: { beginAtZero: true, max: 5, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, pointLabels: { color: textColor } } }, plugins: { legend: { labels: { color: textColor, usePointStyle: true } } } }
    });
  });
};

const observer = new MutationObserver(() => { if (selectedRecipient.value) renderRadar(); });
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadRecipients();
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  observer.disconnect();
  if (chart) { chart.destroy(); chart = null; }
});
</script>


<style scoped>
/* ---- Warm paper theme (matches Реабилитанты / Дашборд) ---- */
.progress-page { font-family: 'Inter', system-ui, sans-serif; color: #131713; }

.p-header { margin-bottom: 1.5rem; }
.p-title {
  font-family: 'Lora', Georgia, serif; font-weight: 600;
  font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0;
}
.p-sub { color: #4F564A; font-size: 0.95rem; margin: 0.35rem 0 0; }

.toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #FFFFFF;
  border: 1px solid #D6CFBE;
  border-radius: 0.7rem;
  padding: 0.4rem 0.75rem;
  flex: 1;
  max-width: 320px;
  color: #6E7368;
}
.search:focus-within { border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95,126,69,0.18); }
.search input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  color: #131713;
  font-family: inherit;
}
.styled-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #D6CFBE;
  border-radius: 0.7rem;
  background: #FFFFFF;
  color: #131713;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.styled-select:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95,126,69,0.18); }
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.item-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #FFFFFF;
  border: 1px solid #E4DECF;
  border-radius: 1rem;
  padding: 1rem;
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
}
.item-card:hover {
  box-shadow: 0 .25rem .875rem rgba(17,34,17,.08);
  transform: translateY(-2px);
  border-color: #D6CFBE;
}
.item-card.active {
  border-color: #3F6E3F;
  box-shadow: 0 0 0 2px rgba(63, 110, 63, 0.25);
}
.info { min-width: 0; }
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 48px;
}
.name {
  font-weight: 700;
  color: #131713;
}
.sub {
  font-size: 0.8rem;
  color: #4F564A;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.35rem;
}
.badge-blue, .badge-gray, .badge-green {
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 500;
  display: inline-block;
}
.badge-blue {
  background: #EEF4E2;
  color: #2F4A2F;
}
.badge-gray {
  background: #F3EEE4;
  color: #4F564A;
}
.badge-green {
  background: #E0EBD1;
  color: #234623;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #4F564A;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(95, 126, 69, 0.2);
  border-top-color: #3F6E3F;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.progress-detail {
  margin-top: 2rem;
}
.card {
  background: #FFFFFF;
  border: 1px solid #E4DECF;
  border-radius: 1.125rem;
  overflow: hidden;
}
.card-header {
  padding: 1rem 1.35rem;
  border-bottom: 1px solid #EFEADC;
}
.card-title {
  font-family: 'Lora', Georgia, serif;
  font-weight: 600;
  font-size: 1.05rem;
  color: #0F140F;
}
.card-body {
  padding: 1.5rem;
}
</style>