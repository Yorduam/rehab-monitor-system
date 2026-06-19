<template>
  <div class="users-page">
    <header class="users-head">
      <div class="users-head-text">
        <div class="users-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Администрирование</span>
        </div>
        <h1 class="users-title">Пользователи</h1>
        <p class="users-sub">Учётные записи, роли и доступ к системе.</p>
      </div>
      <button class="btn-primary add-btn" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Добавить пользователя
      </button>
    </header>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Управление пользователями</div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.email }}</td>
              <td>
                <select v-model="user.role" @change="updateRole(user)" :disabled="user.id === authStore.user?.id">
                  <option value="admin">Администратор</option>
                  <option value="teacher">Преподаватель</option>
                  <option value="employee">Сотрудник</option>
                  <option value="recipient">Реципиент</option>
                </select>
               </td>
              <td>
                <button class="btn-ghost-sm" @click="resetPassword(user)">Сброс пароля</button>
                <button class="btn-ghost-sm" @click="deleteUser(user.id)" v-if="user.id !== authStore.user?.id">🗑</button>
               </td>
             </tr>
          </tbody>
        </table>
      </div>
      <Pagination
        v-if="totalPages > 1"
        :page="page"
        :total-pages="totalPages"
        :limit="limit"
        @update:page="changePage"
        @update:limit="changeLimit"
      />
    </div>

    <Modal v-if="addModalVisible" title="Добавить пользователя" @close="addModalVisible = false">
      <form @submit.prevent="createUser">
        <div class="form-group"><label>Email</label><input v-model="newUser.email" type="email" required></div>
        <div class="form-group"><label>Пароль</label><input v-model="newUser.password" type="password" required></div>
        <div class="form-group"><label>Роль</label><select v-model="newUser.role"><option value="admin">Администратор</option><option value="teacher">Преподаватель</option><option value="employee">Сотрудник</option><option value="recipient">Реципиент</option></select></div>
        <div class="modal-buttons"><button type="button" class="btn-secondary" @click="addModalVisible = false">Отмена</button><button type="submit" class="btn-primary">Создать</button></div>
      </form>
    </Modal>

    <Modal v-if="passwordModalVisible" title="Сброс пароля" @close="passwordModalVisible = false">
      <form @submit.prevent="saveNewPassword">
        <div class="form-group"><label>Новый пароль</label><input v-model="newPassword" type="password" required></div>
        <div class="form-group"><label>Подтвердите</label><input v-model="confirmPassword" type="password" required></div>
        <div class="modal-buttons"><button type="button" class="btn-secondary" @click="passwordModalVisible = false">Отмена</button><button type="submit" class="btn-primary">Сохранить</button></div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import Modal from '../components/Modal.vue';
import Pagination from '../components/Pagination.vue';

const authStore = useAuthStore();
const users = ref([]);
const page = ref(1);
const limit = ref(10);
const addModalVisible = ref(false);
const passwordModalVisible = ref(false);
const selectedUser = ref(null);
const newPassword = ref('');
const confirmPassword = ref('');
const newUser = ref({ email: '', password: '', role: 'recipient' });

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * limit.value;
  return users.value.slice(start, start + limit.value);
});
const totalPages = computed(() => Math.ceil(users.value.length / limit.value));

const loadUsers = async () => {
  const { data } = await api.get('/users');
  users.value = data;
};
const updateRole = async (user) => {
  await api.put(`/users/${user.id}`, { role: user.role });
};
const resetPassword = (user) => {
  selectedUser.value = user;
  newPassword.value = '';
  confirmPassword.value = '';
  passwordModalVisible.value = true;
};
const saveNewPassword = async () => {
  if (newPassword.value !== confirmPassword.value) return alert('Пароли не совпадают');
  await api.put(`/users/${selectedUser.value.id}`, { password: newPassword.value });
  passwordModalVisible.value = false;
  alert('Пароль изменён');
};
const deleteUser = async (id) => {
  if (confirm('Удалить пользователя?')) {
    await api.delete(`/users/${id}`);
    await loadUsers();
  }
};
const openAddModal = () => {
  newUser.value = { email: '', password: '', role: 'recipient' };
  addModalVisible.value = true;
};
const createUser = async () => {
  await api.post('/auth/register', { ...newUser.value, agreedToTerms: true });
  await loadUsers();
  addModalVisible.value = false;
};
const changePage = (newPage) => { page.value = newPage; };
const changeLimit = (newLimit) => { limit.value = newLimit; page.value = 1; };
onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadUsers();
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
});
</script>

<style scoped>
/* ---- Warm paper theme (matches Dashboard / Сотрудник) ---- */
.users-page { font-family: 'Inter', system-ui, sans-serif; color: #1a211a; }

/* Header */
.users-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 1.75rem;
}
.users-eyebrow {
  display: inline-flex; align-items: center; gap: 0.45rem;
  text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; font-weight: 600;
  color: #2F4A2F;
}
.users-eyebrow svg { width: 16px; height: 16px; }
.users-title {
  font-family: 'Lora', Georgia, serif; font-weight: 600;
  font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0.4rem 0 0.3rem;
}
.users-sub { color: #4F564A; font-size: 0.95rem; margin: 0; }

/* Card */
.card { background: #FFFFFF; border-radius: 1.125rem; border: 1px solid #E4DECF; overflow: hidden; }
.card-header { padding: 1rem 1.35rem; border-bottom: 1px solid #EFEADC; }
.card-title { font-family: 'Lora', Georgia, serif; font-weight: 600; font-size: 1.05rem; color: #0F140F; }

/* Table */
.table-container { overflow-x: auto; max-height: 60vh; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.8rem 0.9rem; text-align: left; border-bottom: 1px solid #EFEADC; }
.data-table th {
  background: #F3EEE4; font-weight: 600; font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.06em; color: #6E7368;
}
.data-table td { font-size: 0.92rem; color: #1a211a; }
.data-table tbody tr:hover { background: #F7F4ED; }
.data-table tbody tr:last-child td { border-bottom: none; }

select {
  padding: 0.4rem 0.55rem; border-radius: 0.6rem; border: 1px solid #E4DECF;
  background: #FFFFFF; color: #1a211a; font-family: inherit; font-size: 0.88rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
select:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18); }
select:disabled { background: #F3EEE4; color: #6E7368; cursor: not-allowed; }

/* Buttons — scoped overrides win over the global blue .btn-primary */
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
  padding: 0.55rem 1.1rem; border-radius: 0.7rem; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.btn-secondary:hover { background: #EBE4D5; }
.btn-ghost-sm {
  background: none; border: none; cursor: pointer; margin: 0 0.25rem;
  color: #2F4A2F; font-weight: 600; border-radius: 0.5rem; padding: 0.25rem 0.4rem;
  transition: background 0.15s;
}
.btn-ghost-sm:hover { background: #EEF4E2; }

/* Forms */
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.8rem; font-weight: 600; color: #4F564A; }
.form-group input, .form-group select {
  width: 100%; padding: 0.55rem 0.65rem; border-radius: 0.65rem;
  border: 1px solid #E4DECF; background: #FFFFFF; color: #1a211a;
  font-family: inherit; font-size: 0.92rem; transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group input:focus, .form-group select:focus {
  outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18);
}
</style>