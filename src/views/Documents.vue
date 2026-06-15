<template>
  <div>
    <div v-if="isAdmin || isTeacher" class="recipients-list">
      <h3>Выберите реабилитанта</h3>
      <div class="items-grid">
        <div
          v-for="r in recipients"
          :key="r.id"
          class="recipient-card"
          :class="{ active: selectedRecipient?.id === r.id }"
          @click="selectRecipient(r)"
        >
          <img :src="r.photo || defaultPhoto" class="avatar">
          <div>{{ fullName(r) }}</div>
        </div>
      </div>
    </div>

    <div class="documents-section">
      <div class="doc-header">
        <h3>{{ isRecipient ? 'Мои документы' : `Документы: ${selectedRecipient ? fullName(selectedRecipient) : '...'}` }}</h3>
        <button v-if="canEdit && (isRecipient || selectedRecipient)" class="btn-primary" @click="openEditModal">
          {{ doc ? 'Редактировать' : 'Добавить документ' }}
        </button>
      </div>

      <div v-if="loading" class="empty-state">Загрузка…</div>
      <div v-else-if="!doc" class="empty-state">Документ не заполнен</div>
      <div v-else class="doc-card">
        <div class="doc-row"><span class="doc-key">Тип документа</span><span class="doc-val">{{ doc.docType }}</span></div>
        <div class="doc-row"><span class="doc-key">Серия / номер</span><span class="doc-val">{{ doc.docSeries }} {{ doc.docNumber }}</span></div>
        <div class="doc-row"><span class="doc-key">Кем выдан</span><span class="doc-val">{{ doc.docIssuer || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">Дата выдачи</span><span class="doc-val">{{ doc.docIssuerDate || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">СНИЛС</span><span class="doc-val">{{ doc.snils || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">МСЭ выдана</span><span class="doc-val">{{ doc.mseIssueDate || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">МСЭ действительна до</span><span class="doc-val">{{ doc.mseValidDate || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">Адрес регистрации</span><span class="doc-val">{{ doc.regAddress || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">Адрес проживания</span><span class="doc-val">{{ doc.factSameReg ? doc.regAddress : (doc.factAddress || '—') }}</span></div>
        <div class="doc-row"><span class="doc-key">Место обучения</span><span class="doc-val">{{ doc.educationPlace || '—' }}</span></div>
        <div class="doc-row"><span class="doc-key">Особые отметки</span><span class="doc-val">{{ doc.specialNote || '—' }}</span></div>
        <div v-if="canEdit" class="doc-actions">
          <button class="btn-ghost-sm" @click="deleteDoc">Удалить</button>
        </div>
      </div>
    </div>

    <Modal v-if="modalVisible" :title="doc ? 'Редактировать документ' : 'Добавить документ'" @close="modalVisible = false">
      <form @submit.prevent="saveDoc">
        <div class="form-group">
          <label>Тип документа</label>
          <select v-model="form.docType">
            <option value="Свидетельство">Свидетельство</option>
            <option value="Паспорт">Паспорт</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Серия</label><input v-model="form.docSeries" required></div>
          <div class="form-group"><label>Номер</label><input v-model="form.docNumber" required></div>
        </div>
        <div class="form-group"><label>Кем выдан</label><input v-model="form.docIssuer" required></div>
        <div class="form-group"><label>Дата выдачи</label><input type="date" v-model="form.docIssuerDate" required></div>
        <div class="form-group"><label>СНИЛС</label><input v-model="form.snils" maxlength="14" required></div>
        <div class="form-row">
          <div class="form-group"><label>МСЭ выдана</label><input type="date" v-model="form.mseIssueDate" required></div>
          <div class="form-group"><label>МСЭ до</label><input type="date" v-model="form.mseValidDate" required></div>
        </div>
        <div class="form-group"><label>Адрес регистрации</label><input v-model="form.regAddress" required></div>
        <div class="form-group">
          <label><input type="checkbox" v-model="form.factSameReg"> Совпадает с фактическим</label>
        </div>
        <div class="form-group" v-if="!form.factSameReg"><label>Адрес проживания</label><input v-model="form.factAddress"></div>
        <div class="form-group"><label>Место обучения</label><input v-model="form.educationPlace" required></div>
        <div class="form-group"><label>Особые отметки</label><textarea v-model="form.specialNote"></textarea></div>
        <div class="modal-buttons">
          <button type="button" class="btn-secondary" @click="modalVisible = false">Отмена</button>
          <button type="submit" class="btn-primary">Сохранить</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { fullName } from '../utils/recipient';
import api from '../api';
import Modal from '../components/Modal.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);
const isTeacher = computed(() => authStore.isTeacher);
const isRecipient = computed(() => authStore.isRecipient);
const canEdit = computed(() => isAdmin.value || isTeacher.value || isRecipient.value);

const recipients = ref([]);
const selectedRecipient = ref(null);
const doc = ref(null);
const loading = ref(false);
const modalVisible = ref(false);
const defaultPhoto = 'https://via.placeholder.com/100';

const emptyForm = () => ({
  docType: 'Свидетельство', docSeries: '', docNumber: '', docIssuer: '', docIssuerDate: '',
  snils: '', mseIssueDate: '', mseValidDate: '', regAddress: '', factAddress: '',
  factSameReg: false, educationPlace: '', specialNote: ''
});
const form = ref(emptyForm());

const loadRecipients = async () => {
  if (!isAdmin.value && !isTeacher.value) return;
  const { data } = await api.get('/recipients', { params: { limit: 100 } });
  recipients.value = data.data || [];
};

const loadDoc = async () => {
  loading.value = true;
  doc.value = null;
  try {
    let data;
    if (isRecipient.value) {
      ({ data } = await api.get('/documents/my'));
    } else if (selectedRecipient.value) {
      ({ data } = await api.get(`/documents/recipient/${selectedRecipient.value.id}`));
    } else {
      return;
    }
    doc.value = Array.isArray(data) ? (data[0] || null) : data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const selectRecipient = (r) => {
  selectedRecipient.value = r;
  loadDoc();
};

const openEditModal = () => {
  form.value = doc.value ? { ...emptyForm(), ...doc.value } : emptyForm();
  modalVisible.value = true;
};

const saveDoc = async () => {
  const recipientId = selectedRecipient.value?.id;
  const payload = { ...form.value };
  if (!isRecipient.value) payload.recipientId = recipientId;
  try {
    if (doc.value) {
      await api.put(`/documents/${doc.value.id}`, payload);
    } else {
      await api.post('/documents', payload);
    }
    modalVisible.value = false;
    await loadDoc();
  } catch (err) {
    console.error(err);
    alert('Ошибка при сохранении документа');
  }
};

const deleteDoc = async () => {
  if (!doc.value || !confirm('Удалить документ?')) return;
  await api.delete(`/documents/${doc.value.id}`);
  await loadDoc();
};

onMounted(() => {
  if (isRecipient.value) loadDoc();
  else loadRecipients();
});
</script>

<style scoped>
.recipients-list { margin-bottom: 2rem; }
.items-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
.recipient-card {
  display: flex; flex-direction: column; align-items: center; cursor: pointer;
  padding: 0.5rem; border-radius: var(--radius-md); transition: 0.2s;
}
.recipient-card:hover, .recipient-card.active { background: var(--bg-surface-sunken); }
.avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 0.5rem; }
.doc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.doc-card {
  background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
  padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.6rem;
}
.doc-row { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem; }
.doc-key { color: var(--text-tertiary); font-size: 0.8rem; }
.doc-val { font-weight: 600; text-align: right; }
.doc-actions { margin-top: 0.5rem; display: flex; justify-content: flex-end; }
.empty-state { padding: 2rem; text-align: center; color: var(--text-secondary); }
.form-group { margin-bottom: 1rem; }
.form-row { display: flex; gap: 0.75rem; }
.form-row .form-group { flex: 1; }
.form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.8rem; font-weight: 600; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 0.5rem; border-radius: var(--radius-md);
  border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-primary);
}
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.btn-ghost-sm { background: none; border: none; cursor: pointer; color: var(--red); }
</style>
