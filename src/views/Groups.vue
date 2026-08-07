<template>
  <div class="groups-page">
    <header class="g-header">
      <div>
        <h1 class="g-title">Группы</h1>
        <p class="g-sub">Учебные группы и закреплённые кураторы.</p>
      </div>
    </header>
    <div class="toolbar">
      <div class="search-field">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" v-model="search" placeholder="Поиск групп…" @input="onSearchInput" />
      </div>
      <button v-if="canCreateGroup" class="btn-primary" @click="openAddModal">
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
        <div v-if="canEditGroup || canDeleteGroup" class="actions">
          <button v-if="canEditGroup" @click.stop="editGroup(g)">✏️</button>
          <button v-if="canDeleteGroup" @click.stop="deleteGroup(g.id)">🗑</button>
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
        <div v-if="authStore.isAdmin" class="form-group">
          <label class="form-label">Куратор</label>
          <select v-model="form.curatorUserId" class="form-input" required>
            <option disabled value="">Выберите куратора</option>
            <option v-for="c in curators" :key="c.id" :value="c.id">{{ c.fullName }}</option>
          </select>
          <p class="field-hint">Куратор группы — преподаватель. Он увидит эту группу в своём личном кабинете.</p>
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
              <button
                class="participant-remove"
                :disabled="assignBusyId === p.id"
                title="Открепить от группы"
                @click="removeRecipient(p)"
              >
                {{ assignBusyId === p.id ? '…' : '✕' }}
              </button>
            </div>
          </div>
        </div>

        <div class="assign-block">
          <span class="detail-label">Добавить в группу:</span>
          <div class="assign-row">
            <select v-model="assignRecipientId" class="form-input assign-select" :disabled="assignBusyId !== null">
              <option value="">Выберите реабилитанта…</option>
              <option v-for="r in availableRecipients" :key="r.id" :value="r.id">
                {{ fullName(r) }}{{ currentGroupName(r) ? ' — сейчас в «' + currentGroupName(r) + '»' : '' }}
              </option>
            </select>
            <button
              class="btn-primary assign-btn"
              :disabled="!assignRecipientId || assignBusyId !== null"
              @click="assignRecipient"
            >
              Добавить
            </button>
          </div>
          <div v-if="!availableRecipients.length" class="empty-small" style="text-align:left;padding:0.35rem 0">
            Нет доступных реабилитантов для добавления.
          </div>
          <p v-if="assignError" class="assign-error">{{ assignError }}</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="detailsModalVisible = false">Закрыть</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'
import { fullName, recipientAge } from '../utils/recipient'
import { notifySaved } from '../utils/toast'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'

const authStore = useAuthStore()

const canCreateGroup = computed(() => authStore.isAdmin || authStore.isTeacher)
const canEditGroup = computed(() => authStore.isAdmin || authStore.isTeacher)
const canDeleteGroup = computed(() => authStore.isAdmin)

const groups = ref([])
const search = ref('')
const page = ref(1)
const limit = ref(15)
const totalPages = ref(1)
const loading = ref(false)
const modalVisible = ref(false)
const modalTitle = ref('')
const form = ref({ name: '', curatorUserId: '' })
const editId = ref(null)
const curators = ref([])
let searchTimeout = null


const detailsModalVisible = ref(false)
const selectedGroup = ref(null)
const participants = ref([])
const participantsLoading = ref(false)
const defaultPhoto = 'https://via.placeholder.com/100'

const allRecipients = ref([])
const assignRecipientId = ref('')
const assignBusyId = ref(null)
const assignError = ref('')

const availableRecipients = computed(() => {
  const gid = selectedGroup.value?.id
  const taken = new Set(participants.value.map((p) => p.id))
  return allRecipients.value.filter((r) => r.id !== undefined && !taken.has(r.id) && r.groupId !== gid)
})

const loadAllRecipients = async () => {
  try {
    const res = await api.get('/recipients', { params: { page: 1, limit: 500 } })
    allRecipients.value = res.data.data || []
  } catch (err) {
    console.error('Не удалось загрузить список реабилитантов', err)
    allRecipients.value = []
  }
}

const loadParticipants = async (groupId) => {
  participantsLoading.value = true
  participants.value = []
  try {
    const res = await api.get(`/groups/${groupId}/recipients`)
    participants.value = res.data
  } catch (err) {
    console.error(err)
  } finally {
    participantsLoading.value = false
  }
}

const currentGroupName = (r) => {
  const g = groups.value.find((x) => x.id === r.groupId)
  return g ? g.name : null
}

const assignRecipient = async () => {
  const id = Number(assignRecipientId.value)
  if (!id || !selectedGroup.value) return
  assignBusyId.value = id
  assignError.value = ''
  try {
    const groupName = selectedGroup.value.name
    await api.put(`/recipients/${id}`, { groupId: selectedGroup.value.id })
    assignRecipientId.value = ''
    await loadParticipants(selectedGroup.value.id)
    await Promise.all([loadGroups(), loadAllRecipients()])
    if (selectedGroup.value) selectedGroup.value.participantsCount = participants.value.length
    notifySaved(`Реабилитант добавлен в группу «${groupName}»`)
  } catch (err) {
    console.error('assignRecipient', err)
    assignError.value = err.response?.data?.message || 'Не удалось добавить реабилитанта в группу'
  } finally {
    assignBusyId.value = null
  }
}

const removeRecipient = async (recipient) => {
  if (!selectedGroup.value) return
  if (!confirm(`Открепить «${fullName(recipient)}» от группы «${selectedGroup.value.name}»?`)) return
  assignBusyId.value = recipient.id
  assignError.value = ''
  try {
    await api.put(`/recipients/${recipient.id}`, { groupId: null })
    await loadParticipants(selectedGroup.value.id)
    await Promise.all([loadGroups(), loadAllRecipients()])
    if (selectedGroup.value) selectedGroup.value.participantsCount = participants.value.length
    notifySaved(`«${fullName(recipient)}» откреплён от группы`)
  } catch (err) {
    console.error('removeRecipient', err)
    assignError.value = err.response?.data?.message || 'Не удалось открепить реабилитанта'
  } finally {
    assignBusyId.value = null
  }
}

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
  selectedGroup.value = { ...group }
  detailsModalVisible.value = true
  assignRecipientId.value = ''
  assignError.value = ''
  await loadParticipants(group.id)
  loadAllRecipients()
}

const openAddModal = () => {
  editId.value = null
  form.value = { name: '', curatorUserId: curators.value[0]?.id || '' }
  modalTitle.value = 'Создать группу'
  modalVisible.value = true
}

const editGroup = (g) => {
  editId.value = g.id
  form.value = {
    name: g.name,
    curatorUserId: g.curatorUserId || ''
  }
  modalTitle.value = 'Редактировать группу'
  modalVisible.value = true
}

const saveGroup = async () => {
  try {
    const payload = { ...form.value }
    payload.curatorUserId = payload.curatorUserId || null
    const editing = !!editId.value
    const name = payload.name || ''
    if (editing) {
      await api.put(`/groups/${editId.value}`, payload)
    } else {
      await api.post('/groups', payload)
    }
    await loadGroups()
    modalVisible.value = false
    notifySaved(editing
      ? (name ? `Группа «${name}» сохранена` : 'Изменения сохранены')
      : (name ? `Группа «${name}» создана` : 'Группа создана'))
  } catch (err) {
    console.error(err)
    alert('Ошибка сохранения')
  }
}

const deleteGroup = async (id) => {
  const g = groups.value.find((x) => x.id === id)
  const cnt = g?.participantsCount || 0
  const msg = cnt > 0
    ? `В группе ${cnt} участник(ов). Они будут откреплены от группы (не удалены). Удалить группу «${g?.name || ''}»?`
    : `Удалить группу «${g?.name || ''}»?`
  if (!confirm(msg)) return
  try {
    await api.delete(`/groups/${id}`)
    await loadGroups()
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Не удалось удалить группу')
  }
}

onMounted(async () => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED')
  await loadCurators()
  loadGroups()
})
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app')
})
</script>

<style scoped>
.groups-page { font-family: 'Inter', system-ui, sans-serif; color: #131713; }

.g-header { margin-bottom: 1.5rem; }
.g-title {
  font-family: 'Lora', Georgia, serif; font-weight: 600;
  font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0;
}
.g-sub { color: #4F564A; font-size: 0.95rem; margin: 0.35rem 0 0; }

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
  color: #4F564A;
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
  background: #F3EEE4;
  border-radius: 0.65rem;
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
  color: #6E7368;
}
.loading-small, .empty-small {
  font-size: 0.8rem;
  color: #4F564A;
  text-align: center;
  padding: 1rem;
}
.participant-remove {
  flex: 0 0 auto;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  border: 1px solid #E4DECF;
  background: #FFFFFF;
  color: #8A5148;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.participant-remove:hover:not(:disabled) { background: #FAE9E0; border-color: #E7C6BB; }
.participant-remove:disabled { opacity: 0.5; cursor: default; }
.assign-block {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #EFEADC;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.assign-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}
.assign-select { flex: 1; min-width: 0; }
.assign-btn { flex: 0 0 auto; white-space: nowrap; }
.assign-error {
  margin: 0;
  font-size: 0.78rem;
  color: #B0533F;
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
  background: #FFFFFF;
  border: 1px solid #D6CFBE;
  border-radius: 0.7rem;
  padding: 0.4rem 0.75rem;
  flex: 1;
  max-width: 320px;
  color: #6E7368;
}
.search-field:focus-within { border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95,126,69,0.18); }
.search-field input {
  border: none;
  background: none;
  outline: none;
  width: 100%;
  color: #131713;
  font-family: inherit;
}
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.item-card {
  background: #FFFFFF;
  border: 1px solid #E4DECF;
  border-radius: 1rem;
  padding: 1.1rem;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.18s, transform 0.18s, border-color 0.18s;
}
.item-card:hover {
  box-shadow: 0 .25rem .875rem rgba(17,34,17,.08);
  transform: translateY(-2px);
  border-color: #D6CFBE;
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
  border-radius: 0.4rem;
}
.actions button:hover { background: #F3EEE4; }
.top {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.name {
  font-weight: 700;
  color: #131713;
}
.sub {
  font-size: 0.8rem;
  color: #4F564A;
}
.sub-teacher { color: #2F4A2F; margin-top: 0.15rem; }
.field-hint {
  margin: 0.35rem 0 0;
  font-size: 0.72rem;
  color: #6E7368;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.badge {
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-weight: 500;
}
.badge-blue {
  background: #EEF4E2;
  color: #2F4A2F;
}
.badge-gray {
  background: #F3EEE4;
  color: #4F564A;
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
@keyframes spin {
  to { transform: rotate(360deg); }
}
.form-group {
  margin-bottom: 1rem;
}
.form-label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4F564A;
}
.form-input {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border: 1px solid #E4DECF;
  border-radius: 0.65rem;
  background: #FFFFFF;
  color: #131713;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus {
  outline: none;
  border-color: #5F7E45;
  box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: #2F4A2F;
  color: #F4F8EC;
  border: 1px solid #2F4A2F;
  padding: 0.55rem 1.1rem;
  border-radius: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, border-color 0.15s;
}
.btn-primary:hover { background: #24391F; border-color: #24391F; }
.btn-secondary {
  background: #F3EEE4;
  border: 1px solid #E4DECF;
  color: #131713;
  padding: 0.55rem 1.1rem;
  border-radius: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.btn-secondary:hover { background: #EBE4D5; }
</style>