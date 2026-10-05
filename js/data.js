/* ==========================================================
   MoodMix — данные: места, вопросы теста, типы настроения.
   Чтобы добавить место или вопрос — просто допишите объект.
   ========================================================== */

// Подписи тегов (ключ — тег места, значение — текст на карточке)
const TAG_LABELS = {
  quiet: 'тишина', nature: 'природа', calm: 'спокойно', social: 'компания',
  loud: 'шумно', active: 'актив', culture: 'культура',
};

/* Место:
   hours      — [час открытия, час закрытия], 24 = полночь
   eventTime  — время события (необязательно), напр. концерт
   colors     — градиент заглушки вместо фото (можно заменить на photos)  */
const PLACES = [
  { id: 1,  name: 'Ботанический сад',       emoji: '🌿', colors: '#2e7d32,#a5d6a7', location: 'Левый берег, ул. Достык',        distanceKm: 7, rating: 4.8, paid: false, hours: [8, 21],  tags: ['quiet', 'nature'],            description: 'Тихие аллеи, оранжереи и зелень — идеально, чтобы выдохнуть.' },
  { id: 2,  name: 'Сквер на окраине Есиля', emoji: '🌳', colors: '#388e3c,#c5e1a5', location: 'Правый берег, пойма Есиля',      distanceKm: 9, rating: 4.5, paid: false, hours: [0, 24],  tags: ['quiet', 'nature'],            description: 'Спокойный сквер вдали от центра для прогулки в одиночестве.' },
  { id: 3,  name: 'Набережная Ишима',       emoji: '🌅', colors: '#ef6c00,#1a237e', location: 'Набережная Ишима',               distanceKm: 2, rating: 4.7, paid: false, hours: [0, 24],  tags: ['calm', 'nature', 'social'],   description: 'Закат, свежий воздух и неспешные прогулки у воды.' },
  { id: 4,  name: 'Центральный парк',       emoji: '🎡', colors: '#00897b,#ffcc80', location: 'Центральный парк, ул. Сарыарка', distanceKm: 3, rating: 4.4, paid: false, hours: [0, 24],  tags: ['calm', 'active', 'social'],   description: 'Парк с аттракционами, велодорожками и кофейнями.' },
  { id: 5,  name: 'Хан Шатыр',              emoji: '🛍️', colors: '#5c6bc0,#ffd54f', location: 'пр. Тауелсиздик, 47',            distanceKm: 6, rating: 4.6, paid: true,  hours: [10, 22], tags: ['active', 'social', 'loud'],   description: 'Огромный торговый центр: магазины, кино, пляж под куполом.' },
  { id: 6,  name: 'Концерт в Barys Arena',  emoji: '🎸', colors: '#6a1b9a,#ff7043', location: 'пр. Тауелсиздик, 36',            distanceKm: 5, rating: 4.9, paid: true,  hours: [18, 23], eventTime: '19:00', tags: ['loud', 'social', 'active'],  description: 'Живой концерт: драйв, свет и тысячи людей рядом.' },
  { id: 7,  name: 'Бар «Neon Sunset»',      emoji: '🍹', colors: '#ad1457,#ff8a65', location: 'ул. Кунаева, 12',                distanceKm: 2, rating: 4.3, paid: true,  hours: [17, 24], tags: ['loud', 'social'],             description: 'Коктейли, диджей и компания — для заряженного настроения.' },
  { id: 8,  name: 'Сходка собак',           emoji: '🐕', colors: '#8d6e63,#ffe082', location: 'Парк «Жастар»',                  distanceKm: 4, rating: 4.6, paid: false, hours: [17, 19], eventTime: '17:00', tags: ['social', 'active', 'nature'], description: 'Дружеская встреча собачников и их питомцев.' },
  { id: 9,  name: 'Astana Opera',           emoji: '🎭', colors: '#4527a0,#ffd54f', location: 'пр. Кунаева, 1',                 distanceKm: 3, rating: 4.9, paid: true,  hours: [10, 21], eventTime: '19:00', tags: ['calm', 'culture', 'quiet'],  description: 'Оперы и балет в одном из красивейших театров страны.' },
  { id: 10, name: 'Кофейня «Тихий угол»',   emoji: '☕', colors: '#6d4c41,#ffe0b2', location: 'ул. Желтоксан, 5',               distanceKm: 1, rating: 4.5, paid: true,  hours: [8, 23],  tags: ['quiet', 'calm', 'culture'],   description: 'Уютная кофейня с книгами и мягким светом.' },
];

// Вопросы теста по чертам характера (ответ 1–5). Всего 25 = 5 × 5.
const QUESTIONS_BY_TRAIT = {
  energy:    ['Сегодня я полон сил', 'Мне нужно движение и активность', 'Я легко «загораюсь» от новых идей', 'Я люблю действовать спонтанно', 'Мне хочется чего-то яркого'],
  social:    ['Мне нравится общаться с незнакомыми людьми', 'Я чувствую себя комфортно в шумной компании', 'Сегодня хочется поговорить с кем-то', 'Я люблю быть в центре событий', 'Мне легко знакомиться'],
  openness:  ['Я люблю пробовать новое', 'Меня привлекают необычные места', 'Я открыт к неожиданным приглашениям', 'Мне интересна культура и искусство', 'Я легко меняю планы'],
  calm:      ['Мне комфортно в тишине', 'Я люблю прогулки в одиночестве', 'Шум быстро меня утомляет', 'Мне нужно побыть наедине с мыслями', 'Я хочу расслабиться и ничего не делать'],
  wellbeing: ['Моё настроение сейчас хорошее', 'Я хорошо выспался', 'Я не чувствую стресса', 'Я доволен прошедшей неделей', 'Я с оптимизмом смотрю вперёд'],
};
const QUESTIONS = Object.entries(QUESTIONS_BY_TRAIT)
  .flatMap(([trait, list]) => list.map(text => ({ trait, text })));

// Типы настроения. Проверяются сверху вниз — срабатывает первый подходящий.
// s — средние баллы по чертам; lively = (energy + social) / 2
const MOODS = [
  { label: '⚡ Заряженный',      tags: ['loud', 'social', 'active'],  match: s => s.lively >= 3.6 && s.lively > s.calm },
  { label: '🌿 Умиротворённый',  tags: ['quiet', 'nature', 'calm'],   match: s => s.calm >= 3.6 && s.calm >= s.lively },
  { label: '🎨 Любопытный',      tags: ['culture', 'calm', 'social'], match: s => s.openness >= 3.6 },
  { label: '🌅 Спокойный',       tags: ['calm', 'nature', 'social'],  match: () => true },   // запасной вариант
];
