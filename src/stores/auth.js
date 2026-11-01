import { defineStore } from 'pinia';
import api, { setSessionLostHandler } from '../api';

export const AUTH_STAGES = Object.freeze({
  GUEST: 'guest',
  SECOND_FACTOR: 'mfa',
  ENROLL: 'enroll',
  AUTHENTICATED: 'authenticated'
});

const ensureCsrf = () => api.get('/auth/csrf').catch(() => null);

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    stage: AUTH_STAGES.GUEST,
    loading: false,
    notice: ''
  }),
  actions: {
    async login(email, password) {
      await ensureCsrf();
      const { data } = await api.post('/auth/login', { email, password });
      this.notice = '';
      if (data?.mfaRequired || data?.enrollRequired) {
        this.user = null;
        this.stage = data.mfaRequired ? AUTH_STAGES.SECOND_FACTOR : AUTH_STAGES.ENROLL;
        return this.stage;
      }
      this.user = data.user;
      this.stage = AUTH_STAGES.AUTHENTICATED;
      return AUTH_STAGES.AUTHENTICATED;
    },
    async checkAuth() {
      this.loading = true;
      setSessionLostHandler(() => this.dropSession('Сессия требует подтверждения ключом электронной подписи. Войдите заново.'));
      try {
        await ensureCsrf();
        const { data } = await api.get('/auth/me');
        this.user = data;
        this.stage = AUTH_STAGES.AUTHENTICATED;
      } catch (err) {
        const code = err.response?.data?.code;
        this.user = null;
        this.stage = code === 'MFA_PENDING'
          ? AUTH_STAGES.SECOND_FACTOR
          : code === 'MFA_ENROLL_PENDING' ? AUTH_STAGES.ENROLL : AUTH_STAGES.GUEST;
      } finally {
        this.loading = false;
      }
    },
    async startSecondFactor() {
      const { data } = await api.post('/auth/2fa/start');
      return data;
    },
    async completeSecondFactor(challengeId, signature) {
      const { data } = await api.post('/auth/2fa/verify', { challengeId, signature });
      this.user = data.user;
      this.stage = AUTH_STAGES.AUTHENTICATED;
      this.notice = '';
    },
    async startEnrollment() {
      const { data } = await api.post('/auth/2fa/enroll/start');
      return data;
    },
    async completeEnrollment(challengeId, signature) {
      const { data } = await api.post('/auth/2fa/enroll/confirm', { challengeId, signature });
      this.user = data.user;
      this.stage = AUTH_STAGES.AUTHENTICATED;
      this.notice = '';
    },
    async cancelSecondFactor(notice = '') {
      try {
        await api.post('/auth/logout');
      } catch {
      }
      this.user = null;
      this.stage = AUTH_STAGES.GUEST;
      this.notice = notice;
    },
    dropSession(notice = '') {
      this.user = null;
      this.stage = AUTH_STAGES.GUEST;
      this.notice = notice;
    },
    logout() {
      api.post('/auth/logout');
      this.user = null;
      this.stage = AUTH_STAGES.GUEST;
      this.notice = '';
    }
  },
  getters: {
    isAuthenticated: (state) => state.stage === AUTH_STAGES.AUTHENTICATED && !!state.user,
    awaitingSecondFactor: (state) => state.stage === AUTH_STAGES.SECOND_FACTOR,
    awaitingEnrollment: (state) => state.stage === AUTH_STAGES.ENROLL,
    isAdmin: (state) => state.user?.role === 'admin',
    isTeacher: (state) => state.user?.role === 'teacher',
    isEmployee: (state) => state.user?.role === 'employee',
    isRecipient: (state) => state.user?.role === 'recipient'
  }
});
