<template>
  <div class="doc-page">
    <header class="doc-head">
      <div class="doc-head-text">
        <div class="doc-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <span>Документы</span>
        </div>
        <h1 class="doc-title">{{ isRecipient ? 'Мои документы' : 'Документы реабилитантов' }}</h1>
        <p class="doc-sub">Паспортные данные, СНИЛС, МСЭ и сведения о регистрации.</p>
      </div>
      <button v-if="isAdmin || isTeacher" class="btn-primary add-btn" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Добавить документ
      </button>
    </header>

    <template v-if="isAdmin || isTeacher">
      <div class="doc-toolbar">
        <div class="doc-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input v-model="search" type="text" placeholder="Поиск по реабилитанту, СНИЛС, серии…">
        </div>
        <span class="doc-count">{{ filteredDocs.length }} из {{ docs.length }}</span>
      </div>

      <div v-if="loading" class="empty-state">Загрузка…</div>
      <div v-else-if="!docs.length" class="empty-state">Документов пока нет. Нажмите «Добавить документ».</div>
      <div v-else-if="!filteredDocs.length" class="empty-state">Ничего не найдено по запросу «{{ search }}».</div>
      <div v-else class="table-card">
        <div class="table-scroll">
          <table class="doc-table">
            <thead>
              <tr>
                <th>Реабилитант</th>
                <th>Тип</th>
                <th>Серия / №</th>
                <th>СНИЛС</th>
                <th>МСЭ до</th>
                <th>Регистрация</th>
                <th class="th-actions"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in filteredDocs" :key="d.id">
                <td class="td-name">{{ recipientName(d) }}</td>
                <td><span class="doc-tag">{{ d.docType }}</span></td>
                <td>{{ d.docSeries }} {{ d.docNumber }}</td>
                <td>{{ d.snils || '—' }}</td>
                <td :class="{ 'mse-expired': isExpired(d.mseValidDate) }">{{ formatDate(d.mseValidDate) }}</td>
                <td class="td-addr" :title="d.regAddress">{{ d.regAddress || '—' }}</td>
                <td class="td-actions">
                  <button class="btn-ghost-sm" @click="openEditModal(d)">Редактировать</button>
                  <button class="btn-ghost-sm danger" @click="deleteDoc(d)">Удалить</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="documents-section">
        <div class="doc-header">
          <h3>Мои документы</h3>
          <button v-if="canEdit" class="btn-primary" @click="openEditModal(doc)">
            {{ doc ? 'Редактировать' : 'Добавить документ' }}
          </button>
        </div>
        <div v-if="loading" class="empty-state">Загрузка…</div>
        <div v-else-if="!doc" class="empty-state">Документ не заполнен</div>
        <div v-else class="doc-card">
          <div class="doc-row"><span class="doc-key">Тип документа</span><span class="doc-val">{{ doc.docType }}</span></div>
          <div class="doc-row"><span class="doc-key">Серия / номер</span><span class="doc-val">{{ doc.docSeries }} {{ doc.docNumber }}</span></div>
          <div class="doc-row"><span class="doc-key">Кем выдан</span><span class="doc-val">{{ doc.docIssuer || '—' }}</span></div>
          <div class="doc-row"><span class="doc-key">Дата выдачи</span><span class="doc-val">{{ formatDate(doc.docIssuerDate) }}</span></div>
          <div class="doc-row"><span class="doc-key">СНИЛС</span><span class="doc-val">{{ doc.snils || '—' }}</span></div>
          <div class="doc-row"><span class="doc-key">МСЭ выдана</span><span class="doc-val">{{ formatDate(doc.mseIssueDate) }}</span></div>
          <div class="doc-row"><span class="doc-key">МСЭ действительна до</span><span class="doc-val">{{ formatDate(doc.mseValidDate) }}</span></div>
          <div class="doc-row"><span class="doc-key">Адрес регистрации</span><span class="doc-val">{{ doc.regAddress || '—' }}</span></div>
          <div class="doc-row"><span class="doc-key">Адрес проживания</span><span class="doc-val">{{ doc.factSameReg ? doc.regAddress : (doc.factAddress || '—') }}</span></div>
          <div class="doc-row"><span class="doc-key">Место обучения</span><span class="doc-val">{{ doc.educationPlace || '—' }}</span></div>
          <div class="doc-row"><span class="doc-key">Особые отметки</span><span class="doc-val">{{ doc.specialNote || '—' }}</span></div>
        </div>
      </div>
    </template>

    <Modal v-if="modalVisible" :title="editingDoc ? 'Редактировать документ' : 'Добавить документ'" @close="modalVisible = false">
      <form @submit.prevent="saveDoc">
        <div v-if="(isAdmin || isTeacher) && !editingDoc" class="form-group">
          <label>Реабилитант</label>
          <select v-model="form.recipientId" required>
            <option :value="null" disabled>— выберите реабилитанта —</option>
            <option v-for="r in recipients" :key="r.id" :value="r.id">{{ fullName(r) }}</option>
          </select>
        </div>
        <div v-else-if="(isAdmin || isTeacher) && editingDoc" class="form-group">
          <label>Реабилитант</label>
          <input :value="recipientName(editingDoc)" disabled>
        </div>

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
        <div class="form-group"><label>СНИЛС</label><input v-model="form.snils" maxlength="14" placeholder="000-000-000 00" required></div>
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { fullName } from '../utils/recipient';
import { notifySaved } from '../utils/toast';
import api from '../api';
import Modal from '../components/Modal.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);
const isTeacher = computed(() => authStore.isTeacher);
const isRecipient = computed(() => authStore.isRecipient);
const canEdit = computed(() => isAdmin.value || isTeacher.value || isRecipient.value);

const docs = ref([]);
const recipients = ref([]);
const doc = ref(null);
const loading = ref(false);
const modalVisible = ref(false);
const editingDoc = ref(null);
const search = ref('');

const emptyForm = () => ({
  recipientId: null,
  docType: 'Свидетельство', docSeries: '', docNumber: '', docIssuer: '', docIssuerDate: '',
  snils: '', mseIssueDate: '', mseValidDate: '', regAddress: '', factAddress: '',
  factSameReg: false, educationPlace: '', specialNote: ''
});
const form = ref(emptyForm());

const recipientName = (d) => d?.recipient ? fullName(d.recipient) : '—';

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('ru-RU');
};
const isExpired = (d) => {
  if (!d) return false;
  const dt = new Date(d);
  return !isNaN(dt) && dt < new Date();
};

const filteredDocs = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return docs.value;
  return docs.value.filter((d) => {
    const hay = [
      recipientName(d), d.docType, d.docSeries, d.docNumber,
      d.snils, d.regAddress
    ].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  });
});

const loadAllDocs = async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/documents');
    docs.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const loadRecipients = async () => {
  try {
    const { data } = await api.get('/recipients', { params: { limit: 200 } });
    recipients.value = data.data || [];
  } catch (err) {
    console.error(err);
  }
};

const loadMyDoc = async () => {
  loading.value = true;
  doc.value = null;
  try {
    const { data } = await api.get('/documents/my');
    doc.value = Array.isArray(data) ? (data[0] || null) : data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  editingDoc.value = null;
  form.value = emptyForm();
  modalVisible.value = true;
};

const openEditModal = (d) => {
  editingDoc.value = d || null;
  form.value = d ? { ...emptyForm(), ...d } : emptyForm();
  modalVisible.value = true;
};

const saveDoc = async () => {
  const payload = { ...form.value };
  try {
    const editing = !!editingDoc.value;
    if (editing) {
      await api.put(`/documents/${editingDoc.value.id}`, payload);
    } else {
      await api.post('/documents', payload);
    }
    modalVisible.value = false;
    await reload();
    notifySaved(editing ? 'Документ сохранён' : 'Документ добавлен');
  } catch (err) {
    console.error(err);
    alert('Ошибка при сохранении документа');
  }
};

const deleteDoc = async (d) => {
  const target = d || doc.value;
  if (!target || !confirm('Удалить документ?')) return;
  try {
    await api.delete(`/documents/${target.id}`);
    await reload();
  } catch (err) {
    console.error(err);
    alert('Не удалось удалить документ');
  }
};

const reload = async () => {
  if (isRecipient.value) await loadMyDoc();
  else await loadAllDocs();
};

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  if (isRecipient.value) {
    loadMyDoc();
  } else {
    loadAllDocs();
    loadRecipients();
  }
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
});
</script>

<style scoped>
.doc-page {
  font-family: 'Inter', system-ui, sans-serif;
  color: #1a211a;
  --accent: #2F4A2F;
  --accent-soft: #EEF4E2;
  --bg-surface: #FFFFFF;
  --bg-surface-sunken: #F3EEE4;
  --border: #E4DECF;
  --border-light: #EFEADC;
  --text-primary: #0F140F;
  --text-secondary: #4F564A;
  --text-tertiary: #6E7368;
}

.doc-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
}
.doc-eyebrow {
  display: inline-flex; align-items: center; gap: 0.45rem;
  text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; font-weight: 600;
  color: #2F4A2F;
}
.doc-eyebrow svg { width: 16px; height: 16px; }
.doc-title {
  font-family: 'Lora', Georgia, serif; font-weight: 600;
  font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0.4rem 0 0.3rem;
}
.doc-sub { color: #4F564A; font-size: 0.95rem; margin: 0; }

.doc-toolbar { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.doc-search {
  position: relative; flex: 1; max-width: 26rem; display: flex; align-items: center;
}
.doc-search svg {
  position: absolute; left: 0.7rem; width: 16px; height: 16px; color: #6E7368; pointer-events: none;
}
.doc-search input {
  width: 100%; padding: 0.55rem 0.65rem 0.55rem 2.1rem; border-radius: 0.7rem;
  border: 1px solid #E4DECF; background: #FFFFFF; color: #1a211a;
  font-family: inherit; font-size: 0.9rem; transition: border-color 0.15s, box-shadow 0.15s;
}
.doc-search input:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18); }
.doc-count { color: #6E7368; font-size: 0.82rem; white-space: nowrap; }

.table-card { background: #FFFFFF; border: 1px solid #E4DECF; border-radius: 1.125rem; overflow: hidden; }
.table-scroll { overflow-x: auto; }
.doc-table { width: 100%; border-collapse: collapse; }
.doc-table th, .doc-table td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid #EFEADC; white-space: nowrap; }
.doc-table th {
  background: #F3EEE4; font-weight: 600; font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.06em; color: #6E7368;
}
.doc-table td { font-size: 0.9rem; color: #1a211a; }
.doc-table tbody tr:hover { background: #F7F4ED; }
.doc-table tbody tr:last-child td { border-bottom: none; }
.td-name { font-weight: 600; }
.td-addr { max-width: 18rem; overflow: hidden; text-overflow: ellipsis; }
.mse-expired { color: #B0533F; font-weight: 600; }
.doc-tag {
  display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px;
  background: #EEF4E2; color: #2F4A2F; font-size: 0.76rem; font-weight: 600;
}
.th-actions, .td-actions { text-align: right; }
.td-actions { white-space: nowrap; }

.doc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.doc-header h3 { font-family: 'Lora', Georgia, serif; font-weight: 600; font-size: 1.1rem; color: #0F140F; margin: 0; }
.doc-card {
  background: #FFFFFF; border: 1px solid #E4DECF; border-radius: 1.125rem;
  padding: 1.1rem 1.35rem; display: flex; flex-direction: column; gap: 0.6rem;
}
.doc-row { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #EFEADC; padding-bottom: 0.5rem; }
.doc-row:last-of-type { border-bottom: none; }
.doc-key { color: #6E7368; font-size: 0.8rem; }
.doc-val { font-weight: 600; text-align: right; color: #1a211a; }

.empty-state {
  padding: 2.5rem 2rem; text-align: center; color: #6E7368;
  background: #FFFFFF; border: 1px solid #E4DECF; border-radius: 1.125rem;
}

.form-group { margin-bottom: 1rem; }
.form-row { display: flex; gap: 0.75rem; }
.form-row .form-group { flex: 1; }
.form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.8rem; font-weight: 600; color: #4F564A; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 0.55rem 0.65rem; border-radius: 0.65rem;
  border: 1px solid #E4DECF; background: #FFFFFF; color: #1a211a;
  font-family: inherit; font-size: 0.92rem; transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18);
}
.form-group input:disabled { background: #F3EEE4; color: #6E7368; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: #2F4A2F; color: #F4F8EC; border: none;
  padding: 0.6rem 1.1rem; border-radius: 0.7rem; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.btn-primary:hover { background: #24391F; transform: none; }
.add-btn svg { width: 16px; height: 16px; }
.btn-secondary {
  background: #F3EEE4; color: #1a211a; border: 1px solid #E4DECF;
  padding: 0.6rem 1.1rem; border-radius: 0.7rem; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.btn-secondary:hover { background: #EBE4D5; }
.btn-ghost-sm { background: none; border: none; cursor: pointer; color: #2F4A2F; font-weight: 600; font-family: inherit; padding: 0.25rem 0.4rem; border-radius: 0.5rem; }
.btn-ghost-sm:hover { background: #EEF4E2; }
.btn-ghost-sm.danger { color: #B0533F; }
.btn-ghost-sm.danger:hover { background: #FAE9E0; }
</style>
