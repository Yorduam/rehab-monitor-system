<template>
  <div>
  <!-- ══════════════════════════════════ TEACHER VIEW ══════════════════════════════════ -->
  <div v-if="authStore.isTeacher" class="rd-teacher">

    <div v-if="loading" class="rd-state-load">
      <div class="rd-spinner"></div>
      <p>Загрузка профиля…</p>
    </div>

    <template v-else-if="recipient">

      <!-- BREADCRUMB -->
      <div class="rd-breadcrumb">
        <button class="rd-bc-link" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Реабилитанты
        </button>
        <span class="rd-bc-sep">/</span>
        <span class="rd-bc-curr">{{ recipient.fullName }}</span>
      </div>

      <!-- ALERT BAR -->
      <div v-if="showAlert" class="rd-alert-bar">
        <div class="rd-alert-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/>
          </svg>
        </div>
        <div class="rd-alert-body">
          <div class="rd-alert-title">Важно учитывать на занятиях</div>
          <div class="rd-alert-text">{{ alertText }}</div>
        </div>
        <button class="rd-alert-more" @click="alertExpanded = !alertExpanded">{{ alertExpanded ? 'Скрыть' : 'Подробнее' }}</button>
        <div v-if="alertExpanded" class="rd-alert-expanded">
          <div><strong>Уровень агрессии:</strong> {{ recipient.aggressionLevel }} / 5</div>
          <div v-if="recipient.aggressionNote"><strong>Примечание:</strong> {{ recipient.aggressionNote }}</div>
          <div><strong>Рекомендация:</strong> Требует индивидуального подхода, избегайте провоцирующих ситуаций. Уточните детали у куратора.</div>
        </div>
      </div>

      <!-- ── HERO ── -->
      <section class="rd-hero">
        <div class="rd-hero-banner"></div>

        <div class="rd-hero-body">
          <!-- Avatar -->
          <div class="rd-hero-avatar">{{ initials }}</div>

          <!-- Identity -->
          <div class="rd-hero-identity">
            <div class="rd-id-row">
              <span class="rd-id-chip">R-{{ recipientCode }}</span>
              <span class="rd-status-dot"></span>
              <span class="rd-status-label">{{ statusLabel }}</span>
              <span v-if="stageChipText" class="rd-stage-chip">{{ stageChipText }}</span>
            </div>
            <h1 class="rd-hero-name">{{ recipient.fullName }}</h1>
            <div class="rd-hero-tags">
              <span v-if="ageText" class="rd-tag rd-tag-neutral">{{ ageText }}</span>
              <span v-if="recipient.diagnosis" class="rd-tag rd-tag-blue">{{ recipient.diagnosis }}</span>
              <span v-if="currentGroupName" class="rd-tag rd-tag-amber">{{ currentGroupName }}</span>
              <span v-if="curatorName" class="rd-tag rd-tag-sage">Куратор: {{ curatorName }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="rd-hero-actions">
            <button class="rd-btn rd-btn-secondary" @click="openContactModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013.09 4.18 2 2 0 015.07 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 10a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Позвонить родителю
            </button>
            <button class="rd-btn rd-btn-primary" @click="openModal('record')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Добавить запись
            </button>
            <button class="rd-btn rd-btn-ghost rd-btn-icon" aria-label="Ещё">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18" r="1.6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- STAGE TRACK -->
        <div class="rd-stage-track">
          <div class="rd-stage-label">Маршрут реабилитанта</div>
          <div class="rd-stage-steps">
            <div v-for="(step, i) in stageSteps" :key="i" :class="['rd-stage-step', step.state]">
              <span class="rd-step-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="rd-step-name">{{ step.name }}</span>
            </div>
          </div>
        </div>

        <!-- ATTENDANCE WIDGET -->
        <div class="rd-att-card">
          <div class="rd-att-inner">
            <div class="rd-att-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <div class="rd-att-info">
              <div class="rd-att-t">Посещение сегодня · {{ todayLabel }}</div>
              <div class="rd-att-s">Отметьте присутствие реабилитанта</div>
            </div>
            <div class="rd-att-toggle" role="group" aria-label="Отметка посещения">
              <button :class="['rd-att-btn', attendanceToday === 'yes' ? 'rd-att-yes' : '']" @click="setAttendance('yes')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                Был
              </button>
              <button :class="['rd-att-btn', attendanceToday === 'partial' ? 'rd-att-partial' : '']" @click="setAttendance('partial')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 8v4M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>
                Частично
              </button>
              <button :class="['rd-att-btn', attendanceToday === 'no' ? 'rd-att-no' : '']" @click="setAttendance('no')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Не был
              </button>
            </div>
            <button class="rd-att-detail" @click="openModal('record')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z"/></svg>
              Детально
            </button>
          </div>
        </div>

        <!-- MINI STATS -->
        <div class="rd-mini-stats">
          <div class="rd-mini-stat rd-ms-active">
            <div class="rd-ms-lbl">Посещаемость</div>
            <div class="rd-ms-val">{{ recipient.attendance || 0 }}%</div>
            <div class="rd-ms-trend">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l5-5 5 5M7 7l5-5 5 5"/></svg>
              {{ attendanceTrend }}
            </div>
          </div>
          <div class="rd-mini-stat">
            <div class="rd-ms-lbl">Средний балл</div>
            <div class="rd-ms-val">{{ avgScore }}</div>
            <div v-if="avgScore !== '—'" class="rd-ms-trend">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 17l5-5 5 5M7 7l5-5 5 5"/></svg>
              за цикл
            </div>
            <div v-else class="rd-ms-trend rd-trend-neutral">нет данных</div>
          </div>
          <div class="rd-mini-stat">
            <div class="rd-ms-lbl">В программе</div>
            <div class="rd-ms-val">{{ daysInProgram }}</div>
            <div class="rd-ms-trend rd-trend-neutral">{{ programStartText }}</div>
          </div>
          <div class="rd-mini-stat">
            <div class="rd-ms-lbl">Следующий контроль</div>
            <div class="rd-ms-val">{{ nextControlDate }}</div>
            <div class="rd-ms-trend rd-trend-neutral">диагностика</div>
          </div>
        </div>
      </section>

      <!-- ── TABS ── -->
      <nav class="rd-tabs" role="tablist">
        <button v-for="tab in tabs" :key="tab.id"
          :class="['rd-tab', activeTab === tab.id ? 'active' : '']"
          role="tab" :aria-selected="activeTab === tab.id"
          @click="activeTab = tab.id">
          {{ tab.label }}
          <span v-if="tab.count != null" class="rd-tab-count">{{ tab.count }}</span>
        </button>
      </nav>

      <!-- ── TAB: ОБЗОР ── -->
      <div v-if="activeTab === 'overview'" class="rd-grid">

        <!-- LEFT COLUMN -->
        <div class="rd-col-left">

          <!-- LESSON JOURNAL -->
          <section class="rd-card">
            <div class="rd-card-head">
              <div>
                <h2 class="rd-card-title">Журнал занятий</h2>
                <div class="rd-card-sub">Записи педагогов · последние занятия</div>
              </div>
              <div class="rd-card-head-actions">
                <button class="rd-btn rd-btn-ghost" style="font-size:13px">
                  Все записи ({{ lessons.length }})
                </button>
              </div>
            </div>
            <div class="rd-card-body">
              <div v-if="lessons.length" class="rd-lesson-list">
                <div v-for="lesson in lessons.slice(0, 5)" :key="lesson.id || lesson._id" class="rd-lesson-card">
                  <div class="rd-lesson-head">
                    <div class="rd-lesson-meta">
                      <span class="rd-lm-date">{{ formatLessonDate(lesson.date || lesson.createdAt) }}</span>
                      <template v-if="lesson.time || lesson.date">
                        <span class="rd-sep-dot"></span>
                        <span>{{ lesson.time || formatTime(lesson.date) }}</span>
                      </template>
                      <template v-if="lesson.type || lesson.subject">
                        <span class="rd-sep-dot"></span>
                        <span>{{ lesson.type || lesson.subject }}</span>
                      </template>
                      <template v-if="lesson.teacher || lesson.teacherName">
                        <span class="rd-sep-dot"></span>
                        <span>{{ lesson.teacher || lesson.teacherName }}</span>
                      </template>
                    </div>
                    <span :class="['rd-lesson-type', lessonTypeClass(lesson)]">{{ lessonTypeLabel(lesson) }}</span>
                  </div>
                  <div class="rd-lesson-body">
                    <div class="rd-lesson-title">{{ lesson.title || lesson.name || 'Занятие' }}</div>
                    <div v-if="lesson.note || lesson.description" class="rd-lesson-note">
                      {{ lesson.note || lesson.description }}
                    </div>
                    <div v-if="lesson.markers?.length" class="rd-lesson-markers">
                      <span v-for="m in lesson.markers" :key="m.text" :class="['rd-marker', m.type || 'neutral']">
                        {{ m.text }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="rd-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>Записей о занятиях пока нет</p>
              </div>
            </div>
          </section>

          <!-- GROUP HISTORY -->
          <section class="rd-card">
            <div class="rd-card-head">
              <div>
                <h2 class="rd-card-title">История групп</h2>
                <div class="rd-card-sub">Все перемещения сохраняются вместе с результатами</div>
              </div>
              <div class="rd-card-head-actions">
                <button class="rd-btn rd-btn-secondary rd-btn-sm" @click="openModal('group')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
                  Перевести в группу
                </button>
              </div>
            </div>
            <div class="rd-card-body">
              <div class="rd-group-history">
                <div v-if="currentGroupName" class="rd-group-row rd-gr-current">
                  <div class="rd-gr-period">текущая</div>
                  <div class="rd-gr-info">
                    <div class="rd-gr-name">{{ currentGroupName }}</div>
                    <div class="rd-gr-sub">{{ recipient.group?.schedule || ('Куратор: ' + (curatorName || 'не назначен')) }}</div>
                  </div>
                  <span class="rd-gr-status rd-gr-status-curr">Текущая</span>
                </div>
                <div v-else class="rd-empty-state">
                  <p>Группа не назначена</p>
                </div>
              </div>
            </div>
          </section>

          <!-- RECENT DOCS -->
          <section class="rd-card">
            <div class="rd-card-head">
              <div>
                <h2 class="rd-card-title-sans">Последние документы</h2>
              </div>
              <div class="rd-card-head-actions">
                <button class="rd-btn rd-btn-secondary rd-btn-sm" @click="openModal('document')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  Загрузить
                </button>
                <button class="rd-btn rd-btn-ghost" style="font-size:13px">Все ({{ documents.length }})</button>
              </div>
            </div>
            <div class="rd-card-body">
              <div v-if="documents.length" class="rd-docs-list">
                <div v-for="doc in documents.slice(0, 4)" :key="doc.id" class="rd-doc-row">
                  <div :class="['rd-doc-icon', docIconClass(doc)]">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8"/>
                    </svg>
                  </div>
                  <div class="rd-doc-info">
                    <div class="rd-doc-title">{{ doc.name || doc.title }}</div>
                    <div class="rd-doc-meta">{{ docMeta(doc) }}</div>
                  </div>
                  <span :class="['rd-doc-status', docStatusClass(doc)]">{{ docStatusText(doc) }}</span>
                </div>
              </div>
              <div v-else class="rd-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"/>
                </svg>
                <p>Документов нет</p>
              </div>
            </div>
          </section>

          <!-- FOOTER -->
          <div class="rd-content-footer">
            <span>Создан {{ createdAtText }} · ID R-{{ recipientCode }}</span>
            <button class="rd-btn rd-btn-secondary rd-btn-sm" @click="goBack">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              К списку
            </button>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <aside class="rd-col-right">

          <!-- ATTENDANCE CALENDAR -->
          <section class="rd-card">
            <div class="rd-card-head">
              <div>
                <h2 class="rd-card-title-sans">Посещаемость · 8 недель</h2>
                <div class="rd-card-sub">{{ recipient.attendance || 0 }}% · {{ attendanceTrend }}</div>
              </div>
            </div>
            <div class="rd-card-body">
              <div class="rd-att-cal">
                <div v-for="(cell, ci) in calData" :key="ci" :class="['rd-att-day', cell]"></div>
              </div>
              <div class="rd-att-legend">
                <span class="rd-att-leg-item">
                  <span class="rd-att-leg-dot" style="background:var(--rd-sage-500)"></span>Был
                </span>
                <span class="rd-att-leg-item">
                  <span class="rd-att-leg-dot" style="background:var(--rd-amber-500);opacity:.7"></span>Частично
                </span>
                <span class="rd-att-leg-item">
                  <span class="rd-att-leg-dot" style="background:var(--rd-rose-100)"></span>Не был
                </span>
              </div>
            </div>
          </section>

          <!-- QUICK ACTIONS -->
          <section class="rd-card">
            <div class="rd-card-head">
              <h2 class="rd-card-title-sans">Быстрые действия</h2>
            </div>
            <div class="rd-quick-actions">
              <button class="rd-qa" @click="openModal('record')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z"/></svg>
                Запись по занятию
                <span class="rd-qa-k">N</span>
              </button>
              <button class="rd-qa" @click="openModal('diagnostic')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                Занести диагностику
                <span class="rd-qa-k">D</span>
              </button>
              <button class="rd-qa" @click="openModal('document')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Загрузить справку
                <span class="rd-qa-k">U</span>
              </button>
              <button class="rd-qa" @click="openModal('group')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg>
                Перевести в группу
              </button>
              <button class="rd-qa" @click="openContactModal">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                Написать родителю
              </button>
            </div>
          </section>

          <!-- KEY METRICS -->
          <section class="rd-card">
            <div class="rd-card-head">
              <div>
                <h2 class="rd-card-title-sans">Ключевые показатели</h2>
                <div class="rd-card-sub">Старт → сейчас → цель</div>
              </div>
            </div>
            <div class="rd-card-body">
              <div class="rd-progress-list">
                <div v-for="metric in keyMetrics" :key="metric.label" class="rd-pr-row">
                  <div class="rd-pr-label">{{ metric.label }}</div>
                  <div class="rd-pr-value">
                    <span class="rd-pr-now">{{ metric.now }}</span> / {{ metric.max }}
                  </div>
                  <div class="rd-pr-bar">
                    <div class="rd-pr-fill" :style="{ width: (metric.now / metric.max * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- TEAM -->
          <section class="rd-card">
            <div class="rd-card-head">
              <h2 class="rd-card-title-sans">Команда сопровождения</h2>
            </div>
            <div class="rd-card-body rd-card-body-tight">
              <template v-if="teamMembers.length">
                <div v-for="(person, pi) in teamMembers" :key="pi" class="rd-person">
                  <div :class="['rd-person-av', person.color || 'sage']">{{ person.initials }}</div>
                  <div class="rd-person-info">
                    <div class="rd-person-name">{{ person.name }}</div>
                    <div class="rd-person-role">{{ person.role }}</div>
                  </div>
                  <div class="rd-person-acts">
                    <button v-if="person.phone" class="rd-person-act" aria-label="Позвонить">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013.09 4.18 2 2 0 015.07 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 10a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    </button>
                    <button class="rd-person-act" aria-label="Написать">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </button>
                  </div>
                </div>
              </template>
              <div v-else class="rd-empty-state"><p>Команда не назначена</p></div>
            </div>
          </section>

          <!-- FAMILY -->
          <section class="rd-card">
            <div class="rd-card-head">
              <h2 class="rd-card-title-sans">Семья и контакты</h2>
            </div>
            <div class="rd-card-body rd-card-body-tight">
              <template v-if="familyMembers.length">
                <div v-for="(person, pi) in familyMembers" :key="pi" class="rd-person">
                  <div :class="['rd-person-av', person.color || 'blue']">{{ person.initials }}</div>
                  <div class="rd-person-info">
                    <div class="rd-person-name">{{ person.name }}</div>
                    <div class="rd-person-role">{{ person.role }}</div>
                  </div>
                  <div class="rd-person-acts">
                    <button class="rd-person-act" aria-label="Позвонить">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2A19.86 19.86 0 013.09 4.18 2 2 0 015.07 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L9.09 10a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    </button>
                    <button class="rd-person-act" aria-label="Написать">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    </button>
                  </div>
                </div>
              </template>
              <div v-else class="rd-empty-state"><p>Контакты не указаны</p></div>
            </div>
          </section>

        </aside>
      </div><!-- end overview grid -->

      <!-- ── TAB: ЗАНЯТИЯ И ПОСЕЩАЕМОСТЬ ── -->
      <div v-else-if="activeTab === 'lessons'" class="rd-tab-content">
        <div class="rd-tc-header">
          <div>
            <h2 class="rd-tc-title">Журнал занятий и посещаемости</h2>
            <p class="rd-tc-sub">Все записи педагогов по реабилитанту</p>
          </div>
        </div>

        <div class="rd-att-summary">
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val rd-color-sage">{{ recipient.attendance || 0 }}%</span>
            <span class="rd-att-summary-lbl">Общая посещаемость</span>
          </div>
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val">{{ lessons.length }}</span>
            <span class="rd-att-summary-lbl">Всего записей</span>
          </div>
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val">{{ lessons.filter(l => l.status !== 'absent' && l.status !== 'missed').length }}</span>
            <span class="rd-att-summary-lbl">Посещено</span>
          </div>
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val rd-color-rose">{{ lessons.filter(l => l.status === 'absent' || l.status === 'missed').length }}</span>
            <span class="rd-att-summary-lbl">Пропущено</span>
          </div>
        </div>

        <div class="rd-att-cal-wide">
          <div class="rd-card-head"><h2 class="rd-card-title-sans">Календарь посещений · 8 недель</h2></div>
          <div class="rd-att-cal">
            <div v-for="(cell, ci) in calData" :key="ci" :class="['rd-att-day', cell]"></div>
          </div>
          <div class="rd-att-legend">
            <span class="rd-att-leg-item"><span class="rd-att-leg-dot" style="background:var(--rd-sage-500)"></span>Был</span>
            <span class="rd-att-leg-item"><span class="rd-att-leg-dot" style="background:var(--rd-amber-500);opacity:.7"></span>Частично</span>
            <span class="rd-att-leg-item"><span class="rd-att-leg-dot" style="background:var(--rd-rose-100)"></span>Не был</span>
          </div>
        </div>

        <div v-if="lessons.length" class="rd-lesson-list rd-lesson-list-full">
          <div v-for="lesson in lessons" :key="lesson.id || lesson._id" class="rd-lesson-card">
            <div class="rd-lesson-head">
              <div class="rd-lesson-meta">
                <span class="rd-lm-date">{{ formatLessonDate(lesson.date || lesson.createdAt) }}</span>
                <template v-if="lesson.time || lesson.date">
                  <span class="rd-sep-dot"></span>
                  <span>{{ lesson.time || formatTime(lesson.date) }}</span>
                </template>
                <template v-if="lesson.type || lesson.subject">
                  <span class="rd-sep-dot"></span>
                  <span>{{ lesson.type || lesson.subject }}</span>
                </template>
                <template v-if="lesson.specialist || lesson.teacher || lesson.teacherName">
                  <span class="rd-sep-dot"></span>
                  <span>{{ lesson.specialist || lesson.teacher || lesson.teacherName }}</span>
                </template>
              </div>
              <span :class="['rd-lesson-type', lessonTypeClass(lesson)]">{{ lessonTypeLabel(lesson) }}</span>
            </div>
            <div class="rd-lesson-body">
              <div class="rd-lesson-title">{{ lesson.title || lesson.name || 'Занятие' }}</div>
              <div v-if="lesson.note || lesson.description" class="rd-lesson-note">{{ lesson.note || lesson.description }}</div>
            </div>
          </div>
        </div>
        <div v-else class="rd-empty-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          <p>Записей о занятиях пока нет</p>
        </div>
      </div>

      <!-- ── TAB: ГРУППА И ИСТОРИЯ ── -->
      <div v-else-if="activeTab === 'group'" class="rd-tab-content">
        <div class="rd-tc-header">
          <div>
            <h2 class="rd-tc-title">Группа и история</h2>
            <p class="rd-tc-sub">Текущая группа и состав участников</p>
          </div>
        </div>

        <section v-if="currentGroupName" class="rd-card">
          <div class="rd-card-head">
            <div>
              <h2 class="rd-card-title">{{ currentGroupName }}</h2>
              <div class="rd-card-sub">{{ recipient.group?.direction || 'Группа реабилитации' }} · Куратор: {{ curatorName || 'не назначен' }}</div>
            </div>
          </div>
          <div class="rd-card-body">
            <div v-if="groupMembersLoading" class="rd-state-load" style="min-height:100px">
              <div class="rd-spinner"></div>
            </div>
            <div v-else-if="groupMembers.length" class="rd-group-members">
              <div v-for="member in groupMembers" :key="member.id" :class="['rd-gm-row', member.id == recipientId ? 'rd-gm-self' : '']">
                <div class="rd-gm-avatar">{{ initFrom(member.fullName) }}</div>
                <div class="rd-gm-info">
                  <div class="rd-gm-name">{{ member.fullName }}
                    <span v-if="member.id == recipientId" class="rd-gm-badge">Текущий</span>
                  </div>
                  <div class="rd-gm-meta">{{ member.age ? member.age + ' лет' : '' }}{{ member.age && member.diagnosis ? ' · ' : '' }}{{ member.diagnosis || '' }}</div>
                </div>
              </div>
            </div>
            <div v-else class="rd-empty-state"><p>В группе пока нет участников</p></div>
          </div>
        </section>

        <div v-else class="rd-empty-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <p>Реабилитант не состоит в группе</p>
        </div>
      </div>

      <!-- ── TAB: РАЗВИТИЕ ── -->
      <div v-else-if="activeTab === 'development'" class="rd-tab-content">
        <div class="rd-tc-header">
          <div>
            <h2 class="rd-tc-title">Развитие</h2>
            <p class="rd-tc-sub">Оценки навыков и прогресс реабилитанта</p>
          </div>
        </div>

        <div class="rd-dev-grid">
          <div v-for="skill in developmentSkills" :key="skill.label" class="rd-dev-card">
            <div class="rd-dev-card-head">
              <span class="rd-dev-label">{{ skill.label }}</span>
              <span class="rd-dev-score">{{ skill.value }} <span class="rd-dev-max">/ {{ skill.max }}</span></span>
            </div>
            <div class="rd-pr-bar rd-dev-bar">
              <div class="rd-pr-fill" :style="{ width: (skill.value / skill.max * 100) + '%', background: skill.color }"></div>
            </div>
            <div class="rd-dev-desc">{{ skill.description }}</div>
          </div>
        </div>

        <section class="rd-card" style="margin-top:1.25rem">
          <div class="rd-card-head">
            <div>
              <h2 class="rd-card-title">Ключевые показатели</h2>
              <div class="rd-card-sub">Прогресс по реабилитационным целям</div>
            </div>
          </div>
          <div class="rd-card-body">
            <div class="rd-progress-list">
              <div v-for="metric in keyMetrics" :key="metric.label" class="rd-pr-row">
                <div class="rd-pr-label">{{ metric.label }}</div>
                <div class="rd-pr-value">
                  <span class="rd-pr-now">{{ metric.now }}</span> / {{ metric.max }}
                </div>
                <div class="rd-pr-bar">
                  <div class="rd-pr-fill" :style="{ width: (metric.now / metric.max * 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rd-card" style="margin-top:1.25rem">
          <div class="rd-card-head">
            <h2 class="rd-card-title">Общая статистика</h2>
          </div>
          <div class="rd-card-body">
            <div class="rd-dev-stats">
              <div class="rd-dev-stat-item">
                <span class="rd-dev-stat-val">{{ daysInProgram }}</span>
                <span class="rd-dev-stat-lbl">В программе</span>
              </div>
              <div class="rd-dev-stat-item">
                <span class="rd-dev-stat-val">{{ avgScore }}</span>
                <span class="rd-dev-stat-lbl">Средний балл</span>
              </div>
              <div class="rd-dev-stat-item">
                <span class="rd-dev-stat-val">{{ recipient.attendance || 0 }}%</span>
                <span class="rd-dev-stat-lbl">Посещаемость</span>
              </div>
              <div class="rd-dev-stat-item">
                <span class="rd-dev-stat-val">{{ nextControlDate }}</span>
                <span class="rd-dev-stat-lbl">Следующий контроль</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- ── TAB: ДИАГНОСТИКА ── -->
      <div v-else-if="activeTab === 'diagnostics'" class="rd-tab-content">
        <div class="rd-tc-header">
          <div>
            <h2 class="rd-tc-title">Диагностика</h2>
            <p class="rd-tc-sub">Плановые и пройденные обследования</p>
          </div>
        </div>

        <div class="rd-diag-summary">
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val">{{ diagnostics.length }}</span>
            <span class="rd-att-summary-lbl">Всего</span>
          </div>
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val rd-color-sage">{{ diagnostics.filter(d => d.status === 'done').length }}</span>
            <span class="rd-att-summary-lbl">Пройдено</span>
          </div>
          <div class="rd-att-summary-item">
            <span class="rd-att-summary-val rd-color-amber">{{ diagnostics.filter(d => d.status === 'planned').length }}</span>
            <span class="rd-att-summary-lbl">Запланировано</span>
          </div>
        </div>

        <div v-if="diagnosticsLoading" class="rd-state-load" style="min-height:150px">
          <div class="rd-spinner"></div>
        </div>
        <div v-else-if="diagnostics.length" class="rd-diag-list">
          <div v-for="diag in diagnostics" :key="diag.id" class="rd-diag-card">
            <div class="rd-diag-status-bar" :class="diag.status === 'done' ? 'rd-diag-done' : 'rd-diag-planned'"></div>
            <div class="rd-diag-body">
              <div class="rd-diag-head">
                <div class="rd-diag-name">{{ diag.name }}</div>
                <span :class="['rd-diag-badge', diag.status === 'done' ? 'rd-badge-sage' : 'rd-badge-amber']">
                  {{ diag.status === 'done' ? 'Пройдено' : 'Запланировано' }}
                </span>
              </div>
              <div class="rd-diag-meta">
                <span v-if="diag.date">{{ formatDate(diag.date) }}</span>
                <template v-if="diag.time"><span class="rd-sep-dot"></span><span>{{ diag.time }}</span></template>
                <template v-if="diag.specialist"><span class="rd-sep-dot"></span><span>{{ diag.specialist }}</span></template>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="rd-empty-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
          <p>Диагностических записей нет</p>
        </div>
      </div>

      <!-- ── TAB: ДОКУМЕНТЫ ── -->
      <div v-else-if="activeTab === 'documents'" class="rd-tab-content">
        <div class="rd-tc-header">
          <div>
            <h2 class="rd-tc-title">Документы</h2>
            <p class="rd-tc-sub">Все документы реабилитанта</p>
          </div>
        </div>

        <div v-if="documents.length" class="rd-docs-grid">
          <div v-for="doc in documents" :key="doc.id" class="rd-doc-card">
            <div :class="['rd-doc-card-icon', docIconClass(doc)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8"/>
              </svg>
            </div>
            <div class="rd-doc-card-info">
              <div class="rd-doc-card-name">{{ doc.name || doc.title || 'Документ' }}</div>
              <div class="rd-doc-card-meta">{{ docMeta(doc) }}</div>
            </div>
            <span :class="['rd-doc-status', docStatusClass(doc)]">{{ docStatusText(doc) }}</span>
          </div>
        </div>
        <div v-else class="rd-empty-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"/></svg>
          <p>Документов пока нет</p>
        </div>
      </div>

      <!-- ── TAB: СЕМЬЯ И КОНТАКТЫ ── -->
      <div v-else-if="activeTab === 'family'" class="rd-tab-content">
        <div class="rd-tc-header">
          <div>
            <h2 class="rd-tc-title">Семья и контакты</h2>
            <p class="rd-tc-sub">Законные представители и контактные лица</p>
          </div>
        </div>

        <section v-if="recipient.legalRepresentative" class="rd-card">
          <div class="rd-card-head">
            <h2 class="rd-card-title">Законный представитель</h2>
          </div>
          <div class="rd-card-body rd-card-body-tight">
            <div class="rd-person">
              <div class="rd-person-av blue">{{ initFrom(recipient.legalRepresentative) }}</div>
              <div class="rd-person-info">
                <div class="rd-person-name">{{ recipient.legalRepresentative }}</div>
                <div class="rd-person-role">Законный представитель</div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="familyMembers.length" class="rd-card" style="margin-top:1rem">
          <div class="rd-card-head">
            <h2 class="rd-card-title">Контактные лица</h2>
          </div>
          <div class="rd-card-body rd-card-body-tight">
            <div v-for="(person, pi) in familyMembers" :key="pi" class="rd-person">
              <div :class="['rd-person-av', person.color || 'blue']">{{ person.initials }}</div>
              <div class="rd-person-info">
                <div class="rd-person-name">{{ person.name }}</div>
                <div class="rd-person-role">{{ person.role }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="rd-card" style="margin-top:1rem">
          <div class="rd-card-head">
            <h2 class="rd-card-title">Контактная информация</h2>
          </div>
          <div class="rd-card-body">
            <div class="rd-contact-grid">
              <div class="rd-contact-item">
                <span class="rd-contact-label">Контакты</span>
                <span class="rd-contact-value">{{ typeof recipient.contacts === 'string' ? recipient.contacts : (recipient.contacts ? 'Указаны' : '—') }}</span>
              </div>
              <div class="rd-contact-item">
                <span class="rd-contact-label">Адрес</span>
                <span class="rd-contact-value">{{ recipient.address || '—' }}</span>
              </div>
            </div>
          </div>
        </section>

        <div v-if="!recipient.legalRepresentative && !familyMembers.length && !recipient.contacts && !recipient.address" class="rd-empty-block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p>Информация о семье и контактах не заполнена</p>
        </div>
      </div>

      <!-- ══════════ MODALS ══════════ -->

      <!-- ADD RECORD MODAL -->
      <teleport to="body">
        <div v-if="modal === 'record'" class="rd-overlay" @click.self="closeModal">
          <div class="rd-modal">
            <div class="rd-modal-head">
              <h3>Добавить запись</h3>
              <button class="rd-modal-close" @click="closeModal">&times;</button>
            </div>
            <form class="rd-modal-body" @submit.prevent="submitRecord">
              <label class="rd-field">
                <span>Название</span>
                <input v-model="form.title" required placeholder="Тема занятия или события" />
              </label>
              <div class="rd-field-row">
                <label class="rd-field">
                  <span>Дата</span>
                  <input type="date" v-model="form.date" required />
                </label>
                <label class="rd-field">
                  <span>Время</span>
                  <input type="time" v-model="form.time" />
                </label>
              </div>
              <label class="rd-field">
                <span>Тип</span>
                <select v-model="form.type">
                  <option value="lesson">Занятие</option>
                  <option value="meeting">Встреча</option>
                  <option value="note">Заметка</option>
                  <option value="diagnostic">Диагностика</option>
                </select>
              </label>
              <label class="rd-field">
                <span>Специалист</span>
                <input v-model="form.specialist" placeholder="ФИО специалиста" />
              </label>
              <label class="rd-field">
                <span>Статус</span>
                <select v-model="form.status">
                  <option value="done">Выполнено</option>
                  <option value="planned">Запланировано</option>
                </select>
              </label>
              <div class="rd-modal-actions">
                <button type="button" class="rd-btn rd-btn-secondary" @click="closeModal">Отмена</button>
                <button type="submit" class="rd-btn rd-btn-primary" :disabled="saving">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
              </div>
            </form>
          </div>
        </div>
      </teleport>

      <!-- ADD DIAGNOSTIC MODAL -->
      <teleport to="body">
        <div v-if="modal === 'diagnostic'" class="rd-overlay" @click.self="closeModal">
          <div class="rd-modal">
            <div class="rd-modal-head">
              <h3>Занести диагностику</h3>
              <button class="rd-modal-close" @click="closeModal">&times;</button>
            </div>
            <form class="rd-modal-body" @submit.prevent="submitDiagnostic">
              <label class="rd-field">
                <span>Название обследования</span>
                <input v-model="form.title" required placeholder="Например: Первичная диагностика" />
              </label>
              <div class="rd-field-row">
                <label class="rd-field">
                  <span>Дата</span>
                  <input type="date" v-model="form.date" required />
                </label>
                <label class="rd-field">
                  <span>Время</span>
                  <input type="time" v-model="form.time" />
                </label>
              </div>
              <label class="rd-field">
                <span>Специалист</span>
                <input v-model="form.specialist" placeholder="ФИО специалиста" />
              </label>
              <label class="rd-field">
                <span>Статус</span>
                <select v-model="form.status">
                  <option value="planned">Запланировано</option>
                  <option value="done">Пройдено</option>
                </select>
              </label>
              <div class="rd-modal-actions">
                <button type="button" class="rd-btn rd-btn-secondary" @click="closeModal">Отмена</button>
                <button type="submit" class="rd-btn rd-btn-primary" :disabled="saving">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
              </div>
            </form>
          </div>
        </div>
      </teleport>

      <!-- TRANSFER GROUP MODAL -->
      <teleport to="body">
        <div v-if="modal === 'group'" class="rd-overlay" @click.self="closeModal">
          <div class="rd-modal">
            <div class="rd-modal-head">
              <h3>Перевести в группу</h3>
              <button class="rd-modal-close" @click="closeModal">&times;</button>
            </div>
            <div class="rd-modal-body">
              <div v-if="availableGroupsLoading" class="rd-state-load" style="min-height:80px"><div class="rd-spinner"></div></div>
              <div v-else-if="availableGroups.length" class="rd-group-pick-list">
                <button v-for="g in availableGroups" :key="g.id"
                  :class="['rd-group-pick', form.groupId === g.id ? 'rd-group-pick-active' : '']"
                  @click="form.groupId = g.id">
                  <div class="rd-gp-name">{{ g.name }}</div>
                  <div class="rd-gp-meta">{{ g.curator || 'Без куратора' }} · {{ g.participantsCount ?? 0 }} чел.</div>
                </button>
              </div>
              <div v-else class="rd-empty-state"><p>Нет доступных групп</p></div>
              <div class="rd-modal-actions">
                <button type="button" class="rd-btn rd-btn-secondary" @click="closeModal">Отмена</button>
                <button type="button" class="rd-btn rd-btn-primary" :disabled="!form.groupId || saving" @click="submitGroupTransfer">{{ saving ? 'Перевод…' : 'Перевести' }}</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>

      <!-- UPLOAD DOCUMENT MODAL -->
      <teleport to="body">
        <div v-if="modal === 'document'" class="rd-overlay" @click.self="closeModal">
          <div class="rd-modal">
            <div class="rd-modal-head">
              <h3>Загрузить документ</h3>
              <button class="rd-modal-close" @click="closeModal">&times;</button>
            </div>
            <form class="rd-modal-body" @submit.prevent="submitDocument">
              <label class="rd-field">
                <span>Название документа</span>
                <input v-model="form.title" required placeholder="Например: Справка ПМПК" />
              </label>
              <label class="rd-field">
                <span>Тип</span>
                <select v-model="form.docType">
                  <option value="certificate">Справка</option>
                  <option value="program">Программа</option>
                  <option value="report">Отчёт</option>
                  <option value="other">Другое</option>
                </select>
              </label>
              <label class="rd-field">
                <span>Ссылка на файл (URL)</span>
                <input v-model="form.url" placeholder="https://..." />
              </label>
              <div class="rd-modal-actions">
                <button type="button" class="rd-btn rd-btn-secondary" @click="closeModal">Отмена</button>
                <button type="submit" class="rd-btn rd-btn-primary" :disabled="saving">{{ saving ? 'Сохранение…' : 'Сохранить' }}</button>
              </div>
            </form>
          </div>
        </div>
      </teleport>

      <!-- CONTACT INFO MODAL -->
      <teleport to="body">
        <div v-if="modal === 'contact'" class="rd-overlay" @click.self="closeModal">
          <div class="rd-modal rd-modal-sm">
            <div class="rd-modal-head">
              <h3>Контактная информация</h3>
              <button class="rd-modal-close" @click="closeModal">&times;</button>
            </div>
            <div class="rd-modal-body">
              <div v-if="recipient.legalRepresentative" class="rd-contact-block">
                <div class="rd-contact-label">Законный представитель</div>
                <div class="rd-contact-value">{{ recipient.legalRepresentative }}</div>
              </div>
              <div v-if="recipient.contacts" class="rd-contact-block">
                <div class="rd-contact-label">Контакт</div>
                <div class="rd-contact-value rd-contact-phone">{{ typeof recipient.contacts === 'string' ? recipient.contacts : 'Указан' }}</div>
              </div>
              <div v-if="!recipient.legalRepresentative && !recipient.contacts" class="rd-empty-state"><p>Контакты не указаны</p></div>
              <div class="rd-modal-actions">
                <button type="button" class="rd-btn rd-btn-secondary" @click="closeModal">Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      </teleport>

    </template>

    <div v-else class="rd-state-load">
      <p>Реабилитант не найден</p>
      <button class="rd-btn rd-btn-secondary" @click="goBack">← К списку</button>
    </div>
  </div>

  <!-- ══════════════════════════════════ ADMIN VIEW ══════════════════════════════════ -->
  <div v-else>
    <div class="recipient-details-page" v-if="recipient">
      <div class="breadcrumb-container">
        <span class="breadcrumb-link" @click="goBack">Реабилитанты</span> ›
        <span class="breadcrumb-current">{{ recipient.fullName }}</span>
      </div>
      <div class="profile-header">
        <div class="profile-photo">
          <div class="profile-initials">{{ initials }}</div>
        </div>
        <div>
          <h2 class="profile-name">{{ recipient.fullName }}</h2>
          <p class="profile-meta">{{ recipient.age }} лет · {{ recipient.diagnosis || 'Диагноз не указан' }}</p>
        </div>
      </div>
      <div class="profile-tabs">
        <button v-for="tab in adminTabs" :key="tab.id"
          :class="{ active: activeAdminTab === tab.id }"
          @click="activeAdminTab = tab.id">{{ tab.label }}</button>
      </div>
      <div class="tab-content">
        <div v-if="activeAdminTab === 'general'" class="general-info-grid">
          <div class="info-card"><span class="label">Группа</span><span class="value">{{ recipient.group?.name || recipient.groupName || '—' }}</span></div>
          <div class="info-card"><span class="label">Куратор</span><span class="value">{{ recipient.group?.curator?.fullName || '—' }}</span></div>
          <div class="info-card"><span class="label">Диагноз</span><span class="value">{{ recipient.diagnosis || '—' }}</span></div>
          <div class="info-card"><span class="label">Посещаемость</span><span class="value">{{ recipient.attendance || 0 }}%</span></div>
          <div class="info-card"><span class="label">Контакты</span><span class="value">{{ recipient.contacts || '—' }}</span></div>
          <div class="info-card"><span class="label">Законный представитель</span><span class="value">{{ recipient.legalRepresentative || '—' }}</span></div>
          <div class="info-card"><span class="label">Уровень агрессии</span><span class="value">{{ recipient.aggressionLevel || 1 }} / 5</span></div>
          <div class="info-card"><span class="label">Статус</span><span class="value">{{ recipient.completionStatus === 'completed' ? 'Завершил' : 'В процессе' }}</span></div>
          <div class="info-card full-width"><span class="label">Примечание</span><span class="value">{{ recipient.aggressionNote || '—' }}</span></div>
        </div>
        <div v-if="activeAdminTab === 'documents'" class="documents-list">
          <div v-if="!documents.length" class="empty-placeholder"><p>Нет загруженных документов</p></div>
          <div v-for="doc in documents" :key="doc.id" class="document-item"><span>{{ doc.name }}</span></div>
        </div>
      </div>
      <div class="profile-actions">
        <button class="btn-secondary" @click="goBack">Закрыть</button>
      </div>
    </div>
    <div v-else class="loading-state">Загрузка...</div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { usePageStore } from '../stores/page';
import api from '../api';

const authStore = useAuthStore();
const pageStore  = usePageStore();
const recipientId = pageStore.params?.recipientId;

// ── Abort controllers (prevent state mutation after unmount) ──
let abortRecipient = new AbortController();
let abortLessons   = new AbortController();
let abortDocuments = new AbortController();
let isMounted = true;

// ── State ──
const loading      = ref(true);
const recipient    = ref(null);
const lessons      = ref([]);
const documents    = ref([]);
const diagnostics  = ref([]);
const diagnosticsLoading = ref(false);
const groupMembers = ref([]);
const groupMembersLoading = ref(false);
const activeTab      = ref('overview');
const activeAdminTab = ref('general');
const attendanceToday = ref(null);
const calData = ref([]);
const alertExpanded = ref(false);
const modal = ref(null);
const saving = ref(false);
const availableGroups = ref([]);
const availableGroupsLoading = ref(false);
const form = ref({
  title: '', date: new Date().toISOString().slice(0, 10), time: '',
  type: 'lesson', specialist: '', status: 'done',
  groupId: null, docType: 'certificate', url: ''
});

// ── Tabs ──
const tabs = [
  { id: 'overview',     label: 'Обзор' },
  { id: 'lessons',      label: 'Занятия и посещаемость', count: null },
  { id: 'group',        label: 'Группа и история' },
  { id: 'development',  label: 'Развитие' },
  { id: 'diagnostics',  label: 'Диагностика' },
  { id: 'documents',    label: 'Документы' },
  { id: 'family',       label: 'Семья и контакты' },
];
const adminTabs = [
  { id: 'general',   label: 'Общие сведения' },
  { id: 'documents', label: 'Документы' },
];

// ── Computed ──
const initials = computed(() => {
  if (!recipient.value?.fullName) return '?';
  return recipient.value.fullName.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

const recipientCode = computed(() =>
  recipient.value?.id ? String(recipient.value.id).padStart(6, '0') : '000000'
);

const statusLabel = computed(() =>
  recipient.value?.completionStatus === 'completed' ? 'Завершил' : 'Зачислен'
);

const currentGroupName = computed(() =>
  recipient.value?.groupName || recipient.value?.group?.name || ''
);

const stageChipText = computed(() => {
  const g = currentGroupName.value;
  return g ? `группа «${g}»` : '';
});

const curatorName = computed(() =>
  recipient.value?.group?.curator?.fullName || recipient.value?.curatorName || ''
);

const ageText = computed(() => {
  const age = recipient.value?.age;
  const dob = recipient.value?.dateOfBirth;
  if (age && dob) return `${age} лет · род. ${formatDate(dob)}`;
  if (age)        return `${age} лет`;
  return '';
});

const showAlert = computed(() =>
  Number(recipient.value?.aggressionLevel) >= 3 || !!recipient.value?.aggressionNote
);

const alertText = computed(() =>
  recipient.value?.aggressionNote || 'Требует особого внимания на занятиях. Уточните подробности у куратора.'
);

const stageSteps = computed(() => {
  const names = ['Заявка', 'Заявление', 'Диагностика', 'Зачисление', 'Занятия в группе', 'Итоги цикла'];
  const statusMap = { application: 0, statement: 1, diagnostics: 2, enrollment: 3, completed: 6 };
  const cur = statusMap[recipient.value?.completionStatus] ?? 4;
  return names.map((name, i) => ({
    name,
    state: i < cur ? 'done' : i === cur ? 'current' : '',
  }));
});

const todayLabel = computed(() => {
  const days   = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
});

const attendanceTrend = computed(() => {
  const att   = recipient.value?.attendance || 0;
  const total = Math.max(1, lessons.value.length || 38);
  return `${Math.round(att / 100 * total)} из ${total} занятий`;
});

const avgScore = computed(() => recipient.value?.avgScore ?? '—');

const daysInProgram = computed(() => {
  const d = recipient.value?.createdAt || recipient.value?.enrolledAt;
  if (!d) return '—';
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return days > 0 ? `${days} дн` : '—';
});

const programStartText = computed(() => {
  const d = recipient.value?.createdAt || recipient.value?.enrolledAt;
  return d ? `с ${formatShortDate(d)}` : '';
});

const nextControlDate = computed(() => {
  const d = recipient.value?.nextControlDate;
  return d ? formatShortDate(d) : '—';
});

const createdAtText = computed(() => {
  const d = recipient.value?.createdAt;
  return d ? formatDate(d) : '—';
});

const keyMetrics = computed(() => {
  if (recipient.value?.metrics?.length) return recipient.value.metrics;
  return [
    { label: 'Коммуникация со взрослым', now: 3, max: 4 },
    { label: 'Включение в группу',        now: 2, max: 3 },
    { label: 'Самостоятельность',          now: 2, max: 3 },
    { label: 'Творческая инициатива',      now: 4, max: 4 },
  ];
});

const teamMembers = computed(() => {
  if (recipient.value?.specialists?.length) {
    return recipient.value.specialists.map(s => ({
      name: s.fullName || s.name,
      role: s.role || 'Специалист',
      initials: initFrom(s.fullName || s.name),
      color: 'sage', phone: !!s.phone,
    }));
  }
  const c = curatorName.value;
  return c ? [{ name: c, role: 'Куратор', initials: initFrom(c), color: 'sage', phone: false }] : [];
});

const developmentSkills = computed(() => [
  { label: 'Коммуникация со взрослым', value: recipient.value?.commScore || 0, max: 5, color: 'var(--rd-sage-500)', description: 'Способность устанавливать и поддерживать контакт с педагогами' },
  { label: 'Включение в группу', value: recipient.value?.groupScore || 0, max: 5, color: 'var(--rd-blue-500)', description: 'Участие в групповых активностях, взаимодействие со сверстниками' },
  { label: 'Самостоятельность', value: recipient.value?.selfScore || 0, max: 5, color: 'var(--rd-amber-500)', description: 'Выполнение заданий и действий без помощи' },
  { label: 'Творческая инициатива', value: recipient.value?.creativityScore || 0, max: 5, color: 'var(--rd-rose-500)', description: 'Проявление инициативы в творческих и игровых процессах' },
]);

const familyMembers = computed(() => {
  const raw = recipient.value?.contacts;
  if (Array.isArray(raw) && raw.length) {
    return raw.map(c => ({
      name:     c.name || c.fullName || 'Контакт',
      role:     c.relation || c.role || 'Контакт',
      initials: initFrom(c.name || c.fullName || '?'),
      color: 'blue',
    }));
  }
  const rep = recipient.value?.legalRepresentative;
  return rep ? [{ name: rep, role: 'Законный представитель', initials: initFrom(rep), color: 'blue' }] : [];
});

// ── Helpers ──
function initFrom(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}
function formatDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const m = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  return `${dt.getDate()} ${m[dt.getMonth()]} ${dt.getFullYear()}`;
}
function formatShortDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  const m = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  return `${dt.getDate()} ${m[dt.getMonth()]}`;
}
function formatLessonDate(d) {
  if (!d) return '—';
  const dt   = new Date(d);
  const days = ['вс','пн','вт','ср','чт','пт','сб'];
  const m    = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
  return `${dt.getDate()} ${m[dt.getMonth()]}, ${days[dt.getDay()]}`;
}
function formatTime(d) {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
}
function lessonTypeClass(l) {
  if (l.status === 'absent' || l.status === 'missed') return 'rd-lt-neutral';
  if (l.difficulty || l.status === 'partial')          return 'rd-lt-rose';
  return 'rd-lt-sage';
}
function lessonTypeLabel(l) {
  if (l.status === 'absent' || l.status === 'missed') return 'Пропуск';
  if (l.difficulty || l.status === 'partial')          return 'С трудностью';
  return 'Занятие';
}
function docIconClass(doc) {
  if (doc.status === 'expiring') return 'amber';
  if ((doc.name || '').toLowerCase().includes('программ')) return 'sage';
  return '';
}
function docMeta(doc) {
  const parts = [];
  if (doc.fileType) parts.push(doc.fileType.toUpperCase());
  const ts = doc.createdAt || doc.uploadedAt;
  if (ts) parts.push(`загружен ${formatDate(ts)}`);
  return parts.join(' · ') || 'Документ';
}
function docStatusClass(doc) { return doc.status === 'expiring' ? 'amber' : 'sage'; }
function docStatusText(doc) {
  if (doc.status === 'expiring') return 'Истекает';
  if (doc.status === 'archived') return 'Архив';
  return 'Актуален';
}

function generateCalData(attendance) {
  const att  = Math.min(1, Math.max(0, (attendance || 80) / 100));
  let seed   = parseInt(recipientId) || 12345;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const cells = [];
  for (let w = 0; w < 8; w++) {
    for (let d = 0; d < 7; d++) {
      if ([0, 2, 3, 5].includes(d)) {
        const r = rand();
        cells.push(r < att * 0.88 ? 'yes' : r < att ? 'partial' : 'no');
      } else {
        cells.push('none');
      }
    }
  }
  return cells;
}

// ── Actions ──
const goBack = () => {
  // (0,0) — совместимо со всеми браузерами, всегда мгновенно
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  pageStore.setPage('recipients', 'Реабилитанты', {});
};

const setAttendance = async (val) => {
  const prev = attendanceToday.value;
  attendanceToday.value = prev === val ? null : val;
  if (attendanceToday.value) {
    try {
      await api.post('/timeline', {
        title: `Посещение: ${val === 'yes' ? 'Был' : val === 'partial' ? 'Частично' : 'Не был'}`,
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        type: 'attendance',
        recipientId,
        status: 'done'
      });
    } catch { attendanceToday.value = prev; }
  }
};

function resetForm() {
  form.value = {
    title: '', date: new Date().toISOString().slice(0, 10), time: '',
    type: 'lesson', specialist: '', status: 'done',
    groupId: null, docType: 'certificate', url: ''
  };
}

function openModal(type) {
  resetForm();
  modal.value = type;
  if (type === 'group') loadAvailableGroups();
}

function closeModal() { modal.value = null; }

function openContactModal() { modal.value = 'contact'; }

async function loadAvailableGroups() {
  availableGroupsLoading.value = true;
  try {
    const { data } = await api.get('/groups', { params: { limit: 50 } });
    availableGroups.value = Array.isArray(data) ? data : (data.data || []);
  } catch { availableGroups.value = []; }
  finally { availableGroupsLoading.value = false; }
}

async function submitRecord() {
  saving.value = true;
  try {
    await api.post('/timeline', {
      title: form.value.title,
      date: form.value.date,
      time: form.value.time,
      type: form.value.type,
      specialist: form.value.specialist,
      status: form.value.status,
      recipientId
    });
    closeModal();
    loadLessons();
  } catch (e) { console.error('submitRecord', e); }
  finally { saving.value = false; }
}

async function submitDiagnostic() {
  saving.value = true;
  try {
    await api.post('/diagnostics', {
      name: form.value.title,
      date: form.value.date,
      time: form.value.time,
      specialist: form.value.specialist,
      status: form.value.status,
      recipientId
    });
    closeModal();
    diagnostics.value = [];
    loadDiagnostics();
  } catch (e) { console.error('submitDiagnostic', e); }
  finally { saving.value = false; }
}

async function submitGroupTransfer() {
  if (!form.value.groupId) return;
  saving.value = true;
  try {
    const { data } = await api.put(`/recipients/${recipientId}`, {
      ...recipient.value,
      groupId: form.value.groupId
    });
    recipient.value = data;
    closeModal();
    groupMembers.value = [];
    loadGroupMembers();
  } catch (e) { console.error('submitGroupTransfer', e); }
  finally { saving.value = false; }
}

async function submitDocument() {
  saving.value = true;
  try {
    await api.post('/documents', {
      name: form.value.title,
      type: form.value.docType,
      url: form.value.url || null,
      recipientId
    });
    closeModal();
    loadDocuments();
  } catch (e) { console.error('submitDocument', e); }
  finally { saving.value = false; }
}

// ── Data loading ──
const loadRecipient = async () => {
  if (!recipientId) { loading.value = false; return; }
  try {
    const { data } = await api.get(`/recipients/${recipientId}`);
    if (!isMounted) return;
    recipient.value = data;
    calData.value   = generateCalData(data.attendance);
    // update tab counts if we have data
    const lIdx = tabs.findIndex(t => t.id === 'lessons');
    if (lIdx !== -1) tabs[lIdx].count = null; // filled after lessons load
  } catch (err) {
    if (!isMounted) return;
    console.error('loadRecipient', err);
  } finally {
    if (isMounted) loading.value = false;
  }
};

const loadLessons = async () => {
  if (!recipientId) return;
  try {
    const { data } = await api.get('/timeline', { params: { recipientId } });
    if (!isMounted) return;
    lessons.value = Array.isArray(data) ? data : (data.items || data.events || []);
  } catch { if (isMounted) lessons.value = []; }
};

const loadDocuments = async () => {
  if (!recipientId) return;
  try {
    const { data } = await api.get(`/documents/recipient/${recipientId}`);
    if (!isMounted) return;
    documents.value = Array.isArray(data) ? data : (data.items || data.documents || []);
  } catch { if (isMounted) documents.value = []; }
};

const loadDiagnostics = async () => {
  if (!recipientId) return;
  diagnosticsLoading.value = true;
  try {
    const { data } = await api.get('/diagnostics', { params: { recipientId, limit: 100 } });
    if (!isMounted) return;
    diagnostics.value = Array.isArray(data) ? data : (data.data || data.items || []);
  } catch { if (isMounted) diagnostics.value = []; }
  finally { if (isMounted) diagnosticsLoading.value = false; }
};

const loadGroupMembers = async () => {
  const gId = recipient.value?.groupId;
  if (!gId) return;
  groupMembersLoading.value = true;
  try {
    const { data } = await api.get(`/groups/${gId}/recipients`);
    if (!isMounted) return;
    groupMembers.value = Array.isArray(data) ? data : [];
  } catch { if (isMounted) groupMembers.value = []; }
  finally { if (isMounted) groupMembersLoading.value = false; }
};

watch(activeTab, (tab) => {
  if (tab === 'diagnostics' && !diagnostics.value.length && !diagnosticsLoading.value) loadDiagnostics();
  if (tab === 'group' && !groupMembers.value.length && !groupMembersLoading.value) loadGroupMembers();
});

const handleKeydown = (e) => {
  if (modal.value) { if (e.key === 'Escape') closeModal(); return; }
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Escape') goBack();
  if (e.key === 'n' || e.key === 'N') openModal('record');
  if (e.key === 'd' || e.key === 'D') openModal('diagnostic');
  if (e.key === 'u' || e.key === 'U') openModal('document');
};

onMounted(() => {
  isMounted = true;
  loadRecipient();
  loadLessons();
  loadDocuments();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  isMounted = false;
  abortRecipient.abort();
  abortLessons.abort();
  abortDocuments.abort();
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style>
/* Google Fonts — loaded once globally */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Geist:wght@300;400;500;600;700&display=swap');
</style>

<style scoped>
/* ═══════════════════════════════════════════════════════════
   TEACHER RECIPIENT DETAIL  — all rules under .rd-teacher
   ═══════════════════════════════════════════════════════════ */
.rd-teacher :where(button) {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.rd-teacher {
  /* ── design tokens ── */
  --rd-font-serif: 'Fraunces', Georgia, serif;
  --rd-font-sans:  'Geist', system-ui, sans-serif;
  --rd-canvas:      #F7F4ED;
  --rd-paper:       #FFFFFF;
  --rd-paper-soft:  #F3EEE4;
  --rd-paper-sunken:#EDE8DD;
  --rd-ink:         #1A211A;
  --rd-ink-strong:  #0F140F;
  --rd-ink-muted:   #5C6356;
  --rd-ink-subtle:  #8B9084;
  --rd-line:        #E4DECF;
  --rd-line-soft:   #EFEADC;
  --rd-line-strong: #D6CFBE;
  --rd-sage-900:#1E2F1E; --rd-sage-700:#3A5A3A; --rd-sage-500:#6B8E4E;
  --rd-sage-400:#8AAB6A; --rd-sage-100:#E0EBD1; --rd-sage-50:#EEF4E2;
  --rd-amber-700:#8B5A1C; --rd-amber-500:#C98B3A;
  --rd-amber-100:#F5E3C4; --rd-amber-50:#FBF1DD;
  --rd-rose-700:#8A3A2E; --rd-rose-500:#C96855;
  --rd-rose-100:#F3D8CE; --rd-rose-50:#FAE9E0;
  --rd-blue-700:#2C5068; --rd-blue-500:#5A86A3;
  --rd-blue-100:#D4E1EB; --rd-blue-50:#E8EFF5;
  --rd-r-sm:8px; --rd-r-md:12px; --rd-r-lg:18px; --rd-r-xl:24px;
  --rd-sh-xs:0 1px 0 rgba(30,47,30,.03);
  --rd-sh-sm:0 1px 2px rgba(30,47,30,.04), 0 1px 0 rgba(30,47,30,.02);
  --rd-sh-md:0 4px 14px rgba(30,47,30,.05), 0 1px 2px rgba(30,47,30,.04);

  /* ── layout ── */
  font-family: var(--rd-font-sans);
  color: var(--rd-ink);
  background: var(--rd-canvas);
  /* Negate the .content 1.75rem padding so we control spacing ourselves */
  margin: -1.75rem;
  padding: 1.75rem 1.75rem 5rem;
  min-height: calc(100vh - 64px);
  -webkit-font-smoothing: antialiased;
  /* Prevent negative margin from creating horizontal scroll */
  overflow-x: hidden;
}

/* ── loading ── */
.rd-state-load {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 300px; gap: 1rem;
  color: var(--rd-ink-muted); font-size: 14px;
}
.rd-spinner {
  width: 36px; height: 36px;
  border: 3px solid var(--rd-sage-100);
  border-top-color: var(--rd-sage-500);
  border-radius: 50%;
  animation: rdSpin .75s linear infinite;
}
@keyframes rdSpin { to { transform: rotate(360deg); } }

/* ── breadcrumb ── */
.rd-breadcrumb {
  display: flex; align-items: center; gap: .5rem;
  font-size: 13.5px; color: var(--rd-ink-muted);
  margin-bottom: 1.25rem;
}
.rd-bc-link {
  display: inline-flex; align-items: center; gap: .3rem;
  padding: 4px 8px; margin: -4px -8px;
  border-radius: 6px; cursor: pointer;
  color: var(--rd-ink-muted); font: inherit;
  transition: background .12s;
}
.rd-bc-link svg { width: 14px; height: 14px; }
.rd-bc-link:hover { background: var(--rd-paper-soft); color: var(--rd-ink); }
.rd-bc-sep  { color: var(--rd-ink-subtle); }
.rd-bc-curr { color: var(--rd-ink); font-weight: 500; }

/* ── alert bar ── */
.rd-alert-bar {
  display: flex; align-items: flex-start; gap: 1rem; flex-wrap: wrap;
  padding: .75rem 1rem .75rem 1.25rem;
  margin-bottom: 1.25rem;
  background: linear-gradient(90deg, var(--rd-rose-50), var(--rd-amber-50));
  border: 1px solid var(--rd-rose-100);
  border-left: 4px solid var(--rd-rose-500);
  border-radius: var(--rd-r-md);
}
.rd-alert-icon {
  flex: 0 0 32px; width: 32px; height: 32px;
  border-radius: 8px; background: var(--rd-rose-100);
  color: var(--rd-rose-700); display: grid; place-items: center;
  margin-top: 2px;
}
.rd-alert-icon svg { width: 17px; height: 17px; }
.rd-alert-body { flex: 1; min-width: 0; }
.rd-alert-title {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .1em; color: var(--rd-rose-700); margin-bottom: 3px;
}
.rd-alert-text { font-size: 13.5px; color: var(--rd-ink-strong); line-height: 1.55; }
.rd-alert-more {
  flex: 0 0 auto; font-size: 12.5px; color: var(--rd-rose-700); font-weight: 500;
  padding: .3rem .65rem; border-radius: 6px; cursor: pointer; white-space: nowrap;
  align-self: flex-start; margin-top: 2px;
}
.rd-alert-more:hover { background: rgba(138,58,46,.08); }
.rd-alert-expanded {
  width: 100%; padding: .75rem 0 0;
  font-size: 13px; line-height: 1.6; color: var(--rd-ink);
  border-top: 1px solid var(--rd-rose-100); margin-top: .5rem;
}
.rd-alert-expanded div { margin-bottom: .25rem; }
.rd-alert-expanded strong { color: var(--rd-rose-700); }

/* ── hero ── */
.rd-hero {
  border-radius: var(--rd-r-xl);
  overflow: hidden;
  margin-bottom: 1.5rem;
  border: 1px solid var(--rd-line);
  background: var(--rd-paper);
  box-shadow: var(--rd-sh-sm);
}
.rd-hero-banner {
  height: 160px;
  background:
    radial-gradient(ellipse at 15% 40%, rgba(138,171,106,.6), transparent 55%),
    radial-gradient(ellipse at 85% 55%, rgba(201,139,58,.4), transparent 55%),
    radial-gradient(ellipse at 50% 0%,  rgba(224,235,209,.9), transparent 70%),
    var(--rd-sage-100);
  position: relative;
}
.rd-hero-banner::after {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle at 30% 70%, rgba(255,255,255,.18) 0, transparent 40%),
    repeating-linear-gradient(135deg, transparent 0 36px, rgba(255,255,255,.04) 36px 37px);
  pointer-events: none;
}

/* hero body: 3-col grid, avatar overlaps banner */
.rd-hero-body {
  padding: 0 2rem 1.5rem;
  display: grid;
  grid-template-columns: 140px 1fr auto;
  gap: 1.5rem;
  align-items: end;
  margin-top: -56px; /* avatar overlap */
  position: relative;
}
.rd-hero-avatar {
  width: 140px; height: 140px; border-radius: 50%;
  background: linear-gradient(135deg, var(--rd-amber-100), var(--rd-rose-100));
  color: var(--rd-amber-700);
  display: grid; place-items: center;
  font-family: var(--rd-font-serif);
  font-weight: 500; font-size: 54px; letter-spacing: -.04em;
  border: 6px solid var(--rd-paper);
  box-shadow: var(--rd-sh-md);
  flex: 0 0 140px;
  /* keeps the avatar from being squashed by grid */
  min-width: 140px;
}
.rd-hero-identity { padding-bottom: .25rem; min-width: 0; }
.rd-id-row {
  display: flex; flex-wrap: wrap; align-items: center;
  gap: .45rem; margin-bottom: .45rem;
}
.rd-id-chip {
  font-size: 11px; color: var(--rd-ink-muted);
  background: var(--rd-paper-soft); padding: 2px 8px;
  border-radius: 4px; letter-spacing: .04em; font-weight: 500;
}
.rd-status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--rd-sage-500);
  box-shadow: 0 0 0 3px var(--rd-sage-100);
}
.rd-status-label { font-size: 12.5px; color: var(--rd-sage-700); font-weight: 500; }
.rd-stage-chip {
  font-size: 11.5px; color: var(--rd-ink-muted);
  background: var(--rd-paper-soft); padding: 2px 9px;
  border-radius: 999px; font-weight: 500;
}
.rd-hero-name {
  font-family: var(--rd-font-serif);
  font-size: clamp(28px, 3.5vw, 44px);
  line-height: 1.05; font-weight: 500;
  letter-spacing: -.025em; color: var(--rd-ink-strong);
  margin-bottom: .5rem; word-break: break-word;
}
.rd-hero-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .4rem; }
.rd-tag {
  font-size: 12.5px; padding: 3px 10px; border-radius: 999px;
  font-weight: 500; letter-spacing: -.005em;
}
.rd-tag-sage    { background: var(--rd-sage-50);   color: var(--rd-sage-700); }
.rd-tag-amber   { background: var(--rd-amber-50);  color: var(--rd-amber-700); }
.rd-tag-blue    { background: var(--rd-blue-50);   color: var(--rd-blue-700); }
.rd-tag-rose    { background: var(--rd-rose-50);   color: var(--rd-rose-700); }
.rd-tag-neutral { background: var(--rd-paper-soft); color: var(--rd-ink-muted); }

.rd-hero-actions {
  display: flex; flex-direction: column; gap: .4rem;
  align-items: flex-end; padding-bottom: .25rem;
}
@media (min-width: 900px) {
  .rd-hero-actions { flex-direction: row; align-items: center; }
}

/* ── buttons ── */
.rd-btn {
  display: inline-flex; align-items: center; gap: .45rem;
  padding: .5rem .9rem; border-radius: 10px;
  font-size: 13.5px; font-weight: 500;
  transition: all .15s ease; border: 1px solid transparent;
  white-space: nowrap; cursor: pointer;
  font-family: var(--rd-font-sans);
}
.rd-btn svg { width: 14px; height: 14px; flex: 0 0 14px; }
.rd-btn-sm  { font-size: 12.5px; padding: .4rem .75rem; }
.rd-btn-primary   { background: var(--rd-sage-900); color: #F4F8EC; border-color: var(--rd-sage-900); }
.rd-btn-primary:hover { background: var(--rd-sage-700); border-color: var(--rd-sage-700); }
.rd-btn-secondary { background: var(--rd-paper); color: var(--rd-ink); border-color: var(--rd-line-strong); }
.rd-btn-secondary:hover { background: var(--rd-paper-soft); border-color: var(--rd-ink-muted); }
.rd-btn-ghost { color: var(--rd-ink-muted); }
.rd-btn-ghost:hover { background: var(--rd-paper-soft); color: var(--rd-ink); }
.rd-btn-icon { width: 36px; height: 36px; padding: 0; justify-content: center; }

/* ── stage track ── */
.rd-stage-track { padding: .25rem 2rem 1.5rem; }
.rd-stage-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: .1em;
  color: var(--rd-ink-muted); font-weight: 600; margin-bottom: .6rem;
}
.rd-stage-steps {
  display: grid; grid-template-columns: repeat(6, 1fr);
  gap: 2px; background: var(--rd-line-soft); border-radius: 8px; padding: 2px;
}
.rd-stage-step {
  padding: .55rem .5rem;
  background: var(--rd-paper); font-size: 11.5px;
  color: var(--rd-ink-muted); text-align: center; border-radius: 6px; line-height: 1.3;
}
.rd-stage-step.done    { background: var(--rd-sage-50);  color: var(--rd-sage-700); font-weight: 500; }
.rd-stage-step.current { background: var(--rd-sage-900); color: #F4F8EC; font-weight: 500; }
.rd-step-num  { font-size: 10px; opacity: .6; display: block; letter-spacing: .05em; }
.rd-step-name { font-size: 11.5px; }

/* ── attendance widget ── */
.rd-att-card { padding: 0 2rem 1.25rem; }
.rd-att-inner {
  background: var(--rd-paper-soft); border-radius: var(--rd-r-md);
  border: 1px solid var(--rd-line-soft); padding: .85rem 1rem;
  display: flex; flex-wrap: wrap; gap: .75rem; align-items: center;
}
.rd-att-icon {
  flex: 0 0 36px; width: 36px; height: 36px; border-radius: 9px;
  background: var(--rd-sage-100); color: var(--rd-sage-700);
  display: grid; place-items: center;
}
.rd-att-icon svg { width: 18px; height: 18px; }
.rd-att-info { flex: 1; min-width: 180px; }
.rd-att-t { font-size: 13.5px; font-weight: 500; color: var(--rd-ink-strong); }
.rd-att-s { font-size: 12.5px; color: var(--rd-ink-muted); margin-top: 1px; }
.rd-att-toggle {
  display: flex; gap: 2px;
  background: var(--rd-paper); border-radius: 8px;
  padding: 2px; border: 1px solid var(--rd-line);
  flex-shrink: 0;
}
.rd-att-btn {
  padding: .45rem .8rem; border-radius: 6px;
  font-size: 13px; font-weight: 500; color: var(--rd-ink-muted);
  display: inline-flex; align-items: center; gap: 5px;
  cursor: pointer; font-family: var(--rd-font-sans); transition: background .12s;
}
.rd-att-btn svg { width: 13px; height: 13px; }
.rd-att-btn:hover:not(.rd-att-yes):not(.rd-att-no):not(.rd-att-partial) {
  background: var(--rd-paper-soft); color: var(--rd-ink-strong);
}
.rd-att-yes     { background: var(--rd-sage-500);  color: #fff !important; }
.rd-att-no      { background: var(--rd-rose-500);  color: #fff !important; }
.rd-att-partial { background: var(--rd-amber-500); color: #fff !important; }
.rd-att-detail {
  font-size: 12.5px; color: var(--rd-ink-muted); padding: .4rem .6rem;
  border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;
  cursor: pointer; font-family: var(--rd-font-sans); transition: background .12s;
  flex-shrink: 0;
}
.rd-att-detail:hover { background: var(--rd-paper); color: var(--rd-ink); }
.rd-att-detail svg { width: 13px; height: 13px; }

/* ── mini stats ── */
.rd-mini-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: .75rem; padding: 0 2rem 1.5rem;
}
.rd-mini-stat { background: var(--rd-paper-soft); border-radius: var(--rd-r-md); padding: .85rem 1rem; }
.rd-ms-active  { background: var(--rd-sage-50); border: 1px solid var(--rd-sage-100); }
.rd-ms-lbl {
  font-size: 11px; text-transform: uppercase; letter-spacing: .08em;
  color: var(--rd-ink-muted); font-weight: 600;
}
.rd-ms-val {
  font-family: var(--rd-font-serif); font-size: 24px; font-weight: 500;
  color: var(--rd-ink-strong); margin-top: 4px; letter-spacing: -.025em; line-height: 1;
}
.rd-ms-trend {
  font-size: 11.5px; color: var(--rd-sage-700); margin-top: 6px;
  display: inline-flex; align-items: center; gap: 3px; font-weight: 500;
}
.rd-ms-trend svg { width: 11px; height: 11px; }
.rd-trend-neutral { color: var(--rd-ink-subtle); }

/* ── tabs ── */
.rd-tabs {
  position: sticky; top: 64px; z-index: 30; /* topbar height = 64px */
  background: rgba(247,244,237,.92);
  backdrop-filter: saturate(1.5) blur(10px);
  -webkit-backdrop-filter: saturate(1.5) blur(10px);
  border-bottom: 1px solid var(--rd-line);
  /* break out of .rd-teacher 1.75rem horizontal padding */
  margin: 0 -1.75rem 1.5rem;
  padding: 0 1.75rem;
  display: flex; align-items: center; gap: 0;
  overflow-x: auto; scrollbar-width: none;
}
.rd-tabs::-webkit-scrollbar { display: none; }
.rd-tab {
  padding: .9rem .25rem; font-size: 13.5px;
  color: var(--rd-ink-muted); font-weight: 500;
  border-bottom: 2px solid transparent; margin-bottom: -1px;
  transition: color .15s; white-space: nowrap;
  display: flex; align-items: center; gap: .4rem;
  cursor: pointer; font-family: var(--rd-font-sans);
  margin-right: 1.5rem;
}
.rd-tab:last-child { margin-right: 0; }
.rd-tab:hover  { color: var(--rd-ink); }
.rd-tab.active { color: var(--rd-ink-strong); border-bottom-color: var(--rd-sage-500); }
.rd-tab-count {
  font-size: 11px; background: var(--rd-paper-soft);
  color: var(--rd-ink-muted); padding: 1px 7px;
  border-radius: 999px; font-weight: 500;
}
.rd-tab.active .rd-tab-count { background: var(--rd-sage-100); color: var(--rd-sage-700); }

/* ── main grid ── */
.rd-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.5rem;
  align-items: start;
}

/* ── card ── */
.rd-card {
  background: var(--rd-paper); border: 1px solid var(--rd-line);
  border-radius: var(--rd-r-lg); overflow: hidden; box-shadow: var(--rd-sh-xs);
}
.rd-card + .rd-card { margin-top: 1.5rem; }
.rd-card-head {
  padding: 1.15rem 1.4rem .5rem;
  display: flex; align-items: flex-start; gap: .5rem;
}
.rd-card-title {
  font-family: var(--rd-font-serif); font-size: 21px; font-weight: 500;
  letter-spacing: -.02em; color: var(--rd-ink-strong); line-height: 1.2;
}
.rd-card-title-sans {
  font-family: var(--rd-font-sans); font-size: 15px; font-weight: 600;
  color: var(--rd-ink-strong); letter-spacing: -.01em;
}
.rd-card-sub   { font-size: 13px; color: var(--rd-ink-muted); margin-top: 2px; }
.rd-card-head-actions { margin-left: auto; display: flex; gap: .25rem; flex-shrink: 0; }
.rd-card-body  { padding: .75rem 1.4rem 1.4rem; }
.rd-card-body-tight { padding-top: .25rem; }

/* ── lesson journal ── */
.rd-lesson-list { display: grid; gap: .75rem; }
.rd-lesson-card {
  border: 1px solid var(--rd-line-soft); border-radius: var(--rd-r-md); overflow: hidden;
  transition: border-color .15s;
}
.rd-lesson-card:hover { border-color: var(--rd-line-strong); }
.rd-lesson-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: .7rem .95rem .45rem; gap: .5rem; flex-wrap: wrap;
}
.rd-lesson-meta {
  display: flex; align-items: center; flex-wrap: wrap; gap: .55rem;
  font-size: 12.5px; color: var(--rd-ink-muted);
}
.rd-lm-date    { font-weight: 500; color: var(--rd-ink); }
.rd-sep-dot    { width: 3px; height: 3px; background: var(--rd-ink-subtle); border-radius: 50%; flex: 0 0 3px; }
.rd-lesson-type {
  font-size: 11.5px; padding: 2px 9px; border-radius: 999px;
  font-weight: 500; flex-shrink: 0;
}
/* lesson type colors */
.rd-lt-sage    { background: var(--rd-sage-50);    color: var(--rd-sage-700); }
.rd-lt-rose    { background: var(--rd-rose-50);    color: var(--rd-rose-700); }
.rd-lt-neutral { background: var(--rd-paper-soft); color: var(--rd-ink-muted); }
.rd-lesson-body { padding: 0 .95rem .85rem; }
.rd-lesson-title {
  font-size: 14.5px; font-weight: 500; color: var(--rd-ink-strong);
  letter-spacing: -.005em; margin-bottom: 4px;
}
.rd-lesson-note { font-size: 13.5px; color: var(--rd-ink-muted); line-height: 1.55; }
.rd-lesson-markers { display: flex; gap: .35rem; margin-top: .6rem; flex-wrap: wrap; }
.rd-marker {
  font-size: 11.5px; padding: 2px 8px; border-radius: 6px;
  font-weight: 500; display: inline-flex; align-items: center; gap: 3px;
}
.rd-marker.positive { background: var(--rd-sage-50);    color: var(--rd-sage-700); }
.rd-marker.warning  { background: var(--rd-amber-50);   color: var(--rd-amber-700); }
.rd-marker.neutral  { background: var(--rd-paper-soft); color: var(--rd-ink-muted); }

/* ── group history ── */
.rd-group-history { display: grid; gap: .5rem; }
.rd-group-row {
  display: grid; grid-template-columns: 80px 1fr auto;
  gap: .75rem; align-items: center;
  padding: .75rem .9rem; border-radius: var(--rd-r-md);
  background: var(--rd-paper-soft); border: 1px solid transparent;
}
.rd-gr-current { background: var(--rd-sage-50); border-color: var(--rd-sage-100); }
.rd-gr-period  { font-size: 12px; color: var(--rd-ink-muted); }
.rd-gr-name    { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); }
.rd-gr-sub     { font-size: 12px; color: var(--rd-ink-muted); margin-top: 2px; }
.rd-gr-status  {
  font-size: 11.5px; padding: 2px 9px; border-radius: 999px;
  font-weight: 500; white-space: nowrap;
}
.rd-gr-status-curr { background: var(--rd-sage-500); color: #fff; }

/* ── documents ── */
.rd-docs-list { display: grid; gap: .5rem; }
.rd-doc-row {
  display: grid; grid-template-columns: 38px 1fr auto;
  align-items: center; gap: .85rem; padding: .65rem .75rem;
  border-radius: var(--rd-r-md); transition: background .15s;
  cursor: pointer; border: 1px solid transparent;
}
.rd-doc-row:hover { background: var(--rd-paper-soft); border-color: var(--rd-line-soft); }
.rd-doc-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: grid; place-items: center;
  background: var(--rd-blue-50); color: var(--rd-blue-700);
}
.rd-doc-icon.sage  { background: var(--rd-sage-50);  color: var(--rd-sage-700); }
.rd-doc-icon.amber { background: var(--rd-amber-50); color: var(--rd-amber-700); }
.rd-doc-icon svg   { width: 17px; height: 17px; }
.rd-doc-info    { min-width: 0; }
.rd-doc-title   { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rd-doc-meta    { font-size: 12px; color: var(--rd-ink-muted); margin-top: 1px; }
.rd-doc-status  { font-size: 11.5px; padding: 2px 9px; border-radius: 999px; font-weight: 500; white-space: nowrap; }
.rd-doc-status.sage  { background: var(--rd-sage-50);  color: var(--rd-sage-700); }
.rd-doc-status.amber { background: var(--rd-amber-50); color: var(--rd-amber-700); }

/* ── content footer ── */
.rd-content-footer {
  margin-top: 2rem; padding-top: 1rem;
  border-top: 1px solid var(--rd-line);
  display: flex; align-items: center; justify-content: space-between;
  font-size: 12px; color: var(--rd-ink-subtle); flex-wrap: wrap; gap: .5rem;
}

/* ── attendance calendar ── */
.rd-att-cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
.rd-att-day { aspect-ratio: 1; border-radius: 4px; background: var(--rd-paper-soft); }
.rd-att-day.yes     { background: var(--rd-sage-500); }
.rd-att-day.no      { background: var(--rd-rose-100); }
.rd-att-day.partial { background: var(--rd-amber-500); opacity: .7; }
.rd-att-day.none    { background: var(--rd-paper-sunken); opacity: .45; }
.rd-att-legend { display: flex; gap: .75rem; font-size: 11.5px; color: var(--rd-ink-muted); margin-top: .75rem; }
.rd-att-leg-item { display: inline-flex; align-items: center; gap: 4px; }
.rd-att-leg-dot  { width: 10px; height: 10px; border-radius: 3px; }

/* ── quick actions ── */
.rd-quick-actions { display: grid; gap: 2px; padding: .25rem .5rem .5rem; }
.rd-qa {
  display: flex; align-items: center; gap: .7rem;
  padding: .65rem .85rem; border-radius: 10px;
  font-size: 13.5px; color: var(--rd-ink); transition: background .15s;
  font-weight: 500; text-align: left; cursor: pointer;
  font-family: var(--rd-font-sans); width: 100%;
}
.rd-qa:hover  { background: var(--rd-paper-soft); }
.rd-qa svg    { width: 16px; height: 16px; color: var(--rd-sage-700); flex: 0 0 16px; }
.rd-qa-k {
  margin-left: auto; font-size: 11px; color: var(--rd-ink-subtle);
  background: var(--rd-paper-soft); border: 1px solid var(--rd-line);
  border-radius: 4px; padding: 1px 5px;
}
.rd-qa:hover .rd-qa-k { background: var(--rd-paper); }

/* ── key metrics ── */
.rd-progress-list { display: grid; gap: 1rem; }
.rd-pr-row { display: grid; grid-template-columns: 1fr auto; gap: .4rem; align-items: baseline; }
.rd-pr-label { font-size: 13px; color: var(--rd-ink-strong); font-weight: 500; }
.rd-pr-value { font-family: var(--rd-font-serif); font-size: 13px; color: var(--rd-ink-muted); }
.rd-pr-now   { color: var(--rd-ink-strong); font-weight: 500; font-size: 15px; }
.rd-pr-bar {
  grid-column: 1 / -1; height: 6px;
  background: var(--rd-paper-sunken); border-radius: 999px; overflow: hidden;
}
.rd-pr-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--rd-sage-500), var(--rd-sage-400));
  border-radius: 999px; transition: width .6s cubic-bezier(.2,.7,.2,1);
}

/* ── people cards ── */
.rd-person { display: grid; grid-template-columns: 38px 1fr auto; align-items: center; gap: .75rem; padding: .65rem 0; }
.rd-person + .rd-person { border-top: 1px solid var(--rd-line-soft); }
.rd-person-av {
  width: 38px; height: 38px; border-radius: 50%;
  display: grid; place-items: center; font-size: 13px; font-weight: 600;
}
.rd-person-av.sage  { background: var(--rd-sage-100);  color: var(--rd-sage-700); }
.rd-person-av.amber { background: var(--rd-amber-100); color: var(--rd-amber-700); }
.rd-person-av.blue  { background: var(--rd-blue-100);  color: var(--rd-blue-700); }
.rd-person-av.rose  { background: var(--rd-rose-100);  color: var(--rd-rose-700); }
.rd-person-info { min-width: 0; }
.rd-person-name { font-size: 13.5px; font-weight: 500; color: var(--rd-ink-strong); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rd-person-role { font-size: 12px; color: var(--rd-ink-muted); }
.rd-person-acts { display: flex; gap: .2rem; }
.rd-person-act {
  width: 30px; height: 30px; display: grid; place-items: center;
  border-radius: 8px; color: var(--rd-ink-muted); cursor: pointer;
  transition: background .15s, color .15s;
}
.rd-person-act:hover { background: var(--rd-paper-soft); color: var(--rd-sage-700); }
.rd-person-act svg { width: 14px; height: 14px; }

/* ── tab content shared ── */
.rd-tab-content { }
.rd-tc-header { margin-bottom: 1.25rem; }
.rd-tc-title {
  font-family: var(--rd-font-serif); font-size: 22px; font-weight: 500;
  letter-spacing: -.02em; color: var(--rd-ink-strong); margin-bottom: .25rem;
}
.rd-tc-sub { font-size: 13.5px; color: var(--rd-ink-muted); }

.rd-empty-block {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  min-height: 220px; gap: .75rem;
  color: var(--rd-ink-muted); background: var(--rd-paper);
  border: 1px solid var(--rd-line); border-radius: var(--rd-r-lg);
}
.rd-empty-block svg { width: 32px; height: 32px; opacity: .35; }
.rd-empty-block p   { font-size: 14px; }

/* ── lessons tab: attendance summary ── */
.rd-att-summary {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.25rem;
}
.rd-att-summary-item {
  background: var(--rd-paper); border: 1px solid var(--rd-line); border-radius: var(--rd-r-md);
  padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: .25rem;
}
.rd-att-summary-val { font-family: var(--rd-font-serif); font-size: 28px; font-weight: 500; letter-spacing: -.03em; color: var(--rd-ink-strong); }
.rd-att-summary-lbl { font-size: 12.5px; color: var(--rd-ink-muted); }
.rd-color-sage { color: var(--rd-sage-500); }
.rd-color-rose { color: var(--rd-rose-500); }
.rd-color-amber { color: var(--rd-amber-500); }
.rd-att-cal-wide {
  background: var(--rd-paper); border: 1px solid var(--rd-line); border-radius: var(--rd-r-lg);
  padding: 1.25rem; margin-bottom: 1.25rem;
}
.rd-lesson-list-full .rd-lesson-card { border-left: 3px solid var(--rd-sage-100); }

/* ── group tab ── */
.rd-group-members { display: flex; flex-direction: column; }
.rd-gm-row {
  display: flex; align-items: center; gap: .75rem;
  padding: .75rem 1rem; border-bottom: 1px solid var(--rd-line-soft);
  transition: background .12s;
}
.rd-gm-row:last-child { border-bottom: none; }
.rd-gm-row:hover { background: var(--rd-paper-soft); }
.rd-gm-self { background: var(--rd-sage-50); }
.rd-gm-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--rd-sage-100), var(--rd-blue-100));
  color: var(--rd-sage-700); font-size: 13px; font-weight: 600;
  display: grid; place-items: center; flex-shrink: 0;
}
.rd-gm-info { flex: 1; min-width: 0; }
.rd-gm-name { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); display: flex; align-items: center; gap: .5rem; }
.rd-gm-meta { font-size: 12.5px; color: var(--rd-ink-muted); margin-top: 1px; }
.rd-gm-badge {
  font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em;
  background: var(--rd-sage-100); color: var(--rd-sage-700);
  padding: 2px 7px; border-radius: 4px;
}

/* ── development tab ── */
.rd-dev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.rd-dev-card {
  background: var(--rd-paper); border: 1px solid var(--rd-line); border-radius: var(--rd-r-md);
  padding: 1.25rem;
}
.rd-dev-card-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: .75rem; }
.rd-dev-label { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); }
.rd-dev-score { font-family: var(--rd-font-serif); font-size: 20px; font-weight: 500; color: var(--rd-ink-strong); }
.rd-dev-max { font-size: 14px; color: var(--rd-ink-muted); font-family: var(--rd-font-sans); }
.rd-dev-bar { height: 8px; margin-bottom: .75rem; }
.rd-dev-desc { font-size: 12.5px; color: var(--rd-ink-muted); line-height: 1.5; }
.rd-dev-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.rd-dev-stat-item { text-align: center; padding: .5rem; }
.rd-dev-stat-val { display: block; font-family: var(--rd-font-serif); font-size: 22px; font-weight: 500; color: var(--rd-ink-strong); margin-bottom: .15rem; }
.rd-dev-stat-lbl { font-size: 12px; color: var(--rd-ink-muted); }

/* ── diagnostics tab ── */
.rd-diag-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
.rd-diag-list { display: flex; flex-direction: column; gap: .75rem; }
.rd-diag-card {
  display: flex; background: var(--rd-paper); border: 1px solid var(--rd-line);
  border-radius: var(--rd-r-md); overflow: hidden;
}
.rd-diag-status-bar { width: 4px; flex-shrink: 0; }
.rd-diag-done { background: var(--rd-sage-500); }
.rd-diag-planned { background: var(--rd-amber-500); }
.rd-diag-body { flex: 1; padding: 1rem 1.25rem; }
.rd-diag-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .35rem; }
.rd-diag-name { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); }
.rd-diag-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px;
}
.rd-badge-sage { background: var(--rd-sage-100); color: var(--rd-sage-700); }
.rd-badge-amber { background: var(--rd-amber-100); color: var(--rd-amber-700); }
.rd-diag-meta { font-size: 12.5px; color: var(--rd-ink-muted); display: flex; align-items: center; gap: .35rem; flex-wrap: wrap; }

/* ── documents tab ── */
.rd-docs-grid { display: flex; flex-direction: column; gap: .75rem; }
.rd-doc-card {
  display: flex; align-items: center; gap: 1rem;
  background: var(--rd-paper); border: 1px solid var(--rd-line); border-radius: var(--rd-r-md);
  padding: 1rem 1.25rem; transition: box-shadow .12s;
}
.rd-doc-card:hover { box-shadow: var(--rd-sh-md); }
.rd-doc-card-icon {
  width: 40px; height: 40px; border-radius: var(--rd-r-sm);
  background: var(--rd-sage-50); color: var(--rd-sage-700);
  display: grid; place-items: center; flex-shrink: 0;
}
.rd-doc-card-icon.amber { background: var(--rd-amber-50); color: var(--rd-amber-700); }
.rd-doc-card-icon.sage  { background: var(--rd-sage-50);  color: var(--rd-sage-700); }
.rd-doc-card-icon svg { width: 20px; height: 20px; }
.rd-doc-card-info { flex: 1; min-width: 0; }
.rd-doc-card-name { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rd-doc-card-meta { font-size: 12.5px; color: var(--rd-ink-muted); margin-top: 2px; }

/* ── family tab ── */
.rd-contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.rd-contact-item { display: flex; flex-direction: column; gap: .25rem; }
.rd-contact-label { font-size: 12px; color: var(--rd-ink-muted); font-weight: 500; text-transform: uppercase; letter-spacing: .06em; }
.rd-contact-value { font-size: 14px; color: var(--rd-ink-strong); }

/* ── modals ── */
.rd-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(15,20,15,.45); backdrop-filter: blur(4px);
  display: grid; place-items: center; padding: 1.5rem;
}
.rd-modal {
  background: var(--rd-paper); border-radius: var(--rd-r-xl);
  box-shadow: 0 24px 80px rgba(0,0,0,.18);
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
}
.rd-modal-sm { max-width: 380px; }
.rd-modal-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--rd-line-soft);
}
.rd-modal-head h3 {
  font-family: var(--rd-font-serif); font-size: 18px; font-weight: 500;
  letter-spacing: -.02em; color: var(--rd-ink-strong); margin: 0;
}
.rd-modal-close {
  width: 32px; height: 32px; border-radius: 8px;
  display: grid; place-items: center;
  font-size: 22px; color: var(--rd-ink-muted); cursor: pointer;
}
.rd-modal-close:hover { background: var(--rd-paper-soft); }
.rd-modal-body { padding: 1.25rem 1.5rem; }
.rd-modal-actions {
  display: flex; justify-content: flex-end; gap: .75rem;
  padding-top: 1rem; margin-top: .5rem;
  border-top: 1px solid var(--rd-line-soft);
}
.rd-field { display: flex; flex-direction: column; gap: .35rem; margin-bottom: 1rem; }
.rd-field span {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .06em; color: var(--rd-ink-muted);
}
.rd-field input, .rd-field select {
  padding: .55rem .75rem; border: 1px solid var(--rd-line);
  border-radius: var(--rd-r-sm); font-size: 14px;
  font-family: var(--rd-font-sans); color: var(--rd-ink);
  background: var(--rd-paper); transition: border-color .15s;
}
.rd-field input:focus, .rd-field select:focus {
  outline: none; border-color: var(--rd-sage-500);
  box-shadow: 0 0 0 3px var(--rd-sage-100);
}
.rd-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.rd-group-pick-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: .5rem; }
.rd-group-pick {
  display: block; text-align: left; width: 100%;
  padding: .75rem 1rem; border: 1px solid var(--rd-line);
  border-radius: var(--rd-r-sm); cursor: pointer; transition: all .12s;
}
.rd-group-pick:hover { border-color: var(--rd-sage-400); background: var(--rd-sage-50); }
.rd-group-pick-active {
  border-color: var(--rd-sage-500); background: var(--rd-sage-50);
  box-shadow: 0 0 0 2px var(--rd-sage-100);
}
.rd-gp-name { font-size: 14px; font-weight: 500; color: var(--rd-ink-strong); }
.rd-gp-meta { font-size: 12.5px; color: var(--rd-ink-muted); margin-top: 2px; }

.rd-contact-block { margin-bottom: 1rem; }
.rd-contact-phone { font-size: 18px; font-weight: 500; letter-spacing: .02em; }

/* ── responsive for new tabs ── */
@media (max-width: 900px) {
  .rd-att-summary { grid-template-columns: 1fr 1fr; }
  .rd-dev-grid { grid-template-columns: 1fr; }
  .rd-dev-stats { grid-template-columns: 1fr 1fr; }
  .rd-diag-summary { grid-template-columns: 1fr 1fr 1fr; }
  .rd-contact-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .rd-att-summary { grid-template-columns: 1fr; }
  .rd-diag-summary { grid-template-columns: 1fr; }
  .rd-dev-stats { grid-template-columns: 1fr 1fr; }
}

/* ── empty state ── */
.rd-empty-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 2rem 1rem; gap: .5rem; color: var(--rd-ink-muted);
}
.rd-empty-state svg { width: 28px; height: 28px; opacity: .35; }
.rd-empty-state p   { font-size: 13.5px; }

/* ── responsive ── */
@media (max-width: 1200px) {
  .rd-grid { grid-template-columns: 1fr 300px; }
}
@media (max-width: 1024px) {
  .rd-grid { grid-template-columns: 1fr; }
  .rd-col-right { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .rd-col-right .rd-card + .rd-card { margin-top: 0; }
}
@media (max-width: 900px) {
  .rd-teacher { margin: -1rem; padding: 1rem 1rem 4rem; }
  .rd-tabs    { margin: 0 -1rem 1.5rem; padding: 0 1rem; }
  .rd-hero-body { grid-template-columns: 1fr; padding: 0 1rem 1.25rem; margin-top: -50px; }
  .rd-hero-avatar { width: 110px; height: 110px; font-size: 42px; min-width: 110px; margin: 0 auto; }
  .rd-hero-actions { flex-direction: row; flex-wrap: wrap; align-items: center; }
  .rd-hero-name { font-size: 28px; }
  .rd-mini-stats { grid-template-columns: 1fr 1fr; padding: 0 1rem 1rem; }
  .rd-stage-steps { grid-template-columns: repeat(3, 1fr); }
  .rd-stage-track, .rd-att-card { padding-left: 1rem; padding-right: 1rem; }
  .rd-col-right { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .rd-mini-stats { grid-template-columns: 1fr 1fr; }
  .rd-stage-steps { grid-template-columns: 1fr 1fr; }
  .rd-att-inner { flex-direction: column; align-items: flex-start; }
  .rd-att-toggle { width: 100%; }
  .rd-att-btn { flex: 1; justify-content: center; }
}

/* ═══════════════════════════ ADMIN VIEW — legacy styles ═══════════════════════════ */
.recipient-details-page { max-width: 1000px; margin: 0 auto; padding: 1rem; }
.breadcrumb-container   { margin-bottom: 1rem; font-size: .9rem; color: var(--text-secondary); }
.breadcrumb-link        { cursor: pointer; color: var(--accent); }
.breadcrumb-current     { font-weight: 600; }
.profile-header {
  display: flex; gap: 1rem; align-items: center;
  border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1rem;
}
.profile-photo { width: 80px; height: 80px; }
.profile-initials {
  width: 100%; height: 100%; border-radius: 50%;
  background: var(--accent-soft); border: 3px solid var(--accent);
  display: grid; place-items: center; font-size: 1.8rem; font-weight: 700; color: var(--accent);
}
.profile-name { font-size: 1.4rem; font-weight: 700; margin: 0 0 .25rem; }
.profile-meta { color: var(--text-secondary); font-size: .85rem; }
.profile-tabs { display: flex; border-bottom: 1px solid var(--border); }
.profile-tabs button {
  padding: .6rem 1rem; font-size: .85rem; font-weight: 600;
  background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--text-tertiary); cursor: pointer;
}
.profile-tabs button.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab-content { padding: .5rem 0; }
.general-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .75rem; }
.info-card {
  background: var(--bg-surface-sunken); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); padding: .7rem .85rem;
}
.info-card.full-width { grid-column: span 2; }
.label { font-size: .72rem; font-weight: 600; color: var(--text-tertiary); margin-bottom: .15rem; display: block; }
.value { font-size: .875rem; font-weight: 500; color: var(--text-primary); word-break: break-word; }
.documents-list { display: flex; flex-direction: column; gap: .5rem; }
.empty-placeholder { text-align: center; padding: 1rem; color: var(--text-secondary); }
.document-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: .5rem; background: var(--bg-surface-sunken); border-radius: var(--radius-md);
}
.profile-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1rem; }
.loading-state { text-align: center; padding: 2rem; }
</style>
