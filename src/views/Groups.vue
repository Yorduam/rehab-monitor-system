<template>
  <div>
    <div class="toolbar">
      <div class="search-field">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" v-model="search" placeholder="Поиск групп…" @input="onSearchInput" />
      </div>
      <button class="btn-primary" @click="openAddModal">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Создать группу
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>
    <div v-else-if="groups.length === 0" class="empty-state">
      <p>Нет групп</p>
    </div>
    <div v-else class="items-grid">
      <div v-for="g in groups" :key="g.id" class="item-card" @click="openDetailsModal(g)">
        <div class="actions">
          <button @click.stop="editGroup(g)">✏️</button>
          <button @click.stop="deleteGroup(g.id)">🗑</button>
        </div>
        <div class="top">
          <div>
            <div class="name">{{ g.name }}</div>
            <div class="sub">Куратор: {{ g.curator || '—' }}</div>
          </div>
        </div>
        <div class="tags">
          <span class="badge badge-gray">{{ g.participantsCount || 0 }} уч.</span>
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
      <form @submit.prevent="saveGroup">
        <div class="form-group">
          <label class="form-label">Название</label>
          <input v-model="form.name" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label">Куратор</label>
          <select v-model="form.curatorId" class="form-input" required>
            <option disabled value="">Выберите куратора</option>
            <option v-for="c in curators" :key="c.id" :value="c.id">{{ c.fullName }}</option>
          </select>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="modalVisible = false">Отмена</button>
          <button type="submit" class="btn-primary">Сохранить</button>
        </div>
      </form>
    </Modal>

    
    <Modal v-if="detailsModalVisible" :title="`Группа: ${selectedGroup?.name}`" @close="detailsModalVisible = false">
      <div class="group-details">
        <div class="detail-row">
          <span class="detail-label">Куратор:</span>
          <span class="detail-value">{{ selectedGroup?.curator || '—' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Участники:</span>
          <div class="participants-list">
            <div v-if="participantsLoading" class="loading-small">Загрузка...</div>
            <div v-else-if="participants.length === 0" class="empty-small">Нет участников</div>
            <div v-else v-for="p in participants" :key="p.id" class="participant-item">
              <img :src="p.photo || defaultPhoto" class="participant-avatar" />
              <div class="participant-info">
                <div class="participant-name">{{ fullName(p) }}</div>
                <div class="participant-meta">{{ recipientAge(p) != null ? recipientAge(p) + ' лет · ' : '' }}{{ p.diagnosis || '—' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="detailsModalVisible = false">Закрыть</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { fullName, recipientAge } from '../utils/recipient'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const groups = ref([])
const search = ref('')
const page = ref(1)
const limit = ref(15)
const totalPages = ref(1)
const loading = ref(false)
const modalVisible = ref(false)
const modalTitle = ref('')
const form = ref({ name: '', curatorId: '' })
const editId = ref(null)
const curators = ref([])
let searchTimeout = null


const detailsModalVisible = ref(false)
const selectedGroup = ref(null)
const participants = ref([])
const participantsLoading = ref(false)
const defaultPhoto = 'https://via.placeholder.com/100'

const loadCurators = async () => {
  try {
    const res = await api.get('/lists/curators')
    curators.value = res.data
  } catch (err) {
    console.error('Ошибка загрузки кураторов:', err)
  }
}

const loadGroups = async () => {
  loading.value = true
  try {
    const res = await api.get('/groups', {
      params: { page: page.value, limit: limit.value, search: search.value || undefined }
    })
    groups.value = res.data.data || []
    totalPages.value = res.data.totalPages || 1
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
    loadGroups()
  }, 300)
}

const changePage = (newPage) => {
  page.value = newPage
  loadGroups()
}

const changeLimit = (newLimit) => {
  limit.value = newLimit
  page.value = 1
  loadGroups()
}


const openDetailsModal = async (group) => {
  selectedGroup.value = group
  detailsModalVisible.value = true
  participantsLoading.value = true
  participants.value = []
  try {
    const res = await api.get(`/groups/${group.id}/recipients`)
    participants.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    participantsLoading.value = false
  }
}

const openAddModal = () => {
  editId.value = null
  form.value = { name: '', curatorId: curators.value[0]?.id || '' }
  modalTitle.value = 'Создать группу'
  modalVisible.value = true
}

const editGroup = (g) => {
  editId.value = g.id
  form.value = {
    name: g.name,
    curatorId: g.curatorId || ''
  }
  modalTitle.value = 'Редактировать группу'
  modalVisible.value = true
}

const saveGroup = async () => {
  try {
    const payload = { ...form.value }
    if (editId.value) {
      await api.put(`/groups/${editId.value}`, payload)
    } else {
      await api.post('/groups', payload)
    }
    await loadGroups()
    modalVisible.value = false
  } catch (err) {
    console.error(err)
    alert('Ошибка сохранения')
  }
}

const deleteGroup = async (id) => {
  if (confirm('Удалить группу?')) {
    await api.delete(`/groups/${id}`)
    await loadGroups()
  }
}

onMounted(async () => {
  await loadCurators()
  loadGroups()
})
</script>

<style scoped>
.group-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.detail-label {
  width: 100px;
  font-weight: 600;
  color: var(--text-secondary);
}
.detail-value {
  flex: 1;
}
.participants-list {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.participant-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: var(--bg-surface-sunken);
  border-radius: var(--radius-md);
}
.participant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.participant-info {
  flex: 1;
}
.participant-name {
  font-weight: 600;
}
.participant-meta {
  font-size: 0.7rem;
  color: var(--text-tertiary);
}
.loading-small, .empty-small {
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: center;
  padding: 1rem;
}

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
@keyframes spin {
  to { transform: rotate(360deg); }
}
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