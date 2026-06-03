<template>
  <div>
    <div class="toolbar">
      <button class="btn-primary" @click="openAddModal">+ Add Document</button>
    </div>

    <div v-if="isAdmin || isTeacher" class="recipients-list">
      <h3>Выберите реабилитанта</h3>
      <div class="items-grid">
        <div v-for="r in recipients" :key="r.id" class="recipient-card" @click="selectRecipient(r)">
          <img :src="r.photo || defaultPhoto" class="avatar">
          <div>{{ r.fullName }}</div>
        </div>
      </div>
    </div>

    <div class="documents-section">
      <div class="doc-header">
        <h3>{{ isRecipient ? 'Мои документы' : `Документы: ${selectedRecipient?.fullName || '...'}` }}</h3>
      </div>
      <div class="documents-grid">
        <div v-for="doc in documents" :key="doc.id" class="document-card">
          <div class="doc-icon">📄</div>
          <div class="doc-info">
            <div class="doc-name">{{ doc.name }}</div>
            <div class="doc-meta">{{ doc.type }} · {{ formatSize(doc.size) }}</div>
          </div>
          <div class="doc-actions">
            <a :href="doc.url" target="_blank" class="btn-ghost-sm">Открыть</a>
            <button v-if="canEdit" class="btn-ghost-sm" @click="editDocument(doc)">✏️</button>
            <button v-if="canEdit" class="btn-ghost-sm" @click="deleteDocument(doc.id)">🗑</button>
          </div>
        </div>
        <div v-if="documents.length === 0" class="empty-state">Нет документов</div>
      </div>
    </div>

    <!-- Модалка добавления/редактирования документа -->
    <Modal v-if="modalVisible" :title="modalTitle" @close="modalVisible = false">
      <form @submit.prevent="saveDocument">
        <div class="form-group">
          <label>Document Type</label>
          <select v-model="form.type">
            <option value="Business">Business</option>
            <option value="Medical">Medical</option>
            <option value="Legal">Legal</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Document Name</label>
          <input v-model="form.name" required>
        </div>
        <div class="form-group">
          <label>Link to Document</label>
          <div class="file-drop" @dragover.prevent @drop="handleDrop">
            <input type="file" ref="fileInput" @change="handleFileSelect" style="display:none">
            <button type="button" class="btn-secondary" @click="$refs.fileInput.click()">Attach a File</button>
            <span v-if="form.fileName">{{ form.fileName }}</span>
            <span v-else>Maximum file size 40 MB</span>
          </div>
        </div>
        <div class="form-group">
          <label>Document Link (URL)</label>
          <input v-model="form.url" placeholder="https://...">
        </div>
        <div class="modal-buttons">
          <button type="button" class="btn-secondary" @click="modalVisible = false">Back</button>
          <button type="submit" class="btn-primary">Add</button>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import Modal from '../components/Modal.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);
const isTeacher = computed(() => authStore.isTeacher);
const isRecipient = computed(() => authStore.isRecipient);

const recipients = ref([]);
const selectedRecipient = ref(null);
const documents = ref([]);
const modalVisible = ref(false);
const modalTitle = ref('');
const form = ref({ type: 'Business', name: '', url: '', file: null, fileName: '' });
const editId = ref(null);
const defaultPhoto = 'https://via.placeholder.com/100';
const canEdit = computed(() => isAdmin.value || isTeacher.value);

const loadRecipients = async () => {
  if (!isAdmin.value && !isTeacher.value) return;
  const { data } = await api.get('/recipients');
  recipients.value = data;
};
const selectRecipient = (r) => {
  selectedRecipient.value = r;
  loadDocuments(r.id);
};
const loadDocuments = async (recipientId) => {
  const id = recipientId || (isRecipient.value ? 'my' : selectedRecipient.value?.id);
  if (!id) return;
  const { data } = await api.get(`/documents/${id}`);
  documents.value = data;
};
const openAddModal = () => {
  editId.value = null;
  form.value = { type: 'Business', name: '', url: '', file: null, fileName: '' };
  modalTitle.value = 'Add Document';
  modalVisible.value = true;
};
const editDocument = (doc) => {
  editId.value = doc.id;
  form.value = { ...doc, file: null, fileName: '' };
  modalTitle.value = 'Edit Document';
  modalVisible.value = true;
};
const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file && file.size <= 40 * 1024 * 1024) {
    form.value.file = file;
    form.value.fileName = file.name;
  } else {
    alert('File too large, max 40 MB');
  }
};
const handleDrop = (e) => {
  const file = e.dataTransfer.files[0];
  if (file && file.size <= 40 * 1024 * 1024) {
    form.value.file = file;
    form.value.fileName = file.name;
  } else {
    alert('File too large, max 40 MB');
  }
};
const saveDocument = async () => {
  const fd = new FormData();
  fd.append('type', form.value.type);
  fd.append('name', form.value.name);
  if (form.value.url) fd.append('url', form.value.url);
  if (form.value.file) fd.append('file', form.value.file);
  const recipientId = selectedRecipient.value?.id || authStore.user?.id;
  fd.append('recipientId', recipientId);
  if (editId.value) {
    await api.put(`/documents/${editId.value}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  } else {
    await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  }
  await loadDocuments();
  modalVisible.value = false;
};
const deleteDocument = async (id) => {
  if (confirm('Delete document?')) {
    await api.delete(`/documents/${id}`);
    await loadDocuments();
  }
};
const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + ' KB';
  return (bytes/(1024*1024)).toFixed(1) + ' MB';
};
onMounted(() => {
  if (isRecipient.value) {
    loadDocuments('my');
  } else {
    loadRecipients();
  }
});
</script>

<style scoped>
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
.recipients-list { margin-bottom: 2rem; }
.items-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
.recipient-card {
  display: flex; flex-direction: column; align-items: center; cursor: pointer;
  padding: 0.5rem; border-radius: var(--radius-md); transition: 0.2s;
}
.recipient-card:hover { background: var(--bg-surface-sunken); }
.avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 0.5rem; }
.documents-grid { display: grid; gap: 0.8rem; }
.document-card {
  display: flex; align-items: center; gap: 1rem; padding: 1rem;
  background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
}
.doc-icon { font-size: 2rem; }
.doc-info { flex: 1; }
.doc-name { font-weight: 600; }
.doc-meta { font-size: 0.75rem; color: var(--text-tertiary); }
.doc-actions { display: flex; gap: 0.5rem; }
.file-drop {
  border: 2px dashed var(--border); border-radius: var(--radius-md); padding: 1rem;
  text-align: center; cursor: pointer;
}
.modal-buttons { display: flex; justify-content: space-between; margin-top: 1rem; }
</style>