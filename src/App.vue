<template>
  <div v-if="authStore.loading" class="loading-screen">
    <div class="spinner"></div>
    <p>Загрузка...</p>
  </div>
  <div v-else-if="authStore.isAuthenticated" class="app">
    <Sidebar />
    <div class="main">
      <Topbar />
      <div class="content">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" :key="pageStore.current" />
        </transition>
      </div>
    </div>
    <ChatFab />
    <MobileBottomNav v-if="isMobile" />
  </div>
  <div v-else class="auth-wrapper">
    <div class="auth-card">
      <Login />
    </div>
  </div>

  <ToastHost />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { usePageStore } from './stores/page';
import Sidebar from './components/Sidebar.vue';
import Topbar from './components/Topbar.vue';
import ChatFab from './components/ChatFab.vue';
import MobileBottomNav from './components/MobileBottomNav.vue';
import ToastHost from './components/ToastHost.vue';
import Login from './views/Login.vue';
import Dashboard from './views/Dashboard.vue';
import Recipients from './views/Recipients.vue';
import Groups from './views/Groups.vue';
import Diagnostics from './views/Diagnostics.vue';
import Progress from './views/Progress.vue';
import Documents from './views/Documents.vue';
import AdminUsers from './views/AdminUsers.vue';
import AdminDashboard from './views/AdminDashboard.vue';
import EmployeeDashboard from './views/EmployeeDashboard.vue';
import TeacherDashboard from './views/TeacherDashboard.vue';
import EmployeeDocuments from './views/EmployeeDocuments.vue';
import RecipientDetails from './views/RecipientDetails.vue';
import Schedule from './views/Schedule.vue';

const authStore = useAuthStore();
const pageStore = usePageStore();
const isMobile = ref(window.innerWidth <= 768);

const componentMap = {
  dashboard: Dashboard,
  recipients: Recipients,
  groups: Groups,
  diagnostics: Diagnostics,
  progress: Progress,
  documents: Documents,
  schedule: Schedule,
  'admin-users': AdminUsers,
  'recipient-details': RecipientDetails
};

const currentComponent = computed(() => {

  if (pageStore.current === 'dashboard' && authStore.isAdmin) return AdminDashboard;

  if (pageStore.current === 'dashboard' && authStore.isEmployee) return EmployeeDashboard;
  if (pageStore.current === 'dashboard' && authStore.isTeacher) return TeacherDashboard;
  if (pageStore.current === 'documents' && authStore.isEmployee) return EmployeeDocuments;
  return componentMap[pageStore.current] || Dashboard;
});

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

watch(() => pageStore.current, () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}, { flush: 'post' });

onMounted(async () => {
  await authStore.checkAuth();
  pageStore.initHistory();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style>
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-app);
}
.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0,0,0,0.1);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

:root {
  --font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --bg-app: #F7F4ED;
  --bg-sidebar: #0b2b3f;
  --bg-surface: #ffffff;
  --bg-surface-sunken: #e6edf4;
  --text-primary: #1a2c3e;
  --text-secondary: #2c4c6e;
  --text-tertiary: #5a7d9a;
  --border: #cbdde6;
  --border-light: #dce5ec;
  --accent: #1a5d8f;
  --accent-hover: #0e4168;
  --accent-soft: #e0f0f9;
  --accent-text: #073450;
  --accent-border: #b0d0e6;
  --sage-900: #1E2F1E;
  --sage-800: #2A4129;
  --sage-700: #2F4A2F;
  --sage-500: #5F7E45;
  --sage-400: #8AAB6A;
  --sage-100: #E0EBD1;
  --sage-50: #EEF4E2;
  --amber: #f5b042;
  --amber-soft: #fff0df;
  --amber-text: #7a5900;
  --red: #e56c5e;
  --red-soft: #ffe9e6;
  --red-text: #8b2f2f;
  --purple: #6c9ebf;
  --purple-soft: #eef4fa;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.1);
  --transition: 0.2s ease;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-sans);
  background: var(--bg-app);
  color: var(--text-primary);
  transition: background var(--transition), color var(--transition);
}
input, select, textarea, button { font-family: inherit; }
.app { display: flex; min-height: 100vh; }
.main { flex: 1; margin-left: var(--sidebar-width, 260px); display: flex; flex-direction: column; }
.content { padding: 1.75rem; }
@media (max-width: 768px) {
  .main { margin-left: 0; margin-bottom: 70px; }
  .content { padding: 1rem; }
}
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-app);
}
.auth-card {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 450px;
  overflow: hidden;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; transform: translateY(-8px); }
.btn-primary {
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
}
.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}
.btn-secondary {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}
.btn-ghost {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.3rem 0.6rem;
}
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(26,93,143,0.2);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>