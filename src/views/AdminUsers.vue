<template>
  <div>
    <div class="toolbar">
      <button class="btn-primary" @click="openAddModal">+ Добавить пользователя</button>
    </div>

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
import { ref, computed, onMounted } from 'vue';
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
onMounted(loadUsers);
</script>

<style scoped>
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 1rem; }
.card { background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }
.card-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); }
.card-title { font-weight: 700; }
.table-container { overflow-x: auto; max-height: 60vh; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-light); }
.data-table th { background: var(--bg-surface-sunken); font-weight: 600; }
select { padding: 0.3rem 0.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-surface); }
.btn-ghost-sm { background: none; border: none; cursor: pointer; margin: 0 0.25rem; }
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.25rem; font-size: 0.8rem; font-weight: 600; }
.form-group input, .form-group select { width: 100%; padding: 0.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-surface); }
</style>