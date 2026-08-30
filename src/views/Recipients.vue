<template>
  <div>

    <template v-if="authStore.isTeacher || authStore.isAdmin || authStore.isEmployee">
      <div class="erp-r-teacher" @click="closeDropdown">

        <div class="t-page-header">
          <div>
            <h1 class="t-page-title">Реабилитанты</h1>
            <p class="t-page-sub" v-if="activeTab !== 'drafts'">
              Всего <strong>{{ totalCount || recipients.length }}</strong>
              <template v-if="todayList.length"> · сегодня занимаются <strong>{{ todayList.length }}</strong></template>
              <template v-if="tomorrowList.length">, завтра — <strong>{{ tomorrowList.length }}</strong></template>
              <template v-if="attentionList.length"> · требуют внимания — <strong>{{ attentionList.length }}</strong></template>
            </p>
          </div>
          <div class="t-page-actions">
            <button class="t-btn t-btn-primary" @click.stop="openAddModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
              Добавить реабилитанта
            </button>
          </div>
        </div>

        <div v-if="canSeeDrafts" class="t-tabs" role="tablist" aria-label="Раздел">
          <button
            class="t-tab" :class="{ active: activeTab === 'active' }"
            role="tab" :aria-selected="activeTab === 'active'"
            @click.stop="setTab('active')"
          >
            Активные
            <span class="t-tab-count">{{ totalCount || recipients.length }}</span>
          </button>
          <button
            class="t-tab" :class="{ active: activeTab === 'drafts' }"
            role="tab" :aria-selected="activeTab === 'drafts'"
            @click.stop="setTab('drafts')"
          >
            Черновики
            <span v-if="drafts.length" class="t-tab-count">{{ drafts.length }}</span>
          </button>
        </div>

        <template v-if="activeTab !== 'drafts'">
        <div class="t-controls">
          <div class="t-search-wrap">
            <label for="t-search" class="sr-only">Поиск реабилитанта</label>
            <div class="t-search-input" :class="{ 'focused': searchFocused }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input
                ref="searchInputRef"
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
            <div class="t-sort-wrap" @click.stop>
              <button
                class="t-btn t-btn-secondary t-sort-trigger"
                aria-haspopup="menu"
                :aria-expanded="sortMenuOpen"
                @click="toggleSortMenu"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
                <span class="t-sort-label">{{ sortLabel }}</span>
                <svg class="t-sort-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <div v-if="sortMenuOpen" class="t-sort-menu" role="menu">
                <button
                  v-for="opt in sortOptions"
                  :key="opt.value"
                  class="t-sort-item"
                  :class="{ active: sortMode === opt.value }"
                  role="menuitemradio"
                  :aria-checked="sortMode === opt.value"
                  @click="selectSort(opt.value)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" v-html="opt.icon"></svg>
                  <span>{{ opt.label }}</span>
                  <span v-if="opt.hint" class="t-sort-hint">{{ opt.hint }}</span>
                  <svg v-if="sortMode === opt.value" class="t-sort-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>
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
            Все <span class="t-chip-count">{{ totalCount || recipients.length }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'today' }" :aria-pressed="activeFilter === 'today'" @click="setFilter('today')">
            Сегодня <span class="t-chip-count">{{ todayList.length }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'tomorrow' }" :aria-pressed="activeFilter === 'tomorrow'" @click="setFilter('tomorrow')">
            Завтра <span class="t-chip-count">{{ tomorrowList.length }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'mygroup' }" :aria-pressed="activeFilter === 'mygroup'" @click="setFilter('mygroup')">
            Моя группа <span class="t-chip-count">{{ myGroupCount }}</span>
          </button>
          <button class="t-chip" :class="{ active: activeFilter === 'attention' }" :aria-pressed="activeFilter === 'attention'" @click="setFilter('attention')">
            Требуют внимания <span class="t-chip-count">{{ attentionList.length }}</span>
          </button>

          <span class="t-filter-divider" aria-hidden="true"></span>

          <div class="t-chip-filter-wrap" @click.stop>
            <button class="t-chip-filter" :class="{ active: filterGroupId != null }" @click="toggleFilterMenu('group')">
              <span>{{ filterGroupId != null ? groupLabel : 'Группа' }}</span>
              <svg v-if="filterGroupId == null" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              <span v-else class="t-chip-filter-clear" role="button" tabindex="0" aria-label="Сбросить фильтр по группе" @click.stop="clearFilter('group')" @keydown.enter.prevent="clearFilter('group')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </span>
            </button>
            <div v-if="openFilterMenu === 'group'" class="t-filter-menu" role="menu">
              <button v-if="!groupOptions.length" class="t-filter-menu-empty" disabled>Нет групп</button>
              <button
                v-for="g in groupOptions"
                :key="g.id"
                class="t-filter-menu-item"
                :class="{ active: filterGroupId === g.id }"
                role="menuitemradio"
                :aria-checked="filterGroupId === g.id"
                @click="selectGroupFilter(g.id)"
              >{{ g.name }}</button>
            </div>
          </div>

          <div class="t-chip-filter-wrap" @click.stop>
            <button class="t-chip-filter" :class="{ active: !!filterDiagnosisVal }" @click="toggleFilterMenu('diagnosis')">
              <span>{{ filterDiagnosisVal || 'Диагноз' }}</span>
              <svg v-if="!filterDiagnosisVal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              <span v-else class="t-chip-filter-clear" role="button" tabindex="0" aria-label="Сбросить фильтр по диагнозу" @click.stop="clearFilter('diagnosis')" @keydown.enter.prevent="clearFilter('diagnosis')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </span>
            </button>
            <div v-if="openFilterMenu === 'diagnosis'" class="t-filter-menu" role="menu">
              <button v-if="!diagnosisOptions.length" class="t-filter-menu-empty" disabled>Нет данных</button>
              <button
                v-for="d in diagnosisOptions"
                :key="d"
                class="t-filter-menu-item"
                :class="{ active: filterDiagnosisVal === d }"
                role="menuitemradio"
                :aria-checked="filterDiagnosisVal === d"
                @click="selectDiagnosisFilter(d)"
              >{{ d }}</button>
            </div>
          </div>

          <div class="t-chip-filter-wrap" @click.stop>
            <button class="t-chip-filter" :class="{ active: !!filterCuratorName }" @click="toggleFilterMenu('curator')">
              <span>{{ filterCuratorName || 'Куратор' }}</span>
              <svg v-if="!filterCuratorName" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
              <span v-else class="t-chip-filter-clear" role="button" tabindex="0" aria-label="Сбросить фильтр по куратору" @click.stop="clearFilter('curator')" @keydown.enter.prevent="clearFilter('curator')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </span>
            </button>
            <div v-if="openFilterMenu === 'curator'" class="t-filter-menu" role="menu">
              <button v-if="!curatorOptions.length" class="t-filter-menu-empty" disabled>Нет данных</button>
              <button
                v-for="c in curatorOptions"
                :key="c"
                class="t-filter-menu-item"
                :class="{ active: filterCuratorName === c }"
                role="menuitemradio"
                :aria-checked="filterCuratorName === c"
                @click="selectCuratorFilter(c)"
              >{{ c }}</button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="t-loading-state">
          <div class="t-spinner"></div>
          <p>Загрузка…</p>
        </div>
        <div v-else-if="error" class="t-error-state">
          <p>{{ error }}</p>
          <button class="t-btn t-btn-primary" @click="loadRecipients">Повторить</button>
        </div>
        <div v-else-if="visibleCount === 0" class="t-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p>Нет реабилитантов{{ activeFilter !== 'all' ? ' в выбранной категории' : '' }}.</p>
          <button v-if="activeFilter !== 'all'" class="t-btn t-btn-secondary" @click="setFilter('all')">Показать всех</button>
        </div>

        <div v-else-if="viewMode === 'grid'" class="t-groups">
          <section v-for="section in sections" :key="section.key" class="t-group">
            <div v-if="section.title" class="t-group-header">
              <h2 class="t-group-title">{{ section.title }}</h2>
              <span class="t-group-count">{{ section.items.length }}</span>
              <span v-if="section.subtitle" class="t-group-sub">{{ section.subtitle }}</span>
              <span class="t-group-line" aria-hidden="true"></span>
            </div>

            <div class="t-card-grid" role="list" :aria-label="section.title || 'Список реабилитантов'">
              <article
                v-for="r in section.items"
                :key="r.id"
                class="t-rcard"
                :class="[
                  stripeStatus(r) ? `stripe-${stripeStatus(r)}` : '',
                  attendanceClass(r),
                  { 'archived-card': r.status === 'archived', 'selected': selectedIds.includes(r.id) }
                ]"
                role="listitem"
                :aria-labelledby="`rc-name-${r.id}`"
              >

                <input
                  v-if="canManageRecipients"
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
                  <div
                    class="t-rcard-photo"
                    :class="{ 'has-zoom': hasPhoto(r) }"
                    @click.stop="hasPhoto(r) ? toggleZoom(r.id) : openDetails(r.id)"
                    :title="hasPhoto(r) ? 'Показать фото' : ''"
                  >
                    <img
                      v-if="hasPhoto(r)"
                      :src="r.photo"
                      :alt="fullName(r)"
                      @error="onPhotoError(r)"
                    />
                    <div v-else class="t-rcard-photo-fallback" :class="avatarClass(r)" aria-hidden="true">{{ initials(r) }}</div>
                  </div>

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
                      <span v-if="r.status && r.status !== 'draft'" class="t-tag t-tag-neutral">{{ statusLabel(r.status) }}</span>
                      <span v-if="recipientFlags(r).length && activeDropdown !== r.id" class="t-rcard-flags">
                        <span
                          v-for="flag in recipientFlags(r)"
                          :key="flag.kind"
                          class="t-flag"
                          :class="[`t-flag-${flag.kind}`, { 'is-tapped': isFlagTipOpen(r, flag.kind) }]"
                          tabindex="0"
                          role="button"
                          :aria-label="flag.text ? `${flag.label}. ${flag.text}` : flag.label"
                          @click.stop="toggleFlagTip(r, flag.kind)"
                          @keydown.enter.prevent="toggleFlagTip(r, flag.kind)"
                        >
                          <svg v-if="flag.kind === 'rose'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                            <path d="M12 9v4M12 17h.01"/>
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                          </svg>
                          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <path d="M14 2v6h6M12 12v4M12 18h.01"/>
                          </svg>
                          <span class="t-flag-tooltip" role="tooltip">
                            <strong>{{ flag.label }}</strong>
                            <template v-if="flag.text"><br>{{ flag.text }}</template>
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="t-rcard-footer">
                  <div class="t-attendance-block">
                    <div>
                      <div class="t-att-label">Ближайшее занятие</div>
                      <div class="t-att-value t-next-class" :class="{ soon: r.attendsToday }">{{ nextClassLabel(r) }}</div>
                    </div>
                  </div>

                  <div class="t-rcard-actions" @click.stop style="position:relative;z-index:6">
                    <button v-if="canManageRecipients" class="t-action-btn" :aria-label="`Редактировать ${fullName(r)}`" @click="editRecipient(r)">
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
                        <button v-if="canManageRecipients" class="t-menu-item" @click="editRecipient(r); closeDropdown()">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Редактировать
                        </button>
                        <button v-if="canAssignDiagnostic" class="t-menu-item" @click="openAssignDiagnostic(r); closeDropdown()">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <path d="M16 2v4M8 2v4M3 10h18"/>
                            <path d="M12 14v4M10 16h4"/>
                          </svg>
                          Назначить диагностику
                        </button>
                        <div v-if="canManageRecipients" class="t-menu-divider"></div>
                        <button v-if="canManageRecipients" class="t-menu-item t-menu-danger" @click="deleteRecipient(r.id); closeDropdown()">
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

                <div
                  v-if="authStore.isTeacher"
                  class="t-att-mark"
                  role="group"
                  aria-label="Отметка посещения"
                  @click.stop
                  style="position:relative;z-index:6"
                >
                  <button
                    type="button"
                    class="t-att-btn is-present"
                    :class="{ active: attendanceOf(r) === 'present' }"
                    :aria-pressed="attendanceOf(r) === 'present'"
                    :disabled="attendanceSaving[r.id]"
                    @click.stop="setAttendance(r, 'present')"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Был</span>
                  </button>
                  <button
                    type="button"
                    class="t-att-btn is-absent"
                    :class="{ active: attendanceOf(r) === 'absent' }"
                    :aria-pressed="attendanceOf(r) === 'absent'"
                    :disabled="attendanceSaving[r.id]"
                    @click.stop="setAttendance(r, 'absent')"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    <span>Частично</span>
                  </button>
                  <button
                    type="button"
                    class="t-att-btn is-left"
                    :class="{ active: attendanceOf(r) === 'left' }"
                    :aria-pressed="attendanceOf(r) === 'left'"
                    :disabled="attendanceSaving[r.id]"
                    @click.stop="setAttendance(r, 'left')"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <span>Не был</span>
                  </button>
                </div>

                <div
                  v-if="hasPhoto(r) && zoomPhotoId === r.id && activeDropdown !== r.id"
                  class="t-rcard-zoom"
                  :style="{ backgroundImage: `url(${r.photo})` }"
                  @click.stop="zoomPhotoId = null"
                  title="Свернуть фото"
                  role="button"
                ></div>
              </article>
            </div>
          </section>
        </div>

        <div v-else class="t-list-table-wrap">
          <div class="t-list-table" role="table" aria-label="Список реабилитантов">

            <div class="t-tr t-thead" role="row">
              <input
                v-if="canManageRecipients"
                type="checkbox"
                class="t-checkbox"
                :checked="allSelected"
                :indeterminate.prop="someSelected && !allSelected"
                @change="toggleSelectAll"
                aria-label="Выбрать всех"
              />
              <span v-else aria-hidden="true"></span>
              <div role="columnheader">Реабилитант</div>
              <div class="t-col-group" role="columnheader">Группа</div>
              <div class="t-col-curator" role="columnheader">Куратор</div>
              <div role="columnheader">Занятие</div>
              <div role="columnheader"><span class="sr-only">Действия</span></div>
            </div>

            <div
              v-for="r in visibleRecipients"
              :key="r.id"
              class="t-tr"
              :class="[
                stripeStatus(r) ? `stripe-${stripeStatus(r)}` : '',
                { selected: selectedIds.includes(r.id) }
              ]"
              role="row"
            >
              <input
                v-if="canManageRecipients"
                type="checkbox"
                class="t-checkbox"
                :checked="selectedIds.includes(r.id)"
                @change="toggleSelect(r.id)"
                @click.stop
                :aria-label="`Выбрать ${fullName(r)}`"
              />
              <span v-else aria-hidden="true"></span>

              <div class="t-name-cell" role="cell" @click="openDetails(r.id)" style="cursor:pointer">
                <div class="t-mini-avatar" :class="avatarClass(r)" aria-hidden="true">{{ initials(r) }}</div>
                <div class="t-name-main">
                  <div class="t-name-text">
                    {{ fullName(r) }}
                    <span
                      v-for="flag in recipientFlags(r)"
                      :key="flag.kind"
                      class="t-tr-flag"
                      :class="`t-tr-flag-${flag.kind}`"
                      :title="flag.text ? `${flag.label} — ${flag.text}` : flag.label"
                    >
                      <svg v-if="flag.kind === 'rose'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true">
                        <path d="M12 9v4M12 17h.01"/>
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                    </span>
                  </div>
                  <div class="t-name-sub">{{ r.diagnosis || '—' }}<template v-if="recipientAge(r) != null"> · {{ recipientAge(r) }} лет</template></div>
                </div>
              </div>

              <div class="t-tr-cell t-col-group" role="cell">{{ r.group?.groupName || '—' }}</div>
              <div class="t-tr-cell t-col-curator" role="cell">{{ curatorName(r) || '—' }}</div>

              <div class="t-tr-attendance" role="cell">
                <span class="t-att-num t-next-class" :class="{ soon: r.attendsToday }">{{ nextClassLabel(r) }}</span>
              </div>

              <div class="t-tr-actions" role="cell" @click.stop>
                <button class="t-action-btn" @click="openDetails(r.id)" title="Открыть">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button v-if="canManageRecipients" class="t-action-btn" @click="editRecipient(r)" title="Редактировать">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <div v-if="canManageRecipients || canAssignDiagnostic" style="position:relative">
                  <button class="t-action-btn" @click.stop="toggleDropdown(r.id)" title="Ещё">
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>
                  <div v-if="activeDropdown === r.id" class="t-row-menu t-row-menu-list" @click.stop>
                    <button class="t-menu-item" @click="openDetails(r.id); closeDropdown()">Карточка</button>
                    <button v-if="canManageRecipients" class="t-menu-item" @click="editRecipient(r); closeDropdown()">Редактировать</button>
                    <button v-if="canAssignDiagnostic" class="t-menu-item" @click="openAssignDiagnostic(r); closeDropdown()">Назначить диагностику</button>
                    <template v-if="canManageRecipients">
                      <div class="t-menu-divider"></div>
                      <button class="t-menu-item t-menu-danger" @click="deleteRecipient(r.id); closeDropdown()">Удалить</button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="canManageRecipients" class="t-selection-toolbar" :class="{ visible: selectedIds.length > 0 }" aria-live="polite">
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

        <RecipientsPager
          :page="page"
          :total-pages="totalPages"
          :limit="limit"
          :total="totalCount"
          @update:page="changePage"
          @update:limit="changeLimit"
        />
        </template>

        <section v-else class="t-drafts" aria-label="Черновики карточек реабилитантов">
          <div class="t-drafts-bar">
            <div class="t-search-wrap">
              <label for="t-draft-search" class="sr-only">Поиск по черновикам</label>
              <div class="t-search-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input
                  ref="searchInputRef"
                  id="t-draft-search"
                  type="search"
                  v-model="draftSearch"
                  placeholder="Поиск по имени или представителю…"
                  autocomplete="off"
                  @input="onDraftSearchInput"
                  @keydown.escape="clearDraftSearch"
                />
                <kbd aria-hidden="true">/</kbd>
              </div>
            </div>
          </div>

          <div v-if="draftsLoading" class="t-loading-state">
            <div class="t-spinner"></div>
            <p>Загрузка…</p>
          </div>
          <div v-else-if="draftsError" class="t-error-state">
            <p>{{ draftsError }}</p>
            <button class="t-btn t-btn-primary" @click="loadDrafts">Повторить</button>
          </div>
          <div v-else-if="!drafts.length" class="t-empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>{{ draftSearch ? 'По этому запросу черновиков нет.' : 'Незаконченных карточек нет — все начатые регистрации доведены до конца.' }}</p>
            <button v-if="draftSearch" class="t-btn t-btn-secondary" @click="clearDraftSearch">Сбросить поиск</button>
          </div>

          <div v-else class="t-draft-list" role="list">
            <article v-for="d in drafts" :key="d.id" class="t-draft" role="listitem">

              <div class="t-draft-top">
                <div class="t-draft-id">
                  <div class="t-draft-name">{{ draftTitle(d) }}</div>
                  <div class="t-draft-meta">
                    <template v-if="d.birthDate">{{ humanDate(d.birthDate) }} г. р.</template>
                    <template v-if="d.birthDate && d.repName"> · </template>
                    <template v-if="d.repName">представитель — {{ d.repName }}</template>
                    <template v-if="!d.birthDate && !d.repName">Ни имени, ни представителя пока не введено</template>
                  </div>
                </div>
                <div class="t-draft-pct" :class="draftPctClass(d)">
                  <strong>{{ d.summary ? d.summary.pct : 0 }}%</strong>
                  <span>{{ d.summary ? d.summary.done : 0 }} из {{ d.summary ? d.summary.total : 0 }} полей</span>
                </div>
              </div>

              <div class="t-draft-bar" role="img" :aria-label="`Заполнено ${d.summary ? d.summary.pct : 0} процентов`">
                <span :class="draftPctClass(d)" :style="{ width: (d.summary ? d.summary.pct : 0) + '%' }"></span>
              </div>

              <div v-if="d.summary && d.summary.steps.length" class="t-draft-missing">
                <div v-for="s in d.summary.steps" :key="s.step" class="t-draft-step">
                  <span class="t-draft-step-name">{{ s.label }}</span>
                  <span class="t-draft-step-fields">{{ missingNames(s) }}</span>
                </div>
              </div>
              <div v-else-if="d.summary && d.summary.complete" class="t-draft-done">
                Все поля заполнены — осталось приложить документы и отправить карточку в базу.
              </div>

              <div class="t-draft-foot">
                <div class="t-draft-facts">
                  <span class="t-draft-fact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {{ d.fileCount }} {{ plural(d.fileCount, 'скан', 'скана', 'сканов') }}
                  </span>
                  <span v-if="d.createdByName" class="t-draft-fact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    начал(а) {{ d.createdByName }}
                  </span>
                  <span class="t-draft-fact">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {{ touchedAgo(d) }}
                  </span>
                </div>
                <div class="t-draft-actions">
                  <button class="t-btn t-btn-secondary" @click.stop="removeDraft(d)">Удалить</button>
                  <button class="t-btn t-btn-primary" @click.stop="continueDraft(d)">Продолжить</button>
                </div>
              </div>

            </article>
          </div>
        </section>

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
              <div class="form-group form-group-photo">
                <label>Фото реабилитанта</label>
                <div class="photo-field">
                  <div class="photo-preview">
                    <img v-if="form.photo && !photoPreviewFail" :src="form.photo" alt="Превью фото" @error="photoPreviewFail = true" />
                    <span v-else class="photo-preview-empty">Нет фото</span>
                  </div>
                  <div class="photo-field-body">
                    <input type="text" v-model="form.photo" class="photo-url-input" placeholder="Ссылка на фото или загрузите файл" />
                    <div class="photo-field-buttons">
                      <label class="btn-upload" :class="{ 'is-busy': photoUploading }">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                        {{ photoUploading ? 'Обработка…' : 'Загрузить с ПК' }}
                        <input type="file" accept="image/*" @change="onPhotoFile" hidden />
                      </label>
                      <button v-if="form.photo" type="button" class="btn-clear-photo" @click="form.photo = ''">Убрать</button>
                    </div>
                    <span v-if="photoFileError" class="photo-field-error">{{ photoFileError }}</span>
                    <span v-else class="photo-field-hint">JPG или PNG, до 15 МБ. Фото сразу появится на карточке.</span>
                  </div>
                </div>
              </div>
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
              <div class="sub">Куратор: {{ r.group?.curatorUser?.fullName || '—' }}</div>
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

      <RecipientsPager :page="page" :total-pages="totalPages" :limit="limit" :total="totalCount" @update:page="changePage" @update:limit="changeLimit" />

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
            <div class="form-group form-group-photo">
              <label>Фото реабилитанта</label>
              <div class="photo-field">
                <div class="photo-preview">
                  <img v-if="form.photo && !photoPreviewFail" :src="form.photo" alt="Превью фото" @error="photoPreviewFail = true" />
                  <span v-else class="photo-preview-empty">Нет фото</span>
                </div>
                <div class="photo-field-body">
                  <input type="text" v-model="form.photo" class="photo-url-input" placeholder="Ссылка на фото или загрузите файл" />
                  <div class="photo-field-buttons">
                    <label class="btn-upload" :class="{ 'is-busy': photoUploading }">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      {{ photoUploading ? 'Обработка…' : 'Загрузить с ПК' }}
                      <input type="file" accept="image/*" @change="onPhotoFile" hidden />
                    </label>
                    <button v-if="form.photo" type="button" class="btn-clear-photo" @click="form.photo = ''">Убрать</button>
                  </div>
                  <span v-if="photoFileError" class="photo-field-error">{{ photoFileError }}</span>
                  <span v-else class="photo-field-hint">JPG или PNG, до 15 МБ. Фото сразу появится на карточке.</span>
                </div>
              </div>
            </div>
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
      :draft-id="openDraftId"
      @close="closeWizard"
      @saved="onRecipientSaved"
    />

    <AssignDiagnosticModal
      v-if="assignTarget"
      :recipient-id="assignTarget.id"
      :recipient-name="assignTarget.name"
      @close="closeAssignDiagnostic"
      @assigned="onDiagnosticAssigned"
    />

    <transition name="added-pop">
      <div v-if="showAddedPopup" class="added-pop" role="dialog" aria-label="Реабилитант добавлен">
        <button class="added-pop-close" @click="showAddedPopup = false" aria-label="Закрыть">×</button>
        <div class="added-pop-head">
          <span class="added-pop-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </span>
          <div>
            <p class="added-pop-title">Реабилитант добавлен</p>
            <p class="added-pop-sub">Что дальше?</p>
          </div>
        </div>
        <div class="added-pop-actions">
          <button class="added-pop-btn added-pop-btn-primary" @click="goToAddedDetails">Подробности карточки</button>
          <button class="added-pop-btn" @click="goToAddedAssign">Назначение диагностики</button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePageStore } from '../stores/page';
import api from '../api';
import { fullName, recipientAge, initials, statusLabel } from '../utils/recipient';
import { notifySaved } from '../utils/toast';
import Modal from '../components/Modal.vue';
import RecipientsPager from '../components/RecipientsPager.vue';
import AddRecipientWizard from '../components/AddRecipientWizard.vue';
import AssignDiagnosticModal from '../components/AssignDiagnosticModal.vue';

const authStore = useAuthStore();
const pageStore = usePageStore();

const canManageRecipients = computed(() => authStore.isAdmin || authStore.isTeacher);

const canAssignDiagnostic = computed(() => authStore.isAdmin || authStore.isEmployee);

const canSeeDrafts = computed(() => authStore.isAdmin || authStore.isEmployee);

const assignTarget = ref(null);
const openAssignDiagnostic = (r) => {
  assignTarget.value = { id: r.id, name: fullName(r) };
};
const closeAssignDiagnostic = () => { assignTarget.value = null; };
const onDiagnosticAssigned = () => { loadRecipients(); };

const recipients   = ref([]);
const groupsList   = ref([]);
const search       = ref('');
const filterDiagnosis = ref('all');
const page         = ref(1);
const limit        = ref(12);
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
const showAddedPopup = ref(false);
const addedRecipientId = ref(null);
const addedRecipientName = ref('');
const defaultPhoto = 'https://via.placeholder.com/100';
let searchTimeout  = null;
const activeDropdown = ref(null);

const viewMode    = ref('grid');
const activeFilter = ref('all');
const selectedIds  = ref([]);
const searchFocused = ref(false);
const photoError  = ref({});
const openTip     = ref(null);
const zoomPhotoId = ref(null);
const toggleZoom = (id) => { zoomPhotoId.value = zoomPhotoId.value === id ? null : id; };
const searchInputRef = ref(null);

const photoUploading   = ref(false);
const photoFileError   = ref('');
const photoPreviewFail = ref(false);
watch(() => form.value.photo, () => { photoPreviewFail.value = false; });

const resizeImage = (file, maxSize, quality) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('bad image'));
    img.src = reader.result;
  };
  reader.onerror = () => reject(new Error('read error'));
  reader.readAsDataURL(file);
});

const onPhotoFile = async (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  photoFileError.value = '';
  if (!file.type.startsWith('image/')) { photoFileError.value = 'Выберите файл изображения (JPG, PNG…)'; return; }
  if (file.size > 15 * 1024 * 1024)    { photoFileError.value = 'Файл слишком большой (максимум 15 МБ)'; return; }
  photoUploading.value = true;
  try {
    form.value.photo = await resizeImage(file, 512, 0.85);
  } catch (err) {
    console.error(err);
    photoFileError.value = 'Не удалось обработать изображение';
  } finally {
    photoUploading.value = false;
  }
};

const sortMode        = ref('schedule');
const sortMenuOpen    = ref(false);
const openFilterMenu  = ref(null);
const filterGroupId   = ref(null);
const filterDiagnosisVal = ref(null);
const filterCuratorName  = ref(null);

const sortOptions = [
  { value: 'schedule',  label: 'По расписанию', hint: 'сегодня и завтра первыми', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' },
  { value: 'name-asc',  label: 'По имени — А–Я', icon: '<path d="M11 5h10M11 9h7M11 13h4M3 17l3-3 3 3M6 14v6"/>' },
  { value: 'name-desc', label: 'По имени — Я–А', icon: '<path d="M11 5h4M11 9h7M11 13h10M3 7l3 3 3-3M6 4v6"/>' },
  { value: 'recent',    label: 'Сначала новые', icon: '<path d="M12 8v4l3 3M3 12a9 9 0 1018 0 9 9 0 00-18 0z"/>' },
  { value: 'group',     label: 'По группе', icon: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>' }
];
const sortLabel = computed(() => (sortOptions.find(o => o.value === sortMode.value) || sortOptions[0]).label);

const pad = (n) => String(n).padStart(2, '0');
const isoOf = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
const _today = new Date(); _today.setHours(0, 0, 0, 0);
const _tomorrow = new Date(_today); _tomorrow.setDate(_today.getDate() + 1);
const todayIso = isoOf(_today);
const tomorrowIso = isoOf(_tomorrow);

const fmtRuDate = (iso) => {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d));
};
const pluralRecipients = (n) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return 'реабилитантов';
  if (b > 1 && b < 5)   return 'реабилитанта';
  if (b === 1)          return 'реабилитант';
  return 'реабилитантов';
};

const curatorNameOf = (r) => r.group?.curatorUser?.fullName || '';

const myGroupIds = computed(() => {
  const u = authStore.user;
  if (!u) return [];
  const parts = [u.lastName, u.firstName].filter(Boolean).map(s => String(s).toLowerCase());
  if (!parts.length) return [];
  return groupsList.value
    .filter(g => {
      const cur = String(g.curator || '').toLowerCase();
      return cur && parts.every(p => cur.includes(p));
    })
    .map(g => g.id);
});
const myGroupCount = computed(() => recipients.value.filter(r => myGroupIds.value.includes(r.groupId)).length);

const attentionList = computed(() => recipients.value.filter(r => r.attentionNote || r.docExpiring));
const todayList     = computed(() => recipients.value.filter(r => r.attendsToday));
const tomorrowList  = computed(() => recipients.value.filter(r => r.attendsTomorrow));

const groupOptions = computed(() => groupsList.value.map(g => ({ id: g.id, name: g.name })));
const diagnosisOptions = computed(() =>
  [...new Set(recipients.value.map(r => (r.diagnosis || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ru'))
);
const curatorOptions = computed(() =>
  [...new Set(recipients.value.map(curatorNameOf).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ru'))
);
const groupLabel = computed(() => {
  const g = groupsList.value.find(g => g.id === filterGroupId.value);
  return g ? g.name : 'Группа';
});

const baseFiltered = computed(() => {
  let list = recipients.value;
  if (filterGroupId.value != null)   list = list.filter(r => r.groupId === filterGroupId.value);
  if (filterDiagnosisVal.value)      list = list.filter(r => (r.diagnosis || '').trim() === filterDiagnosisVal.value);
  if (filterCuratorName.value)       list = list.filter(r => curatorNameOf(r) === filterCuratorName.value);
  switch (activeFilter.value) {
    case 'today':     list = list.filter(r => r.attendsToday); break;
    case 'tomorrow':  list = list.filter(r => r.attendsTomorrow); break;
    case 'mygroup':   list = list.filter(r => myGroupIds.value.includes(r.groupId)); break;
    case 'attention': list = list.filter(r => r.attentionNote || r.docExpiring); break;
  }
  return list;
});

const byName = (a, b) => fullName(a).localeCompare(fullName(b), 'ru');

const sections = computed(() => {
  const list = baseFiltered.value;
  const mode = sortMode.value;

  if (mode === 'name-asc')  return [{ key: 'flat', title: null, subtitle: '', items: [...list].sort(byName) }];
  if (mode === 'name-desc') return [{ key: 'flat', title: null, subtitle: '', items: [...list].sort((a, b) => byName(b, a)) }];
  if (mode === 'recent')    return [{ key: 'flat', title: null, subtitle: '', items: [...list].sort((a, b) => b.id - a.id) }];
  if (mode === 'group') {
    const map = new Map(); const noGroup = [];
    for (const r of [...list].sort(byName)) {
      const name = r.group?.groupName;
      if (name) { if (!map.has(name)) map.set(name, []); map.get(name).push(r); }
      else noGroup.push(r);
    }
    const s = [...map.keys()].sort((a, b) => a.localeCompare(b, 'ru'))
      .map(name => ({ key: `g-${name}`, title: name, subtitle: `${map.get(name).length} ${pluralRecipients(map.get(name).length)}`, items: map.get(name) }));
    if (noGroup.length) s.push({ key: 'nogroup', title: 'Без группы', subtitle: '', items: noGroup });
    return s;
  }

  const f = activeFilter.value;
  if (f === 'today')     return list.length ? [{ key: 'today',     title: 'Сегодня', subtitle: fmtRuDate(todayIso), items: [...list].sort(byName) }] : [];
  if (f === 'tomorrow')  return list.length ? [{ key: 'tomorrow',  title: 'Завтра',  subtitle: fmtRuDate(tomorrowIso), items: [...list].sort(byName) }] : [];
  if (f === 'attention') return list.length ? [{ key: 'attention', title: 'Требуют внимания', subtitle: '', items: [...list].sort(byName) }] : [];
  if (f === 'mygroup')   return list.length ? [{ key: 'mygroup',   title: 'Моя группа', subtitle: '', items: [...list].sort(byName) }] : [];

  const today    = list.filter(r => r.attendsToday).sort(byName);
  const tomorrow = list.filter(r => r.attendsTomorrow).sort(byName);
  const weekRest = list.filter(r => r.attendsThisWeek && !r.attendsToday && !r.attendsTomorrow).sort(byName);
  const rest     = list.filter(r => !r.attendsThisWeek).sort(byName);
  const s = [];
  if (today.length)    s.push({ key: 'today',    title: 'Сегодня', subtitle: fmtRuDate(todayIso), items: today });
  if (tomorrow.length) s.push({ key: 'tomorrow', title: 'Завтра',  subtitle: fmtRuDate(tomorrowIso), items: tomorrow });
  if (weekRest.length) s.push({ key: 'week',     title: 'На этой неделе', subtitle: '', items: weekRest });
  if (rest.length)     s.push({ key: 'rest',     title: null, subtitle: '', items: rest });
  return s;
});

const visibleRecipients = computed(() => sections.value.flatMap(s => s.items));
const visibleCount = computed(() => visibleRecipients.value.length);

const allSelected = computed(() =>
  visibleRecipients.value.length > 0 &&
  visibleRecipients.value.every(r => selectedIds.value.includes(r.id))
);
const someSelected = computed(() => selectedIds.value.length > 0);

const curatorName = (r) => r.group?.curatorUser?.fullName || '';
const avatarClass = (r) => `a${(r.id % 6) + 1}`;

const hasPhoto = (r) => !!r.photo && /^(https?:|data:)/i.test(r.photo) && !photoError.value[r.id];
const onPhotoError = (r) => { photoError.value = { ...photoError.value, [r.id]: true }; };

const recipientFlags = (r) => {
  const flags = [];
  if (r.attentionNote) {
    flags.push({ kind: 'rose', label: 'Требует особого внимания', text: r.attentionNote });
  }
  if (r.docExpiring) {
    flags.push({
      kind: 'amber',
      label: 'Заканчивается справка',
      text: r.docExpiryDate ? `Действует до ${fmtRuDate(r.docExpiryDate)}` : 'Срок действия справки истекает'
    });
  }
  return flags;
};
const stripeStatus = (r) => {
  if (r.attentionNote) return 'red';
  if (r.docExpiring)   return 'amber';
  if (r.attendsToday)  return 'green';
  return '';
};
const nextClassLabel = (r) => {
  if (r.attendsToday)    return 'Сегодня';
  if (r.attendsTomorrow) return 'Завтра';
  if (r.nextClassDate)   return fmtRuDate(r.nextClassDate);
  return 'Нет записи';
};

const attendanceSaving = ref({});
const attendanceOf = (r) =>
  r && r.attendanceDate === todayIso ? (r.attendanceStatus || null) : null;
const attendanceClass = (r) => {
  if (!authStore.isTeacher) return '';
  const s = attendanceOf(r);
  return s ? `att-${s}` : '';
};
const setAttendance = async (r, status) => {
  if (attendanceSaving.value[r.id]) return;
  if (attendanceOf(r) === status) return;
  const prevStatus = r.attendanceStatus;
  const prevDate = r.attendanceDate;
  r.attendanceStatus = status;
  r.attendanceDate = todayIso;
  attendanceSaving.value = { ...attendanceSaving.value, [r.id]: true };
  try {
    await api.put(`/recipients/${r.id}/attendance`, { status });
    notifySaved(`Посещение отмечено: ${fullName(r)}`, { key: 'attendance' });
  } catch (err) {
    console.error('setAttendance', err);
    r.attendanceStatus = prevStatus;
    r.attendanceDate = prevDate;
    alert('Не удалось сохранить отметку посещения. Попробуйте ещё раз.');
  } finally {
    const next = { ...attendanceSaving.value };
    delete next[r.id];
    attendanceSaving.value = next;
  }
};

const flagKey = (r, kind) => `${r.id}:${kind}`;
const isFlagTipOpen = (r, kind) => openTip.value === flagKey(r, kind);
const toggleFlagTip = (r, kind) => {
  const k = flagKey(r, kind);
  openTip.value = openTip.value === k ? null : k;
};

const setFilter = (f) => { activeFilter.value = f; openFilterMenu.value = null; sortMenuOpen.value = false; };

const toggleSortMenu = () => { sortMenuOpen.value = !sortMenuOpen.value; openFilterMenu.value = null; };
const selectSort = (mode) => { sortMode.value = mode; sortMenuOpen.value = false; };

const toggleFilterMenu = (type) => { openFilterMenu.value = openFilterMenu.value === type ? null : type; sortMenuOpen.value = false; };
const selectGroupFilter     = (id)   => { filterGroupId.value = id; openFilterMenu.value = null; };
const selectDiagnosisFilter = (val)  => { filterDiagnosisVal.value = val; openFilterMenu.value = null; };
const selectCuratorFilter   = (name) => { filterCuratorName.value = name; openFilterMenu.value = null; };
const clearFilter = (type) => {
  if (type === 'group')     filterGroupId.value = null;
  if (type === 'diagnosis') filterDiagnosisVal.value = null;
  if (type === 'curator')   filterCuratorName.value = null;
  openFilterMenu.value = null;
};

const toggleSelect = (id) => {
  const idx = selectedIds.value.indexOf(id);
  if (idx === -1) selectedIds.value.push(id);
  else selectedIds.value.splice(idx, 1);
};
const toggleSelectAll = () => {
  if (allSelected.value) selectedIds.value = [];
  else selectedIds.value = visibleRecipients.value.map(r => r.id);
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

const toggleDropdown = (id) => { activeDropdown.value = activeDropdown.value === id ? null : id; openTip.value = null; sortMenuOpen.value = false; openFilterMenu.value = null; };
const closeDropdown  = () => { activeDropdown.value = null; openTip.value = null; sortMenuOpen.value = false; openFilterMenu.value = null; };

const viewEvents      = (r) => { console.log('События', fullName(r));     closeDropdown(); };
const viewAttendance  = (r) => { console.log('Посещаемость', fullName(r)); closeDropdown(); };
const viewPerformance = (r) => { console.log('Успеваемость', fullName(r)); closeDropdown(); };

const openDetails = (id) => {
  pageStore.setPage('recipient-details', 'Карточка реабилитанта', { recipientId: id });
};

const onRecipientSaved = (createdRecipient) => {
  showWizard.value = false;
  openDraftId.value = null;
  loadRecipients();
  if (canSeeDrafts.value) loadDrafts();
  const id = createdRecipient?.id ?? null;
  if (id) {
    addedRecipientId.value = id;
    addedRecipientName.value = fullName(createdRecipient);
    showAddedPopup.value = true;
  }
};

const activeTab     = ref('active');
const drafts        = ref([]);
const draftsLoading = ref(false);
const draftsError   = ref('');
const draftSearch   = ref('');
const openDraftId   = ref(null);
let draftSearchTimeout = null;

const setTab = (t) => {
  if (activeTab.value === t) return;
  activeTab.value = t;
  closeDropdown();
  if (t === 'drafts') loadDrafts();
};

const loadDrafts = async () => {
  draftsLoading.value = true;
  draftsError.value = '';
  try {
    const { data } = await api.get('/recipients/drafts', {
      params: { search: draftSearch.value || undefined }
    });
    drafts.value = data.data || [];
  } catch (err) {
    console.error(err);
    draftsError.value = 'Не удалось загрузить черновики.';
  } finally {
    draftsLoading.value = false;
  }
};

const onDraftSearchInput = () => {
  clearTimeout(draftSearchTimeout);
  draftSearchTimeout = setTimeout(loadDrafts, 300);
};
const clearDraftSearch = () => { draftSearch.value = ''; loadDrafts(); };

const draftTitle = (d) => {
  const name = [d.lastName, d.firstName, d.middleName].filter(Boolean).join(' ').trim();
  if (name) return name;
  if (d.repName) return `Ребёнок ${d.repName}`;
  return 'Имя пока не введено';
};

const plural = (n, one, few, many) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
};

const humanDate = (iso) => {
  if (!iso) return '';
  const [y, m, dd] = String(iso).slice(0, 10).split('-');
  return y && m && dd ? `${dd}.${m}.${y}` : '';
};

const touchedAgo = (d) => {
  const t = Date.parse(d.updatedAt || d.createdAt || '');
  if (!Number.isFinite(t)) return 'время правки неизвестно';
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1)  return 'правили только что';
  if (mins < 60) return `правили ${mins} ${plural(mins, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `правили ${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.floor(hours / 24);
  return `правили ${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
};

const draftPctClass = (d) => {
  const pct = d.summary ? d.summary.pct : 0;
  if (pct >= 80) return 'is-high';
  if (pct >= 40) return 'is-mid';
  return 'is-low';
};

const missingNames = (s) => {
  const names = s.missing.map((x) => x.l);
  if (names.length <= 5) return names.join(', ');
  return `${names.slice(0, 5).join(', ')} и ещё ${names.length - 5}`;
};

const continueDraft = (d) => {
  openDraftId.value = d.id;
  showWizard.value = true;
};

const removeDraft = async (d) => {
  if (!confirm(
    `Удалить черновик «${draftTitle(d)}»?\n\n` +
    'Введённые данные и приложенные к нему сканы пропадут безвозвратно.'
  )) return;
  try {
    await api.delete(`/recipients/drafts/${d.id}`);
    drafts.value = drafts.value.filter((x) => x.id !== d.id);
    notifySaved('Черновик удалён');
  } catch (err) {
    console.error(err);
    alert('Не удалось удалить черновик. Попробуйте ещё раз.');
  }
};

const closeWizard = () => {
  showWizard.value = false;
  openDraftId.value = null;
  if (activeTab.value === 'drafts') loadDrafts();
};

const goToAddedDetails = () => {
  const id = addedRecipientId.value;
  showAddedPopup.value = false;
  if (id) openDetails(id);
};

const goToAddedAssign = () => {
  const id = addedRecipientId.value;
  showAddedPopup.value = false;
  if (id) assignTarget.value = { id, name: addedRecipientName.value };
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
    const editing = !!editId.value;
    const fio = [form.value.lastName, form.value.firstName].filter(Boolean).join(' ').trim();
    if (editing) await api.put(`/recipients/${editId.value}`, form.value);
    else         await api.post('/recipients', form.value);
    await loadRecipients();
    closeModal();
    notifySaved(editing
      ? (fio ? `Изменения сохранены: ${fio}` : 'Изменения сохранены')
      : (fio ? `Реабилитант ${fio} добавлен` : 'Реабилитант добавлен'));
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
  if (!event.target.closest('.t-flag'))
    openTip.value = null;
  if (!event.target.closest('.t-sort-wrap'))
    sortMenuOpen.value = false;
  if (!event.target.closest('.t-chip-filter-wrap'))
    openFilterMenu.value = null;
  if (!event.target.closest('.t-rcard-photo') && !event.target.closest('.t-rcard-zoom'))
    zoomPhotoId.value = null;
};

const handleEscape = (event) => {
  if (event.key === '/') {
    const el = event.target;
    const tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return;
    event.preventDefault();
    searchInputRef.value?.focus();
    searchInputRef.value?.select?.();
    return;
  }
  if (event.key !== 'Escape') return;
  sortMenuOpen.value = false;
  openFilterMenu.value = null;
  openTip.value = null;
  activeDropdown.value = null;
};

const applyTabParam = () => {
  if (!canSeeDrafts.value) return;
  const want = pageStore.params?.tab === 'drafts' ? 'drafts' : 'active';
  if (want !== activeTab.value) setTab(want);
};
watch(() => pageStore.params?.tab, applyTabParam);

const applyActionParam = () => {
  if (pageStore.params?.action !== 'new') return;
  if (showWizard.value) return;
  showWizard.value = true;
};
watch(() => pageStore.params?.action, applyActionParam);

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadRecipients();
  loadGroups();
  applyTabParam();
  applyActionParam();
  if (canSeeDrafts.value && activeTab.value !== 'drafts') loadDrafts();
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleEscape);
});
onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.erp-r-teacher {
  --t-font-serif: 'Lora', Georgia, 'Times New Roman', serif;
  --t-font-sans:  'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
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
  max-width: none;
  margin-inline: 0;
  padding-inline: 0;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px - 3.5rem);
  min-height: calc(100dvh - 64px - 3.5rem);
  padding-bottom: 4rem;
}
@media (max-width: 768px) {
  .erp-r-teacher {
    min-height: calc(100vh - 64px - 2rem - 70px);
    min-height: calc(100dvh - 64px - 2rem - 70px);
    padding-bottom: 1.5rem;
  }
}
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
.t-page-header {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
.t-page-actions { display: flex; gap: 0.5rem; justify-content: flex-start; }
.t-page-actions .t-btn {
  min-height: 3rem;
  padding: 0.75rem 1.5rem;
  gap: 0.625rem;
  font-size: 0.9375rem;
}
.t-page-actions .t-btn svg { width: 1rem; height: 1rem; flex: 0 0 1rem; }

.t-tabs {
  display: flex; gap: 0.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--t-line);
}
.t-tab {
  display: inline-flex; align-items: center; gap: 0.5rem;
  min-height: 2.5rem; padding: 0.5rem 1rem;
  margin-bottom: -1px;
  background: none; border: none;
  border-bottom: 2px solid transparent;
  font-family: var(--t-font-sans);
  font-size: 0.9375rem; font-weight: 500;
  color: var(--t-ink-subtle);
  cursor: pointer;
  transition: color 150ms, border-color 150ms;
}
.t-tab:hover { color: var(--t-ink-strong); }
.t-tab.active { color: var(--t-ink-strong); border-bottom-color: var(--t-sage-900); }
.t-tab-count {
  padding: 0 0.4375rem; border-radius: 999px;
  font-size: 0.6875rem; font-weight: 500;
  min-width: 1.125rem; text-align: center;
  background: var(--t-paper-soft); color: var(--t-ink-muted);
  border: 1px solid var(--t-line-soft);
}
.t-tab.active .t-tab-count {
  background: var(--t-sage-900); color: #F3F6EA; border-color: var(--t-sage-900);
}

.t-drafts-bar {
  display: grid;
  grid-template-columns: minmax(0, 26rem) minmax(0, 1fr);
  gap: 1rem; align-items: center;
  margin-bottom: 1.25rem;
}
@media (max-width: 768px) {
  .t-drafts-bar { grid-template-columns: 1fr; }
}
.t-draft-list { display: flex; flex-direction: column; gap: 0.875rem; }
.t-draft {
  display: flex; flex-direction: column; gap: 0.75rem;
  padding: 1.125rem 1.25rem;
  background: var(--t-paper);
  border: 1px solid var(--t-line);
  border-radius: var(--t-r-lg);
  box-shadow: var(--t-shadow-sm);
  transition: border-color 150ms, box-shadow 150ms;
}
.t-draft:hover { border-color: var(--t-line-strong); box-shadow: var(--t-shadow-md); }
.t-draft-top {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
}
.t-draft-id { min-width: 0; }
.t-draft-name {
  font-family: var(--t-font-serif);
  font-size: 1.25rem; font-weight: 500; line-height: 1.2;
  letter-spacing: -0.01em; color: var(--t-ink-strong);
}
.t-draft-meta {
  margin-top: 0.25rem;
  font-size: 0.8125rem; color: var(--t-ink-muted);
}
.t-draft-pct {
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 0.0625rem; flex: 0 0 auto;
}
.t-draft-pct strong { font-size: 1.25rem; font-weight: 600; line-height: 1; }
.t-draft-pct span { font-size: 0.75rem; color: var(--t-ink-subtle); }
.t-draft-pct.is-high strong { color: var(--t-sage-700); }
.t-draft-pct.is-mid  strong { color: var(--t-amber-700); }
.t-draft-pct.is-low  strong { color: var(--t-rose-700); }
.t-draft-bar {
  height: 0.375rem; border-radius: 999px;
  background: var(--t-paper-sunken); overflow: hidden;
}
.t-draft-bar span {
  display: block; height: 100%; border-radius: 999px;
  transition: width 250ms ease;
}
.t-draft-bar span.is-high { background: var(--t-sage-500); }
.t-draft-bar span.is-mid  { background: var(--t-amber-500); }
.t-draft-bar span.is-low  { background: var(--t-rose-500); }
.t-draft-missing {
  display: flex; flex-direction: column; gap: 0.375rem;
  padding: 0.75rem 0.875rem;
  background: var(--t-canvas);
  border: 1px solid var(--t-line-soft);
  border-radius: var(--t-r-md);
}
.t-draft-step {
  display: grid; grid-template-columns: minmax(9rem, auto) minmax(0, 1fr);
  gap: 0.75rem; align-items: baseline;
  font-size: 0.8125rem;
}
.t-draft-step-name { color: var(--t-ink-strong); font-weight: 500; }
.t-draft-step-fields { color: var(--t-ink-muted); line-height: 1.45; }
@media (max-width: 640px) {
  .t-draft-step { grid-template-columns: 1fr; gap: 0.125rem; }
}
.t-draft-done {
  padding: 0.625rem 0.875rem;
  background: var(--t-sage-50);
  border: 1px solid var(--t-sage-100);
  border-radius: var(--t-r-md);
  font-size: 0.8125rem; color: var(--t-sage-700);
}
.t-draft-foot {
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; flex-wrap: wrap;
  padding-top: 0.75rem;
  border-top: 1px solid var(--t-line-soft);
}
.t-draft-facts {
  display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
  font-size: 0.75rem; color: var(--t-ink-subtle);
}
.t-draft-fact { display: inline-flex; align-items: center; gap: 0.375rem; }
.t-draft-fact svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; opacity: .75; }
.t-draft-actions { display: flex; gap: 0.5rem; }

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
  background: var(--btn-primary-bg); color: var(--btn-primary-fg); border-color: var(--btn-primary-bg);
}
.t-btn-primary:hover { background: var(--btn-primary-bg-hover); border-color: var(--btn-primary-bg-hover); }
.t-btn-secondary {
  background: var(--btn-secondary-bg); color: var(--btn-secondary-fg); border-color: var(--btn-secondary-border);
}
.t-btn-secondary:hover { background: var(--btn-secondary-bg-hover); border-color: var(--btn-secondary-border-hover); }
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
.t-view-btn.active { background: var(--btn-primary-bg); color: var(--btn-primary-fg); }
.t-view-btn svg { width: 1rem; height: 1rem; }
.t-sort-wrap { position: relative; }
.t-sort-trigger { white-space: nowrap; }
.t-sort-trigger svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 auto; }
.t-sort-caret { width: 0.8125rem !important; height: 0.8125rem !important; opacity: .7; }
.t-sort-label { font-weight: 500; }
.t-sort-menu {
  position: absolute; top: calc(100% + 6px); right: 0;
  z-index: 30; min-width: 17rem;
  background: var(--t-paper); border: 1px solid var(--t-line-strong);
  border-radius: var(--t-r-md); box-shadow: var(--t-shadow-lg);
  padding: 0.375rem;
}
.t-sort-item {
  display: grid; grid-template-columns: 1.1rem 1fr auto; align-items: center;
  gap: 0.625rem; width: 100%; min-height: 2.5rem; padding: 0.4375rem 0.625rem;
  border-radius: 0.375rem; font-size: 0.875rem; color: var(--t-ink-strong);
  text-align: left; background: none; border: none; cursor: pointer;
  transition: background 120ms;
}
.t-sort-item:hover { background: var(--t-paper-soft); }
.t-sort-item.active { background: var(--t-sage-50); }
.t-sort-item svg { width: 1.05rem; height: 1.05rem; color: var(--t-ink-muted); }
.t-sort-item.active svg { color: var(--t-sage-700); }
.t-sort-hint {
  grid-column: 2 / 3; font-size: 0.6875rem; color: var(--t-ink-subtle);
  margin-top: -0.125rem;
}
.t-sort-item > span:first-of-type { grid-column: 2 / 3; }
.t-sort-check { width: 0.9375rem !important; height: 0.9375rem !important; color: var(--t-sage-700) !important; grid-column: 3; }
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
.t-chip.active { background: var(--btn-primary-bg); color: var(--btn-primary-fg); border-color: var(--btn-primary-bg); }
.t-chip-count {
  background: rgba(255,255,255,.2); color: inherit;
  padding: 0 0.4375rem; border-radius: 999px;
  font-size: 0.6875rem; font-weight: 500;
  min-width: 1.125rem; text-align: center;
}
.t-chip:not(.active) .t-chip-count {
  background: var(--t-paper-soft); color: var(--t-ink-muted);
}
.t-filter-divider {
  width: 1px; align-self: stretch; margin: 0.25rem 0.25rem;
  background: var(--t-line); flex: 0 0 1px;
}
.t-chip-filter-wrap { position: relative; }
.t-chip-filter {
  display: inline-flex; align-items: center; gap: 0.375rem;
  min-height: 2.25rem; padding: 0.5rem 0.75rem 0.5rem 0.875rem;
  border-radius: 999px; font-size: 0.8125rem; font-weight: 500;
  background: transparent; color: var(--t-ink-muted);
  border: 1px dashed var(--t-line-strong);
  cursor: pointer; transition: all 150ms;
}
.t-chip-filter:hover { border-color: var(--t-ink-muted); color: var(--t-ink-strong); background: var(--t-paper-soft); }
.t-chip-filter svg { width: 0.8125rem; height: 0.8125rem; opacity: .8; }
.t-chip-filter.active {
  background: var(--t-blue-50); color: var(--t-blue-700);
  border-style: solid; border-color: var(--t-blue-100);
}
.t-chip-filter-clear {
  display: inline-grid; place-items: center;
  width: 1.125rem; height: 1.125rem; border-radius: 50%;
  background: rgba(31,62,85,.12); color: var(--t-blue-700);
  cursor: pointer; transition: background 120ms;
}
.t-chip-filter-clear:hover { background: rgba(31,62,85,.24); }
.t-chip-filter-clear svg { width: 0.625rem; height: 0.625rem; opacity: 1; }
.t-filter-menu {
  position: absolute; top: calc(100% + 6px); left: 0;
  z-index: 30; min-width: 12rem; max-width: 18rem;
  max-height: 16rem; overflow-y: auto;
  background: var(--t-paper); border: 1px solid var(--t-line-strong);
  border-radius: var(--t-r-md); box-shadow: var(--t-shadow-lg);
  padding: 0.375rem;
}
.t-filter-menu-item {
  display: block; width: 100%; min-height: 2.25rem; padding: 0.5rem 0.625rem;
  border-radius: 0.375rem; font-size: 0.8125rem; color: var(--t-ink-strong);
  text-align: left; background: none; border: none; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  transition: background 120ms;
}
.t-filter-menu-item:hover { background: var(--t-paper-soft); }
.t-filter-menu-item.active { background: var(--t-blue-50); color: var(--t-blue-700); font-weight: 600; }
.t-filter-menu-empty {
  display: block; width: 100%; padding: 0.625rem;
  font-size: 0.8125rem; color: var(--t-ink-subtle); text-align: center;
  background: none; border: none;
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
.t-groups { display: flex; flex-direction: column; gap: 1.75rem; }
.t-group { }
.t-group-header {
  display: flex; align-items: center; gap: 0.75rem;
  margin-bottom: 1rem;
}
.t-group-title {
  font-family: var(--t-font-serif);
  font-size: 1.375rem; font-weight: 500;
  letter-spacing: -0.015em; color: var(--t-ink-strong);
  line-height: 1.1; flex: 0 0 auto;
}
.t-group-count {
  display: inline-grid; place-items: center;
  min-width: 1.5rem; height: 1.5rem; padding: 0 0.4375rem;
  border-radius: 999px; background: var(--t-paper-sunken); color: var(--t-ink-muted);
  font-size: 0.75rem; font-weight: 600; font-variant-numeric: tabular-nums;
}
.t-group-sub {
  font-size: 0.8125rem; color: var(--t-ink-muted); font-weight: 500;
  text-transform: capitalize;
}
.t-group-line { flex: 1; height: 1px; background: var(--t-line-soft); }
.t-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(21rem, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
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
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.t-flag {
  position: relative;
  width: 1.5rem; height: 1.5rem; border-radius: 50%;
  display: grid; place-items: center; cursor: help;
  border: 0.1875rem solid var(--t-paper);
  box-shadow: var(--t-shadow-sm);
}
.t-flag:focus-visible { outline: 3px solid var(--t-sage-700); outline-offset: 2px; }
.t-flag svg { width: 0.8125rem; height: 0.8125rem; }
.t-flag-rose  { background: var(--t-rose-500);  color: #FFFFFF; }
.t-flag-amber { background: var(--t-amber-500); color: #FFFFFF; }
.t-flag-tooltip {
  position: absolute; bottom: calc(100% + 0.5rem); left: 50%;
  transform: translateX(-50%) translateY(0.25rem);
  background: var(--t-ink-strong); color: #F3F6EA;
  padding: 0.4375rem 0.625rem; border-radius: var(--t-r-sm);
  font-size: 0.75rem; line-height: 1.35; font-weight: 400;
  white-space: normal; width: max-content; max-width: 13rem; text-align: left;
  box-shadow: var(--t-shadow-lg);
  opacity: 0; visibility: hidden; pointer-events: none;
  transition: opacity 150ms ease, transform 150ms ease, visibility 150ms;
  z-index: 50;
}
.t-flag-tooltip strong { font-weight: 600; }
.t-flag-tooltip::after {
  content: ''; position: absolute; top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent; border-top-color: var(--t-ink-strong);
}
.t-flag:hover .t-flag-tooltip,
.t-flag:focus-visible .t-flag-tooltip,
.t-flag.is-tapped .t-flag-tooltip {
  opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0);
}
.t-rcard.stripe-red   { border-left: 4px solid var(--t-rose-500); }
.t-rcard.stripe-amber { border-left: 4px solid var(--t-amber-500); }
.t-rcard.stripe-green { border-left: 4px solid var(--t-sage-500); }
.t-rcard-link {
  position: absolute; inset: 0;
  border-radius: inherit; z-index: 1;
}
.t-rcard-link:focus-visible {
  outline: 3px solid var(--t-sage-700);
  outline-offset: -3px;
}
.t-rcard-body {
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  text-align: center;
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

.t-rcard-photo {
  position: relative;
  width: 6.5rem; height: 6.5rem;
  flex: 0 0 6.5rem;
  z-index: 3;
}
.t-rcard-photo.has-zoom { cursor: zoom-in; }
.t-rcard-zoom {
  position: absolute;
  inset: 0;
  z-index: 4;
  border-radius: var(--t-r-lg);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: inset 0 0 0 1px var(--t-line), 0 .5rem 1.5rem rgba(17,34,17,.18);
  pointer-events: auto;
  cursor: zoom-out;
  animation: t-zoomIn 180ms ease;
}
@keyframes t-zoomIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.t-rcard-photo img,
.t-rcard-photo-fallback {
  width: 100%; height: 100%;
  border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
  object-fit: cover; display: grid; place-items: center;
  font-family: var(--t-font-serif); font-weight: 500;
  font-size: 2rem; letter-spacing: -0.02em;
  box-shadow: 0 1px 2px rgba(17,34,17,.08), 0 0 0 1px var(--t-line-soft);
  transition: border-radius 500ms cubic-bezier(.4,.1,.3,1), transform 220ms ease;
}
.t-rcard:hover .t-rcard-photo img,
.t-rcard:hover .t-rcard-photo-fallback { transform: scale(1.04); }
.t-rcard:hover .t-rcard-photo img,
.t-rcard:hover .t-rcard-photo-fallback {
  border-radius: 52% 48% 45% 55% / 48% 52% 48% 52%;
}
.t-rcard-photo-fallback.a1 { background: linear-gradient(135deg, var(--t-amber-100), var(--t-rose-100));  color: var(--t-amber-900); }
.t-rcard-photo-fallback.a2 { background: linear-gradient(135deg, var(--t-sage-100),  var(--t-blue-100));  color: var(--t-sage-900);  }
.t-rcard-photo-fallback.a3 { background: linear-gradient(135deg, var(--t-blue-100),  var(--t-sage-100));  color: var(--t-blue-900);  }
.t-rcard-photo-fallback.a4 { background: linear-gradient(135deg, var(--t-rose-100),  var(--t-amber-100)); color: var(--t-rose-900);  }
.t-rcard-photo-fallback.a5 { background: linear-gradient(135deg, var(--t-sage-100),  var(--t-amber-100)); color: var(--t-sage-900);  }
.t-rcard-photo-fallback.a6 { background: linear-gradient(135deg, var(--t-amber-100), var(--t-sage-100));  color: var(--t-amber-900); }

.t-rcard-main { min-width: 0; width: 100%; }
.t-rcard-name {
  font-size: 1rem; font-weight: 600;
  color: var(--t-ink-strong); letter-spacing: -0.01em; line-height: 1.3;
}
.t-rcard-meta {
  font-size: 0.8125rem; color: var(--t-ink-muted); margin-top: 0.125rem;
}
.t-rcard-tags {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 0.3125rem; margin-top: 0.5rem;
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
.t-att-value {
  font-size: 0.9375rem; font-weight: 600; color: var(--t-ink-strong);
  line-height: 1.2;
}
.t-next-class.soon { color: var(--t-sage-700); }

.t-att-mark {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.375rem;
  padding: 0.5rem 0.75rem 0.75rem;
  border-top: 1px solid var(--t-line-soft);
}
.t-att-btn {
  min-width: 0;
  display: inline-flex; align-items: center; justify-content: center;
  gap: 0.3rem;
  padding: 0.45rem 0.3rem;
  border: 1px solid var(--t-line);
  border-radius: var(--t-r-md);
  background: var(--t-paper);
  color: var(--t-ink-muted);
  font-size: 0.72rem; font-weight: 600; line-height: 1;
  cursor: pointer;
  transition: background 150ms, color 150ms, border-color 150ms, box-shadow 150ms;
}
.t-att-btn svg { width: 0.85rem; height: 0.85rem; flex: 0 0 auto; }
.t-att-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.t-att-btn:hover:not(:disabled) { border-color: var(--t-line-strong); color: var(--t-ink-strong); }
.t-att-btn:disabled { opacity: 0.6; cursor: default; }
.t-att-btn.is-present.active {
  background: var(--t-sage-500); border-color: var(--t-sage-500); color: #fff;
  box-shadow: 0 1px 3px rgba(63,110,63,.35);
}
.t-att-btn.is-absent.active {
  background: var(--t-rose-500); border-color: var(--t-rose-500); color: #fff;
  box-shadow: 0 1px 3px rgba(177,75,57,.35);
}
.t-att-btn.is-left.active {
  background: var(--t-amber-500); border-color: var(--t-amber-500); color: #fff;
  box-shadow: 0 1px 3px rgba(185,119,24,.35);
}
.t-rcard.att-present { background: var(--t-sage-50);  border-color: var(--t-sage-100);  border-left: 4px solid var(--t-sage-500); }
.t-rcard.att-absent  { background: var(--t-rose-50);  border-color: var(--t-rose-100);  border-left: 4px solid var(--t-rose-500); }
.t-rcard.att-left    { background: var(--t-amber-50); border-color: var(--t-amber-100); border-left: 4px solid var(--t-amber-500); }

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
.t-tr.stripe-red   { box-shadow: inset 3px 0 0 var(--t-rose-500); }
.t-tr.stripe-amber { box-shadow: inset 3px 0 0 var(--t-amber-500); }
.t-tr.stripe-green { box-shadow: inset 3px 0 0 var(--t-sage-500); }
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
.t-tr-flag svg { width: 0.6875rem; height: 0.6875rem; }
.t-tr-flag-rose  { background: var(--t-rose-500);  color: #FFFFFF; }
.t-tr-flag-amber { background: var(--t-amber-500); color: #FFFFFF; }

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
    left: max(0.75rem, var(--safe-left, 0px)); right: max(0.75rem, var(--safe-right, 0px));
    transform: translateY(150%);
    max-width: none;
    bottom: calc(var(--bottom-nav-h, 4.375rem) + var(--safe-bottom, 0px) + 0.75rem);
    flex-wrap: wrap; padding: 0.75rem;
    border-radius: var(--t-r-lg);
  }
  .t-selection-toolbar.visible { transform: translateY(0); }
  .t-selection-info { flex: 1; border-right: none; padding-right: 0; }
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
  background: #FFFFFF; border: 1px solid #D6CFBE;
  border-radius: var(--radius-md); padding: 0.3rem 0.7rem;
  flex: 1; max-width: 300px;
}
.search input { border: none; background: none; outline: none; width: 100%; }
.filter-group { display: flex; align-items: center; gap: 0.5rem; }
.filter-group label { font-size: .85rem; font-weight: 500; color: #4F564A; }
.styled-select {
  padding: .5rem .75rem; border: 1px solid #D6CFBE;
  border-radius: var(--radius-md); background: #FFFFFF;
  color: #131713; font-size: .9rem; cursor: pointer;
}
.items-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem; }
@media (max-width: 900px) { .items-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 640px) { .items-grid { grid-template-columns: 1fr; } }
.item-card {
  background: #FFFFFF; border: 1px solid #E4DECF;
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
.sub { font-size: .75rem; color: #4F564A; }
.tags { display: flex; flex-wrap: wrap; gap: .3rem; margin-top: .2rem; }
.badge-blue, .badge-gray {
  font-size: .7rem; padding: .2rem .6rem; border-radius: 40px;
  font-weight: 500; display: inline-block; white-space: nowrap;
}
.badge-blue { background: #EEF4E2; color: #2F4A2F; }
.badge-gray { background: #F3EEE4; color: #4F564A; }
.card-right {
  display: flex; flex-direction: row; justify-content: flex-end;
  gap: .75rem; margin-top: .25rem;
  border-top: 1px solid #EFEADC; padding-top: .75rem;
}
.widget-status, .widget-attendance {
  display: flex; align-items: center; gap: .3rem;
  background: #F3EEE4; border-radius: 40px; padding: .2rem .6rem;
}
.widget-status svg, .widget-attendance svg { width: 20px; height: 20px; stroke: #3F6E3F; }
.widget-value { font-size: .75rem; font-weight: 600; color: #131713; }
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
  background: var(--btn-primary-bg); color: var(--btn-primary-fg); border: 1px solid var(--btn-primary-bg);
  padding: .5rem 1rem; border-radius: var(--radius-md); cursor: pointer;
  font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.btn-primary:hover { background: var(--btn-primary-bg-hover); border-color: var(--btn-primary-bg-hover); transform: none; }
.btn-secondary {
  background: var(--btn-secondary-bg); border: 1px solid var(--btn-secondary-border); color: var(--btn-secondary-fg);
  padding: .5rem 1rem; border-radius: var(--radius-md); cursor: pointer;
  font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.btn-secondary:hover { background: var(--btn-secondary-bg-hover); border-color: var(--btn-secondary-border-hover); }

.form-group-photo { grid-column: span 2; }
@media (max-width: 640px) { .form-group-photo { grid-column: span 1; } }
.photo-field { display: flex; gap: 1rem; align-items: flex-start; }
.photo-preview {
  width: 72px; height: 72px; flex: 0 0 72px;
  border-radius: var(--radius-md); overflow: hidden;
  border: 1px solid var(--border); background: var(--bg-surface);
  display: grid; place-items: center;
}
.photo-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-preview-empty { font-size: .7rem; color: var(--text-secondary, #6E7368); text-align: center; padding: 0 .25rem; }
.photo-field-body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: .5rem; }
.photo-field-buttons { display: flex; gap: .5rem; flex-wrap: wrap; }
.btn-upload {
  display: inline-flex; align-items: center; gap: .4rem;
  padding: .45rem .8rem; border-radius: var(--radius-md); cursor: pointer;
  background: var(--btn-secondary-bg); border: 1px solid var(--btn-secondary-border); color: var(--btn-secondary-fg);
  font-size: .8rem; font-weight: 600; transition: background .15s ease, border-color .15s ease;
}
.btn-upload:hover { background: var(--btn-secondary-bg-hover); border-color: var(--btn-secondary-border-hover); }
.btn-upload.is-busy { opacity: .6; pointer-events: none; }
.btn-upload svg { flex: 0 0 15px; }
.btn-clear-photo {
  padding: .45rem .8rem; border-radius: var(--radius-md); cursor: pointer;
  background: transparent; border: 1px solid transparent; color: var(--btn-danger-fg);
  font-size: .8rem; font-weight: 600;
}
.btn-clear-photo:hover { background: var(--btn-danger-bg-hover); }
.photo-field-hint { font-size: .72rem; color: var(--text-secondary, #6E7368); }
.photo-field-error { font-size: .72rem; color: #B14B39; font-weight: 600; }

.added-pop {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 1200;
  width: min(20rem, calc(100vw - 2rem));
  background: #FFFDF8;
  border: 1px solid #E6DFD1;
  border-radius: 14px;
  box-shadow: 0 12px 34px rgba(60, 48, 30, .18);
  padding: 1rem 1.05rem 1.05rem;
}
.added-pop-close {
  position: absolute;
  top: .45rem;
  right: .55rem;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: #9A8F7C;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  border-radius: 6px;
}
.added-pop-close:hover { background: #F1EADD; color: #5B5445; }
.added-pop-head { display: flex; align-items: flex-start; gap: .65rem; margin-bottom: .85rem; }
.added-pop-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #E6F3E7;
  color: #3F7D46;
}
.added-pop-title { margin: 0; font-weight: 700; font-size: .95rem; color: #2E2A22; }
.added-pop-sub { margin: .1rem 0 0; font-size: .8rem; color: #7C7462; }
.added-pop-actions { display: flex; flex-direction: column; gap: .5rem; }
.added-pop-btn {
  width: 100%;
  padding: .55rem .75rem;
  border: 1px solid #DAD1BF;
  border-radius: 9px;
  background: #FFFFFF;
  color: #4A4436;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background .12s, border-color .12s;
}
.added-pop-btn:hover { background: #F4EEE1; }
.added-pop-btn-primary {
  background: #6E7F4F;
  border-color: #6E7F4F;
  color: #FFFFFF;
}
.added-pop-btn-primary:hover { background: #61713F; }

.added-pop-enter-active, .added-pop-leave-active { transition: opacity .2s ease, transform .2s ease; }
.added-pop-enter-from, .added-pop-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 768px) {
  .added-pop {
    left: max(0.75rem, var(--safe-left, 0px));
    right: max(0.75rem, var(--safe-right, 0px));
    bottom: calc(var(--bottom-nav-h, 4.375rem) + var(--safe-bottom, 0px) + 0.75rem);
    width: auto;
  }
  .added-pop-close { width: var(--tap, 2.75rem); height: var(--tap, 2.75rem); top: .1rem; right: .1rem; }
  .added-pop-btn { min-height: var(--tap, 2.75rem); font-size: .9rem; }
}
</style>
