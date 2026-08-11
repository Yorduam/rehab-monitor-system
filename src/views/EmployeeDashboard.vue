<template>
  <div class="emp-dash">

    <div class="greet">
      <div class="greet-row">
        <div class="greet-main">
          <div class="eyebrow">{{ todayLabel }}</div>
          <h1>{{ greeting }}</h1>
          <p class="lede">{{ ledeText }}</p>
        </div>
        <button class="btn btn-secondary" type="button" :aria-expanded="String(searchOpen)" @click="toggleSearch">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>{{ searchOpen ? 'Скрыть поиск' : 'Найти реабилитанта' }}</span>
        </button>
      </div>
    </div>

    <div v-show="searchOpen" class="card search-card">
      <div class="card-body">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            ref="searchInput"
            v-model="searchQuery"
            class="search-input"
            type="search"
            autocomplete="off"
            placeholder="ФИО — сначала проверьте, есть ли человек в базе"
          />
        </div>
        <div class="search-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Если реабилитант уже в базе — не регистрируйте заново, откройте карточку и назначьте новую диагностику.
        </div>
        <div class="search-results" aria-live="polite">
          <div v-if="searchLoading" class="sr-empty">Поиск…</div>
          <template v-else-if="searchQuery.trim().length">
            <div v-if="!searchResults.length" class="sr-empty">Ничего не найдено — можно зарегистрировать нового.</div>
            <div v-for="r in searchResults" :key="r.id" class="sr-row">
              <span class="avatar" :class="avatarClass(r.id)" aria-hidden="true">{{ initials(fullName(r)) }}</span>
              <div class="sr-main">
                <div class="sr-name">
                  {{ fullName(r) }}
                  <span v-if="statusTag(r)" class="tag" :class="statusTag(r).cls">{{ statusTag(r).text }}</span>
                </div>
                <div class="sr-sub">
                  {{ r.diagnosis || 'Диагноз не указан' }}<span v-if="r.attentionNote" class="warn"> · {{ r.attentionNote }}</span>
                </div>
              </div>
              <div class="sr-actions">
                <button class="btn btn-secondary btn-sm" type="button" @click="openRecipient(r.id)">Открыть</button>
              </div>
            </div>
          </template>
          <div v-else class="sr-empty">Начните вводить фамилию или имя…</div>
        </div>
      </div>
    </div>

    <div v-if="alertsError" class="err-bar" role="alert">
      <span>{{ alertsError }}</span>
      <button class="btn btn-secondary btn-sm" type="button" @click="loadAlerts">Повторить</button>
    </div>

    <section v-for="g in alertGroups" :key="g.key" class="alerts">
      <div class="alerts-head">
        <div class="section-eyebrow">{{ g.title }}</div>
        <div v-if="g.subtitle" class="alerts-sub">{{ g.subtitle }}</div>
      </div>

      <div class="tiles" :class="'tiles-' + g.tiles.length">
        <div
          v-for="t in g.tiles"
          :key="t.key"
          class="tile"
          :class="[t.count ? 'tone-' + t.tone : 'tone-calm', { open: openTile === t.key }]"
        >
          <button
            class="tile-btn"
            type="button"
            :disabled="!t.count"
            :aria-expanded="String(openTile === t.key)"
            @click="toggleTile(t)"
          >
            <span class="tile-title">
              {{ t.title }}
              <svg v-if="t.count" class="tile-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
            <span class="tile-meta">{{ t.count ? t.meta : t.empty }}</span>
            <span class="tile-num">
              <b>{{ t.count }}</b>
              <i>{{ t.unit }}</i>
            </span>
          </button>

          <div v-if="openTile === t.key" class="tile-list">
            <button
              v-for="(it, idx) in t.items"
              :key="t.key + '-' + idx"
              class="tl-row"
              type="button"
              @click="openRecipient(it.recipientId)"
            >
              <span class="avatar" :class="avatarClass(it.recipientId)" aria-hidden="true">{{ initials(it.name) }}</span>
              <span class="tl-main">
                <span class="tl-name">{{ it.name }}</span>
                <span class="tl-note">{{ it.note }}</span>
              </span>
              <span v-if="it.days !== null && it.days !== undefined" class="tl-days">
                {{ it.days }} {{ plural(it.days, 'день', 'дня', 'дней') }}
              </span>
            </button>
            <button
              v-if="t.action"
              class="tl-all"
              type="button"
              @click="goTo(t.action.page, t.action.title)"
            >
              Открыть раздел «{{ t.action.title }}»
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="draft">
      <div class="alerts-head dr-head">
        <div>
          <div class="section-eyebrow">Незаконченная карточка</div>
          <div class="alerts-sub">Та, которую начали на этом компьютере</div>
        </div>
        <button
          v-if="draftsTotal"
          class="btn btn-secondary btn-sm dr-all-btn"
          type="button"
          @click="openDraftsTab"
        >Все черновики · {{ draftsTotal }}</button>
      </div>

      <div class="card">
        <div v-if="draftLoading" class="card-body empty-note">Загрузка…</div>

        <div v-else-if="!draft" class="card-body">
          <div class="dr-empty-t">Незаконченных карточек нет</div>
          <div class="dr-empty-s">
            Если закрыть мастер регистрации на половине, начатая карточка появится здесь — и её можно будет дозаполнить, не вводя всё заново.
            <template v-if="draftsTotal">
              У коллег такие карточки есть: {{ draftsTotal }} {{ plural(draftsTotal, 'штука', 'штуки', 'штук') }} в разделе
              <button class="p-link" type="button" @click="openDraftsTab">«Черновики»</button>.
            </template>
          </div>
        </div>

        <div v-else class="card-body dr-body">
          <div class="dr-top">
            <span class="avatar av-amber" aria-hidden="true">{{ initials(draftTitle) }}</span>
            <div class="dr-id">
              <div class="dr-name">{{ draftTitle }}</div>
              <div class="dr-sub">{{ draftSub }}</div>
            </div>
            <button class="btn btn-primary" type="button" @click="openDraftWizard">Дозаполнить карточку</button>
          </div>

          <div class="dr-progress">
            <div class="dr-bar"><span :style="{ width: draft.pct + '%' }"></span></div>
            <div class="dr-figures">
              Заполнено <b>{{ draft.done }}</b> из {{ draft.total }} {{ plural(draft.total, 'обязательного поля', 'обязательных полей', 'обязательных полей') }} на первых двух шагах
            </div>
          </div>

          <div v-if="draft.steps.length" class="dr-steps">
            <div v-for="s in draft.steps" :key="s.step" class="dr-step">
              <div class="dr-step-head">
                <span>Шаг {{ s.step }} · {{ s.label }}</span>
                <span class="dr-step-num">{{ s.done }} из {{ s.total }}</span>
              </div>
              <div class="dr-chips">
                <span v-for="(m, i) in s.missing" :key="s.step + '-' + i" class="dr-chip">{{ m.l }}</span>
              </div>
            </div>
          </div>
          <div v-else class="dr-step-done">
            Личные данные заполнены полностью. Остался третий шаг мастера — сканы, пакет документов и подтверждение комплектности.
          </div>

          <p class="dr-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>
              Карточка сохранена и на сервере: её видно с любого компьютера и она переживёт очистку данных браузера.
              Здесь показана только та, что начата на этом компьютере, — остальные лежат в разделе
              <button class="p-link" type="button" @click="openDraftsTab">«Черновики»</button>.
            </span>
          </p>
        </div>
      </div>
    </section>

    <div class="qa-wrap">
      <div class="qa-head">
        <div class="section-eyebrow">Быстрые действия</div>
        <button class="qa-collapse" type="button" :aria-expanded="String(qaOpen)" aria-label="Свернуть быстрые действия" @click="qaOpen = !qaOpen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      <div v-show="qaOpen" class="qa qa-4">
        <button class="qa-btn" type="button" @click="goTo('recipients', 'Реабилитанты')">
          <span class="qa-ic ic-sage" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></span>
          <span class="qa-txt"><span class="qa-t">Зарегистрировать нового</span></span>
        </button>
        <button class="qa-btn" type="button" @click="goTo('schedule', 'Расписание')">
          <span class="qa-ic ic-blue" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg></span>
          <span class="qa-txt"><span class="qa-t">Назначить диагностику</span></span>
        </button>
        <button class="qa-btn" type="button" @click="goTo('documents', 'Документы')">
          <span class="qa-ic ic-amber" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span>
          <span class="qa-txt"><span class="qa-t">Печать документов</span></span>
        </button>
        <button class="qa-btn" type="button" @click="goTo('documents', 'Документы')">
          <span class="qa-ic ic-plum" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3 3 3-3"/></svg></span>
          <span class="qa-txt"><span class="qa-t">Принять документы</span></span>
        </button>
      </div>
    </div>

    <div v-if="attnList.length" class="card attn attn-block">
      <div class="card-head">
        <div><div class="card-title-sans">Требует внимания</div><div class="card-sub">Реабилитанты с неполным пакетом документов</div></div>
        <span class="tag tag-rose">{{ attnCount }} {{ plural(attnCount, 'без документов', 'без документов', 'без документов') }}</span>
      </div>
      <div class="card-body">
        <div class="tasks">
          <div v-for="r in attnList" :key="r.id" class="task">
            <span class="task-ic ic-rose" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
            <div class="task-main">
              <div class="t-title">
                <button class="p-link" type="button" @click="openRecipient(r.id)">{{ r.fullName }}</button> — документы не готовы
              </div>
              <div class="t-sub">{{ r.groupName }} · куратор {{ r.curator }}</div>
            </div>
            <div class="task-end">
              <button class="btn btn-secondary btn-sm" type="button" @click="openRecipient(r.id)">Открыть</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-main-aside">
      <div class="stack">

        <div class="card">
          <div class="card-head">
            <div><div class="card-title">Список дел</div><div class="card-sub">Текучка на сегодня, по времени</div></div>
            <span class="tag tag-amber">{{ demoTasks.filter(t => !t.done).length }} активных</span>
          </div>
          <div class="card-body">
            <div class="tasks">
              <div v-for="t in demoTasks" :key="t.id" class="task" :class="{ done: t.done }">
                <span class="task-ic" :class="t.ic" aria-hidden="true">
                  <svg v-if="t.icon === 'check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else-if="t.icon === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                  <svg v-else-if="t.icon === 'printer'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  <svg v-else-if="t.icon === 'scan'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3 3 3-3"/></svg>
                  <svg v-else-if="t.icon === 'diag'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>
                </span>
                <div class="task-main">
                  <div class="t-title">{{ t.title }}</div>
                  <div class="t-sub"><span v-if="t.due" class="due">{{ t.due }}</span><span v-if="t.due && t.sub"> · </span>{{ t.sub }}</div>
                </div>
                <div class="task-end">
                  <span v-if="t.done" class="tag tag-sage">Готово</span>
                  <button v-else class="btn btn-sm" :class="t.primary ? 'btn-primary' : 'btn-secondary'" type="button" @click="t.run && t.run()">{{ t.action }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div><div class="card-title">Заявки в работе</div><div class="card-sub">Общий список — берите свободные в работу</div></div>
            <button class="card-link" type="button" @click="goTo('recipients', 'Реабилитанты')">Все заявки <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
          <div class="card-body">
            <div class="glist">
              <template v-for="g in demoPipeline" :key="g.key">
                <button class="g-head" type="button" :aria-expanded="String(!collapsed[g.key])" @click="toggleGroup(g.key)">
                  <span>{{ g.title }}</span>
                  <span class="g-count">{{ g.items.length }}</span>
                  <span v-if="g.note" class="g-note">{{ g.note }}</span>
                  <span class="g-chev" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span>
                </button>
                <div v-show="!collapsed[g.key]" class="g-body">
                  <div v-for="(m, i) in g.items" :key="i" class="mrow">
                    <span class="avatar" :class="m.av" aria-hidden="true">{{ m.ini }}</span>
                    <div class="m-main">
                      <div class="m-name"><span class="p-link">{{ m.name }}</span></div>
                      <div class="m-sub">{{ m.sub }}</div>
                    </div>
                    <div v-if="m.action || m.phone" class="m-actions">
                      <button v-if="m.phone" class="icon-mini" type="button" :aria-label="'Позвонить представителю ' + m.name"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
                      <button v-if="m.action" class="btn btn-sm" :class="m.primary ? 'btn-primary' : 'btn-secondary'" type="button" @click="m.run && m.run()">{{ m.action }}</button>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <aside class="stack">
        <div class="card">
          <div class="card-head">
            <div class="card-title-sans">Записи на сегодня</div>
            <span class="tag tag-blue">{{ timelineItems.length }}</span>
          </div>
          <div class="card-body">
            <div v-if="loadingToday" class="empty-note">Загрузка…</div>
            <div v-else-if="!timelineItems.length" class="empty-note">На сегодня записей нет</div>
            <div v-else class="timeline">
              <div v-for="ev in timelineItems" :key="ev.id" class="tl-item">
                <div class="tl-time">{{ ev.time }}</div>
                <div class="tl-body">
                  <div class="tl-rail" :class="ev.rail">
                    <div class="tl-name">
                      <button v-if="ev.recipientId" class="p-link" type="button" @click="openRecipient(ev.recipientId)">{{ ev.name }}</button>
                      <template v-else>{{ ev.name }}</template>
                    </div>
                    <div class="tl-sub"><span>{{ ev.sub }}</span></div>
                    <div v-if="ev.rail === 'now'" class="tl-actions">
                      <button class="btn btn-primary btn-sm" type="button" @click="goTo('schedule', 'Расписание')">Открыть</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div class="card-title-sans">Реабилитанты сегодня</div>
            <span class="tag tag-blue">{{ recipientsToday.length }}</span>
          </div>
          <div class="card-body">
            <div v-if="loadingToday" class="empty-note">Загрузка…</div>
            <div v-else-if="!recipientsToday.length" class="empty-note">Сегодня никто не записан</div>
            <div v-else class="mlist">
              <div v-for="r in recipientsToday" :key="r.id" class="mrow">
                <span class="avatar" :class="avatarClass(r.id)" aria-hidden="true">{{ initials(r.name) }}</span>
                <div class="m-main">
                  <div class="m-name">
                    {{ r.name }}
                    <span v-if="r.diagnosis" class="flag-warn lvl-amber" tabindex="0">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      {{ r.diagnosis }}
                      <span class="flag-tip" role="tooltip">Диагноз реабилитанта. Учитывайте при взаимодействии; подробности — в карточке.</span>
                    </span>
                  </div>
                  <div class="m-sub">{{ r.meta }}</div>
                </div>
                <button class="icon-mini" type="button" :aria-label="'Открыть карточку ' + r.name" @click="openRecipient(r.id)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <AddRecipientWizard
      v-if="draftWizardOpen"
      @saved="onDraftSaved"
      @close="closeDraftWizard"
    />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import { useAuthStore } from '../stores/auth';
import api from '../api';
import AddRecipientWizard from '../components/AddRecipientWizard.vue';
import { readDraft, readDraftSavedAt, countDraftFiles, summarizeDraft } from '../utils/recipientDraft';

const pageStore = usePageStore();
const authStore = useAuthStore();

const goTo = (page, label, params) => pageStore.setPage(page, label || page, params || {});
const openRecipient = (id) => {
  if (id) pageStore.setPage('recipient-details', 'Карточка реабилитанта', { recipientId: id });
};

const now = new Date();
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DOW = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const nowMinutes = now.getHours() * 60 + now.getMinutes();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

const todayLabel = computed(() => `${DOW[now.getDay()]}, ${now.getDate()} ${MONTHS_GEN[now.getMonth()]}`);
const greeting = computed(() => {
  const h = now.getHours();
  const part = h < 6 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  const name = authStore.user?.firstName || 'коллега';
  return `${part}, ${name}`;
});

function plural(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
const fullName = (r) => [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' ') || 'Без имени';
const shortName = (r) => [r.lastName, r.firstName].filter(Boolean).join(' ') || (r.email || 'Без имени');
const specialistShort = (u) => (u ? `${(u.firstName || '').charAt(0)}${u.firstName ? '. ' : ''}${u.lastName || ''}`.trim() : '');
const initials = (name) => {
  const parts = (name || '').split(' ').filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '—';
};
const fmtTime = (t) => String(t || '').slice(0, 5);
const toMin = (t) => {
  const [h, m] = String(t || '0:0').split(':');
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0);
};
const AV = ['av-sage', 'av-blue', 'av-amber', 'av-plum', 'av-teal', 'av-rose'];
const avatarClass = (id) => AV[Math.abs(Number(id) || 0) % AV.length];

const activityLabel = (ev) => {
  const base = ev.type === 'diagnostic' ? 'Диагностика' : (ev.title || 'Занятие');
  return ev.direction?.name ? `${base} · ${ev.direction.name}` : base;
};

const searchOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const searchInput = ref(null);
let searchTimer = null;

const toggleSearch = async () => {
  searchOpen.value = !searchOpen.value;
  if (searchOpen.value) {
    await nextTick();
    searchInput.value?.focus();
  }
};
const statusTag = (r) => {
  if (r.status === 'active') return { text: 'активен', cls: 'tag-sage' };
  if (r.status === 'draft') return { text: 'черновик', cls: 'tag-amber' };
  if (r.status === 'archived') return { text: 'в архиве', cls: 'tag-neutral' };
  return null;
};
watch(searchQuery, (q) => {
  clearTimeout(searchTimer);
  const term = q.trim();
  if (!term) { searchResults.value = []; searchLoading.value = false; return; }
  searchLoading.value = true;
  searchTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/recipients', { params: { search: term, limit: 6, page: 1 } });
      searchResults.value = data.data || [];
    } catch (e) {
      console.error('search:', e);
      searchResults.value = [];
    } finally {
      searchLoading.value = false;
    }
  }, 300);
});

const qaOpen = ref(true);

const todayEvents = ref([]);
const loadingToday = ref(true);

const timelineItems = computed(() =>
  todayEvents.value.map((ev) => {
    const s = toMin(ev.startTime);
    const e = toMin(ev.endTime);
    const rail = ev.status === 'completed' ? 'done' : (nowMinutes >= s && nowMinutes < e ? 'now' : '');
    return {
      id: ev.id,
      time: fmtTime(ev.startTime),
      name: ev.recipient ? shortName(ev.recipient) : (ev.title || 'Событие'),
      recipientId: ev.recipient?.id || null,
      sub: activityLabel(ev),
      rail
    };
  })
);

const recipientsToday = computed(() => {
  const map = new Map();
  for (const ev of todayEvents.value) {
    if (!ev.recipient) continue;
    const id = ev.recipient.id;
    if (map.has(id)) continue;
    const meta = [fmtTime(ev.startTime), activityLabel(ev)];
    if (ev.specialist) meta.push(specialistShort(ev.specialist));
    map.set(id, {
      id,
      name: shortName(ev.recipient),
      diagnosis: ev.recipient.diagnosis || '',
      meta: meta.filter(Boolean).join(' · ')
    });
  }
  return [...map.values()];
});

const loadToday = async () => {
  loadingToday.value = true;
  try {
    const { data } = await api.get('/schedule/events', { params: { from: todayStr, to: todayStr } });
    todayEvents.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('schedule:', e);
    todayEvents.value = [];
  } finally {
    loadingToday.value = false;
  }
};

const alertGroups = ref([]);
const alertsError = ref('');
const openTile = ref('');

const loadAlerts = async () => {
  try {
    const { data } = await api.get('/dashboard/employee-alerts');
    alertGroups.value = Array.isArray(data?.groups) ? data.groups : [];
    alertsError.value = '';
  } catch (e) {
    alertsError.value = e?.response?.data?.message || 'Не удалось загрузить сводку';
    alertGroups.value = [];
  }
};

const toggleTile = (t) => {
  if (!t.count) return;
  openTile.value = openTile.value === t.key ? '' : t.key;
};

const draft = ref(null);
const draftSavedAt = ref(null);
const draftLoading = ref(true);
const draftWizardOpen = ref(false);

const loadDraftCard = async () => {
  draftLoading.value = true;
  try {
    const raw = readDraft();
    const files = raw ? await countDraftFiles() : 0;
    draft.value = summarizeDraft(raw, files);
    draftSavedAt.value = draft.value ? readDraftSavedAt() : null;
  } catch (e) {
    console.error('draft:', e);
    draft.value = null;
    draftSavedAt.value = null;
  } finally {
    draftLoading.value = false;
  }
};

const draftsTotal = ref(0);
const loadDraftsTotal = async () => {
  try {
    const { data } = await api.get('/recipients/drafts');
    draftsTotal.value = data.total ?? (data.data || []).length;
  } catch (e) {
    console.error('drafts:', e);
  }
};

const openDraftsTab = () => {
  pageStore.setPage('recipients', 'Реабилитанты', { tab: 'drafts' });
};

const openDraftWizard = () => { draftWizardOpen.value = true; };
const closeDraftWizard = () => {
  draftWizardOpen.value = false;
  loadDraftCard();
  loadDraftsTotal();
};
const onDraftSaved = () => {
  loadAttn();
  loadAlerts();
  loadDraftsTotal();
};

const draftTitle = computed(() => {
  if (!draft.value) return '';
  if (draft.value.name) return draft.value.name;
  if (draft.value.repName) return `Ребёнок ${draft.value.repName}`;
  return 'Имя пока не введено';
});

const savedAgo = (d) => {
  if (!d) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'сохранено только что';
  if (mins < 60) return `сохранено ${mins} ${plural(mins, 'минуту', 'минуты', 'минут')} назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `сохранено ${hours} ${plural(hours, 'час', 'часа', 'часов')} назад`;
  const days = Math.floor(hours / 24);
  return `сохранено ${days} ${plural(days, 'день', 'дня', 'дней')} назад`;
};

const draftSub = computed(() => {
  if (!draft.value) return '';
  const parts = [];
  if (draft.value.name && draft.value.repName) parts.push(`представитель — ${draft.value.repName}`);
  if (draft.value.fileCount) {
    parts.push(`${draft.value.fileCount} ${plural(draft.value.fileCount, 'скан приложен', 'скана приложено', 'сканов приложено')}`);
  }
  const ago = savedAgo(draftSavedAt.value);
  if (ago) parts.push(ago);
  return parts.join(' · ') || 'Регистрация начата, но не завершена';
});

const attnList = ref([]);
const attnCount = ref(0);
const loadAttn = async () => {
  try {
    const { data } = await api.get('/dashboard/missing-docs');
    attnList.value = (data.list || []).filter((r) => r.docCount === 0).slice(0, 4);
    attnCount.value = data.missingCount || attnList.value.length;
  } catch (e) {
    console.error('missing-docs:', e);
  }
};

const ledeText = computed(() => {
  const n = timelineItems.value.length;
  const parts = [`Сегодня ${n} ${plural(n, 'запись', 'записи', 'записей')}.`];
  if (attnCount.value > 0) {
    parts.push(`${attnCount.value} ${plural(attnCount.value, 'реабилитант', 'реабилитанта', 'реабилитантов')} без полного пакета документов.`);
  } else {
    parts.push('Пакеты документов в порядке.');
  }
  return parts.join(' ');
});

const demoTasks = [
  { id: 1, icon: 'check',   ic: 'ic-sage', title: 'Подтвердить запись Елены Петровой на 14:00', sub: 'Выполнено в 09:15', done: true },
  { id: 2, icon: 'users',   ic: 'ic-rose', title: 'Принять семью Романовых', due: 'Запись на 12:30 — сейчас', sub: 'первичная консультация', action: 'Принять', primary: true, run: () => goTo('schedule', 'Расписание') },
  { id: 3, icon: 'printer', ic: 'ic-amber', title: 'Распечатать договор для Елены Петровой', sub: 'К её приходу в 14:00 · подписание договора', action: 'Печать', run: () => goTo('documents', 'Документы') },
  { id: 4, icon: 'scan',    ic: 'ic-teal', title: 'Отсканировать подписанные документы Льва Орлова', sub: 'Нужно для зачисления', action: 'Сканировать', run: () => goTo('documents', 'Документы') },
  { id: 5, icon: 'diag',    ic: 'ic-blue', title: 'Назначить диагностику Ивану Соколову', sub: 'Повторный реабилитант · активной диагностики нет', action: 'Назначить', run: () => goTo('schedule', 'Расписание') },
  { id: 6, icon: 'calendar', ic: 'ic-plum', title: 'Загрузить сканы паспорта Петра Васина', sub: 'Регистрация, этап 2 из 3', action: 'Загрузить', run: () => goTo('documents', 'Документы') }
];

const demoPipeline = [
  { key: 'app', title: 'Заявка', note: '2 не взяты в работу', items: [
    { ini: 'МС', av: 'av-plum', name: 'Максим Семёнов, 9', sub: 'С сайта · 2 ч назад · +7 985 310-42-17', phone: true, action: 'Взять', primary: true },
    { ini: 'ДК', av: 'av-teal', name: 'Дарья Кравцова, 17', sub: 'По телефону · сегодня · +7 926 118-77-40', phone: true, action: 'Взять', primary: true },
    { ini: 'ТБ', av: 'av-rose', name: 'Тимур Беков, 12', sub: 'С сайта · вчера · +7 903 771-02-54', phone: true }
  ] },
  { key: 'cons', title: 'Консультация', items: [
    { ini: 'КР', av: 'av-blue', name: 'Семья Романовых', sub: 'Запись на 12:30 · сегодня', action: 'Принять', run: () => goTo('schedule', 'Расписание') }
  ] },
  { key: 'reg', title: 'Регистрация', items: [
    { ini: 'ПВ', av: 'av-amber', name: 'Пётр Васин, 11', sub: 'Этап 2 из 3 · осталось загрузить сканы', action: 'Продолжить', run: () => goTo('recipients', 'Реабилитанты') },
    { ini: 'АМ', av: 'av-sage', name: 'Анна Морозова, 13', sub: 'Этап 1 из 3 · заполнение данных' }
  ] },
  { key: 'docs', title: 'Документы', items: [
    { ini: 'ДК', av: 'av-blue', name: 'Дмитрий Кузнецов, 10', sub: 'К печати: согласие, договор', action: 'Печать', run: () => goTo('documents', 'Документы') },
    { ini: 'ИС', av: 'av-plum', name: 'Иван Соколов, 16', sub: 'На подписи у представителя' },
    { ini: 'ЛО', av: 'av-sage', name: 'Лев Орлов, 7', sub: 'Подписаны · отсканировать и загрузить в БД', action: 'Сканировать', run: () => goTo('documents', 'Документы') }
  ] },
  { key: 'diag', title: 'Диагностика', items: [
    { ini: 'ОЗ', av: 'av-teal', name: 'Ольга Зайцева, 8', sub: 'Сегодня 13:00 · Е. Титова, каб. 301' },
    { ini: 'ПВ', av: 'av-amber', name: 'Пётр Васин, 11', sub: 'Сегодня 16:00 · М. Громов, каб. 305', action: 'Перенести', run: () => goTo('schedule', 'Расписание') }
  ] },
  { key: 'enr', title: 'Зачисление', items: [
    { ini: 'ЛО', av: 'av-sage', name: 'Лев Орлов, 7', sub: 'Диагностика пройдена · ждёт комплект документов', action: 'Принять документы', run: () => goTo('documents', 'Документы') }
  ] }
];
const collapsed = reactive({});

const toggleGroup = (key) => { collapsed[key] = !collapsed[key]; };

onMounted(() => {
  document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
  loadToday();
  loadAttn();
  loadAlerts();
  loadDraftCard();
  loadDraftsTotal();
});
onUnmounted(() => {
  clearTimeout(searchTimer);
  document.documentElement.style.removeProperty('--bg-app');
});
</script>

<style scoped>
.emp-dash {
  --font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --fs-11: 0.6875rem; --fs-12: 0.75rem;   --fs-13: 0.8125rem;
  --fs-14: 0.875rem;  --fs-15: 0.9375rem; --fs-16: 1rem;
  --fs-18: 1.125rem;  --fs-20: 1.25rem;   --fs-24: 1.5rem;
  --fs-28: 1.75rem;   --fs-32: 2rem;      --fs-40: 2.5rem;

  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem;
  --space-4: 1rem;    --space-5: 1.25rem; --space-6: 1.5rem;
  --space-8: 2rem;
  --tap-min: 2.75rem;

  --canvas: #F7F4ED;
  --paper: #FFFFFF;
  --paper-soft: #F2ECDF;
  --paper-sunken: #E8E1D0;

  --ink: #131713;
  --ink-strong: #0A0D0A;
  --ink-muted: #3A4036;
  --ink-subtle: #4F5749;

  --line: #D6CFBE;
  --line-soft: #E4DECF;
  --line-strong: #B8AF9A;

  --sage-900: #112211; --sage-800: #1B331B; --sage-700: #234623;
  --sage-500: #3F6E3F; --sage-100: #D6E4BE; --sage-50: #EBF2D8;
  --amber-700: #6B3E0E; --amber-500: #B97718; --amber-100: #F2DCB1; --amber-50: #FBF0D6;
  --rose-700: #6B2519;  --rose-500: #B14B39;  --rose-100: #EDCABE;  --rose-50: #F8E2D7;
  --blue-700: #1F3E55;  --blue-500: #41698A;  --blue-100: #C8D7E3;  --blue-50: #E0EAF1;
  --plum-700: #4C2B52;  --plum-500: #845B8B;  --plum-100: #E5D6E8;  --plum-50: #F2E8F5;
  --teal-700: #1E4A4A;  --teal-500: #437A7A;  --teal-100: #D0E5E5;  --teal-50: #E5F0F0;

  --r-sm: 0.375rem; --r-md: 0.625rem; --r-lg: 1rem; --r-xl: 1.375rem;
  --shadow-xs: 0 1px 0 rgba(17,34,17,0.03);
  --shadow-sm: 0 1px 2px rgba(17,34,17,0.04), 0 1px 0 rgba(17,34,17,0.03);
  --shadow-md: 0 0.25rem 0.875rem rgba(17,34,17,0.06), 0 1px 2px rgba(17,34,17,0.04);
  --shadow-lg: 0 0.75rem 2.5rem rgba(17,34,17,0.09), 0 2px 6px rgba(17,34,17,0.04);
  --focus-ring: 0 0 0 0.1875rem rgba(63,110,63,0.9);

  color: var(--ink);
  font-size: var(--fs-15);
  line-height: 1.55;
  animation: empIn 0.4s cubic-bezier(0.2,0.7,0.2,1);
}
@keyframes empIn { from { opacity: 0; transform: translateY(0.5rem); } to { opacity: 1; transform: none; } }

.emp-dash button { cursor: pointer; }

.greet { margin-bottom: var(--space-6); }
.greet-row { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
.greet-row .greet-main { flex: 1; min-width: 16rem; }
.greet .eyebrow { font-size: var(--fs-13); color: var(--ink-muted); font-weight: 500; letter-spacing: 0.01em; }
.greet h1 { font-family: var(--font-serif); font-weight: 600; letter-spacing: -0.025em; color: var(--ink-strong); line-height: 1.06; font-size: var(--fs-40); margin-top: 0.125rem; }
.greet .lede { font-size: var(--fs-16); color: var(--ink-muted); margin-top: var(--space-2); max-width: 46rem; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4375rem; min-height: var(--tap-min); padding: 0.6875rem 1.125rem; border-radius: 0.625rem; font-size: var(--fs-15); font-weight: 500; white-space: nowrap; border: 0.0625rem solid transparent; transition: background 0.15s, border-color 0.15s, color 0.15s; }
.btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.btn-primary { background: var(--sage-900); color: #F4F8EC; border-color: var(--sage-900); }
.btn-primary:hover { background: var(--sage-700); border-color: var(--sage-700); }
.btn-secondary { background: var(--paper); color: var(--ink-strong); border-color: var(--line-strong); }
.btn-secondary:hover { background: var(--paper-soft); border-color: var(--ink-muted); }
.btn-sm { min-height: 2.25rem; padding: 0.4375rem 0.75rem; font-size: var(--fs-14); }

.grid { display: grid; gap: var(--space-5); align-items: start; }
.grid-main-aside { grid-template-columns: minmax(0,1fr) 22rem; }
.stack { display: grid; gap: var(--space-5); align-content: start; min-width: 0; }

.card { background: var(--paper); border: 0.0625rem solid var(--line); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.search-card, .qa-wrap, .attn-block { margin-bottom: var(--space-5); }
.qa-wrap { margin-bottom: var(--space-5); }
.card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem; padding: 1.125rem 1.5rem 0.875rem; border-bottom: 0.0625rem solid var(--line-soft); }
.card-title { font-family: var(--font-serif); font-size: var(--fs-20); font-weight: 600; letter-spacing: -0.015em; color: var(--ink-strong); line-height: 1.2; }
.card-title-sans { font-size: var(--fs-16); font-weight: 600; color: var(--ink-strong); line-height: 1.2; }
.card-sub { font-size: var(--fs-14); color: var(--ink-muted); margin-top: 0.25rem; }
.card-link { font-size: var(--fs-14); font-weight: 500; color: var(--sage-700); display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.4375rem; margin: -0.25rem -0.4375rem; border-radius: var(--r-sm); transition: background 0.15s; background: none; border: none; }
.card-link:hover { background: var(--sage-50); }
.card-link svg { width: 0.875rem; height: 0.875rem; }
.card-body { padding: 1.25rem 1.5rem 1.5rem; }
.empty-note { padding: 1.25rem 0; text-align: center; color: var(--ink-subtle); font-size: var(--fs-14); }

.tag { display: inline-flex; align-items: center; gap: 0.3125rem; font-size: var(--fs-13); padding: 0.1875rem 0.625rem; border-radius: 62.5rem; font-weight: 500; white-space: nowrap; }
.tag-neutral { background: var(--paper-soft); color: var(--ink-muted); }
.tag-blue { background: var(--blue-50); color: var(--blue-700); }
.tag-amber { background: var(--amber-50); color: var(--amber-700); }
.tag-sage { background: var(--sage-50); color: var(--sage-700); }
.tag-rose { background: var(--rose-50); color: var(--rose-700); }

.card.attn { border-left: 0.25rem solid var(--rose-500); }

.tasks { display: flex; flex-direction: column; }
.task { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.task:last-child { border-bottom: 0; padding-bottom: 0; }
.task:first-child { padding-top: 0; }
.task-ic { width: 2.375rem; height: 2.375rem; flex: 0 0 2.375rem; border-radius: var(--r-md); display: grid; place-items: center; }
.task-ic svg { width: 1.125rem; height: 1.125rem; }
.ic-amber { background: var(--amber-50); color: var(--amber-700); }
.ic-rose { background: var(--rose-50); color: var(--rose-700); }
.ic-blue { background: var(--blue-50); color: var(--blue-700); }
.ic-sage { background: var(--sage-50); color: var(--sage-700); }
.ic-plum { background: var(--plum-50); color: var(--plum-700); }
.ic-teal { background: var(--teal-50); color: var(--teal-700); }
.task-main { flex: 1; min-width: 0; }
.task-main .t-title { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); }
.task-main .t-sub { font-size: var(--fs-13); color: var(--ink-muted); margin-top: 0.0625rem; }
.task-main .t-sub .due { color: var(--rose-700); font-weight: 600; }
.task-end { flex: 0 0 auto; }
.task.done .t-title { text-decoration: line-through; color: var(--ink-muted); }
.task.done { opacity: 0.75; }

.timeline { display: flex; flex-direction: column; }
.tl-item { display: grid; grid-template-columns: 4rem 1fr; gap: 0.875rem; padding: 0.875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.tl-item:last-child { border-bottom: 0; padding-bottom: 0; }
.tl-item:first-child { padding-top: 0; }
.tl-time { font-size: var(--fs-14); font-weight: 600; color: var(--ink-strong); font-variant-numeric: tabular-nums; }
.tl-body { min-width: 0; }
.tl-rail { position: relative; padding-left: 1.125rem; }
.tl-rail::before { content: ''; position: absolute; left: 0.3125rem; top: 0.375rem; bottom: -0.875rem; width: 0.125rem; background: var(--line); }
.tl-item:last-child .tl-rail::before { display: none; }
.tl-rail::after { content: ''; position: absolute; left: 0; top: 0.25rem; width: 0.75rem; height: 0.75rem; border-radius: 50%; background: var(--paper); border: 0.1875rem solid var(--sage-500); }
.tl-rail.done::after { background: var(--sage-500); }
.tl-rail.now::after { border-color: var(--amber-500); box-shadow: 0 0 0 0.25rem var(--amber-100); }
.tl-name { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); }
.tl-sub { font-size: var(--fs-13); color: var(--ink-muted); margin-top: 0.125rem; display: flex; flex-wrap: wrap; gap: 0.25rem 0.75rem; }
.tl-actions { margin-top: 0.5rem; display: flex; gap: 0.375rem; flex-wrap: wrap; }

.mlist { display: flex; flex-direction: column; }
.mrow { display: flex; align-items: center; gap: 0.75rem; padding: 0.6875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.mrow:last-child { border-bottom: 0; padding-bottom: 0; }
.mrow:first-child { padding-top: 0; }
.avatar { width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem; border-radius: 50%; display: grid; place-items: center; font-size: var(--fs-13); font-weight: 600; }
.av-amber { background: var(--amber-100); color: var(--amber-700); }
.av-blue { background: var(--blue-100); color: var(--blue-700); }
.av-plum { background: var(--plum-100); color: var(--plum-700); }
.av-sage { background: var(--sage-100); color: var(--sage-700); }
.av-teal { background: var(--teal-100); color: var(--teal-700); }
.av-rose { background: var(--rose-100); color: var(--rose-700); }
.mrow .m-main { flex: 1; min-width: 0; }
.mrow .m-name { font-size: var(--fs-14); font-weight: 600; color: var(--ink-strong); display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.mrow .m-sub { font-size: var(--fs-12); color: var(--ink-muted); margin-top: 0.0625rem; }
.m-actions { display: flex; align-items: center; gap: 0.5rem; flex: 0 0 auto; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }

.glist { display: flex; flex-direction: column; }
.g-head { display: flex; align-items: center; gap: 0.625rem; margin-top: var(--space-4); padding: 0.5625rem 0.875rem; background: var(--paper-soft); border: 0.0625rem solid var(--line-soft); border-radius: var(--r-md); font-family: var(--font-serif); font-size: var(--fs-16); font-weight: 600; letter-spacing: -0.01em; color: var(--ink-strong); width: 100%; text-align: left; }
.glist .g-head:first-child { margin-top: 0; }
.g-count { font-family: var(--font-sans); font-size: var(--fs-12); font-weight: 700; color: var(--ink-strong); background: var(--paper); border: 0.0625rem solid var(--line); border-radius: 62.5rem; padding: 0.0625rem 0.5rem; font-variant-numeric: tabular-nums; }
.g-head .g-note { margin-left: auto; font-family: var(--font-sans); font-size: var(--fs-12); font-weight: 500; color: var(--ink-subtle); }
.g-chev { margin-left: auto; display: grid; place-items: center; color: var(--ink-subtle); }
.g-head .g-note + .g-chev { margin-left: 0.5rem; }
.g-chev svg { width: 0.875rem; height: 0.875rem; transition: transform 0.2s ease; }
.g-head[aria-expanded="false"] .g-chev svg { transform: rotate(-90deg); }
.g-body .mrow { padding-left: 0.875rem; padding-right: 0.875rem; }
.g-body .mrow:first-child { padding-top: 0.6875rem; }

.p-link { display: inline; padding: 0; font: inherit; font-weight: inherit; color: inherit; background: none; border: none; border-bottom: 0.0625rem dashed var(--line-strong); border-radius: 0.125rem; cursor: pointer; transition: color 0.15s, border-color 0.15s; }
.p-link:hover { color: var(--sage-700); border-bottom-color: var(--sage-500); }

.search-wrap { position: relative; }
.search-wrap svg { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); width: 1.125rem; height: 1.125rem; color: var(--ink-subtle); pointer-events: none; }
.search-input { width: 100%; min-height: 3.25rem; padding: 0.75rem 1rem 0.75rem 2.75rem; font: inherit; font-size: var(--fs-16); color: var(--ink); background: var(--paper); border: 0.0625rem solid var(--line-strong); border-radius: var(--r-md); transition: border-color 0.15s, box-shadow 0.15s; }
.search-input::placeholder { color: var(--ink-subtle); }
.search-input:focus-visible { outline: none; border-color: var(--sage-500); box-shadow: var(--focus-ring); }
.search-hint { font-size: var(--fs-13); color: var(--ink-muted); margin-top: 0.5rem; display: flex; align-items: center; gap: 0.4375rem; }
.search-hint svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; color: var(--sage-700); }
.search-results { margin-top: 0.5rem; }
.sr-row { display: flex; align-items: center; gap: 0.875rem; flex-wrap: wrap; padding: 0.75rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.sr-row:last-child { border-bottom: 0; padding-bottom: 0; }
.sr-main { flex: 1; min-width: 12rem; }
.sr-name { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.sr-sub { font-size: var(--fs-13); color: var(--ink-muted); margin-top: 0.125rem; }
.sr-sub .warn { color: var(--amber-700); font-weight: 600; }
.sr-empty { font-size: var(--fs-14); color: var(--ink-muted); padding: 0.75rem 0 0.25rem; }
.sr-actions { display: flex; gap: 0.375rem; flex: 0 0 auto; }

.flag-warn { position: relative; display: inline-flex; align-items: center; gap: 0.25rem; font-size: var(--fs-12); font-weight: 700; white-space: nowrap; color: var(--rose-700); background: var(--rose-50); border: 0.0625rem solid var(--rose-100); padding: 0.0625rem 0.5rem; border-radius: 62.5rem; cursor: help; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.flag-warn svg { width: 0.75rem; height: 0.75rem; flex: 0 0 0.75rem; }
.flag-warn.lvl-amber { color: var(--amber-700); background: var(--amber-50); border-color: var(--amber-100); }
.flag-warn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.flag-tip { position: absolute; bottom: calc(100% + 0.5rem); left: 0; z-index: 30; width: max-content; max-width: 18rem; white-space: normal; background: var(--ink-strong); color: #F4F3EE; font-size: var(--fs-13); font-weight: 400; line-height: 1.45; padding: 0.625rem 0.75rem; border-radius: var(--r-md); box-shadow: var(--shadow-lg); opacity: 0; pointer-events: none; transform: translateY(0.25rem); transition: opacity 0.15s ease, transform 0.15s ease; }
.flag-tip::after { content: ''; position: absolute; top: 100%; left: 0.875rem; border: 0.375rem solid transparent; border-top-color: var(--ink-strong); }
.flag-warn:hover .flag-tip, .flag-warn:focus-visible .flag-tip, .flag-warn:focus-within .flag-tip { opacity: 1; transform: none; }

.icon-mini { width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem; display: grid; place-items: center; border-radius: 50%; border: 0.0625rem solid var(--line-strong); background: var(--paper); color: var(--ink-muted); transition: background 0.15s, color 0.15s, border-color 0.15s; }
.icon-mini:hover { background: var(--sage-50); color: var(--sage-700); border-color: var(--sage-500); }
.icon-mini svg { width: 1rem; height: 1rem; }

.qa-head { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.625rem; }
.section-eyebrow { font-size: var(--fs-12); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: var(--ink-muted); }
.qa-collapse { width: 1.75rem; height: 1.75rem; flex: 0 0 1.75rem; display: grid; place-items: center; border-radius: var(--r-sm); color: var(--ink-muted); background: none; border: none; transition: background 0.15s, color 0.15s; }
.qa-collapse:hover { background: var(--paper-soft); color: var(--ink-strong); }
.qa-collapse svg { width: 0.875rem; height: 0.875rem; transition: transform 0.2s ease; }
.qa-collapse[aria-expanded="false"] svg { transform: rotate(-90deg); }
.qa { display: grid; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); gap: 0.75rem; }
.qa-btn { display: flex; align-items: center; gap: 0.75rem; text-align: left; background: var(--paper); border: 0.0625rem solid var(--line); border-radius: var(--r-lg); padding: 1rem 1.125rem; box-shadow: var(--shadow-sm); transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; min-height: var(--tap-min); }
.qa-btn:hover { border-color: var(--sage-500); box-shadow: var(--shadow-md); transform: translateY(-0.0625rem); }
.qa-ic { width: 2.5rem; height: 2.5rem; flex: 0 0 2.5rem; border-radius: var(--r-md); display: grid; place-items: center; }
.qa-ic svg { width: 1.1875rem; height: 1.1875rem; }
.qa-txt .qa-t { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); }

.err-bar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; background: var(--rose-50); border: 0.0625rem solid var(--rose-100); color: var(--rose-700); border-radius: var(--r-md); padding: 0.75rem 1rem; font-size: var(--fs-14); margin-bottom: var(--space-5); }

.alerts { margin-bottom: var(--space-5); }
.alerts-head { margin-bottom: 0.625rem; }
.alerts-sub { font-size: var(--fs-13); color: var(--ink-subtle); margin-top: 0.125rem; }

.tiles { display: grid; gap: 0.75rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }

.tile { background: var(--paper); border: 0.0625rem solid var(--line); border-radius: var(--r-lg); box-shadow: var(--shadow-sm); overflow: hidden; transition: border-color 0.15s, box-shadow 0.15s; }
.tile.open { border-color: var(--line-strong); box-shadow: var(--shadow-md); }

.tile-btn { display: flex; flex-direction: column; align-items: stretch; gap: 0.125rem; width: 100%; text-align: left; background: none; border: none; padding: 1rem 1.125rem 1.0625rem; transition: background 0.15s; }
.tile-btn:not(:disabled):hover { background: var(--paper-soft); }
.tile-btn:disabled { cursor: default; }

.tile-title { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); line-height: 1.25; }
.tile-chevron { width: 0.8125rem; height: 0.8125rem; flex: 0 0 0.8125rem; color: var(--ink-subtle); transition: transform 0.2s ease; }
.tile.open .tile-chevron { transform: rotate(180deg); }

.tile-meta { font-size: var(--fs-13); color: var(--ink-subtle); line-height: 1.35; min-height: 1.15rem; }

.tile-num { display: flex; align-items: baseline; gap: 0.4375rem; margin-top: 0.75rem; }
.tile-num b { font-family: var(--font-serif); font-size: var(--fs-40); font-weight: 600; letter-spacing: -0.03em; line-height: 1; }
.tile-num i { font-style: normal; font-size: var(--fs-14); font-weight: 500; }

.tone-rose .tile-num b { color: var(--rose-500); }
.tone-rose .tile-num i { color: var(--rose-700); }
.tone-amber .tile-num b { color: var(--amber-500); }
.tone-amber .tile-num i { color: var(--amber-700); }
.tone-calm .tile-num b { color: var(--sage-500); }
.tone-calm .tile-num i { color: var(--ink-subtle); }
.tone-calm .tile-meta { color: var(--sage-700); }

.tile-list { border-top: 0.0625rem solid var(--line-soft); background: var(--paper-soft); }
.tl-row { display: flex; align-items: center; gap: 0.625rem; width: 100%; text-align: left; background: none; border: none; border-bottom: 0.0625rem solid var(--line-soft); padding: 0.625rem 1.125rem; min-height: var(--tap-min); transition: background 0.15s; }
.tl-row:hover { background: var(--paper); }
.tl-main { display: grid; gap: 0.0625rem; min-width: 0; flex: 1; }
.tl-name { font-size: var(--fs-14); font-weight: 600; color: var(--ink-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-note { font-size: var(--fs-12); color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-days { font-size: var(--fs-12); font-weight: 600; color: var(--ink-subtle); white-space: nowrap; }
.tl-all { display: block; width: 100%; text-align: left; background: none; border: none; padding: 0.625rem 1.125rem; font-size: var(--fs-13); font-weight: 500; color: var(--sage-700); min-height: var(--tap-min); transition: background 0.15s; }
.tl-all:hover { background: var(--paper); }

.draft { margin-bottom: var(--space-5); }

.dr-empty-t { font-size: var(--fs-15); font-weight: 600; color: var(--ink-strong); }
.dr-empty-s { font-size: var(--fs-13); color: var(--ink-subtle); line-height: 1.45; margin-top: 0.1875rem; max-width: 44rem; }

.dr-body { display: grid; gap: 1rem; }
.dr-top { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.dr-id { flex: 1; min-width: 11rem; }
.dr-name { font-size: var(--fs-16); font-weight: 600; color: var(--ink-strong); }
.dr-sub { font-size: var(--fs-13); color: var(--ink-subtle); margin-top: 0.0625rem; }

.dr-progress { display: grid; gap: 0.375rem; }
.dr-bar { height: 0.4375rem; border-radius: 62.5rem; background: var(--paper-sunken); overflow: hidden; }
.dr-bar span { display: block; height: 100%; border-radius: 62.5rem; background: var(--amber-500); transition: width 0.25s ease; }
.dr-figures { font-size: var(--fs-13); color: var(--ink-muted); }
.dr-figures b { font-weight: 700; color: var(--ink-strong); }

.dr-steps { display: grid; gap: 0.75rem; }
.dr-step-head { display: flex; align-items: baseline; justify-content: space-between; gap: 0.5rem; font-size: var(--fs-13); font-weight: 600; color: var(--ink-strong); margin-bottom: 0.375rem; }
.dr-step-num { font-weight: 500; color: var(--ink-subtle); white-space: nowrap; }
.dr-chips { display: flex; flex-wrap: wrap; gap: 0.3125rem; }
.dr-chip { font-size: var(--fs-12); padding: 0.1875rem 0.5rem; border-radius: var(--r-sm); background: var(--amber-50); color: var(--amber-700); border: 0.0625rem solid var(--amber-100); }
.dr-step-done { font-size: var(--fs-13); color: var(--sage-700); background: var(--sage-50); border: 0.0625rem solid var(--sage-100); border-radius: var(--r-md); padding: 0.625rem 0.75rem; line-height: 1.45; }

.dr-note { display: flex; align-items: flex-start; gap: 0.5rem; margin: 0; font-size: var(--fs-12); color: var(--ink-subtle); line-height: 1.45; }
.dr-note svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; margin-top: 0.125rem; }

.dr-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 0.875rem; flex-wrap: wrap; }
.dr-all-btn { flex: 0 0 auto; }

@media (max-width: 75rem) {
  .grid-main-aside { grid-template-columns: 1fr; }
  .qa { grid-template-columns: 1fr 1fr; }
  .tiles { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 36rem) {
  .greet h1 { font-size: var(--fs-32); }
  .qa { grid-template-columns: 1fr; }
  .tiles { grid-template-columns: 1fr; }
  .dr-top .btn { width: 100%; }
}
</style>
