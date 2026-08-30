<template>
  <div class="rd-page">
    <div v-if="loading" class="rd-loading">
      <div class="spinner"></div>
      <p>Загрузка профиля…</p>
    </div>

    <div v-else-if="!recipient" class="rd-empty">
      <p>Реабилитант не найден</p>
      <button class="btn btn-secondary" @click="goBack">← К списку</button>
    </div>

    <template v-else>

      <nav class="breadcrumb" aria-label="Хлебные крошки">
        <a class="bc-link" @click="goBack">Реабилитанты</a>
        <span class="sep" aria-hidden="true">/</span>
        <span class="current">{{ fullName(recipient) }}</span>
      </nav>

      <div v-if="alertCount" class="alert" role="alert">
        <span class="alert-ic" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </span>
        <div class="alert-body">
          <div class="alert-title">{{ alertLabel }}</div>
          <div class="alert-text">
            <template v-if="expiredDocs.length">
              Просрочено: {{ expiredDocs.map(d => `${d.label} (до ${formatDate(d.date)})`).join(', ') }}.
            </template>
            <template v-if="allMissingNames.length">
              Не загружены: {{ allMissingNames.join(', ') }}.
            </template>
          </div>
        </div>
        <button v-if="canEditDocs" type="button" class="btn btn-primary" @click="goFixDocs">
          Обновить документы
        </button>
      </div>

      <section class="hero" aria-label="Сводка по реабилитанту">
        <div class="hero-body">
          <button
            v-if="photoUrl" type="button" class="hero-ava-btn"
            @click="heroPhotoOpen = true" aria-label="Открыть фото на весь экран"
          >
            <img :src="photoUrl" class="hero-ava" alt="" />
            <span class="hero-ava-zoom" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </span>
          </button>
          <div v-else class="hero-ava" aria-hidden="true">{{ initials(recipient) }}</div>

          <div>
            <div class="hero-id">
              <span class="id-chip">R-{{ recipientCode }}</span>
              <span class="status" :class="statusDotClass">{{ statusLabel(recipient.status) }}</span>
              <span v-if="stageChip" class="stage-chip">{{ stageChip }}</span>
            </div>

            <div class="hero-name-row">
              <h1 class="hero-name">{{ fullName(recipient) }}</h1>
              <button v-if="canEditCard" type="button" class="icon-btn" @click="openCardEdit"
                      aria-label="Редактировать карточку" title="Редактировать карточку">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
              </button>
            </div>

            <div class="hero-tags">
              <span v-if="age != null" class="tag tag-neutral">{{ age }} {{ yearsWord(age) }}<template v-if="recipient.birthDate"> · род. {{ formatDate(recipient.birthDate) }}</template></span>
              <span v-if="crgShort" class="tag tag-sage">ЦРГ {{ crgShort }}</span>
              <span v-if="cycleTag" class="tag tag-cycle">{{ cycleTag }}</span>
            </div>
          </div>

          <div class="hero-actions">
            <a v-if="repPhoneHref" class="btn btn-secondary" :href="repPhoneHref">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Позвонить представителю
            </a>
            <button class="btn btn-secondary" type="button" @click="goBack">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              К списку
            </button>
          </div>
        </div>

        <div class="route">
          <div class="route-head">
            <span class="route-label">Маршрут реабилитанта</span>
            <span v-if="lifecycleStages.length" class="route-done">
              Пройдено {{ lifecycle.doneCount }} из {{ lifecycleStages.length }}
            </span>
          </div>

          <ol v-if="lifecycleStages.length" class="steps">
            <li v-for="s in lifecycleStages" :key="s.key" class="step" :class="[s.state, { warn: s.warn }]">
              <span class="step-num">{{ s.num }}</span>
              <button type="button" class="step-name"
                      :title="`${s.hint} — открыть «${stageTabLabel(s.key)}»`"
                      @click="goStage(s.key)">
                {{ s.label }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <span v-if="s.state === 'current'" class="step-mark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12.5"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Нужно действие
              </span>
            </li>
          </ol>
          <div v-else class="route-load">
            {{ readinessLoading ? 'Считаем маршрут…' : 'Маршрут пока не рассчитан' }}
          </div>
        </div>
      </section>

      <div class="tabs" role="tablist" aria-label="Разделы карточки">
        <button v-for="t in tabs" :key="t.id"
          class="tab" role="tab" type="button"
          :aria-selected="activeTab === t.id"
          @click="activeTab = t.id">
          {{ t.label }}
          <span
            v-if="t.id === 'profile' && docAlertCount"
            class="tab-alert"
            role="img"
            :aria-label="docAlertLabel"
            :title="docAlertLabel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {{ docAlertCount }}
          </span>
          <span
            v-else-if="t.id === 'enrollment' && enrollAlertCount"
            class="tab-alert"
            role="img"
            :aria-label="enrollAlertLabel"
            :title="enrollAlertLabel"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {{ enrollAlertCount }}
          </span>
          <span v-else-if="t.id === 'lessons' && lessonsCount" class="tab-count">{{ lessonsCount }}</span>
          <span v-else-if="t.id === 'diagnostics' && diagCount" class="tab-count">{{ diagCount }}</span>
          <span v-else-if="t.id === 'documents' && scans.length" class="tab-count">{{ scans.length }}</span>
        </button>
      </div>

      <div v-if="activeTab === 'overview'" class="tabpanel">
        <div class="grid">
          <div class="col">
            <section class="card">
              <div class="card-head"><h2 class="card-title">Ключевые сведения</h2></div>
              <div class="card-body">
                <dl class="kv-grid">
                  <div class="kv">
                    <dt class="kv-key">Дата рождения</dt>
                    <dd class="kv-val"><span class="kv-text">{{ formatDate(recipient.birthDate) }}<template v-if="age != null"> · {{ age }} {{ yearsWord(age) }}</template></span></dd>
                  </div>
                  <div class="kv">
                    <dt class="kv-key">Группа инвалидности</dt>
                    <dd class="kv-val"><span class="kv-text">{{ recipient.disableGroup || '—' }}</span></dd>
                  </div>
                  <div class="kv kv-full">
                    <dt class="kv-key">Целевая реабилитационная группа (ЦРГ)</dt>
                    <dd class="kv-val"><span class="kv-text"><span v-if="recipient.crgMain?.code" class="code">{{ recipient.crgMain.code }}</span>{{ recipient.crgMain?.name || crgText }}</span></dd>
                  </div>
                  <div class="kv kv-full">
                    <dt class="kv-key">Место обучения</dt>
                    <dd class="kv-val"><span class="kv-text">{{ doc?.educationPlace || '—' }}</span></dd>
                  </div>
                  <div class="kv">
                    <dt class="kv-key">Округ проживания</dt>
                    <dd class="kv-val"><span class="kv-text"><span v-if="district?.code" class="code">{{ district.code }}</span>{{ district?.name || '—' }}</span></dd>
                  </div>
                  <div class="kv">
                    <dt class="kv-key">Группа</dt>
                    <dd class="kv-val"><span class="kv-text">{{ groupName || 'Не зачислен в группу' }}</span></dd>
                  </div>
                  <div class="kv">
                    <dt class="kv-key">Куратор</dt>
                    <dd class="kv-val"><span class="kv-text">{{ curatorName || '—' }}</span></dd>
                  </div>

                  <div class="kv kv-full" :class="{ 'is-secret': isLocked('medical') }">
                    <dt class="kv-key">Диагноз</dt>
                    <dd class="kv-val">
                      <template v-if="isLocked('medical')">
                        <span class="kv-mask">••••••••••••</span>
                        <span class="kv-tools">
                          <button type="button" class="kv-tool" title="Показать данные"
                                  aria-label="Показать диагноз — с указанием причины"
                                  @click="openReveal('medical')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </span>
                      </template>
                      <span v-else class="kv-text">{{ recipient.diagnosis || '—' }}</span>
                    </dd>
                  </div>
                </dl>
              </div>
              <button type="button" class="card-foot" @click="activeTab = 'profile'">Анкета и медкарта
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>
          </div>

          <aside class="col">
            <section class="card">
              <div class="card-head"><h2 class="card-title-sans">Законный представитель</h2></div>
              <div class="card-body">
                <div v-if="!recipient.representative" class="empty">Представитель не указан</div>
                <div v-else class="person">
                  <div class="person-ava" aria-hidden="true">{{ initials(recipient.representative) }}</div>
                  <div class="person-info">
                    <div class="person-name">{{ fullName(recipient.representative) }}</div>
                    <div class="person-role">{{ repRoleLine }}</div>
                  </div>
                  <a v-if="repPhoneHref" class="icon-btn icon-btn-sm" :href="repPhoneHref" aria-label="Позвонить представителю">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </a>
                </div>
              </div>
              <button v-if="recipient.representative" type="button" class="card-foot" @click="activeTab = 'representative'">Данные представителя
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>

            <section class="card">
              <div class="card-head"><h2 class="card-title-sans">Ближайшие события</h2></div>
              <div class="card-body">
                <div v-if="agendaLoading && !upcoming.length" class="rd-loading" style="min-height:5.625rem"><div class="spinner"></div></div>
                <div v-else-if="!upcoming.length" class="empty">Запланированных событий нет</div>
                <template v-else>
                  <div v-for="(ev, i) in upcoming" :key="i" class="event">
                    <div class="event-date" :class="{ 'is-cycle': ev.type === 'diagnostic' }">
                      <span class="event-day">{{ dayNum(ev.date) }}</span>
                      <span class="event-mon">{{ monthShort(ev.date) }}</span>
                    </div>
                    <div class="event-info">
                      <div class="event-title">{{ ev.title }}</div>
                      <div class="event-meta">{{ ev.meta }}</div>
                    </div>
                  </div>
                </template>
              </div>
            </section>

            <section class="card">
              <div class="card-head">
                <h2 class="card-title-sans">История диагностики</h2>
                <span v-if="diagHistoryRows.length" class="badge">{{ diagHistoryRows.length }}</span>
              </div>
              <div class="card-body">
                <div v-if="!diagHistoryRows.length" class="empty">Диагностик пока не было</div>
                <template v-else>
                  <div v-for="r in diagHistoryRows" :key="r.id" class="event">
                    <div class="event-date is-cycle">
                      <span class="event-day">{{ dayNum(r.date) }}</span>
                      <span class="event-mon">{{ monthShort(r.date) }}</span>
                    </div>
                    <div class="event-info">
                      <div class="event-title">{{ r.title }}</div>
                      <div class="event-meta"><span class="pill" :class="r.pill">{{ r.pillText }}</span></div>
                    </div>
                  </div>
                </template>
              </div>
              <button type="button" class="card-foot" @click="activeTab = 'diagnostics'">Все циклы и результаты
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>
          </aside>
        </div>
      </div>

      <div v-else-if="activeTab === 'profile'" class="tabpanel">
        <div class="split">

          <section class="card">
            <div class="card-head">
              <h2 class="card-title">Личные данные</h2>
              <button v-if="canEditCard" type="button" class="icon-btn icon-btn-sm"
                      aria-label="Редактировать карточку" title="Редактировать карточку" @click="openCardEdit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>
              </button>
            </div>
            <div class="card-body">
              <dl class="kv-grid">
                <div class="kv kv-full"><dt class="kv-key">ФИО</dt><dd class="kv-val"><span class="kv-text">{{ fullName(recipient) || '—' }}</span></dd></div>
                <div class="kv"><dt class="kv-key">Дата рождения</dt><dd class="kv-val"><span class="kv-text">{{ formatDate(recipient.birthDate) }}<template v-if="age != null"> · {{ age }} {{ yearsWord(age) }}</template></span></dd></div>
                <div class="kv"><dt class="kv-key">Группа инвалидности</dt><dd class="kv-val"><span class="kv-text">{{ recipient.disableGroup || '—' }}</span></dd></div>
                <div class="kv kv-full"><dt class="kv-key">Место обучения</dt><dd class="kv-val"><span class="kv-text">{{ doc?.educationPlace || '—' }}</span></dd></div>

                <div class="kv" :class="{ 'is-secret': isLocked('contacts') }">
                  <dt class="kv-key">Телефон</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('contacts')">
                      <span class="kv-mask">••• ••• •• ••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать телефон — с указанием причины" @click="openReveal('contacts')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ recipient.telephone || '—' }}</span>
                  </dd>
                </div>
                <div class="kv" :class="{ 'is-secret': isLocked('contacts') }">
                  <dt class="kv-key">E-mail</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('contacts')">
                      <span class="kv-mask">•••••••••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать e-mail — с указанием причины" @click="openReveal('contacts')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ recipient.email || recipient.user?.email || '—' }}</span>
                  </dd>
                </div>
                <div class="kv kv-full" :class="{ 'is-secret': isLocked('contacts') }">
                  <dt class="kv-key">Адрес регистрации</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('contacts')">
                      <span class="kv-mask">••••••••••••••••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать адрес регистрации — с указанием причины" @click="openReveal('contacts')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ doc?.regAddress || '—' }}</span>
                  </dd>
                </div>
                <div class="kv kv-full" :class="{ 'is-secret': isLocked('contacts') }">
                  <dt class="kv-key">Адрес проживания</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('contacts')">
                      <span class="kv-mask">••••••••••••••••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать адрес проживания — с указанием причины" @click="openReveal('contacts')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ doc?.factSameReg ? 'Совпадает с адресом регистрации' : (doc?.factAddress || '—') }}</span>
                  </dd>
                </div>

                <div class="kv"><dt class="kv-key">Округ проживания</dt><dd class="kv-val"><span class="kv-text"><span v-if="district?.code" class="code">{{ district.code }}</span>{{ district?.name || '—' }}</span></dd></div>
                <div class="kv"><dt class="kv-key">Район</dt><dd class="kv-val"><span class="kv-text">{{ doc?.area || '—' }}</span></dd></div>
              </dl>

              <p class="subtitle" style="margin-top:1.25rem;">Документ, удостоверяющий личность</p>
              <div v-if="isLocked('passport')" class="pd-note">
                <span class="pd-note-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <span class="pd-note-text">Паспортные данные и СНИЛС закрыты по 152-ФЗ. Доступ открывается на {{ revealMinutes }} минут, причина попадает в журнал.</span>
                <button type="button" class="pd-note-btn" @click="openReveal('passport')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  Показать
                </button>
              </div>

              <dl class="kv-grid">
                <div class="kv"><dt class="kv-key">Тип документа</dt><dd class="kv-val"><span class="kv-text">{{ doc?.docType || '—' }}</span></dd></div>

                <div class="kv" :class="{ 'is-secret': isLocked('passport') }">
                  <dt class="kv-key">Серия / номер</dt>
                  <dd class="kv-val">
                    <span v-if="isLocked('passport')" class="kv-mask">•••• ••••••</span>
                    <span v-else class="kv-text">{{ [doc?.docSeries, doc?.docNumber].filter(Boolean).join(' ') || '—' }}</span>
                    <span class="kv-tools">
                      <button v-if="isLocked('passport')" type="button" class="kv-tool" title="Показать данные" aria-label="Показать серию и номер — с указанием причины" @click="openReveal('passport')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button type="button" class="kv-tool" title="Открыть документ" aria-label="Открыть скан документа, удостоверяющего личность" @click="openScanByCode('birth')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </button>
                    </span>
                  </dd>
                </div>

                <div class="kv kv-full" :class="{ 'is-secret': isLocked('passport') }">
                  <dt class="kv-key">Кем выдан</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('passport')">
                      <span class="kv-mask">••••••••••••••••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать, кем выдан документ — с указанием причины" @click="openReveal('passport')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ doc?.docIssuer || '—' }}<template v-if="doc?.docIssuerDate"> · {{ formatDate(doc.docIssuerDate) }}</template></span>
                  </dd>
                </div>

                <div class="kv kv-full" :class="{ 'is-secret': isLocked('passport') }">
                  <dt class="kv-key">СНИЛС</dt>
                  <dd class="kv-val">
                    <span v-if="isLocked('passport')" class="kv-mask">•••-•••-••• ••</span>
                    <span v-else class="kv-text">{{ doc?.snils || '—' }}</span>
                    <span class="kv-tools">
                      <button v-if="isLocked('passport')" type="button" class="kv-tool" title="Показать данные" aria-label="Показать СНИЛС — с указанием причины" @click="openReveal('passport')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button type="button" class="kv-tool" title="Открыть документ" aria-label="Открыть скан СНИЛС" @click="openScanByCode('snils')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </button>
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section class="card">
            <div class="card-head">
              <h2 class="card-title">Медкарта и документы</h2>
              <button v-if="canEditDocs && doc" type="button" class="icon-btn icon-btn-sm"
                      aria-label="Обновить документы" title="Обновить документы" @click="openDocUpdate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              </button>
            </div>
            <div class="card-body">
              <dl class="kv-grid">
                <div class="kv kv-full"><dt class="kv-key">Целевая реабилитационная группа (ЦРГ)</dt><dd class="kv-val"><span class="kv-text"><span v-if="recipient.crgMain?.code" class="code">{{ recipient.crgMain.code }}</span>{{ recipient.crgMain?.name || crgText }}</span></dd></div>
                <div class="kv kv-full"><dt class="kv-key">Тип документа</dt><dd class="kv-val"><span class="kv-text">{{ doc?.docType || '—' }}</span></dd></div>
              </dl>

              <div v-if="isLocked('medical')" class="pd-note" style="margin-top:.75rem;">
                <span class="pd-note-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <span class="pd-note-text">Сведения о здоровье — специальная категория персональных данных (ст. 10 152-ФЗ). Показываются по запросу с указанием причины.</span>
                <button type="button" class="pd-note-btn" @click="openReveal('medical')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  Показать медданные
                </button>
              </div>

              <dl class="kv-grid">
                <div class="kv kv-full" :class="{ 'is-secret': isLocked('medical') }">
                  <dt class="kv-key">Диагноз</dt>
                  <dd class="kv-val">
                    <span v-if="isLocked('medical')" class="kv-mask">••••••••••••••</span>
                    <span v-else class="kv-text">{{ recipient.diagnosis || '—' }}</span>
                    <span class="kv-tools">
                      <button v-if="isLocked('medical')" type="button" class="kv-tool" title="Показать данные" aria-label="Показать диагноз — с указанием причины" @click="openReveal('medical')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button type="button" class="kv-tool" title="Открыть документ" aria-label="Открыть медицинскую справку" @click="openScanByCode('med')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </button>
                    </span>
                  </dd>
                </div>

                <div class="kv kv-full" :class="{ 'is-secret': isLocked('medical') }">
                  <dt class="kv-key">Нозология (МКБ-10)</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('medical')">
                      <span class="kv-mask">••• ••••••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать нозологию — с указанием причины" @click="openReveal('medical')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text"><span v-if="recipient.nozologyRef?.class" class="code">{{ recipient.nozologyRef.class }}</span>{{ nozologyName }}</span>
                  </dd>
                </div>

                <div class="kv" :class="{ 'is-secret': isLocked('medical') }">
                  <dt class="kv-key">МСЭ, дата выдачи</dt>
                  <dd class="kv-val">
                    <span v-if="isLocked('medical')" class="kv-mask">••.••.••••</span>
                    <span v-else class="kv-text">{{ formatDate(doc?.mseIssueDate) }}</span>
                    <span class="kv-tools">
                      <button v-if="isLocked('medical')" type="button" class="kv-tool" title="Показать данные" aria-label="Показать дату выдачи МСЭ — с указанием причины" @click="openReveal('medical')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button type="button" class="kv-tool" title="Открыть документ" aria-label="Открыть справку МСЭ" @click="openScanByCode('mse')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </button>
                    </span>
                  </dd>
                </div>

                <div class="kv" :class="{ 'is-secret': isLocked('medical') }">
                  <dt class="kv-key">МСЭ, срок действия</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('medical')">
                      <span class="kv-mask">••.••.••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать срок действия МСЭ — с указанием причины" @click="openReveal('medical')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ mseValidText(doc) }}</span>
                  </dd>
                </div>

                <div class="kv kv-full" :class="{ 'is-secret': isLocked('medical') }">
                  <dt class="kv-key">Особые отметки</dt>
                  <dd class="kv-val">
                    <template v-if="isLocked('medical')">
                      <span class="kv-mask">••••••••••••••</span>
                      <span class="kv-tools">
                        <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать особые отметки — с указанием причины" @click="openReveal('medical')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </span>
                    </template>
                    <span v-else class="kv-text">{{ doc?.specialNote || '—' }}</span>
                  </dd>
                </div>
              </dl>
            </div>
            <button type="button" class="card-foot" @click="activeTab = 'documents'">Прикреплённые файлы
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </section>
        </div>
      </div>

      <div v-else-if="activeTab === 'documents'" class="tabpanel">
        <div class="subtabs" role="tablist" aria-label="Разделы документов">
          <button type="button" class="subtab" role="tab" :aria-selected="docSub === 'files'" @click="docSub = 'files'">Файлы</button>
          <button type="button" class="subtab" role="tab" :aria-selected="docSub === 'history'" @click="docSub = 'history'">Журнал изменений</button>
        </div>

        <div v-if="docSub === 'files'">
          <div v-if="canUploadScans && !scansLocked" class="docs-add">
            <button type="button" class="btn btn-primary" @click="openUpload(null)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Загрузить документ
            </button>
          </div>

          <div v-if="scansLoading && !docGroups.length" class="rd-loading" style="min-height:7.5rem"><div class="spinner"></div></div>

          <section v-else-if="scansLocked" class="card">
            <div class="card-head"><h2 class="card-title">Сканы документов</h2></div>
            <div class="card-body">
              <div class="pd-note">
                <span class="pd-note-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <span class="pd-note-text">Сканы документов закрыты по 152-ФЗ. Доступ открывается на {{ revealMinutes }} минут, причина попадает в журнал.</span>
                <button type="button" class="pd-note-btn" @click="openReveal('scans')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                  Показать
                </button>
              </div>
            </div>
          </section>

          <div v-else-if="!docGroups.length" class="empty">Список типов документов не загружен</div>

          <div v-else class="split">
            <div class="col">
              <section v-for="g in docGroupsLeft" :key="g.key" class="card">
                <div class="card-head">
                  <h2 class="card-title-sans">{{ g.title }}</h2>
                  <span class="pill" :class="groupPill(g).cls">{{ groupPill(g).text }}</span>
                </div>
                <div class="card-body">
                  <dl class="doc-table">
                    <div v-for="r in g.rows" :key="r.code" class="doc-tr" :class="{ 'is-missing': !r.scan && r.required }">
                      <dt class="doc-k">
                        <span class="doc-name">{{ r.name }}</span>
                        <span class="doc-req">{{ r.required ? 'обязательный' : 'по желанию' }}</span>
                      </dt>
                      <dd class="doc-v">
                        <div class="doc-state">
                          <span class="pill" :class="r.state.cls">{{ r.state.text }}</span>
                          <span v-if="r.versions > 1" class="doc-ver">вер. {{ r.versions }}</span>
                          <div v-if="r.term" class="doc-term">{{ r.term }}</div>
                        </div>
                        <div v-if="r.scan" class="doc-file">
                          {{ r.scan.originalName }} · {{ formatSize(r.scan.sizeBytes) }}<template v-if="r.scan.uploadedAt"> · {{ formatDate(r.scan.uploadedAt) }}</template>, {{ uploaderName(r.scan) }}
                        </div>
                        <div class="doc-acts">
                          <template v-if="r.scan">
                            <button type="button" class="doc-act" :aria-label="'Открыть: ' + r.name" @click="openScanDoc(r.scan)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                              Открыть
                            </button>
                            <button v-if="canEditDocs" type="button" class="doc-act" :aria-label="'Новая версия: ' + r.name" @click="openUpload(r)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              {{ r.state.cls === 'pill-ok' ? 'Новая версия' : 'Продлить срок' }}
                            </button>
                            <button type="button" class="doc-act" :aria-label="'История: ' + r.name" @click="openScanHistory(r.scan)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                              История
                            </button>
                          </template>
                          <template v-else>
                            <button v-if="r.blank" type="button" class="btn btn-secondary btn-sm"
                                    :disabled="enrollBusy === r.blank" @click="downloadEnrollDoc({ key: r.blank, title: r.name })">
                              {{ enrollBusy === r.blank ? 'Готовим…' : 'Скачать бланк' }}
                            </button>
                            <button v-if="canUploadRow(r)" type="button" class="btn btn-primary btn-sm" @click="openUpload(r)">
                              {{ r.blank ? 'Загрузить скан' : 'Загрузить' }}
                            </button>
                          </template>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>

            <div class="col">
              <section v-for="g in docGroupsRight" :key="g.key" class="card">
                <div class="card-head">
                  <h2 class="card-title-sans">{{ g.title }}</h2>
                  <span class="pill" :class="groupPill(g).cls">{{ groupPill(g).text }}</span>
                </div>
                <div class="card-body">
                  <dl class="doc-table">
                    <div v-for="r in g.rows" :key="r.code" class="doc-tr" :class="{ 'is-missing': !r.scan && r.required }">
                      <dt class="doc-k">
                        <span class="doc-name">{{ r.name }}</span>
                        <span class="doc-req">{{ r.required ? 'обязательный' : 'по желанию' }}</span>
                      </dt>
                      <dd class="doc-v">
                        <div class="doc-state">
                          <span class="pill" :class="r.state.cls">{{ r.state.text }}</span>
                          <span v-if="r.versions > 1" class="doc-ver">вер. {{ r.versions }}</span>
                          <div v-if="r.term" class="doc-term">{{ r.term }}</div>
                        </div>
                        <div v-if="r.scan" class="doc-file">
                          {{ r.scan.originalName }} · {{ formatSize(r.scan.sizeBytes) }}<template v-if="r.scan.uploadedAt"> · {{ formatDate(r.scan.uploadedAt) }}</template>, {{ uploaderName(r.scan) }}
                        </div>
                        <div class="doc-acts">
                          <template v-if="r.scan">
                            <button type="button" class="doc-act" :aria-label="'Открыть: ' + r.name" @click="openScanDoc(r.scan)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                              Открыть
                            </button>
                            <button v-if="canEditDocs" type="button" class="doc-act" :aria-label="'Новая версия: ' + r.name" @click="openUpload(r)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              {{ r.state.cls === 'pill-ok' ? 'Новая версия' : 'Продлить срок' }}
                            </button>
                            <button type="button" class="doc-act" :aria-label="'История: ' + r.name" @click="openScanHistory(r.scan)">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
                              История
                            </button>
                          </template>
                          <template v-else>
                            <button v-if="r.blank" type="button" class="btn btn-secondary btn-sm"
                                    :disabled="enrollBusy === r.blank" @click="downloadEnrollDoc({ key: r.blank, title: r.name })">
                              {{ enrollBusy === r.blank ? 'Готовим…' : 'Скачать бланк' }}
                            </button>
                            <button v-if="canUploadRow(r)" type="button" class="btn btn-primary btn-sm" @click="openUpload(r)">
                              {{ r.blank ? 'Загрузить скан' : 'Загрузить' }}
                            </button>
                          </template>
                        </div>
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
            </div>
          </div>
        </div>

        <section v-else class="card">
          <div class="card-head">
            <h2 class="card-title">Журнал изменений по всем документам</h2>
            <span v-if="docJournal.length" class="badge">{{ docJournal.length }}</span>
          </div>
          <div class="card-body">
            <div v-if="historyLoading && !docJournal.length" class="rd-loading" style="min-height:5rem"><div class="spinner"></div></div>
            <div v-else-if="!docJournal.length" class="empty">Документы ещё не изменялись</div>
            <ol v-else class="hist">
              <li v-for="h in docJournal" :key="h.key" class="hist-item">
                <div class="hist-head">
                  <span class="hist-date">{{ formatDateTime(h.at) }}</span>
                  <span class="hist-author">{{ h.author }}</span>
                </div>
                <div class="hist-reason">{{ h.reason }}</div>
                <div v-if="h.fields" class="hist-fields">{{ h.fields }}</div>
              </li>
            </ol>
          </div>
        </section>
      </div>

      <div v-else-if="activeTab === 'lessons'" class="tabpanel">
        <div class="split">
          <div class="col">
            <section class="card">
              <div class="card-head">
                <h2 class="card-title">{{ groupName ? 'Группа «' + groupName + '»' : 'Группа не назначена' }}</h2>
                <span v-if="groupMembers.length" class="pill pill-mute">участников: {{ groupMembers.length }}</span>
              </div>
              <div class="card-body">
                <dl class="kv-grid">
                  <div class="kv"><dt class="kv-key">Куратор</dt><dd class="kv-val"><span class="kv-text">{{ curatorName || '—' }}</span></dd></div>
                  <div class="kv">
                    <dt class="kv-key">Занятий проведено</dt>
                    <dd class="kv-val"><span class="kv-text">{{ lessonsDone }} из {{ lessonEvents.length }}</span></dd>
                  </div>
                </dl>

                <div v-if="canEditCard" class="rd-group-select">
                  <label class="kv-key">Выбрать группу</label>
                  <div class="rd-gs-row">
                    <select v-model.number="selectedGroupId" class="rd-input" :disabled="groupsLoading || savingGroup">
                      <option v-if="groupsLoading" :value="null" disabled>Загрузка групп…</option>
                      <option v-for="g in allGroups" :key="g.id" :value="g.id">
                        {{ g.name }}{{ g.curator ? ' · ' + g.curator : '' }}
                      </option>
                    </select>
                    <button class="btn btn-primary" :disabled="!groupChanged || savingGroup" @click="saveGroup">
                      {{ savingGroup ? 'Сохранение…' : 'Сохранить' }}
                    </button>
                  </div>
                </div>

                <p class="subtitle" style="margin-top:1.25rem;">Ближайшие и прошедшие занятия</p>
                <div v-if="agendaLoading" class="rd-loading" style="min-height:6rem"><div class="spinner"></div></div>
                <div v-else-if="!allEventsDesc.length" class="empty">В расписании пока нет занятий</div>
                <template v-else>
                  <div v-for="e in allEventsDesc" :key="e.id" class="event">
                    <div class="event-date" :class="{ 'is-cycle': e.type === 'diagnostic' }">
                      <span class="event-day">{{ dayNum(e.date) }}</span>
                      <span class="event-mon">{{ monthShort(e.date) }}</span>
                    </div>
                    <div class="event-info">
                      <div class="event-title">{{ eventTitle(e) }}</div>
                      <div class="event-meta">
                        <template v-if="formatTime(e.startTime)">{{ formatTime(e.startTime) }}<template v-if="formatTime(e.endTime)">–{{ formatTime(e.endTime) }}</template> · </template>
                        <template v-if="e.specialist">{{ e.specialist.fullName || fullName(e.specialist) }} · </template>
                        <span class="pill" :class="eventPill(e).cls">{{ eventPill(e).text }}</span>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </section>
          </div>

          <div class="col">
            <section v-if="canMarkAttendance" class="card">
              <div class="card-head">
                <h2 class="card-title-sans">Отметка посещения</h2>
                <span v-if="attSavedStatus" class="pill" :class="ATT_PILL[attSavedStatus]">{{ ATT_LABELS[attSavedStatus] }}</span>
              </div>
              <div class="card-body">
                <p class="rd-att-hint">Отметка ставится на сегодня — <strong>{{ formatDate(todayStr) }}</strong>.</p>
                <div class="rd-att-toggle" role="group" aria-label="Статус посещения на сегодня">
                  <button type="button" class="rd-att-btn is-yes" :class="{ active: attStatus === 'present' }" @click="attStatus = 'present'">Был</button>
                  <button type="button" class="rd-att-btn is-partial" :class="{ active: attStatus === 'left' }" @click="attStatus = 'left'">Ушёл раньше</button>
                  <button type="button" class="rd-att-btn is-no" :class="{ active: attStatus === 'absent' }" @click="attStatus = 'absent'">Не был</button>
                </div>
                <button type="button" class="btn btn-primary rd-att-save" :disabled="!attDirty || attSaving" @click="saveAttendance">
                  {{ attSaving ? 'Сохраняем…' : 'Сохранить отметку' }}
                </button>
              </div>
            </section>

            <section class="card">
              <div class="card-head">
                <h2 class="card-title-sans">Команда сопровождения</h2>
                <span v-if="team.length" class="badge">{{ team.length }}</span>
              </div>
              <div class="card-body">
                <div v-if="!team.length" class="empty">Специалисты пока не назначены</div>
                <div v-else v-for="m in team" :key="m.id" class="person">
                  <div class="person-ava sage" aria-hidden="true">{{ initialsFromName(m.name) }}</div>
                  <div class="person-info">
                    <div class="person-name">{{ m.name }}<span v-if="m.isCurator" class="rd-curator-badge">куратор</span></div>
                    <div class="person-role">{{ [...m.roles].join(' · ') }}</div>
                  </div>
                  <a v-if="m.phone" class="icon-btn icon-btn-sm" :href="'tel:' + String(m.phone).replace(/[^\d+]/g, '')" :aria-label="'Позвонить: ' + m.name">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </a>
                </div>
              </div>
            </section>

            <section class="card">
              <div class="card-head">
                <h2 class="card-title-sans">Участники группы</h2>
                <span v-if="groupMembers.length" class="badge">{{ groupMembers.length }}</span>
              </div>
              <div class="card-body">
                <div v-if="!recipient.groupId" class="empty">Реабилитант не состоит в группе</div>
                <div v-else-if="groupMembersLoading" class="rd-loading" style="min-height:6rem"><div class="spinner"></div></div>
                <div v-else-if="!groupMembers.length" class="empty">В группе пока нет участников</div>
                <template v-else>
                  <div v-for="m in groupMembers" :key="m.id" class="person" :class="{ 'is-self': m.id == recipientId }">
                    <img v-if="m.photo" :src="m.photo" class="person-avatar-img" alt="" />
                    <div v-else class="person-ava sage" aria-hidden="true">{{ initials(m) }}</div>
                    <div class="person-info">
                      <div class="person-name">{{ fullName(m) }}<span v-if="m.id == recipientId" class="self-badge">текущий</span></div>
                      <div class="person-role">{{ memberMeta(m) }}</div>
                    </div>
                  </div>
                </template>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'representative'" class="tabpanel">
        <div class="split">
          <section class="card">
            <div class="card-head"><h2 class="card-title">Законный представитель</h2></div>
            <div class="card-body">
              <div v-if="!recipient.representative" class="empty">Представитель не указан</div>
              <template v-else>
                <dl class="kv-grid">
                  <div class="kv kv-full"><dt class="kv-key">ФИО</dt><dd class="kv-val"><span class="kv-text">{{ fullName(recipient.representative) || '—' }}</span></dd></div>
                  <div class="kv"><dt class="kv-key">Степень родства</dt><dd class="kv-val"><span class="kv-text">{{ recipient.representative.relation || '—' }}</span></dd></div>

                  <div class="kv" :class="{ 'is-secret': isLocked('contacts') }">
                    <dt class="kv-key">Телефон</dt>
                    <dd class="kv-val">
                      <template v-if="isLocked('contacts')">
                        <span class="kv-mask">••• ••• •• ••</span>
                        <span class="kv-tools">
                          <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать телефон представителя — с указанием причины" @click="openReveal('contacts')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </span>
                      </template>
                      <span v-else class="kv-text">{{ recipient.representative.telephone || '—' }}</span>
                    </dd>
                  </div>

                  <div class="kv kv-full" :class="{ 'is-secret': isLocked('contacts') }">
                    <dt class="kv-key">E-mail</dt>
                    <dd class="kv-val">
                      <template v-if="isLocked('contacts')">
                        <span class="kv-mask">•••••••••••</span>
                        <span class="kv-tools">
                          <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать e-mail представителя — с указанием причины" @click="openReveal('contacts')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </span>
                      </template>
                      <span v-else class="kv-text">{{ recipient.representative.email || '—' }}</span>
                    </dd>
                  </div>

                  <div class="kv kv-full" :class="{ 'is-secret': isLocked('contacts') }">
                    <dt class="kv-key">Адрес регистрации</dt>
                    <dd class="kv-val">
                      <template v-if="isLocked('contacts')">
                        <span class="kv-mask">••••••••••••••••••</span>
                        <span class="kv-tools">
                          <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать адрес регистрации представителя — с указанием причины" @click="openReveal('contacts')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </span>
                      </template>
                      <span v-else class="kv-text">{{ recipient.representative.passportReg || '—' }}</span>
                    </dd>
                  </div>
                </dl>

                <div v-if="isLocked('passport')" class="pd-note" style="margin-top:1rem;">
                  <span class="pd-note-ic" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <span class="pd-note-text">Паспорт представителя закрыт по 152-ФЗ.</span>
                  <button type="button" class="pd-note-btn" @click="openReveal('passport')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    Показать
                  </button>
                </div>

                <dl class="kv-grid">
                  <div class="kv" :class="{ 'is-secret': isLocked('passport') }">
                    <dt class="kv-key">Паспорт серия / номер</dt>
                    <dd class="kv-val">
                      <span v-if="isLocked('passport')" class="kv-mask">•••• ••••••</span>
                      <span v-else class="kv-text">{{ [recipient.representative.passportSeries, recipient.representative.passportNumber].filter(Boolean).join(' ') || '—' }}</span>
                      <span class="kv-tools">
                        <button v-if="isLocked('passport')" type="button" class="kv-tool" title="Показать данные" aria-label="Показать паспорт представителя — с указанием причины" @click="openReveal('passport')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button type="button" class="kv-tool" title="Открыть документ" aria-label="Открыть скан паспорта представителя" @click="openScanByCode('rep-pass')">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        </button>
                      </span>
                    </dd>
                  </div>

                  <div class="kv" :class="{ 'is-secret': isLocked('passport') }">
                    <dt class="kv-key">Код подразделения</dt>
                    <dd class="kv-val">
                      <template v-if="isLocked('passport')">
                        <span class="kv-mask">•••-•••</span>
                        <span class="kv-tools">
                          <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать код подразделения — с указанием причины" @click="openReveal('passport')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </span>
                      </template>
                      <span v-else class="kv-text">{{ recipient.representative.passportDeptCode || '—' }}</span>
                    </dd>
                  </div>

                  <div class="kv kv-full" :class="{ 'is-secret': isLocked('passport') }">
                    <dt class="kv-key">Кем выдан</dt>
                    <dd class="kv-val">
                      <template v-if="isLocked('passport')">
                        <span class="kv-mask">••••••••••••••••••</span>
                        <span class="kv-tools">
                          <button type="button" class="kv-tool" title="Показать данные" aria-label="Показать, кем выдан паспорт представителя — с указанием причины" @click="openReveal('passport')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        </span>
                      </template>
                      <span v-else class="kv-text">{{ recipient.representative.passportIssuer || '—' }}<template v-if="recipient.representative.passportIssuerDate"> · {{ formatDate(recipient.representative.passportIssuerDate) }}</template></span>
                    </dd>
                  </div>
                </dl>
              </template>
            </div>
          </section>

          <section class="card">
            <div class="card-head"><h2 class="card-title">Статус семьи</h2></div>
            <div class="card-body">
              <p style="margin:0 0 .75rem;font-size:.875rem;color:var(--ink-muted);">Категории, дающие право на льготы и особый порядок работы. Статус хранится у представителя и одинаков во всех карточках его подопечных.</p>
              <div v-if="!recipient.representative" class="empty">Представитель не указан, статус семьи определить не по чему</div>
              <div v-else-if="!familyStatuses.length" class="empty">Статус семьи не отмечен</div>
              <ul v-else class="fs-list">
                <li v-for="s in familyStatuses" :key="s.id" class="fs-item">
                  <span class="fs-name">{{ s.name }}</span>
                  <span v-if="s.hint" class="fs-hint">{{ s.hint }}</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>

      <div v-else-if="activeTab === 'diagnostics'" class="tabpanel">
        <section class="card">
          <div class="card-head">
            <h2 class="card-title">Циклы реабилитации</h2>
            <button v-if="canAssignDiagnostic" type="button" class="btn btn-primary" @click="openAssign">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M12 14v4M10 16h4"/></svg>
              Назначить диагностику
            </button>
          </div>
          <div class="card-body">
            <div v-if="assignmentsLoading && !cycleRows.length" class="rd-loading" style="min-height:7.5rem"><div class="spinner"></div></div>
            <div v-else-if="!cycleRows.length" class="empty">Диагностик пока не было</div>

            <template v-else>
              <div class="cyc-bar" role="tablist" aria-label="Циклы реабилитации">
                <button
                  v-for="row in cycleRows" :key="'cyc-' + row.num"
                  type="button" class="cyc-tab" role="tab"
                  :class="{ 'is-active': row.active }"
                  :aria-selected="row.num === activeCycle?.num"
                  @click="selectedCycle = row.num"
                >
                  <span class="cyc-tab-name">Цикл {{ row.num }} <span v-if="row.active" class="pill pill-ok">активный</span></span>
                  <span class="cyc-tab-meta">{{ cycleMeta(row) }}</span>
                </button>
              </div>

              <div v-if="activeCycle" class="cyc-panel">
                <div class="cyc-summary" :class="{ 'is-active': activeCycle.active }">
                  <div class="cyc-fact">
                    <div class="cyc-fact-k">Статус</div>
                    <div class="cyc-fact-v">{{ activeCycle.closed ? 'Завершён' : 'Идёт' }}</div>
                  </div>
                  <div class="cyc-fact">
                    <div class="cyc-fact-k">{{ activeCycle.to ? 'Период' : 'Начат' }}</div>
                    <div class="cyc-fact-v">{{ formatDate(activeCycle.from) }}<span v-if="activeCycle.to" class="unit"> – {{ formatDate(activeCycle.to) }}</span></div>
                  </div>
                  <div class="cyc-fact">
                    <div class="cyc-fact-k">Занятий</div>
                    <div v-if="cycleLessons(activeCycle).total" class="cyc-fact-v">
                      {{ cycleLessons(activeCycle).done }}<span class="unit"> / {{ cycleLessons(activeCycle).total }} проведено</span>
                    </div>
                    <div v-else class="cyc-fact-v">—<span class="unit"> занятия не назначены</span></div>
                  </div>
                  <div class="cyc-fact">
                    <div class="cyc-fact-k">Итог</div>
                    <div class="cyc-fact-v" v-if="activeCycle.final">{{ capitalize(verdictLabel(activeCycle.final.conclusion.verdict)) }}</div>
                    <div class="cyc-fact-v" v-else>—<span class="unit"> заключения нет</span></div>
                  </div>
                </div>

                <details
                  v-for="(s, si) in activeCycle.sessions" :key="'diag-' + s.id"
                  class="diag" :class="diagTone(s)" :open="si === 0"
                >
                  <summary class="diag-head">
                    <span class="pill" :class="diagPill(s).cls">{{ diagPill(s).text }}</span>
                    <span class="diag-verdict">{{ s.kindLabel || 'Первичная' }} диагностика</span>
                    <span class="diag-when">{{ diagWhen(s) }}</span>
                  </summary>
                  <div class="diag-body">
                    <div v-if="!(s.blocks || []).length" class="empty">Заявку пока никто не взял</div>

                    <details v-for="b in (s.blocks || [])" :key="'dir-' + b.id" class="dir">
                      <summary>
                        <span class="dir-ic" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path v-for="(d, di) in dirIcon(b)" :key="di" :d="d" />
                          </svg>
                        </span>
                        <span class="dir-name">{{ b.direction?.name || 'Направление не указано' }}</span>
                        <span class="dir-spec">{{ b.specialistName || 'Специалист не назначен' }}</span>
                        <span class="dir-score" v-if="dirScore(b)">{{ dirScore(b).value }}<span class="unit">{{ dirScore(b).unit }}</span></span>
                        <span class="dir-score" v-else>—<span class="unit"> / 4</span></span>
                      </summary>
                      <div class="dir-body">
                        <div v-if="b.resultsHidden" class="empty">Результаты доступны только автору блока</div>
                        <template v-else>
                          <div v-if="dirComment(b)" class="dir-comment">
                            <div class="dir-comment-k">Комментарий специалиста</div>
                            <p class="dir-comment-p">{{ dirComment(b) }}</p>
                          </div>
                          <div v-for="(r, ri) in dirLegacy(b)" :key="'lg-' + ri" class="dir-comment" style="margin-top:.5rem;">
                            <div class="dir-comment-k">{{ r.title }}<template v-if="r.specialists"> · {{ r.specialists }}</template></div>
                            <p v-if="r.recs" class="dir-comment-p">{{ r.recs }}</p>
                          </div>
                          <div v-if="!dirComment(b) && !dirLegacy(b).length" class="empty">Комментарий не заполнен</div>

                          <details v-if="dirRows(b).length" class="crit" :open="!!dirRowsFilled(b)">
                            <summary class="crit-sum">
                              Оценки по критериям
                              <span class="crit-count">{{ critCountLabel(b) }}</span>
                            </summary>
                            <div class="crit-body">
                              <p v-if="!dirRowsFilled(b)" class="crit-empty">
                                Специалист ещё не выставил оценки по этому направлению — шкала заполнится, как только он сдаст блок диагностики.
                              </p>
                              <div v-for="r in dirRows(b)" :key="r.key" class="crit-row" :class="{ 'is-blank': r.value === null || r.value === '' }">
                                <span class="crit-label">{{ r.label }}</span>
                                <span v-if="r.kind === 'scale'" class="crit-scale" role="img" :aria-label="r.label + ': ' + rowAria(r)">
                                  <span v-for="n in ticksOf(r.max)" :key="n" class="tick" :class="{ on: r.value === n }">{{ n }}</span>
                                </span>
                                <span v-else class="crit-answer">{{ r.value }}</span>
                              </div>
                              <p v-if="dirGraded(b)" class="crit-hint">{{ CRIT_HINT }}</p>
                            </div>
                          </details>
                        </template>
                      </div>
                    </details>

                    <div v-if="s.conclusion" class="diag-concl" :class="{ 'is-stop': s.conclusion.verdict === 'rejected' }">
                      <div class="diag-concl-h">Заключение · {{ verdictLabel(s.conclusion.verdict) }}</div>
                      <p v-if="s.conclusion.summary" class="diag-concl-p">{{ s.conclusion.summary }}</p>
                      <p v-if="s.conclusion.recommendations" class="diag-concl-p">{{ s.conclusion.recommendations }}</p>
                      <div class="diag-concl-m">{{ s.conclusion.authorName || 'Автор не указан' }} · {{ formatDate(s.conclusion.issuedAt) }}</div>
                    </div>

                    <div v-if="canCancelSession && (s.status === 'open' || s.status === 'in_progress')" class="doc-acts">
                      <button type="button" class="rd-cancel-btn" @click="askCancel(s)">Отменить заявку</button>
                    </div>
                  </div>
                </details>
              </div>
            </template>
          </div>
        </section>
      </div>

      <div v-else-if="activeTab === 'enrollment'" class="tabpanel">
        <section class="card">
          <div class="card-head">
            <h2 class="card-title">Документы на зачисление</h2>
            <span v-if="enroll" class="badge">{{ enroll.signedCount }} / {{ enroll.docs.length }}</span>
          </div>

          <div class="card-body">
            <div v-if="enrollLoading" class="rd-loading" style="min-height:7.5rem"><div class="spinner"></div></div>
            <div v-else-if="enrollError" class="empty">{{ enrollError }}</div>

            <template v-else-if="enroll">
              <div v-if="!enroll.verdict" class="en-note en-note-wait">
                Заключение по диагностике ещё не выдано. Как только специалист вынесет решение,
                здесь появятся документы на подпись.
              </div>

              <div v-else-if="!enroll.positive" class="en-note en-note-stop">
                Решение по диагностике — «{{ enroll.verdictLabel }}». Документы на зачисление не готовятся.
              </div>

              <template v-else>
                <dl class="doc-table">
                  <div v-for="d in enroll.docs" :key="d.key" class="doc-tr" :class="{ 'is-missing': !d.uploaded && d.required }">
                    <dt class="doc-k">
                      <span class="doc-name">{{ d.title }}</span>
                      <span class="doc-req">{{ d.required ? 'обязательный' : 'по желанию' }}</span>
                    </dt>
                    <dd class="doc-v">
                      <div class="doc-state">
                        <span class="pill" :class="d.uploaded ? 'pill-ok' : (d.required ? 'pill-wait' : 'pill-mute')">
                          {{ d.uploaded ? 'Подписано' : (d.required ? 'Ждём скан' : 'Не загружено') }}
                        </span>
                        <div v-if="d.uploaded && d.uploadedAt" class="doc-term">Загружено {{ formatDate(d.uploadedAt) }}</div>
                      </div>
                      <div v-if="d.uploaded && d.originalName" class="doc-file">{{ d.originalName }}</div>

                      <div class="doc-acts">
                        <button
                          v-if="d.uploaded && d.scanId"
                          type="button"
                          class="doc-act"
                          :aria-label="'Открыть: ' + d.title"
                          @click="openEnrollScan(d)"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                          Открыть
                        </button>

                        <button
                          type="button"
                          :class="d.uploaded ? 'doc-act' : 'btn btn-secondary btn-sm'"
                          :disabled="enrollBusy === d.key"
                          @click="downloadEnrollDoc(d)"
                        >
                          <svg v-if="d.uploaded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          {{ enrollBusy === d.key ? 'Готовим…' : 'Скачать бланк' }}
                        </button>

                        <label
                          v-if="canEditDocs"
                          :class="d.uploaded ? 'doc-act' : 'btn btn-primary btn-sm'"
                          :aria-label="(d.uploaded ? 'Новая версия: ' : 'Загрузить скан: ') + d.title"
                        >
                          <svg v-if="d.uploaded" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          {{ enrollBusy === 'up:' + d.key ? 'Загрузка…' : (d.uploaded ? 'Новая версия' : 'Загрузить скан') }}
                          <input
                            type="file"
                            class="en-file"
                            accept="image/*,application/pdf"
                            :disabled="enrollBusy === 'up:' + d.key"
                            @change="pickSignedScan(d, $event)"
                          />
                        </label>
                      </div>

                      <p v-if="enrollDocError[d.key]" class="field-err">{{ enrollDocError[d.key] }}</p>
                    </dd>
                  </div>
                </dl>

                <div v-if="enroll.allSigned" class="en-note en-note-ok en-done">
                  Все подписанные документы загружены. Осталось назначить группу —
                  это делается во вкладке «Занятия и группа».
                </div>
              </template>
            </template>
          </div>
        </section>
      </div>

      <div class="rd-footer">
        <span class="id-chip">ID R-{{ recipientCode }}</span>
        <button class="btn btn-secondary" @click="goBack">← К списку</button>
      </div>

      <div v-if="heroPhotoOpen && photoUrl" class="rd-lightbox" @click="heroPhotoOpen = false">
        <img :src="photoUrl" alt="" @click.stop />
        <button type="button" class="rd-lightbox-close" @click="heroPhotoOpen = false" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div v-if="docUpdateOpen" class="du-overlay" @click.self="closeDocUpdate">
        <div class="du-modal" role="dialog" aria-modal="true" aria-labelledby="du-title">
          <header class="du-head">
            <div>
              <h3 class="du-title" id="du-title">Обновление документов</h3>
              <p class="du-sub">Прежние данные сохранятся в истории вместе с автором и датой</p>
            </div>
            <button type="button" class="du-close" aria-label="Закрыть" @click="closeDocUpdate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </header>

          <div class="du-body">
            <div class="du-grid">
              <label class="du-field">
                <span class="du-key">Тип документа</span>
                <select v-model="docForm.docType" class="du-input">
                  <option value="Свидетельство">Свидетельство</option>
                  <option value="Паспорт">Паспорт</option>
                </select>
              </label>
              <label class="du-field">
                <span class="du-key">СНИЛС</span>
                <input v-model="docForm.snils" class="du-input" placeholder="000-000-000 00" />
              </label>
              <label class="du-field">
                <span class="du-key">Серия</span>
                <input v-model="docForm.docSeries" class="du-input" />
              </label>
              <label class="du-field">
                <span class="du-key">Номер</span>
                <input v-model="docForm.docNumber" class="du-input" />
              </label>
              <label class="du-field du-field-full">
                <span class="du-key">Кем выдан</span>
                <input v-model="docForm.docIssuer" class="du-input" />
              </label>
              <label class="du-field">
                <span class="du-key">Дата выдачи</span>
                <input type="date" v-model="docForm.docIssuerDate" class="du-input" />
              </label>
              <label class="du-field">
                <span class="du-key">МСЭ выдана</span>
                <input type="date" v-model="docForm.mseIssueDate" class="du-input" />
              </label>
              <label class="du-field" v-if="!docForm.mseIndefinite">
                <span class="du-key">МСЭ действительна до</span>
                <input type="date" v-model="docForm.mseValidDate" class="du-input" :class="{ 'is-expired': mseExpired }" />
              </label>
              <label class="du-check du-field-full">
                <input type="checkbox" v-model="docForm.mseIndefinite" />
                <span>Справка МСЭ бессрочная</span>
              </label>
              <label class="du-field">
                <span class="du-key">Место обучения</span>
                <input v-model="docForm.educationPlace" class="du-input" />
              </label>
              <label class="du-field du-field-full">
                <span class="du-key">Адрес регистрации</span>
                <input v-model="docForm.regAddress" class="du-input" />
              </label>
              <label class="du-field du-field-full">
                <span class="du-key">Адрес проживания</span>
                <input v-model="docForm.factAddress" class="du-input" :disabled="docForm.factSameReg" />
              </label>
              <label class="du-check du-field-full">
                <input type="checkbox" v-model="docForm.factSameReg" />
                <span>Совпадает с адресом регистрации</span>
              </label>
              <label class="du-field du-field-full">
                <span class="du-key">Особые отметки</span>
                <textarea v-model="docForm.specialNote" class="du-input du-textarea" rows="2"></textarea>
              </label>
            </div>

            <div class="du-reason">
              <label class="du-field du-field-full">
                <span class="du-key">
                  Причина обновления <span class="du-req">— обязательно</span>
                </span>
                <textarea
                  v-model="docReason"
                  class="du-input du-textarea"
                  :class="{ 'is-invalid': reasonTouched && !reasonValid }"
                  rows="2"
                  placeholder="Например: получена новая справка МСЭ до 2027 года"
                  @blur="reasonTouched = true"
                ></textarea>
              </label>
              <p v-if="reasonTouched && !reasonValid" class="du-error">
                Укажите причину обновления (не менее 3 символов)
              </p>
            </div>

            <p v-if="docChangedFields.length" class="du-changes">
              Будет изменено: {{ docChangedFields.map(fieldLabel).join(', ') }}
            </p>
            <p v-else class="du-changes du-changes-muted">Изменений пока нет</p>

            <p v-if="docSaveError" class="du-error">{{ docSaveError }}</p>
            <p v-if="docSaveOk" class="du-success">{{ docSaveOk }}</p>
          </div>

          <footer class="du-foot">
            <button type="button" class="du-btn du-btn-ghost" :disabled="docSaving" @click="closeDocUpdate">
              {{ docSaveOk ? 'Закрыть' : 'Отмена' }}
            </button>
            <button type="button" class="du-btn du-btn-primary" :disabled="!canSaveDoc || docSaving" @click="saveDocUpdate">
              {{ docSaving ? 'Сохранение…' : 'Сохранить обновление' }}
            </button>
          </footer>
        </div>
      </div>

      <div v-if="cancelTarget" class="du-overlay" @click.self="closeCancel">
        <div class="du-modal du-modal-sm" role="dialog" aria-modal="true" aria-labelledby="rc-title">
          <header class="du-head">
            <div>
              <h3 class="du-title" id="rc-title">Отменить заявку на диагностику?</h3>
              <p class="du-sub">{{ formatDate(cancelTarget.date) }} · {{ fullName(recipient) }}</p>
            </div>
            <button type="button" class="du-close" aria-label="Закрыть" @click="closeCancel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </header>

          <div class="du-body">
            <p class="rd-cancel-note">
              Заявка перейдёт в статус «Отменена». Незаполненные этапы и связанные
              записи в расписании специалистов будут удалены. Реабилитант при этом
              остаётся в системе — назначить диагностику заново можно сразу же.
            </p>
            <p v-if="cancelBlocked" class="du-error">
              По заявке уже заполнено этапов: {{ cancelTarget.completed }}. Такую заявку
              отменяет только администратор.
            </p>
            <p v-if="cancelError" class="du-error">{{ cancelError }}</p>
          </div>

          <footer class="du-foot">
            <button type="button" class="du-btn du-btn-ghost" :disabled="cancelBusy" @click="closeCancel">
              Не отменять
            </button>
            <button type="button" class="du-btn du-btn-danger" :disabled="cancelBusy || cancelBlocked" @click="confirmCancel">
              {{ cancelBusy ? 'Отмена…' : 'Отменить заявку' }}
            </button>
          </footer>
        </div>
      </div>

      <div v-if="cardEditOpen" class="modal" @click.self="closeCardEdit">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="m-edit-t">
          <div class="modal-head">
            <div>
              <h2 class="modal-title" id="m-edit-t">Редактирование карточки</h2>
              <p class="modal-sub">Прежние данные сохранятся в истории вместе с автором и датой</p>
            </div>
            <button type="button" class="icon-btn icon-btn-sm" :disabled="cardSaving" aria-label="Закрыть" @click="closeCardEdit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="field">
              <span class="field-key">ФИО</span>
              <input v-model="cardForm.fio" class="input" type="text" placeholder="Фамилия Имя Отчество" />
              <span v-if="cardTouched && !cardFioValid" class="field-err">Укажите как минимум фамилию и имя</span>
            </label>
            <label class="field">
              <span class="field-key">Дата рождения</span>
              <input v-model="cardForm.birthDate" class="input" type="date" />
            </label>
            <label class="field">
              <span class="field-key">Место обучения</span>
              <input v-model="cardForm.educationPlace" class="input" type="text" placeholder="Например: ГБОУ «Школа № 1499», 7 «Б» класс" />
            </label>
            <label class="field">
              <span class="field-key">Округ проживания</span>
              <select v-model="cardForm.district" class="input">
                <option value="">Не указан</option>
                <option v-for="o in OKRUGA" :key="o" :value="o">{{ o }}</option>
              </select>
            </label>
            <label class="field">
              <span class="field-key">Причина изменения <span class="req">— обязательно</span></span>
              <textarea v-model="cardReason" class="input" rows="2" placeholder="Например: уточнили класс обучения по справке из школы"></textarea>
              <span v-if="cardTouched && !cardReasonValid" class="field-err">Опишите причину — не менее 3 символов</span>
            </label>
            <p v-if="cardError" class="field-err">{{ cardError }}</p>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn btn-secondary" :disabled="cardSaving" @click="closeCardEdit">Отмена</button>
            <button type="button" class="btn btn-primary" :disabled="!canSaveCard" @click="saveCardEdit">
              {{ cardSaving ? 'Сохраняем…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="revealOpen" class="modal" @click.self="closeReveal">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="m-reveal-t">
          <div class="modal-head">
            <div>
              <h2 class="modal-title" id="m-reveal-t">{{ revealTitle }}</h2>
              <p class="modal-sub">{{ revealLabel }}</p>
            </div>
            <button type="button" class="icon-btn icon-btn-sm" :disabled="revealSending" aria-label="Закрыть" @click="closeReveal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="field">
              <span class="field-key">{{ revealReasonKey }} <span class="req">— обязательно</span></span>
              <select v-model="revealReasonCode" class="input">
                <option value="">— выберите причину —</option>
                <option v-for="r in revealReasons" :key="r.code" :value="r.code">{{ r.label }}</option>
              </select>
            </label>
            <label class="field">
              <span class="field-key">Пояснение<span v-if="revealReasonCode === 'other'" class="req">— обязательно, не менее 10 символов</span></span>
              <textarea v-model="revealReasonText" class="input" rows="3" :placeholder="revealHint"></textarea>
            </label>
            <p class="modal-note">{{ revealNote }}</p>
            <p v-if="revealError" class="field-err">{{ revealError }}</p>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn btn-secondary" :disabled="revealSending" @click="closeReveal">Отмена</button>
            <button type="button" class="btn btn-primary" :disabled="!canReveal" @click="submitReveal">
              {{ revealSending ? 'Открываем…' : revealSubmitText }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="uploadOpen" class="modal" @click.self="closeUpload">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="m-upload-t">
          <div class="modal-head">
            <div>
              <h2 class="modal-title" id="m-upload-t">{{ uploadIsReplace ? 'Новая версия документа' : 'Загрузка документа' }}</h2>
              <p class="modal-sub">{{ uploadTypeName }}</p>
            </div>
            <button type="button" class="icon-btn icon-btn-sm" :disabled="uploadSaving" aria-label="Закрыть" @click="closeUpload">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <label class="field">
              <span class="field-key">Тип документа <span class="req">— обязательно</span></span>
              <select v-model="uploadCode" class="input" :disabled="uploadIsReplace || uploadSaving">
                <option value="">— выберите тип —</option>
                <option v-for="t in uploadTypes" :key="t.code" :value="t.code">{{ t.name }}</option>
              </select>
            </label>

            <label class="field">
              <span class="field-key">Файл <span class="req">— обязательно</span></span>
              <input ref="uploadInputRef" class="input" type="file" accept="image/*,application/pdf"
                     :disabled="uploadSaving" @change="pickUploadFile" />
            </label>
            <p class="modal-note" style="margin-bottom:.875rem;">
              Изображение или PDF, не больше {{ MAX_SCAN_MB }} МБ. Прежняя версия не удаляется — останется в истории с автором, датой и причиной замены.
            </p>

            <div v-if="uploadFile" class="rs-picked">
              <img v-if="uploadPreview" :src="uploadPreview" alt="" class="rs-preview" />
              <div class="rs-picked-meta">
                <div class="rs-picked-name">{{ uploadFile.name }}</div>
                <div class="rs-picked-sub">{{ formatSize(uploadFile.size) }}</div>
              </div>
            </div>

            <div class="field-row">
              <label class="field">
                <span class="field-key">Дата выдачи</span>
                <input v-model="uploadIssuedAt" class="input" type="date" :disabled="uploadSaving" />
              </label>
              <label class="field">
                <span class="field-key">Действует до</span>
                <input v-model="uploadValidUntil" class="input" type="date" :disabled="uploadPerpetual || uploadSaving" />
              </label>
            </div>
            <label class="check">
              <input v-model="uploadPerpetual" type="checkbox" :disabled="uploadSaving" />
              <span>Бессрочный документ</span>
            </label>

            <div v-if="uploadIsReplace && uploadPrevTerm" class="term-note">
              Новый срок заменит текущий: <b>{{ uploadPrevTerm }}</b> → <b>{{ uploadNextTerm }}</b>.
              Предупреждение «истекает» и блокировка назначения диагностики пересчитаются сразу после сохранения.
            </div>

            <label v-if="uploadIsReplace" class="field" style="margin-top:.875rem;">
              <span class="field-key">Причина загрузки <span class="req">— обязательно</span></span>
              <textarea v-model="uploadReason" class="input" rows="2"
                        placeholder="Например: представитель привёз новую справку МСЭ"
                        :disabled="uploadSaving" @blur="uploadTouched = true"></textarea>
              <span v-if="uploadTouched && !uploadReasonValid" class="field-err">Опишите причину — не менее 3 символов</span>
            </label>

            <p v-if="uploadError" class="field-err">{{ uploadError }}</p>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn btn-secondary" :disabled="uploadSaving" @click="closeUpload">Отмена</button>
            <button type="button" class="btn btn-primary" :disabled="!canSaveUpload" @click="saveUpload">
              {{ uploadSaving ? 'Сохраняем…' : 'Сохранить документ' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="historyScan" class="modal" @click.self="closeScanHistory">
        <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="m-history-t">
          <div class="modal-head">
            <div>
              <h2 class="modal-title" id="m-history-t">История документа</h2>
              <p class="modal-sub">{{ scanLabel(historyScan) }} · версий: {{ scanVersionRows.length }}</p>
            </div>
            <button type="button" class="icon-btn icon-btn-sm" aria-label="Закрыть" @click="closeScanHistory">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <ol class="hist">
              <li v-for="v in scanVersionRows" :key="v.id" class="hist-item">
                <div class="hist-head">
                  <span class="hist-date">{{ v.uploadedAt ? formatDateTime(v.uploadedAt) : 'Дата не записана' }}</span>
                  <span class="hist-author">{{ uploaderName(v) }}</span>
                  <span class="pill" :class="v.isCurrent !== false ? 'pill-ok' : 'pill-mute'">
                    {{ v.isCurrent !== false ? 'Актуальная' : 'Заменена' }}
                  </span>
                </div>
                <div class="hist-reason">{{ scanReasonText(v) }}</div>
                <div class="hist-fields">
                  Версия {{ v.verNo }} · {{ v.term }} · {{ v.originalName }}, {{ formatSize(v.sizeBytes) }}
                  <button type="button" class="doc-act" @click="openScanDoc(v)">Открыть</button>
                </div>
              </li>
            </ol>
            <p class="modal-note">Прежние версии не удаляются. Открытие любой версии фиксируется в журнале доступа.</p>
          </div>
          <div class="modal-foot">
            <button type="button" class="btn btn-secondary" @click="closeScanHistory">Закрыть</button>
            <button v-if="canUploadScans" type="button" class="btn btn-primary"
                    @click="openUpload({ code: historyScan.docTypeRef?.code, scan: historyScan }); closeScanHistory()">
              Загрузить новую версию
            </button>
          </div>
        </div>
      </div>

      <div v-if="lightbox" class="rd-lightbox" @click="lightbox = null">
        <img :src="lightbox" alt="" @click.stop />
        <button type="button" class="rd-lightbox-close" @click="lightbox = null" aria-label="Закрыть">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <AssignDiagnosticModal
        v-if="assignOpen"
        :recipient-id="recipientId"
        :recipient-name="fullName(recipient)"
        @close="assignOpen = false"
        @assigned="onAssigned"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePageStore } from '../stores/page';
import { useAuthStore } from '../stores/auth';
import { useUiStore } from '../stores/ui';
import api from '../api';
import { fullName, initials, recipientAge, statusLabel } from '../utils/recipient';
import { notify, notifySaved } from '../utils/toast';
import { SCALE, getBlock, averageScore } from '../utils/diagnosticBlocks';
import AssignDiagnosticModal from '../components/AssignDiagnosticModal.vue';

const pageStore = usePageStore();
const authStore = useAuthStore();
const ui = useUiStore();
const recipientId = pageStore.params?.recipientId;

const loading = ref(true);
const recipient = ref(null);
const groupMembers = ref([]);
const groupMembersLoading = ref(false);
const activeTab = ref('overview');

const events = ref([]);
const agendaLoading = ref(false);
const agendaLoaded = ref(false);

const heroPhotoOpen = ref(false);

const attStatus = ref(null);      
const attSaving = ref(false);
const attSavedStatus = ref(null); 

const allGroups = ref([]);
const groupsLoading = ref(false);
const selectedGroupId = ref(null);
const savingGroup = ref(false);

const scanRows = ref([]);
const scansLoading = ref(false);
const scansLoaded = ref(false);

const hiddenCategories = ref([]);
const scansLocked = ref(false);
const isLocked = (category) => hiddenCategories.value.includes(category);
const lightbox = ref(null);

const scans = computed(() => scanRows.value.filter((s) => s.isCurrent !== false));
const versionsOf = (s) =>
  scanRows.value
    .filter((r) => r.docType === s.docType)
    .sort((a, b) => b.id - a.id);
const assignments = ref([]);
const assignmentsLoading = ref(false);
const todayStr = new Date().toISOString().slice(0, 10);
const sessions = ref([]);
const activeSessions = computed(
  () => sessions.value.filter((s) => s.status === 'open' || s.status === 'in_progress')
);
const diagCount = computed(
  () => assignments.value.length + activeSessions.value.filter((s) => !s.total).length
);

const sessionStatus = (s) => {
  if (s.status === 'completed') return { label: 'Завершена', tone: 'sage' };
  if (!s.total) return { label: 'Никто ещё не взял', tone: 'amber' };
  if (s.fullyCompleted) return { label: 'Все этапы заполнены', tone: 'sage' };
  return { label: `Заполнено ${s.completed} из ${s.total}`, tone: 'amber' };
};

const historySessions = computed(
  () => sessions.value
    .filter((s) => s.status !== 'cancelled')
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id)
);
const selectedHistoryId = ref(null);
const VERDICT_LABELS = {
  recommended: 'рекомендован к зачислению',
  trial: 'пробные занятия',
  rejected: 'не рекомендован'
};
const verdictLabel = (v) => VERDICT_LABELS[v] || 'решение не указано';

const canCancelSession = computed(() => authStore.isAdmin || authStore.isEmployee);
const cancelTarget = ref(null);
const cancelBusy = ref(false);
const cancelError = ref('');
const cancelBlocked = computed(
  () => !!cancelTarget.value && !authStore.isAdmin && cancelTarget.value.completed > 0
);

const askCancel = (s) => {
  cancelError.value = '';
  cancelTarget.value = s;
};
const closeCancel = () => {
  if (cancelBusy.value) return;
  cancelTarget.value = null;
  cancelError.value = '';
};
const confirmCancel = async () => {
  if (!cancelTarget.value || cancelBusy.value) return;
  cancelBusy.value = true;
  cancelError.value = '';
  try {
    await api.post(`/schedule/sessions/${cancelTarget.value.id}/cancel`);
    cancelTarget.value = null;
    await loadAssignments();
    agendaLoaded.value = false;
    loadAgenda();
    loadReadiness();
    notifySaved('Заявка на диагностику отменена');
  } catch (err) {
    cancelError.value = err?.response?.data?.message || 'Не удалось отменить заявку';
  } finally {
    cancelBusy.value = false;
  }
};

const groupChanged = computed(
  () => (selectedGroupId.value ?? null) !== (recipient.value?.groupId ?? null)
);

const tabs = [
  { id: 'overview', label: 'Обзор' },
  { id: 'profile', label: 'Анкета и медкарта' },
  { id: 'representative', label: 'Представитель и семья' },
  { id: 'lessons', label: 'Занятия и группа' },
  { id: 'diagnostics', label: 'Диагностика и развитие' },
  { id: 'enrollment', label: 'Зачисление' },
  { id: 'documents', label: 'Документы' },
];

const readiness = ref(null);
const readinessLoading = ref(false);


const lifecycle = computed(() => readiness.value?.lifecycle || null);
const lifecycleStages = computed(() => lifecycle.value?.stages || []);

const STAGE_TAB = {
  intake: 'profile',        
  statement: 'documents',   
  diagnostic: 'diagnostics',
  enrollment: 'enrollment',
  lessons: 'lessons',
  cycle: 'diagnostics'      
};
const stageTabLabel = (key) => tabs.find((t) => t.id === STAGE_TAB[key])?.label || 'карточку';
const goStage = (key) => {
  const tab = STAGE_TAB[key];
  if (tab) activeTab.value = tab;
};

const stageChip = computed(() => {
  if (!groupName.value) return '';
  const w = lifecycle.value?.cycle?.weekNo;
  return (w ? `${w}-я неделя цикла · ` : '') + `группа «${groupName.value}»`;
});

const cycles = computed(() => {
  const ordered = sessions.value
    .filter((s) => s.status !== 'cancelled')
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.id - b.id);
  const out = [];
  for (const s of ordered) {
    if (s.kind === 'primary' || !out.length) {
      out.push({ num: out.length + 1, sessions: [s] });
    } else {
      out[out.length - 1].sessions.push(s);
    }
  }
  return out;
});

const cycleTag = computed(() => {
  const last = cycles.value[cycles.value.length - 1];
  if (!last) return '';
  const closed = last.sessions.some((s) => s.kind === 'final' && s.conclusion);
  if (closed) return `Цикл ${last.num} · завершён`;
  return `Цикл ${last.num} · ${recipient.value?.groupId ? 'активный' : 'в работе'}`;
});

const expiredDocs = computed(() => readiness.value?.docs?.expired || []);
const expiringDocs = computed(() => readiness.value?.docs?.expiringSoon || []);
const missingScans = computed(() => readiness.value?.docs?.missingScans || []);
const docAlertCount = computed(() => readiness.value?.docs?.alertCount || 0);
const docAlertLabel = computed(() => {
  const parts = [];
  if (expiredDocs.value.length) parts.push(`просроченных документов: ${expiredDocs.value.length}`);
  if (missingScans.value.length) parts.push(`не загружено файлов: ${missingScans.value.length}`);
  if (!parts.length && expiringDocs.value.length) parts.push(`истекает документов: ${expiringDocs.value.length}`);
  return parts.length ? `Внимание — ${parts.join(', ')}` : 'Документы в порядке';
});

const canAssignDiagnostic = computed(() => authStore.isAdmin || authStore.isEmployee);
const canEditDocs = computed(() => authStore.isAdmin || authStore.isEmployee);
const canUploadScans = computed(() => authStore.isAdmin || authStore.isEmployee || authStore.isTeacher);
const isSignedCode = (code) => String(code || '').startsWith('signed-');
const canUploadRow = (row) => (isSignedCode(row?.code) ? canEditDocs.value : canUploadScans.value);
const canEditCard = computed(() => authStore.isAdmin || authStore.isEmployee);

const goFixDocs = () => {
  if (missingScans.value.length) activeTab.value = 'documents';
  else if (enrollAlertCount.value) activeTab.value = 'enrollment';
  else openDocUpdate();
};

const enrollMissing = computed(() => {
  const e = enroll.value;
  if (!e || !e.positive) return [];
  return (e.docs || []).filter((d) => d.required && !d.uploaded);
});
const enrollAlertCount = computed(() => enrollMissing.value.length);
const enrollAlertLabel = computed(() =>
  enrollAlertCount.value
    ? `Не загружено подписанных документов: ${enrollAlertCount.value}`
    : 'Документы на зачисление загружены'
);

const allMissingNames = computed(() => [
  ...missingScans.value.map((m) => m.name),
  ...enrollMissing.value.map((d) => d.title)
]);

const alertCount = computed(() => expiredDocs.value.length + allMissingNames.value.length);

const alertLabel = computed(() => {
  const parts = [];
  if (expiredDocs.value.length) parts.push(`просроченных документов: ${expiredDocs.value.length}`);
  if (allMissingNames.value.length) parts.push(`не загружено файлов: ${allMissingNames.value.length}`);
  if (!parts.length && expiringDocs.value.length) parts.push(`истекает документов: ${expiringDocs.value.length}`);
  return parts.length ? `Внимание — ${parts.join(', ')}` : 'Документы в порядке';
});

const assignOpen = ref(false);
const openAssign = () => { assignOpen.value = true; };
const onAssigned = () => {
  agendaLoaded.value = false;
  loadAgenda();
  loadReadiness();
  loadAssignments();
};

const doc = computed(() => recipient.value?.docs?.[0] || null);
const age = computed(() => recipientAge(recipient.value));
const groupName = computed(() => recipient.value?.group?.groupName || '');
const curatorName = computed(() => recipient.value?.group?.curatorUser?.fullName || '');
const photoUrl = computed(() => {
  const p = recipient.value?.photo;
  return p && /^(https?:|data:)/.test(p) ? p : '';
});
const recipientCode = computed(() =>
  recipient.value?.id ? String(recipient.value.id).padStart(6, '0') : '000000'
);
const statusDotClass = computed(() => 'st-' + (recipient.value?.status || 'draft'));
const crgShort = computed(() => recipient.value?.crgMain?.code || '');
const repPhoneHref = computed(() => {
  const p = recipient.value?.representative?.telephone;
  return p ? 'tel:' + String(p).replace(/[^\d+]/g, '') : '';
});
const repRoleLine = computed(() => {
  const r = recipient.value?.representative;
  if (!r) return '';
  return [r.relation, r.telephone].filter(Boolean).join(' · ') || 'Контакты не указаны';
});

const familyStatuses = computed(() => {
  const list = recipient.value?.representative?.familyStatuses;
  if (!Array.isArray(list) || !list.length) return [];
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
});
const pastEvents = computed(() => events.value.filter(e => String(e.date) < todayStr));
const futureEvents = computed(() => events.value.filter(e => String(e.date) >= todayStr));const allEventsDesc = computed(() => [...events.value].reverse());
const lessonsCount = computed(() => events.value.length);

const firstEventDate = computed(() => (events.value.length ? events.value[0].date : null));
const upcoming = computed(() => {
  const rows = futureEvents.value.map(e => ({
    kind: 'event',
    date: String(e.date).slice(0, 10),
    title: eventTitle(e),
    meta: eventMeta(e),
    type: e.type
  }));
  const mse = doc.value?.mseValidDate;
  if (mse) {
    const mseStr = String(mse).slice(0, 10);
    if (mseStr >= todayStr) {
      rows.push({
        kind: 'mse',
        date: mseStr,
        title: 'Истекает справка МСЭ',
        meta: 'Контроль сроков документов',
        type: 'mse'
      });
    }
  }
  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return rows.slice(0, 6);
});

const team = computed(() => {
  const map = new Map();
  const cur = recipient.value?.group?.curatorUser;
  if (cur && cur.id) {
    map.set(cur.id, {
      id: cur.id,
      name: cur.fullName || fullName(cur),
      phone: cur.phone || '',
      email: cur.email || '',
      roles: new Set(['Куратор группы']),
      isCurator: true
    });
  }
  for (const e of events.value) {
    const s = e.specialist;
    if (!s || !s.id) continue;
    let entry = map.get(s.id);
    if (!entry) {
      entry = {
        id: s.id,
        name: s.fullName || fullName(s),
        phone: s.phone || '',
        email: s.email || '',
        roles: new Set(),
        isCurator: false
      };
      map.set(s.id, entry);
    }
    if (e.direction?.name) entry.roles.add(e.direction.name);
    else entry.roles.add(e.type === 'diagnostic' ? 'Диагностика' : 'Занятия');
  }
  return Array.from(map.values()).map(m => ({ ...m, roles: Array.from(m.roles) }));
});

const canMarkAttendance = computed(() => authStore.isAdmin || authStore.isTeacher);
const attDirty = computed(() => !!attStatus.value && attStatus.value !== attSavedStatus.value);

const nozologyName = computed(() => {
  const n = recipient.value?.nozologyRef;
  if (!n) return '—';
  return [n.name, n.code].filter(Boolean).join(' · ') || '—';
});

const crgText = computed(() => {
  const c = recipient.value?.crgMain;
  if (!c) return '—';
  const label = [c.code, c.name].filter(Boolean).join(' · ');
  return (label || '—') + (c.child ? ' (детская)' : '');
});

function yearsWord(n) {
  if (n == null) return 'лет';
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'год';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'года';
  return 'лет';
}

function initialsFromName(name) {
  if (!name) return '—';
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '—';
}

function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return String(d);
  const m = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;
}

const mseValidText = (d) => (d?.mseIndefinite ? 'Бессрочно' : formatDate(d?.mseValidDate));

function formatTime(t) {
  return t ? String(t).slice(0, 5) : '';
}

function typeLabel(e) {
  return e?.type === 'diagnostic' ? 'Диагностика' : 'Занятие';
}

function eventTitle(e) {
  return e?.title || typeLabel(e);
}

function eventMeta(e) {
  const parts = [];
  const t = formatTime(e?.startTime);
  if (t) parts.push(t);
  if (e?.specialist) parts.push(e.specialist.fullName || fullName(e.specialist));
  if (e?.direction?.name) parts.push(e.direction.name);
  return parts.join(' · ');
}

function dayNum(d) {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '' : dt.getDate();
}

function monthShort(d) {
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][dt.getMonth()];
}

function memberMeta(m) {
  const a = recipientAge(m);
  return [a != null ? `${a} ${yearsWord(a)}` : '', m.diagnosis || ''].filter(Boolean).join(' · ');
}

const goBack = () => {
  pageStore.setPage('recipients', 'Реабилитанты', {});
};

const loadReadiness = async () => {
  if (!recipientId) return;
  readinessLoading.value = true;
  try {
    const { data } = await api.get(`/recipients/${recipientId}/readiness`);
    readiness.value = data;
  } catch (err) {
    console.error('loadReadiness', err);
    readiness.value = null;
  } finally {
    readinessLoading.value = false;
  }
};

const DOC_FORM_FIELDS = [
  'docType', 'docSeries', 'docNumber', 'docIssuer', 'docIssuerDate', 'snils',
  'mseIssueDate', 'mseValidDate', 'mseIndefinite', 'regAddress', 'factAddress', 'factSameReg',
  'educationPlace', 'specialNote'
];

const FIELD_LABELS = {
  docType: 'Тип документа',
  docSeries: 'Серия',
  docNumber: 'Номер',
  docIssuer: 'Кем выдан',
  docIssuerDate: 'Дата выдачи',
  snils: 'СНИЛС',
  mseIssueDate: 'МСЭ выдана',
  mseValidDate: 'МСЭ действительна до',
  mseIndefinite: 'Справка МСЭ бессрочная',
  regAddress: 'Адрес регистрации',
  factAddress: 'Адрес проживания',
  factSameReg: 'Проживание совпадает с регистрацией',
  educationPlace: 'Место обучения',
  specialNote: 'Особые отметки'
};
const fieldLabel = (key) => FIELD_LABELS[key] || key;

const docUpdateOpen = ref(false);
const docForm = ref({});
const docReason = ref('');
const reasonTouched = ref(false);
const docSaving = ref(false);
const docSaveError = ref('');
const docSaveOk = ref('');
const docHistory = ref([]);
const historyLoading = ref(false);

const toInputDate = (v) => (v ? String(v).slice(0, 10) : '');

const reasonValid = computed(() => docReason.value.trim().length >= 3);
const mseExpired = computed(
  () => !docForm.value.mseIndefinite && !!docForm.value.mseValidDate && docForm.value.mseValidDate < todayStr
);

const docChangedFields = computed(() => {
  const d = doc.value;
  if (!d) return [];
  return DOC_FORM_FIELDS.filter((key) => {
    const before = /Date$/.test(key) ? toInputDate(d[key]) : d[key];
    const after = docForm.value[key];
    if (typeof before === 'boolean' || typeof after === 'boolean') {
      return !!before !== !!after;
    }
    return String(before ?? '') !== String(after ?? '');
  });
});

const canSaveDoc = computed(
  () => !!doc.value && reasonValid.value && docChangedFields.value.length > 0 && !docSaveOk.value
);

const openDocUpdate = () => {
  const d = doc.value;
  if (!d) return;
  const next = {};
  for (const key of DOC_FORM_FIELDS) {
    next[key] = /Date$/.test(key) ? toInputDate(d[key]) : (d[key] ?? '');
  }
  next.factSameReg = !!d.factSameReg;
  next.mseIndefinite = !!d.mseIndefinite;
  docForm.value = next;
  docReason.value = '';
  reasonTouched.value = false;
  docSaveError.value = '';
  docSaveOk.value = '';
  docUpdateOpen.value = true;
  activeTab.value = 'profile';
};

const closeDocUpdate = () => {
  if (docSaving.value) return;
  docUpdateOpen.value = false;
};

const saveDocUpdate = async () => {
  if (!canSaveDoc.value || docSaving.value) return;
  docSaving.value = true;
  docSaveError.value = '';
  try {
    const payload = { reason: docReason.value.trim() };
    for (const key of docChangedFields.value) payload[key] = docForm.value[key];
    for (const key of Object.keys(payload)) {
      if (/Date$/.test(key) && !payload[key]) delete payload[key];
    }
    const { data } = await api.put(`/documents/${doc.value.id}`, payload);
    if (data?.doc && recipient.value?.docs?.length) {
      recipient.value.docs[0] = { ...recipient.value.docs[0], ...data.doc };
    }
    docSaveOk.value = 'Документы обновлены, прежняя версия сохранена в истории.';
    await Promise.all([loadDocHistory(true), loadReadiness()]);
  } catch (err) {
    console.error('saveDocUpdate', err);
    docSaveError.value = err?.response?.data?.message || 'Не удалось сохранить обновление';
  } finally {
    docSaving.value = false;
  }
};

const loadDocHistory = async (force = false) => {
  const d = doc.value;
  if (!d) return;
  if (historyLoading.value) return;
  if (docHistory.value.length && !force) return;
  historyLoading.value = true;
  try {
    const { data } = await api.get(`/documents/${d.id}/history`);
    docHistory.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('loadDocHistory', err);
    docHistory.value = [];
  } finally {
    historyLoading.value = false;
  }
};

const formatDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const loadRecipient = async () => {
  if (!recipientId) { loading.value = false; return; }
  try {
    const { data } = await api.get(`/recipients/${recipientId}`);
    recipient.value = data;
    hiddenCategories.value = Array.isArray(data.hiddenCategories) ? data.hiddenCategories : [];
    selectedGroupId.value = data.groupId ?? null;
  } catch (err) {
    console.error('loadRecipient', err);
  } finally {
    loading.value = false;
  }
};

const onUnlocked = async (category) => {
  await loadRecipient();
  if (category === 'scans') await loadScans(true);
};

const loadScans = async (force = false) => {
  if (!recipientId || scansLoading.value) return;
  if (scansLoaded.value && !force) return;
  scansLoading.value = true;
  try {
    const { data } = await api.get(`/recipients/${recipientId}/scans`, { params: { all: 1 } });
    const list = Array.isArray(data) ? data : (data?.scans || []);
    scansLocked.value = data?.locked === true;
    scanRows.value = list;
    scansLoaded.value = true;
  } catch (err) {
    console.error('loadScans', err);
    scanRows.value = [];
  } finally {
    scansLoading.value = false;
  }
};

const scanFileUrl = (s) => `/api/v1/recipients/${recipientId}/scans/${s.id}/file`;
const isImage = (s) =>
  /^image\//i.test(s?.mimeType || '') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(s?.originalName || '');
const scanLabel = (s) => s?.docTypeRef?.name || s?.originalName || 'Документ';const formatSize = (bytes) => {
  const b = Number(bytes) || 0;
  if (b < 1024) return b + ' Б';
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + ' КБ';
  return (b / (1024 * 1024)).toFixed(1) + ' МБ';
};
const openLightbox = (s) => { lightbox.value = scanFileUrl(s); };

const scanByCode = (code) => scans.value.find((s) => s.docTypeRef?.code === code) || null;

const showScan = (s) => {
  if (isImage(s)) openLightbox(s);
  else window.open(scanFileUrl(s), '_blank', 'noopener');
};

const openScanDoc = (s) => {
  if (!s) return;
  if (scansLocked.value || isLocked('scans')) {
    openReveal('scans', { docName: scanLabel(s), then: () => showScan(s) });
    return;
  }
  showScan(s);
};

const openEnrollScan = (d) => {
  if (!d?.scanId) return;
  const known = scanRows.value.find((s) => s.id === d.scanId);
  openScanDoc(known || {
    id: d.scanId,
    originalName: d.originalName || d.title,
    mimeType: '',
    docTypeRef: { name: d.title }
  });
};

const openScanByCode = (code) => {
  const scan = scanByCode(code);
  if (!scan) {
    if (scansLocked.value || isLocked('scans')) {
      openReveal('scans');
      return;
    }
    notify('Скан не загружен — откройте вкладку «Документы», чтобы добавить файл');
    return;
  }
  openScanDoc(scan);
};

const MAX_SCAN_MB = 15;

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const enroll = ref(null);
const enrollLoading = ref(false);
const enrollError = ref('');
const enrollBusy = ref('');
const enrollDocError = ref({});

const loadEnrollment = async () => {
  if (!recipientId || enrollLoading.value) return;
  enrollLoading.value = true;
  enrollError.value = '';
  try {
    const { data } = await api.get(`/recipients/${recipientId}/enrollment`);
    enroll.value = data;
  } catch (err) {
    console.error('loadEnrollment', err);
    enroll.value = null;
    enrollError.value = err?.response?.data?.message || 'Не удалось получить данные о зачислении';
  } finally {
    enrollLoading.value = false;
  }
};

const downloadEnrollDoc = async (d) => {
  if (enrollBusy.value) return;
  enrollBusy.value = d.key;
  enrollDocError.value = { ...enrollDocError.value, [d.key]: '' };
  try {
    const res = await api.get(`/recipients/${recipientId}/enrollment/${d.key}/file`, {
      responseType: 'blob'
    });
    const disp = res.headers?.['content-disposition'] || '';
    const m = disp.match(/filename\*=UTF-8''([^;]+)/i);
    const name = m ? decodeURIComponent(m[1]) : `${d.title}.docx`;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(`«${d.title}» скачан — распечатайте и подпишите`);
  } catch (err) {
    console.error('downloadEnrollDoc', err);
    let msg = 'Не удалось подготовить документ';
    const body = err?.response?.data;
    if (body instanceof Blob) {
      try { msg = JSON.parse(await body.text())?.message || msg; } catch {}
    } else if (body?.message) {
      msg = body.message;
    }
    enrollDocError.value = { ...enrollDocError.value, [d.key]: msg };
  } finally {
    enrollBusy.value = '';
  }
};

const pickSignedScan = async (d, event) => {
  const input = event.target;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  const setErr = (msg) => { enrollDocError.value = { ...enrollDocError.value, [d.key]: msg }; };
  setErr('');

  if (file.size > MAX_SCAN_MB * 1024 * 1024) {
    setErr(`Файл больше ${MAX_SCAN_MB} МБ — выберите файл меньшего размера`);
    return;
  }

  enrollBusy.value = 'up:' + d.key;
  try {
    const payload = {
      scans: [{
        docKey: d.scanCode,
        entityType: 'rehabilitant',
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: await fileToBase64(file)
      }]
    };
    if (d.uploaded) {
      payload.mode = 'update';
      payload.reason = `Повторная загрузка подписанного документа: ${d.title}`;
    }
    await api.post(`/recipients/${recipientId}/scans`, payload);
    notifySaved(`Скан «${d.title}» загружен`);
    await Promise.all([loadEnrollment(), loadScans(true), loadReadiness()]);
  } catch (err) {
    console.error('pickSignedScan', err);
    setErr(err?.response?.data?.message || 'Не удалось загрузить скан');
  } finally {
    enrollBusy.value = '';
  }
};

const historyScan = ref(null);
const openScanHistory = (s) => { historyScan.value = s; };
const closeScanHistory = () => { historyScan.value = null; };
const scanHistoryRows = computed(() =>
  historyScan.value ? versionsOf(historyScan.value) : []
);

const uploaderName = (row) => {
  const u = row?.uploader;
  if (!u) return 'Автор не указан';
  return u.fullName || [u.lastName, u.firstName].filter(Boolean).join(' ').trim() || u.email || 'Автор не указан';
};
const scanReasonText = (row) => row?.updateReason || 'Первичная загрузка при заведении карточки';

const docSub = ref('files');

const docTypes = ref([]);
const loadDocTypes = async () => {
  if (docTypes.value.length) return;
  try {
    const { data } = await api.get('/lists/doc-types');
    docTypes.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('loadDocTypes', err);
    docTypes.value = [];
  }
};

const DOC_GROUPS = [
  { key: 'personal', title: 'Личные документы', codes: ['birth', 'rep-pass', 'snils', 'housing'] },
  { key: 'consents', title: 'Согласия', codes: ['signed-pdn', 'signed-photo'] },
  { key: 'medical', title: 'Медицинские', codes: ['mse', 'ipra', 'med', 'cpmpk'] },
  { key: 'papers', title: 'Заявления и договоры', codes: ['signed-diag', 'signed-contract', 'signed-enroll', 'signed-plan'] }
];

const ENROLL_BLANK = {
  'signed-pdn': 'pdn',
  'signed-photo': 'photo',
  'signed-contract': 'contract',
  'signed-enroll': 'enroll'
};

const enrollRequired = computed(() => {
  const m = new Map();
  for (const d of enroll.value?.docs || []) m.set(d.scanCode, !!d.required);
  return m;
});

const DAY_MS = 86400000;
const daysUntil = (d) => {
  if (!d) return null;
  const t = new Date(String(d).slice(0, 10)).getTime();
  if (isNaN(t)) return null;
  return Math.round((t - new Date(todayStr).getTime()) / DAY_MS);
};
const dayWord = (n) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
};

const docTermInfo = (code, scan) => {
  let perpetual = !!scan?.perpetual;
  let issued = scan?.issuedAt || null;
  let until = scan?.validUntil || null;
  if (code === 'mse') {
    if (!perpetual) perpetual = !!doc.value?.mseIndefinite;
    issued = issued || doc.value?.mseIssueDate || null;
    if (!until && !perpetual) until = doc.value?.mseValidDate || null;
  }
  return { perpetual, issued, until };
};

const docTerm = (code, scan) => {
  const { perpetual, issued, until } = docTermInfo(code, scan);
  if (perpetual) return 'Бессрочный';
  const left = daysUntil(until);
  const tail = left != null && left >= 0 && left <= 30 ? ` · осталось ${left} ${dayWord(left)}` : '';
  if (issued && until) return `${formatDate(issued)} — ${formatDate(until)}${tail}`;
  if (until) return `Действует до ${formatDate(until)}${tail}`;
  if (scan?.uploadedAt) return `Загружено ${formatDate(scan.uploadedAt)}`;
  return '';
};

const docState = (code, scan, required) => {
  const signed = String(code).startsWith('signed-');
  if (!scan) {
    if (!required) return { cls: 'pill-mute', text: 'Не загружено' };
    return signed ? { cls: 'pill-wait', text: 'Ждём скан' } : { cls: 'pill-stop', text: 'Не загружен' };
  }
  const { perpetual, until } = docTermInfo(code, scan);
  if (!perpetual && until) {
    const left = daysUntil(until);
    if (left != null && left < 0) return { cls: 'pill-stop', text: 'Просрочен' };
    if (left != null && left <= 30) return { cls: 'pill-wait', text: 'Истекает' };
  }
  return { cls: 'pill-ok', text: signed ? 'Подписано' : 'Загружен' };
};

const docGroups = computed(() => {
  const types = docTypes.value;
  if (!types.length) return [];
  const byCode = new Map(types.map((t) => [t.code, t]));
  const req = enrollRequired.value;
  const used = new Set();

  const build = (code) => {
    const t = byCode.get(code);
    if (!t) return null;
    used.add(code);
    const scan = scanByCode(code);
    const required = req.has(code) ? req.get(code) : !!t.isRequired;
    return {
      code,
      name: t.name,
      required,
      entityType: t.appliesTo === 'representative' ? 'representative' : 'rehabilitant',
      scan,
      versions: scan ? versionsOf(scan).length : 0,
      state: docState(code, scan, required),
      term: docTerm(code, scan),
      blank: ENROLL_BLANK[code] || null
    };
  };

  const groups = DOC_GROUPS
    .map((g) => ({ key: g.key, title: g.title, rows: g.codes.map(build).filter(Boolean) }))
    .filter((g) => g.rows.length);

  const rest = types.filter((t) => !used.has(t.code)).map((t) => build(t.code)).filter(Boolean);
  if (rest.length) groups.push({ key: 'other', title: 'Прочие документы', rows: rest });
  return groups;
});

const docGroupsSplit = computed(() => Math.ceil(docGroups.value.length / 2));
const docGroupsLeft = computed(() => docGroups.value.slice(0, docGroupsSplit.value));
const docGroupsRight = computed(() => docGroups.value.slice(docGroupsSplit.value));

const groupPill = (g) => {
  const total = g.rows.length;
  const have = g.rows.filter((r) => r.scan).length;
  const missing = g.rows.filter((r) => !r.scan && r.required).length;
  const bad = g.rows.filter((r) => r.scan && r.state.cls !== 'pill-ok').length;
  if (!missing && !bad) return { cls: 'pill-ok', text: `${have} из ${total}` };
  const parts = [];
  if (missing) parts.push(`${missing} не загружен`);
  if (bad) parts.push(`${bad} истекает`);
  return { cls: 'pill-wait', text: parts.join(' · ') };
};

const docJournal = computed(() => {
  const rows = [];
  for (const h of docHistory.value) {
    rows.push({
      key: 'f' + h.id,
      at: h.changedAt,
      author: h.authorName || 'Автор не указан',
      reason: h.reason,
      fields: (h.changedFields || []).length
        ? 'Изменено: ' + h.changedFields.map(fieldLabel).join(', ')
        : ''
    });
  }
  const byType = new Map();
  for (const s of scanRows.value) {
    if (!byType.has(s.docType)) byType.set(s.docType, []);
    byType.get(s.docType).push(s);
  }
  for (const list of byType.values()) {
    const ordered = list.slice().sort((a, b) => a.id - b.id);
    ordered.forEach((s, i) => {
      rows.push({
        key: 's' + s.id,
        at: s.uploadedAt,
        author: uploaderName(s),
        reason: s.updateReason || (i === 0 ? 'Первичная загрузка файла' : 'Причина замены не указана'),
        fields: `Файл «${scanLabel(s)}» · версия ${i + 1} из ${ordered.length}`
      });
    });
  }
  return rows
    .filter((r) => r.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
});

const uploadOpen = ref(false);
const uploadCode = ref('');
const uploadScan = ref(null);
const uploadFile = ref(null);
const uploadPreview = ref('');
const uploadIssuedAt = ref('');
const uploadValidUntil = ref('');
const uploadPerpetual = ref(false);
const uploadReason = ref('');
const uploadTouched = ref(false);
const uploadSaving = ref(false);
const uploadError = ref('');
const uploadInputRef = ref(null);

const uploadTypes = computed(() =>
  docTypes.value.map((t) => ({ code: t.code, name: t.name }))
);
const uploadIsReplace = computed(() => !!uploadScan.value);
const uploadTypeName = computed(
  () => docTypes.value.find((t) => t.code === uploadCode.value)?.name || 'Новый документ'
);
const uploadReasonValid = computed(
  () => !uploadIsReplace.value || uploadReason.value.trim().length >= 3
);
const canSaveUpload = computed(
  () => !!uploadCode.value && !!uploadFile.value && uploadReasonValid.value && !uploadSaving.value
);
const uploadPrevTerm = computed(() => {
  const s = uploadScan.value;
  if (!s) return '';
  return docTerm(uploadCode.value, s);
});
const uploadNextTerm = computed(() => {
  if (uploadPerpetual.value) return 'Бессрочный';
  if (uploadIssuedAt.value && uploadValidUntil.value) return `${formatDate(uploadIssuedAt.value)} — ${formatDate(uploadValidUntil.value)}`;
  if (uploadValidUntil.value) return `Действует до ${formatDate(uploadValidUntil.value)}`;
  return 'срок не указан';
});

const revokeUploadPreview = () => {
  if (uploadPreview.value) URL.revokeObjectURL(uploadPreview.value);
  uploadPreview.value = '';
};

const openUpload = (row = null) => {
  uploadCode.value = row?.code || '';
  uploadScan.value = row?.scan || null;
  uploadFile.value = null;
  revokeUploadPreview();
  const info = row ? docTermInfo(row.code, row.scan) : { perpetual: false, issued: null, until: null };
  uploadIssuedAt.value = info.issued ? String(info.issued).slice(0, 10) : '';
  uploadValidUntil.value = info.until ? String(info.until).slice(0, 10) : '';
  uploadPerpetual.value = !!info.perpetual;
  uploadReason.value = '';
  uploadTouched.value = false;
  uploadError.value = '';
  uploadOpen.value = true;
};

const closeUpload = () => {
  if (uploadSaving.value) return;
  revokeUploadPreview();
  uploadOpen.value = false;
  uploadFile.value = null;
};

const pickUploadFile = (event) => {
  const file = event.target.files?.[0] || null;
  uploadError.value = '';
  revokeUploadPreview();
  if (!file) { uploadFile.value = null; return; }
  if (file.size > MAX_SCAN_MB * 1024 * 1024) {
    uploadFile.value = null;
    uploadError.value = `Файл больше ${MAX_SCAN_MB} МБ — выберите файл поменьше`;
    if (uploadInputRef.value) uploadInputRef.value.value = '';
    return;
  }
  uploadFile.value = file;
  if (/^image\//i.test(file.type)) uploadPreview.value = URL.createObjectURL(file);
};

const saveUpload = async () => {
  if (!canSaveUpload.value) return;
  uploadSaving.value = true;
  uploadError.value = '';
  try {
    const file = uploadFile.value;
    const type = docTypes.value.find((t) => t.code === uploadCode.value);
    const payload = {
      scans: [{
        docKey: uploadCode.value,
        entityType: type?.appliesTo === 'representative' ? 'representative' : 'rehabilitant',
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64: await fileToBase64(file),
        issuedAt: uploadIssuedAt.value || null,
        validUntil: uploadPerpetual.value ? null : (uploadValidUntil.value || null),
        perpetual: uploadPerpetual.value
      }]
    };
    if (uploadIsReplace.value) {
      payload.mode = 'update';
      payload.reason = uploadReason.value.trim();
    }
    await api.post(`/recipients/${recipientId}/scans`, payload);
    uploadOpen.value = false;
    revokeUploadPreview();
    uploadFile.value = null;
    notifySaved(uploadIsReplace.value
      ? 'Файл заменён, прежняя версия осталась в истории'
      : 'Документ загружен');
    await Promise.all([loadScans(true), loadReadiness(), loadEnrollment(true)]);
  } catch (err) {
    console.error('saveUpload', err);
    uploadError.value = err?.response?.data?.message || 'Не удалось сохранить документ';
  } finally {
    uploadSaving.value = false;
  }
};

const scanVersionRows = computed(() => {
  const list = scanHistoryRows.value;
  const n = list.length;
  return list.map((v, i) => ({
    ...v,
    verNo: n - i,
    term: [v.perpetual ? 'бессрочный' : null,
           v.issuedAt ? 'выдан ' + formatDate(v.issuedAt) : null,
           v.validUntil ? 'действует до ' + formatDate(v.validUntil) : null]
      .filter(Boolean).join(' · ') || 'срок не указан'
  }));
});

onUnmounted(revokeUploadPreview);

const loadGroups = async () => {
  if (allGroups.value.length || groupsLoading.value) return;
  groupsLoading.value = true;
  try {
    const { data } = await api.get('/groups', { params: { limit: 200 } });
    allGroups.value = Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('loadGroups', err);
    allGroups.value = [];
  } finally {
    groupsLoading.value = false;
  }
};

const saveGroup = async () => {
  if (!groupChanged.value) return;
  savingGroup.value = true;
  try {
    const { data } = await api.put(`/recipients/${recipientId}`, { groupId: selectedGroupId.value });
    recipient.value = data;
    selectedGroupId.value = data.groupId ?? null;
    groupMembers.value = [];
    await loadGroupMembers();
    loadReadiness();
    notifySaved('Группа сохранена');
  } catch (err) {
    console.error('saveGroup', err);
    alert('Не удалось сохранить группу');
  } finally {
    savingGroup.value = false;
  }
};

const loadGroupMembers = async () => {
  const gId = recipient.value?.groupId;
  if (!gId) return;
  groupMembersLoading.value = true;
  try {
    const { data } = await api.get(`/groups/${gId}/recipients`);
    groupMembers.value = Array.isArray(data) ? data : [];
  } catch {
    groupMembers.value = [];
  } finally {
    groupMembersLoading.value = false;
  }
};

const loadAssignments = async () => {
  if (!recipientId) return;
  assignmentsLoading.value = true;
  try {
    const { data } = await api.get('/schedule/sessions', { params: { recipientId } });
    const list = (Array.isArray(data) ? data : []).filter((s) => s.status !== 'cancelled');
    sessions.value = list;
    if (!list.some((s) => s.id === selectedHistoryId.value)) {
      selectedHistoryId.value = list.length ? list[0].id : null;
    }
    assignments.value = list
      .flatMap((s) => (s.blocks || []).map((b) => ({
        id: b.id,
        direction: b.direction || null,
        specialist: b.specialistName ? { fullName: b.specialistName } : null,
        date: b.date,
        published: b.blockStatus === 'completed',
        results: b.results || null
      })));
  } catch (err) {
    console.error('loadAssignments', err);
    sessions.value = [];
    assignments.value = [];
  } finally {
    assignmentsLoading.value = false;
  }
};


const loadAgenda = async () => {
  if (!recipientId || agendaLoaded.value || agendaLoading.value) return;
  agendaLoading.value = true;
  try {
    const { data } = await api.get(`/recipients/${recipientId}/agenda`);
    events.value = Array.isArray(data?.events) ? data.events : [];
    agendaLoaded.value = true;
  } catch (err) {
    console.error('loadAgenda', err);
    events.value = [];
  } finally {
    agendaLoading.value = false;
  }
};

const initAttendance = () => {
  const r = recipient.value;
  const savedDate = r?.attendanceDate ? String(r.attendanceDate).slice(0, 10) : null;
  if (r && r.attendanceStatus && savedDate === todayStr) {
    attSavedStatus.value = r.attendanceStatus;
    attStatus.value = r.attendanceStatus;
  } else {
    attSavedStatus.value = null;
    attStatus.value = null;
  }
};

const saveAttendance = async () => {
  if (!attStatus.value || attSaving.value) return;
  attSaving.value = true;
  try {
    await api.put(`/recipients/${recipientId}/attendance`, { status: attStatus.value });
    attSavedStatus.value = attStatus.value;
    if (recipient.value) {
      recipient.value.attendanceStatus = attStatus.value;
      recipient.value.attendanceDate = todayStr;
    }
    notifySaved('Отметка посещения сохранена');
  } catch (err) {
    console.error('saveAttendance', err);
    alert('Не удалось сохранить отметку посещения');
  } finally {
    attSaving.value = false;
  }
};

const CATEGORY_LABELS = {
  passport: 'Паспортные данные и СНИЛС',
  scans: 'Сканы документов',
  contacts: 'Адреса и телефоны',
  medical: 'Диагноз и медицинские сведения'
};

const revealOpen = ref(false);
const revealCategory = ref('');
const revealReasonCode = ref('');
const revealReasonText = ref('');
const revealSending = ref(false);
const revealError = ref('');
const revealReasons = ref([]);
const revealMinutes = ref(30);
const revealDocName = ref('');
let accessOptionsPromise = null;
let revealPending = null;

const revealLabel = computed(
  () => revealDocName.value || CATEGORY_LABELS[revealCategory.value] || 'Персональные данные'
);
const revealTitle = computed(() =>
  revealDocName.value ? 'Открыть скан документа' : 'Для чего вы хотите получить информацию?'
);
const revealReasonKey = computed(() =>
  revealDocName.value ? 'Причина просмотра документа' : 'Причина получения информации'
);
const revealHint = computed(() =>
  revealDocName.value
    ? 'Например: сверяю срок действия перед подготовкой договора'
    : 'Коротко опишите, зачем нужны эти данные'
);
const revealNote = computed(() =>
  revealDocName.value
    ? `Файл откроется после подтверждения. Доступ к сканам откроется на ${revealMinutes.value} минут, запись о просмотре сохранится в журнале.`
    : `Доступ откроется на ${revealMinutes.value} минут и только по этому реабилитанту. Запись о том, кто, когда и зачем открыл данные, сохранится в журнале.`
);
const revealSubmitText = computed(() =>
  revealDocName.value ? 'Открыть документ' : 'Открыть данные'
);
const canReveal = computed(() =>
  !!revealReasonCode.value &&
  !revealSending.value &&
  (revealReasonCode.value !== 'other' || revealReasonText.value.trim().length >= 10)
);

const openReveal = async (category, options = {}) => {
  revealCategory.value = category;
  revealDocName.value = options.docName || '';
  revealPending = typeof options.then === 'function' ? options.then : null;
  revealReasonCode.value = '';
  revealReasonText.value = '';
  revealError.value = '';
  revealOpen.value = true;
  try {
    if (!accessOptionsPromise) {
      accessOptionsPromise = api.get('/recipients/access/options').then((r) => r.data);
    }
    const data = await accessOptionsPromise;
    revealReasons.value = data.reasons || [];
    revealMinutes.value = data.grantMinutes || 30;
  } catch (err) {
    accessOptionsPromise = null;
    revealError.value = 'Не удалось загрузить список причин';
  }
};

const closeReveal = () => {
  if (revealSending.value) return;
  revealPending = null;
  revealOpen.value = false;
};

const submitReveal = async () => {
  if (!canReveal.value) return;
  revealSending.value = true;
  revealError.value = '';
  try {
    await api.post(`/recipients/${recipientId}/access`, {
      category: revealCategory.value,
      reasonCode: revealReasonCode.value,
      reasonText: revealReasonText.value.trim()
    });
    const category = revealCategory.value;
    const then = revealPending;
    revealPending = null;
    revealOpen.value = false;
    notifySaved(`Доступ открыт на ${revealMinutes.value} минут. Причина записана в журнал.`);
    onUnlocked(category);
    if (then) then();
  } catch (err) {
    revealError.value = err?.response?.data?.message || 'Не удалось открыть данные';
  } finally {
    revealSending.value = false;
  }
};

const splitCode = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const m = raw.match(/^(\S+)\s*[—–-]\s*(.+)$/);
  return m ? { code: m[1], name: m[2] } : { code: '', name: raw };
};

const district = computed(() => splitCode(doc.value?.district));

const cycleOfSession = computed(() => {
  const map = new Map();
  for (const c of cycles.value) for (const s of c.sessions) map.set(s.id, c.num);
  return map;
});

const VERDICT_PILL = { recommended: 'pill-ok', trial: 'pill-wait', rejected: 'pill-stop' };

const diagHistoryRows = computed(() =>
  historySessions.value
    .slice()
    .reverse()
    .map((s) => {
      const v = s.conclusion?.verdict || null;
      return {
        id: s.id,
        date: s.date,
        title: `${s.kindLabel || 'Диагностика'} · цикл ${cycleOfSession.value.get(s.id) || '—'}`,
        pill: v ? VERDICT_PILL[v] || 'pill-mute' : 'pill-mute',
        pillText: v ? verdictLabel(v) : sessionStatus(s).label
      };
    })
);

const selectedCycle = ref(null);

const cycleRows = computed(() => {
  const list = cycles.value;
  const starts = list.map((c) => {
    const dates = c.sessions.map((s) => String(s.date).slice(0, 10)).sort();
    return dates[0] || null;
  });
  return list
    .map((c, idx) => {
      const dates = c.sessions.map((s) => String(s.date).slice(0, 10)).sort();
      const closed = c.sessions.some((s) => s.kind === 'final' && s.conclusion);
      return {
        num: c.num,
        sessions: c.sessions.slice().reverse(),
        closed,
        active: !closed && c.num === list.length,
        from: dates[0] || null,
        to: closed ? dates[dates.length - 1] : null,
        windowTo: starts[idx + 1] || null,
        count: c.sessions.length,
        final: c.sessions.find((s) => s.kind === 'final' && s.conclusion) || null
      };
    })
    .reverse();
});

const activeCycle = computed(
  () => cycleRows.value.find((r) => r.num === selectedCycle.value) || cycleRows.value[0] || null
);

watch(cycleRows, (rows) => {
  if (!rows.some((r) => r.num === selectedCycle.value)) {
    selectedCycle.value = rows.length ? rows[0].num : null;
  }
}, { immediate: true });

const cycleMeta = (row) => {
  const count = `диагностик: ${row.count}`;
  if (!row.from) return count;
  if (row.to && row.to !== row.from) return `${formatDate(row.from)} – ${formatDate(row.to)} · ${count}`;
  return `с ${formatDate(row.from)} · ${count}`;
};

const cycleLessons = (row) => {
  const list = lessonEvents.value.filter((e) => {
    const d = String(e.date).slice(0, 10);
    if (row?.from && d < row.from) return false;
    if (row?.windowTo && d >= row.windowTo) return false;
    return true;
  });
  return { total: list.length, done: list.filter((e) => e.status === 'completed').length };
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

const diagTone = (s) => {
  const v = s?.conclusion?.verdict;
  if (v === 'recommended' || v === 'trial') return 'is-ok';
  if (v === 'rejected') return 'is-stop';
  if (s?.conclusion) return 'is-ok';
  return sessionStatus(s).tone === 'sage' ? 'is-ok' : 'is-wait';
};

const diagPill = (s) => {
  const v = s?.conclusion?.verdict;
  if (v) return { cls: VERDICT_PILL[v] || 'pill-mute', text: capitalize(verdictLabel(v)) };
  const st = sessionStatus(s);
  return { cls: st.tone === 'sage' ? 'pill-ok' : 'pill-wait', text: st.label };
};

const diagWhen = (s) =>
  `${formatDate(s.date)} · ${s.completed} из ${s.total || 0} направлений сдано`;

const DIR_ICON = {
  log: ['M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', 'M8.5 10.5h7', 'M8.5 14h4'],
  psy: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', 'M12 7a2.4 2.4 0 0 0-2.4 2.4c0 .8.4 1.5 1 1.9a2.4 2.4 0 0 0-1 1.9A2.4 2.4 0 0 0 12 15.6a2.4 2.4 0 0 0 2.4-2.4c0-.8-.4-1.5-1-1.9.6-.4 1-1.1 1-1.9A2.4 2.4 0 0 0 12 7z'],
  afk: ['M22 12h-4l-3 9-6-18-3 9H2'],
  izo: ['M12 19l7-7 3 3-7 7-3-3z', 'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z', 'M2 2l7.586 7.586', 'M11 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0z'],
  theatre: ['M4 4h7v9a3.5 3.5 0 0 1-7 0z', 'M13 7h7v9a3.5 3.5 0 0 1-7 0z'],
  vocal: ['M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z', 'M19 10v1a7 7 0 0 1-14 0v-1', 'M12 18v4', 'M8 22h8'],
  instrument: ['M9 18V5l12-2v13', 'M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', 'M21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z']
};
const DIR_ICON_DEFAULT = ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6'];
const dirIcon = (b) => DIR_ICON[b?.profileKey] || DIR_ICON_DEFAULT;

const dirScores = (b) =>
  (Array.isArray(b?.results?.scores) ? b.results.scores : [])
    .filter((x) => x && x.value !== null && x.value !== undefined && x.value !== '');

const dirAnswers = (b) =>
  (Array.isArray(b?.results?.answers) ? b.results.answers : []).filter((x) => x && x.label && x.value);

const dirScore = (b) => {
  const v = averageScore(b?.results);
  if (v != null) return { value: v.toFixed(1).replace('.', ','), unit: ' / 4' };
  const sc = dirScores(b);
  if (!sc.length) return null;
  const sum = sc.reduce((a, x) => a + Number(x.value), 0);
  const max = sc.reduce((a, x) => a + (Number(x.max) || 0), 0);
  return { value: String(sum), unit: max ? ` / ${max}` : '' };
};

const hasScore = (v) => v !== null && v !== undefined && v !== '';

const dirCriteria = (b) => {
  const block = getBlock(b?.profileKey);
  if (!block) return [];
  const values = b?.results?.criteria || {};
  return block.criteria.map((c) => ({
    id: c.id,
    label: c.label,
    value: hasScore(values[c.id]) ? Number(values[c.id]) : null
  }));
};

const dirGraded = (b) => dirCriteria(b).filter((c) => c.value !== null).length;

const dirRows = (b) => {
  const schema = dirCriteria(b);
  if (schema.some((c) => c.value !== null)) {
    return schema.map((c) => ({ key: 'c-' + c.id, kind: 'scale', label: c.label, value: c.value, max: 4 }));
  }
  const rows = [
    ...dirScores(b).map((x, i) => ({
      key: 's-' + (x.key || i), kind: 'scale', label: x.label,
      value: Number(x.value), max: Number(x.max) || 4
    })),
    ...dirAnswers(b).map((x, i) => ({ key: 'a-' + i, kind: 'text', label: x.label, value: x.value }))
  ];
  if (rows.length) return rows;
  return schema.map((c) => ({ key: 'c-' + c.id, kind: 'scale', label: c.label, value: c.value, max: 4 }));
};

const dirRowsFilled = (b) => dirRows(b).filter((r) => r.value !== null && r.value !== undefined && r.value !== '').length;

const critCountLabel = (b) => {
  const total = dirRows(b).length;
  const filled = dirRowsFilled(b);
  return filled === total ? String(total) : `${filled} из ${total}`;
};

const ticksOf = (max) => Array.from({ length: (Number(max) || 4) + 1 }, (_, i) => i);
const rowAria = (r) =>
  r.value === null || r.value === undefined || r.value === ''
    ? 'не заполнено'
    : (r.kind === 'scale' ? `Оценка ${r.value} из ${r.max}` : String(r.value));

const dirComment = (b) => (b?.results?.comment || b?.comment || '').trim();

const legacyTitle = (x) => String(x?.sub || x?.direction || 'Блок').replace(/\s*\n\s*/g, ' ').trim();

const dirLegacy = (b) => {
  const blocks = b?.results?.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((x) =>
      (typeof x?.recs === 'string' && x.recs.trim()) ||
      (Array.isArray(x?.specialists) && x.specialists.length)
    )
    .map((x) => ({
      title: legacyTitle(x),
      specialists: Array.isArray(x.specialists) ? x.specialists.join(', ') : '',
      recs: typeof x.recs === 'string' ? x.recs.trim() : ''
    }));
};

const CRIT_HINT = SCALE.map((s) => `${s.short} — ${s.label.toLowerCase()}`).join(' · ');

const lessonEvents = computed(() => events.value.filter((e) => e.type !== 'diagnostic'));
const lessonsDone = computed(() => lessonEvents.value.filter((e) => e.status === 'completed').length);

const ATT_LABELS = { present: 'Был', absent: 'Не был', left: 'Ушёл раньше' };
const ATT_PILL = { present: 'pill-ok', absent: 'pill-stop', left: 'pill-wait' };

const eventPill = (e) => {
  if (e?.status === 'cancelled') return { cls: 'pill-stop', text: 'Отменено' };
  if (e?.status === 'completed') return { cls: 'pill-ok', text: 'Проведено' };
  return { cls: 'pill-mute', text: 'Запланировано' };
};

const OKRUGA = [
  'ЦАО — Центральный', 'САО — Северный', 'СВАО — Северо-Восточный', 'ВАО — Восточный',
  'ЮВАО — Юго-Восточный', 'ЮАО — Южный', 'ЮЗАО — Юго-Западный', 'ЗАО — Западный',
  'СЗАО — Северо-Западный', 'ЗелАО — Зеленоградский', 'ТАО — Троицкий', 'НАО — Новомосковский',
  'Московская область', 'Другой регион'
];

const cardEditOpen = ref(false);
const cardForm = ref({ fio: '', birthDate: '', educationPlace: '', district: '' });
const cardReason = ref('');
const cardTouched = ref(false);
const cardSaving = ref(false);
const cardError = ref('');

const cardFioParts = computed(() => {
  const parts = String(cardForm.value.fio || '').trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] || '',
    firstName: parts[1] || '',
    middleName: parts.slice(2).join(' ')
  };
});
const cardReasonValid = computed(() => cardReason.value.trim().length >= 3);
const cardFioValid = computed(() => !!cardFioParts.value.lastName && !!cardFioParts.value.firstName);
const canSaveCard = computed(() => cardReasonValid.value && cardFioValid.value && !cardSaving.value);

const openCardEdit = () => {
  const r = recipient.value;
  if (!r) return;
  cardForm.value = {
    fio: [r.lastName, r.firstName, r.middleName].filter(Boolean).join(' '),
    birthDate: toInputDate(r.birthDate),
    educationPlace: doc.value?.educationPlace || '',
    district: doc.value?.district || ''
  };
  cardReason.value = '';
  cardTouched.value = false;
  cardError.value = '';
  cardEditOpen.value = true;
};
const closeCardEdit = () => { if (!cardSaving.value) cardEditOpen.value = false; };

const saveCardEdit = async () => {
  cardTouched.value = true;
  if (!canSaveCard.value) return;
  cardSaving.value = true;
  cardError.value = '';
  try {
    const { data } = await api.patch(`/recipients/${recipientId}/card`, {
      ...cardFioParts.value,
      birthDate: cardForm.value.birthDate,
      educationPlace: cardForm.value.educationPlace,
      district: cardForm.value.district,
      reason: cardReason.value.trim()
    });
    if (data?.recipient) {
      recipient.value = data.recipient;
      hiddenCategories.value = data.recipient.hiddenCategories || [];
    }
    cardEditOpen.value = false;
    notifySaved('Карточка обновлена');
    loadReadiness();
    loadDocHistory(true);
  } catch (err) {
    cardError.value = err?.response?.data?.message || 'Не удалось сохранить изменения';
  } finally {
    cardSaving.value = false;
  }
};

watch(activeTab, (tab) => {
  if (tab === 'lessons') {
    loadGroups();
    if (!groupMembers.value.length && !groupMembersLoading.value) loadGroupMembers();
  } else if (tab === 'diagnostics') {
    loadAssignments();
  } else if (tab === 'documents') {
    loadScans();
    loadDocTypes();
    loadDocHistory();
    loadEnrollment();
  } else if (tab === 'profile') {
    loadDocHistory();
  } else if (tab === 'enrollment') {
    loadEnrollment();
  }
});

const overlayOpen = computed(() => !!(
  docUpdateOpen.value || cancelTarget.value || cardEditOpen.value ||
  revealOpen.value || uploadOpen.value || historyScan.value ||
  lightbox.value || heroPhotoOpen.value
));
watch(overlayOpen, (open) => {
  if (open) ui.lockScroll();
  else ui.unlockScroll();
});

onMounted(async () => {
  await loadRecipient();
  initAttendance();
  loadAgenda();
  loadReadiness();
  loadAssignments();
  loadScans();
  loadEnrollment();
  const wanted = pageStore.params?.tab;
  if (wanted && tabs.some((t) => t.id === wanted)) activeTab.value = wanted;
});

onUnmounted(() => {
  if (overlayOpen.value) ui.unlockScroll();
});
</script>

<style scoped>
.rd-page {
  --font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --paper: #FFFFFF;
  --paper-soft: #F3EEE4;
  --paper-sunken: #EDE8DD;
  --ink: #1A211A;
  --ink-strong: #0F140F;
  --ink-muted: #454C40;
  --ink-subtle: #4A5044;
  --line: #E4DECF;
  --line-soft: #EFEADC;
  --line-strong: #D6CFBE;
  --sage-900: #1E2F1E;
  --sage-800: #2A4129;
  --sage-700: #2F4A2F;
  --sage-500: #5F7E45;
  --sage-100: #E0EBD1;
  --sage-50: #EEF4E2;
  --amber-700: #6F4514;
  --amber-100: #F5E3C4;
  --amber-50: #FBF1DD;
  --rose-700: #6E2B22;
  --rose-500: #B0533F;
  --rose-100: #F3D8CE;
  --rose-50: #FAE9E0;
  --blue-700: #1F3D52;
  --blue-100: #D4E1EB;
  --blue-50: #E8EFF5;
  --action: #1E2F1E;
  --action-hover: #2A4129;
  --action-ink: #F4F8EC;
  --cycle: #453A2C;
  --cycle-tint: #F0E9DC;
  --cycle-line: #DDD2BE;
  --stage: #144A63;
  --stage-tint: #E6EEF3;
  --stage-line: #C3D6E1;
  --stage-ink: #F2F8FB;
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.125rem;
  --radius-xl: 1.5rem;
  --shadow-sm: 0 0.0625rem 0.125rem rgba(30, 47, 30, 0.05);
  --shadow-md: 0 0.25rem 0.875rem rgba(30, 47, 30, 0.06), 0 0.0625rem 0.125rem rgba(30, 47, 30, 0.04);

  max-width: 87.5rem;
  margin: 0 auto;
  font-family: var(--font-sans);
  color: var(--ink);
  line-height: 1.55;
}

.rd-page *,
.rd-page *::before,
.rd-page *::after { box-sizing: border-box; }

.rd-loading, .rd-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 18rem; gap: 1rem; color: var(--ink-muted);
}
.spinner {
  width: 2.5rem; height: 2.5rem;
  border: 0.25rem solid rgba(47, 74, 47, 0.18);
  border-top-color: var(--sage-700); border-radius: 50%;
  animation: rd-spin 0.8s linear infinite;
}
@keyframes rd-spin { to { transform: rotate(360deg); } }

.breadcrumb {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.9375rem; color: var(--ink-muted); flex-wrap: wrap;
  margin-bottom: 1.25rem;
}
.breadcrumb .bc-link {
  cursor: pointer; border-radius: 0.375rem; padding: 0.25rem 0.4375rem; margin: -0.1875rem -0.375rem;
  transition: background 0.12s, color 0.12s;
}
.breadcrumb .bc-link:hover { background: var(--paper-soft); color: var(--ink); }
.breadcrumb .current { color: var(--ink-strong); font-weight: 500; }
.breadcrumb .sep { color: var(--ink-muted); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4375rem;
  padding: 0.625rem 1rem; min-height: 2.75rem;
  border-radius: 0.625rem; font-size: 0.9375rem; font-weight: 500;
  border: 0.0625rem solid transparent; white-space: nowrap; text-decoration: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  cursor: pointer;
}
.btn svg { width: 1rem; height: 1rem; flex: 0 0 1rem; }
.btn-primary { background: var(--action); color: var(--action-ink); border-color: var(--action); }
.btn-primary:hover:not(:disabled) { background: var(--action-hover); border-color: var(--action-hover); }
.btn-secondary { background: var(--paper); color: var(--ink); border-color: var(--line-strong); }
.btn-secondary:hover:not(:disabled) { background: var(--paper-soft); border-color: var(--ink-muted); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

.alert {
  display: flex; align-items: center; gap: 0.875rem; flex-wrap: wrap;
  background: var(--rose-50);
  border: 0.0625rem solid var(--rose-100);
  border-left: 0.25rem solid var(--rose-500);
  border-radius: var(--radius-md);
  padding: 0.875rem 1rem; margin-bottom: 1rem;
}
.alert-ic {
  flex: 0 0 2rem; width: 2rem; height: 2rem; border-radius: 0.5rem;
  background: var(--rose-100); color: var(--rose-700); display: grid; place-items: center;
}
.alert-ic svg { width: 1.125rem; height: 1.125rem; }
.alert-body { flex: 1 1 16rem; min-width: 0; }
.alert-title {
  font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--rose-700);
}
.alert-text { font-size: 0.9375rem; color: var(--ink-strong); }
.alert-action:focus-visible { outline: 0.125rem solid var(--rose-500); outline-offset: 0.125rem; }

.hero {
  background: var(--paper); border: 0.0625rem solid var(--line); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm); overflow: hidden; margin-bottom: 1.5rem;
}
.hero-body {
  display: grid; grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.25rem; align-items: center; padding: 1.5rem;
}
.hero-ava {
  width: 5.5rem; height: 5.5rem; flex: 0 0 5.5rem; border-radius: 50%; object-fit: cover;
  display: grid; place-items: center; background: var(--sage-100); color: var(--sage-700);
  font-family: var(--font-serif); font-size: 2rem;
  border: 0.1875rem solid var(--paper); box-shadow: var(--shadow-md);
}
.hero-id { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.375rem; }
.id-chip {
  font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.04em; color: var(--ink-muted);
  background: var(--paper-soft); padding: 0.125rem 0.5rem; border-radius: 0.25rem;
}
.status {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; font-weight: 600; color: var(--sage-700);
}
.status::before {
  content: ''; width: 0.4375rem; height: 0.4375rem; border-radius: 50%;
  background: var(--sage-500); box-shadow: 0 0 0 0.1875rem var(--sage-100);
}
.status.st-draft { color: var(--amber-700); }
.status.st-draft::before { background: #B07223; box-shadow: 0 0 0 0.1875rem var(--amber-100); }
.status.st-archived { color: var(--ink-muted); }
.status.st-archived::before { background: var(--ink-subtle); box-shadow: 0 0 0 0.1875rem var(--paper-sunken); }
.stage-chip {
  font-size: 0.75rem; color: var(--ink-muted); background: var(--paper-soft);
  padding: 0.125rem 0.5rem; border-radius: 62.5rem;
}

.hero-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.hero-name {
  font-family: var(--font-serif); font-size: 2rem; line-height: 1.1; font-weight: 500;
  letter-spacing: -0.02em; color: var(--ink-strong); margin: 0; word-break: break-word;
}
.icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.5rem; height: 2.5rem; flex: 0 0 2.5rem;
  border: 0.0625rem solid var(--line-strong); border-radius: 0.625rem;
  background: var(--paper); color: var(--ink-muted); cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.icon-btn:hover:not(:disabled) { background: var(--paper-soft); color: var(--action); border-color: var(--ink-muted); }
.icon-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.icon-btn svg { width: 1.0625rem; height: 1.0625rem; }
.icon-btn-sm { width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem; }
.icon-btn-sm svg { width: 0.9375rem; height: 0.9375rem; }

.hero-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem; }
.tag { font-size: 0.78125rem; padding: 0.1875rem 0.625rem; border-radius: 62.5rem; font-weight: 500; }
.tag-neutral { background: var(--paper-soft); color: var(--ink-muted); }
.tag-blue { background: var(--blue-50); color: var(--blue-700); }
.tag-cycle { background: var(--cycle-tint); color: var(--cycle); }
.tag-sage { background: var(--sage-50); color: var(--sage-700); }
.hero-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.route { border-top: 0.0625rem solid var(--line-soft); background: var(--paper-soft); padding: 1.125rem 1.5rem; }
.route-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.875rem; }
.route-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--ink-muted); }
.route-done { font-size: 0.75rem; font-weight: 700; padding: 0.1875rem 0.5625rem; border-radius: 62.5rem; background: var(--sage-100); color: var(--sage-700); }
.route-load { font-size: 0.8125rem; color: var(--ink-subtle); }

.steps { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; list-style: none; margin: 0; padding: 0; }
.step { display: flex; flex-direction: column; gap: 0.3125rem; padding-top: 0.875rem; position: relative; }
.step::before { content: ''; position: absolute; top: 0.3125rem; left: 0; right: 0; height: 0.25rem; border-radius: 62.5rem; background: var(--line-strong); }
.step.done::before { background: var(--sage-500); }
.step.current::before { background: var(--amber-700); }
.step.current.warn::before { background: var(--amber-700); }
.step-num { font-size: 0.75rem; font-weight: 700; color: var(--ink-muted); }
.step.current .step-num { color: var(--amber-700); }
.step.current.warn .step-num { color: var(--amber-700); }
.step-name {
  display: inline-flex; align-items: center; gap: 0.25rem; padding: 0; border: none; background: none;
  font: inherit; font-size: 0.9375rem; line-height: 1.25; text-align: left; color: var(--ink-muted); cursor: pointer;
}
.step.done .step-name { color: var(--ink); }
.step.current .step-name { color: var(--ink-strong); font-weight: 600; }
.step-name:hover { text-decoration: underline; text-underline-offset: 0.15rem; }
.step-name svg { width: 0.75rem; height: 0.75rem; flex: none; opacity: 0; transition: opacity 0.12s; }
.step-name:hover svg, .step-name:focus-visible svg { opacity: 0.7; }

.step-mark {
  display: inline-flex; align-items: center; gap: 0.3125rem; align-self: flex-start;
  font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
  padding: 0.1875rem 0.5rem 0.1875rem 0.375rem; border-radius: 62.5rem;
  background: var(--amber-700); color: #FFF7EA;
}
.step-mark svg { width: 0.8125rem; height: 0.8125rem; flex: 0 0 0.8125rem; }
.step.warn .step-mark { background: var(--amber-700); color: #FFF7EA; }

.tabs {
  display: flex; gap: 0.375rem;
  width: 100%; max-width: 100%; margin: 0 auto 1.5rem;
  justify-content: center;
  justify-content: safe center;
  padding: 0.375rem 0.5rem;
  background: var(--paper); border: 0.0625rem solid var(--line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-sm);
  overflow-x: auto; scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  display: inline-flex; align-items: center; gap: 0.4375rem; padding: 0.5rem 1.125rem; min-height: 2.75rem;
  font-size: 0.9375rem; font-weight: 500; color: var(--ink-muted); background: none; border: none;
  border-radius: 0.625rem; white-space: nowrap; cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.tab:hover { background: var(--paper-soft); color: var(--ink-strong); }
.tab[aria-selected="true"] {
  color: var(--action); font-weight: 600; background: var(--sage-50);
  box-shadow: inset 0 0 0 0.125rem var(--sage-700);
}
.tab-count {
  font-size: 0.75rem; font-weight: 600; color: var(--ink-muted); background: var(--paper-soft);
  border: 0.0625rem solid var(--line); border-radius: 62.5rem; padding: 0.0625rem 0.4375rem;
}
.tab[aria-selected="true"] .tab-count { background: var(--sage-100); color: var(--sage-700); border-color: var(--sage-100); }
.tab-alert {
  display: inline-flex; align-items: center; gap: 0.1875rem;
  font-size: 0.75rem; font-weight: 700;
  color: var(--rose-700); background: var(--rose-50);
  border: 0.0625rem solid var(--rose-100); border-radius: 62.5rem;
  padding: 0.125rem 0.4375rem;
}
.tab-alert svg { width: 0.75rem; height: 0.75rem; }

.tabpanel { animation: rd-panel 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); }
@keyframes rd-panel { from { opacity: 0; transform: translateY(0.5rem); } to { opacity: 1; transform: none; } }

.grid { display: grid; grid-template-columns: minmax(0, 1fr) 21.25rem; gap: 1.5rem; align-items: start; }
.grid > div, .grid > aside { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }

.card { background: var(--paper); border: 0.0625rem solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.card-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem;
  padding: 1.125rem 1.5rem 0.875rem; border-bottom: 0.0625rem solid var(--line-soft); flex-wrap: wrap;
}
.card-title { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; letter-spacing: -0.015em; color: var(--ink-strong); line-height: 1.2; margin: 0; }
.card-title-sans { font-size: 1rem; font-weight: 600; letter-spacing: -0.005em; color: var(--ink-strong); line-height: 1.2; margin: 0; }
.card-sub { font-size: 0.875rem; color: var(--ink-muted); margin-top: 0.25rem; }
.card-body { padding: 1.25rem 1.5rem 1.5rem; }
.card-foot-link {
  display: flex; align-items: center; justify-content: center; gap: 0.375rem; width: 100%;
  padding: 0.75rem; border: none; border-top: 0.0625rem solid var(--line-soft);
  background: none; font-size: 0.875rem; font-weight: 500; color: var(--sage-700);
  cursor: pointer; transition: background 0.15s;
}
.card-foot-link:hover { background: var(--sage-50); }
.card-foot-link svg { width: 0.875rem; height: 0.875rem; }

.kv-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.25rem 1.5rem; margin: 0; }
.kv { padding: 0.625rem 0; border-bottom: 0.0625rem solid var(--line-soft); min-width: 0; }
.kv-full { grid-column: 1 / -1; }
.kv-key { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; color: var(--ink-muted); margin-bottom: 0.25rem; }
.kv-val { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.375rem; min-width: 0; }
.kv-text { font-size: 0.9375rem; color: var(--ink-strong); line-height: 1.45; word-break: break-word; margin: 0; }
.kv-text .code { font-weight: 600; color: var(--sage-700); margin-right: 0.25rem; }

.person { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.person:last-child { border-bottom: none; }
.person.is-self { background: var(--sage-50); border-radius: var(--radius-md); padding-left: 0.6rem; padding-right: 0.6rem; border-bottom-color: transparent; }
.person-avatar, .person-avatar-img { flex: 0 0 2.5rem; width: 2.5rem; height: 2.5rem; border-radius: 50%; }
.person-avatar { display: grid; place-items: center; font-size: 0.8125rem; font-weight: 600; }
.person-avatar-img { object-fit: cover; }
.person-avatar.sage { background: var(--sage-100); color: var(--sage-700); }
.person-avatar.rose { background: var(--rose-100); color: var(--rose-700); }
.person-avatar.amber { background: var(--amber-100); color: var(--amber-700); }
.person-info { flex: 1; min-width: 0; }
.person-name { font-size: 0.9375rem; font-weight: 500; color: var(--ink-strong); display: flex; align-items: center; gap: 0.5rem; }
.person-role { font-size: 0.8125rem; color: var(--ink-muted); }
.self-badge { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; background: var(--sage-100); color: var(--sage-700); padding: 0.1rem 0.4rem; border-radius: 0.25rem; }
.person-actions { display: inline-flex; gap: 0.25rem; }
.person-action { width: 2.25rem; height: 2.25rem; border-radius: 0.5rem; color: var(--ink-muted); display: grid; place-items: center; transition: background 0.15s, color 0.15s; }
.person-action:hover { background: var(--paper-soft); color: var(--sage-700); }
.person-action svg { width: 1rem; height: 1rem; }

.rd-input {
  width: 100%; padding: 0.55rem 0.75rem; font-size: 0.9375rem;
  border: 0.0625rem solid var(--line-strong); border-radius: var(--radius-md);
  background: var(--paper); color: var(--ink-strong); cursor: pointer;
}
.rd-input:disabled { opacity: 0.6; cursor: default; }
.rd-input:focus-visible { outline: none; border-color: var(--sage-500); box-shadow: 0 0 0 0.1875rem rgba(95, 126, 69, 0.25); }

.rd-group-select { margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 0.0625rem solid var(--line-soft); }
.rd-group-select .kv-key { display: block; margin-bottom: 0.5rem; }
.rd-gs-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.rd-gs-row .rd-input { flex: 1 1 15rem; }
.rd-gs-row .btn { flex: 0 0 auto; }

.rd-inline-empty { text-align: center; padding: 1.5rem; color: var(--ink-muted); font-size: 0.9375rem; }

.rd-fs-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.625rem; }
.rd-fs-item {
  padding: 0.6875rem 0.875rem;
  background: var(--sage-50);
  border: 0.0625rem solid var(--sage-100);
  border-radius: 0.625rem;
}
.rd-fs-name {
  display: block;
  font-size: 0.9375rem; font-weight: 600; color: var(--sage-700);
}
.rd-fs-hint {
  display: block; margin-top: 0.1875rem;
  font-size: 0.8125rem; line-height: 1.45; color: var(--ink-muted);
}
.rd-fs-note {
  margin: 0.875rem 0 0;
  font-size: 0.8125rem; line-height: 1.5; color: var(--ink-subtle, var(--ink-muted));
}

@media (min-width: 45rem) {
  .rd-fs-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.rd-locked { display: block; margin-top: 0.875rem; }

.rd-scan-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.5rem; height: 1.5rem; padding: 0 0.45rem;
  background: var(--sage-100); color: var(--sage-700);
  font-size: 0.8rem; font-weight: 700; border-radius: 62.5rem;
}
.en-note {
  border-radius: var(--radius-md);
  padding: 0.75rem 0.9rem;
  font-size: 0.9rem;
  line-height: 1.45;
  border: 0.0625rem solid transparent;
}
.en-note-ok { background: var(--sage-50); border-color: var(--sage-100); color: var(--sage-800); }
.en-note-wait { background: var(--amber-50); border-color: var(--amber-100); color: var(--amber-700); }
.en-note-stop { background: var(--rose-50); border-color: var(--rose-100); color: var(--rose-700); }
.en-done { margin-top: 1rem; }

.en-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: 0.875rem;
  margin-top: 1rem;
}
.en-doc {
  border: 0.0625rem solid var(--line);
  border-radius: var(--radius-md);
  background: var(--paper);
  padding: 0.875rem 0.95rem 0.95rem;
  display: flex; flex-direction: column; gap: 0.75rem;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.en-doc:hover { border-color: var(--line-strong); box-shadow: var(--shadow-md); }
.en-doc.done { background: var(--sage-50); border-color: var(--sage-100); }

.en-doc-head { display: flex; align-items: flex-start; gap: 0.6rem; }
.en-doc-ic {
  width: 2.1rem; height: 2.1rem; flex: 0 0 2.1rem;
  display: grid; place-items: center; border-radius: var(--radius-sm);
  background: var(--paper-sunken); color: var(--sage-700);
}
.en-doc.done .en-doc-ic { background: var(--sage-100); }
.en-doc-ic svg { width: 1.1rem; height: 1.1rem; }
.en-doc-t { min-width: 0; flex: 1; display: grid; gap: 0.15rem; }
.en-doc-name { font-size: 0.925rem; font-weight: 600; color: var(--ink-strong); line-height: 1.3; min-height: 2.6em; }
.en-doc-state { font-size: 0.78rem; color: var(--ink-subtle); }
.en-doc-tag {
  flex: 0 0 auto; font-size: 0.7rem; font-weight: 700;
  padding: 0.15rem 0.45rem; border-radius: 62.5rem; white-space: nowrap;
}
.en-doc-tag.is-done { background: var(--sage-100); color: var(--sage-700); }
.en-doc-tag.is-wait { background: var(--amber-100); color: var(--amber-700); }

.en-doc-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: auto; }
.en-btn {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 0.35rem;
  font-size: 0.8rem; font-weight: 600; line-height: 1;
  padding: 0.45rem 0.7rem; border-radius: var(--radius-sm);
  border: 0.0625rem solid var(--line-strong); background: var(--paper);
  color: var(--ink-muted); cursor: pointer; text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.en-btn svg { width: 0.85rem; height: 0.85rem; }
.en-btn:hover { background: var(--paper-soft); color: var(--ink-strong); }
.en-btn:disabled, .en-btn.is-busy { opacity: 0.6; cursor: default; }
.en-btn-primary { background: var(--sage-700); border-color: var(--sage-700); color: #FFFFFF; }
.en-btn-primary:hover:not(:disabled) { background: var(--sage-800); border-color: var(--sage-800); color: #FFFFFF; }
.en-file { position: absolute; width: 0.0625rem; height: 0.0625rem; opacity: 0; pointer-events: none; }
.en-doc-err { margin: 0; }

.rd-scan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr));
  gap: 1rem;
}
.rd-scan {
  position: relative;
  border: 0.0625rem solid var(--line); border-radius: var(--radius-md);
  background: var(--paper); overflow: hidden;
  display: flex; flex-direction: column;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.rd-scan:hover { border-color: var(--line-strong); box-shadow: var(--shadow-md); }
.rd-scan-thumb {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 8rem; padding: 0;
  background: var(--paper-sunken); border: none; cursor: pointer;
  overflow: hidden; position: relative;
}
.rd-scan-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rd-scan-file { flex-direction: column; gap: 0.4rem; color: var(--sage-700); text-decoration: none; }
.rd-scan-file svg { width: 2.5rem; height: 2.5rem; }
.rd-scan-ext { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.04em; color: var(--ink-muted); }
.rd-scan-meta { padding: 0.6rem 0.7rem 0.7rem; display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.rd-scan-name { font-size: 0.875rem; font-weight: 600; color: var(--ink-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rd-scan-sub { font-size: 0.75rem; color: var(--ink-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rd-scan-open {
  margin-top: 0.35rem; align-self: flex-start;
  display: inline-flex; align-items: center; gap: 0.3rem;
  font-size: 0.8rem; font-weight: 600; color: var(--sage-700); text-decoration: none;
}
.rd-scan-open svg { width: 0.85rem; height: 0.85rem; }
.rd-scan-open:hover { color: var(--sage-900); text-decoration: underline; }

.rd-scan-ver {
  position: absolute; top: 0.4rem; right: 0.4rem;
  font-size: 0.6875rem; font-weight: 700; line-height: 1;
  color: var(--sage-900); background: rgba(244, 248, 236, 0.94);
  border: 0.0625rem solid var(--sage-100); border-radius: 62.5rem;
  padding: 0.1875rem 0.4375rem;
}
.rd-scan-actions {
  margin-top: 0.35rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem 0.625rem;
}
.rd-scan-actions .rd-scan-open { margin-top: 0; }
.rd-scan-act {
  display: inline-flex; align-items: center; gap: 0.3rem;
  padding: 0; border: none; background: none; cursor: pointer;
  font-family: inherit; font-size: 0.8rem; font-weight: 600; color: var(--ink-muted);
  transition: color 0.15s ease;
}
.rd-scan-act svg { width: 0.85rem; height: 0.85rem; }
.rd-scan-act:hover { color: var(--sage-900); text-decoration: underline; }
.rd-scan-act:focus-visible { outline: 0.125rem solid var(--sage-700); outline-offset: 0.125rem; border-radius: 0.25rem; }

.du-modal-sm { width: min(34rem, 100%); }
.rs-current {
  padding: 0.75rem 0.875rem; border-radius: var(--radius-md);
  background: var(--paper-soft); border: 0.0625rem solid var(--line-soft);
}
.rs-current-key {
  font-size: 0.71875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.rs-current-name { margin-top: 0.25rem; font-size: 0.9375rem; font-weight: 600; color: var(--ink-strong); }
.rs-current-sub { margin-top: 0.1875rem; font-size: 0.8125rem; color: var(--ink-muted); line-height: 1.4; word-break: break-word; }
.rs-file {
  width: 100%; padding: 0.5rem; font-family: inherit; font-size: 0.875rem; color: var(--ink);
  background: var(--paper); border: 0.0625rem dashed var(--line-strong); border-radius: var(--radius-sm);
  cursor: pointer;
}
.rs-file::file-selector-button {
  margin-right: 0.625rem; padding: 0.375rem 0.75rem;
  font-family: inherit; font-size: 0.8125rem; font-weight: 600; color: var(--ink);
  background: var(--paper-sunken); border: 0.0625rem solid var(--line-strong);
  border-radius: 0.375rem; cursor: pointer;
}
.rs-file:disabled { opacity: 0.55; cursor: not-allowed; }
.rs-hint { margin: 0.375rem 0 0; font-size: 0.78125rem; color: var(--ink-subtle); }
.rs-picked {
  margin-top: 0.75rem; display: flex; align-items: center; gap: 0.75rem;
  padding: 0.625rem 0.75rem; border-radius: var(--radius-md);
  background: var(--sage-50, var(--paper-soft)); border: 0.0625rem solid var(--sage-100);
}
.rs-preview {
  width: 3.25rem; height: 3.25rem; flex: 0 0 3.25rem;
  object-fit: cover; border-radius: 0.375rem; border: 0.0625rem solid var(--line);
}
.rs-picked-meta { min-width: 0; }
.rs-picked-name {
  font-size: 0.875rem; font-weight: 600; color: var(--ink-strong);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rs-picked-sub { font-size: 0.78125rem; color: var(--ink-muted); }
.rs-ver-tag {
  margin-left: auto; font-size: 0.6875rem; font-weight: 700; line-height: 1;
  color: var(--ink-muted); background: var(--paper-sunken);
  border: 0.0625rem solid var(--line); border-radius: 62.5rem; padding: 0.1875rem 0.4375rem;
}
.rs-ver-tag.is-cur { color: var(--sage-700); background: var(--sage-100); border-color: var(--sage-100); }
.rs-ver-open { margin-left: 0.5rem; font-weight: 600; color: var(--sage-700); text-decoration: none; }
.rs-ver-open:hover { color: var(--sage-900); text-decoration: underline; }

.rd-lightbox {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15, 20, 15, 0.82); padding: 2rem; cursor: zoom-out;
}
.rd-lightbox img { max-width: 92vw; max-height: 88vh; object-fit: contain; border-radius: 0.5rem; box-shadow: 0 1.5rem 3rem rgba(0,0,0,0.45); cursor: default; }
.rd-lightbox-close {
  position: absolute; top: 1.25rem; right: 1.25rem;
  width: 2.75rem; height: 2.75rem; border-radius: 50%;
  background: rgba(255,255,255,0.12); border: 0.0625rem solid rgba(255,255,255,0.25);
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s ease;
}
.rd-lightbox-close:hover { background: rgba(255,255,255,0.24); }
.rd-lightbox-close svg { width: 1.4rem; height: 1.4rem; }

.rd-assign { margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 0.0625rem solid var(--line-soft); }
.rd-assign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem 1rem; align-items: end; }
.rd-assign-field { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
.rd-assign-action { display: flex; align-items: flex-end; }
.rd-assign-action .btn { width: 100%; }
.rd-assign-err { margin: 0.6rem 0 0; color: var(--rose-500); font-size: 0.875rem; }
.rd-subtitle { font-size: 1rem; font-weight: 600; margin: 0 0 0.75rem; color: var(--ink-strong); }

.rd-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.rd-table th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-muted); font-weight: 600; padding: 0.5rem 0.6rem; border-bottom: 0.0625rem solid var(--line); }
.rd-table td { padding: 0.6rem; border-bottom: 0.0625rem solid var(--line-soft); color: var(--ink-strong); }
.doc-status { display: inline-block; font-size: 0.72rem; font-weight: 600; padding: 0.15rem 0.55rem; border-radius: 62.5rem; white-space: nowrap; }
.doc-status.sage { background: var(--sage-50); color: var(--sage-700); }
.doc-status.amber { background: var(--amber-50); color: var(--amber-700); }
.rd-cancel-btn { background: transparent; border: 0.0625rem solid var(--line-strong); color: var(--ink-muted); padding: 0.3rem 0.7rem; border-radius: var(--radius-md); cursor: pointer; font-size: 0.82rem; }
.rd-cancel-btn:hover:not(:disabled) { border-color: var(--rose-500); color: var(--rose-500); }
.rd-cancel-btn:disabled { opacity: 0.5; cursor: default; }
.rd-col-act { width: 1%; white-space: nowrap; text-align: right; }
.rd-cancel-note { margin: 0; font-size: 0.9375rem; color: var(--ink); line-height: 1.5; }

.rd-result { border: 0.0625rem solid var(--line-soft); border-radius: var(--radius-md); padding: 0.9rem 1rem; margin-bottom: 0.85rem; background: #FAF7F0; }
.rd-result-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 0.75rem; margin-bottom: 0.65rem; }
.rd-result-dir { font-size: 0.95rem; font-weight: 600; color: var(--ink-strong); }
.rd-result-meta { font-size: 0.82rem; color: var(--ink-muted); }
.rd-result-empty { font-size: 0.875rem; color: var(--ink-muted); font-style: italic; }
.rd-result-block { padding: 0.55rem 0 0.1rem; }
.rd-result-block + .rd-result-block { border-top: 0.0625rem solid var(--line-soft); margin-top: 0.55rem; }
.rd-result-block-title { font-size: 0.875rem; font-weight: 600; color: var(--ink-muted); margin-bottom: 0.3rem; }
.rd-result-spec { font-size: 0.82rem; color: var(--ink-muted); margin-bottom: 0.3rem; }
.rd-result-recs { margin: 0; font-size: 0.9rem; line-height: 1.5; color: var(--ink-strong); white-space: pre-wrap; }

.rd-hist-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.rd-hist-tab {
  display: flex; flex-direction: column; gap: 0.125rem;
  padding: 0.5rem 0.875rem; text-align: left;
  background: var(--sage-50); border: 0.0625rem solid var(--sage-100);
  border-radius: 0.625rem; cursor: pointer; font-family: inherit; color: inherit;
}
.rd-hist-tab:hover { background: var(--sage-100); }
.rd-hist-tab.is-active {
  background: #fff; border-color: var(--sage-700);
  box-shadow: inset 0 -0.125rem 0 var(--sage-700);
}
.rd-hist-kind { font-size: 0.875rem; font-weight: 600; color: var(--ink-strong); }
.rd-hist-date { font-size: 0.75rem; color: var(--ink-muted); }
.rd-hist-panel {
  border: 0.0625rem solid var(--line-soft); border-radius: var(--radius-md);
  padding: 1rem; background: #fff;
}
.rd-hist-head { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-bottom: 0.875rem; }
.rd-hist-meta { font-size: 0.85rem; color: var(--ink-muted); }
.rd-hist-conclusion {
  margin-top: 0.875rem; padding: 0.875rem 1rem;
  background: var(--sage-50); border: 0.0625rem solid var(--sage-100);
  border-radius: var(--radius-md);
}
.rd-hist-conclusion-head { font-size: 0.9rem; font-weight: 600; color: var(--sage-700); margin-bottom: 0.5rem; }
.rd-hist-conclusion-text { margin: 0 0 0.5rem; font-size: 0.9rem; line-height: 1.5; color: var(--ink-strong); white-space: pre-wrap; }
.rd-hist-conclusion-meta { font-size: 0.8rem; color: var(--ink-muted); }

.rd-footer {
  margin-top: 1.5rem; padding-top: 1rem; border-top: 0.0625rem solid var(--line);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}

.hero-ava-btn {
  position: relative; display: inline-flex;
  padding: 0; border: none; background: none; border-radius: 50%;
  cursor: zoom-in;
}
.hero-ava-btn .hero-ava { transition: transform 0.35s ease; }
.hero-ava-btn:hover .hero-ava { transform: scale(1.03); }
.hero-ava-zoom {
  position: absolute; right: 0.125rem; bottom: 0.125rem;
  width: 1.75rem; height: 1.75rem; border-radius: 50%;
  background: rgba(15, 20, 15, 0.55); color: #fff;
  border: 0.125rem solid var(--paper);
  display: grid; place-items: center;
  opacity: 0; transition: opacity 0.2s ease;
}
.hero-ava-btn:hover .hero-ava-zoom,
.hero-ava-btn:focus-visible .hero-ava-zoom { opacity: 1; }
.hero-ava-zoom svg { width: 0.875rem; height: 0.875rem; }

.lesson-list { display: flex; flex-direction: column; gap: 0.6rem; }
.lesson-card {
  border: 0.0625rem solid var(--line-soft); border-radius: var(--radius-md);
  padding: 0.7rem 0.85rem; background: var(--paper);
  transition: border-color 0.15s ease, background 0.15s ease;
}
.lesson-card:hover { border-color: var(--line-strong); background: var(--paper-soft); }
.lesson-head { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.3rem; }
.lesson-type {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
  padding: 0.12rem 0.5rem; border-radius: 62.5rem;
}
.lesson-type.is-lesson { background: var(--sage-50); color: var(--sage-700); }
.lesson-type.is-diag { background: var(--blue-50); color: var(--blue-700); }
.lesson-title { font-size: 0.9375rem; font-weight: 600; color: var(--ink-strong); }
.lesson-meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; font-size: 0.82rem; color: var(--ink-muted); }
.sep-dot { color: var(--line-strong); }

.event-list { display: flex; flex-direction: column; gap: 0.3rem; }
.event-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.event-row:last-child { border-bottom: none; }
.event-date {
  flex: 0 0 3rem; width: 3rem; height: 3rem; border-radius: var(--radius-md);
  background: var(--sage-50); color: var(--sage-700);
  display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1;
}
.event-date.mse { background: var(--amber-50); color: var(--amber-700); }
.event-day { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600; }
.event-mon { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; }
.event-info { flex: 1; min-width: 0; }
.event-title { font-size: 0.9rem; font-weight: 500; color: var(--ink-strong); }
.event-meta { font-size: 0.8rem; color: var(--ink-muted); }

.rd-att { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.rd-att-toggle { display: inline-flex; gap: 0.3rem; flex: 1 1 auto; flex-wrap: wrap; }
.rd-att-btn {
  flex: 1 1 auto; min-width: 4.5rem; padding: 0.5rem 0.6rem;
  border: 0.0625rem solid var(--line-strong); border-radius: var(--radius-md);
  background: var(--paper); color: var(--ink-muted);
  font-size: 0.875rem; font-weight: 600; cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.rd-att-btn:hover { border-color: var(--ink-muted); }
.rd-att-btn.is-yes.active { background: var(--sage-50); color: var(--sage-700); border-color: var(--sage-500); }
.rd-att-btn.is-partial.active { background: var(--rose-50); color: var(--rose-700); border-color: var(--rose-500); }
.rd-att-btn.is-no.active { background: var(--amber-50); color: var(--amber-700); border-color: var(--amber-700); }
.rd-att-save { flex: 0 0 auto; }
.rd-att-hint { margin-top: 0.6rem; font-size: 0.82rem; color: var(--ink-muted); }
.rd-att-hint strong { color: var(--ink-strong); font-weight: 600; }

.rd-team-role { line-height: 1.35; }
.rd-curator-badge {
  font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
  background: var(--sage-100); color: var(--sage-700);
  padding: 0.1rem 0.4rem; border-radius: 0.25rem;
}

.rd-head-btn {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.5rem 0.8125rem; min-height: 2.25rem;
  border-radius: 0.5rem; font-family: inherit; font-size: 0.8125rem; font-weight: 600;
  background: var(--paper); color: var(--sage-700);
  border: 0.0625rem solid var(--line-strong);
  cursor: pointer; white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.rd-head-btn svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; }
.rd-head-btn:hover { background: var(--sage-50); border-color: var(--sage-500); color: var(--sage-900); }

.rd-history { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.75rem; }
.rd-history-item {
  position: relative;
  padding: 0.8125rem 0.9375rem 0.8125rem 1.0625rem;
  background: var(--paper-soft); border-radius: var(--radius-md);
  border: 0.0625rem solid var(--line-soft);
}
.rd-history-item::before {
  content: ''; position: absolute; left: 0; top: 0.6875rem; bottom: 0.6875rem;
  width: 0.1875rem; border-radius: 62.5rem; background: var(--sage-500);
}
.rd-history-flat .rd-history-item::before { content: none; }
.rd-history-flat .rd-history-item { padding-left: 0.9375rem; }
.rd-history-head {
  display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.3125rem;
}
.rd-history-date { font-size: 0.8125rem; font-weight: 700; color: var(--ink-strong); }
.rd-history-author {
  font-size: 0.75rem; font-weight: 600; color: var(--sage-700);
  background: var(--sage-50); border-radius: 62.5rem; padding: 0.0625rem 0.4375rem;
}
.rd-history-reason { font-size: 0.9375rem; color: var(--ink); line-height: 1.45; word-break: break-word; }
.rd-history-fields { margin-top: 0.3125rem; font-size: 0.8125rem; color: var(--ink-muted); line-height: 1.4; }
.rd-history-prev { margin-top: 0.5rem; }
.rd-history-prev > summary {
  font-size: 0.8125rem; font-weight: 600; color: var(--sage-700);
  cursor: pointer; list-style: none; display: inline-flex; align-items: center; gap: 0.25rem;
  border-radius: 0.25rem;
}
.rd-history-prev > summary::-webkit-details-marker { display: none; }
.rd-history-prev > summary::before { content: '▸'; font-size: 0.6875rem; transition: transform 0.15s; }
.rd-history-prev[open] > summary::before { transform: rotate(90deg); }
.rd-history-prev > summary:hover { color: var(--sage-900); }
.rd-history-kv {
  margin: 0.5rem 0 0; padding: 0.5rem 0.6875rem;
  background: var(--paper); border: 0.0625rem solid var(--line-soft); border-radius: var(--radius-sm);
  display: flex; flex-direction: column; gap: 0.3125rem;
}
.rd-history-kv-row { display: grid; grid-template-columns: 11rem minmax(0, 1fr); gap: 0.625rem; }
.rd-history-kv-row dt { font-size: 0.78125rem; color: var(--ink-muted); }
.rd-history-kv-row dd { margin: 0; font-size: 0.8125rem; color: var(--ink-strong); word-break: break-word; }

.du-overlay {
  position: fixed; inset: 0; z-index: 1200;
  background: rgba(15, 20, 15, 0.5); backdrop-filter: blur(0.125rem);
  display: flex; align-items: center; justify-content: center; padding: 1.25rem;
  animation: du-fade 0.16s ease;
}
@keyframes du-fade { from { opacity: 0; } to { opacity: 1; } }
.du-modal {
  width: min(46rem, 100%); max-height: min(90vh, 50rem);
  display: flex; flex-direction: column;
  background: var(--paper); border-radius: var(--radius-lg);
  border: 0.0625rem solid var(--line);
  box-shadow: 0 1.5rem 3rem rgba(15, 20, 15, 0.24);
  overflow: hidden;
  animation: du-rise 0.2s cubic-bezier(0.2, 0.7, 0.2, 1);
}
@keyframes du-rise { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: none; } }
.du-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.875rem;
  padding: 1.125rem 1.375rem 0.9375rem;
  border-bottom: 0.0625rem solid var(--line-soft);
  background: var(--paper-soft);
}
.du-title {
  margin: 0; font-family: var(--font-serif); font-size: 1.1875rem; font-weight: 600;
  letter-spacing: -0.015em; color: var(--ink-strong); line-height: 1.2;
}
.du-sub { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--ink-muted); line-height: 1.4; }
.du-close {
  flex: 0 0 2rem; width: 2rem; height: 2rem; display: grid; place-items: center;
  border-radius: 0.5rem; border: 0.0625rem solid transparent;
  background: none; color: var(--ink-muted); cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.du-close svg { width: 1rem; height: 1rem; }
.du-close:hover { background: var(--paper-sunken); color: var(--ink-strong); }
.du-body { padding: 1.125rem 1.375rem 1.25rem; overflow-y: auto; flex: 1; }
.du-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem 0.875rem; }
.du-field { display: flex; flex-direction: column; gap: 0.3125rem; min-width: 0; }
.du-field-full { grid-column: 1 / -1; }
.du-key {
  font-size: 0.71875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--ink-muted);
}
.du-req { text-transform: none; letter-spacing: 0; font-weight: 600; color: var(--rose-700); }
.du-input {
  width: 100%; padding: 0.5625rem 0.6875rem; min-height: 2.5rem;
  font-family: inherit; font-size: 0.9375rem; color: var(--ink-strong);
  background: var(--paper); border: 0.0625rem solid var(--line-strong); border-radius: 0.5rem;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.du-input:focus {
  outline: none; border-color: var(--sage-500);
  box-shadow: 0 0 0 0.1875rem rgba(95, 126, 69, 0.16);
}
.du-input:disabled { background: var(--paper-sunken); color: var(--ink-subtle); cursor: not-allowed; }
.du-input.is-expired { border-color: var(--rose-500); background: var(--rose-50); color: var(--rose-700); }
.du-input.is-invalid { border-color: var(--rose-500); background: var(--rose-50); }
.du-input.is-invalid:focus { box-shadow: 0 0 0 0.1875rem rgba(176, 83, 63, 0.16); }
.du-textarea { min-height: 3.75rem; resize: vertical; line-height: 1.45; }
.du-check {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; color: var(--ink); cursor: pointer;
}
.du-check input { width: 1rem; height: 1rem; accent-color: var(--sage-700); cursor: pointer; }
.du-reason {
  margin-top: 1rem; padding: 0.875rem 0.9375rem;
  background: var(--amber-50); border: 0.0625rem solid var(--amber-100); border-radius: var(--radius-md);
}
.du-changes {
  margin: 0.875rem 0 0; font-size: 0.8125rem; line-height: 1.45;
  color: var(--sage-700); font-weight: 500;
}
.du-changes-muted { color: var(--ink-subtle); font-weight: 400; }
.du-error {
  margin: 0.625rem 0 0; font-size: 0.8125rem; line-height: 1.45;
  color: var(--rose-700); font-weight: 500;
}
.du-success {
  margin: 0.625rem 0 0; font-size: 0.8125rem; line-height: 1.45;
  color: var(--sage-700); font-weight: 600;
}
.du-foot {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.625rem;
  padding: 0.875rem 1.375rem; border-top: 0.0625rem solid var(--line-soft);
  background: var(--paper-soft);
}
.du-btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.625rem 1.0625rem; min-height: 2.5rem;
  border-radius: 0.5rem; font-family: inherit; font-size: 0.9375rem; font-weight: 600;
  border: 0.0625rem solid transparent; cursor: pointer; white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.du-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.du-btn-ghost { background: var(--btn-secondary-bg); color: var(--btn-secondary-fg); border-color: var(--btn-secondary-border); }
.du-btn-ghost:hover:not(:disabled) { background: var(--btn-secondary-bg-hover); border-color: var(--btn-secondary-border-hover); }
.du-btn-primary { background: var(--btn-primary-bg); color: var(--btn-primary-fg); border-color: var(--btn-primary-bg); }
.du-btn-primary:hover:not(:disabled) { background: var(--btn-primary-bg-hover); border-color: var(--btn-primary-bg-hover); }
.du-btn-danger { background: var(--btn-danger-fg); color: #FDF3EF; border-color: var(--btn-danger-fg); }
.du-btn-danger:hover:not(:disabled) { background: #96422F; border-color: #96422F; }

.modal {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
  padding: 1rem; background: rgba(15, 20, 15, 0.5);
}
.modal-box {
  width: min(34rem, 100%); max-height: 90vh; overflow-y: auto;
  background: var(--paper); border-radius: var(--radius-lg);
  box-shadow: 0 1.5rem 3rem rgba(15, 20, 15, 0.28);
}
.modal-head { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1.25rem 1.25rem 0.75rem; }
.modal-title {
  font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600;
  color: var(--ink-strong); margin: 0; flex: 1; line-height: 1.25;
}
.modal-sub { font-size: 0.875rem; color: var(--ink-muted); margin: 0.25rem 0 0; }
.modal-body { padding: 0 1.25rem 1rem; }
.modal-foot {
  display: flex; justify-content: flex-end; gap: 0.5rem;
  padding: 1rem 1.25rem 1.25rem; border-top: 0.0625rem solid var(--line-soft); flex-wrap: wrap;
}
.field { display: block; margin-bottom: 0.875rem; }
.field-key {
  display: block; font-size: 0.8125rem; font-weight: 600;
  color: var(--ink-muted); margin-bottom: 0.3125rem;
}
.req { color: var(--rose-700); font-weight: 600; }
.field-err {
  display: block; margin: 0.3125rem 0 0; font-size: 0.8125rem;
  line-height: 1.4; color: var(--rose-700); font-weight: 500;
}
.input {
  width: 100%; min-height: 2.75rem; padding: 0.5625rem 0.75rem; font-size: 0.9375rem;
  font-family: inherit; border: 0.0625rem solid var(--line-strong);
  border-radius: var(--radius-md); background: var(--paper); color: var(--ink-strong);
}
.input:focus-visible { outline: none; border-color: var(--stage); box-shadow: 0 0 0 0.1875rem var(--stage-line); }
textarea.input { min-height: 5rem; resize: vertical; }
.field-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 0.875rem; }
.check {
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.875rem;
  font-size: 0.875rem; color: var(--ink-strong); cursor: pointer;
}
.check input { width: 1.125rem; height: 1.125rem; accent-color: var(--action); }
.term-note {
  font-size: 0.8125rem; line-height: 1.45; color: var(--ink-strong);
  background: var(--amber-50); border: 0.0625rem solid var(--amber-100);
  border-left: 0.1875rem solid var(--amber-700);
  border-radius: var(--radius-sm); padding: 0.625rem 0.75rem;
}
.term-note b { font-weight: 700; }
.modal-note {
  font-size: 0.8125rem; color: var(--ink-muted); background: var(--paper-soft);
  border-radius: var(--radius-sm); padding: 0.625rem 0.75rem; line-height: 1.45;
}

.col { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
.split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; align-items: start; }

.card-foot {
  display: flex; align-items: center; justify-content: center; gap: 0.375rem; width: 100%;
  padding: 0.75rem; border: none; border-top: 0.0625rem solid var(--line-soft);
  background: none; font-size: 0.875rem; font-weight: 500; color: var(--sage-700);
  cursor: pointer; transition: background 0.15s;
}
.card-foot:hover { background: var(--sage-50); }
.card-foot svg { width: 0.875rem; height: 0.875rem; }

.badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.5rem; height: 1.5rem; padding: 0 0.45rem;
  background: var(--sage-100); color: var(--sage-700);
  font-size: 0.8rem; font-weight: 700; border-radius: 62.5rem;
}

.empty { text-align: center; padding: 1.25rem; color: var(--ink-muted); font-size: 0.9375rem; }

.subtitle {
  font-size: 0.8125rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--ink-muted); margin: 0 0 0.75rem;
}

.person-ava {
  flex: 0 0 2.5rem; width: 2.5rem; height: 2.5rem; border-radius: 50%;
  display: grid; place-items: center; font-size: 0.8125rem; font-weight: 600;
  background: var(--rose-100); color: var(--rose-700);
}
.person-ava.sage { background: var(--sage-100); color: var(--sage-700); }

.event {
  display: flex; gap: 0.75rem; padding: 0.625rem 0;
  border-bottom: 0.0625rem solid var(--line-soft); align-items: flex-start;
}
.event:last-child { border-bottom: none; }
.event .event-date {
  flex: 0 0 2.875rem; width: auto; height: auto; display: block;
  text-align: center; border-radius: var(--radius-sm);
  background: var(--paper-soft); color: var(--ink-strong); padding: 0.3125rem 0;
}
.event .event-date.is-cycle { background: var(--cycle-tint); color: var(--cycle); }
.event .event-date.is-cycle .event-day { color: var(--cycle); }
.event .event-day { display: block; line-height: 1; }
.event .event-mon { display: block; letter-spacing: 0.06em; color: var(--ink-muted); }
.event .event-date.is-cycle .event-mon { color: var(--cycle); }

.pill {
  display: inline-flex; align-items: center; gap: 0.3125rem;
  font-size: 0.75rem; font-weight: 700; padding: 0.1875rem 0.5625rem;
  border-radius: 62.5rem; white-space: nowrap;
}
.pill svg { width: 0.8125rem; height: 0.8125rem; }
.pill-ok { background: var(--sage-100); color: var(--sage-700); }
.pill-wait { background: var(--amber-50); color: var(--amber-700); border: 0.0625rem solid var(--amber-100); }
.pill-stop { background: var(--rose-50); color: var(--rose-700); border: 0.0625rem solid var(--rose-100); }
.pill-stage { background: var(--cycle-tint); color: var(--cycle); border: 0.0625rem solid var(--cycle-line); }
.pill-mute { background: var(--paper-soft); color: var(--ink-muted); }

.pd-note {
  display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap;
  background: var(--paper-soft); border: 0.0625rem solid var(--line);
  border-radius: var(--radius-md); padding: 0.625rem 0.75rem; margin-bottom: 0.75rem;
}
.pd-note-ic {
  flex: 0 0 1.75rem; width: 1.75rem; height: 1.75rem; border-radius: 0.5rem;
  background: var(--paper-sunken); color: var(--ink-muted); display: grid; place-items: center;
}
.pd-note-ic svg { width: 1rem; height: 1rem; }
.pd-note-text { flex: 1 1 12rem; font-size: 0.8125rem; color: var(--ink-muted); line-height: 1.4; }
.pd-note-btn {
  display: inline-flex; align-items: center; gap: 0.375rem; min-height: 2.25rem;
  padding: 0.375rem 0.75rem; border: 0.0625rem solid var(--action); border-radius: 0.5rem;
  background: var(--action); color: var(--action-ink);
  font-size: 0.8125rem; font-weight: 600; font-family: inherit; cursor: pointer;
}
.pd-note-btn:hover { background: var(--action-hover); border-color: var(--action-hover); }
.pd-note-btn svg { width: 0.875rem; height: 0.875rem; }

.kv.is-secret .kv-val { gap: 0.5rem; }
.kv-mask {
  font-size: 0.9375rem; letter-spacing: 0.14em; color: var(--ink-muted);
  background: var(--paper-sunken); border-radius: 0.375rem; padding: 0.0625rem 0.5rem;
}
.kv-tools { display: inline-flex; gap: 0.25rem; margin-left: auto; }
.kv-tool {
  display: inline-flex; align-items: center; justify-content: center;
  width: 2.25rem; height: 2.25rem; flex: 0 0 2.25rem;
  border: 0.0625rem solid var(--line-strong); border-radius: 0.5rem;
  background: var(--paper); color: var(--ink-muted); cursor: pointer;
}
.kv-tool:hover { background: var(--paper-soft); color: var(--action); border-color: var(--ink-muted); }
.kv-tool svg { width: 1rem; height: 1rem; }
.kv-open { font-size: 0.75rem; font-weight: 600; color: var(--sage-700); }

.fs-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.625rem; }
.fs-item {
  padding: 0.6875rem 0.875rem; background: var(--sage-50);
  border: 0.0625rem solid var(--sage-100); border-radius: var(--radius-md);
}
.fs-name { display: block; font-size: 0.9375rem; font-weight: 600; color: var(--sage-700); }
.fs-hint { display: block; margin-top: 0.1875rem; font-size: 0.8125rem; color: var(--ink-muted); }

.cyc-bar { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.375rem; scrollbar-width: none; margin-bottom: 1rem; }
.cyc-bar::-webkit-scrollbar { display: none; }
.cyc-tab {
  display: flex; flex-direction: column; gap: 0.1875rem; align-items: flex-start;
  min-width: 11rem; padding: 0.625rem 0.75rem; text-align: left; cursor: pointer;
  border: 0.0625rem solid var(--line); border-radius: var(--radius-md); background: var(--paper);
  font-family: inherit;
}
.cyc-tab:hover { border-color: var(--line-strong); background: var(--paper-soft); }
.cyc-tab[aria-selected="true"] { border-color: var(--cycle); background: var(--cycle-tint); box-shadow: inset 0 0 0 0.0625rem var(--cycle); }
.cyc-tab.is-active { border-color: var(--sage-100); background: var(--sage-50); }
.cyc-tab.is-active:hover { background: var(--sage-100); border-color: var(--sage-500); }
.cyc-tab.is-active[aria-selected="true"] { border-color: var(--sage-700); background: var(--sage-50); box-shadow: inset 0 0 0 0.0625rem var(--sage-700); }
.cyc-tab-name { font-size: 0.9375rem; font-weight: 600; color: var(--ink-strong); }
.cyc-tab-meta { font-size: 0.75rem; color: var(--ink-muted); }
.cyc-summary {
  display: flex; flex-wrap: wrap; gap: 0.75rem 1.75rem; align-items: center;
  padding: 0.875rem 1rem; margin-bottom: 1.125rem;
  border: 0.0625rem solid var(--cycle-line); border-left: 0.25rem solid var(--cycle);
  border-radius: var(--radius-md); background: var(--cycle-tint);
}
.cyc-summary.is-active { background: var(--sage-50); border-color: var(--sage-100); border-left-color: var(--sage-700); }
.cyc-fact { min-width: 7rem; }
.cyc-fact-k { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; color: var(--ink-muted); }
.cyc-fact-v { font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: var(--ink-strong); line-height: 1.15; }
.cyc-fact-v .unit { font-family: var(--font-sans); font-size: 0.8125rem; font-weight: 500; color: var(--ink-muted); }

.diag { border: 0.0625rem solid var(--line); border-radius: var(--radius-md); background: var(--paper); margin-bottom: 0.75rem; overflow: hidden; }
.diag[open] { box-shadow: var(--shadow-md); }
.diag-head {
  display: flex; flex-wrap: wrap; gap: 0.5rem 0.875rem; align-items: center;
  padding: 0.875rem 1rem; background: var(--paper); cursor: pointer; list-style: none;
  border-left: 0.25rem solid var(--line-strong);
}
.diag-head::-webkit-details-marker { display: none; }
.diag-head::after {
  content: ""; width: 0.5rem; height: 0.5rem; flex: 0 0 0.5rem; margin-left: auto;
  border-right: 0.125rem solid var(--ink-muted); border-bottom: 0.125rem solid var(--ink-muted);
  transform: rotate(45deg); transition: transform 0.15s;
}
.diag[open] > .diag-head::after { transform: rotate(-135deg); }
.diag[open] > .diag-head { border-bottom: 0.0625rem solid var(--line-soft); }
.diag-head:hover { filter: brightness(0.985); }
.diag-head:focus-visible { outline: 0.1875rem solid var(--stage); outline-offset: -0.1875rem; }
.diag.is-ok > .diag-head { background: #F2F6EA; border-left-color: var(--sage-500); }
.diag.is-wait > .diag-head { background: #FBF1DD; border-left-color: var(--amber-700); }
.diag.is-stop > .diag-head { background: #FAE9E0; border-left-color: var(--rose-500); }
.diag.is-mute > .diag-head { background: var(--paper); border-left-color: var(--line-strong); }
.diag-verdict { font-size: 1rem; font-weight: 700; color: var(--ink-strong); flex: 1 1 12rem; }
.diag-when { font-size: 0.8125rem; color: var(--ink-muted); }
.diag-body { padding: 0.5rem 1rem 1rem; }

.dir { border-bottom: 0.0625rem solid var(--line-soft); }
.dir:last-of-type { border-bottom: none; }
.dir > summary {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  padding: 0.625rem 0.75rem; cursor: pointer; list-style: none; min-height: 2.75rem;
  border-radius: var(--radius-md); transition: background 0.12s;
}
.dir > summary::-webkit-details-marker { display: none; }
.dir > summary::after {
  content: ""; width: 0.5rem; height: 0.5rem; flex: 0 0 0.5rem; margin-left: 0.25rem;
  border-right: 0.125rem solid var(--ink-muted); border-bottom: 0.125rem solid var(--ink-muted);
  transform: rotate(45deg); transition: transform 0.15s;
}
.dir[open] > summary::after { transform: rotate(-135deg); }
.dir > summary:hover { background: var(--paper-soft); }
.dir > summary:focus-visible { outline: 0.1875rem solid var(--stage); outline-offset: -0.1875rem; }
.dir-ic {
  flex: 0 0 2.125rem; width: 2.125rem; height: 2.125rem;
  display: grid; place-items: center; border-radius: 0.625rem;
  background: var(--paper-soft); color: var(--ink-muted);
  transition: background 0.12s, color 0.12s;
}
.dir-ic svg { width: 1.125rem; height: 1.125rem; }
.dir[open] > summary .dir-ic { background: var(--sage-100); color: var(--sage-700); }
.dir > summary:hover .dir-ic { background: var(--sage-50); color: var(--sage-700); }
.dir-name { font-size: 0.9375rem; font-weight: 600; color: var(--ink-strong); flex: 1 1 10rem; min-width: 0; }
.dir-spec { font-size: 0.8125rem; color: var(--ink-muted); }
.dir-score { font-family: var(--font-serif); font-size: 1.125rem; font-weight: 600; color: var(--ink-strong); min-width: 2.5rem; text-align: right; margin-left: auto; }
.dir-score .unit { font-family: var(--font-sans); font-size: 0.75rem; color: var(--ink-muted); font-weight: 500; }
.dir-body { padding: 0.625rem 0.75rem 1rem; }
.dir-comment { background: #FBF9F5; border: 0.0625rem solid var(--line-soft); border-left: 0.1875rem solid var(--sage-100); border-radius: var(--radius-md); padding: 0.75rem 0.875rem; }
.dir-comment-k { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; color: var(--ink-muted); margin-bottom: 0.25rem; }
.dir-comment-p { font-size: 0.9375rem; color: var(--ink-strong); margin: 0; line-height: 1.5; }

.crit { margin-top: 0.5rem; }
.crit-sum {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  padding: 0.5rem 0.75rem; min-height: 2.5rem; cursor: pointer; list-style: none;
  font-size: 0.875rem; font-weight: 600; color: var(--sage-700);
  border-radius: var(--radius-md); transition: background 0.12s;
}
.crit-sum::-webkit-details-marker { display: none; }
.crit-sum::before {
  content: ""; width: 0.4375rem; height: 0.4375rem; flex: 0 0 0.4375rem;
  border-right: 0.125rem solid currentColor; border-bottom: 0.125rem solid currentColor;
  transform: rotate(-45deg); transition: transform 0.15s;
}
.crit[open] > .crit-sum::before { transform: rotate(45deg); }
.crit-sum:hover { background: var(--sage-50); }
.crit-sum:focus-visible { outline: 0.1875rem solid var(--stage); outline-offset: -0.1875rem; }
.crit-count { font-size: 0.75rem; font-weight: 700; color: var(--ink-muted); background: var(--paper-soft); border: 0.0625rem solid var(--line); border-radius: 62.5rem; padding: 0.0625rem 0.4375rem; }
.crit-body { padding: 0.5rem 0.25rem 0.25rem; }
.crit-row { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 0.4375rem 0.5rem; border-radius: var(--radius-sm); }
.crit-row:nth-child(odd) { background: #FBF9F5; }
.crit-row.is-blank .crit-label { color: var(--ink-muted); }
.crit-empty { font-size: 0.8125rem; color: var(--ink-muted); margin: 0 0.5rem 0.5rem; line-height: 1.4; }
.crit-label { font-size: 0.875rem; color: var(--ink-strong); flex: 1 1 11rem; min-width: 0; }
.crit-scale { display: inline-flex; flex-wrap: wrap; gap: 0.1875rem; margin-left: auto; justify-content: flex-end; }
.crit-answer { margin-left: auto; font-size: 0.875rem; font-weight: 600; color: var(--sage-700); text-align: right; }
.tick {
  width: 1.5rem; height: 1.5rem; border-radius: 0.375rem; display: grid; place-items: center;
  font-size: 0.75rem; font-weight: 600; color: var(--ink-subtle);
  background: var(--paper); border: 0.0625rem solid var(--line);
}
.tick.on { background: var(--action); color: var(--action-ink); border-color: var(--action); }
.crit-hint { font-size: 0.75rem; color: var(--ink-subtle); margin: 0.625rem 0.5rem 0; line-height: 1.4; }

.diag-concl { margin-top: 0.875rem; padding: 0.875rem 1rem; border-radius: var(--radius-md); background: var(--sage-50); border: 0.0625rem solid var(--sage-100); }
.diag-concl.is-stop { background: var(--rose-50); border-color: var(--rose-100); }
.diag-concl-h { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--sage-700); margin-bottom: 0.375rem; }
.diag-concl.is-stop .diag-concl-h { color: var(--rose-700); }
.diag-concl-p { font-size: 0.9375rem; color: var(--ink-strong); margin: 0 0 0.5rem; line-height: 1.5; }
.diag-concl-m { font-size: 0.8125rem; color: var(--ink-muted); }

.subtabs {
  display: flex; gap: 0.25rem; margin: 0 auto 1.25rem; background: var(--paper-sunken);
  padding: 0.25rem; border-radius: 0.75rem; width: max-content; max-width: 100%;
  overflow-x: auto; scrollbar-width: none;
}
.subtabs::-webkit-scrollbar { display: none; }
.subtab {
  padding: 0.5rem 0.875rem; min-height: 2.5rem; border: none; border-radius: 0.5rem; background: none;
  font-family: inherit; font-size: 0.875rem; font-weight: 500; color: var(--ink-muted);
  cursor: pointer; white-space: nowrap;
}
.subtab[aria-selected="true"] { background: var(--paper); color: var(--ink-strong); font-weight: 600; box-shadow: var(--shadow-sm); }
.docs-add { display: flex; justify-content: flex-end; margin-bottom: 1rem; }

.doc-table { margin: 0; }
.doc-tr {
  display: grid; grid-template-columns: minmax(11rem, 17rem) minmax(0, 1fr);
  gap: 0.25rem 1.25rem; align-items: start;
  padding: 0.875rem 0.75rem; border-bottom: 0.0625rem solid var(--line-soft);
  border-left: 0.1875rem solid transparent; border-radius: var(--radius-sm);
}
.split .doc-tr { grid-template-columns: 1fr; gap: 0.375rem; }
.split .doc-k { flex-direction: row; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
.doc-tr:last-child { border-bottom: none; }
.doc-tr:hover { background: #FBF9F5; }
.doc-tr.is-missing { border-left-color: var(--amber-700); background: var(--amber-50); }
.doc-tr.is-missing:hover { background: #F8EBD3; }
.doc-k { display: flex; flex-direction: column; gap: 0.1875rem; min-width: 0; }
.doc-name { font-size: 0.9375rem; font-weight: 600; color: var(--ink-strong); line-height: 1.35; }
.doc-req { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; color: var(--ink-subtle); }
.doc-tr.is-missing .doc-req { color: var(--amber-700); }
.doc-v { margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 0.3125rem; }
.doc-state { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.doc-term { font-size: 0.875rem; color: var(--ink-strong); }
.doc-ver { font-size: 0.75rem; font-weight: 600; color: var(--ink-muted); background: var(--paper-soft); border: 0.0625rem solid var(--line); border-radius: 62.5rem; padding: 0.0625rem 0.4375rem; }
.doc-file { font-size: 0.8125rem; color: var(--ink-subtle); word-break: break-word; }
.doc-acts { display: flex; gap: 0.25rem 0.875rem; flex-wrap: wrap; align-items: center; margin-top: 0.1875rem; }
.doc-act {
  display: inline-flex; align-items: center; gap: 0.3125rem; min-height: 2.25rem;
  padding: 0.25rem 0.375rem; margin-left: -0.375rem; border: none; background: none; border-radius: 0.5rem;
  font-family: inherit; font-size: 0.8125rem; font-weight: 600; color: var(--sage-700); cursor: pointer;
  transition: background 0.12s, color 0.12s; text-decoration: none;
}
.doc-act svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; }
.doc-act:hover { background: var(--sage-50); color: var(--action); }
.btn-sm { min-height: 2.25rem; padding: 0.375rem 0.75rem; font-size: 0.8125rem; }

.hist { list-style: none; margin: 0; padding: 0; }
.hist-item { padding: 0.875rem 0; border-bottom: 0.0625rem solid var(--line-soft); }
.hist-item:last-child { border-bottom: none; }
.hist-head { display: flex; gap: 0.625rem; flex-wrap: wrap; align-items: baseline; margin-bottom: 0.1875rem; }
.hist-date { font-size: 0.875rem; font-weight: 600; color: var(--ink-strong); }
.hist-author { font-size: 0.8125rem; color: var(--ink-muted); }
.hist-reason { font-size: 0.9375rem; color: var(--ink-strong); }
.hist-fields { font-size: 0.8125rem; color: var(--ink-muted); margin-top: 0.1875rem; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
.hist-head .pill { margin-left: auto; }

@media (max-width: 48rem) {
  .cyc-summary { gap: 0.625rem 1.25rem; }
  .cyc-fact-v { font-size: 1.125rem; }
  .dir > summary { padding: 0.625rem 0.125rem; }
  .dir-score { margin-left: auto; }
  .doc-tr { grid-template-columns: 1fr; gap: 0.375rem; }
  .doc-k { flex-direction: row; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }
}

@media (max-width: 75rem) {
  .grid { grid-template-columns: 1fr; }
  .steps { grid-template-columns: repeat(3, 1fr); gap: 0.75rem 0.5rem; }
}
@media (max-width: 34rem) {
  .field-row { grid-template-columns: 1fr; }
}
@media (max-width: 60rem) {
  .split { grid-template-columns: 1fr; }
}
@media (max-width: 48rem) {
  .hero-body { grid-template-columns: auto minmax(0, 1fr); gap: 1rem; padding: 1.125rem; }
  .hero-actions { grid-column: 1 / -1; }
  .hero-actions .btn { flex: 1 1 auto; }
  .hero-ava { width: 4rem; height: 4rem; flex: 0 0 4rem; font-size: 1.375rem; }
  .hero-name { font-size: 1.625rem; }
  .route { padding: 1rem; }
  .steps { grid-template-columns: 1fr; gap: 0.5rem; }
  .step { padding-top: 0; padding-left: 0.875rem; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
  .step::before { top: 0; bottom: 0; left: 0; right: auto; width: 0.25rem; height: auto; }
  .kv-grid { grid-template-columns: 1fr; }
  .card-body { padding: 1rem; }
  .card-head { padding: 0.875rem 1rem 0.75rem; }
  .rd-assign-grid { grid-template-columns: 1fr; }
  .du-grid { grid-template-columns: 1fr; }
  .rd-history-kv-row { grid-template-columns: 1fr; gap: 0.125rem; }
}
@media (max-width: 30rem) {
  .du-foot { flex-direction: column-reverse; }
  .du-foot .du-btn { width: 100%; }
}

@media (max-width: 768px) {
  .tabs {
    justify-content: flex-start;
    padding: 0.3125rem;
    border-radius: var(--radius-md);
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-x: contain;
  }
  .tab { padding: 0.5rem 0.75rem; font-size: 0.875rem; flex: 0 0 auto; white-space: nowrap; }

  .breadcrumb { font-size: 0.8125rem; }
  .alert { flex-wrap: wrap; }
  .alert .btn { width: 100%; }

  .hero-actions { flex-wrap: wrap; }
  .hero-name-row { flex-wrap: wrap; }

  .cyc-tab { min-width: 9.5rem; }
  .subtabs { width: 100%; }
  .subtab { flex: 1 1 auto; text-align: center; }

  .card-foot { min-height: 2.75rem; }
  .doc-acts { gap: 0.375rem 0.625rem; }
  .doc-acts .btn { flex: 1 1 auto; }

  .modal { padding: 0; place-items: stretch; overflow: hidden; }
  .modal-box {
    width: 100%;
    max-width: none;
    height: calc(100dvh - var(--kb, 0px));
    max-height: calc(100dvh - var(--kb, 0px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0;
    border-left: none;
    border-right: none;
    padding-left: var(--safe-left, 0px);
    padding-right: var(--safe-right, 0px);
  }
  .modal-head { flex: 0 0 auto; padding: calc(1rem + var(--safe-top, 0px)) 1rem 0.75rem; }
  .modal-body {
    flex: 1 1 auto; min-height: 0;
    overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    padding: 0 1rem 1rem;
  }
  .modal-foot {
    flex: 0 0 auto;
    padding: 0.875rem 1rem calc(0.875rem + var(--safe-bottom, 0px));
    flex-direction: column-reverse;
    background: var(--paper);
  }
  .modal-foot > .btn { width: 100%; }

  .du-overlay { padding: 0; align-items: stretch; overflow: hidden; }
  .du-modal {
    width: 100%;
    height: calc(100dvh - var(--kb, 0px));
    max-height: calc(100dvh - var(--kb, 0px));
    border-radius: 0; border: none;
    padding-left: var(--safe-left, 0px); padding-right: var(--safe-right, 0px);
  }
  .du-head { padding-top: calc(1.125rem + var(--safe-top, 0px)); padding-left: 1rem; padding-right: 1rem; }
  .du-body { padding-left: 1rem; padding-right: 1rem; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
  .du-foot { padding: 0.875rem 1rem calc(0.875rem + var(--safe-bottom, 0px)); }

  .rd-lightbox { padding: 1rem; }
  .rd-lightbox-close { top: calc(0.75rem + var(--safe-top, 0px)); right: max(0.75rem, var(--safe-right, 0px)); }

  .crit-row { flex-direction: column; align-items: stretch; gap: 0.375rem; }
  .crit-scale { margin-left: 0; justify-content: flex-start; }
  .crit-answer { margin-left: 0; text-align: left; }
  .tick { width: 2rem; height: 2rem; }

  .kv-tools { margin-left: 0; }
  .rd-lightbox img { max-width: 96vw; }
}

@media (max-width: 30rem) {
  .hero-tags { gap: 0.375rem; }
  .id-chip, .status, .stage-chip { font-size: 0.6875rem; }
  .dir > summary { gap: 0.5rem; }
  .dir-spec { flex-basis: 100%; }
}
</style>
