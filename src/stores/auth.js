import { defineStore } from 'pinia';
import api from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false
  }),
  actions: {
    async login(email, password) {
      try {
        const { data } = await api.post('/auth/login', { email, password });
        this.user = data.user;
        return true;
      } catch (err) {
        throw err;
      }
    },
    async register(userData) {
      try {
        const { data } = await api.post('/auth/register', userData);
        this.user = data.user;
        return true;
      } catch (err) {
        throw err;
      }
    },
    async checkAuth() {
      this.loading = true;
      try {
        const { data } = await api.get('/auth/me');
        this.user = data;
      } catch (err) {
        this.user = null;
      } finally {
        this.loading = false;
      }
    },
    logout() {
      api.post('/auth/logout');
      this.user = null;
    }
  },
  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isTeacher: (state) => state.user?.role === 'teacher',
    isEmployee: (state) => state.user?.role === 'employee',
    isRecipient: (state) => state.user?.role === 'recipient'
  }
});