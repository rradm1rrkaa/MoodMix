/* MoodMix — анимация неба и появления блоков (index.html и app.html).
   Весь код в IIFE, чтобы переменные не конфликтовали с app.js. */
(() => {
  const $ = s => document.querySelector(s);

  // ---- Настройки ----
  const SUN_START = 24;            // % высоты экрана, где солнце в начале
  const SUN_TRAVEL = 90;           // на сколько % оно опускается за весь скролл
  const SKY = {                    // цвета неба: [день, ночь]
    top:     ['#1b2a6b', '#02051a'],
    middle:  ['#8a4a7e', '#0a1038'],
    horizon: ['#ffb45e', '#141a4a'],
  };

  const toRgb = hex => [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16));
  const mix = ([from, to], t) =>
    'rgb(' + toRgb(from).map((v, i) => Math.round(v + (toRgb(to)[i] - v) * t)) + ')';
  const clamp01 = x => Math.max(0, Math.min(1, x));

  function updateSky() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? clamp01(scrollY / max) : 0;          // 0 — день, 1 — ночь
    const sunOpacity = clamp01(1 - Math.max(0, p - 0.7) * 3);

    $('#sky').style.background =
      `linear-gradient(${mix(SKY.top, p)} 0%, ${mix(SKY.middle, p)} 55%, ${mix(SKY.horizon, p)} 74%)`;
    $('#sun').style.top = (SUN_START + p * SUN_TRAVEL) + '%';
    $('#sun').style.opacity = sunOpacity;
    $('#moon').style.opacity = clamp01((p - 0.75) * 4);
    document.documentElement.style.setProperty('--sun', sunOpacity);   // для солнечной дорожки
  }
  addEventListener('scroll', updateSky);
  addEventListener('resize', updateSky);
  updateSky();

  // Плавное появление блоков при прокрутке
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in')),
    { threshold: 0.15 });
  document.querySelectorAll('.fade').forEach(el => observer.observe(el));
})();