<template>
  <div v-if="authStore.loading" class="loading-screen">
    <div class="spinner"></div>
    <p>Загрузка...</p>
  </div>
  <div v-else-if="authStore.isAuthenticated" class="app" :class="{ 'app--drawer': ui.drawerOpen }">
    <Sidebar />
    <div
      v-if="ui.isMobile && ui.drawerOpen"
      class="drawer-backdrop"
      aria-hidden="true"
      @click="ui.closeDrawer()"
    ></div>
    <div class="main">
      <Topbar />
      <div class="content">
        <transition name="fade" mode="out-in">
          <component :is="currentComponent" :key="pageStore.current" />
        </transition>
      </div>
    </div>
    <ChatFab />
    <MobileBottomNav v-if="ui.isMobile && !staffNav" />
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
import { useUiStore } from './stores/ui';
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
const ui = useUiStore();

const staffNav = computed(
  () => authStore.isTeacher || authStore.isAdmin || authStore.isEmployee
);

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

let stopViewportWatch = null;

const onKeydown = (e) => {
  if (e.key === 'Escape') ui.closeDrawer();
};

watch(() => pageStore.current, () => {
  ui.closeDrawer();
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}, { flush: 'post' });

onMounted(async () => {
  stopViewportWatch = ui.watchViewport();
  window.addEventListener('keydown', onKeydown);
  await authStore.checkAuth();
  pageStore.initHistory();
});

onUnmounted(() => {
  if (stopViewportWatch) stopViewportWatch();
  window.removeEventListener('keydown', onKeydown);
  ui.unlockScroll(true);
});
</script>

<style>
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
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
  --btn-primary-bg: #1E2F1E;
  --btn-primary-bg-hover: #2F4A2F;
  --btn-primary-fg: #F4F8EC;
  --btn-secondary-bg: #FFFFFF;
  --btn-secondary-bg-hover: #F3EEE4;
  --btn-secondary-border: #D6CFBE;
  --btn-secondary-border-hover: #B9B09A;
  --btn-secondary-fg: #131713;
  --btn-ghost-fg: #4F564A;
  --btn-ghost-fg-hover: #131713;
  --btn-ghost-bg-hover: #F3EEE4;
  --btn-danger-fg: #B0533F;
  --btn-danger-bg-hover: #FAE9E0;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 18px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.1);
  --transition: 0.2s ease;

  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --kb: 0px;
  --tap: 2.75rem;
  --bottom-nav-h: 4.375rem;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font-sans);
  background: var(--bg-app);
  color: var(--text-primary);
  transition: background var(--transition), color var(--transition);
}
input, select, textarea, button { font-family: inherit; }
.app { display: flex; min-height: 100vh; min-height: 100dvh; }
.main { flex: 1; margin-left: var(--sidebar-width, 260px); display: flex; flex-direction: column; min-width: 0; }
.content { padding: 1.75rem; }

.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(11, 43, 63, 0.45);
  z-index: 95;
  touch-action: none;
}


html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  overscroll-behavior-y: contain;
  -webkit-font-smoothing: antialiased;
}

body.is-scroll-locked { overflow: hidden; }

* { -webkit-tap-highlight-color: transparent; }
a, button, [role="button"], label, summary, select, input, textarea {
  touch-action: manipulation;
}
button, [role="button"], .btn, nav, .tabs { -webkit-touch-callout: none; }

input[type="text"],
input[type="search"],
input[type="email"],
input[type="password"],
input[type="tel"],
input[type="number"],
input[type="url"],
textarea {
  -webkit-appearance: none;
  appearance: none;
}

@media (hover: none) {
  .btn-primary:hover:not(:disabled) {
    background: var(--btn-primary-bg);
    border-color: var(--btn-primary-bg);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--btn-secondary-bg);
    border-color: var(--btn-secondary-border);
  }
  .btn-ghost:hover:not(:disabled) {
    background: transparent;
    color: var(--btn-ghost-fg);
  }
  .btn-danger:hover:not(:disabled) {
    background: var(--btn-danger-fg);
    border-color: var(--btn-danger-fg);
  }
  .btn-ghost-danger:hover:not(:disabled) { background: transparent; }

  #app .t-rcard:hover,
  #app .item-card:hover,
  #app .qa-btn:hover,
  #app .cm-tile:hover,
  #app .stage-tile:hover,
  #app .gmfcs-card:hover,
  #app .sch-ev:hover,
  #app .sch-add:hover,
  #app .dm-tick:hover:not(:disabled),
  #app .dm-btn--primary:hover:not(:disabled) { transform: none; }

  #app button:not(:disabled):active,
  #app .btn:not(:disabled):active,
  #app a[role="button"]:active { opacity: 0.6; }
}

@media (max-width: 768px) {
  body { overflow-x: hidden; }

  .main {
    margin-left: 0;
    margin-bottom: calc(var(--bottom-nav-h) + var(--safe-bottom));
  }
  .content {
    padding: 0.875rem;
    padding-left: max(0.875rem, var(--safe-left));
    padding-right: max(0.875rem, var(--safe-right));
    padding-bottom: calc(0.875rem + var(--kb));
  }

  #app input,
  #app select,
  #app textarea { font-size: max(16px, 1rem); }

  #app button,
  #app .btn,
  #app a[role="button"] { min-height: var(--tap); }
  #app button.icon-btn,
  #app button.icon-btn-sm { min-height: 2.25rem; }

  #app .table-container,
  #app .table-scroll,
  #app .diag-scroll {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }

  #app .card,
  #app .panel,
  #app section { min-width: 0; }
}

@media (max-width: 480px) {
  .content { padding: 0.75rem; padding-bottom: calc(0.75rem + var(--kb)); }
}
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-app);
  padding: max(1rem, var(--safe-top)) max(1rem, var(--safe-right))
           max(1rem, var(--safe-bottom)) max(1rem, var(--safe-left));
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
  background: var(--btn-primary-bg);
  color: var(--btn-primary-fg);
  border: 1px solid var(--btn-primary-bg);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition), color var(--transition);
}
.btn-primary:hover:not(:disabled) {
  background: var(--btn-primary-bg-hover);
  border-color: var(--btn-primary-bg-hover);
}
.btn-secondary {
  background: var(--btn-secondary-bg);
  border: 1px solid var(--btn-secondary-border);
  color: var(--btn-secondary-fg);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--btn-secondary-bg-hover);
  border-color: var(--btn-secondary-border-hover);
}
.btn-ghost {
  background: transparent;
  border: 1px solid transparent;
  color: var(--btn-ghost-fg);
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  transition: background var(--transition), color var(--transition);
}
.btn-ghost:hover:not(:disabled) {
  background: var(--btn-ghost-bg-hover);
  color: var(--btn-ghost-fg-hover);
}
.btn-danger {
  background: var(--btn-danger-fg);
  color: #FFFFFF;
  border: 1px solid var(--btn-danger-fg);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition);
}
.btn-danger:hover:not(:disabled) { background: #96422F; border-color: #96422F; }
.btn-ghost-danger {
  background: transparent;
  border: 1px solid transparent;
  color: var(--btn-danger-fg);
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  transition: background var(--transition);
}
.btn-ghost-danger:hover:not(:disabled) { background: var(--btn-danger-bg-hover); }
.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled { opacity: 0.55; cursor: not-allowed; }
.loading-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
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