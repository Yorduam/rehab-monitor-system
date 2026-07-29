<template>
  <div class="users-page">
    <header class="users-head">
      <div class="users-head-text">
        <div class="users-eyebrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Администрирование</span>
        </div>
        <h1 class="users-title">Пользователи</h1>
        <p class="users-sub">Учётные записи, роли и доступ к системе.</p>
      </div>
      <button class="btn-primary add-btn" @click="openAddModal">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Добавить пользователя
      </button>
    </header>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Управление пользователями</div>
        <div class="users-toolbar">
          <div class="role-tabs" role="tablist" aria-label="Фильтр по роли">
            <button
              v-for="tab in roleTabs" :key="tab.id" type="button" role="tab"
              class="role-tab" :class="{ active: roleFilter === tab.id }"
              :aria-selected="roleFilter === tab.id"
              @click="roleFilter = tab.id"
            >
              {{ tab.label }}<span class="role-tab-count">{{ tab.count }}</span>
            </button>
          </div>
          <div class="users-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              v-model="search" type="search"
              placeholder="Фамилия, имя, email, телефон, кабинет"
              aria-label="Поиск пользователей"
            >
          </div>
        </div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Фамилия</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Кабинет</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in pageRows" :key="row.user.id">
              <tr v-if="row.head" class="group-row">
                <td colspan="8">
                  <span class="group-title">{{ row.head === 'staff' ? 'Сотрудники центра' : 'Реабилитанты' }}</span>
                  <span class="group-count">{{ groupCounts[row.head] }}</span>
                </td>
              </tr>
              <tr>
                <td>{{ row.user.id }}</td>
                <td>{{ row.user.lastName || '—' }}</td>
                <td>{{ row.user.firstName || '—' }}</td>
                <td>{{ row.user.email }}</td>
                <td>{{ row.user.phone || '—' }}</td>
                <td>{{ row.user.cabinet || '—' }}</td>
                <td>
                  <select v-model="row.user.role" @change="updateRole(row.user)" :disabled="row.user.id === authStore.user?.id">
                    <option value="admin">Администратор</option>
                    <option value="teacher">Преподаватель</option>
                    <option value="employee">Сотрудник</option>
                    <option value="recipient">Реабилитант</option>
                  </select>
                 </td>
                <td>
                  <div class="row-actions">
                    <button class="btn-ghost-sm" @click="openEditModal(row.user)">Изменить</button>
                    <button class="btn-ghost-sm" @click="resetPassword(row.user)">Сброс пароля</button>
                    <button class="btn-ghost-sm btn-ghost-danger" @click="deleteUser(row.user.id)" v-if="row.user.id !== authStore.user?.id" title="Удалить">🗑</button>
                  </div>
                 </td>
               </tr>
            </template>
            <tr v-if="!pageRows.length" class="empty-row">
              <td colspan="8">Ничего не найдено — измените фильтр или поисковый запрос.</td>
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
        <div class="form-row">
          <div class="form-group"><label>Фамилия</label><input v-model="newUser.lastName" type="text"></div>
          <div class="form-group"><label>Имя</label><input v-model="newUser.firstName" type="text"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Телефон</label><input v-model="newUser.phone" type="tel" placeholder="+7 900 000-00-00"></div>
          <div class="form-group"><label>Кабинет</label><input v-model="newUser.cabinet" type="text" placeholder="напр. 204"></div>
        </div>
        <div class="form-group"><label>Email</label><input v-model="newUser.email" type="email" required></div>
        <div class="form-group">
          <label>Пароль</label>
          <div class="password-field">
            <input v-model="newUser.password" :type="showPassword ? 'text' : 'password'" required>
            <button type="button" class="password-toggle" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </div>
        <div class="form-group"><label>Роль</label><select v-model="newUser.role"><option value="admin">Администратор</option><option value="teacher">Преподаватель</option><option value="employee">Сотрудник</option><option value="recipient">Реабилитант</option></select></div>
        <template v-if="newUser.role === 'teacher'">
          <div class="form-group">
            <label>Проф. ориентированность</label>
            <select v-model="newUser.directionId">
              <option :value="null" disabled>— выберите направление —</option>
              <option v-for="dir in directions" :key="dir.id" :value="dir.id">{{ directionLabel(dir) }}</option>
            </select>
            <small class="form-hint">Определяет, какой блок диагностики специалист заполняет.</small>
          </div>
          <div class="form-group">
            <label>Права по диагностике</label>
            <label class="perm-check">
              <input type="checkbox" v-model="newUser.canConclude">
              <span>
                Может выдавать итоговое заключение
                <small>Право закрывать заявку заключением по всей диагностике.</small>
              </span>
            </label>
            <label class="perm-check">
              <input type="checkbox" v-model="newUser.canViewAllResults">
              <span>
                Видит результаты других педагогов
                <small>Без этого специалист видит только свой блок диагностики.</small>
              </span>
            </label>
          </div>
        </template>
        <div class="modal-buttons"><button type="button" class="btn-secondary" @click="addModalVisible = false">Отмена</button><button type="submit" class="btn-primary">Создать</button></div>
      </form>
    </Modal>

    <Modal v-if="editModalVisible" title="Редактировать пользователя" @close="editModalVisible = false">
      <form @submit.prevent="saveUser">
        <div class="form-row">
          <div class="form-group"><label>Фамилия</label><input v-model="editUser.lastName" type="text"></div>
          <div class="form-group"><label>Имя</label><input v-model="editUser.firstName" type="text"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Телефон</label><input v-model="editUser.phone" type="tel" placeholder="+7 900 000-00-00"></div>
          <div class="form-group"><label>Кабинет</label><input v-model="editUser.cabinet" type="text" placeholder="напр. 204"></div>
        </div>
        <div class="form-group"><label>Email</label><input v-model="editUser.email" type="email" required></div>
        <div class="form-group">
          <label>Роль</label>
          <select v-model="editUser.role" :disabled="editUser.id === authStore.user?.id">
            <option value="admin">Администратор</option>
            <option value="teacher">Преподаватель</option>
            <option value="employee">Сотрудник</option>
            <option value="recipient">Реабилитант</option>
          </select>
          <small v-if="editUser.id === authStore.user?.id" class="form-hint">Нельзя изменить свою собственную роль.</small>
        </div>
        <template v-if="editUser.role === 'teacher'">
          <div class="form-group">
            <label>Проф. ориентированность</label>
            <select v-model="editUser.directionId">
              <option :value="null" disabled>— выберите направление —</option>
              <option v-for="dir in directions" :key="dir.id" :value="dir.id">{{ directionLabel(dir) }}</option>
            </select>
            <small class="form-hint">Определяет, какой блок диагностики специалист заполняет.</small>
          </div>
          <div class="form-group">
            <label>Права по диагностике</label>
            <label class="perm-check">
              <input type="checkbox" v-model="editUser.canConclude">
              <span>
                Может выдавать итоговое заключение
                <small>Право закрывать заявку заключением по всей диагностике.</small>
              </span>
            </label>
            <label class="perm-check">
              <input type="checkbox" v-model="editUser.canViewAllResults">
              <span>
                Видит результаты других педагогов
                <small>Без этого специалист видит только свой блок диагностики.</small>
              </span>
            </label>
          </div>
        </template>
        <div class="modal-buttons"><button type="button" class="btn-secondary" @click="editModalVisible = false">Отмена</button><button type="submit" class="btn-primary">Сохранить</button></div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import Modal from '../components/Modal.vue';
import Pagination from '../components/Pagination.vue';

const authStore = useAuthStore();
const users = ref([]);
const page = ref(1);
const limit = ref(10);
const addModalVisible = ref(false);
const showPassword = ref(false);
const editModalVisible = ref(false);
const editUser = ref({ id: null, email: '', role: 'recipient', lastName: '', firstName: '', phone: '', cabinet: '', directionId: null, canConclude: false, canViewAllResults: false });
const passwordModalVisible = ref(false);
const selectedUser = ref(null);
const newPassword = ref('');
const confirmPassword = ref('');
const newUser = ref({ email: '', password: '', role: 'recipient', lastName: '', firstName: '', phone: '', cabinet: '', directionId: null, canConclude: false, canViewAllResults: false });
const directions = ref([]);

// Понятные подписи для направлений (по profileKey), с запасным вариантом на name из БД.
const PROFILE_LABELS = {
  psy: 'Психолог',
  log: 'Логопед',
  afk: 'АФК',
  izo: 'ИЗО',
  vocal: 'Вокал',
  instrument: 'Инструменты',
  theatre: 'Театр'
};
const directionLabel = (dir) => PROFILE_LABELS[dir.profileKey] || dir.name;

// ============================================================
//  СОРТИРОВКА И ПОИСК ПО ПОЛЬЗОВАТЕЛЯМ
//  Раньше список приходил с сервера в произвольном порядке и сотрудники
//  центра были вперемешку с реабилитантами — найти нужного работника было
//  тяжело. Теперь сверху всегда персонал (администраторы, преподаватели,
//  сотрудники), а реабилитанты уходят вниз; внутри группы — по алфавиту.
//  Сортируем на клиенте, чтобы не менять контракт GET /users.
// ============================================================
const ROLE_ORDER = { admin: 0, teacher: 1, employee: 2, recipient: 3 };
const ROLE_LABELS = {
  admin: 'Администратор',
  teacher: 'Преподаватель',
  employee: 'Сотрудник',
  recipient: 'Реабилитант'
};
const isStaff = (u) => u.role !== 'recipient';
// Intl.Collator — правильный порядок кириллицы (иначе «Ё» уезжает в конец).
const collator = new Intl.Collator('ru', { sensitivity: 'base', numeric: true });

const roleFilter = ref('all'); // all | staff | teacher | recipient
const search = ref('');

const sortedUsers = computed(() =>
  [...users.value].sort((a, b) => {
    const ra = ROLE_ORDER[a.role] ?? 99;
    const rb = ROLE_ORDER[b.role] ?? 99;
    if (ra !== rb) return ra - rb;
    const na = `${a.lastName || ''} ${a.firstName || ''} ${a.email || ''}`.trim();
    const nb = `${b.lastName || ''} ${b.firstName || ''} ${b.email || ''}`.trim();
    return collator.compare(na, nb);
  })
);

const filteredUsers = computed(() => {
  const needle = search.value.trim().toLowerCase();
  return sortedUsers.value.filter((u) => {
    if (roleFilter.value === 'staff' && !isStaff(u)) return false;
    if (roleFilter.value === 'teacher' && u.role !== 'teacher') return false;
    if (roleFilter.value === 'recipient' && isStaff(u)) return false;
    if (!needle) return true;
    const hay = [u.lastName, u.firstName, u.email, u.phone, u.cabinet, ROLE_LABELS[u.role]]
      .filter(Boolean).join(' ').toLowerCase();
    return hay.includes(needle);
  });
});

const roleTabs = computed(() => [
  { id: 'all', label: 'Все', count: sortedUsers.value.length },
  { id: 'staff', label: 'Сотрудники', count: sortedUsers.value.filter(isStaff).length },
  { id: 'teacher', label: 'Преподаватели', count: sortedUsers.value.filter((u) => u.role === 'teacher').length },
  { id: 'recipient', label: 'Реабилитанты', count: sortedUsers.value.filter((u) => !isStaff(u)).length }
]);

// Сколько всего в каждой группе — показываем в заголовке-разделителе,
// чтобы было видно общее число, а не только попавших на текущую страницу.
const groupCounts = computed(() => ({
  staff: filteredUsers.value.filter(isStaff).length,
  recipient: filteredUsers.value.filter((u) => !isStaff(u)).length
}));

// Строки текущей страницы; head !== null — перед строкой нужен заголовок группы.
const pageRows = computed(() => {
  const start = (page.value - 1) * limit.value;
  let prev = null;
  return filteredUsers.value.slice(start, start + limit.value).map((u) => {
    const group = isStaff(u) ? 'staff' : 'recipient';
    const head = group === prev ? null : group;
    prev = group;
    return { user: u, head };
  });
});

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / limit.value));

// Фильтр/поиск меняют состав списка — иначе можно остаться на пустой странице.
watch([roleFilter, search], () => { page.value = 1; });

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
const loadDirections = async () => {
  const { data } = await api.get('/lists/directions');
  directions.value = data;
};
const openAddModal = () => {
  newUser.value = { email: '', password: '', role: 'recipient', lastName: '', firstName: '', phone: '', cabinet: '', directionId: null, canConclude: false, canViewAllResults: false };
  showPassword.value = false;
  addModalVisible.value = true;
};
const openEditModal = (user) => {
  editUser.value = {
    id: user.id,
    email: user.email || '',
    role: user.role || 'recipient',
    lastName: user.lastName || '',
    firstName: user.firstName || '',
    phone: user.phone || '',
    cabinet: user.cabinet || '',
    directionId: user.directionId ?? null,
    canConclude: user.canConclude === true,
    canViewAllResults: user.canViewAllResults === true
  };
  editModalVisible.value = true;
};
const saveUser = async () => {
  const u = editUser.value;
  const isTeacher = u.role === 'teacher';
  const payload = {
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    cabinet: u.cabinet,
    directionId: isTeacher ? u.directionId : null,
    // Права по диагностике имеют смысл только у специалиста.
    canConclude: isTeacher ? u.canConclude === true : false,
    canViewAllResults: isTeacher ? u.canViewAllResults === true : false
  };
  // Свою собственную роль менять нельзя (защита от самоблокировки админа).
  if (u.id !== authStore.user?.id) payload.role = u.role;
  try {
    await api.put(`/users/${u.id}`, payload);
    await loadUsers();
    editModalVisible.value = false;
  } catch (err) {
    const msg = err.response?.data?.message || 'Не удалось сохранить изменения';
    alert(msg);
  }
};
const createUser = async () => {
  const payload = { ...newUser.value };
  // Проф. ориентированность и права по диагностике — только для преподавателя.
  if (payload.role !== 'teacher') {
    payload.directionId = null;
    payload.canConclude = false;
    payload.canViewAllResults = false;
  }
  try {
    // Отдельный админский эндпоинт: не выдаёт токен, не подменяет сессию администратора.
    await api.post('/users', payload);
    await loadUsers();
    addModalVisible.value = false;
  } catch (err) {
    const msg = err.response?.data?.message || 'Не удалось создать пользователя';
    alert(msg);
  }
};
const changePage = (newPage) => { page.value = newPage; };
const changeLimit = (newLimit) => { limit.value = newLimit; page.value = 1; };
onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadUsers();
  loadDirections();
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
});
</script>

<style scoped>
/* ---- Warm paper theme (matches Dashboard / Сотрудник) ---- */
.users-page { font-family: 'Inter', system-ui, sans-serif; color: #1a211a; }

/* Header */
.users-head {
  display: flex; align-items: flex-end; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap; margin-bottom: 1.75rem;
}
.users-eyebrow {
  display: inline-flex; align-items: center; gap: 0.45rem;
  text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; font-weight: 600;
  color: #2F4A2F;
}
.users-eyebrow svg { width: 16px; height: 16px; }
.users-title {
  font-family: 'Lora', Georgia, serif; font-weight: 600;
  font-size: 1.9rem; line-height: 1.15; color: #0F140F; margin: 0.4rem 0 0.3rem;
}
.users-sub { color: #4F564A; font-size: 0.95rem; margin: 0; }

/* Card */
.card { background: #FFFFFF; border-radius: 1.125rem; border: 1px solid #E4DECF; overflow: hidden; }
.card-header { padding: 1rem 1.35rem; border-bottom: 1px solid #EFEADC; }
.card-title { font-family: 'Lora', Georgia, serif; font-weight: 600; font-size: 1.05rem; color: #0F140F; }

/* Панель фильтров: слева — вкладки ролей, справа — поиск */
.users-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem; flex-wrap: wrap; margin-top: 0.85rem;
}
.role-tabs {
  display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap;
  background: #F3EEE4; border: 1px solid #E4DECF; border-radius: 0.7rem; padding: 0.2rem;
}
.role-tab {
  display: inline-flex; align-items: center; gap: 0.4rem;
  background: none; border: none; cursor: pointer;
  padding: 0.4rem 0.75rem; border-radius: 0.55rem;
  font-family: inherit; font-size: 0.84rem; font-weight: 600; color: #6E7368;
  transition: background 0.15s, color 0.15s;
}
.role-tab:hover { background: #EBE4D5; color: #2F4A2F; }
.role-tab.active { background: #FFFFFF; color: #2F4A2F; box-shadow: 0 1px 2px rgba(47, 74, 47, 0.12); }
.role-tab-count {
  min-width: 1.35rem; padding: 0 0.3rem; border-radius: 999px;
  background: #E4DECF; color: #4F564A;
  font-size: 0.72rem; font-weight: 700; line-height: 1.35rem; text-align: center;
}
.role-tab.active .role-tab-count { background: #EEF4E2; color: #2F4A2F; }

.users-search { position: relative; flex: 1 1 15rem; max-width: 22rem; }
.users-search svg {
  position: absolute; top: 50%; left: 0.65rem; transform: translateY(-50%);
  width: 16px; height: 16px; color: #6E7368; pointer-events: none;
}
.users-search input {
  width: 100%; padding: 0.5rem 0.65rem 0.5rem 2.1rem;
  border: 1px solid #E4DECF; border-radius: 0.7rem; background: #FFFFFF; color: #1a211a;
  font-family: inherit; font-size: 0.88rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.users-search input::placeholder { color: #9AA093; }
.users-search input:focus {
  outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18);
}

/* Заголовок-разделитель группы внутри таблицы */
.data-table tbody tr.group-row:hover { background: #F3EEE4; }
.group-row td {
  background: #F3EEE4; padding: 0.45rem 0.9rem;
  border-bottom: 1px solid #E4DECF;
}
.group-title {
  font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: #2F4A2F;
}
.group-count {
  display: inline-block; margin-left: 0.5rem; padding: 0 0.4rem;
  border-radius: 999px; background: #E4DECF; color: #4F564A;
  font-size: 0.7rem; font-weight: 700; line-height: 1.1rem;
}

/* Пустой результат поиска */
.data-table tbody tr.empty-row:hover { background: transparent; }
.empty-row td {
  padding: 2rem 0.9rem; text-align: center;
  color: #6E7368; font-size: 0.9rem;
}

/* Table */
.table-container { overflow-x: auto; max-height: 60vh; overflow-y: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.8rem 0.9rem; text-align: left; border-bottom: 1px solid #EFEADC; }
/* Разделительные полосы между столбцами */
.data-table th:not(:last-child), .data-table td:not(:last-child) { border-right: 1px solid #EFEADC; }
.data-table th {
  background: #F3EEE4; font-weight: 600; font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.06em; color: #6E7368;
}
.data-table td { font-size: 0.92rem; color: #1a211a; }
.data-table tbody tr:hover { background: #F7F4ED; }
.data-table tbody tr:last-child td { border-bottom: none; }

/* Действия в строке */
.row-actions { display: flex; align-items: center; gap: 0.15rem; flex-wrap: wrap; }
.btn-ghost-danger { color: #B0533F; }
.btn-ghost-danger:hover { background: #FAE9E0; }
.form-hint { display: block; margin-top: 0.3rem; font-size: 0.75rem; color: #6E7368; }

/* Точечные права специалиста по диагностике */
.perm-check {
  display: flex; align-items: flex-start; gap: 0.55rem;
  padding: 0.55rem 0.65rem; margin-top: 0.4rem;
  border: 1px solid #E4DECF; border-radius: 0.6rem; background: #FBF9F3;
  cursor: pointer; font-weight: 400;
}
.perm-check:hover { border-color: #CBDDB4; background: #F6F8EF; }
.perm-check input { margin-top: 0.2rem; accent-color: #5F7E45; flex-shrink: 0; }
.perm-check > span { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.86rem; color: #1a211a; }
.perm-check small { font-size: 0.75rem; color: #6E7368; line-height: 1.4; }

select {
  padding: 0.4rem 0.55rem; border-radius: 0.6rem; border: 1px solid #E4DECF;
  background: #FFFFFF; color: #1a211a; font-family: inherit; font-size: 0.88rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
select:focus { outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18); }
select:disabled { background: #F3EEE4; color: #6E7368; cursor: not-allowed; }

/* Buttons — scoped overrides win over the global blue .btn-primary */
.btn-primary {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: #2F4A2F; color: #F4F8EC; border: none;
  padding: 0.6rem 1.1rem; border-radius: 0.7rem; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.btn-primary:hover { background: #24391F; transform: none; }
.add-btn svg { width: 16px; height: 16px; }
.btn-secondary {
  background: #F3EEE4; color: #1a211a; border: 1px solid #E4DECF;
  padding: 0.55rem 1.1rem; border-radius: 0.7rem; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.btn-secondary:hover { background: #EBE4D5; }
.btn-ghost-sm {
  background: none; border: none; cursor: pointer; margin: 0 0.25rem;
  color: #2F4A2F; font-weight: 600; border-radius: 0.5rem; padding: 0.25rem 0.4rem;
  transition: background 0.15s;
}
.btn-ghost-sm:hover { background: #EEF4E2; }

/* Forms */
.modal-buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
.form-row { display: flex; gap: 0.75rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.8rem; font-weight: 600; color: #4F564A; }
.form-group input, .form-group select {
  width: 100%; padding: 0.55rem 0.65rem; border-radius: 0.65rem;
  border: 1px solid #E4DECF; background: #FFFFFF; color: #1a211a;
  font-family: inherit; font-size: 0.92rem; transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group input:focus, .form-group select:focus {
  outline: none; border-color: #5F7E45; box-shadow: 0 0 0 3px rgba(95, 126, 69, 0.18);
}

/* Password field with show/hide toggle */
.password-field { position: relative; }
.password-field input { padding-right: 2.6rem; }
.password-toggle {
  position: absolute; top: 50%; right: 0.35rem; transform: translateY(-50%);
  display: inline-flex; align-items: center; justify-content: center;
  width: 2rem; height: 2rem; padding: 0; border: none; background: none;
  color: #6E7368; cursor: pointer; border-radius: 0.5rem; transition: color 0.15s, background 0.15s;
}
.password-toggle:hover { color: #2F4A2F; background: #EEF4E2; }
.password-toggle svg { width: 18px; height: 18px; }
</style>