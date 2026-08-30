<template>
  <div class="rw-overlay">
   <div class="rw-modal" role="dialog" aria-modal="true" aria-label="Добавление реабилитанта">

    <div v-if="openingServerDraft" class="rw-loading" role="status" aria-live="polite">
      <span class="rw-loading-spin" aria-hidden="true"></span>
      <span>Открываем черновик…</span>
    </div>

    <div class="rw-topbar">
      <div class="rw-topbar-inner">
        <nav class="rw-breadcrumb" aria-label="Навигация">
          <button class="rw-bc-link" @click="$emit('close')">Реабилитанты</button>
          <svg class="rw-bc-sep" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
          <span class="rw-bc-cur">Добавление реабилитанта</span>
        </nav>
        <div class="rw-topbar-right">
          <span
            v-if="draftState" class="rw-save-state"
            :class="{ 'is-saving': draftState === 'saving' }"
            role="status" aria-live="polite"
          >
            <span class="rw-save-dot"></span>
            {{ draftState === 'saving' ? 'Сохранение…' : 'Черновик сохранён' }}
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

    <div class="rw-scroll" ref="scrollBox">
      <div class="rw-content">

        <div class="rw-page-head">
          <div class="rw-ph-text">
            <div class="rw-ph-eyebrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Новая карточка
            </div>
            <h1 class="rw-ph-title">Добавление реабилитанта</h1>
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

              <div v-if="familyStatusOptions.length" class="rw-divider"><span class="rw-dv-label">Статус семьи</span><span class="rw-dv-line"></span></div>
              <div v-if="familyStatusOptions.length" class="rw-fg">
                <div class="rw-f rw-c12">

                  <div v-if="famLookup" class="rw-dup rw-dup-warn rw-fs-note">
                    <span class="rw-dup-ico" aria-hidden="true">i</span>
                    <div class="rw-dup-text">
                      <div class="rw-dup-title">
                        {{ famLookup.applied ? 'Статус подставлен из карточки семьи' : 'У этой семьи уже отмечен статус' }}
                      </div>
                      <div class="rw-dup-sub">
                        <template v-if="famLookup.repName">{{ famLookup.repName }} — уже в центре. </template>
                        <template v-if="famLookup.applied">Статус семьи один на всех детей, поэтому правка здесь изменит его и в других карточках.</template>
                        <template v-else>Отмечено: {{ famLookup.codes.map(familyStatusName).filter(Boolean).join(', ') }}.
                          <button type="button" class="rw-fs-apply" @click="applyFamilyLookup">Подставить</button>
                        </template>
                      </div>
                    </div>
                  </div>

                  <fieldset v-for="grp in familyStatusGroups" :key="grp.key" class="rw-fs-group">
                    <legend class="rw-label rw-fs-legend">
                      {{ grp.label }} <span class="rw-opt">{{ grp.note }}</span>
                    </legend>
                    <div class="rw-seg">
                      <button v-for="opt in grp.items" :key="opt.code"
                        type="button" class="rw-seg-btn"
                        :class="{ active: isFamilyStatusOn(opt.code) }"
                        :title="opt.hint || ''"
                        @click="toggleFamilyStatus(opt)">{{ opt.name }}</button>
                    </div>
                  </fieldset>
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
                </div>
              </div>

              <div v-if="dupNames.length" class="rw-dup rw-dup-warn">
                <span class="rw-dup-ico" aria-hidden="true">!</span>
                <div class="rw-dup-text">
                  <b class="rw-dup-title">Похоже, такой реабилитант уже есть</b>
                  <span class="rw-dup-sub">Совпали фамилия, имя и дата рождения. Если это полный тёзка — продолжайте заполнять карточку.</span>
                  <ul class="rw-dup-list">
                    <li v-for="p in dupNames" :key="p.id">
                      {{ dupFio(p) }}, {{ dupDate(p.birthDate) }}
                      <span class="rw-dup-meta">{{ p.groupName ? p.groupName + ' · ' : '' }}{{ dupStatusLabel(p.status) }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Медицинские сведения и реабилитационная группа</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c12">
                  <fieldset style="border:none;padding:0;margin:0">
                    <legend class="rw-label" style="margin-bottom:0.5rem">Группа инвалидности <span class="rw-req">*</span></legend>
                    <div class="rw-seg" id="r-invalidity">
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
                      id="r-crg-trigger"
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
                  <span v-if="crgAgeHint" class="rw-field-help">{{ crgAgeHint }}</span>
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
                </div>
                <div class="rw-f rw-c12">
                  <label class="rw-label" for="r-diagnosis">Диагноз</label>
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

              <div v-if="dupDoc" class="rw-dup rw-dup-block">
                <span class="rw-dup-ico" aria-hidden="true">×</span>
                <div class="rw-dup-text">
                  <b class="rw-dup-title">Такой документ уже зарегистрирован</b>
                  <span class="rw-dup-sub">
                    {{ dupDoc.docType }} {{ dupDoc.docSeries }} {{ dupDoc.docNumber }} принадлежит реабилитанту
                    {{ dupFio(dupDoc) }}{{ dupDoc.birthDate ? ', ' + dupDate(dupDoc.birthDate) : '' }}.
                    Сохранить карточку с этим документом нельзя — проверьте серию и номер.
                  </span>
                </div>
              </div>

              <div class="rw-divider"><span class="rw-dv-label">Адрес регистрации</span><span class="rw-dv-line"></span></div>
              <div class="rw-fg">
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-reg-okrug">Округ Москвы</label>
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
                </div>
                <span class="rw-switch">
                  <input type="checkbox" v-model="f.rAddrSame" />
                  <span class="rw-slider"></span>
                </span>
              </label>
              <div v-if="!f.rAddrSame" class="rw-fg">
                <div class="rw-f rw-c4">
                  <label class="rw-label" for="r-fact-okrug">Округ Москвы</label>
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
                    :id="'tile-' + t.k"
                    class="rw-utile"
                    :class="{ 'rw-utile-req': t.req, 'rw-utile-done': uploads[t.k] }"
                  >
                    <div class="rw-ut-icon" v-html="t.icon"></div>
                    <div class="rw-ut-body">
                      <div class="rw-ut-title">{{ t.title }}</div>
                      <div class="rw-ut-meta">{{ uploads[t.k] ? uploads[t.k].name : t.meta }}</div>
                      <button
                        v-if="uploads[t.k]" type="button" class="rw-ut-view"
                        @click.prevent.stop="openPreview(uploads[t.k], t.title)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        Посмотреть
                      </button>
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
                  <button class="rw-btn rw-btn-primary" type="button" id="gen-docs-btn" @click="generateDocs">
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
                  </div>
                  <span class="rw-ssh-meta">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    {{ signedCount }} из 3 загружено
                  </span>
                </div>
                <div class="rw-uploads-grid">
                  <label
                    v-for="t in signedTiles" :key="t.k"
                    :id="'tile-' + t.k"
                    class="rw-utile rw-utile-req"
                    :class="{ 'rw-utile-done': signedUploads[t.k] }"
                  >
                    <div class="rw-ut-icon" v-html="t.icon"></div>
                    <div class="rw-ut-body">
                      <div class="rw-ut-title">{{ t.title }}</div>
                      <div class="rw-ut-meta">{{ signedUploads[t.k] ? signedUploads[t.k].name : t.meta }}</div>
                      <button
                        v-if="signedUploads[t.k]" type="button" class="rw-ut-view"
                        @click.prevent.stop="openPreview(signedUploads[t.k], t.title)"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                        Посмотреть
                      </button>
                    </div>
                    <span class="rw-ut-action">
                      <svg v-if="!signedUploads[t.k]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" :aria-label="t.title" @change="onSignedFile(t.k, $event)" />
                  </label>
                </div>
              </div>

              <label class="rw-switch-row" id="consent-row" :class="{ 'is-locked': !packageComplete }" style="margin-top:1.5rem">
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
        <div v-if="missingFields.length" class="rw-sb-missing">
          <button class="rw-btn rw-mf-btn" type="button" @click="missingOpen = !missingOpen"
            :aria-expanded="missingOpen" aria-haspopup="dialog"
            :title="'Показать список незаполненных полей (' + missingFields.length + ')'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Не заполнено
            <span class="rw-mf-badge">{{ missingFields.length }}</span>
            <svg class="rw-mf-caret" :class="{ 'is-open': missingOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 15l-6-6-6 6"/></svg>
          </button>

          <div v-if="missingOpen" class="rw-mf-panel" role="dialog" aria-label="Незаполненные поля">
            <div class="rw-mf-head">
              <div class="rw-mf-htext">
                <div class="rw-mf-title">Осталось заполнить: {{ missingFields.length }}</div>
                <div class="rw-mf-sub">Нажмите на пункт — откроется нужный этап и поле подсветится</div>
              </div>
              <button class="rw-mf-close" type="button" @click="missingOpen = false" aria-label="Закрыть">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="rw-mf-body">
              <div v-for="grp in missingByStep" :key="grp.step" class="rw-mf-group">
                <div class="rw-mf-step">
                  <span class="rw-mf-step-num">{{ grp.step }}</span>
                  {{ grp.label }}
                  <span class="rw-mf-step-cnt">{{ grp.items.length }}</span>
                </div>
                <button v-for="(it, i) in grp.items" :key="grp.step + '-' + i"
                  class="rw-mf-item" type="button" @click="gotoField(it)">
                  <span class="rw-mf-dot" aria-hidden="true"></span>
                  <span class="rw-mf-itext">
                    <span class="rw-mf-name">{{ it.l }}</span>
                    <span class="rw-mf-group-name">{{ it.g }}</span>
                  </span>
                  <span class="rw-mf-go">
                    Перейти
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                  </span>
                </button>
              </div>
            </div>
            <div class="rw-mf-foot">
              <button class="rw-btn rw-btn-primary rw-btn-sm" type="button" @click="gotoFirstMissing">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                Перейти к первому незаполненному
              </button>
            </div>
          </div>
        </div>
        <div v-else class="rw-sb-ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          Все обязательные поля заполнены
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
            <span v-if="saving">Сохранение…</span>
            <template v-else>
              <span class="rw-sb-save-long">Сохранить и создать карточку</span>
              <span class="rw-sb-save-short">Сохранить</span>
            </template>
          </button>
        </div>
      </div>
    </div>

   </div>

   <div v-if="preview" class="rw-pv" @click.self="closePreview">
     <div class="rw-pv-box" role="dialog" aria-modal="true" aria-label="Просмотр документа">
       <div class="rw-pv-head">
         <div class="rw-pv-titles">
           <div class="rw-pv-title">{{ preview.title }}</div>
           <div class="rw-pv-sub">{{ preview.name }} · {{ preview.size }}</div>
         </div>
         <a class="rw-pv-btn" :href="preview.url" :download="preview.name">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
           Скачать
         </a>
         <button class="rw-pv-btn rw-pv-close" type="button" aria-label="Закрыть просмотр" @click="closePreview">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
         </button>
       </div>
       <div class="rw-pv-body">
         <img v-if="preview.kind === 'image'" class="rw-pv-img" :src="preview.url" :alt="preview.title" />
         <iframe v-else-if="preview.kind === 'pdf'" class="rw-pv-frame" :src="preview.url" :title="preview.title"></iframe>
         <div v-else class="rw-pv-none">Этот формат браузер показать не умеет — скачайте файл, чтобы открыть его.</div>
       </div>
     </div>
   </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import api from '../api';
import { notifySaved } from '../utils/toast';
import {
  DRAFT_KEY, DRAFT_FILES_DB, DRAFT_FILES_STORE,
  draftPersonFields, summarizeDraft, touchDraftSavedAt, forgetDraftSavedAt,
  readDraftServerId, rememberDraftServerId, forgetDraftServerId
} from '../utils/recipientDraft';
import { useScrollLock } from '../utils/scrollLock';

useScrollLock();


const props = defineProps({
  groupsList: { type: Array, default: () => [] },
  draftId: { type: Number, default: null }
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

const scrollBox = ref(null);
const stepScroll = new Map();
let skipScrollRestore = false;

watch(step, (next, prev) => {
  const box = scrollBox.value;
  if (!box) return;
  stepScroll.set(prev, box.scrollTop);
  if (skipScrollRestore) {
    skipScrollRestore = false;
    return;
  }
  nextTick(() => {
    if (scrollBox.value) scrollBox.value.scrollTop = stepScroll.get(next) || 0;
  });
});

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
  lrFamilyStatus: [],

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

const f = ref(makeEmptyForm());

const familyStatusOptions = ref([]);

const loadFamilyStatuses = async () => {
  try {
    const { data } = await api.get('/lists/family-statuses');
    familyStatusOptions.value = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('справочник статусов семьи не загрузился:', err);
    familyStatusOptions.value = [];
  }
};

const familyStatusGroups = computed(() => {
  const buckets = new Map();
  for (const opt of familyStatusOptions.value) {
    const key = opt.groupKey || '__free__';
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(opt);
  }
  const titles = {
    composition: { label: 'Состав семьи', note: 'одно из' },
    __free__:    { label: 'Дополнительно', note: 'сколько угодно' }
  };
  return [...buckets.entries()].map(([key, items]) => ({
    key,
    label: titles[key]?.label || 'Прочее',
    note: titles[key]?.note || (key === '__free__' ? 'сколько угодно' : 'одно из'),
    items
  }));
});

const isFamilyStatusOn = (code) => (f.value.lrFamilyStatus || []).includes(code);

const familyStatusName = (code) =>
  familyStatusOptions.value.find((o) => o.code === code)?.name || '';

const toggleFamilyStatus = (opt) => {
  if (!Array.isArray(f.value.lrFamilyStatus)) f.value.lrFamilyStatus = [];
  const list = f.value.lrFamilyStatus;
  const i = list.indexOf(opt.code);
  if (i >= 0) { list.splice(i, 1); return; }
  if (opt.groupKey) {
    const rivals = new Set(
      familyStatusOptions.value.filter((o) => o.groupKey === opt.groupKey).map((o) => o.code)
    );
    for (let j = list.length - 1; j >= 0; j--) if (rivals.has(list[j])) list.splice(j, 1);
  }
  list.push(opt.code);
};

const famLookup = ref(null);
let famTimer = null;
let famSeq = 0;

const runFamilyLookup = async () => {
  const series = String(f.value.lrPassSeries || '').trim();
  const number = String(f.value.lrPassNum || '').trim();
  if (series.length !== 4 || number.length !== 6) { famLookup.value = null; return; }

  const seq = ++famSeq;
  try {
    const { data } = await api.post('/recipients/family-status-lookup', {
      passportSeries: series, passportNumber: number
    });
    if (seq !== famSeq) return;
    if (!data?.found || !data.statuses?.length) { famLookup.value = null; return; }

    famLookup.value = { repName: data.repName || '', codes: data.statuses };
    if (!(f.value.lrFamilyStatus || []).length) {
      f.value.lrFamilyStatus = [...data.statuses];
      famLookup.value.applied = true;
    }
  } catch (err) {
    console.error('не удалось свериться со статусом семьи:', err);
    if (seq === famSeq) famLookup.value = null;
  }
};

watch(
  () => [f.value.lrPassSeries, f.value.lrPassNum].join('|'),
  () => {
    if (famTimer) clearTimeout(famTimer);
    famTimer = setTimeout(runFamilyLookup, 500);
  }
);

const applyFamilyLookup = () => {
  if (!famLookup.value?.codes?.length) return;
  f.value.lrFamilyStatus = [...famLookup.value.codes];
  famLookup.value.applied = true;
};

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
  if (crgAge.value === null) return '';
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

const requiredFields = computed(() => {
  const v = f.value;

  const [step1, step2] = draftPersonFields(v);

  const step3 = [
    ...tiles.filter(t => t.req).map(t => (
      { g: 'Сканы готовых документов', l: t.title, ok: !!uploads.value[t.k], a: '#tile-' + t.k }
    )),
    { g: 'Документы на подпись', l: 'Сформировать пакет из 3 документов', ok: docsGenerated.value, a: '#gen-docs-btn' },
    ...signedTiles.map(t => (
      { g: 'Подписанные документы', l: t.title, ok: !!signedUploads.value[t.k], a: '#tile-' + t.k }
    )),
    { g: 'Завершение', l: 'Подтверждаю комплектность пакета документов', ok: v.consentConfirmed, a: '#consent-row' },
  ];

  return [step1, step2, step3];
});

const requiredChecks = computed(() => requiredFields.value.map((list) => list.map((x) => x.ok)));

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

const allComplete = computed(() => stepProgress.value.every((s) => s.complete));

const packageComplete = computed(() => {
  const [s1, s2, s3] = requiredChecks.value;
  return s1.every(Boolean) && s2.every(Boolean) && s3.slice(0, -1).every(Boolean);
});

watch(packageComplete, (ok) => {
  if (!ok && f.value.consentConfirmed) f.value.consentConfirmed = false;
}, { immediate: true });

const missingOpen = ref(false);

const missingFields = computed(() => {
  const out = [];
  requiredFields.value.forEach((list, i) => {
    list.forEach((x) => { if (!x.ok) out.push({ ...x, step: i + 1 }); });
  });
  return out;
});

const missingByStep = computed(() =>
  steps
    .map((s, i) => ({ step: i + 1, label: s.label, items: missingFields.value.filter((x) => x.step === i + 1) }))
    .filter((s) => s.items.length > 0)
);

let flashEl = null;
let flashTimer = null;

const flashField = (el) => {
  if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
  if (flashEl) flashEl.classList.remove('rw-flash');
  flashEl = el;
  el.classList.remove('rw-flash');
  void el.offsetWidth;
  el.classList.add('rw-flash');
  flashTimer = setTimeout(() => {
    el.classList.remove('rw-flash');
    if (flashEl === el) flashEl = null;
    flashTimer = null;
  }, 1800);
};

const gotoField = async (item) => {
  missingOpen.value = false;
  if (step.value !== item.step) {
    skipScrollRestore = true;
    step.value = item.step;
  }
  await nextTick();
  const el = document.querySelector(item.a);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusTarget = /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)
    ? el
    : el.querySelector('input:not([type="file"]), select, textarea, button');
  if (focusTarget && !focusTarget.disabled) {
    try { focusTarget.focus({ preventScroll: true }); } catch (e) { focusTarget.focus(); }
  }
  flashField(el);
};

const gotoFirstMissing = () => {
  if (missingFields.value.length) gotoField(missingFields.value[0]);
};

const draftFileKey = (kind, k) => `${kind}:${k}`;

const openDraftFilesDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DRAFT_FILES_DB, 1);
  req.onupgradeneeded = () => {
    if (!req.result.objectStoreNames.contains(DRAFT_FILES_STORE)) {
      req.result.createObjectStore(DRAFT_FILES_STORE);
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

const withDraftFiles = async (mode, fn) => {
  const db = await openDraftFilesDb();
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DRAFT_FILES_STORE, mode);
      fn(tx.objectStore(DRAFT_FILES_STORE));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

const readDraftFiles = async () => {
  const db = await openDraftFilesDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(DRAFT_FILES_STORE, 'readonly');
      const store = tx.objectStore(DRAFT_FILES_STORE);
      const keys = store.getAllKeys();
      const values = store.getAll();
      tx.oncomplete = () => resolve({ keys: keys.result, values: values.result });
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
};

const dropDraftFiles = async () => {
  try { await withDraftFiles('readwrite', (s) => s.clear()); } catch (e) { console.error(e); }
};

let draftFileWarned = false;
const rememberDraftFile = async (kind, key, file) => {
  try {
    await withDraftFiles('readwrite', (s) => s.put(file, draftFileKey(kind, key)));
    notifySaved(`Скан «${file.name}» сохранён в черновик`, { key: 'draft-scan' });
  } catch (e) {
    console.error(e);
    if (!draftFileWarned) {
      draftFileWarned = true;
      alert(
        'Файл прикреплён, но сохранить его в черновик не удалось — в браузере не хватает места.\n\n' +
        'Карточку можно заполнять дальше, но если закрыть мастер, приложенные сканы придётся выбрать заново.'
      );
    }
  }
};

const restoreDraftFiles = async () => {
  try {
    const { keys, values } = await readDraftFiles();
    const main = {};
    const signed = {};
    keys.forEach((rawKey, i) => {
      const file = values[i];
      if (!(file instanceof Blob)) return;
      const str = String(rawKey);
      const sep = str.indexOf(':');
      if (sep < 0) return;
      const kind = str.slice(0, sep);
      const k = str.slice(sep + 1);
      if (kind === 'signed') signed[k] = file;
      else if (kind === 'main') main[k] = file;
    });
    uploads.value = { ...main, ...uploads.value };
    signedUploads.value = { ...signed, ...signedUploads.value };
  } catch (e) {
    console.error(e);
  }
};

const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object') {
      f.value = { ...makeEmptyForm(), ...saved };
      draftState.value = 'saved';
    }
  } catch (e) {  }
};
const draftState = ref('');
let draftStateTimer = null;
let skipNextDraftSave = false;

const saveDraft = () => {
  if (skipNextDraftSave) { skipNextDraftSave = false; return; }
  let ok = false;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(f.value));
    ok = true;
  } catch (e) {
    console.error(e);
  }
  if (!ok) return;
  touchDraftSavedAt();
  scheduleServerSync();
  draftState.value = 'saving';
  if (draftStateTimer) clearTimeout(draftStateTimer);
  draftStateTimer = setTimeout(() => { draftState.value = 'saved'; }, 400);
};
const clearDraft = () => {
  if (!confirm('Очистить черновик? Все введённые данные и приложенные сканы будут удалены безвозвратно.')) return;
  skipNextDraftSave = true;
  f.value = makeEmptyForm();
  uploads.value = {};
  signedUploads.value = {};
  docsGenerated.value = false;
  stepScroll.clear();
  step.value = 1;
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  forgetDraftSavedAt();
  dropDraftFiles();
  dropServerDraft();
  if (draftStateTimer) clearTimeout(draftStateTimer);
  draftState.value = '';
  notifySaved('Черновик очищен');
};

const SERVER_SYNC_DELAY = 1500;

const serverDraftId = ref(readDraftServerId());
let serverSyncTimer = null;
let serverSyncBusy = false;
let serverSyncAgain = false;

const attachedFileCount = () =>
  Object.keys(uploads.value).length + Object.keys(signedUploads.value).length;

const worthSyncing = () => !!summarizeDraft(f.value, attachedFileCount());

const pushDraftToServer = async () => {
  if (serverSyncBusy) { serverSyncAgain = true; return; }
  serverSyncBusy = true;
  try {
    const payload = JSON.parse(JSON.stringify(f.value));
    if (serverDraftId.value) {
      await api.put(`/recipients/drafts/${serverDraftId.value}`, { payload });
    } else {
      const { data } = await api.post('/recipients/drafts', { payload });
      if (data?.id) { serverDraftId.value = data.id; rememberDraftServerId(data.id); }
    }
  } catch (err) {
    console.error('черновик не ушёл на сервер:', err);
  } finally {
    serverSyncBusy = false;
    if (serverSyncAgain) { serverSyncAgain = false; pushDraftToServer(); }
  }
};

const scheduleServerSync = () => {
  if (!worthSyncing()) return;
  if (serverSyncTimer) clearTimeout(serverSyncTimer);
  serverSyncTimer = setTimeout(pushDraftToServer, SERVER_SYNC_DELAY);
};

const ensureServerDraft = async () => {
  if (serverDraftId.value) return serverDraftId.value;
  if (serverSyncTimer) { clearTimeout(serverSyncTimer); serverSyncTimer = null; }
  await pushDraftToServer();
  return serverDraftId.value;
};

const dropServerDraft = async () => {
  const id = serverDraftId.value;
  serverDraftId.value = null;
  forgetDraftServerId();
  if (serverSyncTimer) { clearTimeout(serverSyncTimer); serverSyncTimer = null; }
  if (!id) return;
  try { await api.delete(`/recipients/drafts/${id}`); }
  catch (err) { console.error('черновик не удалён с сервера:', err); }
};

const SIGNED_KEYS = new Set(signedTiles.map((t) => t.k));

const uploadDraftScan = async (docKey, file) => {
  try {
    const id = await ensureServerDraft();
    if (!id) return;
    await api.post(`/recipients/drafts/${id}/scans`, {
      docKey,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      base64: await fileToBase64(file)
    });
  } catch (err) {
    console.error('скан не ушёл в черновик на сервере:', err);
  }
};

const syncLocalScans = async () => {
  const local = [...Object.entries(uploads.value), ...Object.entries(signedUploads.value)]
    .filter(([, file]) => file instanceof Blob);
  if (!local.length) return;
  const id = await ensureServerDraft();
  if (!id) return;
  let known = new Set();
  try {
    const { data } = await api.get(`/recipients/drafts/${id}`);
    known = new Set((data?.scans || []).map((s) => s.docKey));
  } catch (err) {
    console.error('не удалось свериться со сканами черновика:', err);
    return;
  }
  for (const [docKey, file] of local) {
    if (known.has(docKey)) continue;
    await uploadDraftScan(docKey, file);
  }
};

const draftScanToFile = async (id, scan) => {
  try {
    const res = await api.get(`/recipients/drafts/${id}/scans/${scan.id}/file`, { responseType: 'blob' });
    return new File([res.data], scan.originalName || 'скан',
      { type: scan.mimeType || res.data.type || 'application/octet-stream' });
  } catch (err) {
    console.error('скан черновика не скачался:', err);
    return null;
  }
};

const openingServerDraft = ref(false);

const openServerDraft = async (id) => {
  openingServerDraft.value = true;
  try {
    const { data } = await api.get(`/recipients/drafts/${id}`);
    serverDraftId.value = id;
    rememberDraftServerId(id);
    await dropDraftFiles();
    uploads.value = {};
    signedUploads.value = {};
    f.value = { ...makeEmptyForm(), ...(data.payload || {}) };
    draftState.value = 'saved';
    const main = {};
    const signed = {};
    for (const s of data.scans || []) {
      const file = await draftScanToFile(id, s);
      if (!file) continue;
      const kind = SIGNED_KEYS.has(s.docKey) ? 'signed' : 'main';
      (kind === 'signed' ? signed : main)[s.docKey] = file;
      try { await withDraftFiles('readwrite', (store) => store.put(file, draftFileKey(kind, s.docKey))); }
      catch (e) { console.error(e); }
    }
    uploads.value = main;
    signedUploads.value = signed;
  } catch (err) {
    console.error(err);
    alert('Не удалось открыть черновик: ' + (err?.response?.data?.message || err?.message || 'неизвестная ошибка'));
    emit('close');
  } finally {
    openingServerDraft.value = false;
  }
};

let savedToDb = false;

const draftKept = () => {
  if (savedToDb) return;
  const hasFiles =
    Object.keys(uploads.value).length > 0 || Object.keys(signedUploads.value).length > 0;
  if (!draftState.value && !hasFiles) return;
  notifySaved('Черновик сохранён — при следующем открытии всё будет на месте');
};

if (props.draftId) {
  openServerDraft(props.draftId);
} else {
  loadDraft();
  restoreDraftFiles().then(() => {
    scheduleServerSync();
    syncLocalScans();
  });
}
watch(f, saveDraft, { deep: true });

const onlyDigits = (s, max) => s.replace(/\D/g, '').slice(0, max);

function maskName(v) {
  const s = v
    .replace(/[^А-Яа-яЁё\- ]/g, '')
    .replace(/^[\s-]+/, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/-{2,}/g, '-');
  return s.replace(/(^|[\s-])([а-яё])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

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

function maskSnils(v) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  let out = d.slice(0, 3);
  if (d.length > 3) out += '-' + d.slice(3, 6);
  if (d.length > 6) out += '-' + d.slice(6, 9);
  if (d.length > 9) out += ' ' + d.slice(9, 11);
  return out;
}

function maskDeptCode(v) {
  const d = v.replace(/\D/g, '').slice(0, 6);
  return d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d;
}

function maskBirthSeries(v) {
  return v.toUpperCase().replace(/[^IVXLCА-ЯЁ\- ]/g, '').slice(0, 12);
}

function maskText(v, max) {
  return v.replace(/^\s+/, '').replace(/\s{2,}/g, ' ').slice(0, max);
}

function onMask(field, e, fn) {
  const masked = fn(e.target.value);
  f.value[field] = masked;
  if (e.target.value !== masked) e.target.value = masked;
}

function onDocSeries(e) {
  const fn = f.value.rDocType === 'birth' ? maskBirthSeries : (v) => onlyDigits(v, 4);
  onMask('rDocSeries', e, fn);
}

const onFile = (key, e) => {
  const file = e.target.files[0];
  if (!file) return;
  uploads.value = { ...uploads.value, [key]: file };
  rememberDraftFile('main', key, file);
  uploadDraftScan(key, file);
};
const onSignedFile = (key, e) => {
  const file = e.target.files[0];
  if (!file) return;
  signedUploads.value = { ...signedUploads.value, [key]: file };
  rememberDraftFile('signed', key, file);
  uploadDraftScan(key, file);
};

const preview = ref(null);

const fileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

const fileKind = (file) => {
  const type = file.type || '';
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
};

const closePreview = () => {
  if (!preview.value) return;
  URL.revokeObjectURL(preview.value.url);
  preview.value = null;
};

const openPreview = (file, title) => {
  if (!file) return;
  closePreview();
  preview.value = {
    url: URL.createObjectURL(file),
    name: file.name || 'файл',
    size: fileSize(file.size || 0),
    kind: fileKind(file),
    title
  };
};

const downloadingDoc = ref('');

const generateDocs = () => {
  if (!f.value.rLast || !f.value.rFirst) {
    alert('Заполните ФИО реабилитанта (шаг 2), чтобы сформировать документы');
    return;
  }
  docsGenerated.value = true;
};

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

const dupNames = ref([]);
const dupDoc = ref(null);
const dupChecking = ref(false);

let dupTimer = null;
let dupSeq = 0;

const dupPayload = () => ({
  firstName:  f.value.rFirst,
  middleName: f.value.rMid,
  lastName:   f.value.rLast,
  birthDate:  f.value.rBirth || null,
  docSeries:  f.value.rDocSeries,
  docNumber:  f.value.rDocNum,
});

const runDupCheck = async () => {
  const payload = dupPayload();
  const hasFio = payload.lastName.trim() && payload.firstName.trim() && payload.birthDate;
  const hasDoc = payload.docSeries.trim() && payload.docNumber.length === 6;

  if (!hasFio && !hasDoc) {
    dupNames.value = [];
    dupDoc.value = null;
    return { nameMatches: [], docMatch: null };
  }

  const seq = ++dupSeq;
  dupChecking.value = true;
  try {
    const { data } = await api.post('/recipients/check-duplicate', payload);
    if (seq !== dupSeq) return null;
    dupNames.value = data?.nameMatches || [];
    dupDoc.value = data?.docMatch || null;
    return { nameMatches: dupNames.value, docMatch: dupDoc.value };
  } catch (e) {
    console.error(e);
    if (seq === dupSeq) { dupNames.value = []; dupDoc.value = null; }
    return null;
  } finally {
    if (seq === dupSeq) dupChecking.value = false;
  }
};

watch(
  () => [f.value.rLast, f.value.rFirst, f.value.rMid, f.value.rBirth, f.value.rDocSeries, f.value.rDocNum].join(''),
  () => {
    if (dupTimer) clearTimeout(dupTimer);
    dupTimer = setTimeout(runDupCheck, 500);
  }
);

const dupFio = (p) => [p.lastName, p.firstName, p.middleName].filter(Boolean).join(' ');

const dupDate = (d) => {
  if (!d) return '';
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return `${day}.${m}.${y}`;
};

const dupStatusLabel = (s) => (
  s === 'archived' ? 'в архиве' : s === 'draft' ? 'черновик' : 'активен'
);

const save = async () => {
  if (!f.value.rLast || !f.value.rFirst) {
    alert('Заполните ФИО реабилитанта (шаг 2)');
    return;
  }
  if (!f.value.consentConfirmed) {
    alert('Нельзя сохранить карточку: сначала заполните все этапы, поля и обязательные сканы, затем включите «Подтверждаю комплектность пакета документов».');
    step.value = steps.length;
    return;
  }

  if (dupTimer) { clearTimeout(dupTimer); dupTimer = null; }
  const dup = await runDupCheck();

  if (dup?.docMatch) {
    alert(
      `Нельзя сохранить: документ ${f.value.rDocSeries} ${f.value.rDocNum} уже зарегистрирован за реабилитантом ` +
      `${dupFio(dup.docMatch)}. Один документ не может принадлежать двум людям — проверьте серию и номер.`
    );
    gotoField({ step: 2, a: '#rd-ser' });
    return;
  }

  if (dup?.nameMatches?.length) {
    const list = dup.nameMatches.map((p) => `• ${dupFio(p)}, ${dupDate(p.birthDate)}`).join('\n');
    const ok = confirm(
      `В системе уже есть реабилитант с такими ФИО и датой рождения:\n\n${list}\n\n` +
      'Если это другой человек (полный тёзка), продолжайте. Сохранить карточку?'
    );
    if (!ok) {
      gotoField({ step: 2, a: '#r-last' });
      return;
    }
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
      familyStatuses:  f.value.lrFamilyStatus,
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
    forgetDraftSavedAt();
    await dropDraftFiles();
    await dropServerDraft();
    savedToDb = true;
    draftState.value = '';
    const fio = [f.value.rLast, f.value.rFirst].filter(Boolean).join(' ').trim();
    notifySaved(fio ? `Реабилитант ${fio} сохранён` : 'Реабилитант сохранён');
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
  if (missingOpen.value  && !e.target.closest('.rw-sb-missing'))     missingOpen.value  = false;
};

const onKey = (e) => {
  if (e.key === 'Escape') {
    if (preview.value)           { closePreview(); }
    else if (missingOpen.value)  { missingOpen.value = false; }
    else if (nosologyOpen.value) { nosologyOpen.value = false; }
    else { emit('close'); }
  }
};

onMounted(() => {
  document.addEventListener('keydown', onKey);
  document.addEventListener('click', closeDropdowns);
  document.body.style.overflow = 'hidden';
  loadFamilyStatuses();
});
onUnmounted(() => {
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('click', closeDropdowns);
  document.body.style.overflow = '';
  if (dupTimer) clearTimeout(dupTimer);
  if (famTimer) clearTimeout(famTimer);
  if (draftStateTimer) clearTimeout(draftStateTimer);
  closePreview();
  draftKept();
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
  max-height: 92dvh;
  background: var(--rw-canvas);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-lg);
  box-shadow: 0 2rem 5rem rgba(15, 20, 15, .35), 0 .5rem 1.5rem rgba(15, 20, 15, .2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  animation: rwModalIn 0.32s cubic-bezier(0.2, 0.7, 0.2, 1);
}
@keyframes rwModalIn {
  from { opacity: 0; transform: translateY(1rem) scale(.985); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.rw-loading {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .875rem;
  background: var(--rw-canvas);
  font-size: .9375rem;
  color: var(--rw-ink-muted);
}
.rw-loading-spin {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid var(--rw-line-strong);
  border-top-color: var(--rw-sage-500);
  border-radius: 50%;
  animation: rwLoadingSpin .7s linear infinite;
}
@keyframes rwLoadingSpin { to { transform: rotate(360deg); } }
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
.rw-save-state.is-saving .rw-save-dot { background: var(--rw-ink-muted); }
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
.rw-btn-primary { background: var(--btn-primary-bg); color: var(--btn-primary-fg); border-color: var(--btn-primary-bg); }
.rw-btn-primary:hover:not(:disabled) { background: var(--btn-primary-bg-hover); border-color: var(--btn-primary-bg-hover); }
.rw-btn-secondary { background: var(--btn-secondary-bg); color: var(--btn-secondary-fg); border-color: var(--btn-secondary-border); }
.rw-btn-secondary:hover:not(:disabled) { background: var(--btn-secondary-bg-hover); border-color: var(--btn-secondary-border-hover); }
.rw-btn-ghost { color: var(--btn-ghost-fg); background: none; border-color: transparent; }
.rw-btn-ghost:hover { background: var(--btn-ghost-bg-hover); color: var(--btn-ghost-fg-hover); }
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
.rw-sb-save-short { display: none; }
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
  .rw-overlay { padding: 0; align-items: stretch; overflow: hidden; }
  .rw-modal {
    max-width: none;
    height: calc(100dvh - var(--kb, 0px));
    max-height: calc(100dvh - var(--kb, 0px));
    border-radius: 0; border: none;
  }
  .rw-scroll { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
  .rw-stepper-list { display: none; }
  .rw-stepper-mobile { display: block; }
  .rw-topbar-inner { height: auto; min-height: 3.5rem; padding-top: var(--safe-top, 0px); }
  .rw-sb-inner { padding-bottom: calc(0.75rem + var(--safe-bottom, 0px)); }
  .rw-topbar-inner,
  .rw-content,
  .rw-sb-inner {
    padding-left: max(1rem, var(--safe-left, 0px));
    padding-right: max(1rem, var(--safe-right, 0px));
  }
  .rw-card-head, .rw-card-body { padding-left: 1rem; padding-right: 1rem; }
  .rw-c4, .rw-c6, .rw-c8, .rw-c3 { grid-column: span 12; }
  .rw-uploads-grid { grid-template-columns: 1fr; }
  .rw-sb-progress { display: none; }
  .rw-sb-inner { gap: 0.5rem 0.625rem; }
  .rw-sb-info { flex: 1 1 100%; font-size: 0.8125rem; }
  .rw-sb-info strong { white-space: normal; overflow-wrap: anywhere; }
  .rw-sb-missing { flex: 1 1 100%; }
  .rw-sb-actions { flex: 1 1 100%; min-width: 0; justify-content: flex-end; }
  .rw-sb-actions .rw-btn { min-width: 0; white-space: normal; }
  .rw-sb-save-long { display: none; }
  .rw-sb-save-short { display: inline; }
  .rw-btn { padding: 0.625rem 0.875rem; font-size: 0.875rem; }
  .rw-ph-title { font-size: 1.5rem; }
  .rw-save-state { display: none; }
}

.rw-sb-missing { position: relative; }
.rw-mf-btn {
  background: var(--rw-amber-50);
  color: var(--rw-amber-700);
  border-color: var(--rw-amber-100);
}
.rw-mf-btn:hover { background: var(--rw-amber-100); border-color: var(--rw-amber-500); }
.rw-mf-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 1.375rem; height: 1.375rem; padding: 0 0.375rem;
  border-radius: 999px;
  background: var(--rw-amber-500); color: #FFF8EC;
  font-size: 0.8125rem; font-weight: 700; font-variant-numeric: tabular-nums;
}
.rw-mf-caret { transition: transform 0.18s; }
.rw-mf-caret.is-open { transform: rotate(180deg); }

.rw-sb-ok {
  display: inline-flex; align-items: center; gap: 0.4375rem;
  padding: 0.6875rem 1.125rem; min-height: 2.75rem;
  border-radius: var(--rw-radius-sm);
  background: var(--rw-sage-50); color: var(--rw-sage-700);
  border: 1px solid var(--rw-sage-100);
  font-size: 0.9375rem; font-weight: 500; white-space: nowrap;
}
.rw-sb-ok svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }

.rw-mf-panel {
  position: absolute;
  bottom: calc(100% + 0.625rem);
  right: 0;
  z-index: 40;
  width: 26rem; max-width: calc(100vw - 2.5rem);
  background: var(--rw-paper);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-md);
  box-shadow: var(--rw-shadow-lg);
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: rwMfIn 0.16s cubic-bezier(0.2, 0.7, 0.2, 1);
}
@keyframes rwMfIn {
  from { opacity: 0; transform: translateY(0.375rem); }
  to   { opacity: 1; transform: translateY(0); }
}
.rw-mf-head {
  display: flex; align-items: flex-start; gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--rw-amber-50);
  border-bottom: 1px solid var(--rw-line);
}
.rw-mf-htext { flex: 1; min-width: 0; }
.rw-mf-title { font-size: 0.9375rem; font-weight: 600; color: var(--rw-amber-700); }
.rw-mf-sub { margin-top: 0.1875rem; font-size: 0.8125rem; color: var(--rw-ink-muted); line-height: 1.35; }
.rw-mf-close {
  flex: 0 0 auto;
  width: 1.75rem; height: 1.75rem;
  display: inline-flex; align-items: center; justify-content: center;
  border: none; background: none; cursor: pointer;
  border-radius: var(--rw-radius-sm); color: var(--rw-ink-muted);
}
.rw-mf-close:hover { background: var(--rw-amber-100); color: var(--rw-ink-strong); }
.rw-mf-close svg { width: 0.9375rem; height: 0.9375rem; }

.rw-mf-body { overflow-y: auto; max-height: 22rem; padding: 0.5rem; }
.rw-mf-group + .rw-mf-group { margin-top: 0.5rem; }
.rw-mf-step {
  display: flex; align-items: center; gap: 0.4375rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.02em;
  text-transform: uppercase; color: var(--rw-ink-subtle);
}
.rw-mf-step-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.125rem; height: 1.125rem; border-radius: 999px;
  background: var(--rw-paper-sunken); color: var(--rw-ink-muted);
  font-size: 0.6875rem; font-weight: 700;
}
.rw-mf-step-cnt {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--rw-amber-500);
}
.rw-mf-item {
  display: flex; align-items: center; gap: 0.625rem; width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 0.625rem;
  background: none; border: 1px solid transparent;
  border-radius: var(--rw-radius-sm);
  cursor: pointer; text-align: left;
  font-family: var(--rw-sans);
  transition: background 0.14s, border-color 0.14s;
}
.rw-mf-item:hover { background: var(--rw-amber-50); border-color: var(--rw-amber-100); }
.rw-mf-item:focus-visible { outline: none; box-shadow: var(--rw-focus-ring); }
.rw-mf-dot {
  flex: 0 0 0.4375rem; width: 0.4375rem; height: 0.4375rem;
  border-radius: 999px; background: var(--rw-amber-500);
}
.rw-mf-itext { flex: 1; min-width: 0; }
.rw-mf-name {
  display: block; font-size: 0.875rem; color: var(--rw-ink-strong); font-weight: 500;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rw-mf-group-name {
  display: block; margin-top: 0.0625rem;
  font-size: 0.75rem; color: var(--rw-ink-subtle);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rw-mf-go {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 0.125rem;
  font-size: 0.75rem; font-weight: 600; color: var(--rw-sage-700);
  opacity: 0; transition: opacity 0.14s;
}
.rw-mf-go svg { width: 0.8125rem; height: 0.8125rem; }
.rw-mf-item:hover .rw-mf-go,
.rw-mf-item:focus-visible .rw-mf-go { opacity: 1; }

.rw-mf-foot {
  padding: 0.625rem 1rem;
  border-top: 1px solid var(--rw-line);
  background: var(--rw-paper-soft);
}
.rw-mf-foot .rw-btn { width: 100%; }

.rw-flash { animation: rwFlash 1.8s ease-out; }
@keyframes rwFlash {
  0%   { box-shadow: 0 0 0 0     rgba(176, 114, 35, .60); }
  16%  { box-shadow: 0 0 0 .4rem rgba(176, 114, 35, .26); }
  36%  { box-shadow: 0 0 0 0     rgba(176, 114, 35, .60); }
  52%  { box-shadow: 0 0 0 .4rem rgba(176, 114, 35, .26); }
  72%  { box-shadow: 0 0 0 0     rgba(176, 114, 35, .60); }
  100% { box-shadow: 0 0 0 .4rem rgba(176, 114, 35, 0);   }
}

@media (max-width: 40rem) {
  .rw-mf-panel { width: calc(100vw - 2rem); right: auto; left: 0; }
  .rw-mf-body { max-height: 15rem; }
  .rw-sb-ok { display: none; }
  .rw-mf-btn { width: 100%; padding: 0.625rem 0.75rem; font-size: 0.875rem; }
}

.rw-dup {
  display: flex; gap: 0.625rem; align-items: flex-start;
  margin: 0.25rem 0 1rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid;
  border-radius: var(--rw-radius-md);
}
.rw-dup-warn  { background: var(--rw-amber-50); border-color: var(--rw-amber-100); }
.rw-dup-block { background: var(--rw-rose-50);  border-color: var(--rw-rose-100); }

.rw-dup-ico {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.25rem; height: 1.25rem; margin-top: 0.0625rem;
  border-radius: 50%;
  font-size: 0.8125rem; font-weight: 700; line-height: 1;
  color: #FFFFFF;
}
.rw-dup-warn  .rw-dup-ico { background: var(--rw-amber-500); }
.rw-dup-block .rw-dup-ico { background: var(--rw-rose-500); }

.rw-dup-text { flex: 1; min-width: 0; }

.rw-dup-title { display: block; font-size: 0.875rem; font-weight: 600; }
.rw-dup-warn  .rw-dup-title { color: var(--rw-amber-700); }
.rw-dup-block .rw-dup-title { color: var(--rw-rose-700); }

.rw-dup-sub {
  display: block; margin-top: 0.1875rem;
  font-size: 0.8125rem; line-height: 1.45; color: var(--rw-ink-muted);
}

.rw-dup-list { margin: 0.5rem 0 0; padding-left: 1.125rem; }
.rw-dup-list li { font-size: 0.8125rem; line-height: 1.5; color: var(--rw-ink-strong); }

.rw-fs-note { margin-top: 0; }
.rw-fs-apply {
  padding: 0; border: none; background: none;
  font: inherit; color: var(--rw-amber-700);
  font-weight: 600; text-decoration: underline; cursor: pointer;
}
.rw-fs-apply:hover { color: var(--rw-ink-strong); }

.rw-fs-group { border: none; padding: 0; margin: 0 0 0.875rem; }
.rw-fs-group:last-of-type { margin-bottom: 0.625rem; }
.rw-fs-legend { margin-bottom: 0.5rem; padding: 0; }

.rw-dup-meta { color: var(--rw-ink-subtle); }

.rw-ut-view {
  position: relative; z-index: 2;
  margin-top: 0.4375rem;
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-family: inherit; font-size: 0.8125rem; font-weight: 600;
  color: var(--rw-sage-700);
  background: var(--rw-paper);
  border: 1px solid var(--rw-sage-100);
  border-radius: 999px;
  padding: 0.25rem 0.6875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.rw-ut-view:hover { background: var(--rw-sage-100); border-color: var(--rw-sage-500); }
.rw-ut-view svg { width: 0.875rem; height: 0.875rem; flex: 0 0 0.875rem; }

.rw-pv {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(15, 20, 15, .72);
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
  animation: rwOverlayIn 0.18s ease;
}
.rw-pv-box {
  width: 100%; max-width: 56rem; max-height: 100%;
  display: flex; flex-direction: column;
  background: var(--rw-paper);
  border-radius: var(--rw-radius-lg);
  box-shadow: 0 2rem 5rem rgba(15, 20, 15, .45);
  overflow: hidden;
}
.rw-pv-head {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1.125rem;
  border-bottom: 1px solid var(--rw-line-soft);
  background: var(--rw-paper-soft);
}
.rw-pv-titles { flex: 1 1 auto; min-width: 0; }
.rw-pv-title {
  font-size: 0.9375rem; font-weight: 600; color: var(--rw-ink-strong);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rw-pv-sub {
  font-size: 0.8125rem; color: var(--rw-ink-muted); margin-top: 0.125rem;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rw-pv-btn {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; gap: 0.375rem;
  font-family: inherit; font-size: 0.8125rem; font-weight: 600;
  color: var(--rw-ink-strong); text-decoration: none;
  background: var(--rw-paper);
  border: 1px solid var(--rw-line-strong);
  border-radius: var(--rw-radius-sm);
  padding: 0.375rem 0.6875rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.rw-pv-btn:hover { background: var(--rw-paper-soft); border-color: var(--rw-sage-500); }
.rw-pv-btn svg { width: 0.9375rem; height: 0.9375rem; flex: 0 0 0.9375rem; }
.rw-pv-close { padding: 0.375rem; }

.rw-pv-body {
  flex: 1 1 auto; min-height: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--rw-canvas);
  padding: 1rem;
  overflow: auto;
}
.rw-pv-img { max-width: 100%; max-height: 76vh; object-fit: contain; border-radius: var(--rw-radius-sm); }
.rw-pv-frame { width: 100%; height: 76vh; border: 0; border-radius: var(--rw-radius-sm); background: var(--rw-paper); }
.rw-pv-none { font-size: 0.875rem; color: var(--rw-ink-muted); text-align: center; padding: 3rem 1rem; }

@media (max-width: 900px) {
  .rw-pv { padding: 0; }
  .rw-pv-box { max-width: none; height: 100%; border-radius: 0; }
  .rw-pv-img { max-height: none; }
  .rw-pv-frame { height: 100%; }
}
@media (max-width: 768px) {
  .rw-pv-head {
    padding-top: calc(0.875rem + var(--safe-top, 0px));
    padding-left: max(1.125rem, var(--safe-left, 0px));
    padding-right: max(1.125rem, var(--safe-right, 0px));
  }
  .rw-pv-body {
    padding-bottom: calc(1rem + var(--safe-bottom, 0px));
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .rw-pv-btn { min-height: var(--tap, 2.75rem); }
  .rw-pv-close { min-width: var(--tap, 2.75rem); justify-content: center; }
}
</style>
