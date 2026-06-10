/* ===================================================================
   GROUP MBC · script.js
   Minimal vanilla JS. No build step, no dependencies.
   =================================================================== */


/* ===========================================================
   EDITAR AQUÍ · WhatsApp + precios
   --------------------------------
   Para cambiar el número de WhatsApp, edita SOLO esta línea:
   =========================================================== */
const WHATSAPP_NUMBER = '573000000000'; // ← número placeholder. Formato internacional sin "+".

// Mensajes pre-llenados (Colombian Spanish)
const WHATSAPP_MESSAGES = {
  generic: 'Hola Group MBC, quiero información sobre sus lotes.',
  venecia: 'Hola Group MBC, me interesa el proyecto de Venecia.',
  barbosa: 'Hola Group MBC, me interesa el proyecto de Barbosa.',
};

// Construye el enlace de WhatsApp con mensaje URL-encoded
function buildWhatsAppLink(key = 'generic') {
  const msg = WHATSAPP_MESSAGES[key] || WHATSAPP_MESSAGES.generic;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}


/* ===========================================================
   1 · WIRE WHATSAPP LINKS
   Cualquier <a data-wa="generic|venecia|barbosa"> recibe el href correcto.
   =========================================================== */
document.querySelectorAll('[data-wa]').forEach((el) => {
  const key = el.dataset.wa;
  el.setAttribute('href', buildWhatsAppLink(key));
  el.setAttribute('target', '_blank');
  el.setAttribute('rel', 'noopener noreferrer');
});


/* ===========================================================
   2 · STICKY HEADER · scroll state
   =========================================================== */
const header = document.getElementById('header');
const onScroll = () => {
  if (window.scrollY > 12) header.classList.add('is-scrolled');
  else header.classList.remove('is-scrolled');
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


/* ===========================================================
   3 · MOBILE MENU
   =========================================================== */
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');

function toggleMenu(forceClose = false) {
  const isOpen = mobileMenu.classList.contains('is-open') && !forceClose;
  if (isOpen) {
    mobileMenu.classList.remove('is-open');
    menuToggle.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  } else if (!forceClose) {
    mobileMenu.classList.add('is-open');
    menuToggle.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
  }
}

menuToggle.addEventListener('click', () => toggleMenu());

// Close on link click
mobileMenu.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => toggleMenu(true));
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleMenu(true);
});


/* ===========================================================
   4 · SCROLL REVEALS · IntersectionObserver
   --------------------------------------------------------
   - Hero reveals fire immediately (staggered via CSS delays).
   - Other elements animate in when they enter the viewport.
   - Safety fallback: after 3s, force-reveal anything left behind
     (covers IO failures in headless / older browsers / edge cases).
   =========================================================== */
const revealEls = document.querySelectorAll('.reveal');

// Hero reveals fire on page load — they're already in view.
function showHero() {
  document.querySelectorAll('.hero .reveal').forEach((el) => el.classList.add('is-visible'));
}
if (document.readyState === 'complete') showHero();
else window.addEventListener('load', showHero);

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Safety net: any reveal still hidden after 3s gets shown anyway.
setTimeout(() => {
  document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => el.classList.add('is-visible'));
}, 3000);


/* ===========================================================
   4b · HERO VIDEO · autoplay robusto en iOS
   --------------------------------------------------------
   Safari en iPhone bloquea el autoplay si el dispositivo está
   en modo de bajo consumo, y algunas versiones ignoran el
   atributo muted del HTML. Forzamos muted por JS, intentamos
   play() al cargar y reintentamos en el primer toque/gesto.
   =========================================================== */
(() => {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;

  // iOS exige que muted/playsInline estén puestos como propiedades
  // antes de intentar reproducir.
  video.muted = true;
  video.playsInline = true;

  function tryPlay() {
    if (!video.paused) return;
    const p = video.play();
    if (p && p.catch) p.catch(() => {/* bloqueado: esperamos un gesto */});
  }

  // Intento inicial (cubre el caso normal).
  tryPlay();
  window.addEventListener('load', tryPlay);

  // Reintento con el primer gesto del usuario (cubre modo bajo consumo).
  ['touchstart', 'touchend', 'click', 'wheel', 'keydown'].forEach((evt) => {
    window.addEventListener(evt, tryPlay, { once: true, passive: true });
  });

  // Si la pestaña vuelve a estar visible, retomar la reproducción.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) tryPlay();
  });
})();


/* ===========================================================
   5 · HERO · scroll-to-expand
   --------------------------------------------------------
   Port of the 21st.dev ScrollExpandMedia behavior to vanilla:
   - Locks page scroll while in the hero.
   - Wheel / touch input increments a 0→1 progress.
   - Progress drives: media size, title-line translateX, bg opacity.
   - At progress=1 we unlock scroll and fade in the lede + CTAs.
   - Scrolling back up at the very top re-locks (mirrors source UX).
   - Respects prefers-reduced-motion (skips the effect entirely).
   =========================================================== */
(() => {
  const hero = document.querySelector('[data-hero-scroll]');
  if (!hero) return;

  const bg       = hero.querySelector('[data-hero-bg]');
  const media    = hero.querySelector('[data-hero-media]');
  const tint     = hero.querySelector('[data-hero-tint]');
  const cue      = hero.querySelector('[data-hero-cue]');
  const expanded = hero.querySelector('[data-hero-expanded]');
  const lines    = hero.querySelectorAll('[data-hero-line]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let progress = 0;
  let expandedOpen = false;
  let isMobile = window.innerWidth < 768;
  let touchY = 0;

  function applyProgress() {
    // Media size: small portrait at start → wide cinematic at end.
    const baseW = isMobile ? 260 : 340;
    const baseH = isMobile ? 380 : 460;
    const growW = isMobile ? 720 : 1400;
    const growH = isMobile ? 320 : 440;
    media.style.width  = (baseW + progress * growW) + 'px';
    media.style.height = (baseH + progress * growH) + 'px';

    // Two title lines slide apart in opposite directions.
    const tx = progress * (isMobile ? 110 : 90); // in vw
    lines.forEach((line) => {
      const dir = parseInt(line.dataset.heroLine || '1', 10);
      line.style.transform = `translateX(${dir * tx}vw)`;
    });

    // Background photo fades (keeps a faint hint at full progress).
    bg.style.opacity = String(1 - progress * 0.9);

    // Media tint lightens slightly so the photo "breathes" as it expands.
    if (tint) tint.style.opacity = String(0.45 - progress * 0.3);

    // Hide the cue as soon as user starts scrolling.
    if (cue) cue.classList.toggle('is-hidden', progress > 0.04);

    // Reveal lede + CTAs only at near-full expansion.
    if (progress >= 0.92) expanded.classList.add('is-visible');
    else if (progress < 0.7) expanded.classList.remove('is-visible');
  }

  function lock()   { document.body.classList.add('hero-locked'); }
  function unlock() { document.body.classList.remove('hero-locked'); }

  function setProgress(p) {
    progress = Math.min(1, Math.max(0, p));
    applyProgress();
    if (progress >= 1 && !expandedOpen) { expandedOpen = true; unlock(); }
  }

  function forceExpand() {
    setProgress(1);
    expandedOpen = true;
    unlock();
  }

  function onWheel(e) {
    if (expandedOpen) {
      // At top of doc + scrolling up → re-engage the hero lock.
      if (e.deltaY < 0 && window.scrollY <= 4) {
        expandedOpen = false;
        progress = 0.95;
        applyProgress();
        lock();
        e.preventDefault();
      }
      return;
    }
    e.preventDefault();
    setProgress(progress + e.deltaY * 0.0011);
  }

  function onTouchStart(e) { touchY = e.touches[0].clientY; }
  function onTouchMove(e) {
    if (!touchY) return;
    const y = e.touches[0].clientY;
    const dy = touchY - y;
    if (expandedOpen) {
      if (dy < -24 && window.scrollY <= 4) {
        expandedOpen = false;
        progress = 0.95;
        applyProgress();
        lock();
        e.preventDefault();
      }
      return;
    }
    e.preventDefault();
    const factor = dy < 0 ? 0.009 : 0.007;
    setProgress(progress + dy * factor);
    touchY = y;
  }
  function onTouchEnd() { touchY = 0; }

  function onResize() {
    isMobile = window.innerWidth < 768;
    applyProgress();
  }

  // Escape hatch: any nav link to a different section force-expands
  // so the page can scroll normally to that anchor.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === '#top') return;
    link.addEventListener('click', () => {
      if (!expandedOpen) forceExpand();
    });
  });

  // Reduced motion: render the hero in its expanded "static" state, no lock.
  if (reducedMotion) {
    forceExpand();
    return;
  }

  // Initial state: locked + collapsed.
  window.scrollTo(0, 0);
  lock();
  applyProgress();

  // Keyboard accessibility: arrow-down, space, page-down, end advance the hero.
  function onKey(e) {
    if (expandedOpen) return;
    const advance = {
      'ArrowDown': 0.18, 'PageDown': 0.5, 'End': 1,
      ' ': 0.25, 'Spacebar': 0.25,
    }[e.key];
    if (advance != null) {
      e.preventDefault();
      setProgress(progress + advance);
    }
  }

  window.addEventListener('wheel',      onWheel,      { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove',  onTouchMove,  { passive: false });
  window.addEventListener('touchend',   onTouchEnd);
  window.addEventListener('keydown',    onKey);
  window.addEventListener('resize',     onResize);
})();


/* ===========================================================
   6 · YEAR IN FOOTER
   =========================================================== */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


