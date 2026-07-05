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

      <!-- BREADCRUMB -->
      <nav class="breadcrumb" aria-label="Хлебные крошки">
        <a class="bc-link" @click="goBack">Реабилитанты</a>
        <span class="sep" aria-hidden="true">/</span>
        <span class="current">{{ fullName(recipient) }}</span>
      </nav>

      <!-- ALERT: особенности / сигналы поддержки -->
      <div v-if="doc && doc.specialNote" class="alert" role="note">
        <div class="alert-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="alert-body">
          <div class="alert-title">Особенности и сигналы поддержки</div>
          <div class="alert-text">{{ doc.specialNote }}</div>
        </div>
      </div>

      <!-- HERO -->
      <section class="hero" aria-label="Сводка по реабилитанту">
        <div class="hero-banner" aria-hidden="true"></div>
        <div class="hero-body">
          <img v-if="photoUrl" :src="photoUrl" class="hero-avatar-img" alt="" />
          <div v-else class="hero-avatar" aria-hidden="true">{{ initials(recipient) }}</div>

          <div class="hero-identity">
            <div class="hero-id-row">
              <span class="id-chip">R-{{ recipientCode }}</span>
              <span class="status-dot" :class="statusDotClass" aria-hidden="true"></span>
              <span class="status-label" :class="statusDotClass">{{ statusLabel(recipient.status) }}</span>
              <span v-if="groupName" class="stage-chip">{{ groupName }}</span>
            </div>
            <h1 class="hero-name">{{ fullName(recipient) }}</h1>
            <div class="hero-tags">
              <span v-if="age != null" class="tag tag-neutral">{{ age }} {{ yearsWord(age) }}<template v-if="recipient.birthDate"> · род. {{ formatDate(recipient.birthDate) }}</template></span>
              <span v-if="recipient.diagnosis" class="tag tag-blue">{{ recipient.diagnosis }}</span>
              <span v-if="crgShort" class="tag tag-sage">ЦРГ {{ crgShort }}</span>
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

        <!-- STAGE TRACK -->
        <div class="stage-track">
          <div class="stage-track-label">Маршрут реабилитанта</div>
          <ol class="stage-steps">
            <li v-for="(name, i) in stageSteps" :key="i"
                class="stage-step"
                :class="{ done: i < stageIndex, current: i === stageIndex }">
              <span class="step-num">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="step-name">{{ name }}</span>
            </li>
          </ol>
        </div>

        <!-- MINI STATS -->
        <div class="mini-stats">
          <div class="mini-stat">
            <div class="label">Возраст</div>
            <div class="value">{{ age != null ? age : '—' }}<span v-if="age != null" class="value-unit"> {{ yearsWord(age) }}</span></div>
            <div class="trend neutral">{{ recipient.birthDate ? 'род. ' + formatDate(recipient.birthDate) : 'дата рождения не указана' }}</div>
          </div>
          <div class="mini-stat">
            <div class="label">В программе</div>
            <div class="value">{{ programDays != null ? programDays : '—' }}<span v-if="programDays != null" class="value-unit"> дн.</span></div>
            <div class="trend neutral">{{ recipient.createdAt ? 'с ' + formatDate(recipient.createdAt) : '—' }}</div>
          </div>
          <div class="mini-stat" :class="{ active: !!groupName }">
            <div class="label">Группа</div>
            <div class="value value-text">{{ groupName || 'Без группы' }}</div>
            <div class="trend neutral">{{ curatorName ? 'куратор: ' + curatorName : 'куратор не назначен' }}</div>
          </div>
          <div class="mini-stat">
            <div class="label">Статус</div>
            <div class="value value-text">{{ statusLabel(recipient.status) }}</div>
            <div class="trend neutral">целевая группа {{ crgShort || '—' }}</div>
          </div>
        </div>
      </section>

      <!-- TABS -->
      <div class="tabs" role="tablist" aria-label="Разделы карточки">
        <button v-for="t in tabs" :key="t.id"
          class="tab" role="tab" type="button"
          :aria-selected="activeTab === t.id"
          @click="activeTab = t.id">
          {{ t.label }}
          <span v-if="t.id === 'diagnostics' && diagCount" class="tab-count">{{ diagCount }}</span>
        </button>
      </div>

      <!-- PANEL: ОБЗОР -->
      <div v-if="activeTab === 'overview'" class="tabpanel">
        <div class="grid">
          <!-- LEFT -->
          <div>
            <section class="card">
              <div class="card-head">
                <div>
                  <h2 class="card-title">Ключевые сведения</h2>
                  <div class="card-sub">Первичные данные карточки · подробности — во вкладках ниже</div>
                </div>
              </div>
              <div class="card-body">
                <dl class="kv-grid">
                  <div class="kv">
                    <dt class="kv-key">Дата рождения</dt>
                    <dd class="kv-val"><span class="kv-text">{{ formatDate(recipient.birthDate) }}<template v-if="age != null"> · {{ age }} {{ yearsWord(age) }}</template></span></dd>
                  </div>
                  <div class="kv">
                    <dt class="kv-key">Телефон</dt>
                    <dd class="kv-val"><span class="kv-text">{{ recipient.telephone || '—' }}</span></dd>
                  </div>
                  <div class="kv">
                    <dt class="kv-key">E-mail</dt>
                    <dd class="kv-val"><span class="kv-text">{{ recipient.email || recipient.user?.email || '—' }}</span></dd>
                  </div>
                  <div v-if="doc" class="kv">
                    <dt class="kv-key">СНИЛС</dt>
                    <dd class="kv-val"><span class="kv-text">{{ doc.snils || '—' }}</span></dd>
                  </div>
                  <div class="kv kv-full">
                    <dt class="kv-key">Целевая реабилитационная группа (ЦРГ)</dt>
                    <dd class="kv-val"><span class="kv-text"><span v-if="recipient.crgMain?.code" class="code">{{ recipient.crgMain.code }}</span>{{ recipient.crgMain?.name || crgText }}</span></dd>
                  </div>
                  <div class="kv kv-full">
                    <dt class="kv-key">Нозология (МКБ-10)</dt>
                    <dd class="kv-val"><span class="kv-text"><span v-if="recipient.nozologyRef?.class" class="code">{{ recipient.nozologyRef.class }}</span>{{ nozologyName }}</span></dd>
                  </div>
                  <div class="kv kv-full">
                    <dt class="kv-key">Диагноз</dt>
                    <dd class="kv-val"><span class="kv-text">{{ recipient.diagnosis || '—' }}</span></dd>
                  </div>
                  <div v-if="doc" class="kv kv-full">
                    <dt class="kv-key">Место обучения</dt>
                    <dd class="kv-val"><span class="kv-text">{{ doc.educationPlace || '—' }}</span></dd>
                  </div>
                </dl>
              </div>
              <button class="card-foot-link" type="button" @click="activeTab = 'documents'">
                Все документы и медкарта
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>
          </div>

          <!-- RIGHT -->
          <aside>
            <section class="card">
              <div class="card-head"><h2 class="card-title-sans">Куратор и группа</h2></div>
              <div class="card-body">
                <div v-if="!curatorName && !groupName" class="rd-inline-empty">Группа и куратор не назначены</div>
                <template v-else>
                  <div v-if="curatorName" class="person">
                    <div class="person-avatar sage" aria-hidden="true">{{ initialsFromName(curatorName) }}</div>
                    <div class="person-info">
                      <div class="person-name">{{ curatorName }}</div>
                      <div class="person-role">Куратор{{ groupName ? ' · ' + groupName : '' }}</div>
                    </div>
                  </div>
                  <div v-else class="person">
                    <div class="person-avatar amber" aria-hidden="true">Г</div>
                    <div class="person-info">
                      <div class="person-name">{{ groupName }}</div>
                      <div class="person-role">Куратор не назначен</div>
                    </div>
                  </div>
                </template>
              </div>
              <button class="card-foot-link" type="button" @click="activeTab = 'group'">
                Группа и участники
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>

            <section class="card">
              <div class="card-head"><h2 class="card-title-sans">Законный представитель</h2></div>
              <div class="card-body">
                <div v-if="!recipient.representative" class="rd-inline-empty">Представитель не указан</div>
                <div v-else class="person">
                  <div class="person-avatar rose" aria-hidden="true">{{ initials(recipient.representative) }}</div>
                  <div class="person-info">
                    <div class="person-name">{{ fullName(recipient.representative) }}</div>
                    <div class="person-role">{{ recipient.representative.telephone || 'Телефон не указан' }}</div>
                  </div>
                  <div class="person-actions">
                    <a v-if="repPhoneHref" class="person-action" :href="repPhoneHref" aria-label="Позвонить представителю"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.09 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>
                  </div>
                </div>
              </div>
              <button v-if="recipient.representative" class="card-foot-link" type="button" @click="activeTab = 'representative'">
                Данные представителя
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </section>
          </aside>
        </div>
      </div>

      <!-- PANEL: ДОКУМЕНТЫ -->
      <div v-else-if="activeTab === 'documents'" class="tabpanel">
        <section class="card">
          <div class="card-head"><h2 class="card-title">Документы и медкарта</h2></div>
          <div class="card-body">
            <div v-if="!doc" class="rd-inline-empty">Документ не заполнен</div>
            <dl v-else class="kv-grid">
              <div class="kv"><dt class="kv-key">Тип документа</dt><dd class="kv-val"><span class="kv-text">{{ doc.docType || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">Серия / номер</dt><dd class="kv-val"><span class="kv-text">{{ [doc.docSeries, doc.docNumber].filter(Boolean).join(' ') || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">Кем выдан</dt><dd class="kv-val"><span class="kv-text">{{ doc.docIssuer || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">Дата выдачи</dt><dd class="kv-val"><span class="kv-text">{{ formatDate(doc.docIssuerDate) }}</span></dd></div>
              <div class="kv"><dt class="kv-key">СНИЛС</dt><dd class="kv-val"><span class="kv-text">{{ doc.snils || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">МСЭ выдана</dt><dd class="kv-val"><span class="kv-text">{{ formatDate(doc.mseIssueDate) }}</span></dd></div>
              <div class="kv"><dt class="kv-key">МСЭ действительна до</dt><dd class="kv-val"><span class="kv-text">{{ formatDate(doc.mseValidDate) }}</span></dd></div>
              <div class="kv kv-full"><dt class="kv-key">Адрес регистрации</dt><dd class="kv-val"><span class="kv-text">{{ doc.regAddress || '—' }}</span></dd></div>
              <div class="kv kv-full"><dt class="kv-key">Адрес проживания</dt><dd class="kv-val"><span class="kv-text">{{ (doc.factSameReg ? doc.regAddress : doc.factAddress) || '—' }}</span></dd></div>
              <div class="kv kv-full"><dt class="kv-key">Место обучения</dt><dd class="kv-val"><span class="kv-text">{{ doc.educationPlace || '—' }}</span></dd></div>
              <div class="kv kv-full"><dt class="kv-key">Особые отметки</dt><dd class="kv-val"><span class="kv-text">{{ doc.specialNote || '—' }}</span></dd></div>
            </dl>
          </div>
        </section>
      </div>

      <!-- PANEL: ГРУППА -->
      <div v-else-if="activeTab === 'group'" class="tabpanel">
        <section class="card">
          <div class="card-head">
            <div>
              <h2 class="card-title">{{ groupName || 'Группа не назначена' }}</h2>
              <div v-if="curatorName" class="card-sub">Куратор: {{ curatorName }}</div>
            </div>
          </div>
          <div class="card-body">
            <div class="rd-group-select">
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

            <div v-if="!recipient.groupId" class="rd-inline-empty">Реабилитант не состоит в группе</div>
            <div v-else-if="groupMembersLoading" class="rd-loading" style="min-height:120px"><div class="spinner"></div></div>
            <div v-else-if="!groupMembers.length" class="rd-inline-empty">В группе пока нет участников</div>
            <div v-else class="rd-members">
              <div v-for="m in groupMembers" :key="m.id" class="person" :class="{ 'is-self': m.id == recipientId }">
                <img v-if="m.photo" :src="m.photo" class="person-avatar-img" alt="" />
                <div v-else class="person-avatar sage" aria-hidden="true">{{ initials(m) }}</div>
                <div class="person-info">
                  <div class="person-name">{{ fullName(m) }}<span v-if="m.id == recipientId" class="self-badge">текущий</span></div>
                  <div class="person-role">{{ memberMeta(m) }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- PANEL: ПРЕДСТАВИТЕЛЬ -->
      <div v-else-if="activeTab === 'representative'" class="tabpanel">
        <section class="card">
          <div class="card-head"><h2 class="card-title">Законный представитель</h2></div>
          <div class="card-body">
            <div v-if="!recipient.representative" class="rd-inline-empty">Представитель не указан</div>
            <dl v-else class="kv-grid">
              <div class="kv kv-full"><dt class="kv-key">ФИО</dt><dd class="kv-val"><span class="kv-text">{{ fullName(recipient.representative) || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">Телефон</dt><dd class="kv-val"><span class="kv-text">{{ recipient.representative.telephone || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">E-mail</dt><dd class="kv-val"><span class="kv-text">{{ recipient.representative.email || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">Паспорт серия / номер</dt><dd class="kv-val"><span class="kv-text">{{ [recipient.representative.passportSeries, recipient.representative.passportNumber].filter(Boolean).join(' ') || '—' }}</span></dd></div>
              <div class="kv"><dt class="kv-key">Код подразделения</dt><dd class="kv-val"><span class="kv-text">{{ recipient.representative.passportDeptCode || '—' }}</span></dd></div>
              <div class="kv kv-full"><dt class="kv-key">Кем выдан</dt><dd class="kv-val"><span class="kv-text">{{ recipient.representative.passportIssuer || '—' }}<template v-if="recipient.representative.passportIssuerDate"> · {{ formatDate(recipient.representative.passportIssuerDate) }}</template></span></dd></div>
              <div class="kv kv-full"><dt class="kv-key">Адрес регистрации</dt><dd class="kv-val"><span class="kv-text">{{ recipient.representative.passportReg || '—' }}</span></dd></div>
            </dl>
          </div>
        </section>
      </div>

      <!-- PANEL: ДИАГНОСТИКИ -->
      <div v-else-if="activeTab === 'diagnostics'" class="tabpanel">
        <section class="card">
          <div class="card-head"><h2 class="card-title">Назначение на диагностику</h2></div>
          <div class="card-body">
            <div class="rd-assign">
              <div class="rd-assign-grid">
                <label class="rd-assign-field">
                  <span class="kv-key">Направление</span>
                  <select v-model.number="assignForm.directionId" class="rd-input" :disabled="directionsLoading || assigning">
                    <option :value="null" disabled>{{ directionsLoading ? 'Загрузка…' : 'Выберите направление' }}</option>
                    <option v-for="d in directions" :key="d.id" :value="d.id">{{ d.name }}</option>
                  </select>
                </label>
                <label class="rd-assign-field">
                  <span class="kv-key">Психолог / специалист</span>
                  <select v-model.number="assignForm.specialistId" class="rd-input" :disabled="specialistsLoading || assigning">
                    <option :value="null" disabled>{{ specialistsLoading ? 'Загрузка…' : 'Выберите специалиста' }}</option>
                    <option v-for="s in specialists" :key="s.id" :value="s.id">{{ s.fullName }}{{ s.cabinet ? ' · каб. ' + s.cabinet : '' }}</option>
                  </select>
                </label>
                <label class="rd-assign-field">
                  <span class="kv-key">Дата</span>
                  <input type="date" v-model="assignForm.date" :min="todayStr" class="rd-input" :disabled="assigning" />
                </label>
                <div class="rd-assign-action">
                  <button class="btn btn-primary" :disabled="!canAssign || assigning" @click="createAssignment">
                    {{ assigning ? 'Назначение…' : 'Назначить' }}
                  </button>
                </div>
              </div>
              <p v-if="assignError" class="rd-assign-err">{{ assignError }}</p>
            </div>

            <h3 class="rd-subtitle">Назначенные диагностики</h3>
            <div v-if="assignmentsLoading" class="rd-loading" style="min-height:80px"><div class="spinner"></div></div>
            <div v-else-if="!assignments.length" class="rd-inline-empty">Пока нет назначений</div>
            <table v-else class="rd-table">
              <thead>
                <tr><th>Направление</th><th>Специалист</th><th>Дата</th><th>Статус</th><th></th></tr>
              </thead>
              <tbody>
                <tr v-for="a in assignments" :key="a.id">
                  <td>{{ a.direction?.name || '—' }}</td>
                  <td>{{ a.specialist?.fullName || '—' }}</td>
                  <td>{{ formatDate(a.date) }}</td>
                  <td><span class="doc-status" :class="a.published ? 'sage' : 'amber'">{{ a.published ? 'Проведена' : 'Назначена' }}</span></td>
                  <td>
                    <button v-if="!a.published" class="rd-cancel-btn" :disabled="cancelingId === a.id" @click="cancelAssignment(a)">
                      {{ cancelingId === a.id ? '…' : 'Отменить' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <template v-if="publishedAssignments.length">
              <h3 class="rd-subtitle" style="margin-top: 1.75rem;">Результаты проведённых диагностик</h3>
              <div v-for="a in publishedAssignments" :key="'res-' + a.id" class="rd-result">
                <div class="rd-result-head">
                  <span class="rd-result-dir">{{ a.direction?.name || '—' }}</span>
                  <span class="rd-result-meta">{{ a.specialist?.fullName || '—' }} · {{ formatDate(a.date) }}</span>
                </div>
                <div v-if="!resultBlocks(a).length" class="rd-result-empty">Результаты не заполнены</div>
                <div v-else>
                  <div v-for="(b, i) in resultBlocks(a)" :key="i" class="rd-result-block">
                    <div class="rd-result-block-title">{{ blockTitle(b) }}</div>
                    <div v-if="b.specialists && b.specialists.length" class="rd-result-spec">
                      Специалисты: {{ b.specialists.join(', ') }}
                    </div>
                    <p v-if="b.recs" class="rd-result-recs">{{ b.recs }}</p>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>

      <!-- FOOTER -->
      <div class="rd-footer">
        <span class="id-chip">ID R-{{ recipientCode }}</span>
        <button class="btn btn-secondary" @click="goBack">← К списку</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePageStore } from '../stores/page';
import api from '../api';
import { fullName, initials, recipientAge, statusLabel } from '../utils/recipient';

const pageStore = usePageStore();
const recipientId = pageStore.params?.recipientId;

const loading = ref(true);
const recipient = ref(null);
const groupMembers = ref([]);
const groupMembersLoading = ref(false);
const activeTab = ref('overview');

const allGroups = ref([]);
const groupsLoading = ref(false);
const selectedGroupId = ref(null);
const savingGroup = ref(false);

const directions = ref([]);
const directionsLoading = ref(false);
const specialists = ref([]);
const specialistsLoading = ref(false);
const assignments = ref([]);
const assignmentsLoading = ref(false);
const assigning = ref(false);
const cancelingId = ref(null);
const assignError = ref('');
const assignForm = ref({ directionId: null, specialistId: null, date: '' });
const todayStr = new Date().toISOString().slice(0, 10);
const canAssign = computed(() =>
  !!assignForm.value.directionId && !!assignForm.value.specialistId && !!assignForm.value.date
);
const publishedAssignments = computed(() => assignments.value.filter(a => a.published));
const diagCount = computed(() => assignments.value.length);

const groupChanged = computed(
  () => (selectedGroupId.value ?? null) !== (recipient.value?.groupId ?? null)
);

const tabs = [
  { id: 'overview', label: 'Обзор' },
  { id: 'documents', label: 'Документы' },
  { id: 'group', label: 'Группа' },
  { id: 'representative', label: 'Представитель' },
  { id: 'diagnostics', label: 'Диагностики' },
];

const stageSteps = ['Заявка', 'Заявление', 'Диагностика', 'Зачисление', 'Занятия', 'Итоги цикла'];
const stageIndex = computed(() => {
  const s = recipient.value?.status;
  if (s === 'draft') return 1;
  if (s === 'archived') return 5;
  return 4; // active / зачислен
});

const doc = computed(() => recipient.value?.docs?.[0] || null);
const age = computed(() => recipientAge(recipient.value));
const groupName = computed(() => recipient.value?.group?.groupName || '');
const curatorName = computed(() => recipient.value?.group?.curatorRef?.fullName || '');
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
const programDays = computed(() => {
  const c = recipient.value?.createdAt;
  if (!c) return null;
  const diff = Math.floor((Date.now() - new Date(c).getTime()) / 86400000);
  return diff >= 0 ? diff : null;
});

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

function memberMeta(m) {
  const a = recipientAge(m);
  return [a != null ? `${a} ${yearsWord(a)}` : '', m.diagnosis || ''].filter(Boolean).join(' · ');
}

function resultBlocks(a) {
  const blocks = a?.results?.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.filter(b =>
    (b && typeof b.recs === 'string' && b.recs.trim()) ||
    (b && Array.isArray(b.specialists) && b.specialists.length)
  );
}

function blockTitle(b) {
  return String(b?.sub || b?.direction || 'Блок').replace(/\s*\n\s*/g, ' ').trim();
}

const goBack = () => {
  pageStore.setPage('recipients', 'Реабилитанты', {});
};

const loadRecipient = async () => {
  if (!recipientId) { loading.value = false; return; }
  try {
    const { data } = await api.get(`/recipients/${recipientId}`);
    recipient.value = data;
    selectedGroupId.value = data.groupId ?? null;
  } catch (err) {
    console.error('loadRecipient', err);
  } finally {
    loading.value = false;
  }
};

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

const loadDiagnosticRefs = async () => {
  if (!directions.value.length && !directionsLoading.value) {
    directionsLoading.value = true;
    try {
      const { data } = await api.get('/lists/directions');
      directions.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('loadDirections', err);
      directions.value = [];
    } finally {
      directionsLoading.value = false;
    }
  }
  if (!specialists.value.length && !specialistsLoading.value) {
    specialistsLoading.value = true;
    try {
      const { data } = await api.get('/lists/curators');
      specialists.value = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('loadSpecialists', err);
      specialists.value = [];
    } finally {
      specialistsLoading.value = false;
    }
  }
};

const loadAssignments = async () => {
  if (!recipientId) return;
  assignmentsLoading.value = true;
  try {
    const { data } = await api.get('/diagnostics', { params: { recipientId, limit: 100 } });
    assignments.value = Array.isArray(data?.data) ? data.data : [];
  } catch (err) {
    console.error('loadAssignments', err);
    assignments.value = [];
  } finally {
    assignmentsLoading.value = false;
  }
};

const createAssignment = async () => {
  if (!canAssign.value || assigning.value) return;
  assigning.value = true;
  assignError.value = '';
  try {
    await api.post('/diagnostics', {
      idRecipient: Number(recipientId),
      idDirection: assignForm.value.directionId,
      idSpecialist: assignForm.value.specialistId,
      date: assignForm.value.date,
      results: {},
      published: false
    });
    assignForm.value = { directionId: null, specialistId: null, date: '' };
    await loadAssignments();
  } catch (err) {
    console.error('createAssignment', err);
    assignError.value = err?.response?.data?.message || 'Не удалось создать назначение';
  } finally {
    assigning.value = false;
  }
};

const cancelAssignment = async (a) => {
  if (cancelingId.value) return;
  cancelingId.value = a.id;
  try {
    await api.delete(`/diagnostics/${a.id}`);
    await loadAssignments();
  } catch (err) {
    console.error('cancelAssignment', err);
    alert('Не удалось отменить назначение');
  } finally {
    cancelingId.value = null;
  }
};

watch(activeTab, (tab) => {
  if (tab === 'group') {
    loadGroups();
    if (!groupMembers.value.length && !groupMembersLoading.value) loadGroupMembers();
  } else if (tab === 'diagnostics') {
    loadDiagnosticRefs();
    loadAssignments();
  }
});

onMounted(loadRecipient);
</script>

<style scoped>
/* ===== ДИЗАЙН-СИСТЕМА (единая с макетом «Карточка реабилитанта v3») ===== */
.rd-page {
  --font-serif: 'Lora', 'Times New Roman', Georgia, serif;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --paper: #FFFFFF;
  --paper-soft: #F3EEE4;
  --paper-sunken: #EDE8DD;
  --ink: #1A211A;
  --ink-strong: #0F140F;
  --ink-muted: #454C40;
  --ink-subtle: #5E6359;
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
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.125rem;
  --radius-xl: 1.5rem;
  --shadow-sm: 0 0.0625rem 0.125rem rgba(30, 47, 30, 0.04), 0 0.0625rem 0 rgba(30, 47, 30, 0.02);
  --shadow-md: 0 0.25rem 0.875rem rgba(30, 47, 30, 0.05), 0 0.0625rem 0.125rem rgba(30, 47, 30, 0.04);

  max-width: 87.5rem;
  margin: 0 auto;
  font-family: var(--font-sans);
  color: var(--ink);
  line-height: 1.55;
}

.rd-page *,
.rd-page *::before,
.rd-page *::after { box-sizing: border-box; }

/* ===== LOADING / EMPTY ===== */
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

/* ===== BREADCRUMB ===== */
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

/* ===== BUTTONS ===== */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4375rem;
  padding: 0.6875rem 1.125rem; min-height: 2.75rem;
  border-radius: 0.625rem; font-size: 0.9375rem; font-weight: 500;
  border: 0.0625rem solid transparent; white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  cursor: pointer;
}
.btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.btn-primary { background: var(--sage-900); color: #F4F8EC; border-color: var(--sage-900); }
.btn-primary:hover:not(:disabled) { background: var(--sage-800); border-color: var(--sage-800); }
.btn-secondary { background: var(--paper); color: var(--ink); border-color: var(--line-strong); }
.btn-secondary:hover:not(:disabled) { background: var(--paper-soft); border-color: var(--ink-muted); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* ===== ALERT ===== */
.alert {
  display: flex; align-items: center; gap: 0.875rem;
  background: linear-gradient(90deg, var(--rose-50), var(--amber-50));
  border: 0.0625rem solid var(--amber-100);
  border-left: 0.25rem solid var(--rose-500);
  border-radius: var(--radius-md);
  padding: 1rem 1.125rem; margin-bottom: 1.25rem;
}
.alert-icon {
  flex: 0 0 2rem; width: 2rem; height: 2rem; border-radius: 0.5rem;
  background: var(--rose-100); color: var(--rose-700); display: grid; place-items: center;
}
.alert-icon svg { width: 1.125rem; height: 1.125rem; }
.alert-body { flex: 1; min-width: 0; }
.alert-title {
  font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--rose-700); margin-bottom: 0.25rem;
}
.alert-text { font-size: 0.9375rem; color: var(--ink-strong); line-height: 1.5; }

/* ===== HERO ===== */
.hero {
  position: relative; border-radius: var(--radius-xl); margin-bottom: 1.5rem;
  border: 0.0625rem solid var(--line); background: var(--paper); box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.hero-banner {
  height: 8rem;
  background: linear-gradient(120deg, var(--sage-100), var(--sage-50) 55%, var(--amber-50));
  border-bottom: 0.0625rem solid var(--line-soft);
}
.hero-body {
  padding: 0 2rem 1.5rem;
  display: grid; grid-template-columns: auto 1fr auto; gap: 1.5rem; align-items: end;
  position: relative; background: var(--paper);
}
.hero-avatar, .hero-avatar-img {
  width: 7.5rem; height: 7.5rem; flex: 0 0 7.5rem; border-radius: 50%;
  border: 0.375rem solid var(--paper); box-shadow: var(--shadow-md);
  transform: translateY(-3rem); margin-bottom: -2rem;
}
.hero-avatar {
  display: grid; place-items: center;
  background: linear-gradient(135deg, var(--amber-100), var(--rose-100));
  color: var(--amber-700);
  font-family: var(--font-serif); font-weight: 500; font-size: 2.75rem; letter-spacing: -0.04em;
}
.hero-avatar-img { object-fit: cover; }
.hero-identity { padding-bottom: 0.25rem; min-width: 0; }
.hero-id-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
.id-chip {
  font-size: 0.6875rem; color: var(--ink-muted); background: var(--paper-soft);
  padding: 0.125rem 0.5rem; border-radius: 0.25rem; letter-spacing: 0.04em; font-weight: 600;
}
.status-dot { width: 0.4375rem; height: 0.4375rem; border-radius: 50%; background: var(--sage-500); box-shadow: 0 0 0 0.1875rem var(--sage-100); }
.status-dot.st-draft { background: #B07223; box-shadow: 0 0 0 0.1875rem var(--amber-100); }
.status-dot.st-archived { background: var(--ink-subtle); box-shadow: 0 0 0 0.1875rem var(--paper-sunken); }
.status-label { font-size: 0.78125rem; color: var(--sage-700); font-weight: 600; }
.status-label.st-draft { color: var(--amber-700); }
.status-label.st-archived { color: var(--ink-muted); }
.stage-chip {
  font-size: 0.71875rem; color: var(--ink-muted); background: var(--paper-soft);
  padding: 0.125rem 0.5rem; border-radius: 62.5rem; font-weight: 500;
}
.hero-name {
  font-family: var(--font-serif); font-size: 2.5rem; line-height: 1.05; font-weight: 500;
  letter-spacing: -0.025em; color: var(--ink-strong); margin: 0 0 0.5rem;
  word-break: break-word;
}
.hero-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
.tag { font-size: 0.78125rem; padding: 0.1875rem 0.625rem; border-radius: 62.5rem; font-weight: 500; }
.tag-neutral { background: var(--paper-soft); color: var(--ink-muted); }
.tag-blue { background: var(--blue-50); color: var(--blue-700); }
.tag-sage { background: var(--sage-50); color: var(--sage-700); }
.hero-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; padding-bottom: 0.25rem; }

/* ===== STAGE TRACK ===== */
.stage-track { border-top: 0.0625rem solid var(--line-soft); padding: 1.25rem 2rem; background: var(--paper-soft); }
.stage-track-label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; color: var(--ink-muted); margin-bottom: 0.75rem; }
.stage-steps { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem; list-style: none; margin: 0; padding: 0; }
.stage-step { display: flex; flex-direction: column; gap: 0.375rem; padding-top: 0.875rem; position: relative; }
.stage-step::before { content: ''; position: absolute; top: 0.3125rem; left: 0; right: 0; height: 0.25rem; border-radius: 62.5rem; background: var(--line); }
.stage-step.done::before { background: var(--sage-500); }
.stage-step.current::before { background: var(--sage-900); }
.stage-step .step-num { font-size: 0.75rem; font-weight: 700; color: var(--ink-muted); }
.stage-step.current .step-num { color: var(--sage-900); }
.stage-step .step-name { font-size: 0.9375rem; color: var(--ink-muted); line-height: 1.3; }
.stage-step.current .step-name { color: var(--ink-strong); font-weight: 600; }
.stage-step.done .step-name { color: var(--ink); }

/* ===== MINI STATS ===== */
.mini-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; padding: 1rem 2rem 1.5rem; }
.mini-stat { background: var(--paper-soft); border-radius: var(--radius-md); padding: 0.85rem 1rem; min-width: 0; }
.mini-stat.active { background: var(--sage-50); border: 0.0625rem solid var(--sage-100); }
.mini-stat .label { font-size: 0.71875rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-muted); font-weight: 600; }
.mini-stat .value {
  font-family: var(--font-serif); font-size: 1.5rem; font-weight: 500; color: var(--ink-strong);
  margin-top: 0.1875rem; letter-spacing: -0.025em; line-height: 1.1;
}
.mini-stat .value.value-text { font-size: 1.0625rem; line-height: 1.25; word-break: break-word; }
.mini-stat .value .value-unit { font-size: 0.9375rem; color: var(--ink-muted); font-family: var(--font-sans); font-weight: 500; }
.mini-stat .trend { font-size: 0.75rem; color: var(--ink-muted); margin-top: 0.3125rem; font-weight: 400; line-height: 1.35; }

/* ===== TABS ===== */
.tabs { display: flex; gap: 0.25rem; border-bottom: 0.0625rem solid var(--line); margin-bottom: 1.5rem; overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab {
  display: inline-flex; align-items: center; gap: 0.4375rem; padding: 0.75rem 0.875rem; min-height: 2.75rem;
  font-size: 0.9375rem; font-weight: 500; color: var(--ink-muted);
  background: none; border: none; border-bottom: 0.1875rem solid transparent; white-space: nowrap;
  cursor: pointer; transition: color 0.15s, border-color 0.15s;
}
.tab:hover { color: var(--ink-strong); }
.tab[aria-selected="true"] { color: var(--sage-900); border-bottom-color: var(--sage-700); font-weight: 600; }
.tab-count {
  font-size: 0.75rem; font-weight: 600; color: var(--ink-muted); background: var(--paper-soft);
  border: 0.0625rem solid var(--line); border-radius: 62.5rem; padding: 0.0625rem 0.4375rem;
}
.tab[aria-selected="true"] .tab-count { background: var(--sage-100); color: var(--sage-700); border-color: var(--sage-100); }

.tabpanel { animation: rd-panel 0.35s cubic-bezier(0.2, 0.7, 0.2, 1); }
@keyframes rd-panel { from { opacity: 0; transform: translateY(0.5rem); } to { opacity: 1; transform: none; } }

/* ===== GRID ===== */
.grid { display: grid; grid-template-columns: minmax(0, 1fr) 21.25rem; gap: 1.5rem; align-items: start; }
.grid > div, .grid > aside { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }

/* ===== CARD ===== */
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

/* ===== KEY-VALUE ===== */
.kv-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.25rem 1.5rem; margin: 0; }
.kv { padding: 0.625rem 0; border-bottom: 0.0625rem solid var(--line-soft); min-width: 0; }
.kv-full { grid-column: 1 / -1; }
.kv-key { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; color: var(--ink-muted); margin-bottom: 0.25rem; }
.kv-val { display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.375rem; min-width: 0; }
.kv-text { font-size: 0.9375rem; color: var(--ink-strong); line-height: 1.45; word-break: break-word; margin: 0; }
.kv-text .code { font-weight: 600; color: var(--sage-700); margin-right: 0.25rem; }

/* ===== PERSON ROWS ===== */
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

/* ===== FORM CONTROLS ===== */
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

/* ===== ASSIGN (диагностика) ===== */
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

/* ===== FOOTER ===== */
.rd-footer {
  margin-top: 1.5rem; padding-top: 1rem; border-top: 0.0625rem solid var(--line);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 75rem) {
  .grid { grid-template-columns: 1fr; }
  .mini-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 48rem) {
  .hero-body { grid-template-columns: 1fr; padding: 0 1.125rem 1.125rem; }
  .hero-avatar, .hero-avatar-img { justify-self: start; }
  .hero-name { font-size: 2rem; }
  .stage-track, .mini-stats { padding-left: 1.125rem; padding-right: 1.125rem; }
  .stage-steps { grid-template-columns: repeat(3, 1fr); gap: 0.75rem 0.5rem; }
  .kv-grid { grid-template-columns: 1fr; }
  .rd-assign-grid { grid-template-columns: 1fr; }
}
@media (max-width: 30rem) {
  .mini-stats { grid-template-columns: 1fr; }
  .stage-steps { grid-template-columns: repeat(2, 1fr); }
  .hero-actions .btn { flex: 1 1 auto; }
}
</style>
