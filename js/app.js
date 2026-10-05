/* ==========================================================
   MoodMix — логика сервиса (требует data.js).
   Разделы: 1 Хранилище · 2 Утилиты · 3 Авторизация · 4 Тест
            5 Места · 6 Карточка места · 7 Профиль · 8 Запуск
   ========================================================== */

const $ = id => document.getElementById(id);
const appEl = $('app'), modalEl = $('modal'), navEl = $('nav');

const DEFAULT_FILTERS = { sort: 'match', distance: '', minRating: 0, price: '', time: '' };
const state = { question: 0, answers: [], filters: { ...DEFAULT_FILTERS } };

/* ---------- 1. Хранилище (localStorage) ---------- */
const DB = {
  get(key, fallback) {
    const raw = localStorage.getItem('mm_' + key);
    return raw ? JSON.parse(raw) : fallback;
  },
  set(key, value) { localStorage.setItem('mm_' + key, JSON.stringify(value)); },
};
const getUsers      = () => DB.get('users', {});
const currentUser   = () => getUsers()[DB.get('session', null)];
const saveUser      = user => DB.set('users', { ...getUsers(), [user.email]: user });
const getReviews    = () => DB.get('reviews', {});          // { placeId: [{nick, rating, text}] }
const getRecommends = () => DB.get('recommends', {});       // { placeId: [nick] }

/* ---------- 2. Утилиты ---------- */
const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const findPlace  = id => PLACES.find(p => p.id === id);
const stars      = n => '★'.repeat(n);
const parseTime  = str => { const [h, m] = str.split(':'); return +h + m / 60; };

// Час, на который смотрим: выбранный в фильтре или текущий
function targetHour() {
  if (state.filters.time) return parseTime(state.filters.time);
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}
const isOpen      = (place, hour) => hour >= place.hours[0] && hour < place.hours[1];
const hoursText   = place => `${place.hours[0]}:00–${place.hours[1]}:00`;
const statusHtml  = open => `<span class="st ${open ? 'open' : 'closed'}">${open ? 'Открыто' : 'Закрыто'}</span>`;

// Средняя оценка: стартовый рейтинг места весит как 10 отзывов
function averageRating(place) {
  const reviews = getReviews()[place.id] || [];
  const sum = reviews.reduce((acc, r) => acc + r.rating, place.rating * 10);
  return (sum / (10 + reviews.length)).toFixed(1);
}

/* ---------- 3. Навигация и авторизация ---------- */
function renderNav() {
  const user = currentUser();
  navEl.innerHTML = user ? `
    <button class="btn sm ghost" onclick="showPlaces()">Места</button>
    <button class="btn sm ghost" onclick="showProfile()">👤 ${escapeHtml(user.nick)}</button>
    <button class="btn sm ghost" onclick="logout()">Выйти</button>` : '';
}

function start() {
  renderNav();
  const user = currentUser();
  if (!user) return showAuth('register');
  user.tags ? showPlaces() : showTest();
}

function logout() { DB.set('session', null); start(); }

function showAuth(mode) {
  const isReg = mode === 'register';
  appEl.innerHTML = `
    <div class="box glass">
      <h2>${isReg ? 'Регистрация' : 'Вход'}</h2>
      <label>Почта</label><input id="email" type="email">
      ${isReg ? '<label>Отображаемый никнейм</label><input id="nick">' : ''}
      <label>Пароль</label><input id="password" type="password">
      <p id="authError" class="closed"></p>
      <button class="btn" style="width:100%" onclick="submitAuth('${mode}')">${isReg ? 'Зарегистрироваться' : 'Войти'}</button>
      <p style="margin-top:14px;font-size:13px;cursor:pointer" onclick="showAuth('${isReg ? 'login' : 'register'}')">
        ${isReg ? 'Уже есть аккаунт? Войти' : 'Впервые здесь? Регистрация'}</p>
    </div>`;
}

function submitAuth(mode) {
  const email = $('email').value.trim().toLowerCase();
  const password = $('password').value;
  const fail = text => { $('authError').textContent = text; };

  if (!/^\S+@\S+\.\S+$/.test(email)) return fail('Введите корректную почту');
  if (password.length < 6)           return fail('Пароль — минимум 6 символов');
  const hash = btoa(unescape(encodeURIComponent(password)));   // учебная «защита», не для продакшена
  const existing = getUsers()[email];

  if (mode === 'register') {
    const nick = $('nick').value.trim();
    if (existing) return fail('Такая почта уже зарегистрирована');
    if (!nick)    return fail('Введите никнейм');
    saveUser({ email, nick, password: hash, mood: null, tags: null, history: [], favorites: [], likes: [] });
  } else if (!existing || existing.password !== hash) {
    return fail('Неверная почта или пароль');
  }
  DB.set('session', email);
  start();
}

/* ---------- 4. Тест настроения ---------- */
const ANSWER_LABELS = ['Нет', 'Скорее нет', 'Средне', 'Скорее да', 'Да'];

function showTest() {
  const i = state.question;
  if (i >= QUESTIONS.length) return finishTest();
  appEl.innerHTML = `
    <div class="box glass">
      <div class="bar"><i style="width:${i / QUESTIONS.length * 100}%"></i></div>
      <p style="margin:14px 0 4px;opacity:.7">Вопрос ${i + 1} из ${QUESTIONS.length}</p>
      <h2 style="text-align:left;font-size:22px">${QUESTIONS[i].text}</h2>
      <div class="opts">${ANSWER_LABELS.map((label, k) =>
        `<button onclick="answer(${k + 1})">${label}</button>`).join('')}</div>
    </div>`;
}

function answer(value) { state.answers[state.question++] = value; showTest(); }

// Средний балл по каждой черте + lively
function calcScores(answers) {
  const sums = {}, counts = {};
  QUESTIONS.forEach(({ trait }, i) => {
    sums[trait] = (sums[trait] || 0) + answers[i];
    counts[trait] = (counts[trait] || 0) + 1;
  });
  const scores = {};
  for (const trait in sums) scores[trait] = sums[trait] / counts[trait];
  scores.lively = (scores.energy + scores.social) / 2;
  return scores;
}

function finishTest() {
  const mood = MOODS.find(m => m.match(calcScores(state.answers)));
  const user = currentUser();
  user.mood = mood.label;
  user.tags = mood.tags;
  saveUser(user);
  state.question = 0; state.answers = [];
  renderNav();
  appEl.innerHTML = `
    <div class="box glass" style="text-align:center">
      <h2>Ваше настроение</h2>
      <p style="font-size:30px;margin:12px">${mood.label}</p>
      <button class="btn" onclick="showPlaces()">Смотреть места</button>
    </div>`;
}

function retakeTest() { state.question = 0; state.answers = []; showTest(); }

/* ---------- 5. Страница мест ---------- */
const DISTANCE_RANGES = {            // фильтр расстояния: [от, до) км
  near: [0, 3], mid: [3, 6], far: [6, Infinity],
};

function setFilter(key, value) { state.filters[key] = value; showPlaces(); }

function getVisiblePlaces(user, hour) {
  const f = state.filters;
  const matchScore = p => p.tags.filter(t => user.tags.includes(t)).length;

  const list = PLACES.filter(p => {
    if (f.price && (f.price === 'free') === p.paid) return false;
    if (p.rating < f.minRating) return false;
    if (f.distance) {
      const [from, to] = DISTANCE_RANGES[f.distance];
      if (p.distanceKm < from || p.distanceKm >= to) return false;
    }
    // События (концерты и т.п.) показываем, только если они около выбранного времени
    if (f.time && p.eventTime && Math.abs(parseTime(p.eventTime) - hour) > 1.5) return false;
    return true;
  });

  const sorters = {
    match: (a, b) => matchScore(b) - matchScore(a) || b.rating - a.rating,
    near:  (a, b) => a.distanceKm - b.distanceKm,
    far:   (a, b) => b.distanceKm - a.distanceKm,
  };
  return list.sort(sorters[f.sort]);
}

const option = (value, label, current) =>
  `<option value="${value}" ${String(current) === String(value) ? 'selected' : ''}>${label}</option>`;

function renderFilters() {
  const f = state.filters;
  return `<div class="filters glass">
    <select onchange="setFilter('sort', this.value)">
      ${option('match', 'По настроению', f.sort)}${option('near', 'Ближайшие', f.sort)}${option('far', 'Дальше всего', f.sort)}
    </select>
    <select onchange="setFilter('distance', this.value)">
      ${option('', 'Любое расстояние', f.distance)}${option('near', 'Рядом (до 3 км)', f.distance)}
      ${option('mid', '3–6 км', f.distance)}${option('far', 'Далеко (6+ км)', f.distance)}
    </select>
    <select onchange="setFilter('minRating', +this.value)">
      ${[0, 4, 4.5, 4.8].map(r => option(r, r ? 'Оценка от ' + r : 'Любая оценка', f.minRating)).join('')}
    </select>
    <select onchange="setFilter('price', this.value)">
      ${option('', 'Платно и бесплатно', f.price)}${option('free', 'Бесплатно', f.price)}${option('paid', 'Платно', f.price)}
    </select>
    <input type="time" value="${f.time}" onchange="setFilter('time', this.value)" title="Время визита">
  </div>`;
}

function recommendText(placeId) {
  const names = getRecommends()[placeId] || [];
  if (!names.length) return '';
  return `<br><i>${names.length > 1 ? names.slice(0, 2).join(', ') + ' рекомендуют' : 'Рекомендовано ' + names[0]}</i>`;
}

function renderPlaceCard(place, user, hour) {
  const fits = place.tags.filter(t => user.tags.includes(t)).length >= 2;
  return `
    <div class="card glass" onclick="openPlace(${place.id})">
      <div class="ph" style="background:linear-gradient(135deg,${place.colors})">${place.emoji}</div>
      <div class="in">
        <b>${place.name}</b> ${fits ? '<span class="tag">✨ ваш вайб</span>' : ''}<br>
        ⭐ ${averageRating(place)} · ${place.distanceKm} км · ${place.paid ? 'платно' : 'бесплатно'}<br>
        ${place.eventTime ? '🎟 ' + place.eventTime + ' · ' : ''}${hoursText(place)} ${statusHtml(isOpen(place, hour))}
        ${recommendText(place.id)}
      </div>
    </div>`;
}

function showPlaces() {
  renderNav();
  closeModal();
  const user = currentUser(), hour = targetHour();
  const cards = getVisiblePlaces(user, hour).map(p => renderPlaceCard(p, user, hour)).join('');
  appEl.innerHTML = `
    <h2>Ваше настроение: ${user.mood}</h2>
    ${renderFilters()}
    <div class="grid">${cards || '<p>Ничего не найдено — смягчите фильтры.</p>'}</div>`;
}

/* ---------- 6. Окно места ---------- */
let slideIndex = 0;

function closeModal() { modalEl.className = 'modal'; }
modalEl.onclick = e => { if (e.target === modalEl) closeModal(); };

function openPlace(id) {
  const place = findPlace(id), user = currentUser();
  const reviews = getReviews()[id] || [];
  const recommended = (getRecommends()[id] || []).includes(user.nick);
  const btn = (cls, action, text) => `<button class="btn sm ${cls}" onclick="${action}">${text}</button>`;
  slideIndex = 0;

  modalEl.className = 'modal on';
  modalEl.innerHTML = `
    <div class="mc">
      <div class="car">
        <div class="ph" id="slide" style="background:linear-gradient(135deg,${place.colors})">${place.emoji}</div>
        <button style="left:8px" onclick="changeSlide(-1,${id})">‹</button>
        <button style="right:8px" onclick="changeSlide(1,${id})">›</button>
      </div>
      <h2 style="text-align:left;margin:14px 0 4px">${place.name}</h2>
      <p>${place.description}</p>
      <p style="margin-top:8px">
        📍 ${place.location}<br>
        🕒 ${hoursText(place)} ${statusHtml(isOpen(place, targetHour()))}
        ${place.eventTime ? '<br>🎟 Начало в ' + place.eventTime : ''}<br>
        💰 ${place.paid ? 'Платно' : 'Бесплатно'} · ${place.distanceKm} км
      </p>
      <div>${place.tags.map(t => `<span class="tag">${TAG_LABELS[t]}</span>`).join('')}</div>
      <div class="row">
        ${btn('', `toggleUserList('favorites',${id})`, user.favorites.includes(id) ? '💛 В избранном' : '🤍 В избранное')}
        ${btn('', `markVisited(${id})`, '🚶 Пойду')}
        ${btn('ghost', `toggleUserList('likes',${id})`, user.likes.includes(id) ? '👍 Лайк поставлен' : '👍 Лайк')}
        ${btn('ghost', `toggleRecommend(${id})`, recommended ? '📣 Вы рекомендуете' : '📣 Рекомендовать')}
        ${btn('ghost', `showReviewForm(${id})`, '✏️ Отзыв')}
      </div>
      <b>Отзывы (${reviews.length})</b>
      ${reviews.map(r => `<div class="rv"><b>${escapeHtml(r.nick)}</b> ${stars(r.rating)}<br>${escapeHtml(r.text)}</div>`).join('')
        || '<div class="rv">Пока нет отзывов — будьте первым!</div>'}
      <div id="reviewForm"></div>
    </div>`;
}

// Карусель: пока заглушки, позже заменить на place.photos
const SLIDE_ICONS = place => [place.emoji, '📸', '🌇'];
function changeSlide(dir, id) {
  const place = findPlace(id), [c1, c2] = place.colors.split(',');
  slideIndex = (slideIndex + dir + 3) % 3;
  const el = $('slide');
  el.style.background = `linear-gradient(${135 + slideIndex * 60}deg,${slideIndex === 1 ? c2 + ',' + c1 : c1 + ',' + c2})`;
  el.textContent = SLIDE_ICONS(place)[slideIndex];
}

function toggleUserList(listName, id) {
  const user = currentUser(), list = user[listName], i = list.indexOf(id);
  i < 0 ? list.push(id) : list.splice(i, 1);
  saveUser(user);
  openPlace(id);
}

function toggleRecommend(id) {
  const nick = currentUser().nick, all = getRecommends(), list = all[id] || (all[id] = []);
  const i = list.indexOf(nick);
  i < 0 ? list.push(nick) : list.splice(i, 1);
  DB.set('recommends', all);
  openPlace(id);
}

function ensureHistory(user, id) {
  let entry = user.history.find(h => h.placeId === id);
  if (!entry) {
    entry = { placeId: id, date: new Date().toLocaleDateString('ru'), rating: 0, text: '' };
    user.history.push(entry);
  }
  return entry;
}

function markVisited(id) {
  const user = currentUser();
  ensureHistory(user, id);
  saveUser(user);
  openPlace(id);
  showReviewForm(id);       // сразу предлагаем оставить отзыв
}

function showReviewForm(id) {
  $('reviewForm').innerHTML = `
    <select id="reviewRating">${[5, 4, 3, 2, 1].map(n => `<option value="${n}">${stars(n)}</option>`).join('')}</select>
    <textarea id="reviewText" rows="3" placeholder="Ваш отзыв"></textarea>
    <button class="btn sm" onclick="submitReview(${id})">Опубликовать</button>`;
}

function submitReview(id) {
  const text = $('reviewText').value.trim(), rating = +$('reviewRating').value;
  if (!text) return;
  const user = currentUser(), all = getReviews();
  (all[id] || (all[id] = [])).push({ nick: user.nick, rating, text });
  DB.set('reviews', all);

  const entry = ensureHistory(user, id);
  entry.rating = rating; entry.text = text;
  saveUser(user);
  openPlace(id);
}

/* ---------- 7. Профиль ---------- */
function showProfile() {
  const user = currentUser();
  const history = user.history.map(h => {
    const p = findPlace(h.placeId);
    return `<div class="rv">${p.emoji} <b>${p.name}</b> · ${h.date}<br>
      ${h.rating ? `<span style="color:#ffd23f">${stars(h.rating)}</span> ` : ''}${escapeHtml(h.text || 'без отзыва')}
      <button class="btn sm ghost" onclick="openPlace(${p.id});showReviewForm(${p.id})">✏️</button></div>`;
  }).join('');
  const favorites = user.favorites.map(id => {
    const p = findPlace(id);
    return `<span class="tag" style="cursor:pointer" onclick="openPlace(${id})">${p.emoji} ${p.name}</span>`;
  }).join('');

  appEl.innerHTML = `
    <div class="glass">
      <h2 style="text-align:left">👤 ${escapeHtml(user.nick)}</h2>
      <p>Статус настроения: <b>${user.mood}</b></p>
      <button class="btn sm ghost" style="margin:10px 0" onclick="retakeTest()">Пройти тест заново</button>
      <h3 style="margin:18px 0 8px">История походов</h3>
      ${history || '<p>Пока пусто — выберите место и нажмите «Пойду».</p>'}
      <h3 style="margin:18px 0 8px">Избранное</h3>
      ${favorites || '<p>Пусто</p>'}
    </div>`;
}

/* ---------- 8. Запуск ---------- */
start();
