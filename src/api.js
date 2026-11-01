import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  xsrfCookieName: 'csrf_token',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: {
    'Content-Type': 'application/json'
  }
});

let onSessionLost = null;
export const setSessionLostHandler = (fn) => {
  onSessionLost = fn;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const code = error.response?.data?.code;
    const url = error.config?.url || '';
    if (error.response?.status === 403 && code === 'CSRF_FAILED' && error.config && !error.config.csrfRetried) {
      try {
        await api.get('/auth/csrf');
      } catch {
        return Promise.reject(error);
      }
      return api({ ...error.config, csrfRetried: true });
    }
    if (error.response?.status === 401 && code === 'MFA_REQUIRED' && !url.startsWith('/auth/') && onSessionLost) {
      onSessionLost(code);
    }
    return Promise.reject(error);
  }
);

export default api;
