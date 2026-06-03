<template>
  <div>
    <div class="toolbar">
      <button class="btn-primary" @click="openAddModal">Добавить пользователя</button>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Пользователи системы</div>
      </div>
      <div class="card-body table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>ФИО</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.fullName }}</td>
              <td>
                <span :class="['role-badge', user.role]">{{ roleLabel(user.role) }}</span>
              </td>
              <td>
                <button class="btn-ghost-sm" @click="editUser(user)">✏️</button>
                <button class="btn-ghost-sm" @click="deleteUser(user.id)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal v-if="modalVisible" :title="modalTitle" @close="modalVisible = false">
      <form @submit.prevent="saveUser">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required />
        </div>
        <div class="form-group">
          <label>ФИО</label>
          <input v-model="form.fullName" required />
        </div>
        <div class="form-group">
          <label>Роль</label>
          <select v-model="form.role">
            <option value="admin">Администратор</option>
            <option value="teacher">Преподаватель</option>
            <option value="employee">Сотрудник</option>
            <option value="recipient">Реципиент</option>
          </select>
        </div>
        <div class="form-group" v-if="!editId">
          <label>Пароль</label>
          <input v-model="form.password" type="password" required />
        </div>
        <button type="submit" class="btn-primary">Сохранить</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import Modal from '../components/Modal.vue';

const users = ref([]);
const modalVisible = ref(false);
const modalTitle = ref('');
const form = ref({ email: '', fullName: '', role: 'recipient', password: '' });
const editId = ref(null);

const loadUsers = async () => {
  try {
    const { data } = await api.get('/users');
    users.value = data;
  } catch (err) {
    console.error(err);
  }
};

const roleLabel = (role) => {
  const map = { admin: 'Админ', teacher: 'Преподаватель', employee: 'Сотрудник', recipient: 'Реципиент' };
  return map[role] || role;
};

const openAddModal = () => {
  editId.value = null;
  form.value = { email: '', fullName: '', role: 'recipient', password: '' };
  modalTitle.value = 'Добавить пользователя';
  modalVisible.value = true;
};

const editUser = (user) => {
  editId.value = user.id;
  form.value = { ...user, password: '' };
  modalTitle.value = 'Редактировать пользователя';
  modalVisible.value = true;
};

const saveUser = async () => {
  try {
    if (editId.value) {
      await api.put(`/users/${editId.value}`, form.value);
    } else {
      await api.post('/users', form.value);
    }
    await loadUsers();
    modalVisible.value = false;
  } catch (err) {
    console.error(err);
    alert('Ошибка сохранения');
  }
};

const deleteUser = async (id) => {
  if (confirm('Удалить пользователя?')) {
    try {
      await api.delete(`/users/${id}`);
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert('Ошибка удаления');
    }
  }
};

onMounted(loadUsers);
</script>

<style scoped>
.toolbar {
  margin-bottom: 1rem;
}
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.card-title {
  font-weight: 700;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}
.role-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}
.role-badge.admin {
  background: #e56c5e20;
  color: #e56c5e;
}
.role-badge.teacher {
  background: #76B72920;
  color: #2c5e2c;
}
.role-badge.employee {
  background: #f5b04220;
  color: #7a5900;
}
.role-badge.recipient {
  background: #3b82f620;
  color: #1e3a8a;
}
.btn-ghost-sm {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
}
.btn-ghost-sm:hover {
  background: var(--bg-surface-sunken);
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
}
</style>