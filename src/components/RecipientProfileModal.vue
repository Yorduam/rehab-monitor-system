<template>
  <Modal title="Профиль реабилитанта" @close="$emit('close')">
    <div class="profile-content" v-if="recipient">
      
      <div class="profile-header">
        <div class="profile-photo">
          <img :src="recipient.photo || defaultPhoto" />
        </div>
        <div>
          <h2 class="profile-name">{{ recipient.fullName }}</h2>
          <p class="profile-meta">{{ recipient.age }} лет</p>
        </div>
      </div>

      
      <div class="profile-tabs">
        <button v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>

      
      <div class="tab-content">
        
        <div v-if="activeTab === 'general'" class="general-info-grid">
          <div class="info-card">
            <span class="label">Группа</span>
            <span class="value">{{ recipient.group?.name || recipient.groupName || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Куратор</span>
            <span class="value">{{ recipient.group?.curatorUser?.fullName || 'Не назначен' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Диагноз</span>
            <span class="value">{{ recipient.diagnosis || 'Не указан' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Посещаемость</span>
            <span class="value">{{ recipient.attendance || 0 }}%</span>
          </div>
          <div class="info-card">
            <span class="label">Контакты</span>
            <span class="value">{{ recipient.contacts || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Законный представитель</span>
            <span class="value">{{ recipient.legalRepresentative || '—' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Уровень агрессии</span>
            <span class="value">{{ recipient.aggressionLevel || 1 }} / 5</span>
          </div>
          <div class="info-card">
            <span class="label">Статус реабилитации</span>
            <span class="value">{{ recipient.completionStatus === 'completed' ? 'Прошел' : 'В процессе' }}</span>
          </div>
          <div class="info-card full-width">
            <span class="label">Описание угрозы</span>
            <span class="value">{{ recipient.aggressionNote || '—' }}</span>
          </div>
        </div>

        
        <div v-if="activeTab === 'documents'" class="documents-list">
          <div v-if="documents.length === 0" class="empty-placeholder">
            <p>Нет загруженных документов</p>
            <button class="btn-secondary" @click="addDocument">+ Добавить документ</button>
          </div>
          <div v-else v-for="doc in documents" :key="doc.id" class="document-item">
            <span>{{ doc.name }}</span>
            <button class="btn-ghost-sm" @click="viewDocument(doc)">👁️</button>
          </div>
        </div>

        
        <div v-if="activeTab === 'program'" class="program-info">
          <div class="info-card full-width">
            <span class="label">Текущая программа</span>
            <span class="value">{{ program.name || 'Индивидуальная программа реабилитации' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Этап</span>
            <span class="value">{{ program.stage || 'Активная реабилитация' }}</span>
          </div>
          <div class="info-card">
            <span class="label">Прогресс</span>
            <div class="progress-bar-container">
              <div class="progress-bar"><div class="progress-fill" :style="{ width: (program.progress || 0) + '%' }"></div></div>
              <span class="value">{{ program.progress || 0 }}%</span>
            </div>
          </div>
          <div class="info-card full-width" v-if="program.description">
            <span class="label">Описание</span>
            <span class="value">{{ program.description }}</span>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button class="btn-primary" @click="editProfile">Редактировать</button>
        <button class="btn-secondary" @click="$emit('close')">Закрыть</button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue';
import Modal from './Modal.vue';

const props = defineProps({
  recipient: { type: Object, required: true }
});
const emit = defineEmits(['close', 'edit']);

const defaultPhoto = 'https://via.placeholder.com/120';
const activeTab = ref('general');
const tabs = [
  { id: 'general', label: 'Общие сведения' },
  { id: 'documents', label: 'Документы' },
  { id: 'program', label: 'Программа' }
];


const documents = ref([]);
const program = ref({
  name: 'Социокультурная адаптация',
  stage: 'Активная реабилитация',
  progress: 67,
  description: 'Развитие коммуникативных навыков через творчество'
});

const addDocument = () => { console.log('Добавление документа'); };
const viewDocument = (doc) => { console.log('Просмотр документа', doc); };
const editProfile = () => { emit('edit'); };
</script>

<style scoped>
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.profile-header {
  display: flex;
  gap: 1rem;
  align-items: center;
  border-bottom: 1px solid var(--border);
  padding-bottom: 1rem;
}
.profile-photo {
  width: 100px;
  height: 100px;
}
.profile-photo img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--accent);
}
.profile-name {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}
.profile-meta {
  color: var(--text-secondary);
  font-size: 0.85rem;
}
.profile-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}
.profile-tabs button {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.profile-tabs button.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.tab-content {
  padding: 0.5rem 0;
}
.general-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}
.info-card {
  background: var(--bg-surface-sunken);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.85rem;
}
.info-card.full-width {
  grid-column: span 2;
}
.label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: 0.15rem;
  display: block;
}
.value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-word;
}
.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--bg-surface-sunken);
  border-radius: 10px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--accent);
  width: 0%;
}
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.empty-placeholder {
  text-align: center;
  padding: 1rem;
  color: var(--text-secondary);
}
.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: var(--bg-surface-sunken);
  border-radius: var(--radius-md);
}
.btn-ghost-sm {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}
.program-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.profile-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}
.btn-primary, .btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
}
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
}
</style>