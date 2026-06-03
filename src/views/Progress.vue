<template>
  <div>
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
          <div class="name">{{ r.fullName }}</div>
          <div class="sub">{{ r.age }} лет · {{ r.group?.curator?.fullName || '—' }}</div>
          <div class="tags">
            <span class="badge-blue">{{ r.diagnosis }}</span>
            <span class="badge-gray">{{ r.group?.name || r.groupName || '—' }}</span>
            <span class="badge-green">{{ r.attendance || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :limit="limit" @update:page="changePage" @update:limit="changeLimit" />

    <div v-if="selectedRecipient" class="progress-detail">
      <div class="card">
        <div class="card-header"><div class="card-title">Динамика показателей: {{ selectedRecipient.fullName }}</div></div>
        <div class="card-body"><canvas id="radarChart" style="max-height:400px;"></canvas></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../api';
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
  if (!selectedRecipient.value) return;
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
    const textColor = isDark ? '#9bb4c9' : '#2c4c6e';
    const gridColor = isDark ? '#2d4255' : '#cbdde6';
    chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          { label: 'Текущий уровень', data: scores, borderColor: '#1a5d8f', backgroundColor: 'rgba(26,93,143,0.2)', pointBackgroundColor: '#1a5d8f', borderWidth: 2 },
          { label: 'Целевой уровень', data: targetScores, borderColor: '#94a3b8', backgroundColor: 'rgba(148,163,184,0.1)', borderDash: [5,5], pointBackgroundColor: '#94a3b8', borderWidth: 2 }
        ]
      },
      options: { responsive: true, scales: { r: { beginAtZero: true, max: 5, ticks: { stepSize: 1, color: textColor }, grid: { color: gridColor }, pointLabels: { color: textColor } } }, plugins: { legend: { labels: { color: textColor, usePointStyle: true } } } }
    });
  });
};

const observer = new MutationObserver(() => { if (selectedRecipient.value) renderRadar(); });
observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
onMounted(loadRecipients);
</script>


<style scoped>
.toolbar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.search-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.3rem 0.7rem;
  flex: 1;
  max-width: 300px;
}
.search-field input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
}
.styled-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.item-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.item-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.item-card.active {
  border-color: #4b5675;
  box-shadow: 0 0 0 2px rgba(75, 86, 117, 0.2);
}
.top {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.name {
  font-weight: 700;
}
.sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.badge {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  font-weight: 500;
}
.badge-blue {
  background: #d4e6ff;
  color: #1a3a6b;
}
.badge-gray {
  background: #e9f0fa;
  color: #2c4c7c;
}
.badge-green {
  background: #cce5ff;
  color: #0a2f5a;
}
.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(75, 86, 117, 0.2);
  border-top-color: #4b5675;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.progress-detail {
  margin-top: 2rem;
}
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border);
}
.card-title {
  font-weight: 700;
  font-size: 1.1rem;
}
.card-body {
  padding: 1.5rem;
}
</style>