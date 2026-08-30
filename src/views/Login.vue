<template>
  <div class="login-form">
    <h2>Добро пожаловать</h2>
    <p class="subtitle">Войдите в систему ERP-Реабилитация</p>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          v-model="email"
          placeholder="example@mail.ru"
          required
          inputmode="email"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="next"
        />
      </div>
      <div class="form-group">
        <label for="login-password">Пароль</label>
        <input
          id="login-password"
          type="password"
          v-model="password"
          placeholder="••••••••"
          required
          autocomplete="current-password"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="go"
        />
      </div>
      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Вход...' : 'Войти' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(email.value, password.value);
  } catch (err) {
    error.value = err.response?.data?.message || 'Ошибка входа. Проверьте данные.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-form {
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
.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 0.9rem;
}
.form-group input:focus {
  outline: none;
  border-color: var(--sage-500);
  box-shadow: 0 0 0 2px rgba(95, 126, 69, 0.25);
}
.btn-primary {
  width: 100%;
  margin-top: 0.5rem;
  background: var(--btn-primary-bg);
  border: 1px solid var(--btn-primary-bg);
  color: var(--btn-primary-fg);
}
.btn-primary:hover:not(:disabled) {
  background: var(--btn-primary-bg-hover);
  border-color: var(--btn-primary-bg-hover);
}
.btn-primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}
.error {
  margin-top: 1rem;
  color: var(--red);
  font-size: 0.85rem;
  text-align: center;
}
@media (max-width: 768px) {
  .login-form { padding: 1.5rem 1.25rem; }
  .form-group input { font-size: 1rem; min-height: var(--tap, 2.75rem); }
  .btn-primary { min-height: var(--tap, 2.75rem); font-size: 1rem; }
}
</style>