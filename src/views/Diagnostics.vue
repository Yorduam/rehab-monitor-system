<template>
  <div class="diagnostics-page" :class="{ 'diag-readonly': readonlyView }">
    <a class="skip-link" href="#stages-flow">Перейти к этапам диагностики</a>


    <div class="content" :class="{ 'is-gated': !recipientChosen }">

      <div class="diag-gate" v-show="!recipientChosen">
        <div class="diag-gate-card">
          <div class="diag-gate-iconwrap" aria-hidden="true">
            <div class="diag-gate-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div class="diag-gate-body">
            <h2 class="diag-gate-title">{{ gateTitle }}</h2>
            <p class="diag-gate-text">{{ gateText }}</p>
            <div v-if="gateHasButton" class="diag-gate-actions">
              <button
                type="button"
                class="btn btn-primary diag-gate-btn"
                @click="openRecipientPicker"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Выбрать реабилитанта
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="hero-sticky-sentinel" aria-hidden="true"></div>

      <section class="hero" aria-labelledby="hero-name">
        <div class="hero-avatar" aria-hidden="true">—</div>
        <div class="hero-identity">
          <div class="hero-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
            </svg>
            {{ heroEyebrow }}
          </div>
          <div class="hero-name-row">
            <h1 class="hero-name" id="hero-name" tabindex="0" title="Дважды кликните, чтобы выбрать другого реабилитанта">Загрузка…</h1>
            <button type="button" class="hero-switch" id="recipient-switch-btn" title="Выбрать другого реабилитанта">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Сменить
            </button>
          </div>
          <div class="hero-meta">
            <span>R-000184</span>
            <span class="sep-dot" aria-hidden="true"></span>
            <span>11 лет · 14 мая 2014</span>
            <span class="sep-dot" aria-hidden="true"></span>
            <span>РАС</span>
            <span class="sep-dot" aria-hidden="true"></span>
            <span>ЦРГ: Средние</span>
          </div>
          <div class="hero-section-tag" aria-live="polite">
            <span class="hst-label">Раздел</span>
            <span class="hst-divider" aria-hidden="true"></span>
            <span class="hst-name" id="hero-section-name">Психолог + логопед</span>
          </div>
        </div>
        <div class="hero-progress" aria-label="Общий прогресс диагностики">
          <div class="progress-label">Этапов завершено</div>
          <div class="progress-pct"><span id="route-done">1</span><span class="of"> / 4</span></div>
          <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="4" aria-valuenow="1" aria-label="Завершено этапов">
            <div class="progress-fill" id="route-fill" style="width: 25%"></div>
          </div>
        </div>
      </section>

      <section class="diag-switch" aria-label="Диагностики реабилитанта">
        <header class="ds-head">
          <h2 class="ds-title">История диагностик</h2>
          <span class="ds-count">{{ sessionTabs.length }}</span>
        </header>

        <div class="ds-row">
          <div class="ds-tabs" role="tablist" aria-label="Переключение по диагностикам">
            <button
              v-for="tab in sessionTabs"
              :key="tab.id"
              type="button"
              role="tab"
              class="ds-tab"
              :class="{ 'is-active': tab.id === selectedSessionId, 'is-done': tab.done, 'is-live': tab.live }"
              :aria-selected="tab.id === selectedSessionId"
              @click="selectSession(tab.id)"
            >
              <span class="ds-tab-num">{{ tab.num }}</span>
              <span class="ds-tab-body">
                <span class="ds-tab-kind">
                  {{ tab.kindLabel }}<template v-if="tab.ordinal"> · {{ tab.ordinal }}</template>
                </span>
                <span class="ds-tab-meta">
                  <span class="ds-tab-date">{{ tab.dateLabel }}</span>
                  <span class="ds-state" :class="tab.done ? 'is-done' : tab.live ? 'is-live' : 'is-wait'">
                    {{ tab.stateLabel }}<template v-if="tab.progress && !tab.done"> · {{ tab.progress }}</template>
                  </span>
                </span>
              </span>
            </button>
            <p v-if="!sessionTabs.length" class="ds-empty">Диагностик пока не было</p>
          </div>

          <div v-if="isTeacher" class="ds-actions">
            <button
              v-if="canJoinSelected"
              type="button"
              class="ds-btn ds-btn-join"
              :disabled="sessionBusy"
              @click="joinSelectedSession"
            >
              Присоединиться
            </button>
            <div class="ds-start">
              <label class="sr-only" for="ds-start-kind">Тип новой диагностики</label>
              <select id="ds-start-kind" class="ds-kind" v-model="startKind" :disabled="sessionBusy">
                <option value="interim">Промежуточная</option>
                <option value="final">Итоговая</option>
              </select>
              <button
                type="button"
                class="ds-btn ds-btn-start"
                :disabled="sessionBusy"
                @click="startObservation"
              >
                Начать диагностику
              </button>
            </div>
          </div>
        </div>
        <p v-if="switchNote" class="ds-note" role="status">{{ switchNote }}</p>
      </section>

      <section class="route" aria-labelledby="route-title">
        <div class="route-head">
          <h2 class="route-title" id="route-title">Маршрут диагностики</h2>
        </div>
        <div class="route-tiles" role="list">

          <button type="button" class="stage-tile in-progress" role="listitem" data-stage="psy">
            <span class="num-line">
              <span>01</span>
              <svg class="st-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </span>
            <span class="st-name">Психолог + логопед</span>
          </button>

          <button type="button" class="stage-tile in-progress" role="listitem" data-stage="afk">
            <span class="num-line">
              <span>02</span>
              <svg class="st-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </span>
            <span class="st-name">АФК</span>
          </button>

          <button type="button" class="stage-tile in-progress is-current" role="listitem" data-stage="soc">
            <span class="num-line">
              <span>03</span>
              <svg class="st-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>
            </span>
            <span class="st-name">Соц.-культурная</span>
          </button>

          <button type="button" class="stage-tile pending" role="listitem" data-stage="final">
            <span class="num-line">
              <span>04</span>
            </span>
            <span class="st-name">Заключение</span>
          </button>

        </div>
      </section>

      <div class="mobile-route">
        <label class="sr-only" for="mobile-stage">Перейти к этапу</label>
        <select id="mobile-stage" @change="handleMobileStageChange">
          <option value="">Перейти к этапу…</option>
          <option value="#stage-psy">01 · Психолог + логопед (в работе)</option>
          <option value="#stage-afk">02 · АФК (в процессе)</option>
          <option value="#stage-soc">03 · Соц.-культурная (ваш этап)</option>
          <option value="#stage-final">04 · Заключение</option>
        </select>
      </div>

      <div class="grid">

        <div id="stages-flow">

          <article class="stage-card" id="stage-psy" data-stage="psy" data-status="progress">
            <button type="button" class="stage-head-clickable" aria-expanded="true" aria-controls="stage-psy-body">
              <div class="stage-num amber" aria-hidden="true">01</div>
              <div class="stage-info">
                <div class="title-row">
                  <span class="title">Психолог + логопед</span>
                  <span class="badge progress">В работе</span>
                </div>
                <div class="sub-row">
                  <span data-role="stage-specialists" data-profile="psy log"></span>
                  <span class="sep" aria-hidden="true"></span>
                  <span>2 подраздела: психолог · логопед</span>
                  <span class="sep" aria-hidden="true"></span>
                  <span>Чек-лист, эмоц.-волевая сфера, речь</span>
                </div>
              </div>
              <div class="stage-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            <div class="stage-body" id="stage-psy-body">

              <div class="subtabs-wrap" role="tablist" aria-label="Подразделы психолого-логопедической диагностики">
                <button type="button" class="subtab active" role="tab" aria-selected="true" data-subtab="psy" id="subtab-psy">
                  <span class="sub-status" aria-hidden="true"></span>
                  Психолог
                </button>
                <button type="button" class="subtab" role="tab" aria-selected="false" data-subtab="log" id="subtab-log">
                  <span class="sub-status" aria-hidden="true"></span>
                  Логопед
                </button>
              </div>

              <div class="subpanel active" id="subpanel-psy" role="tabpanel" aria-labelledby="subtab-psy">

                <div class="subpanel-head">
                  <div class="sp-icon blue" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11.5V7a3 3 0 016 0v4.5"/><path d="M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z"/></svg>
                  </div>
                  <div>
                    <div class="t">Психологическая диагностика</div>
                    <div class="s">Коммуникативное развитие, эмоц.-волевая сфера, познавательные процессы</div>
                  </div>
                </div>

              <div class="sub-section">
                <h3 class="sub-section-title">
                  <span class="ss-icon" aria-hidden="true" style="background: var(--blue-50); color: var(--blue-700);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                  </span>
                  Коммуникативное развитие
                </h3>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Установление контакта</span>
                  </legend>
                  <div class="chip-group">
                    <label class="chip"><input type="checkbox" name="psy-contact" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Лёгкий</label>
                    <label class="chip selected"><input type="checkbox" name="psy-contact" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Избирательный</label>
                    <label class="chip selected"><input type="checkbox" name="psy-contact" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Формальный</label>
                    <label class="chip"><input type="checkbox" name="psy-contact" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Затруднён</label>
                    <label class="chip"><input type="checkbox" name="psy-contact" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Отсутствует</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Способ коммуникации</span>
                  </legend>
                  <div class="chip-group">
                    <label class="chip selected"><input type="checkbox" name="psy-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Речевой</label>
                    <label class="chip selected"><input type="checkbox" name="psy-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Жестовый</label>
                    <label class="chip"><input type="checkbox" name="psy-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Альтернативная (PECS, карточки)</label>
                    <label class="chip"><input type="checkbox" name="psy-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Только звуковая</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Коммуникативная направленность речи</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="psy-speech" /><span class="chip-check" aria-hidden="true"></span>Инициирует общение</label>
                    <label class="chip radio selected"><input type="radio" name="psy-speech" /><span class="chip-check" aria-hidden="true"></span>Поддерживает беседу</label>
                    <label class="chip radio"><input type="radio" name="psy-speech" /><span class="chip-check" aria-hidden="true"></span>Реактивная (отвечает)</label>
                    <label class="chip radio"><input type="radio" name="psy-speech" /><span class="chip-check" aria-hidden="true"></span>Эхолалии</label>
                    <label class="chip radio"><input type="radio" name="psy-speech" /><span class="chip-check" aria-hidden="true"></span>Отсутствует</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Ориентация во времени, пространстве и собственной личности</span>
                  </legend>
                  <div class="segmented" role="radiogroup" aria-label="Ориентация" data-scheme="rating">
                    <button type="button" class="seg-btn sage" role="radio" aria-checked="false" data-group="psy-orient">Ориентирован</button>
                    <button type="button" class="seg-btn" role="radio" aria-checked="false" data-group="psy-orient">Частично</button>
                    <button type="button" class="seg-btn" role="radio" aria-checked="false" data-group="psy-orient">Дезориентирован</button>
                  </div>
                </fieldset>
              </div>

              <div class="sub-section">
                <h3 class="sub-section-title">
                  <span class="ss-icon" aria-hidden="true" style="background: var(--rose-50); color: var(--rose-700);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                  </span>
                  Эмоционально-волевая сфера
                </h3>

                <fieldset class="qgroup">
                  <legend class="qlabel"><span class="qlabel-text">Общие характеристики</span></legend>
                  <div class="test-list">

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--sage-50); color: var(--sage-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Активность</div>
                        <div class="td">Общая активность во время диагностической встречи</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Активность">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="psy-active">Активен</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="psy-active">Пассивен</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--blue-50); color: var(--blue-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Деятельность</div>
                        <div class="td">Характер деятельности при выполнении задач</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Деятельность">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="psy-act">Целенаправленная</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="psy-act">Нецеленаправленная</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--amber-50); color: var(--amber-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3v18"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Тонус</div>
                        <div class="td">Общий мышечный и психологический тонус</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Тонус">
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="psy-tone">Снижен</button>
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="psy-tone">В норме</button>
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="psy-tone">Повышен</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--plum-50); color: var(--plum-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Включённость в работу</div>
                        <div class="td">Степень вовлечения в предложенные задания</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Включённость в работу">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="psy-incl">Полная</button>
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="psy-incl">Частичная</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="psy-incl">Минимальная</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--teal-50); color: var(--teal-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Поведение</div>
                        <div class="td">Адекватность поведенческих реакций ситуации</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Поведение">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="psy-behav">Адекватное</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="psy-behav">Неадекватное</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--rose-50); color: var(--rose-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v4M10 3v4M14 3v4M18 3v4M3 9h18M5 21l3-8 4 8 4-12 3 12"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Двигательная активность</div>
                        <div class="td">Уровень моторной активности во время встречи</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Двигательная активность">
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="psy-motor">Снижена</button>
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="psy-motor">В норме</button>
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="psy-motor">Повышена</button>
                      </div>
                    </div>

                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Особенности поведения и настроения</span>
                  </legend>
                  <div class="chip-group">
                    <label class="chip"><input type="checkbox" name="psy-mood" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Тревожность</label>
                    <label class="chip selected"><input type="checkbox" name="psy-mood" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Сенсорная чувствительность</label>
                    <label class="chip"><input type="checkbox" name="psy-mood" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Стереотипии</label>
                    <label class="chip"><input type="checkbox" name="psy-mood" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Аутоагрессия</label>
                    <label class="chip"><input type="checkbox" name="psy-mood" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Импульсивность</label>
                    <label class="chip"><input type="checkbox" name="psy-mood" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Замкнутость</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Выраженность эмоциональных проявлений</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="psy-emo" /><span class="chip-check" aria-hidden="true"></span>Яркая, выразительная</label>
                    <label class="chip radio selected"><input type="radio" name="psy-emo" /><span class="chip-check" aria-hidden="true"></span>Умеренная</label>
                    <label class="chip radio"><input type="radio" name="psy-emo" /><span class="chip-check" aria-hidden="true"></span>Сглаженная</label>
                    <label class="chip radio"><input type="radio" name="psy-emo" /><span class="chip-check" aria-hidden="true"></span>Не выражена</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Способность дифференцировать эмоции</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="psy-diff" /><span class="chip-check" aria-hidden="true"></span>Различает основные</label>
                    <label class="chip radio selected"><input type="radio" name="psy-diff" /><span class="chip-check" aria-hidden="true"></span>Частично</label>
                    <label class="chip radio"><input type="radio" name="psy-diff" /><span class="chip-check" aria-hidden="true"></span>Не различает</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Реакция на одобрение</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio selected"><input type="radio" name="psy-praise" /><span class="chip-check" aria-hidden="true"></span>Адекватная (рад, мотивирован)</label>
                    <label class="chip radio"><input type="radio" name="psy-praise" /><span class="chip-check" aria-hidden="true"></span>Слабо выражена</label>
                    <label class="chip radio"><input type="radio" name="psy-praise" /><span class="chip-check" aria-hidden="true"></span>Не реагирует</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Реакция на замечание</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio selected"><input type="radio" name="psy-remark" /><span class="chip-check" aria-hidden="true"></span>Исправляет поведение</label>
                    <label class="chip radio"><input type="radio" name="psy-remark" /><span class="chip-check" aria-hidden="true"></span>Реагирует, но не сразу</label>
                    <label class="chip radio"><input type="radio" name="psy-remark" /><span class="chip-check" aria-hidden="true"></span>Негативная реакция</label>
                    <label class="chip radio"><input type="radio" name="psy-remark" /><span class="chip-check" aria-hidden="true"></span>Не реагирует</label>
                  </div>
                </fieldset>
              </div>

              <div class="sub-section">
                <h3 class="sub-section-title">
                  <span class="ss-icon" aria-hidden="true" style="background: var(--amber-50); color: var(--amber-700);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </span>
                  Произвольная регуляция и планирование
                </h3>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Возможность восприятия инструкции</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="psy-instr" /><span class="chip-check" aria-hidden="true"></span>Самостоятельно</label>
                    <label class="chip radio selected"><input type="radio" name="psy-instr" /><span class="chip-check" aria-hidden="true"></span>При внешней организации</label>
                    <label class="chip radio"><input type="radio" name="psy-instr" /><span class="chip-check" aria-hidden="true"></span>Только при многократном повторении</label>
                    <label class="chip radio"><input type="radio" name="psy-instr" /><span class="chip-check" aria-hidden="true"></span>Не воспринимает</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Способность удержания инструкции</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="psy-hold" /><span class="chip-check" aria-hidden="true"></span>Удерживает до конца</label>
                    <label class="chip radio selected"><input type="radio" name="psy-hold" /><span class="chip-check" aria-hidden="true"></span>Теряет к середине</label>
                    <label class="chip radio"><input type="radio" name="psy-hold" /><span class="chip-check" aria-hidden="true"></span>Не удерживает</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel"><span class="qlabel-text">Работоспособность</span></legend>
                  <div class="segmented" role="radiogroup" aria-label="Работоспособность" data-scheme="rating">
                    <button type="button" class="seg-btn" role="radio" aria-checked="false" data-group="psy-work">Высокая</button>
                    <button type="button" class="seg-btn" role="radio" aria-checked="false" data-group="psy-work">В норме</button>
                    <button type="button" class="seg-btn amber" role="radio" aria-checked="false" data-group="psy-work">Снижена</button>
                    <button type="button" class="seg-btn" role="radio" aria-checked="false" data-group="psy-work">Низкая</button>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Адекватность употребления предложенных игрушек и предметов</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio selected"><input type="radio" name="psy-toys" /><span class="chip-check" aria-hidden="true"></span>Адекватно</label>
                    <label class="chip radio"><input type="radio" name="psy-toys" /><span class="chip-check" aria-hidden="true"></span>Частично</label>
                    <label class="chip radio"><input type="radio" name="psy-toys" /><span class="chip-check" aria-hidden="true"></span>Неадекватно</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Стойкость интереса</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="psy-int" /><span class="chip-check" aria-hidden="true"></span>Стойкий</label>
                    <label class="chip radio selected"><input type="radio" name="psy-int" /><span class="chip-check" aria-hidden="true"></span>Поверхностный</label>
                    <label class="chip radio"><input type="radio" name="psy-int" /><span class="chip-check" aria-hidden="true"></span>Отсутствует</label>
                  </div>
                </fieldset>
              </div>

              <div class="sub-section">
                <h3 class="sub-section-title">
                  <span class="ss-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </span>
                  Комментарий специалиста
                </h3>

                <div class="qgroup" style="margin-top: 0; padding-top: 0; border-top: none;">
                  <textarea class="textarea textarea-lg" placeholder="Что важно учесть при дальнейшей работе с ребёнком"></textarea>
                </div>
              </div>

                <div class="subblock-actions">
                  <span class="signed-note" style="color: var(--ink-subtle);" data-role="block-authors" data-profile="psy"></span>
                  <div class="spacer"></div>
                  <button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>
                </div>

              </div>

              <div class="subpanel" id="subpanel-log" role="tabpanel" aria-labelledby="subtab-log">

                <div class="subpanel-head">
                  <div class="sp-icon teal" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h3l3-9 6 18 3-9h3"/></svg>
                  </div>
                  <div>
                    <div class="t">Логопедическая диагностика</div>
                    <div class="s">Понимание речи, способ коммуникации, произносительная сторона, чтение и письмо</div>
                  </div>
                </div>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Понимание обращённой речи</span>
                  </legend>
                  <div class="triple-control" role="radiogroup" aria-label="Реакция на имя">
                    <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-name">Реагирует на имя</button>
                    <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="log-name">Не реагирует</button>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Уровень понимания речи</span>
                  </legend>
                  <div class="level-grid" role="radiogroup" aria-label="Уровень понимания речи">

                    <button type="button" class="level-card" role="radio" aria-checked="false" data-level="1">
                      <div class="ln"><span class="badge-num">1</span>1 уровень</div>
                      <div class="ld">Выражено речевое внимание, прислушивается к голосу, адекватно реагирует на интонацию, узнаёт знакомые голоса.</div>
                    </button>

                    <button type="button" class="level-card" role="radio" aria-checked="false" data-level="2">
                      <div class="ln"><span class="badge-num">2</span>2 уровень</div>
                      <div class="ld">Понимает отдельные инструкции в знакомых словосочетаниях, подчиняется некоторым командам: «Поцелуй маму», «Где папа», «Дай ручку», «Нельзя».</div>
                    </button>

                    <button type="button" class="level-card" role="radio" aria-checked="false" data-level="3">
                      <div class="ln"><span class="badge-num">3</span>3 уровень.</div>
                      <div class="ld">Понимает названия предметов и игрушек (10–12 мес.), узнаёт их на картинках (12–14 мес.), на сюжетной картинке (15–18 мес.).</div>
                    </button>

                    <button type="button" class="level-card" role="radio" aria-checked="false" data-level="4">
                      <div class="ln"><span class="badge-num">4</span>4 уровень</div>
                      <div class="ld">Понимает двухступенчатую инструкцию («Пойди в кухню, принеси чашку»), значение предлогов в привычной ситуации, вопросы косвенных падежей.</div>
                    </button>

                    <button type="button" class="level-card" role="radio" aria-checked="false" data-level="5">
                      <div class="ln"><span class="badge-num">5</span>5 уровень</div>
                      <div class="ld">Понимает прочитанные короткие рассказы и сказки.</div>
                    </button>

                    <button type="button" class="level-card" role="radio" aria-checked="false" data-level="6">
                      <div class="ln"><span class="badge-num">6</span>6 уровень</div>
                      <div class="ld">Понимает значение сложноподчинённых предложений, значение предлогов вне привычной конкретной ситуации.</div>
                    </button>

                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Ведущая деятельность</span>
                  </legend>
                  <div class="chip-group" role="radiogroup">
                    <label class="chip radio"><input type="radio" name="log-leadact" /><span class="chip-check" aria-hidden="true"></span>Предметно-манипулятивная</label>
                    <label class="chip radio selected"><input type="radio" name="log-leadact" /><span class="chip-check" aria-hidden="true"></span>Игровая</label>
                    <label class="chip radio"><input type="radio" name="log-leadact" /><span class="chip-check" aria-hidden="true"></span>Учебная</label>
                    <label class="chip radio"><input type="radio" name="log-leadact" /><span class="chip-check" aria-hidden="true"></span>Трудовая</label>
                  </div>
                </fieldset>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Способ коммуникации</span>
                  </legend>
                  <div class="chip-group">
                    <label class="chip selected"><input type="checkbox" name="log-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Речь</label>
                    <label class="chip"><input type="checkbox" name="log-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Отдельные звуки</label>
                    <label class="chip selected"><input type="checkbox" name="log-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Жесты</label>
                    <label class="chip"><input type="checkbox" name="log-comm" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Средства альтернативной коммуникации</label>
                  </div>
                </fieldset>

                <div class="sub-section">
                  <h3 class="sub-section-title">
                    <span class="ss-icon" aria-hidden="true" style="background: var(--teal-50); color: var(--teal-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    </span>
                    Состояние произносительной стороны речи и речевого аппарата
                  </h3>

                  <fieldset class="qgroup">
                    <legend class="qlabel">
                      <span class="qlabel-text">Общее описание состояния</span>
                    </legend>
                    <textarea class="textarea" placeholder="Состояние артикуляционного аппарата, особенности звукопроизношения, темп речи и т. д."></textarea>
                  </fieldset>

                  <div class="test-list">

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--blue-50); color: var(--blue-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12s2-4 8-4 8 4 8 4-2 4-8 4-8-4-8-4z"/><circle cx="12" cy="12" r="2"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Дыхание</div>
                        <div class="td">Тип дыхания во время речи</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Дыхание">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-breath">Носовое</button>
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="log-breath">Ротовое поверхностное (грудное)</button>
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-breath">Диафрагмальное</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--amber-50); color: var(--amber-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c2-4 5-4 7 0s5 4 7 0 4-4 4-4"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Просодика</div>
                        <div class="td">Интонационная выразительность речи</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Просодика">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-prosod">Эмоционально окрашенная</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="log-prosod">Монотонная</button>
                      </div>
                    </div>

                    <div class="test-row has-chips">
                      <div class="test-icon" aria-hidden="true" style="background: var(--plum-50); color: var(--plum-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Тембральные особенности</div>
                        <div class="td">При наличии — отметить тип нарушения</div>
                      </div>
                      <div class="chip-group">
                        <label class="chip"><input type="checkbox" name="log-timbre" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Ринолалия</label>
                        <label class="chip"><input type="checkbox" name="log-timbre" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Дисфония</label>
                        <label class="chip"><input type="checkbox" name="log-timbre" /><span class="chip-check" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>Дизартрия</label>
                      </div>
                    </div>

                  </div>
                </div>

                <div class="sub-section">
                  <h3 class="sub-section-title">
                    <span class="ss-icon" aria-hidden="true" style="background: var(--blue-50); color: var(--blue-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
                    </span>
                    Речь, чтение, письмо, мышление
                  </h3>

                  <div class="test-list">

                    <div class="test-row has-chips">
                      <div class="test-icon" aria-hidden="true" style="background: var(--sage-50); color: var(--sage-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Фразовая речь</div>
                        <div class="td">Уровень развития фразовой речи</div>
                      </div>
                      <div class="chip-group" role="radiogroup">
                        <label class="chip radio"><input type="radio" name="log-phrase" /><span class="chip-check" aria-hidden="true"></span>Отсутствует</label>
                        <label class="chip radio selected"><input type="radio" name="log-phrase" /><span class="chip-check" aria-hidden="true"></span>Простая</label>
                        <label class="chip radio"><input type="radio" name="log-phrase" /><span class="chip-check" aria-hidden="true"></span>Развёрнутая</label>
                        <label class="chip radio"><input type="radio" name="log-phrase" /><span class="chip-check" aria-hidden="true"></span>Сложная ситуативная</label>
                        <label class="chip radio"><input type="radio" name="log-phrase" /><span class="chip-check" aria-hidden="true"></span>Эхолалия</label>
                      </div>
                    </div>

                    <div class="test-row has-chips">
                      <div class="test-icon" aria-hidden="true" style="background: var(--amber-50); color: var(--amber-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Чтение</div>
                        <div class="td">Сформированность навыка чтения</div>
                      </div>
                      <div class="chip-group" role="radiogroup">
                        <label class="chip radio selected"><input type="radio" name="log-read" /><span class="chip-check" aria-hidden="true"></span>Звуко-буквенное</label>
                        <label class="chip radio"><input type="radio" name="log-read" /><span class="chip-check" aria-hidden="true"></span>Послоговое</label>
                        <label class="chip radio"><input type="radio" name="log-read" /><span class="chip-check" aria-hidden="true"></span>Целостное</label>
                        <label class="chip radio"><input type="radio" name="log-read" /><span class="chip-check" aria-hidden="true"></span>Не сформировано</label>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--rose-50); color: var(--rose-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Письмо</div>
                        <div class="td">Сформированность навыка письма</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Письмо">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-write">Сформировано</button>
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="log-write">Сформировано частично</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="log-write">Не сформировано</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--blue-50); color: var(--blue-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Мышление · Понимание</div>
                        <div class="td">Понимает ли ребёнок предложенный материал</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Мышление: понимание">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-think-unders">Понимает</button>
                        <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="log-think-unders">Понимает частично</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="log-think-unders">Не понимает</button>
                      </div>
                    </div>

                    <div class="test-row">
                      <div class="test-icon" aria-hidden="true" style="background: var(--plum-50); color: var(--plum-700);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                      </div>
                      <div class="test-info">
                        <div class="tn">Мышление · Объяснение</div>
                        <div class="td">Способность объяснить понятое (1 из 2 ситуаций)</div>
                      </div>
                      <div class="triple-control" role="radiogroup" aria-label="Мышление: объяснение">
                        <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="log-think-expl">Может объяснить</button>
                        <button type="button" class="triple-btn no" role="radio" aria-checked="false" data-group="log-think-expl">Не может объяснить</button>
                      </div>
                    </div>

                  </div>
                </div>

                <fieldset class="qgroup">
                  <legend class="qlabel">
                    <span class="qlabel-text">Комментарий специалиста</span>
                  </legend>
                  <textarea class="textarea textarea-lg" placeholder="Дополнительные наблюдения логопеда, рекомендации, особенности взаимодействия"></textarea>
                </fieldset>

                <div class="subblock-actions">
                  <span class="signed-note" style="color: var(--ink-subtle);" data-role="block-authors" data-profile="log"></span>
                  <div class="spacer"></div>
                  <button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>
                </div>

              </div>

              <div class="stage-actions">
                <span class="hint-pending" data-role="pending-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Завершите все подразделы
                </span>
                <div class="spacer"></div>
                <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                <button type="button" class="btn btn-primary btn-sm" data-action="finish-stage" disabled aria-describedby="psy-pending-hint" title="Сначала завершите все подразделы">Завершить этап</button>
              </div>
            </div>
          </article>

          <article class="stage-card" id="stage-afk" data-stage="afk" data-status="progress">
            <button type="button" class="stage-head-clickable" aria-expanded="true" aria-controls="stage-afk-body">
              <div class="stage-num amber" aria-hidden="true">02</div>
              <div class="stage-info">
                <div class="title-row">
                  <span class="title">Адаптивная физическая культура</span>
                  <span class="badge progress">В процессе · 62 %</span>
                </div>
                <div class="sub-row">
                  <span data-role="stage-specialists" data-profile="afk"></span>
                  <span class="sep" aria-hidden="true"></span>
                  <span>Начато 16 мая</span>
                </div>
              </div>
              <div class="stage-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            <div class="stage-body" id="stage-afk-body">

              <div class="qgroup" style="margin-top: 0; padding-top: 0; border-top: none;">
                <div class="qlabel"><span class="qlabel-text">Целевая группа реабилитации (ЦРГ)</span></div>
                <input type="text" class="input" placeholder="Из таблицы целевых групп центра" />
              </div>

              <div class="qgroup">
                <div class="qlabel">
                  <span class="qlabel-text">Сопутствующий диагноз</span>
                </div>
                <div class="qhint-extra">Например: сердечно-сосудистые, нарушение осанки, астма, проблемы с лёгкими</div>
                <textarea class="textarea" placeholder="Краткое описание сопутствующих заболеваний"></textarea>
              </div>

              <fieldset class="qgroup">
                <legend class="qlabel">
                  <span class="qlabel-text">Ограничения к занятиям по АФК</span>
                </legend>
                <div class="segmented" role="radiogroup" aria-label="Ограничения к АФК" data-scheme="rating">
                  <button type="button" class="seg-btn sage" role="radio" aria-checked="false" data-group="afk-rest">Не имеется</button>
                  <button type="button" class="seg-btn" role="radio" aria-checked="false" data-group="afk-rest">Имеются</button>
                </div>
                <textarea class="textarea" style="margin-top: 0.75rem;" placeholder="Если имеются — какие именно (с указанием рекомендаций врача)"></textarea>
              </fieldset>

              <fieldset class="qgroup">
                <legend class="qlabel">
                  <span class="qlabel-text">Шкала глобальных моторных функций (GMFCS)</span>
                </legend>
                <div class="qhint-extra">Заполняется только при ДЦП. Иначе отметьте «не применимо».</div>
                <div class="gmfcs-grid" role="radiogroup">
                  <button type="button" class="gmfcs-card" role="radio" aria-checked="false" data-group="gmfcs">
                    <span class="lv">I</span>
                    <span class="lvname">1 уровень</span>
                    <span class="lvdesc">Ходит без ограничений</span>
                  </button>
                  <button type="button" class="gmfcs-card" role="radio" aria-checked="false" data-group="gmfcs">
                    <span class="lv">II</span>
                    <span class="lvname">2 уровень</span>
                    <span class="lvdesc">Ходит с ограничениями</span>
                  </button>
                  <button type="button" class="gmfcs-card" role="radio" aria-checked="false" data-group="gmfcs">
                    <span class="lv">III</span>
                    <span class="lvname">3 уровень</span>
                    <span class="lvdesc">Ходит с применением вспомогательных приспособлений</span>
                  </button>
                  <button type="button" class="gmfcs-card" role="radio" aria-checked="false" data-group="gmfcs">
                    <span class="lv">IV</span>
                    <span class="lvname">4 уровень</span>
                    <span class="lvdesc">Передвижение ограничено, возможно электрокресло</span>
                  </button>
                  <button type="button" class="gmfcs-card" role="radio" aria-checked="false" data-group="gmfcs">
                    <span class="lv">V</span>
                    <span class="lvname">5 уровень</span>
                    <span class="lvdesc">Мобильность только в механическом кресле, не удерживает голову</span>
                  </button>
                  <button type="button" class="gmfcs-card none selected" role="radio" aria-checked="false" data-group="gmfcs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width: 0.875rem; height: 0.875rem;"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                    Не применимо (нет ДЦП)
                  </button>
                </div>
              </fieldset>

              <fieldset class="qgroup">
                <legend class="qlabel">
                  <span class="qlabel-text">Тестирование физических качеств</span>
                </legend>
                <div class="test-list">

                  <div class="test-row">
                    <div class="test-icon" aria-hidden="true" style="background: var(--rose-50); color: var(--rose-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12a6 6 0 1112 0 6 6 0 01-12 0z"/><path d="M2 12h4M18 12h4M12 2v4M12 18v4"/></svg>
                    </div>
                    <div class="test-info">
                      <div class="tn">Сила</div>
                      <div class="td">Бросок мяча в руки и возврат обратно — точность и сила броска</div>
                    </div>
                    <div class="triple-control" role="radiogroup" aria-label="Сила">
                      <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="afk-strength">Справился</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-strength">Частично</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-strength">Не справился</button>
                    </div>
                  </div>

                  <div class="test-row">
                    <div class="test-icon" aria-hidden="true" style="background: var(--amber-50); color: var(--amber-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h4l3-9 4 18 3-9h4"/></svg>
                    </div>
                    <div class="test-info">
                      <div class="tn">Выносливость</div>
                      <div class="td">Быстрые приседания — максимально возможное количество за 1 минуту</div>
                    </div>
                    <div class="triple-control" role="radiogroup" aria-label="Выносливость">
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-endurance">Справился</button>
                      <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="afk-endurance">Частично</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-endurance">Не справился</button>
                    </div>
                  </div>

                  <div class="test-row">
                    <div class="test-icon" aria-hidden="true" style="background: var(--teal-50); color: var(--teal-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.5 0 4.76 1.02 6.4 2.66"/><path d="M21 4v6h-6"/></svg>
                    </div>
                    <div class="test-info">
                      <div class="tn">Гибкость</div>
                      <div class="td">Складочка стоя — проверка гибкости бёдер и поясницы</div>
                    </div>
                    <div class="triple-control" role="radiogroup" aria-label="Гибкость">
                      <button type="button" class="triple-btn yes" role="radio" aria-checked="false" data-group="afk-flex">Справился</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-flex">Частично</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-flex">Не справился</button>
                    </div>
                  </div>

                  <div class="test-row">
                    <div class="test-icon" aria-hidden="true" style="background: var(--blue-50); color: var(--blue-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
                    </div>
                    <div class="test-info">
                      <div class="tn">Реакция и ловкость</div>
                      <div class="td">Попадание мешочков в ведро на разном расстоянии</div>
                    </div>
                    <div class="triple-control" role="radiogroup" aria-label="Реакция и ловкость">
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-react">Справился</button>
                      <button type="button" class="triple-btn partial" role="radio" aria-checked="false" data-group="afk-react">Частично</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-react">Не справился</button>
                    </div>
                  </div>

                  <div class="test-row">
                    <div class="test-icon" aria-hidden="true" style="background: var(--plum-50); color: var(--plum-700);">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
                    </div>
                    <div class="test-info">
                      <div class="tn">Координация</div>
                      <div class="td">Удержание равновесия стоя на одной ноге</div>
                    </div>
                    <div class="triple-control" role="radiogroup" aria-label="Координация">
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-coord">Справился</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-coord">Частично</button>
                      <button type="button" class="triple-btn" role="radio" aria-checked="false" data-group="afk-coord">Не справился</button>
                    </div>
                  </div>

                </div>
              </fieldset>

              <div class="qgroup">
                <div class="qlabel"><span class="qlabel-text">Спорт или спортивное увлечение на данный момент</span></div>
                <input type="text" class="input" placeholder="Перечислите занятия" />
              </div>

              <fieldset class="qgroup">
                <legend class="qlabel">
                  <span class="qlabel-text">Оценка физического развития</span>
                </legend>
                <div class="level-grid" role="radiogroup">
                  <button type="button" class="level-card rose" role="radio" aria-checked="false" data-group="afk-level">
                    <span class="ln"><span class="badge-num">1</span>Низкий уровень</span>
                    <span class="ld">1–2 теста из 5 выполнены удовлетворительно или ниже. Нет интереса, не действует по инструкции или только при помощи. Не идёт на контакт, не соблюдает дисциплину.</span>
                  </button>
                  <button type="button" class="level-card amber" role="radio" aria-checked="false" data-group="afk-level">
                    <span class="ln"><span class="badge-num">2</span>Средний уровень</span>
                    <span class="ld">3–4 теста из 5 «хорошо». Действует частично по инструкции, не в полном объёме участвует в общей деятельности, временами не соблюдает дисциплину.</span>
                  </button>
                  <button type="button" class="level-card" role="radio" aria-checked="false" data-group="afk-level">
                    <span class="ln"><span class="badge-num">3</span>Высокий уровень</span>
                    <span class="ld">5 тестов из 5 «отлично». Хорошо идёт на контакт, действует по инструкции, активно участвует, взаимодействует со специалистами.</span>
                  </button>
                </div>
              </fieldset>

              <fieldset class="qgroup">
                <legend class="qlabel">
                  <span class="qlabel-text">Комментарий специалиста</span>
                </legend>
                <textarea class="textarea textarea-lg" placeholder="Особые условия, рекомендации, что важно учесть на занятиях"></textarea>
              </fieldset>

              <div class="stage-actions">
                <span class="signed-note" style="color: var(--ink-subtle);" data-role="block-authors" data-profile="afk"></span>
                <div class="spacer"></div>
                <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                <button type="button" class="btn btn-primary btn-sm" data-action="finish-stage">Завершить этап</button>
              </div>

            </div>
          </article>

          <article class="stage-card is-current" id="stage-soc" data-stage="soc" data-status="progress">
            <button type="button" class="stage-head-clickable" aria-expanded="true" aria-controls="stage-soc-body">
              <div class="stage-num plum" aria-hidden="true">03</div>
              <div class="stage-info">
                <div class="title-row">
                  <span class="title">Социокультурная реабилитация</span>
                  <span class="badge mine">Ваш этап</span>
                  <span class="badge progress">В процессе · 35 %</span>
                </div>
                <div class="sub-row">
                  <span>4 блока · 4 специалиста</span>
                  <span class="sep" aria-hidden="true"></span>
                  <span>ИЗО — заполнено · Театр, Вокал, Общее — ждут</span>
                </div>
              </div>
              <div class="stage-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            <div class="stage-body" id="stage-soc-body">

              <div class="subtabs-wrap" role="tablist" aria-label="Блоки социокультурной диагностики">
                <button type="button" class="subtab active" role="tab" aria-selected="true" data-subtab="izo">
                  <span class="sub-status done" aria-hidden="true"></span>
                  ИЗО
                </button>
                <button type="button" class="subtab" role="tab" aria-selected="false" data-subtab="theatre">
                  <span class="sub-status" aria-hidden="true"></span>
                  Театр
                </button>
                <button type="button" class="subtab" role="tab" aria-selected="false" data-subtab="vocal">
                  <span class="sub-status" aria-hidden="true"></span>
                  Вокал / инструмент
                </button>
              </div>

              <div class="subpanel active" id="subpanel-izo" role="tabpanel" aria-labelledby="subtab-izo">

                <div class="subpanel-head">
                  <div class="sp-icon plum" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor"/><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1 0 1.5-.5 1.5-1.5 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.7-1.7H16c3.3 0 6-2.7 6-6 0-4.9-4.5-8.4-10-8.4z"/></svg>
                  </div>
                  <div>
                    <div class="t">Блок: изобразительное искусство (ИЗО)</div>
                    <div class="s">5 критериев, оценка от 1 до 3 баллов</div>
                  </div>
                  <div class="right">
                    <div class="pp">12 <span class="of">/ 15</span></div>
                    <div class="pl">сумма баллов</div>
                  </div>
                </div>

                <fieldset class="qgroup" style="margin-top: 0;">
                  <legend class="sr-only">Критерии оценки ИЗО</legend>
                  <div class="izo-list">

                    <div class="izo-row">
                      <div class="izo-info">
                        <div class="it">Передача формы</div>
                        <div class="id">3 — передана точно · 2 — незначительно искажена · 1 — не удалась</div>
                      </div>
                      <div class="three-points" role="radiogroup" aria-label="Передача формы">
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-form">
                          <span class="pn">1</span>Не удалась
                        </button>
                        <button type="button" class="point-btn mid" role="radio" aria-checked="false" data-group="izo-form">
                          <span class="pn">2</span>Искажена
                        </button>
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-form">
                          <span class="pn">3</span>Точно
                        </button>
                      </div>
                    </div>

                    <div class="izo-row">
                      <div class="izo-info">
                        <div class="it">Композиция</div>
                        <div class="id">3 — по центру / композиционно верно · 2 — на полосе листа · 1 — не продумана</div>
                      </div>
                      <div class="three-points" role="radiogroup" aria-label="Композиция">
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-comp">
                          <span class="pn">1</span>Случайна
                        </button>
                        <button type="button" class="point-btn mid" role="radio" aria-checked="false" data-group="izo-comp">
                          <span class="pn">2</span>На полосе
                        </button>
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-comp">
                          <span class="pn">3</span>По центру
                        </button>
                      </div>
                    </div>

                    <div class="izo-row">
                      <div class="izo-info">
                        <div class="it">Цветовое решение</div>
                        <div class="id">3 — соответствует реальности · 2 — отступление от реального цвета · 1 — выбор цветов неверен</div>
                      </div>
                      <div class="three-points" role="radiogroup" aria-label="Цветовое решение">
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-color">
                          <span class="pn">1</span>Неверно
                        </button>
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-color">
                          <span class="pn">2</span>Отступления
                        </button>
                        <button type="button" class="point-btn high" role="radio" aria-checked="false" data-group="izo-color">
                          <span class="pn">3</span>Реально
                        </button>
                      </div>
                    </div>

                    <div class="izo-row">
                      <div class="izo-info">
                        <div class="it">Следование инструкции педагога</div>
                        <div class="id">3 — выполняет, реагирует на изменения · 2 — частично · 1 — нежелание / отказ</div>
                      </div>
                      <div class="three-points" role="radiogroup" aria-label="Следование инструкции">
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-instr">
                          <span class="pn">1</span>Отказ
                        </button>
                        <button type="button" class="point-btn mid" role="radio" aria-checked="false" data-group="izo-instr">
                          <span class="pn">2</span>Частично
                        </button>
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-instr">
                          <span class="pn">3</span>Выполняет
                        </button>
                      </div>
                    </div>

                    <div class="izo-row">
                      <div class="izo-info">
                        <div class="it">Самостоятельное выполнение задания</div>
                        <div class="id">3 — без помощи · 2 — незначительная помощь · 1 — постоянный контроль / «рука в руке»</div>
                      </div>
                      <div class="three-points" role="radiogroup" aria-label="Самостоятельность">
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-self">
                          <span class="pn">1</span>«Рука в руке»
                        </button>
                        <button type="button" class="point-btn mid" role="radio" aria-checked="false" data-group="izo-self">
                          <span class="pn">2</span>С подсказкой
                        </button>
                        <button type="button" class="point-btn" role="radio" aria-checked="false" data-group="izo-self">
                          <span class="pn">3</span>Сам
                        </button>
                      </div>
                    </div>

                  </div>
                </fieldset>

                <div class="qgroup">
                  <div class="qlabel"><span class="qlabel-text">Комментарий специалиста по ИЗО</span></div>
                  <textarea class="textarea" placeholder="Что заметили: предпочтения, мотивация, сильные стороны"></textarea>
                </div>

                <div class="subblock-actions">
                  <span class="signed-note" style="color: var(--ink-subtle);" data-role="block-authors" data-profile="izo"></span>
                  <div class="spacer"></div>
                  <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                  <button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>
                </div>

              </div>

              <div class="subpanel" id="subpanel-theatre" role="tabpanel" aria-labelledby="subtab-theatre">

                <div class="subpanel-head">
                  <div class="sp-icon amber" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3v10a3 3 0 006 0V3M3 7l3 14h12l3-14"/></svg>
                  </div>
                  <div>
                    <div class="t">Блок: театр</div>
                    <div class="s">4 критерия, оценка низкий / средний / высокий</div>
                  </div>
                </div>

                <fieldset class="qgroup" style="margin-top: 0;">
                  <legend class="sr-only">Критерии оценки театрального блока</legend>

                  <div class="theatre-row">
                    <div class="tq">Проявление интереса к театральному искусству</div>
                    <div class="tform">Форма диагностики: <strong>беседа</strong></div>
                    <div class="theatre-options" role="radiogroup" aria-label="Интерес к театру">
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-interest">
                        <span class="lvl">Низкий</span>
                        <span class="desc">Нет возможности диагностики из-за отсутствия речи; на вопросы не отвечает; интереса не проявляет</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-interest">
                        <span class="lvl">Средний</span>
                        <span class="desc">Знания фрагментарные; затрудняется назвать различные виды театра</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-interest">
                        <span class="lvl">Высокий</span>
                        <span class="desc">Проявляет интерес, посещает кружки; называет виды театра; характеризует театральные профессии</span>
                      </button>
                    </div>
                  </div>

                  <div class="theatre-row">
                    <div class="tq">Интерпретация сюжета на основе литературного произведения</div>
                    <div class="tform">Форма диагностики: <strong>беседа, прочтение текста и пересказ / ответы на вопросы</strong></div>
                    <div class="theatre-options" role="radiogroup" aria-label="Интерпретация сюжета">
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-plot">
                        <span class="lvl">Низкий</span>
                        <span class="desc">Нет возможности диагностики из-за отсутствия речи; на вопросы не отвечает</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-plot">
                        <span class="lvl">Средний</span>
                        <span class="desc">Понимает содержание произведения; понимает главную идею</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-plot">
                        <span class="lvl">Высокий</span>
                        <span class="desc">Понимает содержание, цитирует; высокая заинтересованность литературой</span>
                      </button>
                    </div>
                  </div>

                  <div class="theatre-row">
                    <div class="tq">Владение знаниями об эмоциональных состояниях</div>
                    <div class="tform">Форма диагностики: <strong>беседа «Герой — добрый или злой»</strong></div>
                    <div class="theatre-options" role="radiogroup" aria-label="Эмоциональные состояния">
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-emo">
                        <span class="lvl">Низкий</span>
                        <span class="desc">Нет возможности диагностики; на вопросы не отвечает; интереса не проявляет</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-emo">
                        <span class="lvl">Средний</span>
                        <span class="desc">Различает эмоции, но затрудняется продемонстрировать мимикой и жестами</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-emo">
                        <span class="lvl">Высокий</span>
                        <span class="desc">Владеет знаниями и демонстрирует мимикой, жестами, позами</span>
                      </button>
                    </div>
                  </div>

                  <div class="theatre-row">
                    <div class="tq">Наличие творческого воображения</div>
                    <div class="tform">Форма диагностики: <strong>сочинить рассказ по картинкам · рассказать, что нарисовал</strong></div>
                    <div class="theatre-options" role="radiogroup" aria-label="Творческое воображение">
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-imag">
                        <span class="lvl">Низкий</span>
                        <span class="desc">Нет возможности диагностики; на вопросы не отвечает</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-imag">
                        <span class="lvl">Средний</span>
                        <span class="desc">Нужна мотивация; привносит в рассказ что-то своё, но об одном персонаже, без образности</span>
                      </button>
                      <button type="button" class="theatre-option" role="radio" aria-checked="false" data-group="th-imag">
                        <span class="lvl">Высокий</span>
                        <span class="desc">Рассказ придуман быстро, без помощи; присутствуют главные герои; сюжет оригинален</span>
                      </button>
                    </div>
                  </div>

                </fieldset>

                <div class="qgroup">
                  <div class="qlabel"><span class="qlabel-text">Комментарий специалиста по театру</span></div>
                  <textarea class="textarea" placeholder="Что заметили на занятии"></textarea>
                </div>

                <div class="subblock-actions">
                  <span class="signed-note" style="color: var(--ink-subtle);" data-role="block-authors" data-profile="theatre"></span>
                  <div class="spacer"></div>
                  <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                  <button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>
                </div>

              </div>

              <div class="subpanel" id="subpanel-vocal" role="tabpanel" aria-labelledby="subtab-vocal">

                <div class="subpanel-head">
                  <div class="sp-icon teal" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <div>
                    <div class="t">Блок: вокально-инструментальный</div>
                    <div class="s">5 шкал по 10 баллов</div>
                  </div>
                  <div class="right">
                    <div class="pp">0 <span class="of">/ 50</span></div>
                    <div class="pl">сумма баллов</div>
                  </div>
                </div>

                <fieldset class="qgroup" style="margin-top: 0;">
                  <legend class="sr-only">Шкалы вокального блока</legend>

                  <div class="scale-row" data-scale="hearing">
                    <div class="scale-head">
                      <div class="scale-name">Музыкальный слух</div>
                      <div class="scale-value"><span class="val">—</span><span class="of"> / 10</span></div>
                    </div>
                    <div class="scale-bar" role="radiogroup" aria-label="Музыкальный слух">
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="0">0</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="1">1</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="2">2</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="3">3</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="4">4</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="5">5</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="6">6</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="7">7</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="8">8</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="9">9</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="10">10</button>
                    </div>
                    <div class="scale-legend">
                      <span>0 · отсутствует речь</span>
                      <span>10 · абсолютный слух</span>
                    </div>
                    <div class="scale-detail" data-detail-hearing></div>
                  </div>

                  <div class="scale-row" data-scale="rhythm">
                    <div class="scale-head">
                      <div class="scale-name">Чувство ритма</div>
                      <div class="scale-value"><span class="val">—</span><span class="of"> / 10</span></div>
                    </div>
                    <div class="scale-bar" role="radiogroup" aria-label="Чувство ритма">
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="0">0</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="1">1</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="2">2</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="3">3</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="4">4</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="5">5</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="6">6</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="7">7</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="8">8</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="9">9</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="10">10</button>
                    </div>
                    <div class="scale-legend">
                      <span>0 · не выполняет</span>
                      <span>10 · идеально, акценты, стабильность</span>
                    </div>
                    <div class="scale-detail" data-detail-rhythm></div>
                  </div>

                  <div class="scale-row" data-scale="diction">
                    <div class="scale-head">
                      <div class="scale-name">Дикция и артикуляция</div>
                      <div class="scale-value"><span class="val">—</span><span class="of"> / 10</span></div>
                    </div>
                    <div class="scale-bar" role="radiogroup" aria-label="Дикция и артикуляция">
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="0">0</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="1">1</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="2">2</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="3">3</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="4">4</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="5">5</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="6">6</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="7">7</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="8">8</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="9">9</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="10">10</button>
                    </div>
                    <div class="scale-legend">
                      <span>0 · речь неразборчива</span>
                      <span>10 · чёткая, образцовая речь</span>
                    </div>
                    <div class="scale-detail" data-detail-diction></div>
                  </div>

                  <div class="scale-row" data-scale="range">
                    <div class="scale-head">
                      <div class="scale-name">Диапазон голоса</div>
                      <div class="scale-value"><span class="val">—</span><span class="of"> / 10</span></div>
                    </div>
                    <div class="scale-bar" role="radiogroup" aria-label="Диапазон голоса">
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="0">0</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="1">1</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="2">2</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="3">3</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="4">4</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="5">5</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="6">6</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="7">7</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="8">8</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="9">9</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="10">10</button>
                    </div>
                    <div class="scale-legend">
                      <span>0 · отсутствует речь</span>
                      <span>10 · 2 октавы и больше</span>
                    </div>
                    <div class="scale-detail" data-detail-range></div>
                  </div>

                  <div class="scale-row" data-scale="memory">
                    <div class="scale-head">
                      <div class="scale-name">Музыкальная память</div>
                      <div class="scale-value"><span class="val">—</span><span class="of"> / 10</span></div>
                    </div>
                    <div class="scale-bar" role="radiogroup" aria-label="Музыкальная память">
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="0">0</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="1">1</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="2">2</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="3">3</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="4">4</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="5">5</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="6">6</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="7">7</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="8">8</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="9">9</button>
                      <button type="button" class="scale-tick" role="radio" aria-checked="false" data-val="10">10</button>
                    </div>
                    <div class="scale-legend">
                      <span>0 · ничего не воспроизвёл</span>
                      <span>10 · всё как в оригинале</span>
                    </div>
                    <div class="scale-detail" data-detail-memory></div>
                  </div>

                </fieldset>

                <div class="qgroup">
                  <div class="qlabel"><span class="qlabel-text">Комментарий специалиста по вокалу / инструменту</span></div>
                  <textarea class="textarea" placeholder="Что заметили на занятии: предпочтения, склонности, отношение к инструменту"></textarea>
                </div>

                <div class="subblock-actions">
                  <span class="signed-note" style="color: var(--ink-subtle);" data-role="block-authors" data-profile="vocal instrument"></span>
                  <div class="spacer"></div>
                  <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                  <button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>
                </div>

              </div>

              <div class="stage-actions">
                <span class="hint-pending" data-role="pending-hint">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Завершите все подразделы
                </span>
                <div class="spacer"></div>
                <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                <button type="button" class="btn btn-primary btn-sm" data-action="finish-stage" disabled title="Сначала завершите все подразделы">Завершить этап</button>
              </div>

            </div>
          </article>

          <article class="stage-card collapsed" id="stage-final" data-stage="final" data-status="empty">
            <button type="button" class="stage-head-clickable" aria-expanded="false" aria-controls="stage-final-body">
              <div class="stage-num teal" aria-hidden="true">04</div>
              <div class="stage-info">
                <div class="title-row">
                  <span class="title">Сводное заключение</span>
                  <span class="badge empty">Ожидает этапов 01–03</span>
                </div>
                <div class="sub-row">
                  <span>Финальное решение о зачислении и формате занятий</span>
                </div>
              </div>
              <div class="stage-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            <div class="stage-body" id="stage-final-body" hidden>

              <div class="specialists-row" style="margin-top: 0; padding-top: 0; border-top: none; margin-bottom: 1.5rem;">
                <div class="specialists-label">Блоки заполнили</div>
                <div class="specialists-list" role="list" data-role="stage-authors"></div>
              </div>

              <fieldset class="qgroup" style="margin-top: 0; padding-top: 0; border-top: none;">
                <legend class="qlabel">
                  <span class="qlabel-text">Решение по итогам диагностики</span>
                </legend>
                <div class="verdict-options" role="radiogroup">
                  <button type="button" class="verdict-option selected yes" role="radio" aria-checked="false">
                    <span class="marker" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>
                    <span class="vtext">
                      <span class="vt">Рекомендованы</span>
                      <span class="vs">Зачислить на программу реабилитации</span>
                    </span>
                  </button>
                  <button type="button" class="verdict-option" role="radio" aria-checked="false">
                    <span class="marker" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>
                    <span class="vtext">
                      <span class="vt">Пробные (2 недели)</span>
                      <span class="vs">Решение по итогам пробного периода</span>
                    </span>
                  </button>
                  <button type="button" class="verdict-option" role="radio" aria-checked="false">
                    <span class="marker" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg></span>
                    <span class="vtext">
                      <span class="vt">Не рекомендованы</span>
                      <span class="vs">С обоснованием ниже</span>
                    </span>
                  </button>
                </div>
              </fieldset>

              <fieldset class="qgroup">
                <legend class="qlabel">
                  <span class="qlabel-text">Комментарий и обоснование</span>
                </legend>
                <textarea class="textarea textarea-lg" placeholder="Особые условия, формат занятий, ограничения, рекомендации для куратора программы"></textarea>
              </fieldset>

              <div class="stage-actions">
                <span class="signed-note" style="color: var(--ink-subtle);">Финальное заключение по диагностике</span>
                <div class="spacer"></div>
                <button type="button" class="btn btn-secondary btn-sm" data-action="save-draft"><span class="btn-label">Сохранить черновик</span></button>
                <button type="button" class="btn btn-primary btn-sm" data-action="finish-stage">Завершить этап</button>
              </div>

            </div>
          </article>

          <section class="peers" id="peers-panel" v-if="isTeacher" aria-labelledby="peers-title">
            <header class="peers-head">
              <div class="peers-head-main">
                <span class="peers-kicker">Этапы диагностики</span>
                <h2 class="peers-title" id="peers-title">Результаты других специалистов</h2>
                <p class="peers-sub">Сначала — общая рекомендация коллеги по итогам его блока. Все параметры раскрываются отдельно, чтобы не мешать вашей работе.</p>
              </div>
              <div class="peers-head-side">
                <span class="peers-live" title="Данные обновляются автоматически"><i class="peers-live-dot" aria-hidden="true"></i>в реальном времени</span>
                <span class="peers-count" data-role="peers-count"></span>
              </div>
            </header>
            <div class="peers-body" data-role="peers-body" aria-live="polite"></div>
          </section>

        </div>

        <aside class="side-nav-wrap" aria-label="Обзор этапов диагностики">
          <div class="side-nav">
            <div class="side-nav-title">Этапы</div>
            <a class="side-nav-item" href="#stage-psy">
              <span class="sni-num">01</span>
              <span class="sni-body">
                <span class="sni-name">Психолог + логопед</span>
                <span class="sni-spec" data-role="stage-specialists-short" data-profile="psy log"></span>
              </span>
              <span class="sni-status progress" aria-label="в процессе"></span>
            </a>
            <a class="side-nav-item" href="#stage-afk">
              <span class="sni-num">02</span>
              <span class="sni-body">
                <span class="sni-name">АФК</span>
                <span class="sni-spec" data-role="stage-specialists-short" data-profile="afk"></span>
              </span>
              <span class="sni-status progress" aria-label="в процессе"></span>
            </a>
            <a class="side-nav-item active" href="#stage-soc">
              <span class="sni-num">03</span>
              <span class="sni-body">
                <span class="sni-name">Соц.-культурная</span>
                <span class="sni-spec" data-role="stage-specialists-short" data-profile="izo theatre vocal instrument"></span>
              </span>
              <span class="sni-status progress" aria-label="в процессе"></span>
            </a>
            <a class="side-nav-item" href="#stage-final">
              <span class="sni-num">04</span>
              <span class="sni-body">
                <span class="sni-name">Заключение</span>
                <span class="sni-spec" data-role="conclusion-author"></span>
              </span>
              <span class="sni-status empty" aria-label="не начат"></span>
            </a>
            <a class="side-nav-item side-nav-item--peers" href="#peers-panel" v-if="isTeacher">
              <span class="sni-num sni-num--icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span class="sni-body">
                <span class="sni-name">Коллеги</span>
                <span class="sni-spec" data-role="peers-nav-note"></span>
              </span>
              <span class="sni-status" data-role="peers-nav-status" aria-hidden="true"></span>
            </a>
          </div>
        </aside>

      </div>

    </div>

    <div class="save-bar" role="region" aria-label="Действия по диагностике" v-show="recipientChosen">
      <div class="save-bar-assign">
        <label for="assignment-target" class="save-bar-assign-label">Сохранить в назначение</label>
        <select id="assignment-target" class="save-bar-assign-select">
          <option value="">— нет назначений —</option>
        </select>
      </div>
      <div class="save-bar-spacer"></div>
      <div class="save-bar-actions">
        <button type="button" class="btn btn-secondary" data-action="save-draft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8"/>
          </svg>
          <span class="btn-label">Сохранить черновик</span>
        </button>
        <button type="button" class="btn btn-secondary" data-action="download-pdf" disabled style="opacity: 0.5; cursor: not-allowed;" aria-disabled="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Скачать PDF
        </button>
        <button type="button" class="btn btn-primary" data-action="finish-diagnostic">
          Завершить диагностику
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="toast" id="toast" role="status" aria-live="polite">
      <span class="toast-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <span class="toast-body" id="toast-body">Этап завершён</span>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../api'
import { fullName } from '../utils/recipient'
import { usePageStore } from '../stores/page'
import { useAuthStore } from '../stores/auth'
import { getBlock as getDiagBlock, SCALE as DIAG_SCALE } from '../utils/diagnosticBlocks'

const pageStore = usePageStore()
const authStore = useAuthStore()

const isTeacher = computed(() => authStore.isTeacher)
const isEmployee = computed(() => authStore.isEmployee)
let employeeReadonlyGuards = null
let peersPoller = null
let peersClickHandler = null
let peersVisibilityHandler = null
const teacherProfileKey = ref('')

const recipientChosen = ref(false)
const teacherAssignedCount = ref(0)

const gateHasButton = computed(() =>
  authStore.isTeacher ? teacherAssignedCount.value > 0 : true
)
const gateTitle = computed(() => {
  if (authStore.isTeacher && teacherAssignedCount.value === 0) {
    return 'Нет отмеченных реабилитантов'
  }
  return 'Выберите реабилитанта'
})
const gateText = computed(() => {
  if (authStore.isTeacher) {
    return teacherAssignedCount.value === 0
      ? 'Отметьте «Присутствует» на вкладке «Реабилитанты» — и направленный на диагностику реабилитант появится здесь.'
      : 'Выберите реабилитанта, чтобы открыть карточку диагностики или начать промежуточную.'
  }
  return 'Чтобы открыть карточку диагностики, сначала выберите реабилитанта из списка.'
})
function openRecipientPicker() {
  if (typeof window.__openRecipientPicker === 'function') window.__openRecipientPicker()
}

const diagMode = ref('card')

const KIND_LABELS = { primary: 'Первичная', interim: 'Промежуточная', final: 'Итоговая' }
const STATUS_LABELS = { open: 'ожидает', in_progress: 'идёт', completed: 'завершена', cancelled: 'отменена' }
const OBSERVATION_KINDS = ['interim', 'final']

const sessionList = ref([])
const selectedSessionId = ref(null)
const sessionBusy = ref(false)
const startKind = ref('interim')
const switchNote = ref('')

function ruDateShort(value) {
  const m = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : ''
}

const sessionTabs = computed(() =>
  sessionList.value
    .filter((s) => s.status !== 'cancelled')
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || Number(a.id) - Number(b.id))
    .map((s, i, all) => {
      const kind = s.kind || 'primary'
      const sameKind = all.filter((x) => (x.kind || 'primary') === kind)
      return {
        id: s.id,
        kindLabel: KIND_LABELS[kind] || KIND_LABELS.primary,
        ordinal: sameKind.length > 1 ? sameKind.findIndex((x) => x.id === s.id) + 1 : 0,
        num: String(i + 1).padStart(2, '0'),
        dateLabel: ruDateShort(s.date),
        stateLabel: STATUS_LABELS[s.status] || s.status,
        progress: s.total ? `${s.completed || 0} из ${s.total}` : '',
        done: s.status === 'completed',
        live: s.status === 'in_progress'
      }
    })
)

const selectedSession = computed(
  () => sessionList.value.find((s) => s.id === selectedSessionId.value) || null
)

const historyMode = computed(() => selectedSession.value?.status === 'completed')

const readonlyView = computed(() => isEmployee.value || historyMode.value)

const heroEyebrow = computed(() => {
  const s = selectedSession.value
  if (!s) return 'Первичная диагностика · 4 этапа'
  const label = KIND_LABELS[s.kind] || KIND_LABELS.primary
  const date = ruDateShort(s.date)
  return `${label} диагностика` + (date ? ` · ${date}` : '') +
         (s.status === 'completed' ? ' · только просмотр' : '')
})

const canJoinSelected = computed(() => {
  const s = selectedSession.value
  if (!isTeacher.value || !s) return false
  if (!OBSERVATION_KINDS.includes(s.kind)) return false
  if (s.status !== 'open' && s.status !== 'in_progress') return false
  return !(s.blocks || []).some((b) => b.isMine)
})

async function selectSession(id) {
  if (id === selectedSessionId.value) return
  selectedSessionId.value = id
  switchNote.value = ''
  if (typeof window.__reloadDiagnosticSession === 'function') {
    await window.__reloadDiagnosticSession()
  }
}

async function startObservation() {
  const recipientId = window.__diagnosticsRuntime?.currentRecipient?.id
  if (!recipientId) {
    switchNote.value = 'Сначала выберите реабилитанта.'
    return
  }
  sessionBusy.value = true
  switchNote.value = ''
  try {
    const { data } = await api.post('/schedule/sessions/observation', {
      recipientId,
      kind: startKind.value
    })
    selectedSessionId.value = data?.id ?? null
    if (typeof window.__reloadDiagnosticSession === 'function') {
      await window.__reloadDiagnosticSession()
    }
    switchNote.value = `${KIND_LABELS[startKind.value]} диагностика начата — блок открыт для заполнения.`
  } catch (err) {
    switchNote.value = err?.response?.data?.message || 'Не удалось начать диагностику.'
  } finally {
    sessionBusy.value = false
  }
}

async function joinSelectedSession() {
  const id = selectedSessionId.value
  if (!id) return
  sessionBusy.value = true
  switchNote.value = ''
  try {
    await api.post(`/schedule/sessions/${id}/join`)
    if (typeof window.__reloadDiagnosticSession === 'function') {
      await window.__reloadDiagnosticSession()
    }
    switchNote.value = 'Вы присоединились к диагностике — ваш блок открыт для заполнения.'
  } catch (err) {
    switchNote.value = err?.response?.data?.message || 'Не удалось присоединиться к диагностике.'
  } finally {
    sessionBusy.value = false
  }
}

function handleMobileStageChange(event) {
  const value = event?.target?.value
  if (value) document.querySelector(value)?.scrollIntoView({ behavior: 'smooth' })
}

async function lockTeacherProfile() {
  try {
    const directionId = authStore.user?.directionId
    if (!directionId) return 
    const { data } = await api.get('/lists/directions')
    const dir = Array.isArray(data) ? data.find((d) => d.id === directionId) : null
    const key = dir?.profileKey || ''
    if (!key) return
    teacherProfileKey.value = key
    window.__forcedProfileKey = key
    const apply = () => {
      if (typeof window.__applyProfileRestriction === 'function') {
        window.__applyProfileRestriction(key)
      } else {
        setTimeout(apply, 50)
      }
    }
    apply()
  } catch (err) {
    console.warn('Не удалось ограничить диагностику областью преподавателя', err)
  }
}

onMounted(() => {
  document.title = 'ERP-Р • Диагностика'

  window.__forcedProfileKey = '';

  if (authStore.isTeacher) {
    lockTeacherProfile();
  }

  {
    const isCardEditable = (el) => {
      if (!el || !el.closest) return false;
      if (!el.closest('.content')) return false;
      if (el.closest('.diag-switch')) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    };
    const NAV_KEYS = ['Tab', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'];
    const swallow = (e) => {
      if (!readonlyView.value) return;
      if (diagMode.value !== 'card') return;
      if (!isCardEditable(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    const swallowKey = (e) => {
      if (!readonlyView.value) return;
      if (diagMode.value !== 'card') return;
      const el = e.target;
      if (!isCardEditable(el)) return;
      const tag = el.tagName;
      if (tag === 'SELECT' || (tag === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio'))) {
        if (e.key !== 'Tab' && e.key !== 'Escape') { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      if (!NAV_KEYS.includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
    };
    employeeReadonlyGuards = [
      ['beforeinput', swallow],
      ['paste', swallow],
      ['drop', swallow],
      ['keydown', swallowKey]
    ];
    employeeReadonlyGuards.forEach(([evt, fn]) => document.addEventListener(evt, fn, true));
  }

    document.documentElement.style.setProperty('--bg-app', '#F7F4ED');
    document.documentElement.style.setProperty('--fab-offset', '4.75rem');

    const FALLBACK_RECIPIENTS = [
      { id: 184, fullName: 'Мария Петрова', birthDateLabel: '14 мая 2014', age: 11, diagnosis: 'РАС', groupName: 'Средние', code: 'R-000184' },
      { id: 185, fullName: 'Иван Смирнов', birthDateLabel: '03 апреля 2013', age: 12, diagnosis: 'ДЦП', groupName: 'АФК', code: 'R-000185' },
      { id: 186, fullName: 'Анна Соколова', birthDateLabel: '22 ноября 2015', age: 9, diagnosis: 'ЗПР', groupName: 'Младшие', code: 'R-000186' },
      { id: 187, fullName: 'Даниил Кузнецов', birthDateLabel: '08 сентября 2012', age: 12, diagnosis: 'ТНР', groupName: 'Средние', code: 'R-000187' },
      { id: 188, fullName: 'Екатерина Орлова', birthDateLabel: '19 января 2014', age: 11, diagnosis: 'РАС', groupName: 'Старшие', code: 'R-000188' }
    ];

    const diagnosticsRuntime = {
      recipients: [...FALLBACK_RECIPIENTS],
      currentRecipient: FALLBACK_RECIPIENTS[0],
      completed: false,
      lastReportData: null,
      assignments: [],
      blocks: [],
      sessionId: null,
      conclusion: null,
      conclusionBlockers: []
    };
    window.__diagnosticsRuntime = diagnosticsRuntime;

    function normalizeSpaces(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function declAge(age) {
      const n = Number(age);
      if (!Number.isFinite(n) || n <= 0) return '';
      const mod10 = n % 10;
      const mod100 = n % 100;
      if (mod10 === 1 && mod100 !== 11) return n + ' год';
      if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return n + ' года';
      return n + ' лет';
    }

    function initialsFromName(fullName) {
      const parts = normalizeSpaces(fullName).split(' ').filter(Boolean);
      if (!parts.length) return 'Р';
      const first = parts[0]?.[0] || '';
      const second = parts[1]?.[0] || '';
      return (first + second).toUpperCase() || 'Р';
    }

    function formatDateRu(value) {
      if (!value) return '';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    function nameFromParts(obj) {
      if (!obj) return '';
      return normalizeSpaces([obj.lastName, obj.firstName, obj.middleName].filter(Boolean).join(' '));
    }

    function ageFromBirthDate(birth) {
      if (!birth) return '';
      const b = new Date(birth);
      if (Number.isNaN(b.getTime())) return '';
      const now = new Date();
      let age = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
      return age >= 0 ? age : '';
    }

    function normalizeRecipient(raw, idx = 0) {

      const fullName = normalizeSpaces(raw.fullName || raw.name || raw.fio || raw.title || nameFromParts(raw) || 'Реабилитант');
      const id = raw.id ?? raw.recipientId ?? (idx + 1);
      const birthDate = raw.birthDate || raw.birthDateLabel || raw.dateOfBirth || raw.birthday || '';
      const age = raw.age ?? raw.years ?? ageFromBirthDate(birthDate) ?? '';
      const diagnosis = normalizeSpaces(raw.diagnosis || raw.nosology || raw.program || 'Нозология не указана');
      const groupName = normalizeSpaces(raw.groupName || raw.group?.groupName || raw.group?.name || raw.cgr || raw.category || 'Группа не указана');
      const code = raw.code || raw.number || ('R-' + String(id).padStart(6, '0'));
      const representative = raw.representative ? nameFromParts(raw.representative) : (raw.legalRepresentative || '');
      return {
        id,
        fullName,
        initials: initialsFromName(fullName),
        age,
        birthDateLabel: birthDate ? formatDateRu(birthDate) : '',
        diagnosis,
        groupName,
        code,
        legalRepresentative: representative,
        contacts: raw.telephone || raw.representative?.telephone || raw.contacts || ''
      };
    }

    function recipientAgeLine(recipient) {
      const ageText = declAge(recipient.age);
      const dob = recipient.birthDateLabel ? recipient.birthDateLabel : '';
      if (ageText && dob) return ageText + ' · ' + dob;
      return ageText || dob || 'возраст не указан';
    }

    function updateRecipientUI(recipient, opts = {}) {
      diagnosticsRuntime.currentRecipient = normalizeRecipient(recipient);
      const current = diagnosticsRuntime.currentRecipient;
      const page = document.querySelector('.diagnostics-page');
      if (page) page.dataset.recipientId = String(current.id);

      const nameEl = document.getElementById('hero-name');
      if (nameEl) nameEl.textContent = current.fullName;
      document.querySelectorAll('.hero-avatar').forEach(el => { el.textContent = current.initials; });

      const meta = document.querySelector('.hero-meta');
      if (meta) {
        const fields = [
          current.code,
          recipientAgeLine(current),
          current.diagnosis,
          'ЦРГ: ' + current.groupName
        ];
        meta.innerHTML = fields.map((value, index) => {
          const safe = escapeHtml(value || '—');
          if (index === 0) return '<span>' + safe + '</span>';
          return '<span class="sep-dot" aria-hidden="true"></span><span>' + safe + '</span>';
        }).join('');
      }

      document.querySelectorAll('.breadcrumb a').forEach(a => {
        if (a.textContent.includes('Мария') || a.dataset.recipientCrumb === '1') {
          a.dataset.recipientCrumb = '1';
          a.textContent = current.fullName;
        }
      });

      document.title = 'ERP-Р • Диагностика — ' + current.fullName;
      try { localStorage.setItem('diagnostics.selectedRecipient', JSON.stringify(current)); } catch (_) {}
      if (!opts.silent && typeof showToast === 'function') showToast('Выбран реабилитант: <strong>' + escapeHtml(current.fullName) + '</strong>');
      selectedSessionId.value = null;
      sessionList.value = [];
      switchNote.value = '';
      loadAssignmentsForRecipient();
      hydrateResultsForRecipient();
    }

    function pickCurrentSession(sessions) {
      const live = (Array.isArray(sessions) ? sessions : []).filter((s) => s.status !== 'cancelled');
      if (!live.length) return null;
      return live.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a));
    }

    function adoptSessions(payload) {
      const list = Array.isArray(payload) ? payload : [];
      sessionList.value = list;
      const target = list.find((s) => s.id === selectedSessionId.value) || pickCurrentSession(list);
      selectedSessionId.value = target?.id ?? null;
      return target;
    }

    window.__reloadDiagnosticSession = async () => {
      await loadAssignmentsForRecipient();
      await hydrateResultsForRecipient();
    };

    async function hydrateResultsForRecipient() {
      if (typeof window.__resetFormState === 'function') {
        window.__resetFormState(document.querySelector('.diagnostics-page .content'));
      }
      if (typeof window.__clearCompletionMarks === 'function') window.__clearCompletionMarks();
      diagnosticsRuntime.blocks = [];
      if (typeof window.__renderBlockAuthors === 'function') window.__renderBlockAuthors();
      if (typeof window.__renderPeers === 'function') window.__renderPeers();

      const recipientId = diagnosticsRuntime.currentRecipient?.id;
      if (!recipientId) return;
      if (typeof window.__applyFormState !== 'function') return;
      try {
        const { data } = await api.get('/schedule/sessions', { params: { recipientId } });
        const target = adoptSessions(data);
        const blocks = target ? (target.blocks || []) : [];
        diagnosticsRuntime.blocks = blocks;
        blocks
          .filter(b => b.blockStatus === 'completed' && b.results && b.results.formState)
          .forEach(b => window.__applyFormState(b.results.formState));

        diagnosticsRuntime.sessionId = target?.id ?? null;
        diagnosticsRuntime.conclusion = target?.conclusion || null;
        diagnosticsRuntime.conclusionBlockers = Array.isArray(target?.missingStages)
          ? target.missingStages
          : [];
        if (typeof window.__applyConclusion === 'function') {
          window.__applyConclusion(diagnosticsRuntime.conclusion);
        }
        if (typeof window.__applyCompletedBlocks === 'function') window.__applyCompletedBlocks(blocks);
        if (typeof window.__updateConclusionGate === 'function') window.__updateConclusionGate();
        if (typeof window.__renderBlockAuthors === 'function') window.__renderBlockAuthors();
        if (typeof window.__renderPeers === 'function') window.__renderPeers();
      } catch (err) {
        console.warn('Не удалось загрузить сохранённые результаты диагностики', err);
      }
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function getSavedRecipientId() {
      try {
        const saved = JSON.parse(localStorage.getItem('diagnostics.selectedRecipient') || 'null');
        return saved?.id ?? null;
      } catch (_) {
        return null;
      }
    }

    async function loadRecipientsFromProject() {
      try {
        const response = await api.get('/recipients', { params: { limit: 300 } });
        const payload = response?.data;
        const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        if (rows.length) {
          diagnosticsRuntime.recipients = rows.map((row, idx) => normalizeRecipient(row, idx));
        } else {
          diagnosticsRuntime.recipients = FALLBACK_RECIPIENTS.map((row, idx) => normalizeRecipient(row, idx));
        }
        renderRecipientList();
      } catch (err) {

        console.warn('Не удалось загрузить реабилитантов из проекта, используется локальный список', err);
      }
    }

    async function loadTeacherAssignedRecipients() {
      const specialistId = authStore.user?.id;
      if (!specialistId) {
        diagnosticsRuntime.recipients = [];
        teacherAssignedCount.value = 0;
        renderRecipientList();
        return;
      }
      try {
        const [sessionsRes, caseloadRes] = await Promise.all([
          api.get('/schedule/sessions'),
          api.get('/recipients', { params: { limit: 300 } }).catch(() => null)
        ]);
        const sessions = Array.isArray(sessionsRes?.data) ? sessionsRes.data : [];
        const byId = new Map();
        const observationIds = new Set();
        for (const s of sessions) {
          if (s.status === 'cancelled' || s.status === 'completed') continue;
          const mine = (s.blocks || []).some((b) => b.isMine);
          if (!mine && !s.observation) continue;
          const rec = s.recipient;
          if (!rec || rec.id == null) continue;
          if (!byId.has(rec.id)) byId.set(rec.id, rec);
          if (s.observation) observationIds.add(rec.id);
        }
        const ids = [...byId.keys()];
        const full = await Promise.all(ids.map(async (id) => {
          try { return (await api.get('/recipients/' + id)).data; }
          catch { return byId.get(id); }
        }));
        const d = new Date();
        const todayLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const merged = new Map();
        for (const row of full) {
          if (!row || row.id == null) continue;
          const present = row.attendanceStatus === 'present' && String(row.attendanceDate) === todayLocal;
          if (present || observationIds.has(row.id)) merged.set(row.id, row);
        }
        const payload = caseloadRes?.data;
        const caseload = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
        for (const row of caseload) {
          if (row && row.id != null && !merged.has(row.id)) merged.set(row.id, row);
        }
        diagnosticsRuntime.recipients = [...merged.values()].map((row, idx) => normalizeRecipient(row, idx));
        teacherAssignedCount.value = diagnosticsRuntime.recipients.length;
        renderRecipientList();
      } catch (err) {
        console.warn('Не удалось загрузить направленных на диагностику', err);
        diagnosticsRuntime.recipients = [];
        teacherAssignedCount.value = 0;
        renderRecipientList();
      }
    }

    function assignmentLabel(a) {
      const dir = a?.direction?.name || 'Направление не указано';
      const spec = a?.specialistName || a?.specialist?.fullName || 'специалист не указан';
      const date = a?.date ? formatDateRu(a.date) : '';
      const done = a?.blockStatus === 'completed' ? 'этап завершён' : '';
      return [dir, spec, date, done].filter(Boolean).join(' · ');
    }

    async function loadAssignmentsForRecipient() {
      const select = document.getElementById('assignment-target');
      if (!select) return;
      const recipientId = diagnosticsRuntime.currentRecipient?.id;
      const prev = select.value;
      diagnosticsRuntime.assignments = [];
      if (!recipientId) {
        select.innerHTML = '<option value="">— нет назначений —</option>';
        if (typeof window.__applyAssignmentProfile === 'function') window.__applyAssignmentProfile();
        return;
      }
      try {
        const response = await api.get('/schedule/sessions', { params: { recipientId } });
        const target = adoptSessions(response?.data);
        const isTeacher = authStore.isTeacher;
        let pending = [];
        for (const b of (target?.blocks || [])) {
          if (isTeacher && !b.isMine) continue;
          pending.push(b);
        }
        if (window.__forcedProfileKey) {
          pending = pending.filter(b => !b.profileKey || b.profileKey === window.__forcedProfileKey);
        }
        diagnosticsRuntime.assignments = pending;
        if (!pending.length) {
          select.innerHTML = '<option value="">— нет ожидающих назначений —</option>';
          if (typeof window.__applyAssignmentProfile === 'function') window.__applyAssignmentProfile();
          return;
        }
        const opts = ['<option value="">— выберите назначение —</option>'];
        pending.forEach(a => {
          opts.push('<option value="' + a.id + '">' + escapeHtml(assignmentLabel(a)) + '</option>');
        });
        select.innerHTML = opts.join('');
        if (prev && pending.some(a => String(a.id) === String(prev))) select.value = prev;
        else if (pending.length === 1) select.value = String(pending[0].id);
        if (typeof window.__applyAssignmentProfile === 'function') window.__applyAssignmentProfile();
      } catch (err) {
        console.warn('Не удалось загрузить назначения реабилитанта', err);
        select.innerHTML = '<option value="">— ошибка загрузки назначений —</option>';
        if (typeof window.__applyAssignmentProfile === 'function') window.__applyAssignmentProfile();
      }
    }

    const BLOCK_BY_PROFILE = {
      psy:     { stage: 'psy', sub: 'psy' },
      log:     { stage: 'psy', sub: 'log' },
      izo:     { stage: 'soc', sub: 'izo' },
      theatre: { stage: 'soc', sub: 'theatre' },
      vocal:   { stage: 'soc', sub: 'vocal' },
      afk:     { stage: 'afk', sub: null }
    };
    const blockPlace = (b) => BLOCK_BY_PROFILE[b?.profileKey || b?.direction?.profileKey || ''] || null;

    function ownBlocksAt(stageKey, subKey) {
      const sid = diagnosticsRuntime.sessionId;
      return (diagnosticsRuntime.assignments || []).filter((a) => {
        const place = blockPlace(a);
        if (!place || place.stage !== stageKey) return false;
        if (subKey && place.sub !== subKey) return false;
        if (a.isMine !== true) return false;
        return sid != null && String(a.diagnosticSessionId) === String(sid);
      });
    }

    function stageIsDone(stageKey) {
      const inStage = (diagnosticsRuntime.blocks || []).filter((b) => blockPlace(b)?.stage === stageKey);
      return inStage.length > 0 && inStage.every((b) => b.blockStatus === 'completed');
    }

    async function persistStageBlocks(stageKey, subKey, btn) {
      if (!diagnosticsRuntime.currentRecipient?.id) {
        showToast('Сначала выберите реабилитанта.', 4200);
        return { ok: false, stageDone: false };
      }
      if (!diagnosticsRuntime.sessionId) {
        showToast('Не удалось определить заявку на диагностику — выберите реабилитанта заново.', 5200);
        return { ok: false, stageDone: false };
      }
      const mine = ownBlocksAt(stageKey, subKey);
      if (!mine.length) {
        showToast(authStore.isTeacher
          ? 'У вас нет назначения на этот блок у выбранного реабилитанта — сдавать нечего.'
          : 'Блок закрывает специалист, который его вёл: из карточки отметить за него нельзя.', 5600);
        return { ok: false, stageDone: false };
      }

      const wasDisabled = btn ? btn.disabled : false;
      if (btn) btn.disabled = true;
      try {
        for (const a of mine) {
          const profileKey = a.profileKey || a.direction?.profileKey || '';
          if (!profileKey) {
            showToast('У назначения не указана область специалиста — обратитесь к администратору.', 5600);
            return { ok: false, stageDone: false };
          }
          const formState = typeof window.__snapshotFormState === 'function'
            ? window.__snapshotFormState(profileKey)
            : null;
          const reportData = typeof window.__collectReportData === 'function'
            ? window.__collectReportData()
            : {};
          const results = Object.assign({}, reportData, formState ? { formState } : {});
          await api.post('/schedule/assignments/' + a.id + '/complete', { results });
        }
      } catch (err) {
        console.error('Не удалось сдать блок диагностики', err);
        showToast(err?.response?.data?.message || 'Не удалось сохранить блок в БД. Попробуйте ещё раз.', 5200);
        return { ok: false, stageDone: false };
      } finally {
        if (btn && btn.isConnected) btn.disabled = wasDisabled;
      }

      await loadAssignmentsForRecipient();
      await hydrateResultsForRecipient();
      return { ok: true, stageDone: stageIsDone(stageKey) };
    }
    window.__persistStageBlocks = persistStageBlocks;

    async function persistResultToAssignment() {
      const select = document.getElementById('assignment-target');
      const assignmentId = select && select.value ? Number(select.value) : null;
      if (!assignmentId) {
        showToast('Результат не сохранён в БД: не выбрано назначение. Выберите назначение в нижней панели и завершите диагностику снова.', 5600);
        return false;
      }
      try {
        const assignment = (diagnosticsRuntime.assignments || []).find(a => String(a.id) === String(assignmentId));
        const profileKey = assignment?.profileKey || assignment?.direction?.profileKey || '';
        if (!profileKey) {
          showToast('Не удалось определить область специалиста у выбранного назначения — результат не сохранён.', 5600);
          return false;
        }
        const reportData = diagnosticsRuntime.lastReportData
          || (typeof window.__collectReportData === 'function' ? window.__collectReportData() : {});
        const formState = typeof window.__snapshotFormState === 'function'
          ? window.__snapshotFormState(profileKey)
          : null;
        const results = Object.assign({}, reportData, formState ? { formState } : {});
        await api.post('/schedule/assignments/' + assignmentId + '/complete', { results });
        showToast('Результаты сохранены в карточке реабилитанта. <strong>Этап диагностики завершён.</strong>', 4600);
        await loadAssignmentsForRecipient();
        return true;
      } catch (err) {
        console.error('Не удалось сохранить результат диагностики', err);
        showToast('Не удалось сохранить результат в БД. Попробуйте ещё раз.', 5200);
        return false;
      }
    }

    function ensureRecipientModal() {
      let modal = document.getElementById('recipient-modal');
      if (modal) return modal;
      const host = document.querySelector('.diagnostics-page') || document.body;
      modal = document.createElement('div');
      modal.id = 'recipient-modal';
      modal.className = 'modal-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'recipient-modal-title');
      modal.hidden = true;
      modal.innerHTML = `
        <div class="modal" role="document">
          <header class="modal-head">
            <div class="mh-body">
              <div class="mh-title" id="recipient-modal-title">Выбрать реабилитанта</div>
            </div>
            <button type="button" class="modal-close" data-recipient-close aria-label="Закрыть">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </header>
          <div class="modal-search">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <label class="sr-only" for="recipient-search-input">Поиск реабилитанта</label>
            <input id="recipient-search-input" type="text" placeholder="Поиск по ФИО, диагнозу или группе…" autocomplete="off" />
          </div>
          <div class="modal-list" id="recipient-list" role="listbox" aria-label="Реабилитанты"></div>
          <footer class="modal-foot">
            <div class="modal-foot-spacer"></div>
            <button type="button" class="btn btn-secondary btn-sm" data-recipient-close>Закрыть</button>
          </footer>
        </div>`;
      host.appendChild(modal);
      return modal;
    }

    function renderRecipientList() {
      const list = document.getElementById('recipient-list');
      const input = document.getElementById('recipient-search-input');
      if (!list) return;
      const query = normalizeSpaces(input?.value || '').toLowerCase();
      const items = diagnosticsRuntime.recipients.filter(r => {
        const haystack = [r.fullName, r.diagnosis, r.groupName, r.code].join(' ').toLowerCase();
        return !query || haystack.includes(query);
      });
      list.innerHTML = '';
      if (!items.length) {
        list.innerHTML = '<div class="staff-empty">Реабилитанты не найдены</div>';
        return;
      }
      items.forEach(r => {
        const selected = String(r.id) === String(diagnosticsRuntime.currentRecipient.id);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'staff-item ' + (selected ? 'selected' : '');
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', String(selected));
        btn.dataset.recipientId = String(r.id);
        btn.innerHTML = `
          <span class="staff-av" aria-hidden="true">${escapeHtml(r.initials)}</span>
          <span class="staff-body">
            <span class="staff-name">${escapeHtml(r.fullName)}</span>
            <span class="staff-role">${escapeHtml(r.code)} · ${escapeHtml(recipientAgeLine(r))} · ${escapeHtml(r.diagnosis)} · ${escapeHtml(r.groupName)}</span>
          </span>
          <span class="staff-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
          </span>`;
        btn.addEventListener('click', () => {
          updateRecipientUI(r);
          recipientChosen.value = true; 
          window.setDiagnosticCompleted?.(false);
          closeRecipientModal();
        });
        list.appendChild(btn);
      });
    }

    function openRecipientModal() {
      const modal = ensureRecipientModal();
      renderRecipientList();
      modal.classList.add('open');
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      const input = document.getElementById('recipient-search-input');
      if (input) setTimeout(() => input.focus(), 60);
    }

    function closeRecipientModal() {
      const modal = document.getElementById('recipient-modal');
      if (!modal) return;
      modal.classList.remove('open');
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    (function initRecipientSwitcher() {
      ensureRecipientModal();
      updateRecipientUI({ id: '', fullName: '—', diagnosis: '', groupName: '', code: '', age: '' }, { silent: true });
      window.__openRecipientPicker = openRecipientModal;
      if (authStore.isTeacher) {
        loadTeacherAssignedRecipients();
      } else {
        loadRecipientsFromProject();
      }

      const nameEl = document.getElementById('hero-name');
      if (nameEl) {
        nameEl.classList.add('is-changeable');
        nameEl.addEventListener('dblclick', openRecipientModal);
        nameEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') openRecipientModal();
        });
      }

      const switchBtn = document.getElementById('recipient-switch-btn');
      if (switchBtn) switchBtn.addEventListener('click', openRecipientModal);

      const modal = document.getElementById('recipient-modal');
      modal?.querySelectorAll('[data-recipient-close]').forEach(btn => btn.addEventListener('click', closeRecipientModal));
      modal?.addEventListener('click', (e) => { if (e.target === modal) closeRecipientModal(); });
      document.getElementById('recipient-search-input')?.addEventListener('input', renderRecipientList);
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('recipient-modal')?.classList.contains('open')) closeRecipientModal();
      });
    })();

    document.querySelectorAll('.stage-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const id = '#stage-' + tile.dataset.stage;
        const card = document.querySelector(id);
        if (!card) return;
        if (card.classList.contains('collapsed')) {
          card.classList.remove('collapsed');
          const head = card.querySelector('.stage-head-clickable');
          head.setAttribute('aria-expanded', 'true');
          card.querySelector('.stage-body').removeAttribute('hidden');
        }
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    document.querySelectorAll('.stage-head-clickable').forEach(head => {
      head.addEventListener('click', () => {
        const card = head.closest('.stage-card');
        const body = card.querySelector('.stage-body');
        const collapsed = card.classList.toggle('collapsed');
        head.setAttribute('aria-expanded', String(!collapsed));
        if (collapsed) body.setAttribute('hidden', '');
        else body.removeAttribute('hidden');
      });
    });

    document.querySelectorAll('.side-nav-item').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href');
        const card = document.querySelector(id);
        if (!card) return;
        if (card.classList.contains('collapsed')) {
          card.classList.remove('collapsed');
          const head = card.querySelector('.stage-head-clickable');
          head.setAttribute('aria-expanded', 'true');
          card.querySelector('.stage-body').removeAttribute('hidden');
        }
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('.side-nav-item').forEach(x => x.classList.remove('active'));
        a.classList.add('active');
      });
    });

    document.querySelectorAll('.subtab').forEach(tab => {
      tab.addEventListener('click', () => {
        const stage = tab.closest('.stage-card');
        const target = tab.dataset.subtab;
        stage.querySelectorAll('.subtab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
        stage.querySelectorAll('.subpanel').forEach(p => p.classList.remove('active'));
        stage.querySelector('#subpanel-' + target).classList.add('active');
      });
    });

    document.querySelectorAll('.chip input[type="checkbox"]').forEach(input => {
      const chip = input.closest('.chip');
      if (chip && chip.classList.contains('selected')) input.checked = true;
      chip && chip.classList.toggle('selected', input.checked);
      input.addEventListener('change', () => {
        input.closest('.chip').classList.toggle('selected', input.checked);
      });
    });
    document.querySelectorAll('.chip input[type="radio"]').forEach(input => {
      const chip = input.closest('.chip');
      if (chip && chip.classList.contains('selected')) input.checked = true;
      chip && chip.classList.toggle('selected', input.checked);
      input.addEventListener('change', () => {
        document.querySelectorAll(`.chip input[name="${input.name}"]`).forEach(other => {
          other.closest('.chip').classList.toggle('selected', other.checked);
        });
      });
    });

    document.querySelectorAll('.segmented').forEach(group => {
      const buttons = group.querySelectorAll('.seg-btn');
      const scheme = group.dataset.scheme;
      const palettes = {
        'rating':       { 2: ['sage','rose'], 3: ['sage','amber','rose'], 4: ['sage','sage','amber','rose'] },
        'rating-asc':   { 2: ['rose','sage'], 3: ['rose','amber','sage'] },
        'tonus':        { 3: ['amber','sage','amber'] }
      };
      buttons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => { b.classList.remove('active','sage','amber','rose'); b.setAttribute('aria-checked','false'); });
          btn.classList.add('active');
          let color = 'sage';
          const palette = palettes[scheme];
          if (palette && palette[buttons.length]) color = palette[buttons.length][idx];
          btn.classList.add(color);
          btn.setAttribute('aria-checked','true');
        });
      });
    });

    document.querySelectorAll('.triple-control').forEach(group => {
      const buttons = group.querySelectorAll('.triple-btn');
      const colorTokens = ['yes','partial','no'];
      const fallback = ['yes','partial','no'];

      const colors = Array.from(buttons).map((btn, idx) => {
        for (const t of colorTokens) {
          if (btn.classList.contains(t)) return t;
        }
        return fallback[idx] || 'no';
      });

      buttons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => {
            b.classList.remove('active', ...colorTokens);
            b.setAttribute('aria-checked', 'false');
          });
          btn.classList.add('active', colors[idx]);
          btn.setAttribute('aria-checked', 'true');
        });
      });
    });

    function radioCards(selector, colorMap) {
      const groups = {};
      document.querySelectorAll(selector).forEach(card => {
        const key = card.dataset.group;
        if (!groups[key]) groups[key] = [];
        groups[key].push(card);
      });
      Object.keys(groups).forEach(key => {
        const cards = groups[key];
        cards.forEach((card, idx) => {
          card.addEventListener('click', () => {
            cards.forEach(c => {
              c.classList.remove('selected');
              if (colorMap) colorMap.forEach(cls => c.classList.remove(cls));
              c.setAttribute('aria-checked','false');
            });
            card.classList.add('selected');
            if (colorMap && colorMap[idx]) card.classList.add(colorMap[idx]);
            card.setAttribute('aria-checked','true');
          });
        });
      });
    }

    (function() {
      document.querySelectorAll('.gmfcs-grid').forEach(grid => {
        const cards = grid.querySelectorAll('.gmfcs-card');
        const noneCard = grid.querySelector('.gmfcs-card.none');
        const applyDisabled = () => {
          const sel = grid.querySelector('.gmfcs-card.selected');
          grid.classList.toggle('is-disabled', !!(sel && sel.classList.contains('none')));
        };
        cards.forEach(card => {
          card.addEventListener('click', () => {
            cards.forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
            card.classList.add('selected');
            card.setAttribute('aria-checked', 'true');
            applyDisabled();
          });
        });
        applyDisabled();
      });
    })();
    radioCards('.level-card', [null, null, null]);

    document.querySelectorAll('.theatre-row').forEach(row => {
      const opts = row.querySelectorAll('.theatre-option');
      opts.forEach((opt, idx) => {
        opt.addEventListener('click', () => {
          opts.forEach(o => o.classList.remove('selected','low','mid','high'));
          opt.classList.add('selected', idx === 0 ? 'low' : idx === 1 ? 'mid' : 'high');
          opts.forEach(o => o.setAttribute('aria-checked','false'));
          opt.setAttribute('aria-checked','true');
        });
      });
    });

    document.querySelectorAll('.three-points').forEach(group => {
      const buttons = group.querySelectorAll('.point-btn');
      buttons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => { b.classList.remove('active','low','mid','high'); b.setAttribute('aria-checked','false'); });
          btn.classList.add('active');
          btn.classList.add(idx === 0 ? 'low' : idx === 1 ? 'mid' : 'high');
          btn.setAttribute('aria-checked','true');
        });
      });
    });

    document.querySelectorAll('.verdict-options').forEach(grp => {
      const opts = grp.querySelectorAll('.verdict-option');
      opts.forEach((opt, idx) => {
        opt.addEventListener('click', () => {
          opts.forEach(o => { o.classList.remove('selected','yes','trial','no'); o.setAttribute('aria-checked','false'); });
          opt.classList.add('selected', idx === 0 ? 'yes' : idx === 1 ? 'trial' : 'no');
          opt.setAttribute('aria-checked','true');
        });
      });
    });

    const scaleDetails = {
      hearing: [
        '0 · отсутствует речь',
        '1 · присутствуют вокализации, но попадания в ноты нет',
        '2 · практически отсутствует воспроизведение нот, при воспроизведении нет попадания',
        '3 · непопадание в ноты, но уверенное их воспроизведение',
        '4 · ситуативное, но редкое попадание в ноты',
        '5 · ситуативное попадание в ноты',
        '6 · музыкальный слух есть, но диапазон голоса сильно ограничен',
        '7 · хороший слух, попадание в ноты в определённом диапазоне',
        '8 · абсолютный слух, незначительные ошибки',
        '9 · абсолютный слух, практически идеальное попадание',
        '10 · абсолютный слух, идеальное попадание без ошибок'
      ],
      rhythm: [
        '0 · совсем не выполняет',
        '1 · хаотично, без связи с ритмом',
        '2 · иногда попадает в сильную долю',
        '3 · держит темп, но сбивается',
        '4 · половина ударов в ритме',
        '5 · держит пульс, рисунок искажён',
        '6 · темп есть, но рисунок с ошибками',
        '7 · ровный пульс, рисунок узнаваем',
        '8 · почти точно, лёгкие смещения',
        '9 · уверенно, без серьёзных ошибок',
        '10 · идеально, акценты и стабильность'
      ],
      diction: [
        '0 · речь неразборчива, звуки не формируются',
        '1 · угадываются отдельные слова/звуки',
        '2 · слабые движения языка, большая часть речи смазана',
        '3 · отдельные понятные слова, связность теряется',
        '4 · половина слов различима, остальное нечётко',
        '5 · речь в целом понятна, но с трудом, много искажений',
        '6 · большинство слов ясно, слышны огрехи и смазанность',
        '7 · речь понятна, артикуляция внятная, редкие сбои',
        '8 · чётко и понятно, мелкие неточности в сложных звуках',
        '9 · очень ясная речь, точные движения органов речи',
        '10 · идеально: чёткая, чистая, образцовая речь'
      ],
      range: [
        '0 · отсутствует речь',
        '1 · диапазона голоса практически нет',
        '2 · не более двух тонов',
        '3 · в пределах терции',
        '4 · меньше квинты',
        '5 · в пределах сексты',
        '6 · чуть меньше октавы',
        '7 · октава',
        '8 · чуть больше октавы',
        '9 · в пределах 1,5 октавы',
        '10 · 2 октавы и больше'
      ],
      memory: [
        '0 · ничего не воспроизвёл',
        '1 · хаотичные звуки, без сходства',
        '2 · редкие совпадения (1–2 ноты)',
        '3 · угадывает темп/идею, но не мелодию',
        '4 · есть фрагменты, но сильно искажено',
        '5 · общий контур есть, много ошибок',
        '6 · верный ритм, но ошибки в нотах',
        '7 · узнаваемо, но сбивается регулярно',
        '8 · почти всё правильно, редкие ошибки',
        '9 · очень точно, ошибки минимальны',
        '10 · идеально, всё как в оригинале'
      ]
    };
    document.querySelectorAll('.scale-row').forEach(row => {
      const scale = row.dataset.scale;
      const ticks = row.querySelectorAll('.scale-tick');
      const detail = row.querySelector('.scale-detail');
      const valEl = row.querySelector('.scale-value .val');
      ticks.forEach((tick, idx) => {
        tick.addEventListener('click', () => {
          ticks.forEach((t, i) => {
            t.classList.remove('active');
            t.classList.toggle('below', i < idx);
            t.setAttribute('aria-checked','false');
          });
          tick.classList.add('active');
          tick.setAttribute('aria-checked','true');
          if (valEl) valEl.textContent = idx;
          if (detail && scaleDetails[scale]) detail.innerHTML = `<strong>${idx} —</strong> ${scaleDetails[scale][idx].split('· ')[1] || ''}`;
        });
      });
    });

    function showToast(msg, ms = 3000) {
      const toast = document.getElementById('toast');
      const body = document.getElementById('toast-body');
      if (!toast || !body) return;
      body.innerHTML = msg;
      toast.classList.add('show');
      clearTimeout(showToast._t);
      showToast._t = setTimeout(() => toast.classList.remove('show'), ms);
    }

    (function() {

      const snapshots = new WeakMap();

      function updateOverallProgress() {
        const cards = document.querySelectorAll('.stage-card');
        let done = 0;
        cards.forEach(c => { if (c.dataset.status === 'done') done++; });
        const total = cards.length;
        const pct = total ? (done / total * 100) : 0;
        const fill = document.getElementById('route-fill');
        const num = document.getElementById('route-done');
        const track = document.querySelector('.progress-track');
        if (fill) fill.style.width = pct + '%';
        if (num) num.textContent = done;
        if (track) track.setAttribute('aria-valuenow', String(done));
      }

      function smoothCollapse(card, callback) {
        const body = card.querySelector('.stage-body');
        const head = card.querySelector('.stage-head-clickable');
        if (!body || card.classList.contains('collapsed')) { if (callback) callback(); return; }
        const fullHeight = body.scrollHeight;

        const beforeRect = card.getBoundingClientRect();
        body.style.maxHeight = fullHeight + 'px';
        body.classList.add('is-collapsing');

        void body.offsetHeight;
        requestAnimationFrame(() => {
          body.style.maxHeight = '0px';
          body.style.opacity = '0';
        });
        const onEnd = () => {
          body.removeEventListener('transitionend', onEnd);
          body.classList.remove('is-collapsing');
          body.style.maxHeight = '';
          body.style.opacity = '';
          card.classList.add('collapsed');
          if (head) head.setAttribute('aria-expanded', 'false');
          body.setAttribute('hidden', '');

          const afterRect = card.getBoundingClientRect();
          const delta = afterRect.top - beforeRect.top;
          if (Math.abs(delta) > 1) window.scrollBy({ top: delta, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
          if (callback) callback();
        };
        body.addEventListener('transitionend', onEnd, { once: true });

        setTimeout(() => { if (body.classList.contains('is-collapsing')) onEnd(); }, 700);
      }

      function smoothExpand(card) {
        const body = card.querySelector('.stage-body');
        const head = card.querySelector('.stage-head-clickable');
        if (!body || !card.classList.contains('collapsed')) return;
        card.classList.remove('collapsed');
        body.removeAttribute('hidden');
        if (head) head.setAttribute('aria-expanded', 'true');

      }

      function setStageStatus(stageKey, newStatus, opts) {
        const card = document.querySelector('.stage-card[data-stage="' + stageKey + '"]');
        if (!card) return;
        card.dataset.status = newStatus;

        const badge = card.querySelector('.stage-info .title-row .badge:not(.mine)');
        if (badge) {
          badge.classList.remove('done','progress','empty','locked');
          if (newStatus === 'done')      { badge.classList.add('done');     badge.textContent = 'Завершён'; }
          else if (newStatus === 'progress') { badge.classList.add('progress'); badge.textContent = 'В процессе'; }
          else if (newStatus === 'empty')    { badge.classList.add('empty');    badge.textContent = 'Не начат'; }
        }

        const num = card.querySelector('.stage-num');
        if (num) {
          if (newStatus === 'done') {
            if (!num.dataset.origText) num.dataset.origText = num.textContent.trim();
            if (!num.dataset.origClass) num.dataset.origClass = Array.from(num.classList).join(' ');
            num.classList.add('done');
            num.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width: 1rem; height: 1rem;"><polyline points="20 6 9 17 4 12"/></svg>';
          } else if (num.dataset.origText) {
            num.className = 'stage-num';
            num.classList.add(...num.dataset.origClass.split(' ').filter(Boolean).filter(c => c !== 'done'));
            num.textContent = num.dataset.origText;
          }
        }

        if (newStatus === 'done') card.classList.remove('is-current');

        const tile = document.querySelector('.stage-tile[data-stage="' + stageKey + '"]');
        if (tile) {
          tile.classList.remove('done','progress','in-progress','current','pending');
          if (newStatus === 'done') {
            tile.classList.add('done');
            const numLine = tile.querySelector('.num-line');
            if (numLine) {
              if (!numLine.dataset.orig) numLine.dataset.orig = numLine.innerHTML;
              const stageNo = numLine.querySelector('span:first-child');
              const txt = stageNo ? stageNo.textContent : '';
              numLine.innerHTML = '<span>' + txt + '</span><svg class="st-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
            }
          } else {
            tile.classList.add('in-progress');
            const numLine = tile.querySelector('.num-line');
            if (numLine && numLine.dataset.orig) numLine.innerHTML = numLine.dataset.orig;
          }
        }

        const sideItem = document.querySelector('.side-nav-item[href="#stage-' + stageKey + '"]');
        if (sideItem) {
          const dot = sideItem.querySelector('.sni-status');
          if (dot) {
            dot.classList.remove('done','progress','empty');
            if (newStatus === 'done')         { dot.classList.add('done');     dot.setAttribute('aria-label', 'завершён'); }
            else if (newStatus === 'progress') { dot.classList.add('progress'); dot.setAttribute('aria-label', 'в процессе'); }
            else                               { dot.classList.add('empty');    dot.setAttribute('aria-label', 'не начат'); }
          }
          if (newStatus === 'done') sideItem.classList.remove('active');
        }

        if (newStatus === 'done') {
          card.querySelectorAll('.subtab .sub-status').forEach(dot => {
            dot.classList.remove('progress');
            dot.classList.add('done');
          });
        }

        updateOverallProgress();
      }

      function replaceFinishButton(card, mode) {
        const actionsBlock = card.querySelector(':scope > .stage-body > .stage-actions');
        if (!actionsBlock) return;
        const finishBtn = actionsBlock.querySelector('[data-action="finish-stage"], [data-action="edit-stage"]');
        if (!finishBtn) return;
        if (mode === 'edit') {
          finishBtn.outerHTML = '<button type="button" class="btn btn-secondary btn-sm" data-action="edit-stage"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width: 0.9375rem; height: 0.9375rem;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Отредактировать этап</button>';
        } else {
          finishBtn.outerHTML = '<button type="button" class="btn btn-primary btn-sm" data-action="finish-stage">Завершить этап</button>';
        }
        bindFinishButtons();
      }

      function lockStageBody(card) {
        const body = card.querySelector(':scope > .stage-body');
        if (!body || body.classList.contains('is-locked')) return;
        body.classList.add('is-locked');

        const interactiveBtns = body.querySelectorAll(
          '.qgroup button, .test-list button, .gmfcs-grid button, .level-grid button, ' +
          '.scale-row button, .theatre-row button, .verdict-options button, .three-points button, ' +
          '.chip-group button, .sub-section button'
        );
        interactiveBtns.forEach(b => {
          if (b.disabled) {
            b.dataset.lockedPrev = 'disabled';
          } else {
            b.dataset.lockedPrev = 'enabled';
            b.disabled = true;
          }
          b.setAttribute('aria-disabled', 'true');
        });

        body.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(i => {
          if (i.disabled) {
            i.dataset.lockedPrev = 'disabled';
          } else {
            i.dataset.lockedPrev = 'enabled';
            i.disabled = true;
          }
        });

        body.querySelectorAll('textarea, input[type="text"], input[type="number"], input[type="search"]').forEach(i => {
          if (i.readOnly) {
            i.dataset.lockedPrev = 'readonly';
          } else {
            i.dataset.lockedPrev = 'editable';
            i.readOnly = true;
          }
          i.setAttribute('aria-readonly', 'true');
        });

        body.querySelectorAll('select').forEach(s => {
          if (s.disabled) {
            s.dataset.lockedPrev = 'disabled';
          } else {
            s.dataset.lockedPrev = 'enabled';
            s.disabled = true;
          }
        });

        if (!body.querySelector(':scope > .stage-locked-banner')) {
          const banner = document.createElement('div');
          banner.className = 'stage-locked-banner';
          banner.setAttribute('role', 'status');
          banner.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">' +
              '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' +
            '</svg>' +
            '<span class="slb-text"><strong>Этап завершён.</strong> Поля доступны только для чтения. Нажмите «Отредактировать этап», чтобы внести изменения.</span>';
          body.insertBefore(banner, body.firstChild);
        }
      }

      function unlockStageBody(card) {
        const body = card.querySelector(':scope > .stage-body');
        if (!body || !body.classList.contains('is-locked')) return;
        body.classList.remove('is-locked');

        body.querySelectorAll('[data-locked-prev]').forEach(el => {
          const prev = el.dataset.lockedPrev;
          if (prev === 'enabled') {
            el.disabled = false;
          } else if (prev === 'editable') {
            el.readOnly = false;
            el.removeAttribute('aria-readonly');
          }
          el.removeAttribute('aria-disabled');
          delete el.dataset.lockedPrev;
        });

        const banner = body.querySelector(':scope > .stage-locked-banner');
        if (banner) banner.remove();
      }

      function bindFinishButtons() {
        document.querySelectorAll('[data-action="finish-stage"]').forEach(btn => {

          if (btn.dataset.bound === '1') return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', async () => {

            if (btn.disabled) return;
            const card = btn.closest('.stage-card');
            if (!card) return;
            const stageKey = card.dataset.stage;
            const stageTitle = card.querySelector('.stage-info .title');
            const title = stageTitle ? stageTitle.textContent.trim() : 'Этап';

            if (stageKey === 'final') {
              const saved = await window.__submitConclusion?.(btn);
              if (!saved) return;
              setStageStatus(stageKey, 'done');
              lockStageBody(card);
            } else {
              const res = await window.__persistStageBlocks?.(stageKey, null, btn);
              if (!res || !res.ok) return;
              if (!res.stageDone) {
                showToast('Ваш блок сохранён. <strong>Этап ждёт остальных специалистов.</strong>', 4600);
                return;
              }
            }

            card.classList.add('just-finished');
            setTimeout(() => card.classList.remove('just-finished'), 800);
            replaceFinishButton(card, 'edit');

            setTimeout(() => {
              smoothCollapse(card, () => {

                const allCards = Array.from(document.querySelectorAll('.stage-card'));
                const idx = allCards.indexOf(card);
                let target = null;
                for (let i = idx + 1; i < allCards.length; i++) {
                  target = allCards[i];
                  break;
                }

                const scrollTarget = target || card;

                scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            }, 450);
            showToast('Этап завершён: <strong>' + title + '</strong>');
          });
        });
        document.querySelectorAll('[data-action="edit-stage"]').forEach(btn => {
          if (btn.dataset.bound === '1') return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', () => {
            const card = btn.closest('.stage-card');
            if (!card) return;
            const stageKey = card.dataset.stage;

            setStageStatus(stageKey, 'progress');

            unlockStageBody(card);
            replaceFinishButton(card, 'finish');
            smoothExpand(card);
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Этап открыт для редактирования');
          });
        });
      }

      bindFinishButtons();
      window.__bindFinishButtons = bindFinishButtons;
      window.__setStageStatus = setStageStatus;
      window.__lockStageBody = lockStageBody;
      window.__unlockStageBody = unlockStageBody;
      window.__replaceFinishButton = replaceFinishButton;
      window.__updateOverallProgress = updateOverallProgress;
    })();

    (function() {
      document.querySelectorAll('[data-action="save-draft"]').forEach(btn => {
        btn.addEventListener('click', () => {

          const label = btn.querySelector('.btn-label');
          const origHTML = btn.innerHTML;
          const isLabel = !!label;
          btn.classList.add('is-saving');
          btn.disabled = true;
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" aria-hidden="true" style="width:0.9375rem;height:0.9375rem;color:var(--sage-700);"><polyline points="20 6 9 17 4 12"/></svg>' + (isLabel ? '<span class="btn-label">Сохранено</span>' : 'Сохранено');
          showToast('Черновик сохранён');

          setTimeout(() => {
            btn.classList.remove('is-saving');
            btn.disabled = false;
            btn.innerHTML = origHTML;
          }, 1800);
        });
      });
    })();

    (function() {

      function lockSubpanel(panel) {
        if (!panel || panel.classList.contains('is-locked')) return;
        panel.classList.add('is-locked');

        const interactiveBtns = panel.querySelectorAll(
          '.qgroup button, .test-list button, .gmfcs-grid button, .level-grid button, ' +
          '.scale-row button, .theatre-row button, .verdict-options button, .three-points button, ' +
          '.chip-group button, .sub-section button, .specialists-row button'
        );
        interactiveBtns.forEach(b => {

          if (b.closest('.subblock-actions')) return;
          b.dataset.lockedPrev = b.disabled ? 'disabled' : 'enabled';
          if (!b.disabled) b.disabled = true;
          b.setAttribute('aria-disabled', 'true');
        });
        panel.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(i => {
          i.dataset.lockedPrev = i.disabled ? 'disabled' : 'enabled';
          if (!i.disabled) i.disabled = true;
        });
        panel.querySelectorAll('textarea, input[type="text"], input[type="number"], input[type="search"]').forEach(i => {
          i.dataset.lockedPrev = i.readOnly ? 'readonly' : 'editable';
          if (!i.readOnly) i.readOnly = true;
          i.setAttribute('aria-readonly', 'true');
        });
        panel.querySelectorAll('select').forEach(s => {
          s.dataset.lockedPrev = s.disabled ? 'disabled' : 'enabled';
          if (!s.disabled) s.disabled = true;
        });

        if (!panel.querySelector(':scope > .subpanel-locked-banner')) {
          const banner = document.createElement('div');
          banner.className = 'subpanel-locked-banner';
          banner.setAttribute('role', 'status');
          banner.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">' +
              '<path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>' +
            '</svg>' +
            '<span class="slb-text"><strong>Блок завершён.</strong> Поля доступны только для чтения. Нажмите «Отредактировать блок», чтобы внести изменения.</span>';
          const head = panel.querySelector(':scope > .subpanel-head');
          if (head && head.nextSibling) panel.insertBefore(banner, head.nextSibling);
          else panel.insertBefore(banner, panel.firstChild);
        }
      }

      function unlockSubpanel(panel) {
        if (!panel || !panel.classList.contains('is-locked')) return;
        panel.classList.remove('is-locked');

        panel.querySelectorAll('[data-locked-prev]').forEach(el => {
          const prev = el.dataset.lockedPrev;
          if (prev === 'enabled') el.disabled = false;
          else if (prev === 'editable') {
            el.readOnly = false;
            el.removeAttribute('aria-readonly');
          }
          el.removeAttribute('aria-disabled');
          delete el.dataset.lockedPrev;
        });
        const banner = panel.querySelector(':scope > .subpanel-locked-banner');
        if (banner) banner.remove();
      }

      function updateStageReadiness(stageCard) {
        if (!stageCard) return;
        const subpanels = stageCard.querySelectorAll(':scope > .stage-body > .subpanel');
        if (!subpanels.length) return;
        const total = subpanels.length;
        const done = stageCard.querySelectorAll(':scope > .stage-body > .subpanel.is-locked').length;
        const allDone = done === total;

        const stageActions = stageCard.querySelector(':scope > .stage-body > .stage-actions');
        if (!stageActions) return;
        const finishBtn = stageActions.querySelector('[data-action="finish-stage"]');
        const hint = stageActions.querySelector('[data-role="pending-hint"]');

        if (finishBtn) {
          finishBtn.disabled = !allDone;
          if (allDone) finishBtn.removeAttribute('title');
          else finishBtn.setAttribute('title', 'Сначала завершите все подразделы');
        }
        if (hint) {
          if (allDone) {
            hint.style.display = 'none';
          } else {
            hint.style.display = '';
            const remaining = total - done;

            const text = remaining === 1
              ? 'Остался последний подраздел'
              : 'Осталось ' + remaining + ' из ' + total + ' подразделов';

            for (const node of hint.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                node.textContent = ' ' + text;
                return;
              }
            }

            hint.appendChild(document.createTextNode(' ' + text));
          }
        }
      }

      function rebindActions(card) {

        if (typeof window.__bindFinishButtons === 'function') window.__bindFinishButtons();
      }

      function attachSubblockBtnHandlers() {
        document.querySelectorAll('[data-action="finish-subblock"]').forEach(btn => {
          if (btn.dataset.bound === '1') return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', async () => {
            const panel = btn.closest('.subpanel');
            const stageCard = btn.closest('.stage-card');
            if (!panel || !stageCard) return;
            const key = panel.id.replace('subpanel-', '');
            const blockTitle = panel.querySelector('.subpanel-head .t');

            const res = await window.__persistStageBlocks?.(stageCard.dataset.stage, key, btn);
            if (!res || !res.ok) return;

            if (typeof showToast === 'function') {
              showToast('Блок завершён: <strong>' + (blockTitle ? blockTitle.textContent.trim() : '') + '</strong>');
            }
          });
        });

        document.querySelectorAll('[data-action="edit-subblock"]').forEach(btn => {
          if (btn.dataset.bound === '1') return;
          btn.dataset.bound = '1';
          btn.addEventListener('click', () => {
            const panel = btn.closest('.subpanel');
            const stageCard = btn.closest('.stage-card');
            if (!panel || !stageCard) return;
            const key = panel.id.replace('subpanel-', '');

            const dot = stageCard.querySelector('.subtab[data-subtab="' + key + '"] .sub-status');
            if (dot) {
              dot.classList.remove('done');
              dot.classList.add('progress');
            }
            unlockSubpanel(panel);
            btn.outerHTML = '<button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>';
            attachSubblockBtnHandlers();
            updateStageReadiness(stageCard);
            if (typeof showToast === 'function') {
              showToast('Блок открыт для редактирования');
            }
          });
        });
      }

      attachSubblockBtnHandlers();

      document.querySelectorAll('.stage-card').forEach(updateStageReadiness);

      window.__updateStageReadiness = updateStageReadiness;
      window.__lockSubpanel = lockSubpanel;
      window.__unlockSubpanel = unlockSubpanel;
      window.__attachSubblockBtnHandlers = attachSubblockBtnHandlers;
    })();

    (function() {
      const stageOrder = ['psy', 'afk', 'soc', 'final'];
      const stageTitles = {
        psy: 'Психолог + логопед',
        afk: 'АФК',
        soc: 'Социокультурная диагностика',
        final: 'Сводное заключение'
      };

      const PROFILE_BLOCKS = {
        psy:     { stage: 'psy', sub: 'psy' },
        log:     { stage: 'psy', sub: 'log' },
        izo:     { stage: 'soc', sub: 'izo' },
        theatre: { stage: 'soc', sub: 'theatre' },
        vocal:   { stage: 'soc', sub: 'vocal' },
        afk:     { stage: 'afk', sub: null }
      };
      const ALL_STAGES = ['psy', 'afk', 'soc', 'final'];

      function viewerCanConclude() {
        const u = authStore.user;
        return !!u && (u.role === 'admin' || u.canConclude === true);
      }

      const VERDICT_KEYS = ['recommended', 'trial', 'rejected'];

      function q(selector, root = document) { return root.querySelector(selector); }
      function qa(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }
      function text(el) { return normalizeSpaces(el?.textContent || ''); }
      function visibleValue(el) { return normalizeSpaces(el?.value || ''); }
      function unique(arr) { return Array.from(new Set(arr.map(normalizeSpaces).filter(Boolean))); }

      function getSelectedTexts(root) {
        const values = [];
        qa('.chip.selected', root).forEach(el => values.push(text(el)));
        qa('.seg-btn.active, .triple-btn.active, .point-btn.active, .scale-tick.active', root).forEach(el => values.push(text(el)));
        qa('.gmfcs-card.selected, .level-card.selected, .theatre-option.selected, .verdict-option.selected', root).forEach(el => {
          const preferred = q('.vt, .ln, .lvname, .desc', el);
          values.push(text(preferred || el));
        });
        return unique(values).filter(v => !['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(v) || root.closest?.('#subpanel-vocal'));
      }

      function getPanelComments(root) {
        return qa('textarea, input[type="text"]', root).map(visibleValue).filter(Boolean);
      }

      function hasMeaningfulData(root) {
        if (!root) return false;
        if (getSelectedTexts(root).length > 0) return true;
        if (getPanelComments(root).length > 0) return true;
        if (qa('.specialist-chip', root).length > 0) return true;
        return false;
      }

      function panelSummary(selector, max = 4) {
        const panel = q(selector);
        if (!panel) return '';
        const values = getSelectedTexts(panel).slice(0, max);
        const comments = getPanelComments(panel).slice(0, 1);
        const out = [];
        if (values.length) out.push(values.join('; '));
        if (comments.length) out.push('Комментарий: ' + comments.join('; '));
        return out.join('. ');
      }

      function stageSummary(stageKey, max = 5) {
        const card = q('.stage-card[data-stage="' + stageKey + '"]');
        if (!card) return '';
        const values = getSelectedTexts(card).slice(0, max);
        const comments = getPanelComments(card).slice(0, 1);
        const out = [];
        if (values.length) out.push(values.join('; '));
        if (comments.length) out.push('Комментарий: ' + comments.join('; '));
        return out.join('. ');
      }

      function selectedVerdict() {
        const selected = q('#stage-final .verdict-option.selected') || q('#stage-final .verdict-option');
        const title = text(q('.vt', selected)) || 'Рекомендованы';
        const subtitle = text(q('.vs', selected));
        return { title, subtitle, text: [title, subtitle].filter(Boolean).join(' — ') };
      }

      function scoreText(selector) {
        const el = q(selector + ' .subpanel-head .right .pp');
        return text(el).replace(/\s+\/\s+/g, '/');
      }

      function recommendation(base, summary, extra = '') {
        const parts = [base, summary ? 'По данным диагностики: ' + summary : '', extra].filter(Boolean);
        return parts.join(' ');
      }

      function collectReportData() {
        const recipient = diagnosticsRuntime.currentRecipient || FALLBACK_RECIPIENTS[0];
        const reportDate = new Date();

        function blockSpecialists(profileKey) {
          const names = (diagnosticsRuntime.assignments || [])
            .filter(a => (a.profileKey || a.direction?.profileKey || '') === profileKey)
            .map(a => a.specialistName || a.specialist?.fullName || '');
          return unique(names);
        }

        function textareaRecsFrom(selector) {
          const root = q(selector);
          if (!root) return '';
          return qa('textarea', root).map(ta => (ta.value || '').trim()).filter(Boolean).join('\n');
        }

        function textareaRecsFromStage(stageKey) {
          const card = q('.stage-card[data-stage="' + stageKey + '"]');
          if (!card) return '';
          return qa('textarea', card).map(ta => (ta.value || '').trim()).filter(Boolean).join('\n');
        }

        const blocks = [
          { id: 'psy',        dirGroup: 'soc-psy', direction: 'Социально-\nпсихологическая\nреабилитация', sub: 'Психолог',         pos: 'психолог\nв социальной\nсфере',         specialists: blockSpecialists('psy'),        recs: textareaRecsFrom('#subpanel-psy') },
          { id: 'log',        dirGroup: 'soc-ped', direction: 'Социально-\nпедагогическая\nреабилитация',  sub: 'Логопед',          pos: 'логопед',                               specialists: blockSpecialists('log'),        recs: textareaRecsFrom('#subpanel-log') },
          { id: 'izo',        dirGroup: 'soc-cul', direction: 'Социокультурная\nреабилитация',              sub: 'Художественное',   pos: 'Специалист по\nреабилитации\nинвалидов', specialists: blockSpecialists('izo'),        recs: textareaRecsFrom('#subpanel-izo') },
          { id: 'theatre',    dirGroup: 'soc-cul', direction: null,                                          sub: 'Театральное',      pos: 'Специалист по\nреабилитации\nинвалидов', specialists: blockSpecialists('theatre'),    recs: textareaRecsFrom('#subpanel-theatre') },
          { id: 'vocal',      dirGroup: 'soc-cul', direction: null,                                          sub: 'Вокальное',        pos: 'Специалист по\nреабилитации\nинвалидов', specialists: blockSpecialists('vocal'),      recs: textareaRecsFrom('#subpanel-vocal') },
          { id: 'instrument', dirGroup: 'soc-cul', direction: null,                                          sub: 'Инструментальное', pos: 'Специалист по\nреабилитации\nинвалидов', specialists: blockSpecialists('instrument'), recs: textareaRecsFrom('#subpanel-instrument') },
          { id: 'afk',        dirGroup: 'afk',     direction: 'Физкультурно-\nоздоровительная\n(АФК)',       sub: null,               pos: 'Специалист по\nреабилитации\nинвалидов', specialists: blockSpecialists('afk'),        recs: textareaRecsFromStage('afk') },
        ];

        return { recipient, reportDate, blocks };
      }
      window.__collectReportData = collectReportData;

      function validateStage(stageKey) {
        const card = q('.stage-card[data-stage="' + stageKey + '"]');
        if (!card) return { ok: false, reason: 'Этап не найден' };
        const panels = qa(':scope > .stage-body > .subpanel', card).filter(p => !p.classList.contains('profile-hidden'));
        if (panels.length) {
          const emptyPanels = panels.filter(panel => !hasMeaningfulData(panel));
          if (emptyPanels.length) {
            const names = emptyPanels.map(panel => text(q('.subpanel-head .t', panel)) || panel.id).join(', ');
            return { ok: false, reason: 'Не заполнены блоки: ' + names };
          }
        } else if (!hasMeaningfulData(card)) {
          return { ok: false, reason: 'Нет выбранных данных' };
        }
        return { ok: true };
      }

      function autoFinishStage(stageKey) {
        const card = q('.stage-card[data-stage="' + stageKey + '"]');
        if (!card || card.dataset.status === 'done') return;
        if (stageKey === 'final' && !diagnosticsRuntime.conclusion) return;

        qa(':scope > .stage-body > .subpanel', card).filter(panel => !panel.classList.contains('profile-hidden')).forEach(panel => {
          if (hasMeaningfulData(panel) && !panel.classList.contains('is-locked') && typeof window.__lockSubpanel === 'function') {
            window.__lockSubpanel(panel);
          }
          const key = panel.id.replace('subpanel-', '');
          const dot = q('.subtab[data-subtab="' + key + '"] .sub-status', card);
          if (dot) {
            dot.classList.remove('progress');
            dot.classList.add('done');
          }
          const finishSub = q('[data-action="finish-subblock"]', panel);
          if (finishSub) {
            finishSub.outerHTML = '<button type="button" class="btn btn-secondary btn-sm" data-action="edit-subblock"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width: 0.9375rem; height: 0.9375rem;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Отредактировать блок</button>';
          }
        });

        if (typeof window.__setStageStatus === 'function') window.__setStageStatus(stageKey, 'done');
        if (typeof window.__lockStageBody === 'function') window.__lockStageBody(card);
        if (typeof window.__replaceFinishButton === 'function') window.__replaceFinishButton(card, 'edit');
        if (typeof window.__attachSubblockBtnHandlers === 'function') window.__attachSubblockBtnHandlers();
        if (typeof window.__bindFinishButtons === 'function') window.__bindFinishButtons();
        if (typeof window.__updateStageReadiness === 'function') window.__updateStageReadiness(card);
      }

      const EDIT_SUBBLOCK_BTN =
        '<button type="button" class="btn btn-secondary btn-sm" data-action="edit-subblock">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width: 0.9375rem; height: 0.9375rem;">' +
        '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Отредактировать блок</button>';
      const FINISH_SUBBLOCK_BTN =
        '<button type="button" class="btn btn-primary btn-sm" data-action="finish-subblock">Завершить блок</button>';

      const pristineMarks = new Map();
      function rememberPristineMarks() {
        if (pristineMarks.size) return;
        qa('.stage-info .badge:not(.mine)').forEach(el => pristineMarks.set(el, { cls: el.className, text: el.textContent }));
        qa('.subtab .sub-status').forEach(el => pristineMarks.set(el, { cls: el.className }));
      }

      function stagePendingHint(card) {
        return q(':scope > .stage-body > .stage-actions [data-role="pending-hint"]', card);
      }

      function clearCompletionMarks() {
        rememberPristineMarks();

        qa('.subpanel').forEach(panel => {
          if (typeof window.__unlockSubpanel === 'function') window.__unlockSubpanel(panel);
          const editBtn = q('[data-action="edit-subblock"]', panel);
          if (editBtn) editBtn.outerHTML = FINISH_SUBBLOCK_BTN;
        });

        qa('.stage-card').forEach(card => {
          if (typeof window.__unlockStageBody === 'function') window.__unlockStageBody(card);
          if (card.dataset.status === 'done') {
            if (typeof window.__setStageStatus === 'function') window.__setStageStatus(card.dataset.stage, 'progress');
            if (typeof window.__replaceFinishButton === 'function') window.__replaceFinishButton(card, 'finish');
          }
        });

        pristineMarks.forEach((snap, el) => {
          el.className = snap.cls;
          if (snap.text !== undefined) el.textContent = snap.text;
        });

        if (typeof window.__attachSubblockBtnHandlers === 'function') window.__attachSubblockBtnHandlers();
        if (typeof window.__bindFinishButtons === 'function') window.__bindFinishButtons();
        qa('.stage-card').forEach(card => {
          if (typeof window.__updateStageReadiness === 'function') window.__updateStageReadiness(card);
        });
      }
      window.__clearCompletionMarks = clearCompletionMarks;

      function applyCompletedBlocks(assignments) {
        const list = Array.isArray(assignments) ? assignments : [];
        if (!list.length) return;
        rememberPristineMarks();

        const stages = new Map();
        list.forEach(a => {
          const key = a.profileKey || a.direction?.profileKey || '';
          const place = PROFILE_BLOCKS[key];
          if (!place) return;
          if (!stages.has(place.stage)) stages.set(place.stage, { subs: new Map(), total: 0, done: 0 });
          const bucket = stages.get(place.stage);
          const isDone = a.blockStatus === 'completed';
          bucket.total += 1;
          if (isDone) bucket.done += 1;
          if (place.sub) bucket.subs.set(place.sub, (bucket.subs.get(place.sub) || false) || isDone);
        });

        stages.forEach((bucket, stageKey) => {
          const card = q('.stage-card[data-stage="' + stageKey + '"]');
          if (!card) return;

          bucket.subs.forEach((isDone, sub) => {
            if (!isDone) return;
            const panel = q('#subpanel-' + sub, card);
            if (panel && typeof window.__lockSubpanel === 'function') window.__lockSubpanel(panel);
            const dot = q('.subtab[data-subtab="' + sub + '"] .sub-status', card);
            if (dot) { dot.classList.remove('progress'); dot.classList.add('done'); }
            const finishSub = panel && q('[data-action="finish-subblock"]', panel);
            if (finishSub) finishSub.outerHTML = EDIT_SUBBLOCK_BTN;
          });

          const stageDone = bucket.total > 0 && bucket.done === bucket.total;
          if (!stageDone) {
            if (typeof window.__updateStageReadiness === 'function') window.__updateStageReadiness(card);
          } else {
            const panels = qa(':scope > .stage-body > .subpanel', card);
            if (!panels.length && typeof window.__lockStageBody === 'function') window.__lockStageBody(card);
            if (typeof window.__setStageStatus === 'function') window.__setStageStatus(stageKey, 'done');
            if (typeof window.__replaceFinishButton === 'function') window.__replaceFinishButton(card, 'edit');
            const hint = stagePendingHint(card);
            if (hint) hint.style.display = 'none';
          }
        });

        if (typeof window.__attachSubblockBtnHandlers === 'function') window.__attachSubblockBtnHandlers();
        if (typeof window.__bindFinishButtons === 'function') window.__bindFinishButtons();
      }
      window.__applyCompletedBlocks = applyCompletedBlocks;

      function firstProblemStage(problems) {
        if (!problems.length) return null;
        return q('.stage-card[data-stage="' + problems[0].stage + '"]');
      }

      function setDiagnosticCompleted(done) {
        diagnosticsRuntime.completed = !!done;
        const downloadBtn = q('[data-action="download-pdf"]');
        const finishBtn = q('[data-action="finish-diagnostic"]');
        if (downloadBtn) {
          downloadBtn.disabled = !done;
          downloadBtn.setAttribute('aria-disabled', String(!done));
          downloadBtn.style.opacity = done ? '1' : '0.5';
          downloadBtn.style.cursor = done ? 'pointer' : 'not-allowed';
        }
        if (finishBtn) {
          finishBtn.disabled = !!done;
          finishBtn.style.opacity = done ? '0.65' : '1';
          finishBtn.style.cursor = done ? 'default' : 'pointer';
          const label = finishBtn.childNodes && Array.from(finishBtn.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
          if (label) label.textContent = done ? 'Диагностика завершена ' : 'Завершить диагностику ';
        }
        const page = q('.diagnostics-page');
        if (page) page.dataset.diagnosticCompleted = String(!!done);
      }
      window.setDiagnosticCompleted = setDiagnosticCompleted;

      function selectedAssignmentProfileKey() {
        const select = document.getElementById('assignment-target');
        const id = select && select.value ? String(select.value) : '';
        if (!id) return '';
        const list = diagnosticsRuntime.assignments || [];
        const found = list.find(a => String(a.id) === id);
        return found?.direction?.profileKey || '';
      }

      function applyProfileRestriction(profileKey) {
        if (window.__forcedProfileKey) profileKey = window.__forcedProfileKey;

        qa('.profile-hidden').forEach(el => el.classList.remove('profile-hidden'));
        qa('#mobile-stage option').forEach(o => { o.hidden = false; });

        const block = profileKey ? PROFILE_BLOCKS[profileKey] : null;
        if (!block) return; 

        ALL_STAGES.forEach(stage => {
          if (stage === block.stage) return;
          if (stage === 'final' && viewerCanConclude()) return;
          q('.stage-card[data-stage="' + stage + '"]')?.classList.add('profile-hidden');
          q('.stage-tile[data-stage="' + stage + '"]')?.classList.add('profile-hidden');
          document.querySelector('.side-nav-item[href="#stage-' + stage + '"]')?.classList.add('profile-hidden');
          const opt = document.querySelector('#mobile-stage option[value="#stage-' + stage + '"]');
          if (opt) opt.hidden = true;
        });

        const card = q('.stage-card[data-stage="' + block.stage + '"]');
        if (!card) return;
        card.classList.remove('collapsed');
        q(':scope > .stage-body', card)?.removeAttribute('hidden');
        q(':scope > .stage-head-clickable', card)?.setAttribute('aria-expanded', 'true');

        if (block.sub) {
          qa(':scope > .stage-body > .subpanel', card).forEach(panel => {
            const key = panel.id.replace('subpanel-', '');
            if (key === block.sub) {
              panel.classList.add('active');
              panel.classList.remove('profile-hidden');
            } else {
              panel.classList.remove('active');
              panel.classList.add('profile-hidden');
            }
          });
          qa('.subtab', card).forEach(tab => {
            const key = tab.dataset.subtab;
            if (key === block.sub) {
              tab.classList.add('active');
              tab.setAttribute('aria-selected', 'true');
              tab.classList.remove('profile-hidden');
            } else {
              tab.classList.remove('active');
              tab.setAttribute('aria-selected', 'false');
              tab.classList.add('profile-hidden');
            }
          });
        }
      }
      window.__applyProfileRestriction = applyProfileRestriction;
      window.__applyAssignmentProfile = function () { applyProfileRestriction(selectedAssignmentProfileKey()); };

      const FORM_SEL = '.chip, .seg-btn, .triple-btn, .point-btn, .scale-tick, .gmfcs-card, .level-card, .theatre-option, .verdict-option';
      const FORM_TXT = 'textarea, input[type="text"], input[type="number"], input[type="search"]';
      const FORM_STATE_CLASSES = ['active', 'selected', 'sage', 'amber', 'rose', 'yes', 'partial', 'no', 'low', 'mid', 'high', 'trial', 'below'];

      function blockRootForProfile(profileKey) {
        const block = profileKey ? PROFILE_BLOCKS[profileKey] : null;
        if (!block) return document.querySelector('.diagnostics-page .content');
        if (block.sub) return document.getElementById('subpanel-' + block.sub);
        return document.querySelector('.stage-card[data-stage="' + block.stage + '"]');
      }

      function snapshotFormState(profileKey) {
        const root = blockRootForProfile(profileKey);
        if (!root) return null;
        const sel = qa(FORM_SEL, root).map(el =>
          (el.classList.contains('active') || el.classList.contains('selected')) ? 1 : 0);
        const txt = qa(FORM_TXT, root).map(el => el.value || '');
        return { scope: profileKey || null, sel, txt };
      }
      window.__snapshotFormState = snapshotFormState;

      function resetFormState(root) {
        if (!root) return;
        qa(FORM_SEL, root).forEach(el => {
          el.classList.remove(...FORM_STATE_CLASSES);
          if (el.hasAttribute('aria-checked')) el.setAttribute('aria-checked', 'false');
          const input = el.querySelector('input[type="checkbox"], input[type="radio"]');
          if (input) input.checked = false;
        });
        qa(FORM_TXT, root).forEach(el => { el.value = ''; });
        qa('.scale-row', root).forEach(row => {
          const valEl = row.querySelector('.scale-value .val');
          if (valEl) valEl.textContent = '';
        });
        qa('.gmfcs-grid', root).forEach(grid => grid.classList.remove('is-disabled'));
        qa('.specialist-chip', root).forEach(c => c.remove());
        if (typeof window.__updateIzoTotal === 'function') window.__updateIzoTotal();
        if (typeof window.__updateVocalTotal === 'function') window.__updateVocalTotal();
      }
      window.__resetFormState = resetFormState;

      function applyFormState(fs) {
        if (!fs) return;
        const root = blockRootForProfile(fs.scope);
        if (!root) return;
        if (fs.scope) resetFormState(root);
        const selEls = qa(FORM_SEL, root);
        (fs.sel || []).forEach((on, i) => { if (on && selEls[i]) selEls[i].click(); });
        const txtEls = qa(FORM_TXT, root);
        (fs.txt || []).forEach((val, i) => {
          const el = txtEls[i];
          if (el && val) { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }
        });
      }
      window.__applyFormState = applyFormState;
      window.__blockRootForProfile = blockRootForProfile;
      window.__formSelectors = { FORM_SEL, FORM_TXT };

      const DEFAULT_SIGNED_NOTE = 'Финальное заключение по диагностике';

      function formatIssuedAt(value) {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }

      function updateSignedNote(concl) {
        const note = q('#stage-final .stage-actions .signed-note');
        if (!note) return;
        if (!concl) { note.textContent = DEFAULT_SIGNED_NOTE; return; }
        const who = concl.authorName || 'Специалист';
        const when = concl.issuedAt ? formatIssuedAt(concl.issuedAt) : '';
        note.textContent = 'Заключение выдал: ' + who + (when ? ', ' + when : '');
      }

      function readConclusionForm() {
        const card = q('#stage-final');
        if (!card) return null;
        const opts = qa('.verdict-option', card);
        const idx = opts.findIndex(o => o.classList.contains('selected'));
        const ta = q('textarea', card);
        return {
          verdict: idx >= 0 ? (VERDICT_KEYS[idx] || '') : '',
          summary: normalizeSpaces(ta?.value || '')
        };
      }

      function updateConclusionGate() {
        const card = q('#stage-final');
        if (!card) return;
        if (diagnosticsRuntime.conclusion) return;

        const blockers = diagnosticsRuntime.conclusionBlockers || [];
        const reason = !diagnosticsRuntime.sessionId
          ? 'У реабилитанта нет действующей заявки на диагностику.'
          : (blockers.length
              ? 'Ещё не пройдены: ' + escapeHtml(blockers.map(b => b.title).join(', ')) + '.'
              : '');
        const blocked = !!reason;
        const body = q(':scope > .stage-body', card);
        const badge = q('.stage-info .title-row .badge:not(.mine)', card);
        const finishBtn = q(':scope > .stage-body > .stage-actions [data-action="finish-stage"]', card);

        if (badge) {
          badge.classList.remove('done', 'progress', 'empty', 'locked');
          badge.classList.add(blocked ? 'locked' : 'empty');
          badge.textContent = blocked ? 'Ожидает этапов 01–03' : 'Можно заключать';
        }
        if (finishBtn) {
          finishBtn.disabled = blocked;
          if (blocked) finishBtn.setAttribute('title', 'Сначала должны быть пройдены этапы 01–03');
          else finishBtn.removeAttribute('title');
        }

        let note = body && q(':scope > .stage-gate-banner', body);
        if (!blocked) { if (note) note.remove(); return; }
        if (!body) return;
        if (!note) {
          note = document.createElement('div');
          note.className = 'stage-gate-banner';
          note.setAttribute('role', 'status');
          body.insertBefore(note, body.firstChild);
        }
        note.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">' +
            '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>' +
          '</svg>' +
          '<span class="slb-text"><strong>Заключение выдаётся после этапов 01–03.</strong> ' +
          reason + '</span>';
      }
      window.__updateConclusionGate = updateConclusionGate;

      function applyConclusion(concl) {
        const card = q('#stage-final');
        if (!card) return;
        if (!concl) { updateSignedNote(null); updateConclusionGate(); return; }

        const opts = qa('.verdict-option', card);
        const idx = VERDICT_KEYS.indexOf(concl.verdict);
        if (idx >= 0 && opts[idx]) opts[idx].click();

        const ta = q('textarea', card);
        if (ta && concl.summary) {
          ta.value = concl.summary;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
        updateSignedNote(concl);

        if (typeof window.__setStageStatus === 'function') window.__setStageStatus('final', 'done');
        if (typeof window.__lockStageBody === 'function') window.__lockStageBody(card);
        if (typeof window.__replaceFinishButton === 'function') window.__replaceFinishButton(card, 'edit');
      }
      window.__applyConclusion = applyConclusion;

      async function submitConclusion(btn) {
        const form = readConclusionForm();
        if (!form) return false;

        const sessionId = diagnosticsRuntime.sessionId;
        if (!sessionId) {
          showToast('У реабилитанта нет действующей заявки на диагностику — заключение сохранить некуда.', 5200);
          return false;
        }
        const blockers = diagnosticsRuntime.conclusionBlockers || [];
        if (blockers.length) {
          showToast('Заключение выдаётся после этапов 01–03. Ещё не пройдены: <strong>' +
                    escapeHtml(blockers.map(b => b.title).join(', ')) + '</strong>.', 6000);
          return false;
        }
        if (!form.verdict) {
          showToast('Выберите решение по итогам диагностики.', 3600);
          return false;
        }
        if (form.summary.length < 10) {
          showToast('Заполните обоснование — минимум 10 символов.', 3600);
          return false;
        }

        const wasDisabled = btn ? btn.disabled : false;
        if (btn) btn.disabled = true;
        try {
          const { data } = await api.post('/schedule/sessions/' + sessionId + '/conclusion', {
            verdict: form.verdict,
            summary: form.summary
          });
          diagnosticsRuntime.conclusion = data?.conclusion || null;
          diagnosticsRuntime.conclusionBlockers = Array.isArray(data?.missingStages)
            ? data.missingStages
            : [];
          updateSignedNote(diagnosticsRuntime.conclusion);
          if (typeof window.__renderBlockAuthors === 'function') window.__renderBlockAuthors();
          return true;
        } catch (err) {
          const payload = err?.response?.data || {};
          if (Array.isArray(payload.missingStages)) {
            diagnosticsRuntime.conclusionBlockers = payload.missingStages;
            updateConclusionGate();
          }
          showToast(payload.message || 'Не удалось сохранить заключение.', 5200);
          return false;
        } finally {
          if (btn) btn.disabled = wasDisabled;
        }
      }
      window.__submitConclusion = submitConclusion;

      function finishDiagnostic() {
        const activeStages = stageOrder.filter(stage => {
          const card = q('.stage-card[data-stage="' + stage + '"]');
          return card && !card.classList.contains('profile-hidden');
        });
        const problems = [];
        activeStages.forEach(stage => {
          const result = validateStage(stage);
          if (!result.ok) problems.push({ stage, reason: result.reason });
        });

        if (problems.length) {
          const msg = problems.map(p => stageTitles[p.stage] + ': ' + p.reason).join('<br>');
          showToast('Диагностику нельзя завершить:<br>' + msg, 5200);
          const card = firstProblemStage(problems);
          if (card) {
            if (card.classList.contains('collapsed')) {
              card.classList.remove('collapsed');
              q(':scope > .stage-body', card)?.removeAttribute('hidden');
              q(':scope > .stage-head-clickable', card)?.setAttribute('aria-expanded', 'true');
            }
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return false;
        }

        activeStages.forEach(autoFinishStage);
        diagnosticsRuntime.lastReportData = collectReportData();
        setDiagnosticCompleted(true);
        try { localStorage.setItem('diagnostics.lastReportData', JSON.stringify(diagnosticsRuntime.lastReportData)); } catch (_) {}
        showToast('Диагностика завершена. <strong>PDF-отчёт доступен для скачивания.</strong>', 4200);
        return true;
      }

      function wrapLines(ctx, textValue, maxWidth) {
        const source = String(textValue ?? '').replace(/\s+/g, ' ').trim();
        if (!source) return [];
        const words = source.split(' ');
        const lines = [];
        let line = '';
        words.forEach(word => {
          const probe = line ? line + ' ' + word : word;
          if (ctx.measureText(probe).width <= maxWidth || !line) {
            line = probe;
          } else {
            lines.push(line);
            line = word;
          }
        });
        if (line) lines.push(line);
        return lines;
      }

      function trimLineToWidth(ctx, value, maxWidth) {
        let line = String(value || '').trim();
        if (!line) return '';
        if (ctx.measureText(line).width <= maxWidth) return line;
        while (line.length > 1 && ctx.measureText(line + '…').width > maxWidth) {
          line = line.slice(0, -1).trimEnd();
        }
        return line + '…';
      }

      function fitLines(ctx, textValue, maxWidth, maxLines = 100) {
        const lines = wrapLines(ctx, textValue, maxWidth);
        if (lines.length <= maxLines) return lines;
        const fitted = lines.slice(0, Math.max(1, maxLines));
        fitted[fitted.length - 1] = trimLineToWidth(ctx, fitted[fitted.length - 1], maxWidth);
        return fitted;
      }

      function drawTextBlock(ctx, textValue, x, y, maxWidth, lineHeight, opts = {}) {
        const align = opts.align || 'left';
        const maxLines = opts.maxLines || 100;
        const lines = fitLines(ctx, textValue, maxWidth, maxLines);
        const oldAlign = ctx.textAlign;
        const oldBaseline = ctx.textBaseline;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        const tx = align === 'center' ? x + maxWidth / 2 : (align === 'right' ? x + maxWidth : x);
        lines.forEach((line, idx) => ctx.fillText(line, tx, y + idx * lineHeight));
        ctx.textAlign = oldAlign;
        ctx.textBaseline = oldBaseline;
        return y + lines.length * lineHeight;
      }

      function drawCenteredBlock(ctx, textValue, x1, y1, x2, y2, opts = {}) {
        const lines = String(textValue || '').split('\n').map(v => v.trim()).filter(Boolean);
        const lineHeight = opts.lineHeight || 28;
        const oldFont = ctx.font;
        const oldAlign = ctx.textAlign;
        const oldBaseline = ctx.textBaseline;
        if (opts.font) ctx.font = opts.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const total = (lines.length - 1) * lineHeight;
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        lines.forEach((line, idx) => ctx.fillText(line, cx, cy - total / 2 + idx * lineHeight));
        ctx.font = oldFont;
        ctx.textAlign = oldAlign;
        ctx.textBaseline = oldBaseline;
      }

      function drawRotatedBlock(ctx, textValue, x1, y1, x2, y2, opts = {}) {
        const lines = String(textValue || '').split('\n').map(v => v.trim()).filter(Boolean);
        const lineHeight = opts.lineHeight || 27;
        const oldFont = ctx.font;
        const oldAlign = ctx.textAlign;
        const oldBaseline = ctx.textBaseline;
        ctx.save();
        if (opts.font) ctx.font = opts.font;
        ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const total = (lines.length - 1) * lineHeight;
        lines.forEach((line, idx) => ctx.fillText(line, 0, -total / 2 + idx * lineHeight));
        ctx.restore();
        ctx.font = oldFont;
        ctx.textAlign = oldAlign;
        ctx.textBaseline = oldBaseline;
      }

      function drawLine(ctx, x1, y1, x2, y2, width = 1.35) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = '#111111';
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }

      function drawRect(ctx, x, y, w, h, width = 1.35) {
        ctx.save();
        ctx.lineWidth = width;
        ctx.strokeStyle = '#111111';
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
      }

      function makeCanvasPage() {
        const canvas = document.createElement('canvas');
        canvas.width = 1414;
        canvas.height = 2000;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'top';
        return { canvas, ctx };
      }

      function compactRecommendation(value, fallback) {
        let textValue = normalizeSpaces(value || fallback || '');
        textValue = textValue
          .replace(/^Психолог\.\s*/i, '')
          .replace(/^Логопед\.\s*/i, '')
          .replace(/^АФК\.\s*/i, '')
          .replace(/^Художественное направление\.\s*/i, '')
          .replace(/^Театральное направление\.\s*/i, '')
          .replace(/^Вокальное направление\.\s*/i, '')
          .replace(/^Инструментальное направление\.\s*/i, '')
          .replace(/Рекомендовано\s+/i, '')
          .replace(/Рекомендованы\s+/i, '')
          .replace(/По данным диагностики:/i, 'Данные:');
        return textValue;
      }

      function drawReportCanvases(data) {
        const serif = '"Times New Roman", Times, serif';
        const tableX = [67, 206, 478, 735, 945, 1192, 1380];
        const HEADER_H = 67;
        const TABLE_TOP = 462;
        const ROW_H = 100;

        const blocks = (data.blocks || []).map(b => {
          const rowCount = Math.max(1, (b.specialists || []).length);
          return Object.assign({}, b, { rowCount, h: rowCount * ROW_H });
        });

        const headerBottom = TABLE_TOP + HEADER_H;
        let curY = headerBottom;
        blocks.forEach(b => { b.y1 = curY; b.y2 = curY + b.h; curY = b.y2; });
        const tableBottom = curY;

        const canvasH = Math.max(2000, tableBottom + 400);
        const canvas = document.createElement('canvas');
        canvas.width = 1414;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const r = data.recipient || {};
        const reportDate = data.reportDate || new Date();
        const dd = String(reportDate.getDate()).padStart(2, '0');
        const month = reportDate.toLocaleDateString('ru-RU', { month: 'long' });
        const year = String(reportDate.getFullYear());

        ctx.fillStyle = '#111111';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = 'bold 31px ' + serif;
        ctx.fillText('РЕКОМЕНДАЦИИ', canvas.width / 2, 92);
        ctx.fillText('ПО РЕЗУЛЬТАТАМ ПЕРВИЧНОЙ ДИАГНОСТИКИ', canvas.width / 2, 128);

        const recipientLine = [r.fullName, r.birthDateLabel || (r.age ? declAge(r.age) : '')].filter(Boolean).join(', ');
        drawLine(ctx, 185, 230, 1338, 230, 2.1);
        ctx.font = '24px ' + serif;
        ctx.fillText(recipientLine || '', canvas.width / 2, 199);
        ctx.font = '16px ' + serif;
        ctx.fillText('(ФИО реабилитанта, дата рождения)', canvas.width / 2, 237);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '26px ' + serif;

        const diagnosisLabel = 'с имеющий нозологию:';
        const diagnosisValue = normalizeSpaces(r.diagnosis || '');
        const diagnosisY = 276;
        const diagnosisLineY = diagnosisY + 34;
        ctx.fillText(diagnosisLabel, 126, diagnosisY);
        const diagnosisLineX = Math.max(374, 126 + ctx.measureText(diagnosisLabel).width + 14);
        drawLine(ctx, diagnosisLineX, diagnosisLineY, 1338, diagnosisLineY, 1.35);
        if (diagnosisValue) {
          ctx.font = '24px ' + serif;
          ctx.fillText(trimLineToWidth(ctx, diagnosisValue, 1338 - diagnosisLineX - 16), diagnosisLineX + 8, diagnosisY + 1);
        }

        ctx.font = '25px ' + serif;
        const intro = '«' + dd + '» ' + month + ' ' + year + ' г. специалистами Государственного бюджетного учреждения города Москвы «Центр социальной интеграции Дианы Гурцкая» Департамента труда и социальной защиты населения города Москвы (ГБУ ЦСИ Дианы Гурцкая) была проведена первичная реабилитационная диагностика, по результатам которой рекомендовано следующее:';
        drawTextBlock(ctx, intro, 126, 326, 1214, 30, { maxLines: 4 });

        const afkBlock    = blocks.find(b => b.id === 'afk');
        const psyBlock    = blocks.find(b => b.id === 'psy');
        const logBlock    = blocks.find(b => b.id === 'log');
        const culBlocks   = blocks.filter(b => b.dirGroup === 'soc-cul');

        drawRect(ctx, tableX[0], TABLE_TOP, tableX[6] - tableX[0], tableBottom - TABLE_TOP, 1.35);

        drawLine(ctx, tableX[0], headerBottom, tableX[6], headerBottom, 1.15);

        const col1Bottom = afkBlock ? afkBlock.y1 : tableBottom;
        drawLine(ctx, tableX[1], headerBottom, tableX[1], col1Bottom, 1.15);

        [tableX[2], tableX[3], tableX[4], tableX[5]].forEach(x =>
          drawLine(ctx, x, TABLE_TOP, x, tableBottom, 1.15)
        );

        ctx.fillStyle = '#111111';
        drawCenteredBlock(ctx, 'Направления реабилитации', tableX[0], TABLE_TOP, tableX[2], headerBottom, { font: 'bold 28px ' + serif, lineHeight: 30 });
        drawCenteredBlock(ctx, 'Рекомендации',             tableX[2], TABLE_TOP, tableX[3], headerBottom, { font: 'bold 28px ' + serif, lineHeight: 30 });
        drawCenteredBlock(ctx, 'Должность\nспециалиста',   tableX[3], TABLE_TOP, tableX[4], headerBottom, { font: 'bold 26px ' + serif, lineHeight: 28 });
        drawCenteredBlock(ctx, 'ФИО\nспециалиста',         tableX[4], TABLE_TOP, tableX[5], headerBottom, { font: 'bold 26px ' + serif, lineHeight: 28 });
        drawCenteredBlock(ctx, 'Подпись\nспециалиста',     tableX[5], TABLE_TOP, tableX[6], headerBottom, { font: 'bold 26px ' + serif, lineHeight: 28 });

        if (psyBlock) {
          drawRotatedBlock(ctx, psyBlock.direction, tableX[0], psyBlock.y1, tableX[1], psyBlock.y2, { font: 'bold 25px ' + serif, lineHeight: 29 });
          drawLine(ctx, tableX[0], psyBlock.y2, tableX[6], psyBlock.y2, 2.4);
        }
        if (logBlock) {
          drawRotatedBlock(ctx, logBlock.direction, tableX[0], logBlock.y1, tableX[1], logBlock.y2, { font: 'bold 25px ' + serif, lineHeight: 29 });
          drawLine(ctx, tableX[0], logBlock.y2, tableX[6], logBlock.y2, 2.4);
        }
        if (culBlocks.length) {
          const culY1 = culBlocks[0].y1;
          const culY2 = culBlocks[culBlocks.length - 1].y2;
          drawRotatedBlock(ctx, 'Социокультурная\nреабилитация', tableX[0], culY1, tableX[1], culY2, { font: 'bold 25px ' + serif, lineHeight: 31 });
          drawLine(ctx, tableX[0], culY2, tableX[6], culY2, 2.4);

          culBlocks.slice(0, -1).forEach(b =>
            drawLine(ctx, tableX[1], b.y2, tableX[6], b.y2, 2.0)
          );
        }
        if (afkBlock) {

          drawCenteredBlock(ctx, afkBlock.direction, tableX[0], afkBlock.y1, tableX[2], afkBlock.y2, { font: 'bold 24px ' + serif, lineHeight: 27 });
        }

        blocks.forEach(b => {
          ctx.fillStyle = '#111111';

          if (b.sub) {
            ctx.font = 'bold 25px ' + serif;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(b.sub, tableX[1] + 12, b.y1 + 8);
          }

          if (b.recs && b.recs.trim()) {
            ctx.font = '17px ' + serif;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            const recMaxW   = tableX[3] - tableX[2] - 18;
            const recLineH  = 21;
            const recPad    = 9;
            const recMaxLines = Math.floor((b.h - recPad * 2) / recLineH);
            const allLines = [];
            b.recs.split('\n').forEach((para, pi) => {
              if (!para.trim()) return;
              if (pi > 0 && allLines.length) allLines.push('');
              allLines.push(...wrapLines(ctx, para, recMaxW));
            });
            let recY = b.y1 + recPad;
            allLines.slice(0, recMaxLines).forEach(line => {
              if (line) ctx.fillText(line, tableX[2] + 9, recY);
              recY += recLineH;
            });
          }

          drawCenteredBlock(ctx, b.pos, tableX[3], b.y1, tableX[4], b.y2, { font: '22px ' + serif, lineHeight: 26 });

          const names = (b.specialists && b.specialists.length) ? b.specialists : [''];
          names.forEach((name, si) => {
            const ry1 = b.y1 + si * ROW_H;
            const ry2 = ry1 + ROW_H;
            drawCenteredBlock(ctx, name, tableX[4], ry1, tableX[5], ry2, { font: '25px ' + serif, lineHeight: 28 });

            if (si < names.length - 1) {
              drawLine(ctx, tableX[4], ry2, tableX[6], ry2, 1.0);
            }
          });
        });

        const fY = tableBottom;
        ctx.fillStyle = '#111111';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.font = '26px ' + serif;
        ctx.fillText('С рекомендациями ознакомлен(а):', 202, fY + 43);
        drawLine(ctx, 201, fY + 128, 642,  fY + 128, 1.35);
        drawLine(ctx, 705, fY + 128, 1305, fY + 128, 1.35);
        ctx.font = 'italic 23px ' + serif;
        ctx.textAlign = 'center';
        ctx.fillText('(подпись реабилитанта/',          421,  fY + 140);
        ctx.fillText('его законного представителя)',     421,  fY + 170);
        ctx.fillText('(Фамилия, Имя, Отчество)',        1005, fY + 170);
        ctx.font = '23px ' + serif;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        const consentDateY = fY + 236;
        const consentLineY = consentDateY + 28;
        ctx.fillText('«', 202, consentDateY);
        drawLine(ctx, 225, consentLineY, 330, consentLineY, 1.15);
        ctx.fillText('»', 338, consentDateY);
        drawLine(ctx, 382, consentLineY, 555, consentLineY, 1.15);
        ctx.fillText('20', 565, consentDateY);
        drawLine(ctx, 596, consentLineY, 663, consentLineY, 1.15);
        ctx.fillText('г.', 674, consentDateY);

        return [canvas];
      }

      function jpegBinaryFromCanvas(canvas) {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        return atob(dataUrl.split(',')[1]);
      }

      function buildPdfFromCanvases(canvases) {
        const pageW = 595.28;
        const pageH = 841.89;
        const objects = ['', ''];
        const pageIds = [];

        canvases.forEach((canvas, i) => {
          const imgData = jpegBinaryFromCanvas(canvas);
          const imgId = objects.length + 1;
          objects.push('<< /Type /XObject /Subtype /Image /Width ' + canvas.width + ' /Height ' + canvas.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + imgData.length + ' >>\nstream\n' + imgData + '\nendstream');
          const content = 'q\n' + pageW + ' 0 0 ' + pageH + ' 0 0 cm\n/Im' + i + ' Do\nQ';
          const contentId = objects.length + 1;
          objects.push('<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream');
          const pageId = objects.length + 1;
          objects.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im' + i + ' ' + imgId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>');
          pageIds.push(pageId);
        });

        objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
        objects[1] = '<< /Type /Pages /Kids [' + pageIds.map(id => id + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>';

        let pdf = '%PDF-1.3\n%\xE2\xE3\xCF\xD3\n';
        const offsets = [0];
        objects.forEach((obj, idx) => {
          offsets[idx + 1] = pdf.length;
          pdf += (idx + 1) + ' 0 obj\n' + obj + '\nendobj\n';
        });
        const xrefOffset = pdf.length;
        pdf += 'xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n';
        for (let i = 1; i <= objects.length; i++) {
          pdf += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
        }
        pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF';
        const bytes = new Uint8Array(pdf.length);
        for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
        return new Blob([bytes], { type: 'application/pdf' });
      }

      function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      function safeFileName(value) {
        return normalizeSpaces(value).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_') || 'diagnostika';
      }

      function downloadReportPdf() {
        if (!diagnosticsRuntime.completed && !finishDiagnostic()) return;
        const data = collectReportData();
        diagnosticsRuntime.lastReportData = data;
        const canvases = drawReportCanvases(data);
        const blob = buildPdfFromCanvases(canvases);
        downloadBlob(blob, 'rekomendacii_po_diagnostike_' + safeFileName(data.recipient.fullName) + '.pdf');
        showToast('PDF-отчёт сформирован и скачивается');
      }

      q('[data-action="finish-diagnostic"]')?.addEventListener('click', async () => {
        const finalCard = q('.stage-card[data-stage="final"]');
        if (finalCard &&
            !finalCard.classList.contains('profile-hidden') &&
            finalCard.dataset.status !== 'done') {
          if (!(await submitConclusion(null))) return;
        }
        const ok = finishDiagnostic();
        if (!ok) return;
        if (authStore.isTeacher && !window.__forcedProfileKey) {
          const key = selectedAssignmentProfileKey();
          if (key) window.__forcedProfileKey = key;
        }
        await persistResultToAssignment();
      });
      q('#assignment-target')?.addEventListener('change', () => {
        applyProfileRestriction(selectedAssignmentProfileKey());
      });
      q('[data-action="download-pdf"]')?.addEventListener('click', downloadReportPdf);
      document.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="edit-stage"], [data-action="edit-subblock"]')) setDiagnosticCompleted(false);
      });
      setDiagnosticCompleted(false);
    })();

    (function() {

      document.querySelectorAll('#subpanel-izo .three-points').forEach((grp, idx) => {
        const buttons = grp.querySelectorAll('.point-btn');
        buttons.forEach((b, i) => b.dataset.val = String(i + 1));
      });
      function updateIzoTotal() {
        let sum = 0;
        document.querySelectorAll('#subpanel-izo .three-points').forEach(grp => {
          const active = grp.querySelector('.point-btn.active');
          if (active && active.dataset.val) sum += parseInt(active.dataset.val, 10);
        });
        const out = document.querySelector('#subpanel-izo .subpanel-head .right .pp');
        if (out) {
          const of = out.querySelector('.of');
          out.firstChild && (out.firstChild.textContent = sum + ' ');
          if (of) out.appendChild(of);
        }
      }
      document.querySelectorAll('#subpanel-izo .three-points .point-btn').forEach(btn => {
        btn.addEventListener('click', () => setTimeout(updateIzoTotal, 0));
      });
      updateIzoTotal();
      window.__updateIzoTotal = updateIzoTotal;

      function updateVocalTotal() {
        let sum = 0;
        document.querySelectorAll('#subpanel-vocal .scale-row').forEach(row => {
          const active = row.querySelector('.scale-tick.active');
          if (active && active.dataset.val) sum += parseInt(active.dataset.val, 10);
        });
        const out = document.querySelector('#subpanel-vocal .subpanel-head .right .pp');
        if (out) {
          const of = out.querySelector('.of');
          out.firstChild && (out.firstChild.textContent = sum + ' ');
          if (of) out.appendChild(of);
        }
      }
      document.querySelectorAll('#subpanel-vocal .scale-tick').forEach(t => {
        t.addEventListener('click', () => setTimeout(updateVocalTotal, 0));
      });
      updateVocalTotal();
      window.__updateVocalTotal = updateVocalTotal;
    })();

    (function() {
      const root = document.querySelector('.diagnostics-page') || document.documentElement;
      const hero = document.querySelector('.hero');
      const heroSentinel = document.querySelector('.hero-sticky-sentinel');
      const topbar = document.querySelector('.topbar, .app-topbar, .layout-topbar, header[role="banner"]');
      const stageCards = Array.from(document.querySelectorAll('.stage-card'));
      const sideNavItems = Array.from(document.querySelectorAll('.side-nav-item'));
      if (!hero) return;

      let topbarH = 0, heroH = 0, socHeadH = 0, socSubtabsH = 0;
      let stickOffset = 0, stickOffsetInner = 0, stickOffsetSubhead = 0;

      const socCard      = document.querySelector('.stage-card[data-stage="soc"]');
      const socSubtabs   = socCard ? socCard.querySelector('.subtabs-wrap') : null;
      const socHead      = socCard ? socCard.querySelector('.stage-head-clickable') : null;

      const stageHeads = stageCards.map(card => card.querySelector(':scope > .stage-head-clickable'));

      function recomputeHeights() {
        topbarH = topbar ? topbar.offsetHeight : 0;
        heroH = hero.offsetHeight;
        socHeadH = socHead ? socHead.offsetHeight : 0;
        socSubtabsH = socSubtabs ? socSubtabs.offsetHeight : 0;

        const prevStickOffset = stickOffset;
        stickOffset = topbarH + heroH;
        const socHeadVisible = socCard && !socCard.classList.contains('collapsed');
        stickOffsetInner = stickOffset + (socHeadVisible ? socHeadH : 0);
        stickOffsetSubhead = stickOffsetInner + (socHeadVisible ? socSubtabsH : 0);

        root.style.setProperty('--stick-offset', stickOffset + 'px');
        root.style.setProperty('--stick-offset-inner', stickOffsetInner + 'px');
        root.style.setProperty('--stick-offset-subhead', stickOffsetSubhead + 'px');

        if (Math.abs(stickOffset - prevStickOffset) > 4) {
          buildSpyObserver();
        }
      }

      let heroStuck = false;
      if ('IntersectionObserver' in window && heroSentinel) {
        const io = new IntersectionObserver((entries) => {
          for (const entry of entries) {

            const shouldStick = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            if (shouldStick !== heroStuck) {
              heroStuck = shouldStick;
              hero.classList.toggle('is-stuck', shouldStick);
            }
          }
        }, { rootMargin: '0px 0px -100% 0px', threshold: 0 });
        io.observe(heroSentinel);
      }

      let activePanel = null;
      let activeSubhead = null;

      function updateStuckStates() {

        for (let i = 0; i < stageCards.length; i++) {
          const card = stageCards[i];
          if (card.classList.contains('collapsed')) {
            if (card.classList.contains('head-stuck')) card.classList.remove('head-stuck');
            continue;
          }
          const head = stageHeads[i];
          if (!head) continue;
          const top = head.getBoundingClientRect().top;
          const stuck = Math.abs(top - stickOffset) < 2 && top <= stickOffset + 2;
          if (stuck !== card.classList.contains('head-stuck')) {
            card.classList.toggle('head-stuck', stuck);
          }
        }

        if (socCard && socSubtabs && !socCard.classList.contains('collapsed')) {
          const top = socSubtabs.getBoundingClientRect().top;
          const stuck = Math.abs(top - stickOffsetInner) < 2;
          if (stuck !== socCard.classList.contains('subtabs-stuck')) {
            socCard.classList.toggle('subtabs-stuck', stuck);
          }

          if (activePanel && activeSubhead) {
            const rr = activeSubhead.getBoundingClientRect().top;
            const subStuck = Math.abs(rr - stickOffsetSubhead) < 2;
            if (subStuck !== activePanel.classList.contains('is-subhead-stuck')) {
              activePanel.classList.toggle('is-subhead-stuck', subStuck);
            }
          }
        }
      }

      function refreshActiveSubpanel() {
        activePanel = socCard ? socCard.querySelector('.subpanel.active') : null;
        activeSubhead = activePanel ? activePanel.querySelector('.subpanel-head') : null;
      }

      const sectionNameEl = document.getElementById('hero-section-name');
      const stageNameCache = new Map();
      stageCards.forEach(card => {
        const t = card.querySelector('.stage-info .title');
        if (t) stageNameCache.set(card.dataset.stage, t.textContent.trim());
      });

      const visibleCards = new Set();
      let currentActiveKey = null;
      let spyIO = null;

      function pickActiveStage() {

        let bestKey = null;
        let bestTop = Infinity;
        for (const card of visibleCards) {
          const top = card.getBoundingClientRect().top;
          if (top < bestTop) {
            bestTop = top;
            bestKey = card.dataset.stage;
          }
        }

        if (!bestKey) {
          const probeY = stickOffset + 24;
          let bestBottom = -Infinity;
          for (const card of stageCards) {
            const r = card.getBoundingClientRect();
            if (r.bottom <= probeY && r.bottom > bestBottom) {
              bestBottom = r.bottom;
              bestKey = card.dataset.stage;
            }
          }
        }
        if (!bestKey && stageCards.length) bestKey = stageCards[0].dataset.stage;
        if (bestKey === currentActiveKey) return;
        currentActiveKey = bestKey;

        const expected = '#stage-' + bestKey;
        for (const a of sideNavItems) {
          const isActive = a.getAttribute('href') === expected;
          if (isActive !== a.classList.contains('active')) {
            a.classList.toggle('active', isActive);
          }
        }
        if (sectionNameEl) {
          const newName = stageNameCache.get(bestKey) || '';
          if (sectionNameEl.textContent !== newName) sectionNameEl.textContent = newName;
        }
      }

      function buildSpyObserver() {
        if (spyIO) spyIO.disconnect();
        if (!('IntersectionObserver' in window) || !stageCards.length) return;

        const topCut = Math.max(0, stickOffset);
        spyIO = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visibleCards.add(entry.target);
            else visibleCards.delete(entry.target);
          }
          pickActiveStage();
        }, {
          rootMargin: `-${topCut}px 0px -85% 0px`,
          threshold: 0
        });
        stageCards.forEach(c => spyIO.observe(c));
      }

      let ticking = false;
      function tick() {
        ticking = false;
        updateStuckStates();
      }
      function onScroll() {
        if (!ticking) {
          requestAnimationFrame(tick);
          ticking = true;
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true });

      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => {
          recomputeHeights();

          if (!ticking) {
            requestAnimationFrame(tick);
            ticking = true;
          }
        });
        ro.observe(hero);
        if (topbar) ro.observe(topbar);
        if (socHead) ro.observe(socHead);
        if (socSubtabs) ro.observe(socSubtabs);
      }
      window.addEventListener('resize', () => {
        recomputeHeights();
        if (!ticking) { requestAnimationFrame(tick); ticking = true; }
      }, { passive: true });

      if (socCard) {
        const subMo = new MutationObserver(() => {
          refreshActiveSubpanel();
          recomputeHeights();
        });
        subMo.observe(socCard, { attributes: true, attributeFilter: ['class'], subtree: true });
      }

      const mo = new MutationObserver(() => {
        recomputeHeights();
        if (!ticking) { requestAnimationFrame(tick); ticking = true; }
      });
      stageCards.forEach(c => mo.observe(c, { attributes: true, attributeFilter: ['class'] }));

      refreshActiveSubpanel();
      requestAnimationFrame(() => {
        recomputeHeights();
        buildSpyObserver();

        pickActiveStage();
        requestAnimationFrame(tick);
      });
    })();

    (function () {
      const AUTHOR_EMPTY = 'Исполнитель не назначен';
      const CHIP_COLORS = {
        psy: 'sage', log: 'teal', izo: 'plum',
        theatre: 'amber', vocal: 'teal', instrument: 'teal', afk: 'rose'
      };

      const profileOf = (b) => b?.profileKey || b?.direction?.profileKey || '';
      const nameOf = (b) => normalizeSpaces(b?.specialistName || b?.specialist?.fullName || '');

      function uniqueNames(names) {
        const seen = new Set();
        const out = [];
        names.forEach((name) => {
          if (!name || seen.has(name)) return;
          seen.add(name);
          out.push(name);
        });
        return out;
      }

      function blocksFor(profiles) {
        const wanted = String(profiles || '').split(/\s+/).filter(Boolean);
        if (!wanted.length) return [];
        return (diagnosticsRuntime.blocks || []).filter((b) => wanted.includes(profileOf(b)));
      }

      function authorsText(profiles) {
        const list = blocksFor(profiles);
        const done = uniqueNames(list.filter((b) => b.blockStatus === 'completed').map(nameOf));
        if (done.length) return (done.length > 1 ? 'Заполнили: ' : 'Заполнил: ') + done.join(' · ');
        const assigned = uniqueNames(list.map(nameOf));
        if (assigned.length) return (assigned.length > 1 ? 'Заполняют: ' : 'Заполняет: ') + assigned.join(' · ');
        return AUTHOR_EMPTY;
      }

      function initialsOf(name) {
        const parts = normalizeSpaces(name).split(' ').filter(Boolean);
        if (!parts.length) return '—';
        return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
      }

      function shortName(name) {
        const parts = normalizeSpaces(name).split(' ').filter(Boolean);
        if (!parts.length) return '';
        if (parts.length === 1) return parts[0];
        return parts[0] + ' ' + parts[1][0].toUpperCase() + '.';
      }

      function namesFor(profiles) {
        return uniqueNames(blocksFor(profiles).map(nameOf));
      }

      function renderStageSpecialists() {
        document.querySelectorAll('[data-role="stage-specialists"]').forEach((el) => {
          const names = namesFor(el.dataset.profile);
          el.textContent = names.length ? names.join(' · ') : 'Специалисты не назначены';
        });
        document.querySelectorAll('[data-role="stage-specialists-short"]').forEach((el) => {
          const names = namesFor(el.dataset.profile);
          el.textContent = names.length
            ? shortName(names[0]) + (names.length > 1 ? ' +' + (names.length - 1) : '')
            : 'нет назначений';
        });
        document.querySelectorAll('[data-role="conclusion-author"]').forEach((el) => {
          const author = normalizeSpaces(diagnosticsRuntime.conclusion?.authorName || '');
          el.textContent = author ? shortName(author) : 'не выдано';
        });
      }

      function renderStageAuthors() {
        const list = document.querySelector('[data-role="stage-authors"]');
        if (!list) return;
        const seen = new Set();
        const chips = [];
        (diagnosticsRuntime.blocks || [])
          .filter((b) => b.blockStatus === 'completed')
          .forEach((b) => {
            const name = nameOf(b);
            if (!name || seen.has(name)) return;
            seen.add(name);
            chips.push(
              '<span class="specialist-chip ' + (CHIP_COLORS[profileOf(b)] || '') + '" role="listitem">' +
              '<span class="av" aria-hidden="true">' + escapeHtml(initialsOf(name)) + '</span>' +
              escapeHtml(name) +
              '</span>'
            );
          });
        list.innerHTML = chips.length
          ? chips.join('')
          : '<span class="specialists-empty">Пока ни один блок не заполнен</span>';
      }

      function renderBlockAuthors() {
        document.querySelectorAll('[data-role="block-authors"]').forEach((el) => {
          el.textContent = authorsText(el.dataset.profile);
        });
        renderStageSpecialists();
        renderStageAuthors();
      }

      window.__renderBlockAuthors = renderBlockAuthors;
      renderBlockAuthors();
    })();

    (function () {
      const PEERS_POLL_MS = 15000;

      const PEER_PROFILE_TITLES = {
        psy: 'Психолог', log: 'Логопед', afk: 'АФК', izo: 'ИЗО',
        vocal: 'Вокал', instrument: 'Инструменты', theatre: 'Театр'
      };
      const PEER_STAGE_OF = {
        psy: 'psy', log: 'psy', afk: 'afk',
        izo: 'soc', theatre: 'soc', vocal: 'soc', instrument: 'soc'
      };
      const PEER_STAGE_TITLES = {
        psy: '01 · Психолог + логопед',
        afk: '02 · АФК',
        soc: '03 · Социокультурная'
      };
      const PEER_STAGE_ORDER = { psy: 1, afk: 2, soc: 3 };
      const PEER_ACCENTS = {
        psy: 'blue', log: 'sage', afk: 'rose',
        izo: 'plum', theatre: 'amber', vocal: 'teal', instrument: 'teal'
      };

      const openedPeers = new Set();

      function pqa(selector, root) {
        return Array.from((root || document).querySelectorAll(selector));
      }

      const peerProfileOf = (b) => b?.profileKey || b?.direction?.profileKey || '';
      const peerNameOf = (b) => normalizeSpaces(b?.specialistName || b?.specialist?.fullName || '') || 'Специалист не назначен';

      function peerInitials(name) {
        const parts = normalizeSpaces(name).split(' ').filter(Boolean);
        if (!parts.length) return '—';
        return ((parts[0][0] || '') + (parts[1] ? parts[1][0] : '')).toUpperCase();
      }

      function cleanText(el, extra) {
        if (!el) return '';
        const node = el.cloneNode(true);
        const sels = ['svg', 'input', '.sr-only', '.ss-icon'].concat(extra || []);
        node.querySelectorAll(sels.join(', ')).forEach((n) => n.remove());
        return normalizeSpaces(node.textContent || '');
      }

      function tidyMultiline(value) {
        return String(value || '')
          .split(/\r?\n/)
          .map((line) => line.replace(/[ \t]+/g, ' ').trim())
          .filter(Boolean)
          .join('\n');
      }

      function valueLabel(el) {
        if (!el) return '';
        if (el.classList.contains('scale-tick')) {
          const v = el.getAttribute('data-val');
          return (v === null ? cleanText(el) : v) + ' из 10';
        }
        if (el.classList.contains('point-btn')) {
          const pn = cleanText(el.querySelector('.pn'));
          const body = cleanText(el, ['.pn']);
          return pn ? body + ' (' + pn + ')' : body;
        }
        if (el.classList.contains('level-card')) {
          return cleanText(el.querySelector('.ln'), ['.badge-num']) || cleanText(el, ['.ld']);
        }
        if (el.classList.contains('gmfcs-card')) {
          const name = cleanText(el.querySelector('.lvname'));
          return name || cleanText(el, ['.lv', '.lvdesc']);
        }
        if (el.classList.contains('theatre-option')) {
          return cleanText(el.querySelector('.lvl')) || cleanText(el, ['.desc']);
        }
        if (el.classList.contains('verdict-option')) {
          return cleanText(el.querySelector('.vt')) || cleanText(el, ['.vs']);
        }
        return cleanText(el, ['.chip-check']);
      }

      function questionLabel(el) {
        const row = el.closest('.test-row, .izo-row, .theatre-row, .scale-row');
        if (row) {
          const t = row.querySelector('.tn, .it, .tq, .scale-name');
          if (t) return cleanText(t);
        }
        const grp = el.closest('.qgroup');
        if (grp) {
          const lab = grp.querySelector('.qlabel-text');
          if (lab) return cleanText(lab);
          const legend = grp.querySelector('legend:not(.sr-only)');
          if (legend) return cleanText(legend);
        }
        const control = el.closest('[aria-label]');
        if (control) return normalizeSpaces(control.getAttribute('aria-label'));
        return '';
      }

      function sectionNodeOf(el, root) {
        const sub = el.closest('.sub-section');
        if (sub && root.contains(sub)) return sub;
        const panel = el.closest('.subpanel');
        if (panel && root.contains(panel)) return panel;
        return root;
      }

      function sectionTitleOf(node) {
        if (!node || !node.querySelector) return '';
        if (node.classList && node.classList.contains('sub-section')) {
          return cleanText(node.querySelector('.sub-section-title'));
        }
        if (node.classList && node.classList.contains('subpanel')) {
          return cleanText(node.querySelector('.subpanel-head .t'));
        }
        return cleanText(node.querySelector('.stage-info .title'));
      }

      function peerRootFor(scope) {
        return typeof window.__blockRootForProfile === 'function'
          ? window.__blockRootForProfile(scope)
          : null;
      }

      function recsFromFormState(fs) {
        const selectors = window.__formSelectors;
        if (!selectors || !fs || !Array.isArray(fs.txt)) return '';
        const root = peerRootFor(fs.scope);
        if (!root) return '';
        const els = pqa(selectors.FORM_TXT, root);
        return tidyMultiline(
          fs.txt
            .map((val, i) => (els[i] && els[i].tagName === 'TEXTAREA' ? String(val || '') : ''))
            .filter((v) => v.trim())
            .join('\n')
        );
      }

      function describeFormState(fs) {
        const selectors = window.__formSelectors;
        if (!selectors || !fs || !Array.isArray(fs.sel)) return [];
        const root = peerRootFor(fs.scope);
        if (!root) return [];
        const els = pqa(selectors.FORM_SEL, root);
        const sections = [];
        const secMap = new Map();
        const itemMap = new Map();

        fs.sel.forEach((on, i) => {
          if (!on) return;
          const el = els[i];
          if (!el) return;
          const value = valueLabel(el);
          if (!value) return;

          const secNode = sectionNodeOf(el, root);
          let section = secMap.get(secNode);
          if (!section) {
            section = { title: sectionTitleOf(secNode), items: [] };
            secMap.set(secNode, section);
            sections.push(section);
          }

          const qNode = el.closest('.test-row, .izo-row, .theatre-row, .scale-row, .qgroup') || el.parentElement;
          let item = itemMap.get(qNode);
          if (!item) {
            item = { q: questionLabel(el) || 'Без названия', values: [] };
            itemMap.set(qNode, item);
            section.items.push(item);
          }
          if (!item.values.includes(value)) item.values.push(value);
        });

        return sections.filter((s) => s.items.length);
      }

      function describeCriteria(profileKey, criteria) {
        const block = getDiagBlock(profileKey);
        if (!block || !criteria) return [];
        const items = [];
        block.criteria.forEach((c) => {
          const raw = criteria[c.id];
          if (raw === null || raw === undefined || raw === '') return;
          const point = DIAG_SCALE.find((s) => Number(s.value) === Number(raw));
          items.push({ q: c.label, values: [(point ? point.label : String(raw)) + ' (' + raw + ')'] });
        });
        return items.length ? [{ title: block.label, items }] : [];
      }

      function peerParams(b) {
        const res = b && b.results;
        if (!res) return [];
        const fromForm = describeFormState(res.formState);
        if (fromForm.length) return fromForm;
        return describeCriteria(peerProfileOf(b), res.criteria);
      }

      function peerRecommendation(b) {
        const res = b && b.results;
        const profile = peerProfileOf(b);
        if (res && Array.isArray(res.blocks)) {
          const found = res.blocks.find((x) => x && x.id === profile);
          const recs = tidyMultiline(found && found.recs);
          if (recs) return recs;
        }
        const fromForm = recsFromFormState(res && res.formState);
        if (fromForm) return fromForm;
        return tidyMultiline((res && res.comment) || (b && b.comment) || '');
      }

      function countParams(sections) {
        return sections.reduce((sum, s) => sum + s.items.length, 0);
      }

      function peerWhen(b) {
        if (b.blockStatus === 'completed' && b.completedAt) {
          const d = new Date(b.completedAt);
          if (!Number.isNaN(d.getTime())) {
            return 'Завершено ' + d.toLocaleString('ru-RU', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            });
          }
        }
        if (b.startTime) return 'Приём в ' + String(b.startTime).slice(0, 5);
        return '';
      }

      function peerSortKey(b) {
        const profile = peerProfileOf(b);
        const stage = PEER_STAGE_OF[profile] || 'soc';
        return (PEER_STAGE_ORDER[stage] || 9) * 10 + (b.blockStatus === 'completed' ? 0 : 1);
      }

      function paramsHtml(sections) {
        return sections.map((sec) => (
          '<section class="peer-sec">' +
          (sec.title ? '<h4 class="peer-sec-title">' + escapeHtml(sec.title) + '</h4>' : '') +
          '<div class="peer-sec-list">' +
          sec.items.map((it) => (
            '<div class="peer-param">' +
            '<span class="peer-param-q">' + escapeHtml(it.q) + '</span>' +
            '<span class="peer-param-v">' +
            it.values.map((v) => '<span class="peer-val">' + escapeHtml(v) + '</span>').join('') +
            '</span>' +
            '</div>'
          )).join('') +
          '</div></section>'
        )).join('');
      }

      function peerCardHtml(b) {
        const profile = peerProfileOf(b);
        const stage = PEER_STAGE_OF[profile] || '';
        const accent = PEER_ACCENTS[profile] || 'sage';
        const done = b.blockStatus === 'completed';
        const hidden = b.resultsHidden === true;
        const name = peerNameOf(b);
        const id = String(b.id);
        const open = openedPeers.has(id);

        const metaParts = [PEER_PROFILE_TITLES[profile] || 'Специалист'];
        if (PEER_STAGE_TITLES[stage]) metaParts.push(PEER_STAGE_TITLES[stage]);
        if (b.cabinet) metaParts.push('каб. ' + b.cabinet);

        let main;
        let foot;
        if (hidden) {
          main =
            '<div class="peer-lock">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
            '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
            '<span>Результаты этого специалиста вам не видны. Право на просмотр результатов других педагогов выдаёт администратор.</span>' +
            '</div>';
          foot = '';
        } else {
          const rec = peerRecommendation(b);
          const sections = peerParams(b);
          const total = countParams(sections);

          main =
            '<div class="peer-main">' +
            '<span class="peer-lead-label">Общая рекомендация</span>' +
            (rec
              ? '<div class="peer-lead">' + tidyMultiline(rec).split('\n').map((line) => '<p>' + escapeHtml(line) + '</p>').join('') + '</div>'
              : '<p class="peer-lead is-empty">' + (done ? 'Специалист завершил блок, но текст рекомендации не заполнил.' : 'Рекомендация ещё не заполнена — блок в работе.') + '</p>') +
            '</div>';

          foot =
            '<div class="peer-foot">' +
            (total
              ? '<button type="button" class="peer-toggle" data-peer-toggle="' + escapeHtml(id) + '" aria-expanded="' + (open ? 'true' : 'false') + '" aria-controls="peer-params-' + escapeHtml(id) + '">' +
                '<svg class="peer-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>' +
                '<span class="peer-toggle-label">' + (open ? 'Скрыть параметры' : 'Все параметры') + '</span>' +
                '<span class="peer-toggle-count">' + total + '</span>' +
                '</button>'
              : '<span class="peer-noparams">Параметры пока не заполнены</span>') +
            '<span class="peer-when">' + escapeHtml(peerWhen(b)) + '</span>' +
            '</div>' +
            (total
              ? '<div class="peer-params" id="peer-params-' + escapeHtml(id) + '"' + (open ? '' : ' hidden') + '>' + paramsHtml(sections) + '</div>'
              : '');
        }

        return (
          '<article class="peer-card accent-' + accent + (done ? ' is-done' : '') + (hidden ? ' is-locked' : '') + '" data-peer-id="' + escapeHtml(id) + '">' +
          '<header class="peer-head">' +
          '<span class="peer-av" aria-hidden="true">' + escapeHtml(peerInitials(name)) + '</span>' +
          '<span class="peer-id">' +
          '<span class="peer-name">' + escapeHtml(name) + '</span>' +
          '<span class="peer-meta">' + escapeHtml(metaParts.join(' · ')) + '</span>' +
          '</span>' +
          '<span class="peer-state' + (done ? ' is-done' : '') + '">' + (done ? 'Завершён' : 'В работе') + '</span>' +
          '</header>' +
          main + foot +
          '</article>'
        );
      }

      function renderPeers() {
        const panel = document.getElementById('peers-panel');
        if (!panel) return;
        const body = panel.querySelector('[data-role="peers-body"]');
        if (!body) return;

        const list = (diagnosticsRuntime.blocks || [])
          .filter((b) => b && b.isMine !== true)
          .slice()
          .sort((a, b) => peerSortKey(a) - peerSortKey(b));

        const doneCount = list.filter((b) => b.blockStatus === 'completed').length;

        const countEl = panel.querySelector('[data-role="peers-count"]');
        if (countEl) {
          countEl.textContent = list.length
            ? 'заполнено ' + doneCount + ' из ' + list.length
            : '';
        }

        const navNote = document.querySelector('[data-role="peers-nav-note"]');
        if (navNote) {
          navNote.textContent = list.length ? doneCount + ' из ' + list.length : 'нет коллег';
        }
        const navStatus = document.querySelector('[data-role="peers-nav-status"]');
        if (navStatus) {
          navStatus.className = 'sni-status ' + (!list.length ? 'empty' : (doneCount === list.length ? 'done' : 'progress'));
        }

        if (!list.length) {
          body.innerHTML =
            '<div class="peers-empty">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
            '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>' +
            '<path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
            '<p>По этому реабилитанту других специалистов пока нет. Как только коллеги возьмут свои блоки, их результаты появятся здесь автоматически.</p>' +
            '</div>';
          return;
        }

        body.innerHTML = list.map(peerCardHtml).join('');
      }

      window.__renderPeers = renderPeers;

      if (peersClickHandler) document.removeEventListener('click', peersClickHandler);
      peersClickHandler = (e) => {
        const btn = e.target.closest?.('[data-peer-toggle]');
        if (!btn) return;
        const id = btn.getAttribute('data-peer-toggle');
        const box = document.getElementById('peer-params-' + id);
        if (!box) return;
        const willOpen = box.hasAttribute('hidden');
        if (willOpen) {
          box.removeAttribute('hidden');
          openedPeers.add(id);
        } else {
          box.setAttribute('hidden', '');
          openedPeers.delete(id);
        }
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        const label = btn.querySelector('.peer-toggle-label');
        if (label) label.textContent = willOpen ? 'Скрыть параметры' : 'Все параметры';
        btn.closest('.peer-card')?.classList.toggle('is-open', willOpen);
      };
      document.addEventListener('click', peersClickHandler);

      async function refreshPeers() {
        if (!document.getElementById('peers-panel')) return;
        if (document.hidden) return;
        const recipientId = diagnosticsRuntime.currentRecipient?.id;
        if (!recipientId) return;
        try {
          const { data } = await api.get('/schedule/sessions', { params: { recipientId } });
          const live = (Array.isArray(data) ? data : []).filter((s) => s.status !== 'cancelled');
          if (!live.length) return;
          const target = live.reduce((a, b) => (Number(b.id) > Number(a.id) ? b : a));
          if (diagnosticsRuntime.sessionId && Number(target.id) !== Number(diagnosticsRuntime.sessionId)) return;
          diagnosticsRuntime.blocks = target.blocks || [];
          renderPeers();
          if (typeof window.__renderBlockAuthors === 'function') window.__renderBlockAuthors();
        } catch (_) {
        }
      }

      renderPeers();
      if (isTeacher.value) {
        peersPoller = window.setInterval(refreshPeers, PEERS_POLL_MS);
        if (peersVisibilityHandler) document.removeEventListener('visibilitychange', peersVisibilityHandler);
        peersVisibilityHandler = () => {
          if (!document.hidden) refreshPeers();
        };
        document.addEventListener('visibilitychange', peersVisibilityHandler);
      }
    })();
    });

onUnmounted(() => {
  document.documentElement.style.removeProperty('--bg-app');
  document.documentElement.style.removeProperty('--fab-offset');
  window.__forcedProfileKey = '';
  window.__openRecipientPicker = null;
  window.__renderPeers = null;
  window.__reloadDiagnosticSession = null;
  if (peersPoller) {
    clearInterval(peersPoller);
    peersPoller = null;
  }
  if (peersClickHandler) {
    document.removeEventListener('click', peersClickHandler);
    peersClickHandler = null;
  }
  if (peersVisibilityHandler) {
    document.removeEventListener('visibilitychange', peersVisibilityHandler);
    peersVisibilityHandler = null;
  }
  if (employeeReadonlyGuards) {
    employeeReadonlyGuards.forEach(([evt, fn]) => document.removeEventListener(evt, fn, true));
    employeeReadonlyGuards = null;
  }
});

</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap");

.content.is-gated > *:not(.diag-gate) { display: none !important; }
.diag-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 2rem 1rem;
}
.diag-gate-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3rem;
  max-width: 1040px;
  width: 100%;
  padding: 3.875rem 4.25rem;
  background:
    radial-gradient(120% 150% at 14% 50%, var(--sage-50, #EEF4E2) 0%, rgba(238, 244, 226, 0) 55%),
    var(--paper, #fff);
  border: 1px solid var(--line, #E4DECF);
  border-radius: 30px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.7) inset,
    0 2px 4px rgba(30, 47, 30, 0.04),
    0 32px 64px -32px rgba(30, 47, 30, 0.32);
}
.diag-gate-iconwrap {
  flex: none;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: radial-gradient(circle, rgba(95, 126, 69, 0.16) 0%, rgba(95, 126, 69, 0.06) 54%, rgba(95, 126, 69, 0) 72%);
}
.diag-gate-icon {
  width: 152px;
  height: 152px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(155deg, var(--sage-500, #5F7E45) 0%, var(--sage-900, #1E2F1E) 100%);
  box-shadow: 0 20px 40px -14px rgba(30, 47, 30, 0.5);
}
.diag-gate-icon svg { width: 68px; height: 68px; }
.diag-gate-body {
  min-width: 0;
  text-align: left;
}
.diag-gate-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ink-strong, #0F140F);
  letter-spacing: -0.02em;
  margin: 0 0 0.75rem;
}
.diag-gate-text {
  font-size: 1.0625rem;
  color: var(--ink-subtle, #6E7368);
  line-height: 1.6;
  max-width: 460px;
  margin: 0 0 1.875rem;
}
.diag-gate-actions {
  display: flex;
  align-items: center;
  gap: 1.375rem;
  flex-wrap: wrap;
  margin-left: 2rem;
}
.diag-gate-btn.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9375rem 1.875rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 14px;
  box-shadow: 0 12px 24px -12px rgba(30, 47, 30, 0.55);
  transition: background 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease;
}
.diag-gate-btn.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 30px -12px rgba(30, 47, 30, 0.62);
}
.diag-gate-btn.btn-primary:active { transform: translateY(0); }
.diag-gate-btn svg { width: 18px; height: 18px; }

@media (max-width: 700px) {
  .diag-gate-card {
    flex-direction: column;
    gap: 1.75rem;
    text-align: center;
    padding: 2.5rem 1.75rem;
  }
  .diag-gate-body { text-align: center; }
  .diag-gate-text { margin-left: auto; margin-right: auto; }
  .diag-gate-actions { justify-content: center; margin-left: 0; }
  .diag-gate-iconwrap { width: 168px; height: 168px; }
  .diag-gate-icon { width: 128px; height: 128px; }
  .diag-gate-icon svg { width: 56px; height: 56px; }
}

.diagnostics-page.diag-readonly .content [data-action="save-draft"],
.diagnostics-page.diag-readonly .content [data-action="finish-stage"],
.diagnostics-page.diag-readonly .content [data-action="finish-subblock"],
.diagnostics-page.diag-readonly .content [data-action="edit-stage"],
.diagnostics-page.diag-readonly .content [data-action="edit-subblock"] {
  display: none !important;
}
.diagnostics-page.diag-readonly .save-bar {
  display: none !important;
}
.diagnostics-page.diag-readonly .content input,
.diagnostics-page.diag-readonly .content textarea,
.diagnostics-page.diag-readonly .content select,
.diagnostics-page.diag-readonly .content [contenteditable] {
  pointer-events: none !important;
  cursor: default !important;
}
.diagnostics-page.diag-readonly .content .diag-switch select {
  pointer-events: auto !important;
  cursor: pointer !important;
}

.diagnostics-page{
      --font-serif: "Lora", "Times New Roman", Georgia, serif;
      --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;

      --canvas: #F7F4ED;
      --paper: #FFFFFF;
      --paper-soft: #F3EEE4;
      --paper-sunken: #EDE8DD;

      --ink: #1A211A;
      --ink-strong: #0F140F;
      --ink-muted: #4F564A;
      --ink-subtle: #6E7368;

      --line: #E4DECF;
      --line-soft: #EFEADC;
      --line-strong: #D6CFBE;

      --sage-900: #1E2F1E;
      --sage-800: #2A4129;
      --sage-700: #2F4A2F;
      --sage-500: #5F7E45;
      --sage-400: #8AAB6A;
      --sage-100: #E0EBD1;
      --sage-50: #EEF4E2;

      --amber-700: #6F4514;
      --amber-500: #B07223;
      --amber-100: #F5E3C4;
      --amber-50: #FBF1DD;

      --rose-700: #6E2B22;
      --rose-500: #B0533F;
      --rose-100: #F3D8CE;
      --rose-50: #FAE9E0;

      --blue-700: #1F3D52;
      --blue-500: #4A7390;
      --blue-100: #D4E1EB;
      --blue-50: #E8EFF5;

      --plum-700: #4C2B52;
      --plum-500: #845B8B;
      --plum-100: #E5D6E8;
      --plum-50: #F2E8F5;

      --teal-700: #1E4A4A;
      --teal-500: #437A7A;
      --teal-100: #D0E5E5;
      --teal-50: #E5F0F0;

      --focus: #2F4A2F;
      --focus-ring: 0 0 0 0.1875rem rgba(95, 126, 69, 0.35);

      --radius-sm: 0.5rem;
      --radius-md: 0.75rem;
      --radius-lg: 1.125rem;
      --radius-xl: 1.5rem;

      --shadow-xs: 0 0.0625rem 0 rgba(30, 47, 30, 0.03);
      --shadow-sm: 0 0.0625rem 0.125rem rgba(30, 47, 30, 0.04), 0 0.0625rem 0 rgba(30, 47, 30, 0.02);
      --shadow-md: 0 0.25rem 0.875rem rgba(30, 47, 30, 0.05), 0 0.0625rem 0.125rem rgba(30, 47, 30, 0.04);
      --shadow-lg: 0 0.75rem 2.5rem rgba(30, 47, 30, 0.08), 0 0.125rem 0.375rem rgba(30, 47, 30, 0.04);

      --sidebar-w: var(--app-sidebar-width, var(--sidebar-width, 15rem));
      --stick-offset: 10rem;
      --project-topbar-h: var(--topbar-height, 3.75rem);
    }

    .diagnostics-page *, .diagnostics-page *::before, .diagnostics-page *::after{ box-sizing: border-box; margin: 0; padding: 0; }
    .diagnostics-page{ font-size: 100%; }
    .diagnostics-page{
      min-height: calc(100vh - var(--project-topbar-h, 3.75rem));
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      line-height: 1.55;
      color: var(--ink);
      background: var(--canvas);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      font-feature-settings: "cv11", "ss01", "ss03";
    }
    .diagnostics-page button{ font: inherit; color: inherit; cursor: pointer; background: none; border: none; }
    .diagnostics-page a{ color: inherit; text-decoration: none; }
    .diagnostics-page input, .diagnostics-page textarea, .diagnostics-page select{ font: inherit; color: inherit; }
    .diagnostics-page fieldset{ border: none; }
    .diagnostics-page legend{ padding: 0; }

    .diagnostics-page .sr-only{
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .diagnostics-page :focus{ outline: none; }
    .diagnostics-page :focus-visible{
      outline: 0.1875rem solid var(--focus);
      outline-offset: 0.125rem;
      border-radius: 0.375rem;
    }
    .diagnostics-page button:focus-visible,
    .diagnostics-page .chip:focus-visible,
    .diagnostics-page .seg-btn:focus-visible,
    .diagnostics-page .stage-step:focus-visible,
    .diagnostics-page .stage-tile:focus-visible,
    .diagnostics-page .subtab:focus-visible{
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .diagnostics-page .skip-link{
      position: absolute;
      top: 0.5rem; left: 0.5rem;
      padding: 0.6rem 0.9rem;
      background: var(--sage-900);
      color: #F4F8EC;
      border-radius: 0.5rem;
      font-weight: 600;
      transform: translateY(-200%);
      transition: transform 0.15s ease;
      z-index: 100;
    }
    .diagnostics-page .skip-link:focus-visible{ transform: translateY(0); }

    @media (prefers-reduced-motion: reduce) {
      .diagnostics-page *, .diagnostics-page *::before, .diagnostics-page *::after{
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
        scroll-behavior: auto !important;
      }
    }
    .diagnostics-page .toast{
      position: fixed;
      bottom: 5.5rem;
      right: 2rem;
      z-index: 300;
      background: var(--sage-900);
      color: #F4F8EC;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
      max-width: 22rem;
      opacity: 0;
      transform: translateY(0.5rem);
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .diagnostics-page .toast.show{
      opacity: 1;
      transform: translateY(0);
    }
    .diagnostics-page .toast .toast-icon{
      width: 1.625rem;
      height: 1.625rem;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      display: grid;
      place-items: center;
      flex: 0 0 1.625rem;
    }
    .diagnostics-page .toast .toast-icon svg{ width: 0.875rem; height: 0.875rem; }
    .diagnostics-page .toast .toast-body{ line-height: 1.4; }
    .diagnostics-page .toast .toast-body strong{ font-weight: 600; }
    @media (max-width: 56.25rem) {
      .diagnostics-page .toast{ left: 1rem; right: 1rem; max-width: none; bottom: 5.5rem; }
    }

    .diagnostics-page .modal-backdrop{
      position: fixed;
      inset: 0;
      background: rgba(15, 20, 15, 0.45);
      backdrop-filter: blur(0.25rem);
      -webkit-backdrop-filter: blur(0.25rem);
      z-index: 200;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: backdropIn 0.18s ease;
    }
    .diagnostics-page .modal-backdrop.open{ display: flex; }
    @keyframes backdropIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .diagnostics-page .modal{
      background: var(--paper);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 36rem;
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalIn 0.22s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(0.75rem) scale(0.98); }
      to { opacity: 1; transform: none; }
    }
    .diagnostics-page .modal-head{
      padding: 1.125rem 1.25rem 1rem;
      border-bottom: 0.0625rem solid var(--line-soft);
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .diagnostics-page .modal-head .mh-body{ flex: 1; min-width: 0; }
    .diagnostics-page .modal-head .mh-title{
      font-family: var(--font-serif);
      font-size: 1.1875rem;
      font-weight: 500;
      letter-spacing: -0.015em;
      color: var(--ink-strong);
      line-height: 1.2;
      margin-bottom: 0.25rem;
    }
    .diagnostics-page .modal-close{
      width: 2.25rem; height: 2.25rem;
      display: grid; place-items: center;
      border-radius: 0.5rem;
      color: var(--ink-muted);
      flex: 0 0 2.25rem;
      transition: background 0.15s, color 0.15s;
    }
    .diagnostics-page .modal-close:hover{ background: var(--paper-soft); color: var(--ink); }
    .diagnostics-page .modal-close svg{ width: 1.0625rem; height: 1.0625rem; }

    .diagnostics-page .modal-search{
      padding: 0.875rem 1.25rem;
      border-bottom: 0.0625rem solid var(--line-soft);
      position: relative;
    }
    .diagnostics-page .modal-search input{
      width: 100%;
      padding: 0.625rem 0.875rem 0.625rem 2.375rem;
      background: var(--paper-soft);
      border: 0.0625rem solid var(--line);
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      color: var(--ink-strong);
      min-height: 2.75rem;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
    }
    .diagnostics-page .modal-search input:focus{
      outline: none;
      background: var(--paper);
      border-color: var(--sage-500);
      box-shadow: var(--focus-ring);
    }
    .diagnostics-page .modal-search .search-icon{
      position: absolute;
      left: 1.875rem;
      top: 50%;
      transform: translateY(-50%);
      width: 1rem; height: 1rem;
      color: var(--ink-subtle);
      pointer-events: none;
    }

    .diagnostics-page .modal-list{
      overflow-y: auto;
      flex: 1 1 auto;
      padding: 0.5rem 0.5rem;
      min-height: 8rem;
    }
    .diagnostics-page .staff-item{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      min-height: 3.25rem;
      border-radius: 0.625rem;
      background: transparent;
      border: 0.0625rem solid transparent;
      text-align: left;
      transition: background 0.12s, border-color 0.12s;
      cursor: pointer;
    }
    .diagnostics-page .staff-item:hover{ background: var(--paper-soft); }
    .diagnostics-page .staff-item.selected{
      background: var(--sage-50);
      border-color: var(--sage-100);
    }
    .diagnostics-page .staff-item .staff-av{
      width: 2.25rem; height: 2.25rem;
      border-radius: 50%;
      display: grid; place-items: center;
      font-size: 0.8125rem;
      font-weight: 600;
      flex: 0 0 2.25rem;
      background: var(--sage-500);
      color: #FFFFFF;
    }
    .diagnostics-page .staff-item .staff-body{ flex: 1; min-width: 0; }
    .diagnostics-page .staff-item .staff-name{
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
      letter-spacing: -0.005em;
    }
    .diagnostics-page .staff-item .staff-role{
      font-size: 0.75rem;
      color: var(--ink-muted);
      margin-top: 0.0625rem;
    }
    .diagnostics-page .staff-item .staff-check{
      width: 1.375rem; height: 1.375rem;
      border-radius: 0.4375rem;
      border: 0.125rem solid var(--line-strong);
      background: var(--paper);
      display: grid; place-items: center;
      flex: 0 0 1.375rem;
      transition: background 0.12s, border-color 0.12s;
    }
    .diagnostics-page .staff-item .staff-check svg{
      width: 0.875rem; height: 0.875rem;
      color: #FFFFFF;
      opacity: 0; transform: scale(0.7);
      transition: opacity 0.12s, transform 0.12s;
    }
    .diagnostics-page .staff-item.selected .staff-check{
      background: var(--sage-500);
      border-color: var(--sage-500);
    }
    .diagnostics-page .staff-item.selected .staff-check svg{ opacity: 1; transform: scale(1); }
    .diagnostics-page .staff-empty{
      padding: 2rem 1rem;
      text-align: center;
      color: var(--ink-subtle);
      font-size: 0.875rem;
    }

    .diagnostics-page .modal-foot{
      padding: 0.875rem 1.25rem;
      border-top: 0.0625rem solid var(--line-soft);
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: var(--paper-soft);
    }
    .diagnostics-page .modal-foot-spacer{ flex: 1; }

    @media (max-width: 30rem) {
      .diagnostics-page .modal{ max-height: calc(100vh - 1rem); border-radius: 0.875rem; }
      .diagnostics-page .modal-head{ padding: 1rem 1rem 0.875rem; }
      .diagnostics-page .modal-search{ padding: 0.75rem 1rem; }
      .diagnostics-page .modal-list{ padding: 0.375rem; }
      .diagnostics-page .modal-foot{ padding: 0.75rem 1rem; flex-wrap: wrap; }
      .diagnostics-page .modal-foot .btn{ flex: 1; }
      .diagnostics-page .modal-foot-spacer{ flex: 1 1 100%; }
    }

    .diagnostics-page .app{
      display: grid;
      grid-template-columns: var(--sidebar-w) 1fr;
      min-height: 100vh;
    }
    .diagnostics-page .sidebar{
      position: sticky;
      top: 0;
      height: 100vh;
      background: var(--sage-900);
      color: #E8EDDE;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem 1rem;
    }
    .diagnostics-page .brand{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0 0.5rem;
      margin-bottom: 2rem;
    }
    .diagnostics-page .brand-mark{
      width: 2.375rem; height: 2.375rem;
      background: #E8EDDE;
      color: var(--sage-900);
      border-radius: 0.625rem;
      display: grid;
      place-items: center;
      font-family: var(--font-serif);
      font-weight: 500;
      font-size: 1.25rem;
      letter-spacing: -0.02em;
    }
    .diagnostics-page .brand-text .name{
      font-family: var(--font-serif);
      font-size: 1rem;
      font-weight: 500;
      letter-spacing: -0.01em;
      color: #FFFFFF;
    }
    .diagnostics-page .brand-text .sub{
      font-size: 0.7187rem;
      color: #B6C5AF;
      letter-spacing: 0.01em;
    }
    .diagnostics-page .nav-section{
      font-size: 0.6562rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #A2B59A;
      padding: 0 0.75rem;
      margin: 1.5rem 0 0.5rem;
      font-weight: 500;
    }
    .diagnostics-page .nav-item{
      display: flex;
      align-items: center;
      gap: 0.7rem;
      width: 100%;
      min-height: 2.75rem;
      padding: 0.55rem 0.75rem;
      border-radius: 0.625rem;
      font-size: 0.875rem;
      color: #D8E0CF;
      transition: background 0.15s ease, color 0.15s ease;
      text-align: left;
    }
    .diagnostics-page .nav-item:hover{ background: rgba(255,255,255,0.08); color: #F0F4E6; }
    .diagnostics-page .nav-item.active{ background: #E8EDDE; color: var(--sage-900); font-weight: 500; }
    .diagnostics-page .nav-item .icon{ width: 1rem; height: 1rem; flex: 0 0 1rem; }
    .diagnostics-page .nav-item .badge-small{
      margin-left: auto;
      font-size: 0.6875rem;
      background: rgba(255,255,255,0.16);
      padding: 0.0625rem 0.4375rem;
      border-radius: 999px;
      color: #F0F4E6;
      font-weight: 500;
    }
    .diagnostics-page .nav-item.active .badge-small{ background: var(--sage-900); color: #E8EDDE; }
    .diagnostics-page .sidebar-footer{
      margin-top: auto;
      padding: 1rem 0.5rem 0;
      border-top: 0.0625rem solid rgba(255,255,255,0.12);
    }
    .diagnostics-page .sidebar-user{
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.5rem;
      min-height: 2.75rem;
      border-radius: 0.625rem;
      transition: background 0.15s ease;
      cursor: pointer;
    }
    .diagnostics-page .sidebar-user:hover{ background: rgba(255,255,255,0.08); }
    .diagnostics-page .sidebar-user .avatar{
      width: 2rem; height: 2rem;
      border-radius: 50%;
      background: var(--amber-100);
      color: var(--amber-700);
      display: grid; place-items: center;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .diagnostics-page .sidebar-user .info{ flex: 1; min-width: 0; }
    .diagnostics-page .sidebar-user .info .n{ font-size: 0.8125rem; color: #FFFFFF; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .diagnostics-page .sidebar-user .info .r{ font-size: 0.6875rem; color: #B6C5AF; }
    .diagnostics-page .main{
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .diagnostics-page .topbar{
      position: sticky;
      top: 0;
      z-index: 40;
      background: var(--paper);
      border-bottom: 0.0625rem solid var(--line);
      padding: 0.85rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      min-height: 3.75rem;
    }
    .diagnostics-page .breadcrumb{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8437rem;
      color: var(--ink-muted);
      flex-wrap: wrap;
    }
    .diagnostics-page .breadcrumb a{
      border-radius: 0.375rem;
      padding: 0.25rem 0.4375rem;
      margin: -0.1875rem -0.375rem;
      transition: background 0.12s, color 0.12s;
    }
    .diagnostics-page .breadcrumb a:hover{ background: var(--paper-soft); color: var(--ink); }
    .diagnostics-page .breadcrumb .current{ color: var(--ink); font-weight: 500; }
    .diagnostics-page .breadcrumb .sep{ color: var(--ink-subtle); }
    .diagnostics-page .topbar-spacer{ flex: 1; }
    .diagnostics-page .save-state{
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
      font-size: 0.8125rem;
      color: var(--sage-700);
      padding: 0.35rem 0.7rem;
      background: var(--sage-50);
      border-radius: 999px;
      border: 0.0625rem solid var(--sage-100);
    }
    .diagnostics-page .save-state .dot{ width: 0.4375rem; height: 0.4375rem; border-radius: 50%; background: var(--sage-500); }
    .diagnostics-page .save-state svg{ width: 0.8125rem; height: 0.8125rem; }
    .diagnostics-page .icon-btn{
      width: 2.75rem; height: 2.75rem;
      display: grid; place-items: center;
      border-radius: 0.625rem;
      color: var(--ink-muted);
      transition: background 0.15s, color 0.15s;
    }
    .diagnostics-page .icon-btn:hover{ background: var(--paper); color: var(--ink); }
    .diagnostics-page .icon-btn svg{ width: 1.0625rem; height: 1.0625rem; }
    .diagnostics-page .diag-modebar{
      max-width: 87.5rem;
      width: 100%;
      margin: 0 auto;
      padding: 1.25rem 2rem 0;
      display: flex;
      justify-content: center;
      gap: 0.75rem;
    }
    .diagnostics-page .diag-mode-btn{
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.7rem;
      font-family: var(--font-sans);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--ink-muted);
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
    }
    .diagnostics-page .diag-mode-btn svg{ width: 1.25rem; height: 1.25rem; }
    .diagnostics-page .diag-mode-btn:hover{ border-color: var(--line-strong); background: var(--paper-soft); }
    .diagnostics-page .diag-mode-btn.active{
      color: #F4F8EC;
      background: var(--sage-700);
      border-color: var(--sage-700);
      box-shadow: 0 0.25rem 0.75rem rgba(47, 74, 47, 0.22);
    }

    .diagnostics-page .diag-assign-view{
      max-width: 62rem;
      width: 100%;
      margin: 0 auto;
      padding: 1.5rem 2rem 6rem;
      animation: pageIn 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .diagnostics-page .da-head{ margin-bottom: 1.25rem; }
    .diagnostics-page .da-title{
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: 1.6rem;
      color: var(--ink-strong);
      margin: 0;
    }
    .diagnostics-page .da-sub{ color: var(--ink-muted); font-size: 0.92rem; margin: 0.35rem 0 0; max-width: 44rem; }
    .diagnostics-page .da-card{
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    .diagnostics-page .da-grid{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
      gap: 1rem;
      align-items: end;
    }
    .diagnostics-page .da-field{ display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .diagnostics-page .da-key{ font-size: 0.78rem; font-weight: 600; color: var(--ink-muted); }
    .diagnostics-page .da-input{
      width: 100%;
      padding: 0.55rem 0.65rem;
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-md);
      background: var(--paper);
      color: var(--ink);
      font-family: inherit;
      font-size: 0.9rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .diagnostics-page .da-input:focus{ outline: none; border-color: var(--sage-500); box-shadow: 0 0 0 0.1875rem rgba(95, 126, 69, 0.18); }
    .diagnostics-page .da-action{ display: flex; }
    .diagnostics-page .da-action .btn{ width: 100%; justify-content: center; }
    .diagnostics-page .da-error{ margin: 0.75rem 0 0; color: var(--rose-500); font-size: 0.82rem; }
    .diagnostics-page .da-subtitle{
      font-family: var(--font-serif);
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--ink-strong);
      margin: 0 0 0.85rem;
    }
    .diagnostics-page .da-empty{ color: var(--ink-subtle); font-size: 0.88rem; padding: 0.5rem 0; }
    .diagnostics-page .da-table{ width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .diagnostics-page .da-table th{
      text-align: left;
      font-weight: 600;
      color: var(--ink-subtle);
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.4rem 0.6rem;
      border-bottom: 0.0625rem solid var(--line);
    }
    .diagnostics-page .da-table td{ padding: 0.55rem 0.6rem; border-bottom: 0.0625rem solid var(--line-soft); color: var(--ink); }
    .diagnostics-page .da-status{ display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; font-size: 0.74rem; font-weight: 600; }
    .diagnostics-page .da-status.planned{ background: var(--amber-50); color: var(--amber-700); }
    .diagnostics-page .da-status.done{ background: var(--sage-50); color: var(--sage-700); }
    .diagnostics-page .da-cancel{
      background: none;
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-sm);
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
      color: var(--rose-500);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .diagnostics-page .da-cancel:hover:not(:disabled){ background: var(--rose-50); border-color: var(--rose-100); }
    .diagnostics-page .da-cancel:disabled{ opacity: 0.5; cursor: default; }
    @media (max-width: 40rem){
      .diagnostics-page .diag-modebar{ padding: 1rem 1rem 0; flex-wrap: wrap; }
      .diagnostics-page .diag-assign-view{ padding: 1rem 1rem 6rem; }
    }

    .diagnostics-page .content{
      padding: 1.5rem 2rem 8rem;
      max-width: 87.5rem;
      width: 100%;
      margin: 0 auto;
      animation: pageIn 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    @keyframes pageIn {
      from { opacity: 0; transform: translateY(0.5rem); }
      to { opacity: 1; transform: translateY(0); }
    }
    .diagnostics-page .hero{
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1.25rem;
      align-items: center;
      position: sticky;
      top: var(--project-topbar-h, 3.75rem);
      z-index: 35;
      transition: box-shadow 0.2s ease;
    }
    .diagnostics-page .hero.is-stuck{
      padding: 0.75rem 1.5rem 0.875rem;
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      border-left: none;
      border-right: none;
      border-top: none;
      margin-left: -2rem;
      margin-right: -2rem;
      box-shadow: var(--shadow-md);
      align-items: center;
    }
    .diagnostics-page .hero.is-stuck .hero-avatar{
      width: 2.5rem; height: 2.5rem; font-size: 1.0625rem;
      flex: 0 0 2.5rem;
    }
    .diagnostics-page .hero.is-stuck .hero-eyebrow{ display: none; }
    .diagnostics-page .hero.is-stuck .hero-name{ font-size: 1.0625rem; margin-bottom: 0; line-height: 1.2; }
    .diagnostics-page .hero.is-stuck .hero-meta{ display: none; }
    .diagnostics-page .hero.is-stuck .hero-section-tag{ display: inline-flex; }
    .diagnostics-page .hero.is-stuck .hero-progress{ min-width: 9rem; gap: 0.25rem; }
    .diagnostics-page .hero.is-stuck .hero-progress .progress-label{ display: none; }
    .diagnostics-page .hero.is-stuck .hero-progress .progress-pct{ font-size: 1rem; }
    .diagnostics-page .hero.is-stuck .hero-progress .progress-track{ height: 0.25rem; }
    .diagnostics-page .hero-section-tag{
      display: none;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.1875rem;
      font-size: 0.75rem;
      color: var(--ink-muted);
      line-height: 1.2;
      animation: tagSlideIn 0.22s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    @keyframes tagSlideIn {
      from { opacity: 0; transform: translateY(-0.25rem); }
      to   { opacity: 1; transform: none; }
    }
    .diagnostics-page .hero-section-tag .hst-label{
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      font-size: 0.625rem;
      color: var(--ink-subtle);
    }
    .diagnostics-page .hero-section-tag .hst-divider{
      width: 0.25rem; height: 0.25rem;
      background: var(--ink-subtle);
      border-radius: 50%;
    }
    .diagnostics-page .hero-section-tag .hst-name{
      font-weight: 600;
      color: var(--sage-800);
      letter-spacing: -0.005em;
      font-size: 0.8437rem;
    }
    .diagnostics-page .hero-sticky-sentinel{
      position: relative;
      top: 0; height: 0.0625rem;
      pointer-events: none;
    }
    .diagnostics-page .hero-avatar{
      width: 4.5rem; height: 4.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--amber-100), var(--rose-100));
      color: var(--amber-700);
      display: grid; place-items: center;
      font-family: var(--font-serif);
      font-weight: 500;
      font-size: 1.75rem;
      letter-spacing: -0.04em;
      flex: 0 0 4.5rem;
    }
    .diagnostics-page .hero-identity{ min-width: 0; }
    .diagnostics-page .hero-eyebrow{
      display: flex;
      align-items: center;
      gap: 0.4375rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--sage-700);
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .diagnostics-page .hero-eyebrow svg{ width: 0.875rem; height: 0.875rem; }
    .diagnostics-page .hero-name.is-changeable{ cursor: pointer; text-decoration-thickness: 0.08em; text-underline-offset: 0.12em; }
    .diagnostics-page .hero-name.is-changeable:hover{ text-decoration: underline; color: var(--sage-800); }
    .diagnostics-page[data-diagnostic-completed="true"] .save-bar{ border-top-color: var(--sage-400); }
    .diagnostics-page .hero-name{
      font-family: var(--font-serif);
      font-size: 1.875rem;
      line-height: 1.1;
      font-weight: 500;
      letter-spacing: -0.025em;
      color: var(--ink-strong);
      margin-bottom: 0.375rem;
    }
    .diagnostics-page .hero-name-row{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .diagnostics-page .hero-switch{
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      margin-bottom: 0.375rem;
      font-family: var(--font-sans);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--sage-700);
      background: var(--sage-50);
      border: 1px solid var(--sage-100);
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .diagnostics-page .hero-switch svg{ width: 0.875rem; height: 0.875rem; }
    .diagnostics-page .hero-switch:hover{
      background: var(--sage-100);
      border-color: var(--sage-400);
      color: var(--sage-800);
    }
    .diagnostics-page .hero.is-stuck .hero-switch{ display: none; }
    .diagnostics-page .hero-meta{
      font-size: 0.875rem;
      color: var(--ink-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1rem;
    }
    .diagnostics-page .hero-meta .sep-dot{
      width: 0.1875rem; height: 0.1875rem;
      background: var(--ink-subtle);
      border-radius: 50%;
      align-self: center;
    }
    .diagnostics-page .hero-progress{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.4375rem;
      min-width: 14rem;
    }
    .diagnostics-page .progress-pct{
      font-family: var(--font-serif);
      font-size: 1.625rem;
      font-weight: 500;
      color: var(--ink-strong);
      letter-spacing: -0.025em;
      line-height: 1;
    }
    .diagnostics-page .progress-pct .of{
      font-size: 0.9375rem;
      color: var(--ink-muted);
      font-family: var(--font-sans);
      font-weight: 400;
    }
    .diagnostics-page .progress-label{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-muted);
      font-weight: 500;
    }
    .diagnostics-page .progress-track{
      width: 100%;
      height: 0.375rem;
      background: var(--paper-sunken);
      border-radius: 999px;
      overflow: hidden;
    }
    .diagnostics-page .progress-fill{
      height: 100%;
      background: linear-gradient(90deg, var(--sage-500), var(--sage-400));
      border-radius: 999px;
      transition: width 0.6s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
    .diagnostics-page .route{
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 1rem 1.25rem 1.125rem;
      margin-bottom: 1rem;
    }
    .diagnostics-page .route-head{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.625rem;
      flex-wrap: wrap;
    }
    .diagnostics-page .route-title{
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      font-weight: 500;
      color: var(--ink-strong);
      letter-spacing: -0.015em;
    }
    .diagnostics-page .route-tiles{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    .diagnostics-page .stage-tile{
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      padding: 0.625rem 0.75rem 0.6875rem;
      background: var(--paper-soft);
      border: 0.125rem solid transparent;
      border-radius: 0.625rem;
      text-align: left;
      transition: background 0.15s, border-color 0.15s, transform 0.15s;
      cursor: pointer;
      min-height: 3.5rem;
    }
    .diagnostics-page .stage-tile:hover{ transform: translateY(-0.0625rem); }
    .diagnostics-page .stage-tile .num-line{
      display: flex; align-items: center; justify-content: space-between;
      width: 100%;
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-subtle);
      font-weight: 600;
    }
    .diagnostics-page .stage-tile .num-line .st-icon{
      width: 0.875rem; height: 0.875rem;
    }
    .diagnostics-page .stage-tile .st-name{
      font-size: 0.8437rem;
      font-weight: 600;
      color: var(--ink-strong);
      line-height: 1.25;
    }
    .diagnostics-page .stage-tile.done{
      background: var(--sage-50);
      border-color: var(--sage-100);
    }
    .diagnostics-page .stage-tile.done .num-line{ color: var(--sage-700); }
    .diagnostics-page .stage-tile.done .num-line .st-icon{ color: var(--sage-500); }
    .diagnostics-page .stage-tile.pending{
      background: var(--paper-soft);
      border-color: transparent;
    }
    .diagnostics-page .stage-tile.pending .num-line{ color: var(--ink-subtle); }
    .diagnostics-page .stage-tile.pending .st-name{ color: var(--ink-muted); }
    .diagnostics-page .stage-tile.in-progress{
      background: var(--amber-50);
      border-color: var(--amber-100);
    }
    .diagnostics-page .stage-tile.in-progress .num-line{ color: var(--amber-700); }
    .diagnostics-page .stage-tile.in-progress .num-line .st-icon{ color: var(--amber-500); }
    .diagnostics-page .grid{
      display: grid;
      grid-template-columns: 1fr 17rem;
      gap: 1.25rem;
      align-items: flex-start;
    }
    .diagnostics-page .side-nav-wrap{
      position: sticky;
      top: calc(var(--stick-offset, 7.5rem) + 0.75rem);
    }
    .diagnostics-page .side-nav{
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      padding: 0.5rem;
    }
    .diagnostics-page .side-nav-title{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      font-weight: 600;
      padding: 0.625rem 0.75rem 0.5rem;
    }
    .diagnostics-page .side-nav-item{
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      min-height: 2.625rem;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      color: var(--ink);
      text-align: left;
      transition: background 0.12s, color 0.12s;
      cursor: pointer;
    }
    .diagnostics-page .side-nav-item:hover{ background: var(--paper-soft); }
    .diagnostics-page .side-nav-item.active{
      background: var(--sage-50);
      box-shadow: inset 0.1875rem 0 0 var(--sage-500);
    }
    .diagnostics-page .side-nav-item.active .sni-name{ color: var(--sage-800); font-weight: 600; }
    .diagnostics-page .side-nav-item.active .sni-num{ color: var(--sage-700); font-weight: 700; }
    .diagnostics-page .side-nav-item{ transition: background 0.18s ease, box-shadow 0.18s ease; }
    .diagnostics-page .side-nav-item .sni-num{
      font-family: var(--font-sans);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--ink-subtle);
      width: 1.125rem;
      flex: 0 0 1.125rem;
      text-align: center;
      font-feature-settings: "tnum";
    }
    .diagnostics-page .side-nav-item .sni-body{ flex: 1; min-width: 0; }
    .diagnostics-page .side-nav-item .sni-name{
      display: block;
      font-size: 0.8437rem;
      color: var(--ink-strong);
      font-weight: 500;
      line-height: 1.25;
    }
    .diagnostics-page .side-nav-item .sni-spec{
      display: block;
      margin-top: 0.125rem;
      font-size: 0.6875rem;
      line-height: 1.3;
      color: var(--ink-subtle);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .diagnostics-page .side-nav-item .sni-spec:empty{ display: none; }
    .diagnostics-page .side-nav-item .sni-status{
      width: 0.625rem; height: 0.625rem;
      border-radius: 50%;
      background: var(--paper-sunken);
      flex: 0 0 0.625rem;
    }
    .diagnostics-page .side-nav-item .sni-status.done{ background: var(--sage-500); }
    .diagnostics-page .side-nav-item .sni-status.progress{ background: var(--amber-500); }
    .diagnostics-page .side-nav-item .sni-status.empty{ background: var(--paper-sunken); border: 0.0625rem solid var(--line-strong); }

    .diagnostics-page .side-card{
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      padding: 1rem 1rem 1.125rem;
      margin-top: 1rem;
    }
    .diagnostics-page .side-card-title{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--ink-muted);
      font-weight: 600;
      margin-bottom: 0.625rem;
    }
    .diagnostics-page .legend-list{
      display: grid;
      gap: 0.4375rem;
      font-size: 0.8125rem;
    }
    .diagnostics-page .legend-row{
      display: flex; align-items: center; gap: 0.5rem;
      color: var(--ink-strong);
    }
    .diagnostics-page .legend-dot{
      width: 0.625rem; height: 0.625rem;
      border-radius: 50%;
    }
    .diagnostics-page .legend-dot.done{ background: var(--sage-500); }
    .diagnostics-page .legend-dot.progress{ background: var(--amber-500); }
    .diagnostics-page .legend-dot.empty{ background: var(--paper-sunken); border: 0.0625rem solid var(--line-strong); }
    .diagnostics-page .stage-card{
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      overflow: hidden;
      scroll-margin-top: var(--stick-offset, 7.5rem);
      content-visibility: auto;
      contain-intrinsic-size: auto 25rem;
    }
    .diagnostics-page .stage-card + .stage-card{ margin-top: 1rem; }

    .diagnostics-page .stage-card.collapsed .stage-body{ display: none; }
    .diagnostics-page .profile-hidden{ display: none !important; }
    .diagnostics-page .stage-card .stage-body.is-collapsing{
      display: block !important;
      overflow: hidden;
      opacity: 0;
      transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1),
                  opacity 0.3s ease,
                  padding 0.45s cubic-bezier(0.4, 0, 0.2, 1);
      padding-top: 0;
      padding-bottom: 0;
      border-top-color: transparent;
    }
    .diagnostics-page .stage-card.just-finished{
      position: relative;
    }
    .diagnostics-page .stage-card.just-finished::after{
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      box-shadow: 0 0 0 0.1875rem rgba(95, 126, 69, 0.55);
      opacity: 0;
      animation: finishPulse 0.7s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: opacity, transform;
    }
    @keyframes finishPulse {
      0%   { opacity: 1; transform: scale(1); }
      55%  { opacity: 0; transform: scale(1.012); }
      100% { opacity: 0; transform: scale(1); }
    }

    .diagnostics-page .stage-card.locked{
      opacity: 0.72;
    }
    .diagnostics-page .stage-card.locked .stage-toggle{ cursor: not-allowed; }
    .diagnostics-page .stage-body.is-locked{
      position: relative;
    }
    .diagnostics-page .stage-body.is-locked .qgroup,
    .diagnostics-page .stage-body.is-locked .sub-section,
    .diagnostics-page .stage-body.is-locked .test-list,
    .diagnostics-page .stage-body.is-locked .gmfcs-grid,
    .diagnostics-page .stage-body.is-locked .level-grid,
    .diagnostics-page .stage-body.is-locked .scale-row,
    .diagnostics-page .stage-body.is-locked .theatre-row,
    .diagnostics-page .stage-body.is-locked .verdict-options,
    .diagnostics-page .stage-body.is-locked .three-points,
    .diagnostics-page .stage-body.is-locked textarea,
    .diagnostics-page .stage-body.is-locked input[type="text"],
    .diagnostics-page .stage-body.is-locked input[type="number"],
    .diagnostics-page .stage-body.is-locked input[type="search"],
    .diagnostics-page .stage-body.is-locked select{
      pointer-events: none;
      user-select: text;
    }
    .diagnostics-page .stage-body.is-locked .seg-btn,
    .diagnostics-page .stage-body.is-locked .triple-btn,
    .diagnostics-page .stage-body.is-locked .chip,
    .diagnostics-page .stage-body.is-locked .gmfcs-card,
    .diagnostics-page .stage-body.is-locked .level-card,
    .diagnostics-page .stage-body.is-locked .scale-tick,
    .diagnostics-page .stage-body.is-locked .theatre-option,
    .diagnostics-page .stage-body.is-locked .point-btn,
    .diagnostics-page .stage-body.is-locked .verdict-option{
      cursor: default;
    }
    .diagnostics-page .stage-body.is-locked .seg-btn:not(.active),
    .diagnostics-page .stage-body.is-locked .triple-btn:not(.active),
    .diagnostics-page .stage-body.is-locked .chip:not(.selected),
    .diagnostics-page .stage-body.is-locked .gmfcs-card:not(.selected),
    .diagnostics-page .stage-body.is-locked .level-card:not(.selected),
    .diagnostics-page .stage-body.is-locked .scale-tick:not(.active),
    .diagnostics-page .stage-body.is-locked .theatre-option:not(.selected),
    .diagnostics-page .stage-body.is-locked .point-btn:not(.active),
    .diagnostics-page .stage-body.is-locked .verdict-option:not(.selected){
      opacity: 0.45;
    }
    .diagnostics-page .stage-body.is-locked textarea,
    .diagnostics-page .stage-body.is-locked input[type="text"],
    .diagnostics-page .stage-body.is-locked input[type="number"],
    .diagnostics-page .stage-body.is-locked input[type="search"]{
      background: var(--paper-sunken);
      color: var(--ink-strong);
      border-color: var(--line);
    }
    .diagnostics-page .stage-body.is-locked .stage-actions{
      pointer-events: auto;
    }
    .diagnostics-page .stage-body.is-locked .stage-actions [data-action="finish-stage"],
    .diagnostics-page .stage-body.is-locked .stage-actions [data-action="save-draft"],
    .diagnostics-page .stage-body.is-locked .stage-actions [data-action="finish-subblock"]{
      pointer-events: none;
      opacity: 0.5;
    }
    .diagnostics-page .stage-locked-banner{
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      margin: 0 0 1rem;
      background: var(--sage-50);
      border: 0.0625rem solid var(--sage-100);
      border-radius: var(--radius-md);
      color: var(--sage-800);
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .diagnostics-page .stage-locked-banner svg{
      width: 1.125rem; height: 1.125rem;
      flex: 0 0 1.125rem;
      color: var(--sage-700);
    }
    .diagnostics-page .stage-locked-banner strong{ font-weight: 600; }
    .diagnostics-page .stage-locked-banner .slb-text{ flex: 1; min-width: 0; }

    .diagnostics-page .stage-gate-banner{
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      margin: 0 0 1rem;
      background: var(--amber-50);
      border: 0.0625rem solid var(--amber-100);
      border-radius: var(--radius-md);
      color: var(--amber-700);
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .diagnostics-page .stage-gate-banner svg{
      width: 1.125rem; height: 1.125rem;
      flex: 0 0 1.125rem;
      color: var(--amber-500);
    }
    .diagnostics-page .stage-gate-banner strong{ font-weight: 600; }
    .diagnostics-page .stage-gate-banner .slb-text{ flex: 1; min-width: 0; }

    .diagnostics-page .stage-card.is-current{
      border-color: var(--sage-400);
      box-shadow: 0 0 0 0.1875rem var(--sage-50), var(--shadow-sm);
    }

    .diagnostics-page .stage-head{
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
    }
    .diagnostics-page .stage-toggle{
      display: contents;
    }
    .diagnostics-page .stage-head-clickable{
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      background: transparent;
      border: none;
      width: 100%;
      text-align: left;
      transition: background 0.12s;
    }
    .diagnostics-page .stage-head-clickable:hover{ background: var(--paper-soft); }

    .diagnostics-page .stage-num{
      width: 2.375rem; height: 2.375rem;
      border-radius: 0.625rem;
      display: grid; place-items: center;
      font-family: var(--font-serif);
      font-size: 1rem;
      font-weight: 600;
      letter-spacing: -0.02em;
      background: var(--paper-soft);
      color: var(--ink-muted);
      flex: 0 0 2.375rem;
    }
    .diagnostics-page .stage-num.sage{ background: var(--sage-50); color: var(--sage-700); }
    .diagnostics-page .stage-num.amber{ background: var(--amber-50); color: var(--amber-700); }
    .diagnostics-page .stage-num.blue{ background: var(--blue-50); color: var(--blue-700); }
    .diagnostics-page .stage-num.plum{ background: var(--plum-50); color: var(--plum-700); }
    .diagnostics-page .stage-num.rose{ background: var(--rose-50); color: var(--rose-700); }
    .diagnostics-page .stage-num.teal{ background: var(--teal-50); color: var(--teal-700); }
    .diagnostics-page .stage-num.done{ background: var(--sage-500); color: #FFFFFF; }

    .diagnostics-page .stage-info{ min-width: 0; }
    .diagnostics-page .stage-info .title-row{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.25rem;
    }
    .diagnostics-page .stage-info .title{
      font-family: var(--font-serif);
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--ink-strong);
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .diagnostics-page .stage-info .badge{
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 600;
      padding: 0.1875rem 0.5rem;
      border-radius: 999px;
    }
    .diagnostics-page .stage-info .badge.done{ background: var(--sage-100); color: var(--sage-700); }
    .diagnostics-page .stage-info .badge.progress{ background: var(--amber-100); color: var(--amber-700); }
    .diagnostics-page .stage-info .badge.empty{ background: var(--paper-soft); color: var(--ink-muted); }
    .diagnostics-page .stage-info .badge.locked{ background: var(--paper-soft); color: var(--ink-subtle); }
    .diagnostics-page .stage-info .badge.mine{
      background: var(--blue-50);
      color: var(--blue-700);
      border: 0.0625rem solid var(--blue-100);
    }
    .diagnostics-page .stage-info .sub-row{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem 0.75rem;
      align-items: center;
    }
    .diagnostics-page .stage-info .sub-row .sep{
      width: 0.1875rem; height: 0.1875rem;
      background: var(--ink-subtle);
      border-radius: 50%;
    }

    .diagnostics-page .stage-meta{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--ink-muted);
    }
    .diagnostics-page .stage-meta .mini-pct{
      font-family: var(--font-sans);
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--ink-strong);
      line-height: 1;
      font-feature-settings: "tnum";
    }
    .diagnostics-page .stage-meta .mini-pct .of{ font-size: 0.75rem; color: var(--ink-muted); font-weight: 400; }

    .diagnostics-page .stage-chevron{
      width: 2rem; height: 2rem;
      display: grid; place-items: center;
      color: var(--ink-muted);
      transition: transform 0.2s ease, color 0.12s;
      flex: 0 0 2rem;
    }
    .diagnostics-page .stage-chevron svg{ width: 1.125rem; height: 1.125rem; }
    .diagnostics-page .stage-card.collapsed .stage-chevron{ transform: rotate(0deg); }
    .diagnostics-page .stage-card:not(.collapsed) .stage-chevron{ transform: rotate(180deg); color: var(--ink-strong); }

    .diagnostics-page .stage-body{
      padding: 0 1.25rem 1.5rem;
      border-top: 0.0625rem solid var(--line-soft);
      padding-top: 1.25rem;
    }
    .diagnostics-page .stage-card:not(.collapsed) .stage-body{ animation: bodyIn 0.25s cubic-bezier(0.2, 0.7, 0.2, 1); }
    @keyframes bodyIn {
      from { opacity: 0; transform: translateY(0.25rem); }
      to { opacity: 1; transform: none; }
    }

    .diagnostics-page .stage-actions{
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 0.0625rem solid var(--line-soft);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .diagnostics-page .stage-actions .spacer{ flex: 1; }
    .diagnostics-page .stage-actions .signed-note{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
    }
    .diagnostics-page .stage-actions .signed-note svg{ width: 0.875rem; height: 0.875rem; color: var(--sage-500); }
    .diagnostics-page .subblock-actions{
      margin-top: 1.25rem;
      padding-top: 1rem;
      border-top: 0.0625rem solid var(--line-soft);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .diagnostics-page .subblock-actions .spacer{ flex: 1; }
    .diagnostics-page .subblock-actions .signed-note{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
    }
    .diagnostics-page .subblock-actions .signed-note svg{ width: 0.875rem; height: 0.875rem; color: var(--sage-500); }
    .diagnostics-page .subpanel.is-locked .qgroup,
    .diagnostics-page .subpanel.is-locked .sub-section,
    .diagnostics-page .subpanel.is-locked .test-list,
    .diagnostics-page .subpanel.is-locked .gmfcs-grid,
    .diagnostics-page .subpanel.is-locked .level-grid,
    .diagnostics-page .subpanel.is-locked .scale-row,
    .diagnostics-page .subpanel.is-locked .theatre-row,
    .diagnostics-page .subpanel.is-locked .verdict-options,
    .diagnostics-page .subpanel.is-locked .three-points,
    .diagnostics-page .subpanel.is-locked .specialists-row,
    .diagnostics-page .subpanel.is-locked textarea,
    .diagnostics-page .subpanel.is-locked input[type="text"],
    .diagnostics-page .subpanel.is-locked input[type="number"],
    .diagnostics-page .subpanel.is-locked input[type="search"],
    .diagnostics-page .subpanel.is-locked select{
      pointer-events: none;
      user-select: text;
    }
    .diagnostics-page .subpanel.is-locked .seg-btn,
    .diagnostics-page .subpanel.is-locked .triple-btn,
    .diagnostics-page .subpanel.is-locked .chip,
    .diagnostics-page .subpanel.is-locked .gmfcs-card,
    .diagnostics-page .subpanel.is-locked .level-card,
    .diagnostics-page .subpanel.is-locked .scale-tick,
    .diagnostics-page .subpanel.is-locked .theatre-option,
    .diagnostics-page .subpanel.is-locked .point-btn,
    .diagnostics-page .subpanel.is-locked .verdict-option{ cursor: default; }
    .diagnostics-page .subpanel.is-locked .seg-btn:not(.active),
    .diagnostics-page .subpanel.is-locked .triple-btn:not(.active),
    .diagnostics-page .subpanel.is-locked .chip:not(.selected),
    .diagnostics-page .subpanel.is-locked .gmfcs-card:not(.selected),
    .diagnostics-page .subpanel.is-locked .level-card:not(.selected),
    .diagnostics-page .subpanel.is-locked .scale-tick:not(.active),
    .diagnostics-page .subpanel.is-locked .theatre-option:not(.selected),
    .diagnostics-page .subpanel.is-locked .point-btn:not(.active),
    .diagnostics-page .subpanel.is-locked .verdict-option:not(.selected){
      opacity: 0.45;
    }
    .diagnostics-page .subpanel.is-locked textarea,
    .diagnostics-page .subpanel.is-locked input[type="text"],
    .diagnostics-page .subpanel.is-locked input[type="number"],
    .diagnostics-page .subpanel.is-locked input[type="search"]{
      background: var(--paper-sunken);
      color: var(--ink-strong);
      border-color: var(--line);
    }
    .diagnostics-page .subpanel.is-locked .subblock-actions{ pointer-events: auto; }
    .diagnostics-page .subpanel-locked-banner{
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      margin: 0 0 1rem;
      background: var(--sage-50);
      border: 0.0625rem solid var(--sage-100);
      border-radius: var(--radius-md);
      color: var(--sage-800);
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .diagnostics-page .subpanel-locked-banner svg{
      width: 1.125rem; height: 1.125rem;
      flex: 0 0 1.125rem;
      color: var(--sage-700);
    }
    .diagnostics-page .subpanel-locked-banner strong{ font-weight: 600; }
    .diagnostics-page .subpanel-locked-banner .slb-text{ flex: 1; min-width: 0; }
    .diagnostics-page .stage-actions [data-action="finish-stage"][disabled]{
      cursor: not-allowed;
    }
    .diagnostics-page .stage-actions .hint-pending{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
    }
    .diagnostics-page .stage-actions .hint-pending svg{
      width: 0.875rem; height: 0.875rem;
      color: var(--amber-500);
      flex: 0 0 0.875rem;
    }
    .diagnostics-page .stage-waiting{
      padding: 1.25rem 1.25rem 1.5rem;
      text-align: center;
      color: var(--ink-muted);
    }
    .diagnostics-page .stage-waiting .icon-wrap{
      width: 3rem; height: 3rem;
      margin: 0 auto 0.75rem;
      background: var(--paper-soft);
      border-radius: 50%;
      display: grid; place-items: center;
    }
    .diagnostics-page .stage-waiting .icon-wrap svg{ width: 1.375rem; height: 1.375rem; color: var(--ink-subtle); }
    .diagnostics-page .stage-waiting .wt{ font-size: 0.9375rem; color: var(--ink-strong); font-weight: 500; margin-bottom: 0.25rem; }
    .diagnostics-page .stage-waiting .ws{ font-size: 0.8437rem; max-width: 28rem; margin: 0 auto 0.75rem; }
    .diagnostics-page .subtabs-wrap{
      background: var(--paper-soft);
      border-radius: 0.625rem;
      padding: 0.25rem;
      margin-bottom: 1.25rem;
      display: flex;
      gap: 0.125rem;
      overflow-x: auto;
      scrollbar-width: thin;
    }
    .diagnostics-page .subtab{
      flex: 1;
      min-width: max-content;
      min-height: 2.5rem;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ink-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4375rem;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .diagnostics-page .subtab:hover:not(.active){ background: var(--paper); color: var(--ink-strong); }
    .diagnostics-page .subtab.active{
      background: var(--paper);
      color: var(--ink-strong);
      box-shadow: var(--shadow-sm);
      font-weight: 600;
    }
    .diagnostics-page .subtab .sub-status{
      width: 0.5rem; height: 0.5rem;
      border-radius: 50%;
      background: var(--paper-sunken);
      border: 0.0625rem solid var(--line-strong);
    }
    .diagnostics-page .subtab .sub-status.done{ background: var(--sage-500); border-color: var(--sage-500); }
    .diagnostics-page .subtab .sub-status.progress{ background: var(--amber-500); border-color: var(--amber-500); }

    .diagnostics-page .subpanel{ display: none; }
    .diagnostics-page .subpanel.active{ display: block; }

    .diagnostics-page .subpanel-head{
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding-bottom: 1rem;
      margin-bottom: 1.125rem;
      border-bottom: 0.0625rem solid var(--line-soft);
    }
    .diagnostics-page .sp-icon{
      width: 2.5rem; height: 2.5rem;
      border-radius: 0.625rem;
      background: var(--sage-50);
      color: var(--sage-700);
      display: grid; place-items: center;
      flex: 0 0 2.5rem;
    }
    .diagnostics-page .sp-icon svg{ width: 1.125rem; height: 1.125rem; }
    .diagnostics-page .sp-icon.amber{ background: var(--amber-50); color: var(--amber-700); }
    .diagnostics-page .sp-icon.plum{ background: var(--plum-50); color: var(--plum-700); }
    .diagnostics-page .sp-icon.blue{ background: var(--blue-50); color: var(--blue-700); }
    .diagnostics-page .sp-icon.teal{ background: var(--teal-50); color: var(--teal-700); }
    .diagnostics-page .sp-icon.rose{ background: var(--rose-50); color: var(--rose-700); }
    .diagnostics-page .subpanel-head .t{
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      font-weight: 500;
      color: var(--ink-strong);
      letter-spacing: -0.015em;
      line-height: 1.2;
    }
    .diagnostics-page .subpanel-head .s{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      margin-top: 0.125rem;
    }
    .diagnostics-page .subpanel-head .right{ margin-left: auto; text-align: right; }
    .diagnostics-page .subpanel-head .right .pp{
      font-family: var(--font-sans);
      font-size: 1.125rem;
      color: var(--ink-strong);
      font-weight: 600;
      line-height: 1;
      font-feature-settings: "tnum";
    }
    .diagnostics-page .subpanel-head .right .pl{
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-muted);
      font-weight: 500;
      margin-top: 0.1875rem;
    }
    .diagnostics-page .qgroup + .qgroup{
      border-top: 0.0625rem solid var(--line-soft);
      padding-top: 1.25rem;
      margin-top: 1.25rem;
    }
    .diagnostics-page .sub-section{
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 0.125rem solid var(--line);
    }
    .diagnostics-page .sub-section:first-of-type{ margin-top: 0; padding-top: 0; border-top: none; }
    .diagnostics-page .sub-section-title{
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      font-weight: 500;
      color: var(--ink-strong);
      letter-spacing: -0.015em;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .diagnostics-page .sub-section-title .ss-icon{
      width: 1.75rem; height: 1.75rem;
      border-radius: 0.5rem;
      background: var(--sage-50);
      color: var(--sage-700);
      display: grid; place-items: center;
      flex: 0 0 1.75rem;
    }
    .diagnostics-page .sub-section-title .ss-icon svg{ width: 0.9375rem; height: 0.9375rem; }
    .diagnostics-page .sub-section .qgroup:first-of-type{
      border-top: none;
      padding-top: 0;
      margin-top: 0;
    }
    .diagnostics-page .qlabel{
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-bottom: 0.625rem;
      flex-wrap: wrap;
    }
    .diagnostics-page .qlabel-text{
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
      letter-spacing: -0.005em;
    }
    .diagnostics-page .qcomment-area{ margin-top: 0.75rem; }
    .diagnostics-page .qlabel-required{ color: var(--rose-700); font-size: 0.9375rem; font-weight: 600; }
    .diagnostics-page .qhint-extra{
      width: 100%;
      font-size: 0.8125rem;
      color: var(--ink-muted);
      margin-top: -0.125rem;
      margin-bottom: 0.625rem;
    }
    .diagnostics-page .chip-group{ display: flex; flex-wrap: wrap; gap: 0.4375rem; }
    .diagnostics-page .chip{
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
      min-height: 2.5rem;
      padding: 0.5rem 0.875rem;
      border-radius: 999px;
      background: var(--paper-soft);
      color: var(--ink);
      border: 0.0625rem solid var(--line-soft);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      user-select: none;
      line-height: 1.3;
    }
    .diagnostics-page .chip:hover{ background: var(--paper); border-color: var(--line-strong); }
    .diagnostics-page .chip input{
      position: absolute; opacity: 0;
      width: 100%; height: 100%; inset: 0; cursor: pointer;
    }
    .diagnostics-page .chip .chip-check{
      width: 1rem; height: 1rem;
      border-radius: 0.3125rem;
      border: 0.0937rem solid var(--line-strong);
      display: grid; place-items: center;
      flex: 0 0 1rem;
      background: var(--paper);
      transition: background 0.15s, border-color 0.15s;
    }
    .diagnostics-page .chip .chip-check svg{
      width: 0.75rem; height: 0.75rem;
      color: #FFFFFF;
      opacity: 0; transform: scale(0.6);
      transition: opacity 0.15s, transform 0.15s;
    }
    .diagnostics-page .chip.selected{ background: var(--sage-50); border-color: var(--sage-400); color: var(--sage-800); }
    .diagnostics-page .chip.selected .chip-check{ background: var(--sage-500); border-color: var(--sage-500); }
    .diagnostics-page .chip.selected .chip-check svg{ opacity: 1; transform: scale(1); }
    .diagnostics-page .chip.radio .chip-check{ border-radius: 50%; }
    .diagnostics-page .chip.radio .chip-check svg{ display: none; }
    .diagnostics-page .chip.radio.selected .chip-check{
      background: var(--paper);
      border: 0.3125rem solid var(--sage-500);
    }
    .diagnostics-page .segmented{
      display: inline-flex;
      gap: 0.125rem;
      background: var(--paper-soft);
      border: 0.0625rem solid var(--line);
      border-radius: 0.625rem;
      padding: 0.1875rem;
      width: 100%;
      max-width: 42rem;
    }
    .diagnostics-page .seg-btn{
      flex: 1;
      min-height: 2.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ink-muted);
      transition: background 0.15s, color 0.15s;
      text-align: center;
      line-height: 1.3;
    }
    .diagnostics-page .seg-btn:hover:not(.active){ background: var(--paper); color: var(--ink-strong); }
    .diagnostics-page .seg-btn.active{
      background: var(--paper);
      color: var(--ink-strong);
      box-shadow: var(--shadow-sm);
      font-weight: 600;
    }
    .diagnostics-page .seg-btn.active.sage{ background: var(--sage-500); color: #FFFFFF; }
    .diagnostics-page .seg-btn.active.amber{ background: var(--amber-500); color: #FFFFFF; }
    .diagnostics-page .seg-btn.active.rose{ background: var(--rose-500); color: #FFFFFF; }
    .diagnostics-page .input, .diagnostics-page .textarea{
      width: 100%;
      padding: 0.6875rem 0.875rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line-strong);
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      color: var(--ink-strong);
      line-height: 1.5;
      min-height: 2.75rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .diagnostics-page .input::placeholder, .diagnostics-page .textarea::placeholder{ color: var(--ink-subtle); }
    .diagnostics-page .input:hover, .diagnostics-page .textarea:hover{ border-color: var(--ink-muted); }
    .diagnostics-page .input:focus, .diagnostics-page .textarea:focus{
      outline: none;
      border-color: var(--sage-500);
      box-shadow: var(--focus-ring);
    }
    .diagnostics-page .textarea{ min-height: 5rem; resize: vertical; font-family: inherit; }
    .diagnostics-page .textarea-lg{ min-height: 7rem; }

    .diagnostics-page .field-grid{
      display: grid;
      gap: 0.875rem;
      grid-template-columns: repeat(2, 1fr);
    }
    .diagnostics-page .field-grid .field-full{ grid-column: 1 / -1; }
    .diagnostics-page .field{ display: flex; flex-direction: column; gap: 0.375rem; }
    .diagnostics-page .field-label{ font-size: 0.8125rem; font-weight: 500; color: var(--ink-strong); }
    .diagnostics-page .field-label .required{ color: var(--rose-700); }
    .diagnostics-page .field-help{ font-size: 0.75rem; color: var(--ink-muted); }
    .diagnostics-page .qcomment-toggle{
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--ink-muted);
      padding: 0.375rem 0.625rem;
      min-height: 2rem;
      border-radius: 0.4375rem;
      margin-top: 0.5rem;
    }
    .diagnostics-page .qcomment-toggle:hover{ background: var(--paper-soft); color: var(--ink); }
    .diagnostics-page .qcomment-toggle svg{ width: 0.8125rem; height: 0.8125rem; }
    .diagnostics-page .btn{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4375rem;
      padding: 0.6875rem 1.125rem;
      min-height: 2.75rem;
      border-radius: 0.625rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      border: 0.0625rem solid transparent;
      white-space: nowrap;
    }
    .diagnostics-page .btn svg{ width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
    .diagnostics-page .btn-primary{
      background: var(--sage-900);
      color: #F4F8EC;
      border-color: var(--sage-900);
    }
    .diagnostics-page .btn-primary:hover{ background: var(--sage-800); border-color: var(--sage-800); }
    .diagnostics-page .btn-secondary{
      background: var(--paper);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    .diagnostics-page .btn-secondary:hover{ background: var(--paper-soft); border-color: var(--ink-muted); }
    .diagnostics-page .btn-ghost{ color: var(--ink-muted); }
    .diagnostics-page .btn-ghost:hover{ background: var(--paper-soft); color: var(--ink); }
    .diagnostics-page .btn-sm{ padding: 0.4375rem 0.75rem; min-height: 2.125rem; font-size: 0.8125rem; }
    .diagnostics-page .save-bar{
      position: fixed;
      bottom: 0;
      left: var(--sidebar-w);
      right: 0;
      z-index: 50;
      background: var(--paper-sunken);
      border-top: 0.0625rem solid var(--line-strong);
      padding: 0.75rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .diagnostics-page .save-bar-spacer{ flex: 1; }
    .diagnostics-page .save-bar-actions{ display: flex; gap: 0.5rem; }
    .diagnostics-page .save-bar-assign{ display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .diagnostics-page .save-bar-assign-label{
      font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.05em;
      font-weight: 700; color: var(--ink-soft, #6b7280);
    }
    .diagnostics-page .save-bar-assign-select{
      max-width: 22rem; padding: 0.4rem 0.6rem; font-size: 0.82rem;
      border: 0.0625rem solid var(--line-strong); border-radius: 0.5rem;
      background: var(--paper, #fff); color: inherit; cursor: pointer;
    }
    .diagnostics-page .test-list{ display: grid; gap: 0.75rem; }
    .diagnostics-page .test-row{
      display: grid;
      grid-template-columns: 2.5rem 1fr auto;
      gap: 0.875rem;
      align-items: center;
      padding: 0.875rem 1rem;
      border: 0.0625rem solid var(--line-soft);
      border-radius: var(--radius-md);
      background: var(--paper);
      transition: border-color 0.15s, background 0.15s;
    }
    .diagnostics-page .test-row:hover{ border-color: var(--line-strong); }
    .diagnostics-page .test-icon{
      width: 2.5rem; height: 2.5rem;
      border-radius: 0.625rem;
      background: var(--paper-soft);
      color: var(--ink-muted);
      display: grid; place-items: center;
    }
    .diagnostics-page .test-icon svg{ width: 1.125rem; height: 1.125rem; }
    .diagnostics-page .test-info{ min-width: 0; }
    .diagnostics-page .test-info .tn{
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
      letter-spacing: -0.005em;
    }
    .diagnostics-page .test-info .td{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      margin-top: 0.0625rem;
      line-height: 1.4;
    }
    .diagnostics-page .test-row.has-chips{
      grid-template-columns: 2.5rem 1fr;
      row-gap: 0.625rem;
    }
    .diagnostics-page .test-row.has-chips .chip-group{
      grid-column: 1 / -1;
    }
    .diagnostics-page .triple-control{
      display: inline-flex;
      gap: 0.125rem;
      background: var(--paper-soft);
      border: 0.0625rem solid var(--line);
      border-radius: 0.5rem;
      padding: 0.1875rem;
      width: 26rem;
      flex: 0 0 26rem;
    }
    .diagnostics-page .triple-btn{
      flex: 1 1 0;
      min-width: 0;
      min-height: 2.125rem;
      padding: 0.3125rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      color: var(--ink-muted);
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem;
      transition: background 0.15s, color 0.15s;
      white-space: normal;
      text-align: center;
      line-height: 1.2;
      word-break: break-word;
      hyphens: auto;
    }
    .diagnostics-page .triple-btn svg{ width: 0.875rem; height: 0.875rem; }
    .diagnostics-page .triple-btn:hover:not(.active){ background: var(--paper); color: var(--ink-strong); }
    .diagnostics-page .triple-btn.active.yes{ background: var(--sage-500); color: #FFFFFF; }
    .diagnostics-page .triple-btn.active.partial{ background: var(--amber-500); color: #FFFFFF; }
    .diagnostics-page .triple-btn.active.no{ background: var(--rose-500); color: #FFFFFF; }
    .diagnostics-page .gmfcs-grid{
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.5rem;
    }
    .diagnostics-page .gmfcs-card{
      display: flex;
      flex-direction: column;
      gap: 0.4375rem;
      padding: 0.75rem 0.75rem 0.875rem;
      background: var(--paper);
      border: 0.125rem solid var(--line);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, transform 0.15s;
      min-height: 7rem;
      text-align: left;
    }
    .diagnostics-page .gmfcs-card:hover{ border-color: var(--line-strong); transform: translateY(-0.0625rem); }
    .diagnostics-page .gmfcs-card .lv{
      width: 1.5rem; height: 1.5rem;
      border-radius: 50%;
      background: var(--paper-soft);
      color: var(--ink-muted);
      display: grid; place-items: center;
      font-family: var(--font-serif);
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .diagnostics-page .gmfcs-card .lvname{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-muted);
      font-weight: 600;
    }
    .diagnostics-page .gmfcs-card .lvdesc{
      font-size: 0.8125rem;
      color: var(--ink-strong);
      line-height: 1.4;
    }
    .diagnostics-page .gmfcs-card.selected{
      border-color: var(--sage-500);
      background: var(--sage-50);
    }
    .diagnostics-page .gmfcs-card.selected .lv{ background: var(--sage-500); color: #FFFFFF; }
    .diagnostics-page .gmfcs-card.selected .lvname{ color: var(--sage-700); }
    .diagnostics-page .gmfcs-card.none{
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      min-height: 2.75rem;
      padding: 0.625rem 1rem;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--ink-muted);
      background: var(--paper-soft);
      border: 0.0625rem dashed var(--line-strong);
    }
    .diagnostics-page .gmfcs-card.none:hover{ background: var(--paper); }
    .diagnostics-page .gmfcs-card.none.selected{
      background: var(--paper);
      border: 0.125rem solid var(--ink-muted);
      color: var(--ink-strong);
      font-weight: 600;
    }
    .diagnostics-page .gmfcs-grid.is-disabled .gmfcs-card:not(.none){
      background: var(--paper-sunken);
      opacity: 0.45;
      border-color: var(--line);
      cursor: pointer;
    }
    .diagnostics-page .gmfcs-grid.is-disabled .gmfcs-card:not(.none):hover{
      opacity: 0.85;
      border-color: var(--line-strong);
      background: var(--paper);
    }
    .diagnostics-page .gmfcs-grid.is-disabled .gmfcs-card:not(.none).selected{
      background: var(--paper-sunken);
      border-color: var(--line);
    }
    .diagnostics-page .gmfcs-grid.is-disabled .gmfcs-card:not(.none) .lv{
      background: var(--paper-soft);
      color: var(--ink-subtle);
    }
    .diagnostics-page .gmfcs-grid.is-disabled .gmfcs-card.none.selected{
      background: var(--sage-50);
      border-color: var(--sage-500);
      color: var(--sage-800);
    }
    .diagnostics-page .gmfcs-grid.is-disabled .gmfcs-card.none.selected::before{
      content: "";
      width: 1.125rem; height: 1.125rem;
      background: var(--sage-500);
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E") no-repeat center / contain;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E") no-repeat center / contain;
      margin-right: 0.125rem;
    }
    .diagnostics-page .level-grid{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .diagnostics-page .level-card{
      display: flex;
      flex-direction: column;
      gap: 0.4375rem;
      padding: 0.875rem 1rem 1rem;
      background: var(--paper);
      border: 0.125rem solid var(--line);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      text-align: left;
      min-height: 6rem;
    }
    .diagnostics-page .level-card:hover{ border-color: var(--line-strong); }
    .diagnostics-page .level-card .ln{
      font-family: var(--font-sans);
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
      letter-spacing: -0.005em;
    }
    .diagnostics-page .level-card .ln .badge-num{
      display: inline-grid;
      place-items: center;
      width: 1.5rem; height: 1.5rem;
      background: var(--paper-soft);
      color: var(--ink-muted);
      border-radius: 50%;
      font-size: 0.8125rem;
      font-weight: 600;
      margin-right: 0.4375rem;
      vertical-align: middle;
    }
    .diagnostics-page .level-card .ld{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      line-height: 1.45;
    }
    .diagnostics-page .level-card.selected{
      background: var(--sage-50);
      border-color: var(--sage-500);
    }
    .diagnostics-page .level-card.selected .ln .badge-num{ background: var(--sage-500); color: #FFFFFF; }
    .diagnostics-page .level-card.amber.selected{ background: var(--amber-50); border-color: var(--amber-500); }
    .diagnostics-page .level-card.amber.selected .ln .badge-num{ background: var(--amber-500); color: #FFFFFF; }
    .diagnostics-page .level-card.rose.selected{ background: var(--rose-50); border-color: var(--rose-500); }
    .diagnostics-page .level-card.rose.selected .ln .badge-num{ background: var(--rose-500); color: #FFFFFF; }
    .diagnostics-page .izo-list{ display: grid; gap: 0.625rem; }
    .diagnostics-page .izo-row{
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 1rem;
      align-items: center;
      padding: 0.6875rem 0.875rem 0.6875rem 1rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line-soft);
      border-radius: var(--radius-md);
    }
    .diagnostics-page .izo-row:hover{ border-color: var(--line-strong); }
    .diagnostics-page .izo-info{ min-width: 0; }
    .diagnostics-page .izo-info .it{
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
    }
    .diagnostics-page .izo-info .id{
      font-size: 0.75rem;
      color: var(--ink-muted);
      margin-top: 0.0625rem;
    }
    .diagnostics-page .three-points{
      display: inline-flex;
      gap: 0.1875rem;
      background: var(--paper-soft);
      border: 0.0625rem solid var(--line);
      border-radius: 0.5rem;
      padding: 0.1875rem;
      width: 26rem;
      flex: 0 0 26rem;
    }
    .diagnostics-page .point-btn{
      flex: 1 1 0;
      min-width: 0;
      min-height: 2.25rem;
      padding: 0.3125rem 0.4375rem;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--ink-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.3125rem;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
      text-align: center;
    }
    .diagnostics-page .point-btn .pn{
      display: inline-grid;
      place-items: center;
      width: 1.375rem;
      height: 1.375rem;
      flex: 0 0 1.375rem;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: var(--paper);
      border: 0.0625rem solid var(--line-strong);
      font-family: var(--font-sans);
      font-size: 0.8125rem;
      font-weight: 700;
      line-height: 1;
      color: var(--ink);
      font-feature-settings: "tnum";
    }
    .diagnostics-page .point-btn:hover:not(.active){ background: var(--paper); color: var(--ink-strong); }
    .diagnostics-page .point-btn.active.high{ background: var(--sage-500); color: #FFFFFF; }
    .diagnostics-page .point-btn.active.high .pn{ background: var(--sage-700); color: #FFFFFF; border-color: var(--sage-700); }
    .diagnostics-page .point-btn.active.mid{ background: var(--amber-500); color: #FFFFFF; }
    .diagnostics-page .point-btn.active.mid .pn{ background: var(--amber-700); color: #FFFFFF; border-color: var(--amber-700); }
    .diagnostics-page .point-btn.active.low{ background: var(--rose-500); color: #FFFFFF; }
    .diagnostics-page .point-btn.active.low .pn{ background: var(--rose-700); color: #FFFFFF; border-color: var(--rose-700); }
    .diagnostics-page .theatre-row{
      padding: 1rem 1.125rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line-soft);
      border-radius: var(--radius-md);
    }
    .diagnostics-page .theatre-row + .theatre-row{ margin-top: 0.625rem; }
    .diagnostics-page .theatre-row .tq{
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
      margin-bottom: 0.1875rem;
    }
    .diagnostics-page .theatre-row .tform{
      font-size: 0.75rem;
      color: var(--ink-muted);
      margin-bottom: 0.75rem;
    }
    .diagnostics-page .theatre-row .tform strong{ color: var(--ink); font-weight: 600; }
    .diagnostics-page .theatre-options{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.4375rem;
    }
    .diagnostics-page .theatre-option{
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.625rem 0.75rem 0.6875rem;
      background: var(--paper-soft);
      border: 0.125rem solid transparent;
      border-radius: 0.5rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, border-color 0.15s;
      min-height: 4rem;
    }
    .diagnostics-page .theatre-option:hover{ background: var(--paper); border-color: var(--line-strong); }
    .diagnostics-page .theatre-option .lvl{
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      color: var(--ink-muted);
    }
    .diagnostics-page .theatre-option .desc{
      font-size: 0.8125rem;
      color: var(--ink-strong);
      line-height: 1.4;
    }
    .diagnostics-page .theatre-option.selected.low{ background: var(--rose-50); border-color: var(--rose-500); }
    .diagnostics-page .theatre-option.selected.low .lvl{ color: var(--rose-700); }
    .diagnostics-page .theatre-option.selected.mid{ background: var(--amber-50); border-color: var(--amber-500); }
    .diagnostics-page .theatre-option.selected.mid .lvl{ color: var(--amber-700); }
    .diagnostics-page .theatre-option.selected.high{ background: var(--sage-50); border-color: var(--sage-500); }
    .diagnostics-page .theatre-option.selected.high .lvl{ color: var(--sage-700); }
    .diagnostics-page .scale-row{
      padding: 1rem 1.125rem 1.125rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line-soft);
      border-radius: var(--radius-md);
    }
    .diagnostics-page .scale-row + .scale-row{ margin-top: 0.625rem; }
    .diagnostics-page .scale-head{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.625rem;
      gap: 0.875rem;
    }
    .diagnostics-page .scale-name{
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ink-strong);
    }
    .diagnostics-page .scale-value{
      font-family: var(--font-sans);
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--ink-strong);
      line-height: 1;
      font-feature-settings: "tnum";
    }
    .diagnostics-page .scale-value .of{ font-family: var(--font-sans); font-size: 0.8125rem; color: var(--ink-muted); font-weight: 400; }
    .diagnostics-page .scale-bar{
      display: grid;
      grid-template-columns: repeat(11, 1fr);
      gap: 0.1875rem;
      background: var(--paper-soft);
      padding: 0.1875rem;
      border-radius: 0.4375rem;
    }
    .diagnostics-page .scale-tick{
      min-height: 2.25rem;
      border-radius: 0.3125rem;
      background: var(--paper);
      color: var(--ink-muted);
      font-size: 0.8125rem;
      font-weight: 500;
      display: grid;
      place-items: center;
      cursor: pointer;
      border: 0.0625rem solid transparent;
      transition: background 0.12s, color 0.12s, border-color 0.12s;
    }
    .diagnostics-page .scale-tick:hover{ background: var(--paper-sunken); color: var(--ink-strong); }
    .diagnostics-page .scale-tick.below{ background: var(--sage-100); color: var(--sage-700); border-color: transparent; }
    .diagnostics-page .scale-tick.below:hover{ background: var(--sage-100); }
    .diagnostics-page .scale-tick.active{
      background: var(--sage-500);
      color: #FFFFFF;
      font-weight: 700;
      border-color: var(--sage-500);
    }
    .diagnostics-page .scale-legend{
      display: flex;
      justify-content: space-between;
      margin-top: 0.4375rem;
      font-size: 0.6875rem;
      color: var(--ink-muted);
    }
    .diagnostics-page .scale-detail{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      margin-top: 0.5rem;
      padding: 0.5rem 0.6875rem;
      background: var(--paper-soft);
      border-radius: 0.4375rem;
      line-height: 1.45;
    }
    .diagnostics-page .scale-detail strong{ color: var(--ink-strong); font-weight: 600; }
    .diagnostics-page .verdict-options{
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
      margin-bottom: 1rem;
    }
    .diagnostics-page .verdict-option{
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.9375rem 1rem;
      border-radius: var(--radius-md);
      border: 0.125rem solid var(--line);
      background: var(--paper);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      text-align: left;
      min-height: 2.75rem;
    }
    .diagnostics-page .verdict-option:hover{ border-color: var(--line-strong); background: var(--paper-soft); }
    .diagnostics-page .verdict-option.selected.yes{ border-color: var(--sage-500); background: var(--sage-50); }
    .diagnostics-page .verdict-option.selected.trial{ border-color: var(--amber-500); background: var(--amber-50); }
    .diagnostics-page .verdict-option.selected.no{ border-color: var(--rose-500); background: var(--rose-50); }
    .diagnostics-page .verdict-option .marker{
      width: 1.25rem; height: 1.25rem;
      border-radius: 50%;
      border: 0.125rem solid var(--line-strong);
      flex: 0 0 1.25rem;
      display: grid; place-items: center;
      background: var(--paper);
      margin-top: 0.0625rem;
    }
    .diagnostics-page .verdict-option .marker svg{ width: 0.75rem; height: 0.75rem; opacity: 0; color: #FFFFFF; }
    .diagnostics-page .verdict-option.selected.yes .marker{ background: var(--sage-500); border-color: var(--sage-500); }
    .diagnostics-page .verdict-option.selected.trial .marker{ background: var(--amber-500); border-color: var(--amber-500); }
    .diagnostics-page .verdict-option.selected.no .marker{ background: var(--rose-500); border-color: var(--rose-500); }
    .diagnostics-page .verdict-option.selected .marker svg{ opacity: 1; }
    .diagnostics-page .verdict-option .vtext{ min-width: 0; }
    .diagnostics-page .verdict-option .vt{ font-size: 0.9375rem; font-weight: 600; color: var(--ink-strong); margin-bottom: 0.125rem; }
    .diagnostics-page .verdict-option .vs{ font-size: 0.8125rem; color: var(--ink-muted); line-height: 1.5; }
    .diagnostics-page .specialists-row{ margin-top: 1rem; padding-top: 1rem; border-top: 0.0625rem solid var(--line-soft); }
    .diagnostics-page .specialists-label{
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--ink-muted);
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .diagnostics-page .specialists-list{ display: flex; flex-wrap: wrap; gap: 0.4375rem; }
    .diagnostics-page .specialist-chip{
      display: inline-flex;
      align-items: center;
      gap: 0.4375rem;
      padding: 0.3125rem 0.4375rem 0.3125rem 0.3125rem;
      background: var(--sage-50);
      border: 0.0625rem solid var(--sage-100);
      border-radius: 999px;
      font-size: 0.8125rem;
      color: var(--sage-800);
      font-weight: 500;
    }
    .diagnostics-page .specialist-chip .av{
      width: 1.375rem; height: 1.375rem;
      border-radius: 50%;
      background: var(--sage-500);
      color: #FFFFFF;
      display: grid; place-items: center;
      font-size: 0.6875rem;
      font-weight: 600;
    }
    .diagnostics-page .specialist-chip.amber{ background: var(--amber-50); border-color: var(--amber-100); color: var(--amber-700); }
    .diagnostics-page .specialist-chip.amber .av{ background: var(--amber-500); }
    .diagnostics-page .specialist-chip.blue{ background: var(--blue-50); border-color: var(--blue-100); color: var(--blue-700); }
    .diagnostics-page .specialist-chip.blue .av{ background: var(--blue-500); }
    .diagnostics-page .specialist-chip.plum{ background: var(--plum-50); border-color: var(--plum-100); color: var(--plum-700); }
    .diagnostics-page .specialist-chip.plum .av{ background: var(--plum-500); }
    .diagnostics-page .specialist-chip.teal{ background: var(--teal-50); border-color: var(--teal-100); color: var(--teal-700); }
    .diagnostics-page .specialist-chip.teal .av{ background: var(--teal-500); }
    .diagnostics-page .specialist-chip.rose{ background: var(--rose-50); border-color: var(--rose-100); color: var(--rose-700); }
    .diagnostics-page .specialist-chip.rose .av{ background: var(--rose-500); }
    .diagnostics-page .specialists-empty{
      font-size: 0.8125rem;
      color: var(--ink-muted);
      align-self: center;
    }
    .diagnostics-page .mobile-route{ display: none; }
    .diagnostics-page .mobile-route select{
      width: 100%;
      min-height: 2.75rem;
      padding: 0.5rem 2.25rem 0.5rem 0.875rem;
      background: var(--paper) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234F564A' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 0.875rem center / 0.75rem;
      border: 0.0625rem solid var(--line-strong);
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      color: var(--ink-strong);
      appearance: none;
      -webkit-appearance: none;
    }
    @media (max-width: 75rem) {
      .diagnostics-page .grid{ grid-template-columns: 1fr; }
      .diagnostics-page .side-nav-wrap{ display: none; }
      .diagnostics-page .mobile-route{ display: block; margin-bottom: 0.75rem; }
    }
    @media (max-width: 56.25rem) {
      .diagnostics-page .app{ grid-template-columns: 1fr; }
      .diagnostics-page .sidebar{ display: none; }
      .diagnostics-page .content{ padding: 1rem 1rem 10rem; }
      .diagnostics-page .topbar{ padding: 0.75rem 1rem; }
      .diagnostics-page .hero{
        grid-template-columns: auto 1fr;
        padding: 1rem 1.125rem;
      }
      .diagnostics-page .hero.is-stuck{
        padding: 0.625rem 1rem;
        margin-left: -1rem;
        margin-right: -1rem;
        align-items: center;
      }
      .diagnostics-page .hero.is-stuck .hero-progress{ display: none; }
      .diagnostics-page .hero-progress{ grid-column: 1 / -1; align-items: flex-start; min-width: 0; margin-top: 0.25rem; }
      .diagnostics-page .hero-avatar{ width: 3.5rem; height: 3.5rem; font-size: 1.375rem; flex: 0 0 3.5rem; }
      .diagnostics-page .hero-name{ font-size: 1.5rem; }
      .diagnostics-page .route{ padding: 0.875rem 1rem 1rem; }
      .diagnostics-page .route-tiles{ grid-template-columns: repeat(2, 1fr); }
      .diagnostics-page .stage-head-clickable{ padding: 0.875rem 1rem; gap: 0.75rem; }
      .diagnostics-page .stage-body{ padding: 0 1rem 1.25rem; padding-top: 1.125rem; }
      .diagnostics-page .stage-info .title{ font-size: 1.125rem; }
      .diagnostics-page .field-grid{ grid-template-columns: 1fr; }
      .diagnostics-page .verdict-options{ grid-template-columns: 1fr; }
      .diagnostics-page .gmfcs-grid{ grid-template-columns: 1fr 1fr; }
      .diagnostics-page .level-grid{ grid-template-columns: 1fr; }
      .diagnostics-page .theatre-options{ grid-template-columns: 1fr; }
      .diagnostics-page .izo-row{
        grid-template-columns: 1fr;
        gap: 0.625rem;
        align-items: stretch;
      }
      .diagnostics-page .three-points{ width: 100%; flex: 1 1 auto; }
      .diagnostics-page .point-btn{ flex: 1; justify-content: center; }
      .diagnostics-page .test-row{
        grid-template-columns: 2.25rem 1fr;
        row-gap: 0.625rem;
      }
      .diagnostics-page .test-row .triple-control{ grid-column: 1 / -1; width: 100%; flex: 1 1 auto; }
      .diagnostics-page .triple-btn{ flex: 1; justify-content: center; }
      .diagnostics-page .scale-bar{ grid-template-columns: repeat(11, 1fr); }
      .diagnostics-page .save-bar{
        left: 0; padding: 0.625rem 1rem;
        flex-wrap: wrap; gap: 0.5rem;
      }
      .diagnostics-page .save-bar-actions{ flex: 1 1 100%; }
      .diagnostics-page .save-bar-actions .btn{ flex: 1; }
      .diagnostics-page .save-bar-assign{ flex: 1 1 100%; }
      .diagnostics-page .save-bar-assign-select{ max-width: none; width: 100%; }
    }
    @media (max-width: 30rem) {
      .diagnostics-page .topbar{ gap: 0.5rem; }
      .diagnostics-page .save-state{ display: none; }
      .diagnostics-page .route-tiles{ grid-template-columns: 1fr; }
      .diagnostics-page .stage-meta{ display: none; }
      .diagnostics-page .stage-head-clickable{ grid-template-columns: auto 1fr auto; gap: 0.5rem; }
      .diagnostics-page .verdict-options{ grid-template-columns: 1fr; }
      .diagnostics-page .scale-tick{ font-size: 0.6875rem; }
    }

    @media print {
      .diagnostics-page .sidebar, .diagnostics-page .topbar, .diagnostics-page .save-bar, .diagnostics-page .mobile-route, .diagnostics-page .side-nav-wrap{ display: none; }
      .diagnostics-page .app{ grid-template-columns: 1fr; }
      .diagnostics-page .content{ padding: 1rem; max-width: none; }
      .diagnostics-page .stage-card.collapsed .stage-body{ display: block !important; }
      .diagnostics-page .stage-card, .diagnostics-page .hero, .diagnostics-page .route{ box-shadow: none; break-inside: avoid; }
    }

    .diagnostics-page .peers{
      margin-top: 1rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xs);
      overflow: hidden;
      scroll-margin-top: var(--stick-offset, 7.5rem);
    }
    .diagnostics-page .peers-head{
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.0625rem 1.25rem;
      background: linear-gradient(180deg, var(--paper-soft) 0%, var(--paper) 100%);
      border-bottom: 0.0625rem solid var(--line);
    }
    .diagnostics-page .peers-head-main{ flex: 1; min-width: 0; }
    .diagnostics-page .peers-kicker{
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-subtle);
    }
    .diagnostics-page .peers-title{
      font-family: var(--font-serif);
      font-size: 1.0625rem;
      font-weight: 600;
      line-height: 1.25;
      color: var(--ink-strong);
      margin-top: 0.1875rem;
    }
    .diagnostics-page .peers-sub{
      margin-top: 0.375rem;
      font-size: 0.8125rem;
      line-height: 1.45;
      color: var(--ink-muted);
      max-width: 46rem;
    }
    .diagnostics-page .peers-head-side{
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.375rem;
      flex: 0 0 auto;
      padding-top: 0.125rem;
    }
    .diagnostics-page .peers-live{
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.5rem 0.25rem 0.4375rem;
      border-radius: 999px;
      background: var(--sage-50);
      border: 0.0625rem solid var(--sage-100);
      color: var(--sage-800);
      font-size: 0.6875rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .diagnostics-page .peers-live-dot{
      width: 0.4375rem; height: 0.4375rem;
      border-radius: 50%;
      background: var(--sage-500);
      animation: peersPulse 2s ease-in-out infinite;
    }
    @keyframes peersPulse{ 0%,100%{ opacity: 1; } 50%{ opacity: 0.25; } }
    .diagnostics-page .peers-count{
      font-size: 0.75rem;
      color: var(--ink-subtle);
      font-feature-settings: "tnum";
      white-space: nowrap;
    }

    .diagnostics-page .peers-body{ padding: 0.875rem 1.25rem 1.125rem; }
    .diagnostics-page .peers-empty{
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 1rem 1.125rem;
      border: 0.0625rem dashed var(--line-strong);
      border-radius: var(--radius-md);
      background: var(--paper-soft);
      color: var(--ink-muted);
      font-size: 0.8125rem;
      line-height: 1.5;
    }
    .diagnostics-page .peers-empty svg{ width: 1.5rem; height: 1.5rem; flex: 0 0 1.5rem; color: var(--ink-subtle); }

    .diagnostics-page .peer-card{
      border: 0.0625rem solid var(--line);
      border-left: 0.1875rem solid var(--line-strong);
      border-radius: var(--radius-md);
      background: var(--paper);
      padding: 0.875rem 1rem 0.75rem;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .diagnostics-page .peer-card + .peer-card{ margin-top: 0.625rem; }
    .diagnostics-page .peer-card:hover{ box-shadow: var(--shadow-sm); }
    .diagnostics-page .peer-card.accent-blue{ border-left-color: var(--blue-500); }
    .diagnostics-page .peer-card.accent-sage{ border-left-color: var(--sage-500); }
    .diagnostics-page .peer-card.accent-rose{ border-left-color: var(--rose-500); }
    .diagnostics-page .peer-card.accent-plum{ border-left-color: var(--plum-500); }
    .diagnostics-page .peer-card.accent-amber{ border-left-color: var(--amber-500); }
    .diagnostics-page .peer-card.accent-teal{ border-left-color: var(--teal-500); }
    .diagnostics-page .peer-card.is-locked{ border-left-color: var(--line-strong); background: var(--paper-soft); }

    .diagnostics-page .peer-head{ display: flex; align-items: center; gap: 0.625rem; }
    .diagnostics-page .peer-av{
      width: 1.875rem; height: 1.875rem;
      flex: 0 0 1.875rem;
      border-radius: 50%;
      background: var(--paper-sunken);
      color: var(--ink-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .diagnostics-page .peer-card.is-done .peer-av{ background: var(--sage-500); color: #FFFFFF; }
    .diagnostics-page .peer-id{ flex: 1; min-width: 0; display: block; }
    .diagnostics-page .peer-name{
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ink-strong);
      line-height: 1.25;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .diagnostics-page .peer-meta{
      display: block;
      font-size: 0.75rem;
      color: var(--ink-subtle);
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .diagnostics-page .peer-state{
      flex: 0 0 auto;
      padding: 0.1875rem 0.5rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 600;
      background: var(--amber-50);
      border: 0.0625rem solid var(--amber-100);
      color: var(--amber-700);
      white-space: nowrap;
    }
    .diagnostics-page .peer-state.is-done{
      background: var(--sage-50);
      border-color: var(--sage-100);
      color: var(--sage-800);
    }

    .diagnostics-page .peer-main{ margin-top: 0.75rem; }
    .diagnostics-page .peer-lead-label{
      display: block;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ink-subtle);
      margin-bottom: 0.3125rem;
    }
    .diagnostics-page .peer-lead{
      border-left: 0.125rem solid var(--line);
      padding-left: 0.75rem;
      font-size: 0.875rem;
      line-height: 1.55;
      color: var(--ink);
    }
    .diagnostics-page .peer-lead p + p{ margin-top: 0.375rem; }
    .diagnostics-page .peer-lead.is-empty{
      border-left-style: dashed;
      color: var(--ink-subtle);
      font-style: italic;
      font-size: 0.8125rem;
    }

    .diagnostics-page .peer-lock{
      margin-top: 0.75rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.625rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--paper-sunken);
      border: 0.0625rem solid var(--line);
      color: var(--ink-muted);
      font-size: 0.8125rem;
      line-height: 1.45;
    }
    .diagnostics-page .peer-lock svg{ width: 1rem; height: 1rem; flex: 0 0 1rem; margin-top: 0.125rem; color: var(--ink-subtle); }

    .diagnostics-page .peer-foot{
      margin-top: 0.75rem;
      padding-top: 0.625rem;
      border-top: 0.0625rem dashed var(--line);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .diagnostics-page .peer-toggle{
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3125rem 0.625rem 0.3125rem 0.4375rem;
      border-radius: 0.4375rem;
      border: 0.0625rem solid var(--line);
      background: var(--paper-soft);
      color: var(--ink-muted);
      font-size: 0.8125rem;
      font-weight: 500;
      transition: background 0.14s, color 0.14s, border-color 0.14s;
    }
    .diagnostics-page .peer-toggle:hover{ background: var(--paper-sunken); color: var(--ink-strong); border-color: var(--line-strong); }
    .diagnostics-page .peer-toggle:focus-visible{ box-shadow: var(--focus-ring); }
    .diagnostics-page .peer-chev{ width: 0.875rem; height: 0.875rem; transition: transform 0.18s ease; }
    .diagnostics-page .peer-card.is-open .peer-chev{ transform: rotate(180deg); }
    .diagnostics-page .peer-toggle-count{
      min-width: 1.125rem;
      padding: 0 0.25rem;
      border-radius: 999px;
      background: var(--paper-sunken);
      color: var(--ink-subtle);
      font-size: 0.6875rem;
      font-weight: 700;
      text-align: center;
      font-feature-settings: "tnum";
    }
    .diagnostics-page .peer-noparams{ font-size: 0.8125rem; color: var(--ink-subtle); font-style: italic; }
    .diagnostics-page .peer-when{ margin-left: auto; font-size: 0.75rem; color: var(--ink-subtle); white-space: nowrap; }

    .diagnostics-page .peer-params{
      margin-top: 0.75rem;
      padding: 0.75rem 0.875rem;
      border-radius: var(--radius-sm);
      background: var(--paper-soft);
      border: 0.0625rem solid var(--line-soft);
    }
    .diagnostics-page .peer-params[hidden]{ display: none; }
    .diagnostics-page .peer-sec + .peer-sec{ margin-top: 0.875rem; padding-top: 0.75rem; border-top: 0.0625rem solid var(--line); }
    .diagnostics-page .peer-sec-title{
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--ink-subtle);
      margin-bottom: 0.5rem;
    }
    .diagnostics-page .peer-param{
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      gap: 0.5rem 0.875rem;
      align-items: baseline;
      padding: 0.3125rem 0;
    }
    .diagnostics-page .peer-param + .peer-param{ border-top: 0.0625rem dotted var(--line); }
    .diagnostics-page .peer-param-q{ font-size: 0.8125rem; color: var(--ink-muted); line-height: 1.4; }
    .diagnostics-page .peer-param-v{ display: flex; flex-wrap: wrap; gap: 0.3125rem; }
    .diagnostics-page .peer-val{
      display: inline-block;
      padding: 0.125rem 0.4375rem;
      border-radius: 0.3125rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      color: var(--ink-strong);
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.35;
    }

    .diagnostics-page .side-nav-item--peers{ margin-top: 0.25rem; border-top: 0.0625rem solid var(--line-soft); padding-top: 0.625rem; }
    .diagnostics-page .side-nav-item--peers .sni-num--icon{ display: inline-flex; align-items: center; justify-content: center; color: var(--ink-subtle); }
    .diagnostics-page .side-nav-item--peers .sni-num--icon svg{ width: 0.9375rem; height: 0.9375rem; }

    @media (max-width: 56rem){
      .diagnostics-page .peers-head{ flex-direction: column; gap: 0.625rem; }
      .diagnostics-page .peers-head-side{ align-items: flex-start; }
      .diagnostics-page .peer-param{ grid-template-columns: 1fr; gap: 0.25rem; }
      .diagnostics-page .peer-when{ display: none; }
    }

    .diagnostics-page .diag-switch{
      margin: 0 0 1.25rem;
      padding: 0.9375rem 1.125rem 1.0625rem;
      background: var(--paper);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .diagnostics-page .ds-head{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .diagnostics-page .ds-title{
      font-family: var(--font-serif);
      font-size: 0.9375rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      color: var(--ink-strong);
    }
    .diagnostics-page .ds-count{
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      border-radius: 0.625rem;
      background: var(--paper-sunken);
      color: var(--ink-subtle);
      font-size: 0.6875rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .diagnostics-page .ds-row{
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .diagnostics-page .ds-tabs{
      display: flex;
      align-items: stretch;
      gap: 0.4375rem;
      flex: 1 1 20rem;
      min-width: 0;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: thin;
      scrollbar-color: var(--line-strong) transparent;
    }
    .diagnostics-page .ds-tabs::-webkit-scrollbar{ height: 0.375rem; }
    .diagnostics-page .ds-tabs::-webkit-scrollbar-thumb{
      background: var(--line-strong);
      border-radius: 0.1875rem;
    }

    .diagnostics-page .ds-tab{
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      flex: 0 0 auto;
      padding: 0.5rem 0.75rem 0.5625rem;
      text-align: left;
      background: var(--paper-soft);
      border: 0.0625rem solid var(--line);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background .15s ease, border-color .15s ease, box-shadow .15s ease, transform .15s ease;
    }
    .diagnostics-page .ds-tab:hover{
      background: var(--paper-sunken);
      border-color: var(--line-strong);
    }
    .diagnostics-page .ds-tab.is-active{
      background: var(--paper);
      border-color: var(--sage-500);
      box-shadow: 0 0 0 0.0625rem var(--sage-500), var(--shadow-sm);
    }

    .diagnostics-page .ds-tab-num{
      flex: 0 0 auto;
      padding-top: 0.0625rem;
      color: var(--ink-subtle);
      font-size: 0.625rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.04em;
    }
    .diagnostics-page .ds-tab.is-active .ds-tab-num{ color: var(--sage-500); }

    .diagnostics-page .ds-tab-body{
      display: flex;
      flex-direction: column;
      gap: 0.1875rem;
      min-width: 0;
    }
    .diagnostics-page .ds-tab-kind{
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.25;
      color: var(--ink-muted);
      white-space: nowrap;
    }
    .diagnostics-page .ds-tab.is-active .ds-tab-kind{ color: var(--ink-strong); }
    .diagnostics-page .ds-tab-meta{
      display: flex;
      align-items: center;
      gap: 0.375rem;
      white-space: nowrap;
    }
    .diagnostics-page .ds-tab-date{
      color: var(--ink-subtle);
      font-size: 0.6875rem;
      font-variant-numeric: tabular-nums;
    }

    .diagnostics-page .ds-state{
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.0625rem 0.375rem;
      border-radius: 0.3125rem;
      font-size: 0.625rem;
      font-weight: 600;
      line-height: 1.5;
      white-space: nowrap;
    }
    .diagnostics-page .ds-state::before{
      content: "";
      width: 0.3125rem;
      height: 0.3125rem;
      border-radius: 50%;
      background: currentColor;
    }
    .diagnostics-page .ds-state.is-done{ background: var(--sage-50); color: var(--sage-700); }
    .diagnostics-page .ds-state.is-live{ background: var(--amber-50); color: var(--amber-700); }
    .diagnostics-page .ds-state.is-wait{ background: var(--paper-sunken); color: var(--ink-subtle); }
    .diagnostics-page .ds-tab.is-live:not(.is-active){ border-color: var(--amber-100); }

    .diagnostics-page .ds-empty{
      align-self: center;
      color: var(--ink-subtle);
      font-size: 0.8125rem;
      font-style: italic;
    }

    .diagnostics-page .ds-actions{
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
      flex: 0 0 auto;
    }
    .diagnostics-page .ds-start{
      display: flex;
      align-items: stretch;
      border: 0.0625rem solid var(--line-strong);
      border-radius: var(--radius-sm);
      background: var(--paper);
      overflow: hidden;
      box-shadow: var(--shadow-xs);
    }
    .diagnostics-page .ds-kind{
      padding: 0.4375rem 0.625rem;
      border: none;
      border-right: 0.0625rem solid var(--line);
      background: var(--paper-soft);
      color: var(--ink-muted);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
    .diagnostics-page .ds-kind:disabled{ opacity: 0.5; cursor: default; }

    .diagnostics-page .ds-btn{
      padding: 0.4375rem 0.875rem;
      border: 0.0625rem solid var(--line-strong);
      border-radius: var(--radius-sm);
      background: var(--paper);
      color: var(--ink-strong);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      transition: background .15s ease, border-color .15s ease, color .15s ease;
    }
    .diagnostics-page .ds-btn:disabled{ opacity: 0.5; cursor: default; }
    .diagnostics-page .ds-btn-join:hover:not(:disabled){
      background: var(--sage-50);
      border-color: var(--sage-400);
      color: var(--sage-700);
    }
    .diagnostics-page .ds-btn-start{
      border: none;
      border-radius: 0;
      background: var(--sage-700);
      color: #fff;
    }
    .diagnostics-page .ds-btn-start:hover:not(:disabled){ background: var(--sage-800); }

    .diagnostics-page .ds-note{
      margin: 0.75rem 0 0;
      padding: 0.5rem 0.6875rem;
      border-left: 0.125rem solid var(--amber-500);
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      background: var(--amber-50);
      color: var(--amber-700);
      font-size: 0.75rem;
      line-height: 1.45;
    }

    @media (max-width: 56rem){
      .diagnostics-page .ds-row{ flex-direction: column; align-items: stretch; gap: 0.75rem; }
      .diagnostics-page .ds-tabs{ flex: 0 1 auto; width: 100%; min-width: 0; }
      .diagnostics-page .ds-actions{
        margin-left: 0;
        width: 100%;
        min-width: 0;
        flex-wrap: wrap;
      }
      .diagnostics-page .ds-btn-join{ flex: 1 1 100%; }
      .diagnostics-page .ds-start{ flex: 1 1 auto; min-width: 0; }
      .diagnostics-page .ds-kind{ flex: 0 1 auto; min-width: 0; }
      .diagnostics-page .ds-btn-start{ flex: 1 1 auto; min-width: 0; }
    }
</style>
