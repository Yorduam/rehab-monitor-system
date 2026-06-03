<template>
  <div>
    <div class="toolbar">
      <div class="search-field">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" v-model="search" placeholder="Поиск программ…" @input="onSearchInput" />
      </div>
      <button class="btn-primary" @click="openAddModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Создать программу
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>
    <div v-else-if="programs.length === 0" class="empty-state">
      <p>Нет программ</p>
    </div>
    <div v-else class="items-grid">
      <div v-for="p in programs" :key="p.id" class="item-card">
        <div class="actions">
          <button @click.stop="editProgram(p)">✏️</button>
          <button @click.stop="deleteProgram(p.id)">🗑</button>
        </div>
        <div class="top">
          <div>
            <div class="name">{{ p.name }}</div>
            <div class="sub">{{ p.description }}</div>
          </div>
        </div>
        <div class="progress-row">
          <span>Прогресс: {{ p.progress || 0 }}%</span>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: (p.progress || 0) + '%' }"></div>
          </div>
        </div>
        <div class="tags">
          <span v-for="sub in p.subjects" :key="sub" class="badge badge-blue">{{ sub }}</span>
          <span class="badge badge-gray">{{ p.totalHours }}ч · {{ p.totalWeeks }} нед.</span>
        </div>
      </div>
    </div>

    <Pagination
      v-if="totalPages > 1"
      :page="page"
      :total-pages="totalPages"
      :limit="limit"
      @update:page="changePage"
      @update:limit="changeLimit"
    />

    <Modal v-if="modalVisible" :title="modalTitle" @close="modalVisible = false">
      <form @submit.prevent="saveProgram">
        <div class="form-group">
          <label class="form-label">Название</label>
          <input v-model="form.name" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <textarea v-model="form.description" rows="2" class="form-input"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Всего часов</label>
          <input v-model.number="form.totalHours" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Недель</label>
          <input v-model.number="form.totalWeeks" type="number" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Предметы (через запятую)</label>
          <input v-model="subjectsStr" placeholder="например: ИЗО, Театр" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">Назначить группе</label>
          <select v-model="form.groupId" class="form-input">
            <option :value="null">Не назначена</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="modalVisible = false">Отмена</button>
          <button type="submit" class="btn-primary">Сохранить</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const programs = ref([])
const groups = ref([])
const search = ref('')
const page = ref(1)
const limit = ref(15)
const totalPages = ref(1)
const loading = ref(false)
const modalVisible = ref(false)
const modalTitle = ref('')
const form = ref({
  name: '',
  description: '',
  totalHours: 0,
  totalWeeks: 0,
  subjects: [],
  progress: 0,
  groupId: null
})
const subjectsStr = ref('')
const editId = ref(null)
let searchTimeout = null

const loadGroups = async () => {
  const { data } = await api.get('/groups')
  groups.value = Array.isArray(data) ? data : data.data || []
}

const loadPrograms = async () => {
  loading.value = true
  try {
    const res = await api.get('/programs', {
      params: { page: page.value, limit: limit.value, search: search.value || undefined }
    })
    let dataArray = []
    let total = 0
    if (Array.isArray(res.data)) {
      dataArray = res.data
      total = dataArray.length
    } else if (res.data && Array.isArray(res.data.data)) {
      dataArray = res.data.data
      total = res.data.total || dataArray.length
      totalPages.value = res.data.totalPages || Math.ceil(total / limit.value)
    } else if (res.data && Array.isArray(res.data.rows)) {
      dataArray = res.data.rows
      total = res.data.count || dataArray.length
      totalPages.value = Math.ceil(total / limit.value)
    } else {
      dataArray = []
    }
    programs.value = dataArray
    if (totalPages.value === 1 && total > 0) {
      totalPages.value = Math.ceil(total / limit.value)
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadPrograms()
  }, 300)
}

const changePage = (newPage) => {
  page.value = newPage
  loadPrograms()
}
const changeLimit = (newLimit) => {
  limit.value = newLimit
  page.value = 1
  loadPrograms()
}

const openAddModal = () => {
  editId.value = null
  form.value = {
    name: '',
    description: '',
    totalHours: 0,
    totalWeeks: 0,
    subjects: [],
    progress: 0,
    groupId: null
  }
  subjectsStr.value = ''
  modalTitle.value = 'Создать программу'
  modalVisible.value = true
}

const editProgram = (p) => {
  editId.value = p.id
  form.value = { ...p }
  subjectsStr.value = (p.subjects || []).join(',')
  modalTitle.value = 'Редактировать программу'
  modalVisible.value = true
}

const saveProgram = async () => {
  const subjects = subjectsStr.value.split(',').map(s => s.trim()).filter(s => s)
  const data = { ...form.value, subjects }
  try {
    if (editId.value) {
      await api.put(`/programs/${editId.value}`, data)
    } else {
      await api.post('/programs', data)
    }
    await loadPrograms()
    modalVisible.value = false
  } catch (err) {
    console.error(err)
    alert('Ошибка сохранения')
  }
}

const deleteProgram = async (id) => {
  if (confirm('Удалить программу?')) {
    await api.delete(`/programs/${id}`)
    await loadPrograms()
  }
}

onMounted(async () => {
  await loadGroups()
  loadPrograms()
})
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
  position: relative;
  transition: all 0.2s;
}
.item-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: none;
  gap: 0.3rem;
}
.item-card:hover .actions {
  display: flex;
}
.actions button {
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.25rem;
}
.top {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.name {
  font-weight: 700;
}
.sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
}
.progress-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-tertiary);
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-surface-sunken);
  border-radius: 99px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 99px;
  background: #4b5675;
  transition: width 0.4s ease;
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
.form-group {
  margin-bottom: 1rem;
}
.form-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.btn-primary {
  background: #4b5675;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}
</style>