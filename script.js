// ============================================================
// Timeline scrubber: page scroll position mapped onto a fake
// NLE timecode + progress bar + current "clip" (section) label.
// ============================================================
(function () {
  const progressEl = document.getElementById('timelineProgress');
  const playheadEl = document.getElementById('timelinePlayhead');
  const clipEl = document.getElementById('timelineClip');
  const tcEl = document.getElementById('timelineTC');
  const sections = Array.from(document.querySelectorAll('.section[data-clip]'));

  const FPS = 24;
  const TOTAL_SECONDS = 240; // fictional total "runtime" of the reel

  function toTimecode(fractionalSeconds) {
    const totalFrames = Math.max(0, Math.floor(fractionalSeconds * FPS));
    const hh = Math.floor(totalFrames / (FPS * 3600));
    const mm = Math.floor((totalFrames / (FPS * 60)) % 60);
    const ss = Math.floor((totalFrames / FPS) % 60);
    const ff = totalFrames % FPS;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;
  }

  let ticking = false;

  function update() {
    ticking = false;
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const fraction = maxScroll > 0 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;

    progressEl.style.width = (fraction * 100).toFixed(2) + '%';
    playheadEl.style.left = (fraction * 100).toFixed(2) + '%';
    tcEl.textContent = toTimecode(fraction * TOTAL_SECONDS);

    // find current section (the one whose top is closest above viewport middle)
    let current = sections[0];
    const probeY = window.innerHeight * 0.35;
    for (const sec of sections) {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= probeY) current = sec;
    }
    if (current) clipEl.textContent = current.dataset.clip;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();

// ============================================================
// Reveal-on-scroll for panels, cards, chips, pipeline
// ============================================================
(function () {
  const targets = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );
  targets.forEach((el) => observer.observe(el));
})();

// ============================================================
// Фоновая карусель в hero: на больших экранах — живое видео,
// на телефонах — лёгкая зацикленная GIF/WebP-анимация вместо
// видео (кадр всё равно двигается, но без декодирования видео,
// которое и лагает на мобильных).
// ============================================================
(function () {
  const items = Array.from(document.querySelectorAll('.hero-reel .reel-item'));
  if (items.length === 0) return;

  const desktopQuery = window.matchMedia('(min-width: 861px)');

  function syncItems() {
    const isDesktop = desktopQuery.matches;
    items.forEach((item) => {
      const video = item.querySelector('video');
      const gif = item.querySelector('.reel-gif');

      if (isDesktop) {
        item.classList.remove('reel-item--gif');
        // освобождаем GIF/WebP из памяти на десктопе — там она не нужна
        if (gif && gif.getAttribute('src')) gif.removeAttribute('src');

        const src = video && video.dataset.src;
        if (video && src && video.getAttribute('src') !== src) {
          video.setAttribute('src', src);
          video.load();
          video.play().catch(() => {});
        }
      } else {
        item.classList.add('reel-item--gif');
        // видео на телефоне не грузим и не декодируем вовсе
        if (video && video.getAttribute('src')) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
        const gifSrc = gif && gif.dataset.src;
        if (gif && gifSrc && gif.getAttribute('src') !== gifSrc) {
          gif.setAttribute('src', gifSrc);
        }
      }
    });
  }

  syncItems();
  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener('change', syncItems);
  } else if (desktopQuery.addListener) {
    // старые браузеры / Safari < 14
    desktopQuery.addListener(syncItems);
  }
})();

// ============================================================
// Кнопка "Ещё дубли" — раскрывает остальные карточки работ
// на мобильных экранах (по умолчанию видно 4 из 8).
// ============================================================
(function () {
  const btn = document.getElementById('reelMore');
  const grid = document.querySelector('.reel-grid');
  const countEl = document.getElementById('reelMoreCount');
  if (!btn || !grid) return;

  btn.addEventListener('click', () => {
    const expanded = grid.classList.toggle('reel-grid--expanded');
    btn.setAttribute('aria-expanded', String(expanded));
    if (countEl) countEl.textContent = expanded ? '−4' : '+4';
    btn.querySelector('.reel-more-label').textContent = expanded ? 'СКРЫТЬ' : 'ЕЩЁ ДУБЛИ';
  });
})();

// ============================================================
// Mobile nav toggle
// ============================================================
(function () {
  const burger = document.getElementById('navBurger');
  if (!burger) return;
  const links = document.querySelector('.nav-links');

  burger.addEventListener('click', () => {
    const isOpen = links.classList.toggle('nav-links--open');
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('nav-links--open');
      burger.setAttribute('aria-expanded', 'false');
    })
  );
})();
