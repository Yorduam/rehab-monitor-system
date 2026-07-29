<template>
  <div class="rw-overlay">
   <div class="rw-modal" role="dialog" aria-modal="true" aria-label="Добавление реабилитанта">

    <div class="rw-topbar">
      <div class="rw-topbar-inner">
        <nav class="rw-breadcrumb" aria-label="Навигация">
          <button class="rw-bc-link" @click="$emit('close')">Реабилитанты</button>
          <svg class="rw-bc-sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          <span class="rw-bc-cur">Добавление реабилитанта</span>
        </nav>
        <div class="rw-topbar-right">
          <span class="rw-save-state">
            <span class="rw-save-dot"></span>
            Черновик сохранён
          </span>
          <button class="rw-clear-btn" type="button" @click="clearDraft" title="Очистить все поля черновика">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Очистить черновик
          </button>
          <button class="rw-close-btn" @click="$emit('close')" aria-label="Закрыть">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="rw-scroll">
      <div class="rw-content">

        <div class="rw-page-head">
          <div class="rw-ph-text">
            <div class="rw-ph-eyebrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Новая карточка
            </div>
            <h1 class="rw-ph-title">Добавление реабилитанта</h1>
            <p class="rw-ph-sub">Заполните данные о законном представителе, реабилитанте и загрузите подтверждающие документы. Прогресс сохраняется автоматически.</p>
          </div>
          <div class="rw-ph-actions">
            <button class="rw-btn rw-btn-ghost" type="button" @click="$emit('close')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Отменить
            </button>
          </div>
        </div>

        <nav class="rw-stepper" aria-label="Этапы заполнения">
          <ol class="rw-stepper-list">
            <li v-for="(s, i) in steps" :key="i">
              <button
                class="rw-step-btn"
                :class="{ 'is-done': stepProgress[i].complete && step !== i+1, 'is-current': step === i+1 }"
                type="button"
                :aria-current="step === i+1 ? 'step' : undefined"
                @click="step = i+1"
              >
                <div class="rw-step-line">
                  <span class="rw-step-num">
                    <svg v-if="stepProgress[i].complete && step !== i+1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <template v-else>{{ i+1 }}</template>
                  </span>
                  <span class="rw-step-bar" aria-hidden="true"></span>
                </div>
                <div class="rw-step-info">
                  <div class="rw-step-label">{{ s.label }}</div>
                  <div class="rw-step-meta">
                    <template v-if="stepProgress[i].complete">
                      <svg class="rw-step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Заполнено полностью
                    </template>
                    <template v-else>{{ stepProgress[i].done }} из {{ stepProgress[i].total }} полей</template>
                  </div>
                  <div class="rw-step-progress" aria-hidden="true">
                    <div class="rw-step-progress-fill" :class="{ 'is-full': stepProgress[i].complete }" :style="{ width: stepProgress[i].pct + '%' }"></div>
                  </div>
                </div>
              </button>
            </li>
            <li class="rw-step-finish" :class="{ 'is-reached': allComplete }">
              <div class="rw-finish-line">
                <span class="rw-finish-flag" :class="{ 'is-reached': allComplete }" :title="allComplete ? 'Все этапы заполнены — можно создавать карточку' : 'Завершение добавления реабилитанта'">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
              </div>
              <div class="rw-finish-cap" :class="{ 'is-reached': allComplete }">
                {{ allComplete ? 'Готово' : 'Завершение' }}
              </div>
            </li>
          </ol>
          <div class="rw-stepper-mobile" aria-hidden="true">
            <div>
              <span class="rw-smp-label">{{ steps[step-1].label }}</span>
              &nbsp;· заполнено {{ overallProgress.pct }}%
            </div>
            <div class="rw-smp-bar"><div class="rw-smp-fill" :style="{ width: overallProgress.pct + '%' }"></div></div>
          </div>
        </nav>

        <section v-show="step === 1" class="rw-panel">
          <div class="rw-card">
            <div class="rw-card-head">
              <div class="rw-ch-icon rw-ch-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h2 class="rw-ch-title">Законный представитель</h2>
                <p class="rw-ch-sub">Данные родителя, опекуна или попечителя реабилитанта</p>
              </div>
            </div>
            <div class="rw-card-body">

              <div class="rw-divider"><span class="rw-dv-label">ФИО</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="lr-last">Фамилия <span class="rw-req">*</span></label>
                  <input id="lr-last" class="rw-input" type="text" :value="f.lrLast" @input="onMask('lrLast', $event, maskName)" autocomplete="family-name" placeholder="Иванов" maxlength="50" />
                </div>
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="lr-first">Имя <span class="rw-req">*</span></label>
                  <input id="lr-first" class="rw-input" type="text" :value="f.lrFirst" @input="onMask('lrFirst', $event, maskName)" autocomplete="given-name" placeholder="Иван" maxlength="50" />
                </div>
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="lr-mid">Отчество <span class="rw-opt">при наличии</span></label>
                  <input id="lr-mid" class="rw-input" type="text" :value="f.lrMid" @input="onMask('lrMid', $event, maskName)" autocomplete="additional-name" placeholder="Иванович" maxlength="50" />
                </div>
                <div class="rw-f rw-c6">
                  <label class="rw-label" for="lr-rel">Кем приходится реабилитанту <span class="rw-req">*</span></label>
                  <select id="lr-rel" class="rw-select" v-model="f.lrRelation">
                    <option value="">Выберите…</option>
                    <option>Мать</option><option>Отец</option><option>Опекун</option>
                    <option>Попечитель</option><option>Усыновитель</option><option>Иное</option>
                  </select>
                </div>
                <div class="rw-f rw-c6">
                  <label class="rw-label" for="lr-phone">Телефон <span class="rw-req">*</span></label>
                  <input id="lr-phone" class="rw-input" type="tel" inputmode="tel" :value="f.lrPhone" @input="onMask('lrPhone', $event, maskPhone)" maxlength="18" placeholder="+7 (___) ___-__-__" />
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Паспорт</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="lp-ser">Серия <span class="rw-req">*</span></label>
                  <input id="lp-ser" class="rw-input" type="text" inputmode="numeric" maxlength="4" placeholder="0000" :value="f.lrPassSeries" @input="onMask('lrPassSeries', $event, v => onlyDigits(v, 4))" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="lp-num">Номер <span class="rw-req">*</span></label>
                  <input id="lp-num" class="rw-input" type="text" inputmode="numeric" maxlength="6" placeholder="000000" :value="f.lrPassNum" @input="onMask('lrPassNum', $event, v => onlyDigits(v, 6))" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="lp-dt">Дата выдачи <span class="rw-req">*</span></label>
                  <input id="lp-dt" class="rw-input" type="date" v-model="f.lrPassDate" :max="today" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="lp-code">Код подразделения <span class="rw-req">*</span></label>
                  <input id="lp-code" class="rw-input" type="text" inputmode="numeric" maxlength="7" placeholder="000-000" :value="f.lrPassCode" @input="onMask('lrPassCode', $event, maskDeptCode)" />
                </div>
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="lp-iss">Кем выдан <span class="rw-req">*</span></label>
                  <input id="lp-iss" class="rw-input" type="text" placeholder="Наименование органа, выдавшего паспорт" :value="f.lrPassIssuer" @input="onMask('lrPassIssuer', $event, v => maskText(v, 255))" maxlength="255" />
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Адрес регистрации</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="lr-addr">Адрес регистрации представителя <span class="rw-req">*</span></label>
                  <input id="lr-addr" class="rw-input" type="text" placeholder="Регион, город, улица, дом, квартира" :value="f.lrAddress" @input="onMask('lrAddress', $event, v => maskText(v, 500))" maxlength="500" />
                </div>
              </div>

            </div>
          </div>
        </section>

        <section v-show="step === 2" class="rw-panel">
          <div class="rw-card">
            <div class="rw-card-head">
              <div class="rw-ch-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
              </div>
              <div>
                <h2 class="rw-ch-title">Данные реабилитанта</h2>
                <p class="rw-ch-sub">Личная информация и сведения о группе инвалидности</p>
              </div>
            </div>
            <div class="rw-card-body">

              <div class="rw-divider"><span class="rw-dv-label">ФИО и дата рождения</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-last">Фамилия <span class="rw-req">*</span></label>
                  <input id="r-last" class="rw-input" type="text" :value="f.rLast" @input="onMask('rLast', $event, maskName)" placeholder="Иванов" maxlength="50" />
                </div>
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-first">Имя <span class="rw-req">*</span></label>
                  <input id="r-first" class="rw-input" type="text" :value="f.rFirst" @input="onMask('rFirst', $event, maskName)" placeholder="Иван" maxlength="50" />
                </div>
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-mid">Отчество <span class="rw-opt">при наличии</span></label>
                  <input id="r-mid" class="rw-input" type="text" :value="f.rMid" @input="onMask('rMid', $event, maskName)" placeholder="Иванович" maxlength="50" />
                </div>
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-birth">Дата рождения <span class="rw-req">*</span></label>
                  <input id="r-birth" class="rw-input" type="date" v-model="f.rBirth" :max="today" />
                  <span class="rw-field-help">Возраст рассчитается автоматически</span>
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Медицинские сведения и реабилитационная группа</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c12">
                  <fieldset style="border:none;padding:0;margin:0">
                    <legend class="rw-label" style="margin-bottom:0.5rem">Группа инвалидности <span class="rw-req">*</span></legend>
                    <div class="rw-seg">
                      <button v-for="inv in invOptions" :key="inv.v"
                        class="rw-seg-btn" :class="{ active: f.rInvalidity === inv.v }"
                        type="button" @click="f.rInvalidity = inv.v">{{ inv.l }}</button>
                    </div>
                  </fieldset>
                </div>
                <div class="rw-f rw-c6">
                  <label class="rw-label" for="r-snils">СНИЛС <span class="rw-req">*</span></label>
                  <input id="r-snils" class="rw-input" type="text" inputmode="numeric" maxlength="14" placeholder="000-000-000 00" :value="f.rSnils" @input="onMask('rSnils', $event, maskSnils)" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="r-mse-date">Дата выдачи МСЭ</label>
                  <input id="r-mse-date" class="rw-input" type="date" v-model="f.rMseDate" :max="today" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="r-mse-until">Дата действия МСЭ</label>
                  <input id="r-mse-until" class="rw-input" type="date" v-model="f.rMseUntil" :min="f.rMseDate || undefined" />
                </div>

                <div class="rw-f rw-c12">
                  <label class="rw-label" id="r-crg-label">Целевая реабилитационная группа (ЦРГ) <span class="rw-req">*</span></label>
                  <div class="rw-singleselect rw-crg-group-wrap"
                    :class="{ 'rw-ss-open': crgGroupOpen, 'rw-ss-disabled': crgGroupDisabled }">
                    <button class="rw-ss-trigger" type="button"
                      :disabled="crgGroupDisabled"
                      @click="crgGroupDisabled ? null : (crgGroupOpen = !crgGroupOpen)"
                      :aria-expanded="crgGroupOpen"
                      aria-haspopup="listbox"
                      aria-labelledby="r-crg-label">
                      <span class="rw-ss-value" :class="{ 'rw-ss-placeholder': !f.rCrg }">
                        <template v-if="f.rCrg && selectedCrgGroup">
                          <span class="rw-ss-code">ЦРГ {{ selectedCrgGroup.num }}</span>{{ capitalize(selectedCrgGroup.desc) }}
                        </template>
                        <template v-else-if="crgGroupDisabled">Сначала укажите дату рождения…</template>
                        <template v-else>Выберите группу…</template>
                      </span>
                    </button>
                    <div v-if="crgGroupOpen" class="rw-ss-panel" role="listbox" aria-labelledby="r-crg-label">
                      <div v-for="grp in crgGroupList" :key="grp.code"
                        class="rw-ss-opt" role="option"
                        :aria-selected="f.rCrg === grp.code"
                        @click="selectCrgGroup(grp)">
                        <span class="rw-ss-opt-code">ЦРГ {{ grp.num }}</span>
                        <span class="rw-ss-opt-desc">{{ capitalize(grp.desc) }}</span>
                      </div>
                    </div>
                  </div>
                  <span class="rw-field-help">{{ crgAgeHint }}</span>
                </div>

                <div v-if="f.rCrg" class="rw-f rw-c12">
                  <label class="rw-label" id="r-crg-sub-label">Подгруппа ЦРГ <span class="rw-opt">если применимо</span></label>
                  <template v-if="crgSubOptions.length > 0">
                    <div class="rw-singleselect rw-crg-sub-wrap"
                      :class="{ 'rw-ss-open': crgSubOpen }">
                      <button class="rw-ss-trigger" type="button"
                        @click="crgSubOpen = !crgSubOpen"
                        :aria-expanded="crgSubOpen"
                        aria-haspopup="listbox"
                        aria-labelledby="r-crg-sub-label">
                        <span class="rw-ss-value" :class="{ 'rw-ss-placeholder': !f.rCrgSub }">
                          <template v-if="f.rCrgSub && selectedCrgSub">
                            <span class="rw-ss-code">ЦРГ {{ selectedCrgSub.num }}</span>{{ capitalize(selectedCrgSub.desc) }}
                          </template>
                          <template v-else>Выберите подгруппу…</template>
                        </span>
                      </button>
                      <div v-if="crgSubOpen" class="rw-ss-panel" role="listbox" aria-labelledby="r-crg-sub-label">
                        <div v-for="sub in crgSubOptions" :key="sub.code"
                          class="rw-ss-opt" role="option"
                          :aria-selected="f.rCrgSub === sub.code"
                          @click="selectCrgSub(sub)">
                          <span class="rw-ss-opt-code">ЦРГ {{ sub.num }}</span>
                          <span class="rw-ss-opt-desc">{{ capitalize(sub.desc) }}</span>
                        </div>
                      </div>
                    </div>
                  </template>
                  <div v-else class="rw-ss-empty-note">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Для этой группы подгрупп нет — выбор завершён на уровне группы</span>
                  </div>
                </div>
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="r-nosology-trigger">Нозология <span class="rw-req">*</span> <span class="rw-opt">можно выбрать несколько</span></label>
                  <div class="rw-multiselect" :class="{ 'rw-ms-open': nosologyOpen }">
                    <button
                      class="rw-ms-trigger" type="button"
                      id="r-nosology-trigger"
                      @click="nosologyOpen = !nosologyOpen"
                      :aria-expanded="nosologyOpen"
                    >
                      <span v-if="f.rNosology.length === 0" class="rw-ms-placeholder">Выберите классы МКБ-10…</span>
                      <span v-else class="rw-ms-chips">
                        <span v-for="k in f.rNosology" :key="k" class="rw-ms-chip">
                          {{ nosologyMap[k] }}
                          <span class="rw-ms-chip-x" role="button" @click.stop="removeNosology(k)" aria-label="Убрать">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </span>
                        </span>
                      </span>
                      <svg class="rw-ms-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <div v-if="nosologyOpen" class="rw-ms-panel" role="listbox" aria-multiselectable="true">
                      <div
                        v-for="opt in nosologyOptions" :key="opt.k"
                        class="rw-ms-opt"
                        :class="{ 'is-selected': f.rNosology.includes(opt.k) }"
                        @click.stop="toggleNosology(opt.k)"
                        role="option"
                        :aria-selected="f.rNosology.includes(opt.k)"
                      >
                        <span class="rw-ms-opt-check">
                          <svg v-if="f.rNosology.includes(opt.k)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                        <span class="rw-ms-opt-label">{{ opt.k }} — {{ opt.name }}<span class="rw-ms-opt-code">({{ opt.code }})</span></span>
                      </div>
                    </div>
                  </div>
                  <span class="rw-field-help">Классы Международной классификации болезней (МКБ-10)</span>
                </div>
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="r-diagnosis">Диагноз <span class="rw-opt">свободный ввод</span></label>
                  <textarea id="r-diagnosis" rows="2" v-model="f.rDiagnosis" maxlength="255" placeholder="Основной диагноз и сопутствующие (при наличии)"></textarea>
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Документ, удостоверяющий личность</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c12">
                  <fieldset style="border:none;padding:0;margin:0">
                    <legend class="rw-label" style="margin-bottom:0.5rem">Тип документа <span class="rw-req">*</span></legend>
                    <div class="rw-seg">
                      <button class="rw-seg-btn" :class="{ active: f.rDocType === 'birth' }" type="button" @click="f.rDocType = 'birth'">Свидетельство о рождении</button>
                      <button class="rw-seg-btn" :class="{ active: f.rDocType === 'passport' }" type="button" @click="f.rDocType = 'passport'">Паспорт гражданина РФ</button>
                    </div>
                  </fieldset>
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="rd-ser">Серия <span class="rw-req">*</span></label>
                  <input id="rd-ser" class="rw-input" type="text" :placeholder="f.rDocType === 'birth' ? 'IV-АБ' : '0000'" :value="f.rDocSeries" @input="onDocSeries($event)" :inputmode="f.rDocType === 'birth' ? 'text' : 'numeric'" :maxlength="f.rDocType === 'birth' ? 12 : 4" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="rd-num">Номер <span class="rw-req">*</span></label>
                  <input id="rd-num" class="rw-input" type="text" inputmode="numeric" maxlength="6" placeholder="000000" :value="f.rDocNum" @input="onMask('rDocNum', $event, v => onlyDigits(v, 6))" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="rd-dt">Дата выдачи <span class="rw-req">*</span></label>
                  <input id="rd-dt" class="rw-input" type="date" v-model="f.rDocDate" :max="today" />
                </div>
                <div class="rw-f rw-c3">
                  <label class="rw-label" for="rd-rel">Кем приходится представителю</label>
                  <select id="rd-rel" class="rw-select" v-model="f.rDocRelation">
                    <option value="">Выберите…</option>
                    <option>Сын</option><option>Дочь</option><option>Подопечный</option>
                  </select>
                </div>
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="rd-iss">Кем выдан <span class="rw-req">*</span></label>
                  <input id="rd-iss" class="rw-input" type="text" placeholder="Наименование органа ЗАГС / органа, выдавшего паспорт" :value="f.rDocIssuer" @input="onMask('rDocIssuer', $event, v => maskText(v, 255))" maxlength="255" />
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Адрес регистрации</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-reg-okrug">Округ Москвы <span class="rw-opt">если в Москве</span></label>
                  <select id="r-reg-okrug" class="rw-select" v-model="f.rRegOkrug">
                    <option value="">Не в Москве / выберите…</option>
                    <option v-for="o in moscowOkruga" :key="o" :value="o">{{ o }}</option>
                  </select>
                </div>
                <div class="rw-f rw-c8">
                  <label class="rw-label" for="r-reg">Адрес регистрации <span class="rw-req">*</span></label>
                  <input id="r-reg" class="rw-input" type="text" placeholder="Город, район, улица, дом, квартира" :value="f.rAddrReg" @input="onMask('rAddrReg', $event, v => maskText(v, 500))" maxlength="500" />
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Фактическое проживание</span><span class="rw-dv-line"></span></div>
              <label class="rw-switch-row" style="margin-bottom:1rem">
                <div class="rw-sr-text">
                  <div class="rw-sr-title">Совпадает с адресом регистрации</div>
                  <div class="rw-sr-sub">Включите, если фактический адрес совпадает с пропиской</div>
                </div>
                <span class="rw-switch">
                  <input type="checkbox" v-model="f.rAddrSame" />
                  <span class="rw-slider"></span>
                </span>
              </label>
              <div v-if="!f.rAddrSame" class="rw-fg">
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-fact-okrug">Округ Москвы <span class="rw-opt">если в Москве</span></label>
                  <select id="r-fact-okrug" class="rw-select" v-model="f.rFactOkrug">
                    <option value="">Не в Москве / выберите…</option>
                    <option v-for="o in moscowOkruga" :key="o" :value="o">{{ o }}</option>
                  </select>
                </div>
                <div class="rw-f rw-c8">
                  <label class="rw-label" for="r-fact">Адрес фактического места проживания <span class="rw-req">*</span></label>
                  <input id="r-fact" class="rw-input" type="text" placeholder="Город, район, улица, дом, квартира" :value="f.rAddrFact" @input="onMask('rAddrFact', $event, v => maskText(v, 500))" maxlength="500" />
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Место обучения</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="r-edu">Наименование учреждения</label>
                  <input id="r-edu" class="rw-input" type="text" placeholder="Например: ГБОУ «Школа № 1234», корпус 2" :value="f.rEduName" @input="onMask('rEduName', $event, v => maskText(v, 255))" maxlength="255" />
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Особенности реабилитанта</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-f-notes rw-c12">
                  <label class="rw-label rw-label-amber" for="r-special">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:0.9375rem;height:0.9375rem;flex:0 0 0.9375rem"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Сенсорные особенности, триггеры и сигналы поддержки
                  </label>
                  <textarea id="r-special" rows="5" v-model="f.rSpecial" maxlength="2000" placeholder="Например: Возможны эпизоды агрессии при перегрузке средой. Чувствительность к громким звукам. Резкая смена активности без подготовки вызывает тревогу…"></textarea>
                  <span class="rw-field-help">Описание видно всем специалистам, работающим с реабилитантом. Указывайте поведенческие триггеры и проверенные способы поддержки.</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        <section v-show="step === 3" class="rw-panel">
          <div class="rw-card">
            <div class="rw-card-head">
              <div class="rw-ch-icon rw-ch-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div>
                <h2 class="rw-ch-title">Документы</h2>
                <p class="rw-ch-sub">Загрузите сканы готовых документов, затем сгенерируйте заявление и согласия, распечатайте, подпишите и загрузите обратно подписанные экземпляры.</p>
              </div>
            </div>
            <div class="rw-card-body">

              <div class="rw-subsection rw-sub-first">
                <div class="rw-ssh">
                  <div class="rw-ssh-step">1</div>
                  <div class="rw-ssh-body">
                    <div class="rw-ssh-title">Сканы готовых документов</div>
                    <div class="rw-ssh-sub">PDF, JPG или PNG до 10 МБ. <span class="rw-req-dot"></span> — обязательный документ.</div>
                  </div>
                  <span class="rw-ssh-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {{ uploadCount }} из {{ tiles.length }} загружено
                  </span>
                </div>
                <div class="rw-uploads-grid">
                  <label
                    v-for="t in tiles" :key="t.k"
                    class="rw-utile"
                    :class="{ 'rw-utile-req': t.req, 'rw-utile-done': uploads[t.k] }"
                  >
                    <div class="rw-ut-icon" v-html="t.icon"></div>
                    <div class="rw-ut-body">
                      <div class="rw-ut-title">{{ t.title }}</div>
                      <div class="rw-ut-meta">{{ uploads[t.k] ? uploads[t.k].name : t.meta }}</div>
                    </div>
                    <span class="rw-ut-action">
                      <svg v-if="!uploads[t.k]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" :aria-label="t.title" @change="onFile(t.k, $event)" />
                  </label>
                </div>
              </div>

              <div class="rw-subsection">
                <div class="rw-ssh">
                  <div class="rw-ssh-step">2</div>
                  <div class="rw-ssh-body">
                    <div class="rw-ssh-title">Документы на подпись</div>
                    <div class="rw-ssh-sub">Система сформирует пакет документов на основе данных, заполненных на предыдущих шагах. Скачайте, распечатайте и дайте подписать законному представителю.</div>
                  </div>
                  <span class="rw-ssh-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {{ docsGenerated ? 'Сгенерировано' : 'Ещё не сгенерировано' }}
                  </span>
                </div>
                <div class="rw-gen-row">
                  <div class="rw-gen-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v6m0 0l3-3m-3 3L9 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 11 12 16 17 11"/></svg>
                  </div>
                  <div class="rw-gen-body">
                    <div class="rw-gen-title">Сформировать пакет из 3 документов</div>
                    <div class="rw-gen-sub">Заполнятся автоматически: ФИО представителя и реабилитанта, паспортные данные, адреса, дата рождения, особенности</div>
                  </div>
                  <button class="rw-btn rw-btn-primary" type="button" @click="generateDocs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    {{ docsGenerated ? 'Сформировано' : 'Сгенерировать' }}
                  </button>
                </div>
                <div class="rw-gen-docs">
                  <div v-for="gd in genDocsList" :key="gd.k" class="rw-gen-doc" :class="{ 'rw-gd-ready': docsGenerated }">
                    <div class="rw-gd-head">
                      <span class="rw-gd-num">{{ gd.num }}</span>
                      <span class="rw-gd-badge">{{ docsGenerated ? 'Готов' : 'Не готов' }}</span>
                    </div>
                    <div>
                      <div class="rw-gd-title">{{ gd.title }}</div>
                      <div class="rw-gd-sub">{{ gd.sub }}</div>
                    </div>
                    <div class="rw-gd-actions">
                      <button class="rw-btn rw-btn-secondary rw-btn-sm" type="button" :disabled="!docsGenerated || downloadingDoc === gd.k" @click="downloadDoc(gd.k)">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {{ downloadingDoc === gd.k ? 'Скачивание…' : 'Скачать' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rw-subsection">
                <div class="rw-ssh">
                  <div class="rw-ssh-step">3</div>
                  <div class="rw-ssh-body">
                    <div class="rw-ssh-title">Подписанные документы</div>
                    <div class="rw-ssh-sub">Загрузите сканы или фото каждого из трёх документов после подписания законным представителем.</div>
                  </div>
                  <span class="rw-ssh-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {{ signedCount }} из 3 загружено
                  </span>
                </div>
                <div class="rw-uploads-grid">
                  <label
                    v-for="t in signedTiles" :key="t.k"
                    class="rw-utile rw-utile-req"
                    :class="{ 'rw-utile-done': signedUploads[t.k] }"
                  >
                    <div class="rw-ut-icon" v-html="t.icon"></div>
                    <div class="rw-ut-body">
                      <div class="rw-ut-title">{{ t.title }}</div>
                      <div class="rw-ut-meta">{{ signedUploads[t.k] ? signedUploads[t.k].name : t.meta }}</div>
                    </div>
                    <span class="rw-ut-action">
                      <svg v-if="!signedUploads[t.k]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" :aria-label="t.title" @change="onSignedFile(t.k, $event)" />
                  </label>
                </div>
              </div>

              <label class="rw-switch-row" :class="{ 'is-locked': !packageComplete }" style="margin-top:1.5rem">
                <div class="rw-sr-text">
                  <div class="rw-sr-title">Подтверждаю комплектность пакета документов</div>
                  <div class="rw-sr-sub">Все сканы соответствуют оригиналам, согласия и заявление подписаны законным представителем</div>
                  <div v-if="!packageComplete" class="rw-sr-lock">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Заполните все обязательные поля и прикрепите все обязательные документы на всех этапах — только тогда можно подтвердить комплектность.
                  </div>
                </div>
                <span class="rw-switch">
                  <input type="checkbox" v-model="f.consentConfirmed" :disabled="!packageComplete" />
                  <span class="rw-slider"></span>
                </span>
              </label>

            </div>
          </div>
        </section>

      </div>
    </div>

    <div class="rw-savebar">
      <div class="rw-sb-inner">
        <div class="rw-sb-info">
          <strong>{{ displayName || 'Новый реабилитант' }}</strong>
          <span class="rw-sb-sep">·</span>
          <span class="rw-sb-count">заполнено {{ overallProgress.done }}&nbsp;из&nbsp;{{ overallProgress.total }} полей</span>
        </div>
        <div class="rw-sb-progress">
          <div class="rw-sbp-track"><div class="rw-sbp-fill" :class="{ 'is-full': overallProgress.pct === 100 }" :style="{ width: overallProgress.pct + '%' }"></div></div>
          <span class="rw-sbp-pct">{{ overallProgress.pct }}%</span>
        </div>
        <div class="rw-sb-actions">
          <button v-if="step > 1" class="rw-btn rw-btn-secondary" type="button" @click="step--">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            Назад
          </button>
          <button v-if="step < steps.length" class="rw-btn rw-btn-primary" type="button" @click="step++">
            Далее
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
          <button v-else class="rw-btn rw-btn-primary" type="button" :disabled="saving || !f.consentConfirmed" :title="!f.consentConfirmed ? 'Подтвердите комплектность пакета документов, чтобы сохранить карточку' : ''" @click="save">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {{ saving ? 'Сохранение…' : 'Сохранить и создать карточку' }}
          </button>
        </div>
      </div>
    </div>

   </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import api from '../api';

const props = defineProps({
  groupsList: { type: Array, default: () => [] }
});
const emit = defineEmits(['close', 'saved']);

const step = ref(1);
const saving = ref(false);
const today = new Date().toISOString().slice(0, 10);
const docsGenerated = ref(false);
const nosologyOpen = ref(false);
const crgGroupOpen = ref(false);
const crgSubOpen = ref(false);

const steps = [
  { label: 'Законный представитель' },
  { label: 'Данные реабилитанта' },
  { label: 'Документы' },
];

const invOptions = [
  { v: 'child', l: 'Ребёнок-инвалид' },
  { v: '1',     l: 'I группа'        },
  { v: '2',     l: 'II группа'       },
  { v: '3',     l: 'III группа'      },
  { v: 'none',  l: 'Нет'             },
];

const moscowOkruga = [
  'ЦАО — Центральный',
  'САО — Северный',
  'СВАО — Северо-Восточный',
  'ВАО — Восточный',
  'ЮВАО — Юго-Восточный',
  'ЮАО — Южный',
  'ЮЗАО — Юго-Западный',
  'ЗАО — Западный',
  'СЗАО — Северо-Западный',
  'ЗелАО — Зеленоградский',
  'НАО — Новомосковский',
  'ТАО — Троицкий',
];

const nosologyOptions = [
  { k: 'I',     code: 'A00–B99',  name: 'Некоторые инфекционные и паразитарные болезни' },
  { k: 'II',    code: 'C00–D48',  name: 'Новообразования' },
  { k: 'III',   code: 'D50–D89',  name: 'Болезни крови, кроветворных органов и иммунного механизма' },
  { k: 'IV',    code: 'E00–E90',  name: 'Болезни эндокринной системы, расстройства питания и обмена веществ' },
  { k: 'V',     code: 'F00–F99',  name: 'Психические расстройства и расстройства поведения' },
  { k: 'VI',    code: 'G00–G99',  name: 'Болезни нервной системы' },
  { k: 'VII',   code: 'H00–H59',  name: 'Болезни глаза и его придаточного аппарата' },
  { k: 'VIII',  code: 'H60–H95',  name: 'Болезни уха и сосцевидного отростка' },
  { k: 'IX',    code: 'I00–I99',  name: 'Болезни системы кровообращения' },
  { k: 'X',     code: 'J00–J99',  name: 'Болезни органов дыхания' },
  { k: 'XI',    code: 'K00–K93',  name: 'Болезни органов пищеварения' },
  { k: 'XII',   code: 'L00–L99',  name: 'Болезни кожи и подкожной клетчатки' },
  { k: 'XIII',  code: 'M00–M99',  name: 'Болезни костно-мышечной системы и соединительной ткани' },
  { k: 'XIV',   code: 'N00–N99',  name: 'Болезни мочеполовой системы' },
  { k: 'XV',    code: 'O00–O99',  name: 'Беременность, роды и послеродовой период' },
  { k: 'XVI',   code: 'P00–P96',  name: 'Отдельные состояния перинатального периода' },
  { k: 'XVII',  code: 'Q00–Q99',  name: 'Врождённые аномалии (пороки развития) и хромосомные нарушения' },
  { k: 'XVIII', code: 'R00–R99',  name: 'Симптомы, признаки и отклонения от нормы' },
  { k: 'XIX',   code: 'S00–T98',  name: 'Травмы, отравления и последствия внешних причин' },
  { k: 'XX',    code: 'V01–Y98',  name: 'Внешние причины заболеваемости и смертности' },
  { k: 'XXI',   code: 'Z00–Z99',  name: 'Факторы, влияющие на состояние здоровья населения' },
];

const nosologyMap = Object.fromEntries(nosologyOptions.map(o => [o.k, `${o.k} (${o.code})`]));

const CRG_CHILD = [
  { code: 'child-1',  num: '1',  desc: 'ребёнок-инвалид с преимущественными нарушениями психических функций, в том числе:', hasSubs: true },
  { code: 'child-2',  num: '2',  desc: 'ребёнок-инвалид с преимущественными нарушениями языковых и речевых функций', hasSubs: false },
  { code: 'child-3',  num: '3',  desc: 'ребёнок-инвалид с преимущественными нарушениями сенсорных функций, в том числе:', hasSubs: true },
  { code: 'child-4',  num: '4',  desc: 'ребёнок-инвалид с преимущественными нарушениями нейромышечных, скелетных и связанных с движением (статодинамических) функций, в том числе:', hasSubs: true },
  { code: 'child-5',  num: '5',  desc: 'ребёнок-инвалид с преимущественными нарушениями функций сердечно-сосудистой и (или) дыхательной системы (систем)', hasSubs: false },
  { code: 'child-6',  num: '6',  desc: 'ребёнок-инвалид с преимущественными нарушениями функций пищеварительной и (или) эндокринной системы (систем) и метаболизма', hasSubs: false },
  { code: 'child-7',  num: '7',  desc: 'ребёнок-инвалид с преимущественными нарушениями функций системы крови и иммунной системы, в том числе вследствие злокачественных новообразований', hasSubs: false },
  { code: 'child-8',  num: '8',  desc: 'ребёнок-инвалид с преимущественными нарушениями мочевыделительной функции', hasSubs: false },
  { code: 'child-9',  num: '9',  desc: 'ребёнок-инвалид с преимущественными нарушениями функций кожи и связанных с ней систем', hasSubs: false },
  { code: 'child-10', num: '10', desc: 'ребёнок-инвалид со сложными и (или) множественными нарушениями функций организма, обусловленными хромосомными и генными болезнями', hasSubs: false },
  { code: 'child-11', num: '11', desc: 'ребёнок-инвалид с врождёнными или приобретёнными деформациями (аномалиями развития), последствиями травм лица', hasSubs: false },
  { code: 'child-12', num: '12', desc: 'ребёнок-инвалид, получивший травму, ранение, контузию, увечье в связи с боевыми действиями, в том числе:', hasSubs: true },
];
const CRG_ADULT = [
  { code: 'adult-1',  num: '1',  desc: 'инвалиды с преимущественными нарушениями психических функций, в том числе:', hasSubs: true },
  { code: 'adult-2',  num: '2',  desc: 'инвалиды с преимущественными нарушениями языковых и речевых функций', hasSubs: false },
  { code: 'adult-3',  num: '3',  desc: 'инвалиды с преимущественными нарушениями сенсорных функций, в том числе:', hasSubs: true },
  { code: 'adult-4',  num: '4',  desc: 'инвалиды с преимущественными нарушениями нейромышечных, скелетных и связанных с движением (статодинамических) функций, в том числе:', hasSubs: true },
  { code: 'adult-5',  num: '5',  desc: 'инвалиды с преимущественными нарушениями функций сердечно-сосудистой и (или) дыхательной системы (систем)', hasSubs: false },
  { code: 'adult-6',  num: '6',  desc: 'инвалиды с преимущественными нарушениями функций пищеварительной и (или) эндокринной системы (систем) и метаболизма', hasSubs: false },
  { code: 'adult-7',  num: '7',  desc: 'инвалиды с преимущественными нарушениями функций системы крови и иммунной системы, в том числе вследствие злокачественных новообразований', hasSubs: false },
  { code: 'adult-8',  num: '8',  desc: 'инвалиды с преимущественными нарушениями мочевыделительной функции', hasSubs: false },
  { code: 'adult-9',  num: '9',  desc: 'инвалиды с преимущественными нарушениями функций кожи и связанных с ней систем', hasSubs: false },
  { code: 'adult-10', num: '10', desc: 'инвалиды со сложными и (или) множественными нарушениями функций организма, обусловленными хромосомными и генными болезнями', hasSubs: false },
  { code: 'adult-11', num: '11', desc: 'инвалиды с врождёнными или приобретёнными деформациями (аномалиями развития), последствиями травм лица', hasSubs: false },
  { code: 'adult-12', num: '12', desc: 'инвалиды, получившие ранение (травму, контузию, увечье) или заболевание в связи с участием в боевых действиях, в том числе:', hasSubs: true },
  { code: 'adult-13', num: '13', desc: 'инвалиды, получившие травму, ранение, контузию, увечье в связи с боевыми действиями, в том числе:', hasSubs: true },
];

const CRG_SUBS = {
  'child-1':  [ { code:'child-1.1',  num:'1.1',  desc:'нарушения интеллектуального развития и расстройства развития учебных навыков' }, { code:'child-1.2',  num:'1.2',  desc:'расстройства аутистического спектра (РАС)' }, { code:'child-1.3',  num:'1.3',  desc:'экзогенно-органические расстройства, эпизодические и пароксизмальные расстройства' }, { code:'child-1.4',  num:'1.4',  desc:'эндогенные, аффективные, невротические и соматоформные расстройства' } ],
  'child-3':  [ { code:'child-3.1',  num:'3.1',  desc:'слепота или слабовидение' }, { code:'child-3.2',  num:'3.2',  desc:'глухота или слабослышание' }, { code:'child-3.3',  num:'3.3',  desc:'сочетанные нарушения функций зрения и слуха' } ],
  'child-4':  [ { code:'child-4.1',  num:'4.1',  desc:'ДЦП и другие болезни ЦНС, травмы нервной системы' }, { code:'child-4.2',  num:'4.2',  desc:'болезни костно-мышечной системы, деформации ОДА' }, { code:'child-4.3',  num:'4.3',  desc:'отсутствие одной верхней конечности' }, { code:'child-4.4',  num:'4.4',  desc:'отсутствие обеих верхних конечностей' }, { code:'child-4.5',  num:'4.5',  desc:'отсутствие одной нижней конечности' }, { code:'child-4.6',  num:'4.6',  desc:'отсутствие обеих нижних конечностей' }, { code:'child-4.7',  num:'4.7',  desc:'шейная или спинальная травма' } ],
  'child-12': [ { code:'child-12.1', num:'12.1', desc:'ампутация одной верхней конечности' }, { code:'child-12.2', num:'12.2', desc:'ампутация обеих верхних конечностей' }, { code:'child-12.3', num:'12.3', desc:'ампутация одной нижней конечности' }, { code:'child-12.4', num:'12.4', desc:'ампутация обеих нижних конечностей' }, { code:'child-12.5', num:'12.5', desc:'ожоги, обморожения с контрактурами конечностей' }, { code:'child-12.6', num:'12.6', desc:'спинальная травма' }, { code:'child-12.7', num:'12.7', desc:'поражение периферической нервной системы' }, { code:'child-12.8', num:'12.8', desc:'поражение мозгового отдела черепа и головного мозга' }, { code:'child-12.9', num:'12.9', desc:'поражение лицевого отдела черепа' }, { code:'child-12.10',num:'12.10',desc:'поражение органа зрения' }, { code:'child-12.11',num:'12.11',desc:'поражение органа слуха' }, { code:'child-12.12',num:'12.12',desc:'поражение внутренних органов' }, { code:'child-12.13',num:'12.13',desc:'комбинированная травма / множественные ранения' } ],
  'adult-1':  [ { code:'adult-1.1',  num:'1.1',  desc:'нарушения интеллектуального развития' }, { code:'adult-1.2',  num:'1.2',  desc:'расстройства аутистического спектра (РАС)' }, { code:'adult-1.3',  num:'1.3',  desc:'экзогенно-органические расстройства, эпизодические и пароксизмальные расстройства' }, { code:'adult-1.4',  num:'1.4',  desc:'эндогенные, аффективные, невротические и соматоформные расстройства' } ],
  'adult-3':  [ { code:'adult-3.1',  num:'3.1',  desc:'слепота или слабовидение' }, { code:'adult-3.2',  num:'3.2',  desc:'глухота или слабослышание' }, { code:'adult-3.3',  num:'3.3',  desc:'сочетанные нарушения функций зрения и слуха' } ],
  'adult-4':  [ { code:'adult-4.1',  num:'4.1',  desc:'ДЦП и другие болезни ЦНС, травмы нервной системы' }, { code:'adult-4.2',  num:'4.2',  desc:'болезни костно-мышечной системы, деформации ОДА' }, { code:'adult-4.3',  num:'4.3',  desc:'отсутствие одной верхней конечности' }, { code:'adult-4.4',  num:'4.4',  desc:'отсутствие обеих верхних конечностей' }, { code:'adult-4.5',  num:'4.5',  desc:'отсутствие одной нижней конечности' }, { code:'adult-4.6',  num:'4.6',  desc:'отсутствие обеих нижних конечностей' }, { code:'adult-4.7',  num:'4.7',  desc:'спинальная травма' } ],
  'adult-12': [ { code:'adult-12.1', num:'12.1', desc:'ампутация одной верхней конечности' }, { code:'adult-12.2', num:'12.2', desc:'ампутация обеих верхних конечностей' }, { code:'adult-12.3', num:'12.3', desc:'ампутация одной нижней конечности' }, { code:'adult-12.4', num:'12.4', desc:'ампутация обеих нижних конечностей' }, { code:'adult-12.5', num:'12.5', desc:'ожоги, обморожения с контрактурами конечностей' }, { code:'adult-12.6', num:'12.6', desc:'спинальная травма' }, { code:'adult-12.7', num:'12.7', desc:'поражение периферической нервной системы' }, { code:'adult-12.8', num:'12.8', desc:'поражение мозгового отдела черепа и головного мозга' }, { code:'adult-12.9', num:'12.9', desc:'поражение лицевого отдела черепа' }, { code:'adult-12.10',num:'12.10',desc:'поражение органа зрения' }, { code:'adult-12.11',num:'12.11',desc:'поражение органа слуха' }, { code:'adult-12.12',num:'12.12',desc:'поражение внутренних органов' }, { code:'adult-12.13',num:'12.13',desc:'комбинированная травма / множественные ранения' } ],
  'adult-13': [ { code:'adult-13.1', num:'13.1', desc:'ампутация одной верхней конечности' }, { code:'adult-13.2', num:'13.2', desc:'ампутация обеих верхних конечностей' }, { code:'adult-13.3', num:'13.3', desc:'ампутация одной нижней конечности' }, { code:'adult-13.4', num:'13.4', desc:'ампутация обеих нижних конечностей' }, { code:'adult-13.5', num:'13.5', desc:'ожоги, обморожения с контрактурами конечностей' }, { code:'adult-13.6', num:'13.6', desc:'спинальная травма' }, { code:'adult-13.7', num:'13.7', desc:'поражение периферической нервной системы' }, { code:'adult-13.8', num:'13.8', desc:'поражение мозгового отдела черепа и головного мозга' }, { code:'adult-13.9', num:'13.9', desc:'поражение лицевого отдела черепа' }, { code:'adult-13.10',num:'13.10',desc:'поражение органа зрения' }, { code:'adult-13.11',num:'13.11',desc:'поражение органа слуха' }, { code:'adult-13.12',num:'13.12',desc:'поражение внутренних органов' }, { code:'adult-13.13',num:'13.13',desc:'комбинированная травма / множественные ранения' } ],
};

const toggleNosology = (k) => {
  const idx = f.value.rNosology.indexOf(k);
  if (idx >= 0) f.value.rNosology.splice(idx, 1);
  else f.value.rNosology.push(k);
};
const removeNosology = (k) => {
  const idx = f.value.rNosology.indexOf(k);
  if (idx >= 0) f.value.rNosology.splice(idx, 1);
};

const makeEmptyForm = () => ({

  lrLast: '', lrFirst: '', lrMid: '',
  lrRelation: '', lrPhone: '',
  lrPassSeries: '', lrPassNum: '', lrPassDate: '', lrPassCode: '', lrPassIssuer: '',
  lrAddress: '',

  rLast: '', rFirst: '', rMid: '',
  rBirth: '',

  rInvalidity: '',
  rSnils: '',
  rMseDate: '',
  rMseUntil: '',
  rCrg: '',
  rCrgSub: '',
  rNosology: [],
  rDiagnosis: '',

  rDocType: 'birth',
  rDocSeries: '', rDocNum: '', rDocDate: '', rDocRelation: '', rDocIssuer: '',

  rRegOkrug: '', rAddrReg: '',

  rAddrSame: false,
  rFactOkrug: '', rAddrFact: '',

  rEduName: '',

  rSpecial: '',

  consentConfirmed: false,

  groupId: null,
});

const DRAFT_KEY = 'addRecipientDraft';
const f = ref(makeEmptyForm());

const crgAge = computed(() => {
  if (!f.value.rBirth) return null;
  const bd = new Date(f.value.rBirth);
  if (isNaN(bd)) return null;
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
});
const pluralYears = (n) => {
  const a = Math.abs(n) % 100, b = n % 10;
  if (a > 10 && a < 20) return 'лет';
  if (b > 1 && b < 5)   return 'года';
  if (b === 1)            return 'год';
  return 'лет';
};
const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
const crgGroupDisabled = computed(() => crgAge.value === null);
const crgAgeHint = computed(() => {
  if (crgAge.value === null) return 'Возраст рассчитается автоматически';
  const age = crgAge.value;
  const label = age < 18 ? 'категория «ребёнок-инвалид»' : 'для инвалидов 18+';
  return `Возраст: ${age} ${pluralYears(age)} · перечень ЦРГ — ${label}`;
});
const crgGroupList = computed(() => {
  if (crgAge.value === null) return [];
  return crgAge.value < 18 ? CRG_CHILD : CRG_ADULT;
});
const selectedCrgGroup = computed(() =>
  f.value.rCrg ? (crgGroupList.value.find(g => g.code === f.value.rCrg) ?? null) : null
);
const crgSubOptions = computed(() => CRG_SUBS[f.value.rCrg] ?? []);
const selectedCrgSub = computed(() =>
  f.value.rCrgSub ? (crgSubOptions.value.find(s => s.code === f.value.rCrgSub) ?? null) : null
);

const selectCrgGroup = (grp) => {
  f.value.rCrg = grp.code;
  f.value.rCrgSub = '';
  crgGroupOpen.value = false;
};
const selectCrgSub = (sub) => {
  f.value.rCrgSub = sub.code;
  crgSubOpen.value = false;
};

let prevAgeCategory = null;
watch(() => f.value.rBirth, () => {
  const age = crgAge.value;
  const cat = age === null ? null : (age < 18 ? 'child' : 'adult');
  if (prevAgeCategory !== null && prevAgeCategory !== cat) {
    f.value.rCrg = ''; f.value.rCrgSub = '';
  }
  prevAgeCategory = cat;
});

watch(() => f.value.rCrg, () => { f.value.rCrgSub = ''; });

const uploads = ref({});
const uploadCount = computed(() => Object.keys(uploads.value).length);

const signedUploads = ref({});
const signedCount = computed(() => Object.keys(signedUploads.value).length);

const tiles = [
  { k: 'birth',    req: true,  title: 'Свидетельство о рождении или паспорт', meta: 'Документ, удостоверяющий личность реабилитанта',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
  { k: 'rep-pass', req: true,  title: 'Паспорт законного представителя', meta: 'Разворот с фото и страница с пропиской',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 18c1-2 3-3 5-3s4 1 5 3"/></svg>' },
  { k: 'housing',  req: true,  title: 'ЕЖД / выписка из домовой / форма №8', meta: 'Подтверждение регистрации по месту жительства',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { k: 'mse',      req: true,  title: 'Справка МСЭ (розовая)', meta: 'Медико-социальная экспертиза, установление инвалидности',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
  { k: 'ipra',     req: true,  title: 'ИПРА', meta: 'Индивидуальная программа реабилитации и абилитации',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H5a2 2 0 0 0-2 2v7h18v-7a2 2 0 0 0-2-2h-4"/><path d="M9 7a3 3 0 1 1 6 0v4H9z"/></svg>' },
  { k: 'cpmpk',    req: false, title: 'Заключение ЦПМПК', meta: 'Центральная психолого-медико-педагогическая комиссия',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>' },
  { k: 'med',      req: true,  title: 'Медицинская справка', meta: '«Нет противопоказаний к социокультурной реабилитации»',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"/></svg>' },
  { k: 'snils',    req: true,  title: 'СНИЛС', meta: 'Страховой номер индивидуального лицевого счёта',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>' },
];

const signedTiles = [
  { k: 'signed-pdn',   title: 'Подписанное согласие на ПДн',           meta: 'Скан или фото подписанного документа 1',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13l-4 4-2-2"/></svg>' },
  { k: 'signed-photo', title: 'Подписанное согласие на фото/видео',    meta: 'Скан или фото подписанного документа 2',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>' },
  { k: 'signed-diag',  title: 'Подписанное заявление на диагностику',  meta: 'Скан или фото подписанного документа 3',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' },
];

const genDocsList = [
  { k: 'pdn',   num: 'Документ 1', title: 'Согласие на обработку персональных данных', sub: 'ПДн представителя и ребёнка'          },
  { k: 'photo', num: 'Документ 2', title: 'Согласие на фото- и видеосъёмку',            sub: 'Для документирования занятий и публикации' },
  { k: 'diag',  num: 'Документ 3', title: 'Заявление на проведение диагностики',         sub: 'От законного представителя реабилитанта'   },
];

const displayName = computed(() =>
  [f.value.rLast, f.value.rFirst, f.value.rMid].filter(Boolean).join(' ')
);

// ── Реальный расчёт заполненности карточки ─────────────────
// Процент считается по факту заполнения обязательных полей,
// а НЕ по номеру открытого шага. Просто перелистнуть страницу
// больше нельзя — нужно действительно вносить данные.
const isFilled = (v) => (typeof v === 'string' ? v.trim().length > 0 : !!v);

const requiredChecks = computed(() => {
  const v = f.value;

  // Шаг 1 — законный представитель
  const step1 = [
    isFilled(v.lrLast),
    isFilled(v.lrFirst),
    isFilled(v.lrRelation),
    v.lrPhone.length === 18,           // +7 (XXX) XXX-XX-XX
    v.lrPassSeries.length === 4,
    v.lrPassNum.length === 6,
    isFilled(v.lrPassDate),
    v.lrPassCode.length === 7,         // XXX-XXX
    isFilled(v.lrPassIssuer),
    isFilled(v.lrAddress),
  ];

  // Шаг 2 — данные реабилитанта
  const step2 = [
    isFilled(v.rLast),
    isFilled(v.rFirst),
    isFilled(v.rBirth),
    isFilled(v.rInvalidity),
    v.rSnils.length === 14,            // XXX-XXX-XXX YY
    isFilled(v.rCrg),
    v.rNosology.length > 0,
    v.rDocType === 'birth' ? isFilled(v.rDocSeries) : v.rDocSeries.length === 4,
    v.rDocNum.length === 6,
    isFilled(v.rDocDate),
    isFilled(v.rDocIssuer),
    isFilled(v.rAddrReg),
  ];
  // Фактический адрес обязателен только если он не совпадает с пропиской
  if (!v.rAddrSame) step2.push(isFilled(v.rAddrFact));

  // Шаг 3 — документы
  const reqTileKeys = tiles.filter(t => t.req).map(t => t.k);
  const step3 = [
    ...reqTileKeys.map(k => !!uploads.value[k]),
    docsGenerated.value,
    !!signedUploads.value['signed-pdn'],
    !!signedUploads.value['signed-photo'],
    !!signedUploads.value['signed-diag'],
    v.consentConfirmed,
  ];

  return [step1, step2, step3];
});

const stepProgress = computed(() => requiredChecks.value.map((list) => {
  const total = list.length;
  const done = list.filter(Boolean).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 100, complete: done === total };
}));

const overallProgress = computed(() => {
  const all = requiredChecks.value.flat();
  const total = all.length;
  const done = all.filter(Boolean).length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
});

// Все три этапа заполнены полностью → загорается финишная отметка «дороги».
const allComplete = computed(() => stepProgress.value.every((s) => s.complete));

// Комплектность пакета БЕЗ учёта самого тумблера подтверждения:
// все обязательные поля шагов 1–2, все обязательные сканы, сгенерированные
// и подписанные документы. Пока это не выполнено — подтвердить нельзя.
const packageComplete = computed(() => {
  const [s1, s2, s3] = requiredChecks.value;
  // последний пункт s3 — это сам тумблер consentConfirmed, его исключаем
  return s1.every(Boolean) && s2.every(Boolean) && s3.slice(0, -1).every(Boolean);
});

// Если комплектность нарушилась (убрали скан / очистили поле уже после
// подтверждения) — автоматически снимаем тумблер, чтобы его нельзя было
// «оставить» включённым при неполном пакете.
//
// immediate обязателен. В localStorage черновик сохраняет только поля формы —
// файлы (uploads / signedUploads) там не лежат. Значит после восстановления
// черновика сканов нет, а восстановленный consentConfirmed=true остаётся, и без
// immediate вотчер не сработает (значение packageComplete не «менялось»).
// Кнопка «Сохранить» разблокировалась бы на неполном пакете — именно так
// карточка и уезжала на сервер «с пройденными этапами».
watch(packageComplete, (ok) => {
  if (!ok && f.value.consentConfirmed) f.value.consentConfirmed = false;
}, { immediate: true });

// ── Черновик: данные не теряются при случайном закрытии вкладки ──
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object') {
      f.value = { ...makeEmptyForm(), ...saved };
    }
  } catch (e) { /* повреждённый черновик — игнорируем */ }
};
const saveDraft = () => {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(f.value)); } catch (e) {}
};
const clearDraft = () => {
  if (!confirm('Очистить черновик? Все введённые данные будут удалены безвозвратно.')) return;
  f.value = makeEmptyForm();
  uploads.value = {};
  signedUploads.value = {};
  docsGenerated.value = false;
  step.value = 1;
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
};

// Загружаем сохранённый черновик до подписки, чтобы не перезаписать его пустой формой.
loadDraft();
watch(f, saveDraft, { deep: true });

// ── Маски и нормализация ввода ──────────────────────────────
const onlyDigits = (s, max) => s.replace(/\D/g, '').slice(0, max);

// ФИО: только кириллица, дефис и пробел; каждое слово с заглавной
function maskName(v) {
  const s = v
    .replace(/[^А-Яа-яЁё\- ]/g, '')
    .replace(/^[\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/-{2,}/g, '-');
  return s.replace(/(^|[\s-])([а-яё])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

// Телефон: +7 (XXX) XXX-XX-XX
function maskPhone(v) {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (d.startsWith('7')) d = d.slice(1);
  d = d.slice(0, 10);
  if (!d) return '';
  let out = '+7 (' + d.slice(0, 3);
  if (d.length >= 3) out += ')';
  if (d.length > 3)  out += ' ' + d.slice(3, 6);
  if (d.length > 6)  out += '-' + d.slice(6, 8);
  if (d.length > 8)  out += '-' + d.slice(8, 10);
  return out;
}

// СНИЛС: XXX-XXX-XXX YY
function maskSnils(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += '-' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 9);
  if (d.length > 9) out += ' ' + d.slice(9, 11);
  return out;
}

// Код подразделения: XXX-XXX
function maskDeptCode(v) {
  const d = v.replace(/\D/g, '').slice(0, 6);
  return d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
}

// Серия свидетельства о рождении: римские + «-» + кириллица (IV-АБ)
function maskBirthSeries(v) {
  return v.toUpperCase().replace(/[^IVXLCА-ЯЁ\- ]/g, '').slice(0, 12);
}

// Свободный текст: без ведущих пробелов, без двойных пробелов, с ограничением длины
function maskText(v, max) {
  return v.replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, max);
}

// Универсальный обработчик @input: применяет маску к модели и DOM
function onMask(field, e, fn) {
  const masked = fn(e.target.value);
  f.value[field] = masked;
  if (e.target.value !== masked) e.target.value = masked;
}

// Серия документа реабилитанта зависит от типа документа
function onDocSeries(e) {
  const fn = f.value.rDocType === 'birth' ? maskBirthSeries : (v) => onlyDigits(v, 4);
  onMask('rDocSeries', e, fn);
}

const onFile = (key, e) => {
  const file = e.target.files[0];
  if (file) uploads.value = { ...uploads.value, [key]: file };
};
const onSignedFile = (key, e) => {
  const file = e.target.files[0];
  if (file) signedUploads.value = { ...signedUploads.value, [key]: file };
};

// ── Генерация документов на подпись (согласия + заявление) ──────────────
const downloadingDoc = ref('');

const generateDocs = () => {
  if (!f.value.rLast || !f.value.rFirst) {
    alert('Заполните ФИО реабилитанта (шаг 2), чтобы сформировать документы');
    return;
  }
  docsGenerated.value = true;
};

// gd.k ('pdn' | 'photo' | 'diag') совпадает с docType на бэкенде.
const downloadDoc = async (key) => {
  if (!docsGenerated.value || downloadingDoc.value) return;
  downloadingDoc.value = key;
  try {
    const resp = await api.post(
      '/documents/generate',
      { docType: key, form: f.value },
      { responseType: 'blob' }
    );
    let filename = key === 'diag' ? 'Заявление.docx' : 'Согласие.docx';
    const cd = resp.headers['content-disposition'] || '';
    const star = cd.match(/filename\*=UTF-8''([^;]+)/i);
    if (star) {
      filename = decodeURIComponent(star[1]);
    } else {
      const plain = cd.match(/filename="?([^"]+)"?/i);
      if (plain) filename = plain[1];
    }
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert('Не удалось сформировать документ. Попробуйте ещё раз.');
  } finally {
    downloadingDoc.value = '';
  }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const save = async () => {
  if (!f.value.rLast || !f.value.rFirst) {
    alert('Заполните ФИО реабилитанта (шаг 2)');
    return;
  }
  if (!f.value.consentConfirmed) {
    alert('Нельзя сохранить карточку: сначала заполните все этапы, поля и обязательные сканы, затем включите «Подтверждаю комплектность пакета документов».');
    step.value = steps.length; // перекинуть на шаг с тумблером подтверждения
    return;
  }
  saving.value = true;
  try {

    const crgNum = selectedCrgGroup.value?.num || '';
    const crgChild = !!f.value.rCrg && f.value.rCrg.startsWith('child');

    const { data: createdRecipient } = await api.post('/recipients/intake', {
      recipient: {
        firstName:  f.value.rFirst,
        middleName: f.value.rMid,
        lastName:   f.value.rLast,
        birthDate:  f.value.rBirth || null,
        diagnosis:  f.value.rDiagnosis || '',
        // Сюда мы попадаем только после тумблера «Подтверждаю комплектность
        // пакета документов», то есть карточка заполнена целиком. Раньше здесь
        // жёстко стоял 'draft', и карточка навсегда оставалась черновиком,
        // хотя маршрут показывался пройденным.
        status:     'active',
      },
      representative: {
        firstName:          f.value.lrFirst,
        middleName:         f.value.lrMid,
        lastName:           f.value.lrLast,
        telephone:          f.value.lrPhone,
        passportSeries:     f.value.lrPassSeries,
        passportNumber:     f.value.lrPassNum,
        passportIssuer:     f.value.lrPassIssuer,
        passportIssuerDate: f.value.lrPassDate || null,
        passportDeptCode:   f.value.lrPassCode,
        passportReg:        f.value.lrAddress,
      },
      groupId:         f.value.groupId,
      nozologyClasses: f.value.rNosology,
      crg:             { code: crgNum, child: crgChild },
      doc: {
        docType:        f.value.rDocType === 'birth' ? 'birth' : 'passport',
        docSeries:      f.value.rDocSeries,
        docNumber:      f.value.rDocNum,
        docIssuer:      f.value.rDocIssuer,
        docIssuerDate:  f.value.rDocDate || null,
        snils:          f.value.rSnils,
        mseIssueDate:   f.value.rMseDate || null,
        mseValidDate:   f.value.rMseUntil || null,
        regAddress:     f.value.rAddrReg,
        factAddress:    f.value.rAddrFact,
        factSameReg:    f.value.rAddrSame,
        educationPlace: f.value.rEduName,
        specialNote:    f.value.rSpecial,
      },
    });

    if (createdRecipient?.id) {
      const scans = [];
      for (const [docKey, file] of Object.entries(uploads.value)) {
        if (!file) continue;
        scans.push({
          docKey,
          entityType: docKey === 'rep-pass' ? 'representative' : 'rehabilitant',
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: await fileToBase64(file),
        });
      }
      for (const [docKey, file] of Object.entries(signedUploads.value)) {
        if (!file) continue;
        scans.push({
          docKey,
          entityType: 'representative',
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: await fileToBase64(file),
        });
      }
      if (scans.length) {
        await api.post(`/recipients/${createdRecipient.id}/scans`, { scans });
      }
    }

    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    emit('saved', createdRecipient);
    emit('close');
  } catch (err) {
    console.error(err);
    const msg = err?.response?.data?.message || err?.message || 'неизвестная ошибка';
    alert('Ошибка при сохранении: ' + msg);
  } finally {
    saving.value = false;
  }
};

const closeDropdowns = (e) => {
  if (nosologyOpen.value && !e.target.closest('.rw-multiselect')) nosologyOpen.value = false;
  if (crgGroupOpen.value && !e.target.closest('.rw-crg-group-wrap')) crgGroupOpen.value = false;
  if (crgSubOpen.value   && !e.target.closest('.rw-crg-sub-wrap'))   crgSubOpen.value   = false;
};

const onKey = (e) => {
  if (e.key === 'Escape') {
    if (nosologyOpen.value) { nosologyOpen.value = false; }
    else { emit('close'); }
  }
};

onMounted(() => {
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', closeDropdowns);
  document.body.style.overflow = 'hidden';
});
onUnmounted(() => {
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('click', closeDropdowns);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.rw-overlay {
  --rw-serif:  'Lora', Georgia, 'Times New Roman', serif;
  --rw-sans:   'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --rw-canvas:       #F7F4ED;
  --rw-paper:        #FFFFFF;
  --rw-paper-soft:   #F3EEE4;
  --rw-paper-sunken: #EDE8DD;

  --rw-ink:        #1A211A;
  --rw-ink-strong: #0F140F;
  --rw-ink-muted:  #4F564A;
  --rw-ink-subtle: #6E7368;

  --rw-line:        #E4DECF;
  --rw-line-soft:   #EFEADC;
  --rw-line-strong: #D6CFBE;

  --rw-sage-900: #1E2F1E;
  --rw-sage-800: #2A4129;
  --rw-sage-700: #2F4A2F;
  --rw-sage-500: #5F7E45;
  --rw-sage-100: #E0EBD1;
  --rw-sage-50:  #EEF4E2;

  --rw-amber-700: #6F4514;
  --rw-amber-500: #B07223;
  --rw-amber-100: #F5E3C4;
  --rw-amber-50:  #FBF1DD;

  --rw-rose-700: #6E2B22;
  --rw-rose-500: #B0533F;
  --rw-rose-100: #F3D8CE;
  --rw-rose-50:  #FAE9E0;

  --rw-blue-700: #1F3D52;
  --rw-blue-100: #D4E1EB;
  --rw-blue-50:  #E8EFF5;

  --rw-plum-700: #4C2B52;
  --rw-plum-100: #E5D6E8;
  --rw-plum-50:  #F2E8F5;

  --rw-focus-ring: 0 0 0 3px rgba(95,126,69,.32);
  --rw-radius-sm: 0.5rem;
  --rw-radius-md: 0.75rem;
  --rw-radius-lg: 1.125rem;
  --rw-shadow-sm: 0 1px 2px rgba(30,47,30,.04), 0 1px 0 rgba(30,47,30,.02);
  --rw-shadow-lg: 0 .75rem 2.5rem rgba(30,47,30,.08), 0 .125rem .375rem rgba(30,47,30,.04);

  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(15, 20, 15, .55);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 2rem;
  font-family: var(--rw-sans);
  color: var(--rw-ink);
  -webkit-font-smoothing: antialiased;
  animation: rwOverlayIn 0.25s ease;
}
@keyframes rwOverlayIn { from { opacity: 0; } to { opacity: 1; } }
.rw-modal {
  width: 100%;
  max-width: 76rem;
  max-height: 92vh;
  background: var(--rw-canvas);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-lg);
  box-shadow: 0 2rem 5rem rgba(15, 20, 15, .35), 0 .5rem 1.5rem rgba(15, 20, 15, .2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: rwModalIn 0.32s cubic-bezier(0.2, 0.7, 0.2, 1);
}
@keyframes rwModalIn {
  from { opacity: 0; transform: translateY(1rem) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.rw-topbar {
  flex: 0 0 auto;
  background: var(--rw-paper);
  border-bottom: 1px solid var(--rw-line);
  box-shadow: var(--rw-shadow-sm);
  z-index: 40;
}
.rw-topbar-inner {
  max-width: none;
  margin: 0 auto;
  padding: 0 2rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.rw-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.9375rem;
  color: var(--rw-ink-muted);
}
.rw-bc-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--rw-ink-muted);
  cursor: pointer;
  font-size: inherit;
  transition: color 0.15s;
}
.rw-bc-link:hover { color: var(--rw-ink-strong); }
.rw-bc-sep { width: 1rem; height: 1rem; flex: 0 0 1rem; opacity: .5; }
.rw-bc-cur { color: var(--rw-ink-strong); font-weight: 500; }
.rw-topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.rw-save-state {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--rw-ink-muted);
}
.rw-save-dot {
  width: 0.4375rem;
  height: 0.4375rem;
  border-radius: 50%;
  background: var(--rw-sage-500);
  flex: 0 0 0.4375rem;
}
.rw-close-btn {
  width: 2.25rem; height: 2.25rem;
  border-radius: 0.5rem;
  display: grid; place-items: center;
  background: none; border: none;
  color: var(--rw-ink-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.rw-close-btn:hover { background: var(--rw-paper-soft); color: var(--rw-ink-strong); }
.rw-close-btn svg { width: 1.125rem; height: 1.125rem; }
.rw-clear-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  height: 2.25rem; padding: 0 0.75rem;
  border-radius: 0.5rem;
  background: none;
  border: 1px solid var(--rw-line);
  color: var(--rw-ink-muted);
  font-size: 0.8125rem; font-weight: 500; font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.rw-clear-btn:hover {
  background: var(--rw-rose-50, #F8E2D7);
  color: var(--rw-rose-700, #6B2519);
  border-color: var(--rw-rose-100, #EDCABE);
}
.rw-clear-btn svg { width: 1rem; height: 1rem; }
@media (max-width: 720px) {
  .rw-clear-btn { padding: 0 0.5rem; }
  .rw-clear-btn span, .rw-clear-btn { font-size: 0.75rem; }
}
.rw-scroll { flex: 1 1 auto; overflow-y: auto; }
.rw-content {
  max-width: none;
  margin: 0 auto;
  padding: 1.5rem 2rem 2rem;
}
.rw-page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.rw-ph-text { min-width: 0; flex: 1 1 20rem; }
.rw-ph-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--rw-sage-700);
  font-weight: 600;
  margin-bottom: 0.4375rem;
}
.rw-ph-eyebrow svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; }
.rw-ph-title {
  font-family: var(--rw-serif);
  font-size: 1.875rem;
  line-height: 1.15;
  font-weight: 500;
  letter-spacing: -0.02em;
  color: var(--rw-ink-strong);
  margin-bottom: 0.375rem;
}
.rw-ph-sub {
  font-size: 1rem;
  color: var(--rw-ink-muted);
  max-width: 42rem;
  line-height: 1.55;
}
.rw-ph-actions { display: inline-flex; gap: 0.5rem; flex-wrap: wrap; }
.rw-stepper {
  background: var(--rw-paper);
  border: 1px solid var(--rw-line);
  border-radius: var(--rw-radius-lg);
  box-shadow: var(--rw-shadow-sm);
  padding: 1.125rem 1.25rem;
  margin-bottom: 1.25rem;
  position: sticky;
  top: 0;
  z-index: 35;
}
.rw-stepper-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 0.25rem;
  align-items: start;
  margin: 0; padding: 0;
}
/* Финишный узел «дороги» — линия из 3-го шага ведёт к галочке завершения */
.rw-step-finish {
  display: grid;
  grid-template-rows: auto auto;
  gap: 0.5rem;
  padding: 0.5rem 0.25rem;
}
.rw-finish-line {
  display: flex;
  align-items: center;
  height: 1.75rem;
}
.rw-finish-flag {
  width: 1.75rem; height: 1.75rem;
  border-radius: 50%;
  display: grid; place-items: center;
  flex: 0 0 1.75rem;
  background: var(--rw-paper-soft);
  color: var(--rw-ink-subtle);
  border: 1px dashed var(--rw-line-strong);
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.rw-finish-flag svg { width: 0.9375rem; height: 0.9375rem; }
.rw-finish-flag.is-reached {
  background: var(--rw-sage-500);
  color: #fff;
  border-style: solid;
  border-color: var(--rw-sage-500);
  box-shadow: 0 0 0 0.1875rem var(--rw-sage-50);
}
.rw-finish-cap {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rw-ink-muted);
  text-align: left;
  padding-left: 0.125rem;
  white-space: nowrap;
  transition: color 0.2s;
}
.rw-finish-cap.is-reached { color: var(--rw-sage-700); }
.rw-step-btn {
  display: grid;
  grid-template-rows: auto auto;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  border-radius: 0.625rem;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}
.rw-step-btn:hover:not(.is-current) { background: var(--rw-paper-soft); }
.rw-step-line {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}
.rw-step-num {
  width: 1.75rem; height: 1.75rem;
  border-radius: 50%;
  display: grid; place-items: center;
  font-size: 0.8125rem; font-weight: 600;
  background: var(--rw-paper-soft);
  color: var(--rw-ink-subtle);
  border: 1px solid var(--rw-line);
  flex: 0 0 1.75rem;
  transition: background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.rw-step-num svg { width: 0.9375rem; height: 0.9375rem; }
.rw-step-bar {
  height: 0.25rem;
  background: var(--rw-line-strong);
  border-radius: 999px;
  flex: 1;
}
.rw-step-btn.is-done .rw-step-num {
  background: var(--rw-sage-500); color: #fff; border-color: var(--rw-sage-500);
}
.rw-step-btn.is-current .rw-step-num {
  background: var(--rw-sage-900); color: #F4F8EC; border-color: var(--rw-sage-900);
  box-shadow: 0 0 0 0.1875rem var(--rw-sage-50);
}
.rw-step-info { padding-left: 0.125rem; }
.rw-step-label {
  font-size: 0.9375rem; font-weight: 500;
  color: var(--rw-ink);
  letter-spacing: -0.005em;
  line-height: 1.25;
}
.rw-step-meta {
  font-size: 0.8125rem; color: var(--rw-ink-muted); margin-top: 0.125rem;
  display: inline-flex; align-items: center; gap: 0.25rem;
}
.rw-step-check { width: 0.8125rem; height: 0.8125rem; flex: 0 0 0.8125rem; color: var(--rw-sage-500); }
.rw-step-progress {
  height: 0.25rem;
  background: var(--rw-line-soft);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 0.4375rem;
  max-width: 12rem;
}
.rw-step-progress-fill {
  height: 100%;
  background: var(--rw-amber-500);
  border-radius: 999px;
  transition: width 0.35s cubic-bezier(0.2,0.7,0.2,1), background 0.2s;
}
.rw-step-progress-fill.is-full { background: var(--rw-sage-500); }
.rw-step-btn.is-done .rw-step-label   { color: var(--rw-ink-strong); }
.rw-step-btn.is-done .rw-step-meta    { color: var(--rw-sage-700); }
.rw-step-btn.is-current .rw-step-label { color: var(--rw-ink-strong); font-weight: 600; }
.rw-step-btn.is-current .rw-step-meta  { color: var(--rw-sage-700); font-weight: 500; }
.rw-stepper-mobile { display: none; padding: 0.25rem 0 0; font-size: 0.875rem; color: var(--rw-ink-muted); }
.rw-smp-label { font-weight: 600; color: var(--rw-ink-strong); }
.rw-smp-bar {
  height: 0.25rem; background: var(--rw-line-soft);
  border-radius: 999px; overflow: hidden; margin-top: 0.5rem;
}
.rw-smp-fill { height: 100%; background: var(--rw-sage-500); border-radius: 999px; transition: width 0.3s; }
.rw-panel { animation: rwPanelIn 0.35s cubic-bezier(0.2,0.7,0.2,1); }
@keyframes rwPanelIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
.rw-card {
  background: var(--rw-paper);
  border: 1px solid var(--rw-line);
  border-radius: var(--rw-radius-lg);
  box-shadow: var(--rw-shadow-sm);
  overflow: hidden;
}
.rw-card-head {
  padding: 1.125rem 1.5rem 0.875rem;
  border-bottom: 1px solid var(--rw-line-soft);
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}
.rw-ch-icon {
  width: 2.25rem; height: 2.25rem;
  border-radius: 0.625rem;
  display: grid; place-items: center;
  background: var(--rw-sage-50); color: var(--rw-sage-700);
  flex: 0 0 2.25rem;
}
.rw-ch-icon svg { width: 1.125rem; height: 1.125rem; }
.rw-ch-blue  { background: var(--rw-blue-50);  color: var(--rw-blue-700);  }
.rw-ch-plum  { background: var(--rw-plum-50);  color: var(--rw-plum-700);  }
.rw-ch-amber { background: var(--rw-amber-50); color: var(--rw-amber-700); }
.rw-ch-title {
  font-family: var(--rw-serif);
  font-size: 1.3125rem; font-weight: 500;
  letter-spacing: -0.015em;
  color: var(--rw-ink-strong);
  line-height: 1.2; margin-bottom: 0.25rem;
}
.rw-ch-sub { font-size: 0.9375rem; color: var(--rw-ink-muted); }
.rw-card-body { padding: 1.25rem 1.5rem 1.5rem; }
.rw-fg {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem 1.125rem;
}
.rw-f { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
.rw-c12 { grid-column: span 12; }
.rw-c8  { grid-column: span 8;  }
.rw-c6  { grid-column: span 6;  }
.rw-c4  { grid-column: span 4;  }
.rw-c3  { grid-column: span 3;  }
.rw-label {
  font-size: 0.9375rem; font-weight: 500;
  color: var(--rw-ink-strong); letter-spacing: -0.005em;
  display: inline-flex; align-items: center; gap: 0.3125rem; line-height: 1.35;
}
.rw-label-amber { color: var(--rw-amber-700); }
.rw-label-amber svg { color: var(--rw-amber-500); }
.rw-req { color: var(--rw-rose-500); font-weight: 600; }
.rw-opt {
  font-size: 0.75rem; color: var(--rw-ink-muted); font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.05em; margin-left: 0.1875rem;
}
.rw-field-help { font-size: 0.8125rem; color: var(--rw-ink-muted); line-height: 1.4; }
.rw-input,
.rw-select,
.rw-f textarea {
  width: 100%;
  padding: 0.6875rem 0.875rem;
  min-height: 2.75rem;
  background: var(--rw-paper);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-sm);
  font-size: 1rem;
  color: var(--rw-ink-strong);
  font-family: var(--rw-sans);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.rw-f textarea { min-height: 5rem; resize: vertical; line-height: 1.5; }
.rw-input::placeholder,
.rw-f textarea::placeholder { color: var(--rw-ink-subtle); }
.rw-input:hover, .rw-select:hover, .rw-f textarea:hover { border-color: var(--rw-ink-subtle); }
.rw-input:focus, .rw-select:focus, .rw-f textarea:focus {
  outline: none;
  border-color: var(--rw-sage-500);
  box-shadow: var(--rw-focus-ring);
}
.rw-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236E7368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
  padding-right: 2.25rem;
  cursor: pointer;
}
.rw-f-notes textarea {
  background: var(--rw-amber-50);
  color: #8A3A2E;
  border-color: var(--rw-amber-100);
  font-weight: 500;
}
.rw-f-notes textarea::placeholder { color: #B0533F; opacity: 0.7; font-weight: 400; }
.rw-f-notes textarea:hover { border-color: var(--rw-amber-500); }
.rw-f-notes textarea:focus { background: #FDF6E7; border-color: var(--rw-amber-500); box-shadow: 0 0 0 3px rgba(176,114,35,.22); }
.rw-f-notes .rw-field-help { color: var(--rw-amber-700); }
.rw-divider {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.875rem; align-items: center;
  margin: 1.5rem 0 1rem;
}
.rw-divider:first-child { margin-top: 0; }
.rw-dv-label {
  font-size: 0.8125rem; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--rw-sage-700);
  font-weight: 600; white-space: nowrap;
}
.rw-dv-line { height: 1px; background: var(--rw-line); }
.rw-seg { display: inline-flex; flex-wrap: wrap; gap: 0.4375rem; }
.rw-seg-btn {
  display: inline-flex; align-items: center; gap: 0.375rem;
  padding: 0.625rem 0.9375rem; min-height: 2.625rem;
  border-radius: var(--rw-radius-sm);
  background: var(--rw-paper); border: 1px solid var(--rw-line-strong);
  font-size: 0.9375rem; font-weight: 500; color: var(--rw-ink-muted);
  cursor: pointer; font-family: var(--rw-sans);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.rw-seg-btn:hover { background: var(--rw-paper-soft); color: var(--rw-ink); border-color: var(--rw-ink-subtle); }
.rw-seg-btn.active { background: var(--rw-sage-900); color: #F4F8EC; border-color: var(--rw-sage-900); }
.rw-singleselect { position: relative; }
.rw-ss-trigger {
  width: 100%; min-height: 2.75rem;
  padding: 0.625rem 2.25rem 0.625rem 0.875rem;
  background: var(--rw-paper);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-sm);
  font-size: 1rem; color: var(--rw-ink-strong);
  font-family: var(--rw-sans);
  text-align: left; display: flex; align-items: center;
  cursor: pointer; position: relative; line-height: 1.4;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.rw-ss-trigger:hover { border-color: var(--rw-ink-subtle); }
.rw-ss-trigger::after {
  content: '';
  position: absolute; right: 0.875rem; top: 50%;
  width: 1rem; height: 1rem; transform: translateY(-50%);
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236E7368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>") no-repeat center / contain;
  transition: transform 0.2s ease;
  pointer-events: none;
}
.rw-ss-open .rw-ss-trigger {
  border-color: var(--rw-sage-500);
  box-shadow: var(--rw-focus-ring);
}
.rw-ss-open .rw-ss-trigger::after { transform: translateY(-50%) rotate(180deg); }
.rw-ss-disabled .rw-ss-trigger {
  background: var(--rw-paper-sunken); color: var(--rw-ink-subtle);
  cursor: not-allowed; border-color: var(--rw-line);
}
.rw-ss-disabled .rw-ss-trigger:hover { border-color: var(--rw-line); }
.rw-ss-disabled .rw-ss-trigger::after {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236E7368' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' opacity='0.4'><polyline points='6 9 12 15 18 9'/></svg>");
}
.rw-ss-value {
  display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  pointer-events: none; flex: 1; min-width: 0;
}
.rw-ss-placeholder { color: var(--rw-ink-subtle); }
.rw-ss-code { font-weight: 600; color: var(--rw-sage-700); margin-right: 0.375rem; }
.rw-ss-panel {
  position: absolute; top: calc(100% + 0.375rem); left: 0; right: 0;
  z-index: 60; max-height: 20rem; overflow-y: auto;
  background: var(--rw-paper); border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-md); box-shadow: var(--rw-shadow-lg); padding: 0.375rem;
}
.rw-ss-opt {
  display: flex; align-items: flex-start; gap: 0.625rem;
  padding: 0.625rem 0.75rem; border-radius: var(--rw-radius-sm);
  cursor: pointer; transition: background 0.12s;
}
.rw-ss-opt:hover { background: var(--rw-paper-soft); }
.rw-ss-opt[aria-selected="true"] { background: var(--rw-sage-50); }
.rw-ss-opt-code {
  flex: 0 0 auto; min-width: 3.25rem;
  font-weight: 600; font-size: 0.875rem;
  color: var(--rw-sage-700); padding-top: 0.0625rem;
}
.rw-ss-opt-desc { flex: 1; font-size: 0.875rem; line-height: 1.4; color: var(--rw-ink-strong); }
.rw-ss-opt[aria-selected="true"] .rw-ss-opt-desc { font-weight: 500; }
.rw-ss-empty-note {
  display: flex; align-items: center; gap: 0.5rem; min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  background: var(--rw-paper-soft); border: 1px dashed var(--rw-line-strong);
  border-radius: var(--rw-radius-sm); font-size: 0.875rem;
  color: var(--rw-ink-muted); line-height: 1.4;
}
.rw-ss-empty-note svg { width: 1rem; height: 1rem; flex: 0 0 1rem; color: var(--rw-ink-subtle); }
.rw-multiselect { position: relative; }
.rw-ms-trigger {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.4375rem 2.5rem 0.4375rem 0.875rem;
  background: var(--rw-paper);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-sm);
  font-size: 1rem;
  color: var(--rw-ink-strong);
  font-family: var(--rw-sans);
  text-align: left;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3125rem;
  box-sizing: border-box;
}
.rw-ms-trigger:hover { border-color: var(--rw-ink-subtle); }
.rw-ms-open .rw-ms-trigger {
  border-color: var(--rw-sage-500);
  box-shadow: var(--rw-focus-ring);
}
.rw-ms-placeholder { color: var(--rw-ink-subtle); font-size: 1rem; pointer-events: none; }
.rw-ms-caret {
  width: 1rem; height: 1rem;
  position: absolute;
  right: 0.75rem; top: 50%;
  transform: translateY(-50%);
  color: var(--rw-ink-subtle);
  transition: transform 0.15s;
  pointer-events: none;
  flex-shrink: 0;
}
.rw-ms-open .rw-ms-caret { transform: translateY(-50%) rotate(180deg); }
.rw-ms-chips { display: flex; flex-wrap: wrap; gap: 0.3125rem; }
.rw-ms-chip {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.1875rem 0.3125rem 0.1875rem 0.5rem;
  background: var(--rw-sage-50);
  border: 1px solid var(--rw-sage-100);
  border-radius: 999px;
  font-size: 0.8125rem; font-weight: 500;
  color: var(--rw-sage-700); white-space: nowrap;
}
.rw-ms-chip-x {
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--rw-sage-500);
  padding: 0.0625rem; border-radius: 50%;
  transition: color 0.12s;
}
.rw-ms-chip-x svg { width: 0.625rem; height: 0.625rem; }
.rw-ms-chip-x:hover { color: var(--rw-rose-500); }
.rw-ms-panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0; right: 0;
  background: var(--rw-paper);
  border: 1px solid var(--rw-line);
  border-radius: var(--rw-radius-md);
  box-shadow: var(--rw-shadow-lg);
  z-index: 60;
  max-height: 16rem;
  overflow-y: auto;
  padding: 0.375rem;
}
.rw-ms-opt {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border-radius: var(--rw-radius-sm);
  cursor: pointer;
  transition: background 0.12s;
}
.rw-ms-opt:hover { background: var(--rw-paper-soft); }
.rw-ms-opt.is-selected { background: var(--rw-sage-50); }
.rw-ms-opt-check {
  width: 1.125rem; height: 1.125rem;
  flex: 0 0 1.125rem;
  border: 1.5px solid var(--rw-line-strong);
  border-radius: 0.25rem;
  display: grid; place-items: center;
  transition: background 0.1s, border-color 0.1s;
  margin-top: 0.125rem;
}
.rw-ms-opt.is-selected .rw-ms-opt-check {
  background: var(--rw-sage-500); border-color: var(--rw-sage-500);
}
.rw-ms-opt-check svg { width: 0.6875rem; height: 0.6875rem; color: white; }
.rw-ms-opt-label {
  flex: 1; min-width: 0;
  font-size: 0.875rem; color: var(--rw-ink-strong);
  line-height: 1.4;
}
.rw-ms-opt.is-selected .rw-ms-opt-label { font-weight: 500; }
.rw-ms-opt-code {
  font-size: 0.8125rem; color: var(--rw-ink-muted);
  margin-left: 0.25rem; white-space: nowrap;
}
.rw-switch-row {
  display: flex; align-items: flex-start; gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--rw-paper-soft);
  border: 1px solid var(--rw-line-soft);
  border-radius: var(--rw-radius-md);
  cursor: pointer;
}
.rw-sr-text { flex: 1; min-width: 0; }
.rw-sr-title { font-size: 0.9375rem; font-weight: 600; color: var(--rw-ink-strong); }
.rw-sr-sub { font-size: 0.8125rem; color: var(--rw-ink-muted); margin-top: 0.1875rem; line-height: 1.45; }
.rw-switch {
  position: relative; display: inline-block;
  width: 2.75rem; height: 1.625rem; flex: 0 0 2.75rem; margin-top: 0.125rem;
}
.rw-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.rw-slider {
  position: absolute; cursor: pointer; inset: 0;
  background: var(--rw-line-strong); border-radius: 999px;
  transition: background 0.18s;
}
.rw-slider::before {
  content: ''; position: absolute;
  width: 1.25rem; height: 1.25rem;
  left: 0.1875rem; bottom: 0.1875rem;
  background: var(--rw-paper); border-radius: 50%;
  transition: transform 0.18s; box-shadow: var(--rw-shadow-sm);
}
.rw-switch input:checked + .rw-slider { background: var(--rw-sage-500); }
.rw-switch input:checked + .rw-slider::before { transform: translateX(1.125rem); }
.rw-switch input:disabled + .rw-slider { cursor: not-allowed; opacity: 0.55; }
.rw-switch-row.is-locked { cursor: not-allowed; }
.rw-switch-row.is-locked .rw-slider { cursor: not-allowed; }
.rw-sr-lock {
  display: flex; align-items: flex-start; gap: 0.4rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem; font-weight: 500; line-height: 1.4;
  color: var(--rw-amber-700);
}
.rw-sr-lock svg { width: 0.95rem; height: 0.95rem; flex: 0 0 auto; margin-top: 0.06rem; color: var(--rw-amber-500); }
.rw-subsection {
  margin-top: 1.75rem; padding-top: 1.5rem;
  border-top: 1px solid var(--rw-line-soft);
}
.rw-sub-first { margin-top: 0; padding-top: 0; border-top: none; }
.rw-ssh {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.875rem; align-items: center;
  margin-bottom: 1rem;
}
.rw-ssh-step {
  width: 2rem; height: 2rem; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--rw-sage-900); color: #F4F8EC;
  font-size: 0.875rem; font-weight: 600; flex: 0 0 2rem;
}
.rw-ssh-title { font-size: 1rem; font-weight: 600; color: var(--rw-ink-strong); }
.rw-ssh-sub { font-size: 0.8125rem; color: var(--rw-ink-muted); margin-top: 0.125rem; line-height: 1.4; }
.rw-ssh-meta {
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-size: 0.8125rem; color: var(--rw-ink-muted);
  background: var(--rw-paper-soft); border: 1px solid var(--rw-line-soft);
  border-radius: 999px; padding: 0.3125rem 0.75rem;
  white-space: nowrap;
}
.rw-ssh-meta svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; }
.rw-req-dot {
  display: inline-block; width: 0.4375rem; height: 0.4375rem;
  background: var(--rw-rose-500); border-radius: 50%;
  vertical-align: middle; margin: 0 1px;
}
.rw-uploads-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
.rw-utile {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.875rem; align-items: center;
  padding: 1rem 1.125rem;
  background: var(--rw-paper);
  border: 2px dashed var(--rw-line-strong);
  border-radius: 0.875rem;
  cursor: pointer; position: relative;
  transition: background 0.15s, border-color 0.15s;
}
.rw-utile:hover { background: var(--rw-paper-soft); border-color: var(--rw-sage-500); }
.rw-utile-done { border-style: solid; border-color: var(--rw-sage-100); background: var(--rw-sage-50); }
.rw-utile-req::after {
  content: ''; position: absolute; top: 0.5rem; right: 0.5rem;
  width: 0.4375rem; height: 0.4375rem;
  background: var(--rw-rose-500); border-radius: 50%;
}
.rw-ut-icon {
  width: 2.5rem; height: 2.5rem; border-radius: 0.5rem;
  display: grid; place-items: center;
  background: var(--rw-paper-soft); color: var(--rw-ink-muted);
  flex: 0 0 2.5rem;
}
.rw-utile-done .rw-ut-icon { background: var(--rw-sage-100); color: var(--rw-sage-700); }
.rw-ut-icon :deep(svg) { width: 1.125rem; height: 1.125rem; }
.rw-ut-body { min-width: 0; }
.rw-ut-title { font-size: 0.9375rem; font-weight: 600; color: var(--rw-ink-strong); line-height: 1.3; margin-bottom: 0.1875rem; }
.rw-ut-meta  { font-size: 0.8125rem; color: var(--rw-ink-muted); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rw-utile-done .rw-ut-meta { color: var(--rw-sage-700); }
.rw-ut-action {
  width: 2.25rem; height: 2.25rem; border-radius: 0.5rem;
  display: grid; place-items: center;
  background: var(--rw-paper-soft); color: var(--rw-ink-muted);
  flex: 0 0 2.25rem; transition: background 0.15s, color 0.15s;
}
.rw-utile:hover .rw-ut-action { background: var(--rw-sage-100); color: var(--rw-sage-700); }
.rw-utile-done .rw-ut-action { background: var(--rw-sage-50); color: var(--rw-sage-700); }
.rw-ut-action svg { width: 1rem; height: 1rem; }
.rw-utile input[type="file"] {
  position: absolute; inset: 0; width: 100%; height: 100%;
  opacity: 0; cursor: pointer; font-size: 0;
}
.rw-gen-row {
  display: flex; align-items: center; gap: 0.875rem;
  padding: 1rem 1.125rem; margin-bottom: 1rem;
  background: var(--rw-blue-50); border: 1px solid var(--rw-blue-100);
  border-radius: 0.875rem;
}
.rw-gen-icon {
  width: 2.5rem; height: 2.5rem; border-radius: 0.625rem;
  background: var(--rw-blue-100); color: var(--rw-blue-700);
  display: grid; place-items: center; flex: 0 0 2.5rem;
}
.rw-gen-icon svg { width: 1.25rem; height: 1.25rem; }
.rw-gen-body { flex: 1; min-width: 0; }
.rw-gen-title { font-size: 0.9375rem; font-weight: 600; color: var(--rw-blue-700); line-height: 1.3; }
.rw-gen-sub { font-size: 0.8125rem; color: var(--rw-blue-700); opacity: .85; margin-top: 0.125rem; }
.rw-gen-docs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.875rem; }
.rw-gen-doc {
  display: grid; grid-template-rows: auto 1fr auto; gap: 0.5rem;
  padding: 1rem; background: var(--rw-paper);
  border: 1px solid var(--rw-line); border-radius: 0.875rem; min-height: 9rem;
  transition: border-color 0.15s, background 0.15s;
}
.rw-gd-ready { border-color: var(--rw-sage-100); background: var(--rw-sage-50); }
.rw-gd-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
.rw-gd-num  { font-size: 0.75rem; font-weight: 600; color: var(--rw-ink-subtle); letter-spacing: 0.05em; text-transform: uppercase; }
.rw-gd-badge {
  font-size: 0.75rem; font-weight: 500; color: var(--rw-ink-muted);
  padding: 0.1875rem 0.5rem; background: var(--rw-paper-soft); border-radius: 999px;
}
.rw-gd-ready .rw-gd-badge { background: var(--rw-sage-100); color: var(--rw-sage-700); }
.rw-gd-title { font-size: 0.9375rem; font-weight: 600; color: var(--rw-ink-strong); line-height: 1.3; }
.rw-gd-sub   { font-size: 0.8125rem; color: var(--rw-ink-muted); line-height: 1.4; }
.rw-gd-actions { display: flex; gap: 0.4375rem; flex-wrap: wrap; align-items: center; margin-top: 0.25rem; }
.rw-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4375rem;
  padding: 0.6875rem 1.125rem; min-height: 2.75rem;
  border-radius: var(--rw-radius-sm); font-size: 0.9375rem; font-weight: 500;
  border: 1px solid transparent; cursor: pointer; white-space: nowrap;
  font-family: var(--rw-sans);
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.rw-btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.rw-btn-primary { background: var(--rw-sage-900); color: #F4F8EC; border-color: var(--rw-sage-900); }
.rw-btn-primary:hover:not(:disabled) { background: var(--rw-sage-800); border-color: var(--rw-sage-800); }
.rw-btn-secondary { background: var(--rw-paper); color: var(--rw-ink); border-color: var(--rw-line-strong); }
.rw-btn-secondary:hover:not(:disabled) { background: var(--rw-paper-soft); border-color: var(--rw-ink-muted); }
.rw-btn-ghost { color: var(--rw-ink-muted); background: none; border-color: transparent; }
.rw-btn-ghost:hover { background: var(--rw-paper-soft); color: var(--rw-ink); }
.rw-btn-sm { padding: 0.4375rem 0.75rem; min-height: 2.125rem; font-size: 0.875rem; }
.rw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.rw-savebar {
  flex: 0 0 auto;
  background: var(--rw-paper);
  border-top: 1px solid var(--rw-line);
  box-shadow: 0 -4px 12px rgba(30,47,30,.04);
}
.rw-sb-inner {
  max-width: none; margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex; align-items: center; gap: 1rem;
  flex-wrap: wrap;
}
.rw-sb-info {
  flex: 1; min-width: 0;
  font-size: 0.875rem; color: var(--rw-ink-muted);
  display: flex; flex-wrap: wrap; align-items: baseline;
  gap: 0.125rem 0.4375rem;
}
.rw-sb-info strong { color: var(--rw-ink-strong); font-weight: 600; white-space: nowrap; }
.rw-sb-sep { color: var(--rw-ink-subtle); }
.rw-sb-count { white-space: nowrap; }
.rw-sb-progress {
  display: flex; align-items: center; gap: 0.625rem;
  font-size: 0.875rem; color: var(--rw-ink-muted);
}
.rw-sbp-track {
  width: 8rem; height: 0.375rem;
  background: var(--rw-line-soft); border-radius: 999px; overflow: hidden;
}
.rw-sbp-fill { height: 100%; background: var(--rw-amber-500); border-radius: 999px; transition: width 0.35s cubic-bezier(0.2,0.7,0.2,1), background 0.25s; }
.rw-sbp-fill.is-full { background: var(--rw-sage-500); }
.rw-sbp-pct { font-variant-numeric: tabular-nums; min-width: 2.5rem; text-align: right; }
.rw-sb-actions { display: inline-flex; gap: 0.5rem; }
@media (max-width: 56rem) {
  .rw-topbar-inner,
  .rw-content,
  .rw-sb-inner { padding-left: 1.25rem; padding-right: 1.25rem; }
  .rw-stepper { margin-left: 0; margin-right: 0; }
  .rw-c4 { grid-column: span 6; }
  .rw-c3 { grid-column: span 6; }
  .rw-gen-docs { grid-template-columns: 1fr; }
}
@media (max-width: 40rem) {
  .rw-overlay { padding: 0; }
  .rw-modal { max-width: none; max-height: 100vh; height: 100%; border-radius: 0; border: none; }
  .rw-stepper-list { display: none; }
  .rw-stepper-mobile { display: block; }
  .rw-topbar-inner,
  .rw-content,
  .rw-sb-inner { padding-left: 1rem; padding-right: 1rem; }
  .rw-card-head, .rw-card-body { padding-left: 1rem; padding-right: 1rem; }
  .rw-c4, .rw-c6, .rw-c8, .rw-c3 { grid-column: span 12; }
  .rw-uploads-grid { grid-template-columns: 1fr; }
  .rw-sb-progress { display: none; }
  .rw-sb-info { font-size: 0.8125rem; }
  .rw-btn { padding: 0.625rem 0.875rem; font-size: 0.875rem; }
  .rw-ph-title { font-size: 1.5rem; }
  .rw-save-state { display: none; }
}
</style>
