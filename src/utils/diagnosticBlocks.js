
export const PROFILE_LABELS = {
  psy: 'Психолог',
  log: 'Логопед',
  afk: 'АФК',
  izo: 'ИЗО',
  vocal: 'Вокал',
  instrument: 'Инструменты',
  theatre: 'Театр'
};

export const SCALE = [
  { value: 0, short: '0', label: 'Не проявляется' },
  { value: 1, short: '1', label: 'С помощью / редко' },
  { value: 2, short: '2', label: 'Частично' },
  { value: 3, short: '3', label: 'Чаще самостоятельно' },
  { value: 4, short: '4', label: 'Сформировано' }
];

export const DIAGNOSTIC_BLOCKS = {
  psy: {
    label: 'Психологическая диагностика',
    accent: '#5B6EA8',
    criteria: [
      { id: 'contact', label: 'Установление контакта' },
      { id: 'emotion', label: 'Эмоциональная регуляция' },
      { id: 'attention', label: 'Устойчивость внимания' },
      { id: 'memory', label: 'Память' },
      { id: 'motivation', label: 'Мотивация к деятельности' },
      { id: 'selfreg', label: 'Самоконтроль поведения' }
    ]
  },
  log: {
    label: 'Логопедическая диагностика',
    accent: '#3F6E3F',
    criteria: [
      { id: 'comprehension', label: 'Понимание обращённой речи' },
      { id: 'articulation', label: 'Звукопроизношение' },
      { id: 'phonemic', label: 'Фонематический слух' },
      { id: 'vocabulary', label: 'Словарный запас' },
      { id: 'grammar', label: 'Грамматический строй' },
      { id: 'coherent', label: 'Связная речь' }
    ]
  },
  afk: {
    label: 'Адаптивная физкультура (АФК)',
    accent: '#B97718',
    criteria: [
      { id: 'grossmotor', label: 'Крупная моторика' },
      { id: 'coordination', label: 'Координация движений' },
      { id: 'balance', label: 'Равновесие' },
      { id: 'endurance', label: 'Выносливость' },
      { id: 'finemotor', label: 'Мелкая моторика' }
    ]
  },
  izo: {
    label: 'Изобразительная деятельность (ИЗО)',
    accent: '#B0533F',
    criteria: [
      { id: 'graphic', label: 'Графические навыки' },
      { id: 'color', label: 'Восприятие цвета и формы' },
      { id: 'instruction', label: 'Следование инструкции' },
      { id: 'accuracy', label: 'Аккуратность' },
      { id: 'creativity', label: 'Творческая активность' }
    ]
  },
  theatre: {
    label: 'Театральная деятельность',
    accent: '#8A5A9E',
    criteria: [
      { id: 'expressiveness', label: 'Выразительность' },
      { id: 'roleplay', label: 'Включение в роль' },
      { id: 'interaction', label: 'Взаимодействие в группе' },
      { id: 'memory', label: 'Запоминание текста и ролей' },
      { id: 'imagination', label: 'Воображение' }
    ]
  },
  vocal: {
    label: 'Вокальная диагностика',
    accent: '#C08A2E',
    criteria: [
      { id: 'intonation', label: 'Интонирование' },
      { id: 'rhythm', label: 'Чувство ритма' },
      { id: 'breathing', label: 'Певческое дыхание' },
      { id: 'range', label: 'Диапазон голоса' },
      { id: 'engagement', label: 'Вовлечённость' }
    ]
  },
  instrument: {
    label: 'Инструментальное музицирование',
    accent: '#2F6E6A',
    criteria: [
      { id: 'rhythm', label: 'Чувство ритма' },
      { id: 'technique', label: 'Техника игры' },
      { id: 'coordination', label: 'Координация рук' },
      { id: 'attention', label: 'Слуховое внимание' },
      { id: 'engagement', label: 'Вовлечённость' }
    ]
  }
};

export function getBlock(profileKey) {
  return DIAGNOSTIC_BLOCKS[profileKey] || null;
}

export function profileLabel(profileKey) {
  return PROFILE_LABELS[profileKey] || 'Специалист';
}

export function emptyResults(profileKey) {
  const block = getBlock(profileKey);
  const criteria = {};
  if (block) block.criteria.forEach(c => { criteria[c.id] = null; });
  return { criteria, comment: '' };
}

export function averageScore(results) {
  if (!results || !results.criteria) return null;
  const vals = Object.values(results.criteria).filter(v => v !== null && v !== undefined && v !== '');
  if (!vals.length) return null;
  const sum = vals.reduce((a, v) => a + Number(v), 0);
  return Math.round((sum / vals.length) * 10) / 10;
}
