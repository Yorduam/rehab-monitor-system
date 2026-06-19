<template>
  <div>

    <template v-if="authStore.isTeacher || authStore.isAdmin">
      <div class="erp-r-teacher" @click="closeDropdown">

        <div class="t-page-header">
          <div>
            <h1 class="t-page-title">Реабилитанты</h1>
            <p class="t-page-sub">
              Всего <strong>{{ totalCount || recipients.length }}</strong>
              <template v-if="draftCount"> · черновиков — <strong>{{ draftCount }}</strong></template>
            </p>
          </div>
          <div class="t-page-actions">
            <button class="t-btn t-btn-primary" @click.stop="openAddModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Добавить
            </button>
          </div>
        </div>

        <div class="t-controls">
          <div class="t-search-wrap">
            <label for="t-search" class="sr-only">Поиск реабилитанта</label>
            <div class="t-search-input" :class="{ 'focused': searchFocused }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                id="t-search"
                type="search"
                v-model="search"
                placeholder="Быстрый поиск по имени, группе, куратору…"
                autocomplete="off"
                @input="onSearchInput"
                @focus="searchFocused = true"
                @blur="searchFocused = false"
                @keydown.escape="clearSearch"
              />
              <kbd aria-hidden="true">/</kbd>
            </div>
          </div>
          <div class="t-control-group">
            <div class="t-view-toggle" role="tablist" aria-label="Вид отображения">
              <button
                class="t-view-btn" :class="{ active: viewMode === 'grid' }"
                role="tab" :aria-selected="viewMode === 'grid'"
                aria-label="Сетка карточек" @click="viewMode = 'grid'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </button>
              <button
                class="t-view-btn" :class="{ active: viewMode === 'list' }"
                role="tab" :aria-selected="viewMode === 'list'"
                aria-label="Список" @click="viewMode = 'list'"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="t-filter-row" role="group" aria-label="Быстрые фильтры">
          <button class="t-chip" :class="{ active: activeFilter === 'all' }" :aria-pressed="activeFilter === 'all'" @click="setFilter('all')">
            Все <span class="t-chip-count">{{ recipients.length }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'active' }" :aria-pressed="activeFilter === 'active'" @click="setFilter('active')">
            Активные <span class="t-chip-count">{{ activeCount }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'draft' }" :aria-pressed="activeFilter === 'draft'" @click="setFilter('draft')">
            Черновики <span class="t-chip-count">{{ draftCount }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'archived' }" :aria-pressed="activeFilter === 'archived'" @click="setFilter('archived')">
            В архиве <span class="t-chip-count">{{ archivedCount }}</span>
          </button>
        </div>

        <div v-if="loading" class="t-loading-state">
          <div class="t-spinner"></div>
          <p>Загрузка…</p>
        </div>
        <div v-else-if="error" class="t-error-state">
          <p>{{ error }}</p>
          <button class="t-btn t-btn-primary" @click="loadRecipients">Повторить</button>
        </div>
        <div v-else-if="filteredRecipients.length === 0" class="t-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p>Нет реабилитантов{{ activeFilter !== 'all' ? ' в выбранной категории' : '' }}.</p>
          <button v-if="activeFilter !== 'all'" class="t-btn t-btn-secondary" @click="setFilter('all')">Показать всех</button>
        </div>

        <div v-else-if="viewMode === 'grid'" class="t-card-grid" role="list" aria-label="Список реабилитантов">
          <article
            v-for="(r, idx) in filteredRecipients"
            :key="r.id"
            class="t-rcard"
            :class="{
              'archived-card': r.status === 'archived',
              'selected': selectedIds.includes(r.id)
            }"
            role="listitem"
            :aria-labelledby="`rc-name-${r.id}`"
          >

            <input
              type="checkbox"
              class="t-rcard-check t-checkbox"
              :aria-label="`Выбрать ${fullName(r)}`"
              :checked="selectedIds.includes(r.id)"
              @change="toggleSelect(r.id)"
              @click.stop
            />

            <a
              href="javascript:void(0)"
              class="t-rcard-link"
              @click="openDetails(r.id)"
              :aria-label="`Открыть карточку: ${fullName(r)}`"
            ></a>

            <div class="t-rcard-body">
              <div class="t-rcard-avatar" :class="`a${(idx % 6) + 1}`" aria-hidden="true">{{ initials(r) }}</div>
              <div class="t-rcard-main">
                <div class="t-rcard-name" :id="`rc-name-${r.id}`">{{ fullName(r) }}</div>
                <div class="t-rcard-meta">
                  <template v-if="recipientAge(r) != null">{{ recipientAge(r) }} лет</template>
                  <template v-if="recipientAge(r) != null && curatorName(r)"> · </template>
                  <template v-if="curatorName(r)">куратор {{ curatorName(r) }}</template>
                </div>
                <div class="t-rcard-tags">
                  <span v-if="r.diagnosis" class="t-tag t-tag-blue">{{ r.diagnosis }}</span>
                  <span v-if="r.group?.groupName" class="t-tag t-tag-sage">{{ r.group.groupName }}</span>
                  <span class="t-tag t-tag-neutral">{{ statusLabel(r.status) }}</span>
                </div>
              </div>
            </div>

            <div class="t-rcard-footer">
              <div class="t-attendance-block">
                <div>
                  <div class="t-att-label">Статус</div>
                  <div class="t-att-value">{{ statusLabel(r.status) }}</div>
                </div>
              </div>

              <div class="t-rcard-actions" @click.stop style="position:relative;z-index:2">
                <button class="t-action-btn" :aria-label="`Редактировать ${fullName(r)}`" @click="editRecipient(r)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <div style="position:relative">
                  <button class="t-action-btn" aria-label="Ещё действия" @click.stop="toggleDropdown(r.id)">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>

                  <div v-if="activeDropdown === r.id" class="t-row-menu" @click.stop>
                    <button class="t-menu-item" @click="openDetails(r.id); closeDropdown()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Открыть карточку
                    </button>
                    <button class="t-menu-item" @click="editRecipient(r); closeDropdown()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Редактировать
                    </button>
                    <div class="t-menu-divider"></div>
                    <button class="t-menu-item t-menu-danger" @click="deleteRecipient(r.id); closeDropdown()">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="t-list-table-wrap">
          <div class="t-list-table" role="table" aria-label="Список реабилитантов">

            <div class="t-tr t-thead" role="row">
              <input
                type="checkbox"
                class="t-checkbox"
                :checked="allSelected"
                :indeterminate.prop="someSelected && !allSelected"
                @change="toggleSelectAll"
                aria-label="Выбрать всех"
              />
              <div role="columnheader">Реабилитант</div>
              <div class="t-col-group" role="columnheader">Группа</div>
              <div class="t-col-curator" role="columnheader">Куратор</div>
              <div role="columnheader">Статус</div>
              <div role="columnheader"><span class="sr-only">Действия</span></div>
            </div>

            <div
              v-for="(r, idx) in filteredRecipients"
              :key="r.id"
              class="t-tr"
              :class="{ selected: selectedIds.includes(r.id) }"
              role="row"
            >
              <input
                type="checkbox"
                class="t-checkbox"
                :checked="selectedIds.includes(r.id)"
                @change="toggleSelect(r.id)"
                @click.stop
                :aria-label="`Выбрать ${fullName(r)}`"
              />

              <div class="t-name-cell" role="cell" @click="openDetails(r.id)" style="cursor:pointer">
                <div class="t-mini-avatar" :class="`a${(idx % 6) + 1}`" aria-hidden="true">{{ initials(r) }}</div>
                <div class="t-name-main">
                  <div class="t-name-text">{{ fullName(r) }}</div>
                  <div class="t-name-sub">{{ r.diagnosis || '—' }}<template v-if="recipientAge(r) != null"> · {{ recipientAge(r) }} лет</template></div>
                </div>
              </div>

              <div class="t-tr-cell t-col-group" role="cell">{{ r.group?.groupName || '—' }}</div>
              <div class="t-tr-cell t-col-curator" role="cell">{{ curatorName(r) || '—' }}</div>

              <div class="t-tr-attendance" role="cell">
                <span class="t-att-num">{{ statusLabel(r.status) }}</span>
              </div>

              <div class="t-tr-actions" role="cell" @click.stop>
                <button class="t-action-btn" @click="openDetails(r.id)" title="Открыть">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button class="t-action-btn" @click="editRecipient(r)" title="Редактировать">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <div style="position:relative">
                  <button class="t-action-btn" @click.stop="toggleDropdown(r.id)" title="Ещё">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  <div v-if="activeDropdown === r.id" class="t-row-menu t-row-menu-list" @click.stop>
                    <button class="t-menu-item" @click="openDetails(r.id); closeDropdown()">Карточка</button>
                    <button class="t-menu-item" @click="editRecipient(r); closeDropdown()">Редактировать</button>
                    <div class="t-menu-divider"></div>
                    <button class="t-menu-item t-menu-danger" @click="deleteRecipient(r.id); closeDropdown()">Удалить</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="t-selection-toolbar" :class="{ visible: selectedIds.length > 0 }" aria-live="polite">
          <div class="t-selection-info">
            <span class="t-selection-badge">{{ selectedIds.length }}</span>
            выбрано
          </div>
          <button class="t-sel-action" @click="clearSelection">Снять выделение</button>
          <button class="t-sel-action t-sel-danger" @click="deleteSelected">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
            Удалить выбранных
          </button>
          <button class="t-sel-close" @click="clearSelection" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <Pagination
          v-if="totalPages > 1"
          :page="page"
          :total-pages="totalPages"
          :limit="limit"
          @update:page="changePage"
          @update:limit="changeLimit"
        />

        <Modal v-if="showModal && editId" :title="modalTitle" @close="closeModal">
          <form @submit.prevent="saveRecipient" class="recipient-form">
            <div class="form-grid">
              <div class="form-group"><label>Фамилия</label><input v-model="form.lastName" required /></div>
              <div class="form-group"><label>Имя</label><input v-model="form.firstName" required /></div>
              <div class="form-group"><label>Отчество</label><input v-model="form.middleName" /></div>
              <div class="form-group"><label>Дата рождения</label><input v-model="form.birthDate" type="date" /></div>
              <div class="form-group"><label>Email</label><input v-model="form.email" type="email" /></div>
              <div class="form-group"><label>Телефон</label><input v-model="form.telephone" /></div>
              <div class="form-group"><label>Диагноз</label><input v-model="form.diagnosis" /></div>
              <div class="form-group">
                <label>Группа</label>
                <select v-model="form.groupId">
                  <option :value="null">Не выбрана</option>
                  <option v-for="g in groupsList" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </div>
              <div class="form-group"><label>Фото URL</label><input v-model="form.photo" /></div>
              <div class="form-group">
                <label>Статус</label>
                <select v-model="form.status">
                  <option value="draft">Черновик</option>
                  <option value="active">Активен</option>
                  <option value="archived">В архиве</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeModal">Отмена</button>
              <button type="submit" class="btn-primary">Сохранить</button>
            </div>
          </form>
        </Modal>

      </div>
    </template>

    <template v-else>
      <div class="toolbar">
        <div class="search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" v-model="search" placeholder="Поиск по имени…" @input="onSearchInput" />
        </div>
        <div class="filter-group">
          <label>Диагноз</label>
          <select v-model="filterDiagnosis" class="styled-select" @change="onFilterChange">
            <option value="all">Все</option>
            <option value="РАС">РАС</option>
            <option value="ЗПР">ЗПР</option>
          </select>
        </div>
        <button class="btn-primary" @click="openAddModal">Добавить</button>
      </div>

      <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Загрузка...</p></div>
      <div v-else-if="error" class="error-state"><p>{{ error }}</p><button class="btn-primary" @click="loadRecipients">Повторить</button></div>
      <div v-else-if="recipients.length === 0" class="empty-state"><p>Нет данных. Добавьте первого реабилитанта.</p></div>
      <div v-else class="items-grid">
        <div v-for="r in recipients" :key="r.id" class="item-card" @click="openDetails(r.id)">
          <div class="actions-dropdown">
            <button class="dropdown-trigger" @click.stop="toggleDropdown(r.id)">⋮</button>
            <div v-if="activeDropdown === r.id" class="dropdown-menu" @click.stop>
              <button @click="viewEvents(r)">Просмотр событий</button>
              <button @click="viewAttendance(r)">Просмотр посещаемости</button>
              <button @click="viewPerformance(r)">Просмотр успеваемости</button>
              <hr class="dropdown-divider" />
              <template v-if="authStore.isAdmin || authStore.isTeacher">
                <button @click="editRecipient(r)">✏️ Редактировать</button>
                <button @click="deleteRecipient(r.id)">🗑 Удалить</button>
              </template>
            </div>
          </div>
          <div class="card-left">
            <div class="avatar-wrapper">
              <img :src="r.photo || defaultPhoto" class="avatar" />
            </div>
            <div class="card-info">
              <div class="name">{{ fullName(r) }}</div>
              <div class="sub">Куратор: {{ r.group?.curatorRef?.fullName || '—' }}</div>
              <div class="tags">
                <span class="badge-blue">{{ r.diagnosis || 'Не указан' }}</span>
                <span class="badge-gray">{{ r.group?.groupName || '—' }}</span>
              </div>
            </div>
          </div>
          <div class="card-right">
            <div class="widget-status" :title="statusLabel(r.status)">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke-width="1.5" /><path d="M12 6v6l4 2" stroke-width="1.5" /></svg>
              <span class="widget-value">{{ statusLabel(r.status) }}</span>
            </div>
            <div class="widget-attendance">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke-width="1.5" /></svg>
              <span class="widget-value"><template v-if="recipientAge(r) != null">{{ recipientAge(r) }} лет</template><template v-else>—</template></span>
            </div>
          </div>
        </div>
      </div>

      <Pagination v-if="totalPages > 1" :page="page" :total-pages="totalPages" :limit="limit" @update:page="changePage" @update:limit="changeLimit" />

      <Modal v-if="showModal && editId" :title="modalTitle" @close="closeModal">
        <form @submit.prevent="saveRecipient" class="recipient-form">
          <div class="form-grid">
            <div class="form-group"><label>Фамилия</label><input v-model="form.lastName" required /></div>
            <div class="form-group"><label>Имя</label><input v-model="form.firstName" required /></div>
            <div class="form-group"><label>Отчество</label><input v-model="form.middleName" /></div>
            <div class="form-group"><label>Дата рождения</label><input v-model="form.birthDate" type="date" /></div>
            <div class="form-group"><label>Email</label><input v-model="form.email" type="email" /></div>
            <div class="form-group"><label>Телефон</label><input v-model="form.telephone" /></div>
            <div class="form-group"><label>Диагноз</label><input v-model="form.diagnosis" /></div>
            <div class="form-group"><label>Группа</label><select v-model="form.groupId"><option :value="null">Не выбрана</option><option v-for="g in groupsList" :key="g.id" :value="g.id">{{ g.name }}</option></select></div>
            <div class="form-group"><label>Фото URL</label><input v-model="form.photo" /></div>
            <div class="form-group"><label>Статус</label><select v-model="form.status"><option value="draft">Черновик</option><option value="active">Активен</option><option value="archived">В архиве</option></select></div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal">Отмена</button>
            <button type="submit" class="btn-primary">Сохранить</button>
          </div>
        </form>
      </Modal>
    </template>

    <AddRecipientWizard
      v-if="showWizard"
      :groups-list="groupsList"
      @close="showWizard = false"
      @saved="showWizard = false; loadRecipients()"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePageStore } from '../stores/page';
import api from '../api';
import { fullName, recipientAge, initials, statusLabel } from '../utils/recipient';
import Modal from '../components/Modal.vue';
import Pagination from '../components/Pagination.vue';
import AddRecipientWizard from '../components/AddRecipientWizard.vue';

const authStore = useAuthStore();
const pageStore = usePageStore();

const recipients   = ref([]);
const groupsList   = ref([]);
const search       = ref('');
const filterDiagnosis = ref('all');
const page         = ref(1);
const limit        = ref(15);
const totalPages   = ref(1);
const totalCount   = ref(0);
const loading      = ref(true);
const error        = ref('');
const showModal    = ref(false);
const modalTitle   = ref('');
const form = ref({
  firstName: '', middleName: '', lastName: '', birthDate: '', email: '', telephone: '',
  diagnosis: '', groupId: null, photo: '', status: 'active'
});
const editId       = ref(null);
const showWizard   = ref(false);
const defaultPhoto = 'https://via.placeholder.com/100';
let searchTimeout  = null;
const activeDropdown = ref(null);

const viewMode    = ref('grid');
const activeFilter = ref('all');
const selectedIds  = ref([]);
const searchFocused = ref(false);

const filteredRecipients = computed(() => {
  switch (activeFilter.value) {
    case 'draft':    return recipients.value.filter(r => r.status === 'draft');
    case 'active':   return recipients.value.filter(r => r.status === 'active');
    case 'archived': return recipients.value.filter(r => r.status === 'archived');
    default:         return recipients.value;
  }
});
const draftCount    = computed(() => recipients.value.filter(r => r.status === 'draft').length);
const activeCount   = computed(() => recipients.value.filter(r => r.status === 'active').length);
const archivedCount = computed(() => recipients.value.filter(r => r.status === 'archived').length);
const allSelected     = computed(() =>
  filteredRecipients.value.length > 0 &&
  filteredRecipients.value.every(r => selectedIds.value.includes(r.id))
);
const someSelected = computed(() => selectedIds.value.length > 0);

const curatorName = (r) => r.group?.curatorRef?.fullName || '';

const setFilter = (f) => { activeFilter.value = f; };
const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) selectedIds.value.push(id);
  else selectedIds.value.splice(idx, 1);
};
const toggleSelectAll = () => {
  if (allSelected.value) selectedIds.value = [];
  else selectedIds.value = filteredRecipients.value.map(r => r.id);
};
const clearSelection = () => { selectedIds.value = []; };
const deleteSelected = async () => {
  if (!confirm(`Удалить ${selectedIds.value.length} реабилитантов?`)) return;
  try {
    for (const id of selectedIds.value) {
      await api.delete(`/recipients/${id}`);
    }
    clearSelection();
    await loadRecipients();
  } catch (err) { console.error(err); alert('Ошибка при удалении'); }
};
const clearSearch = () => { search.value = ''; page.value = 1; loadRecipients(); };

const toggleDropdown = (id) => { activeDropdown.value = activeDropdown.value === id ? null : id; };
const closeDropdown  = () => { activeDropdown.value = null; };

const viewEvents      = (r) => { console.log('События', fullName(r));     closeDropdown(); };
const viewAttendance  = (r) => { console.log('Посещаемость', fullName(r)); closeDropdown(); };
const viewPerformance = (r) => { console.log('Успеваемость', fullName(r)); closeDropdown(); };

const openDetails = (id) => {
  pageStore.setPage('recipient-details', 'Карточка реабилитанта', { recipientId: id });
};

const loadRecipients = async () => {
  loading.value = true; error.value = '';
  try {
    const params = {
      page:      page.value,
      limit:     limit.value,
      search:    search.value || undefined,
      diagnosis: filterDiagnosis.value !== 'all' ? filterDiagnosis.value : undefined
    };
    const res = await api.get('/recipients', { params });
    recipients.value = res.data.data;
    totalPages.value  = res.data.totalPages;
    totalCount.value  = res.data.totalCount || res.data.total || 0;
  } catch (err) {
    console.error(err);
    error.value = 'Не удалось загрузить данные.';
  } finally {
    loading.value = false;
  }
};

const loadGroups = async () => {
  try {
    const { data } = await api.get('/groups');
    groupsList.value = data.data || [];
  } catch (err) { console.error(err); }
};

const onSearchInput  = () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => { page.value = 1; loadRecipients(); }, 300); };
const onFilterChange = () => { page.value = 1; loadRecipients(); };
const changePage     = (p) => { page.value = p;    loadRecipients(); };
const changeLimit    = (l) => { limit.value = l; page.value = 1; loadRecipients(); };

const resetForm = () => ({
  firstName: '', middleName: '', lastName: '', birthDate: '', email: '', telephone: '',
  diagnosis: '', groupId: null, photo: '', status: 'active'
});
const openAddModal = () => {
  showWizard.value = true;
};
const editRecipient = (r) => {
  editId.value = r.id;
  form.value = {
    firstName:  r.firstName || '',
    middleName: r.middleName || '',
    lastName:   r.lastName || '',
    birthDate:  r.birthDate || '',
    email:      r.email || '',
    telephone:  r.telephone || '',
    diagnosis:  r.diagnosis || '',
    groupId:    r.groupId || null,
    photo:      r.photo || '',
    status:     r.status || 'active'
  };
  modalTitle.value = 'Редактировать';
  showModal.value = true;
};
const saveRecipient = async () => {
  try {
    if (editId.value) await api.put(`/recipients/${editId.value}`, form.value);
    else              await api.post('/recipients', form.value);
    await loadRecipients();
    closeModal();
  } catch (err) { console.error(err); alert('Ошибка сохранения'); }
};
const deleteRecipient = async (id) => {
  if (!confirm('Удалить реабилитанта? Это действие нельзя отменить.')) return;
  try {
    await api.delete(`/recipients/${id}`);
    await loadRecipients();
  } catch (err) {
    console.error(err);
    alert('Не удалось удалить реабилитанта. Попробуйте ещё раз.');
  }
};
const closeModal = () => { showModal.value = false; };

const handleClickOutside = (event) => {
  if (!event.target.closest('.actions-dropdown') && !event.target.closest('.t-rcard-actions') && !event.target.closest('.t-tr-actions'))
    activeDropdown.value = null;
};

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadRecipients();
  loadGroups();
  window.addEventListener('click', handleClickOutside);
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  window.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.erp-r-teacher {
  --t-font-serif: 'Fraunces', Georgia, 'Times New Roman', serif;
  --t-font-sans:  system-ui, -apple-system, 'Segoe UI', sans-serif;
  --t-canvas:       #F7F4ED;
  --t-paper:        #FFFFFF;
  --t-paper-soft:   #F2ECDF;
  --t-paper-sunken: #E8E1D0;
  --t-ink:        #131713;
  --t-ink-strong: #0A0D0A;
  --t-ink-muted:  #3A4036;
  --t-ink-subtle: #4F5749;
  --t-line:        #D6CFBE;
  --t-line-soft:   #E4DECF;
  --t-line-strong: #B8AF9A;
  --t-sage-900: #112211;
  --t-sage-700: #234623;
  --t-sage-500: #3F6E3F;
  --t-sage-100: #D6E4BE;
  --t-sage-50:  #EBF2D8;
  --t-amber-900: #3F1D00;
  --t-amber-700: #6B3E0E;
  --t-amber-500: #B97718;
  --t-amber-100: #F2DCB1;
  --t-amber-50:  #FBF0D6;
  --t-rose-900: #3A0F08;
  --t-rose-700: #6B2519;
  --t-rose-500: #B14B39;
  --t-rose-100: #EDCABE;
  --t-rose-50:  #F8E2D7;
  --t-blue-900: #0A2436;
  --t-blue-700: #1F3E55;
  --t-blue-100: #C8D7E3;
  --t-blue-50:  #E0EAF1;
  --t-r-sm: 0.375rem;
  --t-r-md: 0.625rem;
  --t-r-lg: 1rem;
  --t-shadow-xs: 0 1px 0 rgba(17,34,17,.03);
  --t-shadow-sm: 0 1px 2px rgba(17,34,17,.04), 0 1px 0 rgba(17,34,17,.03);
  --t-shadow-md: 0 .25rem .875rem rgba(17,34,17,.06), 0 1px 2px rgba(17,34,17,.04);
  --t-shadow-lg: 0 .75rem 2.5rem rgba(17,34,17,.09), 0 2px 6px rgba(17,34,17,.04);
  --t-tap: 2.75rem;

  font-family: var(--t-font-sans);
}
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
.t-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.t-page-title {
  font-family: var(--t-font-serif);
  font-size: 2.5rem;
  font-weight: 500;
  letter-spacing: -0.025em;
  color: var(--t-ink-strong);
  line-height: 1.05;
}
.t-page-sub {
  font-size: 0.9375rem;
  color: var(--t-ink-muted);
  margin-top: 0.5rem;
}
.t-page-sub strong { color: var(--t-ink-strong); font-weight: 500; }
.t-page-actions { display: flex; gap: 0.5rem; }
.t-btn {
  display: inline-flex; align-items: center; gap: 0.5rem;
  min-height: var(--t-tap);
  padding: 0.5rem 1rem;
  border-radius: var(--t-r-md);
  font-size: 0.875rem; font-weight: 500;
  border: 1px solid transparent;
  cursor: pointer; white-space: nowrap;
  transition: background 150ms, border-color 150ms, color 150ms;
}
.t-btn svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; }
.t-btn-primary {
  background: var(--t-sage-900); color: #F3F6EA; border-color: var(--t-sage-900);
}
.t-btn-primary:hover { background: var(--t-sage-700); border-color: var(--t-sage-700); }
.t-btn-secondary {
  background: var(--t-paper); color: var(--t-ink-strong); border-color: var(--t-line-strong);
}
.t-btn-secondary:hover { background: var(--t-paper-soft); }
.t-controls {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  align-items: center;
}
.t-search-input {
  display: flex; align-items: center; gap: 0.75rem;
  min-height: var(--t-tap);
  padding: 0.5rem 1rem;
  background: var(--t-paper);
  border: 1px solid var(--t-line-strong);
  border-radius: var(--t-r-md);
  transition: border-color 150ms, box-shadow 150ms;
}
.t-search-input:hover { border-color: var(--t-ink-muted); }
.t-search-input.focused {
  border-color: var(--t-sage-700);
  box-shadow: 0 0 0 3px rgba(63,110,63,.2);
}
.t-search-input svg { width: 1rem; height: 1rem; color: var(--t-ink-muted); flex: 0 0 1rem; }
.t-search-input input {
  flex: 1; min-width: 0;
  border: none; background: none; outline: none;
  font-size: 0.9375rem; color: var(--t-ink-strong);
}
.t-search-input input::placeholder { color: var(--t-ink-subtle); }
.t-search-input kbd {
  font-size: 0.75rem; color: var(--t-ink-muted);
  background: var(--t-paper-soft); border: 1px solid var(--t-line);
  border-radius: 0.25rem; padding: 0.125rem 0.4375rem;
  font-weight: 500; font-family: var(--t-font-sans);
}
.t-control-group { display: flex; gap: 0.5rem; align-items: center; }
.t-view-toggle {
  display: flex; gap: 0.125rem;
  background: var(--t-paper); border: 1px solid var(--t-line-strong);
  border-radius: var(--t-r-md); padding: 0.1875rem;
}
.t-view-btn {
  min-width: 2.25rem; min-height: 2.25rem; padding: 0.5rem;
  display: grid; place-items: center;
  border-radius: 0.3125rem; color: var(--t-ink-muted);
  transition: background 150ms, color 150ms; cursor: pointer;
  background: none; border: none;
}
.t-view-btn:hover { background: var(--t-paper-soft); color: var(--t-ink-strong); }
.t-view-btn.active { background: var(--t-sage-900); color: #F3F6EA; }
.t-view-btn svg { width: 1rem; height: 1rem; }
.t-filter-row {
  display: flex; gap: 0.5rem; flex-wrap: wrap;
  margin-bottom: 1.25rem; align-items: center;
}
.t-chip {
  display: inline-flex; align-items: center; gap: 0.5rem;
  min-height: 2.25rem; padding: 0.5rem 1rem;
  border-radius: 999px; font-size: 0.8125rem; font-weight: 500;
  background: var(--t-paper); color: var(--t-ink-strong);
  border: 1px solid var(--t-line-strong);
  cursor: pointer; transition: all 150ms;
}
.t-chip:hover { border-color: var(--t-ink-muted); background: var(--t-paper-soft); }
.t-chip.active { background: var(--t-sage-900); color: #F3F6EA; border-color: var(--t-sage-900); }
.t-chip-count {
  background: rgba(255,255,255,.2); color: inherit;
  padding: 0 0.4375rem; border-radius: 999px;
  font-size: 0.6875rem; font-weight: 500;
  min-width: 1.125rem; text-align: center;
}
.t-chip:not(.active) .t-chip-count {
  background: var(--t-paper-soft); color: var(--t-ink-muted);
}
.t-loading-state, .t-error-state, .t-empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 1rem;
  padding: 4rem 2rem; color: var(--t-ink-muted); text-align: center;
}
.t-empty-state svg { width: 3rem; height: 3rem; opacity: .35; }
.t-spinner {
  width: 2.5rem; height: 2.5rem;
  border: 3px solid var(--t-sage-100);
  border-top-color: var(--t-sage-700);
  border-radius: 50%;
  animation: t-spin .8s linear infinite;
}
@keyframes t-spin { to { transform: rotate(360deg); } }
.t-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr));
  gap: 1rem;
}
.t-rcard {
  position: relative;
  background: var(--t-paper);
  border: 1px solid var(--t-line);
  border-radius: var(--t-r-lg);
  box-shadow: var(--t-shadow-xs);
  display: grid;
  overflow: visible;
  opacity: 0;
  transform: translateY(6px);
  animation: t-cardIn 300ms cubic-bezier(.2,.7,.2,1) forwards;
  transition: transform 180ms, box-shadow 180ms, border-color 180ms;
}
.t-rcard:nth-child(1)  { animation-delay:   0ms; }
.t-rcard:nth-child(2)  { animation-delay:  40ms; }
.t-rcard:nth-child(3)  { animation-delay:  80ms; }
.t-rcard:nth-child(4)  { animation-delay: 120ms; }
.t-rcard:nth-child(5)  { animation-delay: 160ms; }
.t-rcard:nth-child(6)  { animation-delay: 200ms; }
.t-rcard:nth-child(n+7){ animation-delay: 240ms; }
@keyframes t-cardIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
.t-rcard:hover { border-color: var(--t-line-strong); box-shadow: var(--t-shadow-md); transform: translateY(-2px); }
.t-rcard.has-alert { border-left: 4px solid var(--t-rose-500); }
.t-rcard.completed-card { opacity: .75; }
.t-rcard.selected {
  border-color: var(--t-sage-700);
  box-shadow: 0 0 0 3px rgba(63,110,63,.2);
}
.t-rcard-check {
  position: absolute; top: 0.75rem; left: 0.75rem; z-index: 2;
  opacity: 0; transition: opacity 150ms;
}
.t-rcard:hover .t-rcard-check,
.t-rcard.selected .t-rcard-check { opacity: 1; }
.t-rcard-flags {
  position: absolute; top: 0.75rem; right: 0.75rem;
  display: flex; gap: 0.25rem; z-index: 2;
}
.t-flag {
  width: 1.375rem; height: 1.375rem; border-radius: 50%;
  display: grid; place-items: center; cursor: help;
}
.t-flag svg { width: 0.75rem; height: 0.75rem; }
.t-flag-rose { background: var(--t-rose-100); color: var(--t-rose-900); }
.t-flag-amber { background: var(--t-amber-100); color: var(--t-amber-900); }
.t-rcard-link {
  position: absolute; inset: 0;
  border-radius: inherit; z-index: 1;
}
.t-rcard-link:focus-visible {
  outline: 3px solid var(--t-sage-700);
  outline-offset: -3px;
}
.t-rcard-body {
  padding: 1rem;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
}
.t-rcard-avatar {
  width: 3rem; height: 3rem; border-radius: 50%;
  display: grid; place-items: center;
  font-family: var(--t-font-serif); font-weight: 500;
  font-size: 1.125rem; letter-spacing: -0.02em;
  flex: 0 0 3rem; align-self: start;
}
.t-rcard-avatar.a1 { background: linear-gradient(135deg, var(--t-amber-100), var(--t-rose-100));  color: var(--t-amber-900); }
.t-rcard-avatar.a2 { background: linear-gradient(135deg, var(--t-sage-100),  var(--t-blue-100));  color: var(--t-sage-900);  }
.t-rcard-avatar.a3 { background: linear-gradient(135deg, var(--t-blue-100),  var(--t-sage-100));  color: var(--t-blue-900);  }
.t-rcard-avatar.a4 { background: linear-gradient(135deg, var(--t-rose-100),  var(--t-amber-100)); color: var(--t-rose-900);  }
.t-rcard-avatar.a5 { background: linear-gradient(135deg, var(--t-sage-100),  var(--t-amber-100)); color: var(--t-sage-900);  }
.t-rcard-avatar.a6 { background: linear-gradient(135deg, var(--t-amber-100), var(--t-sage-100));  color: var(--t-amber-900); }

.t-rcard-main { min-width: 0; }
.t-rcard-name {
  font-size: 1rem; font-weight: 600;
  color: var(--t-ink-strong); letter-spacing: -0.01em; line-height: 1.3;
}
.t-rcard-meta {
  font-size: 0.8125rem; color: var(--t-ink-muted); margin-top: 0.125rem;
}
.t-rcard-tags {
  display: flex; flex-wrap: wrap; gap: 0.3125rem; margin-top: 0.5rem;
}
.t-tag {
  font-size: 0.75rem; padding: 0.1875rem 0.5625rem;
  border-radius: 999px; font-weight: 500; line-height: 1.3;
}
.t-tag-sage    { background: var(--t-sage-50);  color: var(--t-sage-700);  }
.t-tag-blue    { background: var(--t-blue-50);  color: var(--t-blue-700);  }
.t-tag-amber   { background: var(--t-amber-50); color: var(--t-amber-700); }
.t-tag-rose    { background: var(--t-rose-50);  color: var(--t-rose-700);  }
.t-tag-neutral { background: var(--t-paper-soft); color: var(--t-ink-muted); }
.t-rcard-footer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem; align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--t-line-soft);
}
.t-attendance-block {
  display: flex; align-items: center; gap: 0.75rem; min-width: 0;
}
.t-att-percent {
  font-family: var(--t-font-serif); font-size: 1.25rem; font-weight: 500;
  letter-spacing: -0.02em; color: var(--t-ink-strong);
  line-height: 1; font-variant-numeric: tabular-nums;
}
.t-att-sign { font-size: 0.8125rem; color: var(--t-ink-muted); }
.t-att-bar {
  height: 0.25rem; width: 4rem;
  background: var(--t-paper-sunken); border-radius: 999px;
  overflow: hidden; flex: 1; max-width: 5rem;
}
.t-att-bar-fill { height: 100%; background: var(--t-sage-500); border-radius: 999px; }
.t-att-bar-fill.warn { background: var(--t-amber-500); }
.t-att-bar-fill.bad  { background: var(--t-rose-500); }
.t-att-label {
  font-size: 0.6875rem; color: var(--t-ink-muted);
  text-transform: uppercase; letter-spacing: 0.08em;
  font-weight: 500; line-height: 1; margin-bottom: 0.25rem;
}
.t-rcard-actions { display: flex; gap: 0.125rem; }
.t-action-btn {
  width: var(--t-tap); height: var(--t-tap);
  display: grid; place-items: center;
  border-radius: var(--t-r-md); color: var(--t-ink-muted);
  transition: background 150ms, color 150ms;
  border: 1px solid transparent; background: none; cursor: pointer;
}
.t-action-btn:hover {
  background: var(--t-paper-soft); color: var(--t-ink-strong); border-color: var(--t-line);
}
.t-action-btn svg { width: 1.0625rem; height: 1.0625rem; }
.t-row-menu {
  position: absolute;
  right: 0; bottom: calc(100% + 4px);
  z-index: 20; min-width: 13rem;
  background: var(--t-paper); border: 1px solid var(--t-line-strong);
  border-radius: var(--t-r-md); box-shadow: var(--t-shadow-lg);
  padding: 0.375rem;
}
.t-row-menu-list { bottom: auto; top: calc(100% + 4px); }
.t-menu-item {
  display: flex; align-items: center; gap: 0.75rem;
  width: 100%; min-height: var(--t-tap); padding: 0.5rem 0.75rem;
  border-radius: 0.3125rem; font-size: 0.875rem; color: var(--t-ink-strong);
  text-align: left; transition: background 120ms;
  background: none; border: none; cursor: pointer;
}
.t-menu-item:hover { background: var(--t-paper-soft); }
.t-menu-item svg { width: 1rem; height: 1rem; flex: 0 0 1rem; color: var(--t-ink-muted); }
.t-menu-divider { height: 1px; background: var(--t-line); margin: 0.25rem 0; }
.t-menu-danger { color: var(--t-rose-700); }
.t-menu-danger svg { color: var(--t-rose-700); }
.t-menu-danger:hover { background: var(--t-rose-50); }
.t-list-table-wrap { margin-bottom: 1.5rem; }
.t-list-table {
  background: var(--t-paper); border: 1px solid var(--t-line);
  border-radius: var(--t-r-lg); overflow: hidden;
  box-shadow: var(--t-shadow-xs);
}
.t-tr {
  display: grid;
  grid-template-columns: 2.25rem minmax(14rem,2.5fr) minmax(8rem,1.2fr) minmax(8rem,1.2fr) minmax(10rem,1.4fr) auto;
  gap: 1rem; align-items: center;
  padding: 0 1rem; min-height: 3.75rem;
  border-bottom: 1px solid var(--t-line-soft);
  transition: background 150ms;
  position: relative;
}
.t-tr:last-child { border-bottom: none; }
.t-tr:hover { background: var(--t-paper-soft); }
.t-tr.selected { background: var(--t-sage-50); }
.t-tr.has-alert { box-shadow: inset 4px 0 0 var(--t-rose-500); }
.t-thead {
  background: var(--t-paper-soft);
  font-size: 0.6875rem; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--t-ink-muted);
  font-weight: 500; min-height: 2.75rem;
  border-bottom: 1px solid var(--t-line);
}
.t-thead:hover { background: var(--t-paper-soft); }

.t-name-cell { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.t-mini-avatar {
  width: 2rem; height: 2rem; border-radius: 50%;
  display: grid; place-items: center;
  font-family: var(--t-font-serif); font-weight: 500;
  font-size: 0.8125rem; letter-spacing: -0.02em;
  flex: 0 0 2rem;
}
.t-mini-avatar.a1 { background: linear-gradient(135deg, var(--t-amber-100), var(--t-rose-100));  color: var(--t-amber-900); }
.t-mini-avatar.a2 { background: linear-gradient(135deg, var(--t-sage-100),  var(--t-blue-100));  color: var(--t-sage-900);  }
.t-mini-avatar.a3 { background: linear-gradient(135deg, var(--t-blue-100),  var(--t-sage-100));  color: var(--t-blue-900);  }
.t-mini-avatar.a4 { background: linear-gradient(135deg, var(--t-rose-100),  var(--t-amber-100)); color: var(--t-rose-900);  }
.t-mini-avatar.a5 { background: linear-gradient(135deg, var(--t-sage-100),  var(--t-amber-100)); color: var(--t-sage-900);  }
.t-mini-avatar.a6 { background: linear-gradient(135deg, var(--t-amber-100), var(--t-sage-100));  color: var(--t-amber-900); }

.t-name-main { min-width: 0; }
.t-name-text {
  font-size: 0.875rem; font-weight: 600; color: var(--t-ink-strong);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  display: flex; align-items: center; gap: 0.5rem; line-height: 1.3;
}
.t-name-sub {
  font-size: 0.75rem; color: var(--t-ink-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.t-tr-flag {
  display: inline-grid; place-items: center;
  width: 1.125rem; height: 1.125rem; border-radius: 50%; flex: 0 0 1.125rem;
}
.t-tr-flag svg { width: 0.625rem; height: 0.625rem; }
.t-tr-flag-rose { background: var(--t-rose-100); color: var(--t-rose-900); }

.t-tr-cell { font-size: 0.8125rem; color: var(--t-ink); min-width: 0; }
.t-tr-attendance {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.8125rem; font-variant-numeric: tabular-nums;
}
.t-att-num { font-weight: 600; color: var(--t-ink-strong); min-width: 2.5rem; }
.t-att-bar-sm {
  height: 0.25rem; width: 3rem;
  background: var(--t-paper-sunken); border-radius: 999px;
  overflow: hidden; flex-shrink: 0;
}
.t-att-bar-sm-fill { height: 100%; background: var(--t-sage-500); border-radius: 999px; }
.t-att-bar-sm-fill.warn { background: var(--t-amber-500); }
.t-att-bar-sm-fill.bad  { background: var(--t-rose-500); }
.t-tr-actions { display: flex; gap: 0.125rem; position: relative; }
@media (max-width: 80rem) {
  .t-tr {
    grid-template-columns: 2.25rem minmax(14rem,2.5fr) minmax(10rem,1.4fr) auto;
  }
  .t-col-group, .t-col-curator { display: none; }
}
@media (max-width: 48rem) {
  .t-list-table-wrap { display: none; }
  .t-card-grid { grid-template-columns: 1fr; gap: 0.75rem; }
}
.t-checkbox {
  width: 1.25rem; height: 1.25rem; border-radius: 0.25rem;
  border: 2px solid var(--t-line-strong); background: var(--t-paper);
  appearance: none; cursor: pointer;
  display: grid; place-items: center;
  transition: background 150ms, border-color 150ms;
  flex: 0 0 1.25rem;
}
.t-checkbox:checked {
  background: var(--t-sage-900); border-color: var(--t-sage-900);
}
.t-checkbox:checked::after {
  content: '';
  width: 0.625rem; height: 0.625rem;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23F3F6EA' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E") center/contain no-repeat;
}
.t-checkbox:focus-visible {
  outline: 3px solid var(--t-sage-700); outline-offset: 2px;
}
.t-selection-toolbar {
  position: fixed; bottom: 1.5rem; left: 50%;
  transform: translateX(-50%) translateY(150%);
  z-index: 60;
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.5rem 0.5rem 1.25rem;
  background: var(--t-paper); color: var(--t-ink-strong);
  border: 1px solid var(--t-line-strong);
  border-radius: 999px; box-shadow: var(--t-shadow-lg);
  opacity: 0; pointer-events: none;
  transition: transform 220ms cubic-bezier(.2,.7,.2,1), opacity 180ms ease;
  max-width: calc(100vw - 2rem);
}
.t-selection-toolbar.visible {
  transform: translateX(-50%) translateY(0);
  opacity: 1; pointer-events: auto;
}
.t-selection-info {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; font-weight: 500; color: var(--t-ink-strong);
  padding-right: 0.75rem; border-right: 1px solid var(--t-line);
  white-space: nowrap;
}
.t-selection-badge {
  display: inline-grid; place-items: center;
  min-width: 1.5rem; height: 1.5rem; padding: 0 0.4375rem;
  border-radius: 999px; background: var(--t-sage-900); color: #F3F6EA;
  font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums;
}
.t-sel-action {
  display: inline-flex; align-items: center; gap: 0.5rem;
  min-height: var(--t-tap); padding: 0.5rem 0.75rem;
  border-radius: 999px; font-size: 0.8125rem; font-weight: 500;
  color: var(--t-ink-strong); background: transparent;
  border: 1px solid transparent; cursor: pointer; white-space: nowrap;
  transition: background 150ms;
}
.t-sel-action:hover { background: var(--t-paper-soft); }
.t-sel-action svg { width: 1rem; height: 1rem; }
.t-sel-danger { color: var(--t-rose-700); }
.t-sel-danger svg { color: var(--t-rose-700); }
.t-sel-danger:hover { background: var(--t-rose-50); }
.t-sel-close {
  width: var(--t-tap); height: var(--t-tap);
  display: grid; place-items: center; border-radius: 999px;
  color: var(--t-ink-muted); cursor: pointer;
  transition: background 150ms, color 150ms;
  background: none; border: none; flex: 0 0 var(--t-tap);
}
.t-sel-close:hover { background: var(--t-paper-soft); color: var(--t-ink-strong); }
.t-sel-close svg { width: 1.0625rem; height: 1.0625rem; }
@media (max-width: 64rem) {
  .t-page-title { font-size: 2rem; }
  .t-controls { grid-template-columns: 1fr; }
  .t-control-group { justify-content: flex-end; }
}
@media (max-width: 48rem) {
  .t-selection-toolbar {
    left: 0.75rem; right: 0.75rem; transform: translateY(150%);
    max-width: none; bottom: 5.5rem;
    flex-wrap: wrap; padding: 0.75rem;
    border-radius: var(--t-r-lg);
  }
  .t-selection-toolbar.visible { transform: translateY(0); }
  .t-selection-info { flex: 1; border-right: none; padding-right: 0; }
  .t-page-header { flex-direction: column; align-items: stretch; }
  .t-page-title { font-size: 1.75rem; }
}
@media (max-width: 30rem) {
  .t-filter-row { gap: 0.375rem; }
  .t-chip { font-size: 0.75rem; padding: 0.5rem 0.75rem; }
}
.loading-state, .error-state, .empty-state {
  text-align: center; padding: 2rem; color: var(--text-secondary);
}
.dropdown-divider { margin: 0.25rem 0; border: none; border-top: 1px solid var(--border); }
.spinner {
  width: 40px; height: 40px;
  border: 4px solid rgba(118,183,41,.2); border-top-color: #4b5675;
  border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto 1rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.toolbar { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.search {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-md); padding: 0.3rem 0.7rem;
  flex: 1; max-width: 300px;
}
.search input { border: none; background: none; outline: none; width: 100%; }
.filter-group { display: flex; align-items: center; gap: 0.5rem; }
.filter-group label { font-size: .85rem; font-weight: 500; color: var(--text-secondary); }
.styled-select {
  padding: .5rem .75rem; border: 1px solid var(--border);
  border-radius: var(--radius-md); background: var(--bg-surface);
  color: var(--text-primary); font-size: .9rem; cursor: pointer;
}
.items-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
@media (max-width: 900px) { .items-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 640px) { .items-grid { grid-template-columns: 1fr; } }
.item-card {
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 1rem;
  position: relative; cursor: pointer; transition: all .2s;
  display: flex; flex-direction: column; gap: .75rem;
}
.item-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
.actions-dropdown { position: absolute; top: .5rem; right: .5rem; z-index: 3; }
.dropdown-trigger {
  background: none; border: none; font-size: 1.2rem; cursor: pointer;
  padding: .2rem .4rem; border-radius: var(--radius-md); line-height: 1;
}
.dropdown-trigger:hover { background: var(--bg-surface-sunken); }
.dropdown-menu {
  position: absolute; top: 100%; right: 0;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-md); box-shadow: var(--shadow-md);
  display: flex; flex-direction: column; min-width: 160px; z-index: 10;
}
.dropdown-menu button {
  background: none; border: none; padding: .5rem 1rem;
  text-align: left; cursor: pointer; font-size: .8rem;
}
.dropdown-menu button:hover { background: var(--bg-surface-sunken); }
.card-left { display: flex; gap: .75rem; align-items: center; }
.avatar-wrapper { position: relative; display: inline-block; }
.avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
.card-info { display: flex; flex-direction: column; gap: .2rem; }
.name { font-weight: 700; font-size: 1rem; margin: 0; }
.sub { font-size: .75rem; color: var(--text-secondary); }
.tags { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .2rem; }
.badge-blue, .badge-gray {
  font-size: .7rem; padding: .2rem .6rem; border-radius: 40px;
  font-weight: 500; display: inline-block; white-space: nowrap;
}
.badge-blue { background: var(--accent-soft); color: var(--accent-text); }
.badge-gray { background: var(--bg-surface-sunken); color: var(--text-secondary); }
.card-right {
  display: flex; flex-direction: row; justify-content: flex-end;
  gap: .75rem; margin-top: .25rem;
  border-top: 1px solid var(--border-light); padding-top: .75rem;
}
.widget-status, .widget-attendance {
  display: flex; align-items: center; gap: .3rem;
  background: var(--bg-surface-sunken); border-radius: 40px; padding: .2rem .6rem;
}
.widget-status svg, .widget-attendance svg { width: 20px; height: 20px; stroke: var(--accent); }
.widget-value { font-size: .75rem; font-weight: 600; color: var(--text-primary); }
.aggression-badge {
  position: absolute; bottom: -4px; right: -4px;
  width: 20px; height: 20px; border-radius: 50%;
  color: white; font-size: .7rem; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid white;
}
.aggression-tooltip {
  visibility: hidden; opacity: 0;
  background-color: #2c2c2c; color: #fff;
  text-align: center; padding: 4px 8px;
  border-radius: 6px; position: absolute;
  z-index: 10; bottom: 125%; left: 50%;
  transform: translateX(-50%); white-space: nowrap;
  font-size: 12px; font-weight: normal;
  transition: opacity .15s ease, visibility .15s ease;
  pointer-events: none;
}
.aggression-tooltip::after {
  content: ''; position: absolute; top: 100%; left: 50%;
  margin-left: -5px; border-width: 5px; border-style: solid;
  border-color: #2c2c2c transparent transparent transparent;
}
.aggression-badge:hover .aggression-tooltip { visibility: visible; opacity: 1; }
.recipient-form { display: flex; flex-direction: column; gap: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem 1.5rem; }
.full-width { grid-column: span 2; }
.checkbox-group { display: flex; align-items: center; }
.form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .full-width { grid-column: span 1; }
}
.form-group { margin-bottom: .5rem; }
.form-group label { display: block; margin-bottom: .25rem; font-size: .8rem; font-weight: 600; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: .5rem;
  border: 1px solid var(--border); border-radius: var(--radius-md);
  background: var(--bg-surface); color: var(--text-primary);
}
.btn-primary {
  background: #4b5675; color: white; border: none;
  padding: .5rem 1rem; border-radius: var(--radius-md); cursor: pointer;
}
.btn-secondary {
  background: var(--bg-surface); border: 1px solid var(--border);
  padding: .5rem 1rem; border-radius: var(--radius-md); cursor: pointer;
}
</style>
