<template>
  <div>
    <div class="toolbar">
      <button class="btn-primary" @click="openAddModal">Добавить событие</button>
    </div>

    <!-- Графический таймлайн -->
    <div class="timeline-container">
      <div class="timeline-header">
        <div
          v-for="day in timelineDays"
          :key="day.date"
          class="timeline-date"
          :class="{ today: day.date === todayStr }"
        >
          <div class="date-weekday">{{ day.weekday }}</div>
          <div class="date-day">{{ day.day }}</div>
          <div class="date-month">{{ day.month }}</div>
        </div>
      </div>
      <div class="timeline-events">
        <div
          v-for="day in timelineDays"
          :key="day.date"
          class="timeline-day-events"
        >
          <template v-for="event in getEventsForDate(day.date)" :key="event.id">
            <div class="timeline-event" :class="event.type" @click="editEvent(event)">
              <div class="event-dot"></div>
              <div class="event-title">{{ event.title }}</div>
              <div class="event-time" v-if="event.time">{{ event.time }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Таблица событий -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Список событий</div>
      </div>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Событие</th>
              <th>Дата</th>
              <th>Время</th>
              <th>Тип</th>
              <th>Связано с</th>
              <th>Специалист</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in sortedEvents" :key="e.id">
              <td>{{ e.title }}</td>
              <td>{{ formatDate(e.date) }}</td>
              <td>{{ e.time || '—' }}</td>
              <td><span :class="['badge', typeClass(e.type)]">{{ typeLabel(e.type) }}</span></td>
              <td>
                <span v-if="e.recipientId">Реципиент: {{ getRecipientName(e.recipientId) }}</span>
                <span v-else-if="e.groupId">Группа: {{ getGroupName(e.groupId) }}</span>
                <span v-else>—</span>
              </td>
              <td>{{ e.specialist || '—' }}</td>
              <td>
                <span :class="['badge', e.status === 'done' ? 'badge-green' : 'badge-blue']">
                  {{ e.status === 'done' ? 'Готово' : 'План' }}
                </span>
              </td>
              <td>
                <button class="btn-ghost-sm" @click="editEvent(e)">✏️</button>
                <button class="btn-ghost-sm" @click="deleteEvent(e.id)">🗑</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модальное окно -->
    <Modal v-if="modalVisible" :title="modalTitle" @close="modalVisible = false">
      <form @submit.prevent="saveEvent">
        <div class="form-group">
          <label>Название</label>
          <input v-model="form.title" required>
        </div>
        <div class="form-group">
          <label>Дата</label>
          <input v-model="form.date" type="date" required>
        </div>
        <div class="form-group">
          <label>Время</label>
          <input v-model="form.time" type="time">
        </div>
        <div class="form-group">
          <label>Тип</label>
          <select v-model="form.type" @change="onTypeChange">
            <option value="diagnostic">Диагностика</option>
            <option value="lesson">Занятие</option>
            <option value="meeting">Встреча</option>
          </select>
        </div>

        <div v-if="form.type === 'diagnostic'" class="form-group">
          <label>Реципиент</label>
          <select v-model="form.recipientId">
            <option :value="null">Не выбрано</option>
            <option v-for="r in recipients" :key="r.id" :value="r.id">{{ r.fullName }}</option>
          </select>
        </div>
        <div v-if="form.type === 'diagnostic'" class="form-group">
          <label>Специалист</label>
          <select v-model="form.specialist">
            <option disabled value="">Выберите специалиста</option>
            <option v-for="c in curators" :key="c.id" :value="c.fullName">{{ c.fullName }}</option>
          </select>
        </div>
        <div v-if="form.type === 'diagnostic'" class="form-group">
          <label>Статус</label>
          <select v-model="form.status">
            <option value="planned">План</option>
            <option value="done">Готово</option>
          </select>
        </div>

        <div v-if="form.type === 'lesson'" class="form-group">
          <label>Группа</label>
          <select v-model="form.groupId">
            <option :value="null">Не выбрано</option>
            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <button type="submit" class="btn-primary">Сохранить</button>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../api';
import Modal from '../components/Modal.vue';

const events = ref([]);
const recipients = ref([]);
const groups = ref([]);
const curators = ref([]);
const modalVisible = ref(false);
const modalTitle = ref('');
const form = ref({
  title: '',
  date: '',
  time: '',
  type: 'diagnostic',
  recipientId: null,
  groupId: null,
  specialist: '',
  status: 'planned'
});
const editId = ref(null);

// --- Нормализация дат ---
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = today.toISOString().slice(0, 10);

// Генерация 15 дней (каждый день – объект с датой в формате YYYY-MM-DD)
const timelineDays = computed(() => {
  const days = [];
  for (let i = 0; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString('ru-RU', { weekday: 'short' }),
      day: d.getDate(),
      month: d.toLocaleDateString('ru-RU', { month: 'short' })
    });
  }
  return days;
});

// Фильтр событий по дате (сравнение строк)
const getEventsForDate = (dateStr) => {
  return events.value.filter(e => e.date === dateStr);
};

const sortedEvents = computed(() => [...events.value].sort((a, b) => new Date(a.date) - new Date(b.date)));

const typeLabel = (type) => ({ diagnostic: 'Диагностика', lesson: 'Занятие', meeting: 'Встреча' }[type]);
const typeClass = (type) => ({ diagnostic: 'badge-amber', lesson: 'badge-blue', meeting: 'badge-gray' }[type]);
const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('ru-RU');
const getRecipientName = (id) => recipients.value.find(r => r.id === id)?.fullName || '—';
const getGroupName = (id) => groups.value.find(g => g.id === id)?.name || '—';

// Загрузка данных
const loadEvents = async () => {
  const { data } = await api.get('/timeline');
  // Приводим дату к YYYY-MM-DD (обрезаем время, если есть)
  events.value = data.map(e => ({
    ...e,
    date: e.date ? e.date.split('T')[0] : null
  }));
  console.log('Загружено событий:', events.value.length);
  console.log('Первое событие:', events.value[0]);
};

const loadRecipients = async () => {
  const { data } = await api.get('/recipients');
  recipients.value = data.data || [];
};
const loadGroups = async () => {
  const { data } = await api.get('/groups');
  groups.value = data.data || [];
};
const loadCurators = async () => {
  try {
    const { data } = await api.get('/lists/curators');
    curators.value = data;
  } catch (err) {
    console.error(err);
  }
};

// CRUD
const openAddModal = (ev = null) => {
  if (ev) {
    editId.value = ev.id;
    form.value = {
      title: ev.title,
      date: ev.date,
      time: ev.time || '',
      type: ev.type,
      recipientId: ev.recipientId || null,
      groupId: ev.groupId || null,
      specialist: ev.specialist || '',
      status: ev.status || 'planned'
    };
    modalTitle.value = 'Редактировать событие';
  } else {
    editId.value = null;
    form.value = {
      title: '',
      date: '',
      time: '',
      type: 'diagnostic',
      recipientId: null,
      groupId: null,
      specialist: '',
      status: 'planned'
    };
    modalTitle.value = 'Добавить событие';
  }
  modalVisible.value = true;
};

const editEvent = (ev) => openAddModal(ev);

const onTypeChange = () => {
  if (form.value.type === 'diagnostic') form.value.groupId = null;
  if (form.value.type === 'lesson') form.value.recipientId = null;
};

const saveEvent = async () => {
  const payload = { ...form.value };
  if (payload.type !== 'diagnostic') {
    delete payload.recipientId;
    delete payload.specialist;
    delete payload.status;
  }
  if (payload.type !== 'lesson') delete payload.groupId;
  if (!payload.time) delete payload.time;

  try {
    if (editId.value) {
      await api.put(`/timeline/${editId.value}`, payload);
    } else {
      await api.post('/timeline', payload);
    }
    await loadEvents();
    modalVisible.value = false;
  } catch (err) {
    console.error(err);
    alert('Ошибка сохранения');
  }
};

const deleteEvent = async (id) => {
  if (confirm('Удалить событие?')) {
    await api.delete(`/timeline/${id}`);
    await loadEvents();
  }
};

onMounted(() => {
  loadEvents();
  loadRecipients();
  loadGroups();
  loadCurators();
});
</script>

<style scoped>
/* стили – оставлены без изменений (они работают) */
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
.timeline-container {
  overflow-x: auto;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1rem;
  margin-bottom: 1.5rem;
}
.timeline-header {
  display: flex;
  min-width: 100%;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.timeline-date {
  flex: 0 0 80px;
  text-align: center;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  background: var(--bg-surface-sunken);
}
.timeline-date.today {
  background: var(--accent-soft);
  border: 1px solid var(--accent);
}
.date-weekday {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
.date-day {
  font-size: 1.2rem;
  font-weight: bold;
}
.date-month {
  font-size: 0.7rem;
  color: var(--text-secondary);
}
.timeline-events {
  display: flex;
  gap: 0.5rem;
  min-width: 100%;
}
.timeline-day-events {
  flex: 0 0 80px;
  min-height: 80px;
  position: relative;
}
.timeline-event {
  position: relative;
  cursor: pointer;
  margin-bottom: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.event-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #666;
  margin-bottom: 0.2rem;
  transition: transform 0.2s;
}
.timeline-event:hover .event-dot {
  transform: scale(1.3);
}
.timeline-event.diagnostic .event-dot { background: #f5b042; }
.timeline-event.lesson .event-dot { background: #3b82f6; }
.timeline-event.meeting .event-dot { background: #8b5cf6; }
.event-title {
  font-size: 0.7rem;
  text-align: center;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-time {
  font-size: 0.6rem;
  color: var(--text-tertiary);
  margin-top: 0.1rem;
}
.timeline-event:hover .event-title {
  white-space: normal;
  overflow: visible;
  background: var(--bg-surface);
  padding: 0.1rem 0.2rem;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
  z-index: 10;
  position: relative;
}
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 1rem;
}
.card-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
}
.card-title {
  font-weight: 700;
}
.table-container {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}
.badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}
.badge-amber {
  background: var(--amber-soft);
  color: var(--amber-text);
}
.badge-blue {
  background: var(--accent-soft);
  color: var(--accent-text);
}
.badge-gray {
  background: var(--bg-surface-sunken);
  color: var(--text-secondary);
}
.badge-green {
  background: #cce5ff;
  color: #0a2f5a;
}
.btn-ghost-sm {
  background: none;
  border: none;
  cursor: pointer;
  margin: 0 0.25rem;
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
.form-group input, .form-group select {
  width: 100%;
  padding: 0.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-surface);
}
.btn-primary {
  background: #4b5675;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}
</style>