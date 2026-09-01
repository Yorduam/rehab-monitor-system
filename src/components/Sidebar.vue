<template>

  <aside
    v-if="authStore.isTeacher"
    ref="drawerEl"
    class="sidebar-teacher"
    :class="{ open: ui.drawerOpen, dragging }"
    aria-label="Основная навигация"
    @touchstart.passive="onDrawerTouchStart"
    @touchmove="onDrawerTouchMove"
    @touchend="onDrawerTouchEnd"
    @touchcancel="onDrawerTouchEnd"
  >

    <div class="s-brand">
      <div class="s-brand-mark" aria-hidden="true">Ц</div>
      <div>
        <div class="s-brand-name">ERP-Реабилитация</div>
        <div class="s-brand-sub">ЦСИ Дианы Гурцкая</div>
      </div>
    </div>

    <span class="s-section-label">Работа</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'dashboard' }"
        @click="go('dashboard', 'Дашборд')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 12l2-2 7-7 7 7 2 2v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1z"/>
        </svg>
        Сегодня
      </button>

      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'schedule' }"
        @click="go('schedule', 'Расписание')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        Расписание
      </button>

      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'recipients' }"
        @click="go('recipients', 'Реабилитанты')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Реабилитанты
      </button>

      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'groups' }"
        @click="go('groups', 'Группы')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M17 3h4a2 2 0 012 2v4M3 17v4a2 2 0 002 2h4M17 21h4a2 2 0 002-2v-4M7 3H5a2 2 0 00-2 2v4M7 9h10v10H7z"/>
        </svg>
        Группы
      </button>
    </nav>

    <span class="s-section-label">Приём</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'diagnostics' }"
        @click="go('diagnostics', 'Диагностика')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>
        Диагностика
      </button>
    </nav>

    <span class="s-section-label">Аналитика</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'progress' }"
        @click="go('progress', 'Прогресс')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 3v18h18M18 17V9M12 17v-6M6 17v-3"/>
        </svg>
        Прогресс
      </button>
    </nav>

    <div class="s-footer">
      <div class="s-user">
        <div class="s-avatar" aria-hidden="true">{{ userInitials }}</div>
        <div class="s-user-text">
          <div class="s-user-name">{{ authStore.user?.email || 'Пользователь' }}</div>
          <div class="s-user-role">Куратор</div>
        </div>
      </div>
      <button class="s-logout" @click="logout" title="Выйти">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </aside>

  <aside
    v-else-if="authStore.isAdmin"
    ref="drawerEl"
    class="sidebar-teacher"
    :class="{ open: ui.drawerOpen, dragging }"
    aria-label="Основная навигация"
    @touchstart.passive="onDrawerTouchStart"
    @touchmove="onDrawerTouchMove"
    @touchend="onDrawerTouchEnd"
    @touchcancel="onDrawerTouchEnd"
  >

    <div class="s-brand">
      <div class="s-brand-mark" aria-hidden="true">Ц</div>
      <div>
        <div class="s-brand-name">ERP-Реабилитация</div>
        <div class="s-brand-sub">ЦСИ Дианы Гурцкая</div>
      </div>
    </div>

    <span class="s-section-label">Основное</span>
    <nav class="s-nav">
      <button
        v-for="item in adminMainNav"
        :key="item.id"
        class="s-item"
        :class="{ 's-item--active': pageStore.current === item.id }"
        @click="go(item.id, item.label)"
      >
        <span class="s-icon" v-html="item.icon"></span>
        {{ item.label }}
      </button>
    </nav>

    <span class="s-section-label">Приём</span>
    <nav class="s-nav">
      <button
        v-for="item in adminAnalyticsNav"
        :key="item.id"
        class="s-item"
        :class="{ 's-item--active': pageStore.current === item.id }"
        @click="go(item.id, item.label)"
      >
        <span class="s-icon" v-html="item.icon"></span>
        {{ item.label }}
      </button>
    </nav>

    <span class="s-section-label" v-if="showDocuments">Документы</span>
    <nav class="s-nav" v-if="showDocuments">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'documents' }"
        @click="go('documents', 'Документы')"
      >
        <span class="s-icon" v-html="documentsIcon"></span>
        Документы
      </button>
    </nav>

    <span class="s-section-label">Администрирование</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'admin-users' }"
        @click="go('admin-users', 'Пользователи')"
      >
        <span class="s-icon" v-html="adminIcon"></span>
        Пользователи
      </button>
    </nav>

    <div class="s-footer">
      <div class="s-user">
        <div class="s-avatar" aria-hidden="true">{{ userInitials }}</div>
        <div class="s-user-text">
          <div class="s-user-name">{{ authStore.user?.email || 'Пользователь' }}</div>
          <div class="s-user-role">{{ roleLabel }}</div>
        </div>
      </div>
      <button class="s-logout" @click="logout" title="Выйти">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </aside>

  <aside
    v-else-if="authStore.isEmployee"
    ref="drawerEl"
    class="sidebar-teacher"
    :class="{ open: ui.drawerOpen, dragging }"
    aria-label="Основная навигация"
    @touchstart.passive="onDrawerTouchStart"
    @touchmove="onDrawerTouchMove"
    @touchend="onDrawerTouchEnd"
    @touchcancel="onDrawerTouchEnd"
  >

    <div class="s-brand">
      <div class="s-brand-mark" aria-hidden="true">Ц</div>
      <div>
        <div class="s-brand-name">ERP-Реабилитация</div>
        <div class="s-brand-sub">ЦСИ Дианы Гурцкая</div>
      </div>
    </div>

    <span class="s-section-label">Работа</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'dashboard' }"
        @click="go('dashboard', 'Дашборд')"
      >
        <span class="s-icon" v-html="mainNav[0].icon"></span>
        Дашборд
      </button>
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'recipients' }"
        @click="go('recipients', 'Реабилитанты')"
      >
        <span class="s-icon" v-html="mainNav[1].icon"></span>
        Реабилитанты
      </button>
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'groups' }"
        @click="go('groups', 'Группы')"
      >
        <span class="s-icon" v-html="mainNav[2].icon"></span>
        Группы
      </button>
    </nav>

    <span class="s-section-label">Приём</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'diagnostics' }"
        @click="go('diagnostics', 'Диагностика')"
      >
        <span class="s-icon" v-html="analyticsNav[0].icon"></span>
        Диагностика
      </button>
    </nav>

    <span class="s-section-label">Документы</span>
    <nav class="s-nav">
      <button
        class="s-item"
        :class="{ 's-item--active': pageStore.current === 'documents' }"
        @click="go('documents', 'Документы')"
      >
        <span class="s-icon" v-html="documentsIcon"></span>
        Документы
      </button>
    </nav>

    <div class="s-footer">
      <div class="s-user">
        <div class="s-avatar" aria-hidden="true">{{ userInitials }}</div>
        <div class="s-user-text">
          <div class="s-user-name">{{ authStore.user?.email || 'Пользователь' }}</div>
          <div class="s-user-role">Сотрудник</div>
        </div>
      </div>
      <button class="s-logout" @click="logout" title="Выйти">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </aside>

  <aside
    v-else
    ref="drawerEl"
    class="sidebar"
    :class="{ open: ui.drawerOpen, dragging }"
    aria-label="Основная навигация"
    @touchstart.passive="onDrawerTouchStart"
    @touchmove="onDrawerTouchMove"
    @touchend="onDrawerTouchEnd"
    @touchcancel="onDrawerTouchEnd"
  >
    <div class="sidebar-brand">
      <div class="logo">ЦСИ</div>
      <div>
        <div class="brand-title">ERP-Реабилитация</div>
        <div class="brand-sub-old">ЦСИ Дианы Гурцкая</div>
      </div>
    </div>

    <div class="sidebar-section">Основное</div>
    <nav>
      <button
        v-for="item in mainNav"
        :key="item.id"
        :class="{ active: pageStore.current === item.id }"
        @click="pageStore.setPage(item.id, item.label)"
      >
        <span class="icon" v-html="item.icon"></span>
        {{ item.label }}
      </button>
    </nav>

    <div class="sidebar-section">Аналитика</div>
    <nav>
      <button
        v-for="item in analyticsNav"
        :key="item.id"
        :class="{ active: pageStore.current === item.id }"
        @click="pageStore.setPage(item.id, item.label)"
      >
        <span class="icon" v-html="item.icon"></span>
        {{ item.label }}
      </button>
    </nav>

    <div class="sidebar-section" v-if="showDocuments">Документы</div>
    <nav v-if="showDocuments">
      <button
        :class="{ active: pageStore.current === 'documents' }"
        @click="pageStore.setPage('documents', 'Документы')"
      >
        <span class="icon" v-html="documentsIcon"></span>
        Документы
      </button>
    </nav>

    <div class="sidebar-section" v-if="authStore.isAdmin">Администрирование</div>
    <nav v-if="authStore.isAdmin">
      <button
        :class="{ active: pageStore.current === 'admin-users' }"
        @click="pageStore.setPage('admin-users', 'Пользователи')"
      >
        <span class="icon" v-html="adminIcon"></span>
        Пользователи
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar">{{ (authStore.user?.email?.charAt(0) || 'А').toUpperCase() }}</div>
        <div>
          <div class="name">{{ authStore.user?.email || 'Пользователь' }}</div>
          <div class="role">{{ roleLabel }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="logout">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Выйти
      </button>
    </div>
  </aside>

</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePageStore } from '../stores/page';
import { useUiStore } from '../stores/ui';

const authStore = useAuthStore();
const pageStore = usePageStore();
const ui = useUiStore();

const drawerEl = ref(null);
const dragging = ref(false);
let startX = 0;
let startY = 0;
let shift = 0;
let axis = null;

const onDrawerTouchStart = (e) => {
  if (!ui.drawerOpen || e.touches.length !== 1) return;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  shift = 0;
  axis = null;
};

const onDrawerTouchMove = (e) => {
  if (!ui.drawerOpen || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  if (!axis) {
    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
    axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (axis === 'x') dragging.value = true;
  }
  if (axis !== 'x') return;
  e.preventDefault();
  shift = Math.min(0, dx);
  if (drawerEl.value) drawerEl.value.style.transform = `translateX(${shift}px)`;
};

const onDrawerTouchEnd = () => {
  const el = drawerEl.value;
  if (axis === 'x' && el) {
    dragging.value = false;
    el.style.transform = '';
    if (shift < -el.offsetWidth * 0.35) ui.closeDrawer();
  }
  axis = null;
  shift = 0;
};

const userInitials = computed(() => {
  const email = authStore.user?.email || '';
  return (email.charAt(0) || 'П').toUpperCase();
});

const go = (id, label) => {
  pageStore.setPage(id, label);
  ui.closeDrawer();
};

const usesTeacherStyle = computed(() => authStore.isTeacher || authStore.isAdmin || authStore.isEmployee);

const updateSidebarWidth = (teacherStyle) => {
  const root = document.documentElement;
  root.style.setProperty('--sidebar-width', teacherStyle ? '240px' : '260px');
  root.style.setProperty('--bottom-nav-h', teacherStyle ? '0px' : '4.375rem');
};

watch(
  usesTeacherStyle,
  (val) => {
    updateSidebarWidth(val);
  },
  { immediate: true }
);

const mainNav = [
  { id: 'dashboard',  label: 'Дашборд',      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { id: 'recipients', label: 'Реабилитанты', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
  { id: 'groups',     label: 'Группы',       icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>' }
];
const analyticsNav = [
  { id: 'diagnostics', label: 'Диагностика', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { id: 'progress',   label: 'Прогресс',    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>' }
];
const documentsIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
const adminIcon    = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/><path d="M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2"/></svg>';

const adminMainNav = computed(() => mainNav);
const adminAnalyticsNav = computed(() => analyticsNav.filter((item) => item.id !== 'progress'));

const roleLabel = computed(() => {
  const map = { admin: 'Администратор', teacher: 'Преподаватель', employee: 'Сотрудник', recipient: 'Реципиент' };
  return map[authStore.user?.role] || 'Пользователь';
});
const showDocuments = computed(() => authStore.user?.role !== 'employee');

const logout = () => {
  authStore.logout();
  pageStore.setPage('dashboard', 'Дашборд');
};
</script>

<style scoped>
.sidebar-teacher {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: 240px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  scrollbar-width: none;
  background: #112211;
  color: #D5DDC9;
  padding: 1.5rem 1rem 1rem;
  gap: 0;
  font-family: var(--font-sans);
  font-size: 0.875rem;
  line-height: 1.5;
}
.sidebar-teacher::-webkit-scrollbar { display: none; }
.s-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.5rem;
  margin-bottom: 2rem;
  flex-shrink: 0;
}
.s-brand-mark {
  width: 2.375rem;
  height: 2.375rem;
  background: #F3F6EA;
  color: #112211;
  border-radius: 0.625rem;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.s-brand-name {
  font-family: var(--font-serif);
  font-size: 1rem;
  font-weight: 500;
  color: #FFFFFF;
  line-height: 1.25;
}
.s-brand-sub {
  font-size: 0.75rem;
  color: #B8C6B2;
  margin-top: 0.125rem;
}
.s-section-label {
  display: block;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 500;
  color: #9EB098;
  padding: 0 0.75rem;
  margin-top: 1.5rem;
  margin-bottom: 0.375rem;
  flex-shrink: 0;
}
.s-nav {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex-shrink: 0;
}
.s-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.625rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: #D5DDC9;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  letter-spacing: 0.005em;
  transition: background 150ms ease, color 150ms ease;
  position: relative;
  font-family: inherit;
}
@media (hover: hover) {
  .s-item:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #F3F6EA;
  }
}
.s-item:active { background: rgba(255, 255, 255, 0.14); color: #F3F6EA; }
.s-item--active {
  background: #F3F6EA !important;
  color: #112211 !important;
  font-weight: 500;
}
.s-item:focus-visible {
  outline: 3px solid #F3F6EA;
  outline-offset: 2px;
  border-radius: 0.625rem;
}
.s-item svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.85;
}
.s-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.s-item--active svg { opacity: 1; }
.s-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}
.s-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  padding: 0.375rem 0.375rem 0.375rem 0.5rem;
  border-radius: 0.625rem;
}
.s-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #F2DCB1, #EDCABE);
  color: #3F1D00;
  display: grid;
  place-items: center;
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.s-user-text { min-width: 0; }
.s-user-name {
  font-size: 0.8125rem;
  color: #FFFFFF;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.s-user-role {
  font-size: 0.75rem;
  color: #B8C6B2;
  line-height: 1.2;
}
.s-logout {
  width: 2.75rem;
  height: 2.75rem;
  display: grid;
  place-items: center;
  border-radius: 0.625rem;
  background: none;
  border: none;
  color: #B8C6B2;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 150ms ease, color 150ms ease;
}
@media (hover: hover) {
  .s-logout:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #F3F6EA;
  }
}
.s-logout:focus-visible {
  outline: 3px solid #F3F6EA;
  outline-offset: 2px;
}
.s-logout svg { width: 1rem; height: 1rem; }
@media (max-width: 768px) {
  .sidebar-teacher {
    top: 0;
    bottom: 0;
    left: 0;
    right: auto;
    width: min(17rem, 84vw);
    height: 100dvh;
    z-index: 100;
    flex-direction: column;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    padding: max(1.25rem, var(--safe-top)) 1rem max(1rem, var(--safe-bottom));
    padding-left: max(1rem, var(--safe-left));
    background: #112211;
    transform: translateX(-100%);
    will-change: transform;
    transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .sidebar-teacher.open { transform: translateX(0); }
  .sidebar-teacher.dragging { transition: none; }
  .s-brand { margin-bottom: 1.25rem; }
  .s-section-label { margin-top: 1.25rem; }
  .s-item { min-height: var(--tap, 2.75rem); font-size: 0.9375rem; }
  .s-item svg { width: 1.125rem; height: 1.125rem; }
}

.sidebar {
  width: 260px;
  background: var(--bg-sidebar);
  color: white;
  position: fixed;
  top: 0; left: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  z-index: 100;
  transition: transform 0.3s ease;
}
.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 0.5rem;
}
.logo {
  width: 36px; height: 36px;
  background: var(--accent);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 1.2rem;
}
.brand-title   { font-weight: 700; font-size: 0.9rem; }
.brand-sub-old { font-size: 0.7rem; opacity: 0.7; }
.sidebar-section {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 1rem 1rem 0.5rem;
  opacity: 0.6;
}
.sidebar nav button {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  padding: 0.6rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}
@media (hover: hover) {
  .sidebar nav button:hover { background: rgba(255,255,255,0.1); }
}
.sidebar nav button:active  { background: rgba(255,255,255,0.16); }
.sidebar nav button.active  { background: rgba(255,255,255,0.15); color: white; }
.sidebar-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: var(--radius-md);
}
.avatar {
  width: 32px; height: 32px;
  background: var(--accent);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
}
.name { font-weight: 600; font-size: 0.85rem; }
.role { font-size: 0.7rem; opacity: 0.7; }
.logout-btn {
  width: 100%; margin-top: 0.5rem;
  background: rgba(255,255,255,0.05);
  border: none;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  color: white;
  display: flex; align-items: center; gap: 0.5rem;
  cursor: pointer; font-size: 0.8rem;
}
@media (hover: hover) {
  .logout-btn:hover { background: rgba(255,255,255,0.1); }
}
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: min(17rem, 85vw);
    height: 100dvh;
    z-index: 100;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    padding-top: max(1rem, var(--safe-top));
    padding-bottom: max(1rem, var(--safe-bottom));
    padding-left: var(--safe-left);
    will-change: transform;
    transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .sidebar.open { transform: translateX(0); }
  .sidebar.dragging { transition: none; }
}
</style>
