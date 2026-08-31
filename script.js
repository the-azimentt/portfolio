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
document.addEventListener('DOMContentLoaded', () => {
  const reelVideos = document.querySelectorAll('.hero-reel video');

  reelVideos.forEach((video) => {
    // Убеждаемся, что звук отключен (требование браузеров для autoplay)
    video.muted = true;
    
    // Принудительный запуск воспроизведения
    const playPromise = video.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn('Автозапуск видео был заблокирован браузером:', error);
      });
    }
  });

  // Запуск видео заново, если вкладка снова стала активной
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      reelVideos.forEach((video) => video.play());
    }
  });
});
