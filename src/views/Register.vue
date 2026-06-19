<template>
  <div class="register-form">
    <h2>Создать аккаунт</h2>
    <p class="subtitle">Зарегистрируйтесь в системе</p>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label>Email</label>
        <input type="email" v-model="form.email" placeholder="example@mail.ru" required>
      </div>
      <div class="form-group">
        <label>Пароль</label>
        <input type="password" v-model="form.password" placeholder="минимум 6 символов" required>
      </div>
      <div class="form-group">
        <label>Роль</label>
        <select v-model="form.role">
          <option value="recipient">Реципиент (получатель услуг)</option>
          <option value="teacher">Преподаватель</option>
          <option value="employee">Сотрудник</option>
          <option value="admin">Администратор</option>
        </select>
      </div>
      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits(['switch-to-login'])
const authStore = useAuthStore()
const form = ref({
  email: '',
  password: '',
  role: 'recipient'
})
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.register(form.value)
    emit('switch-to-login')
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка регистрации'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-form {
  padding: 2rem;
}
h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.subtitle {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.form-group {
  margin-bottom: 1rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(118,183,41,0.2);
}
.btn-primary {
  width: 100%;
  margin-top: 0.5rem;
}
.error {
  margin-top: 1rem;
  color: var(--red);
  font-size: 0.85rem;
  text-align: center;
}
</style>