document.addEventListener('DOMContentLoaded', function () {

  /* -----------------------
     Header / Nav / Hamburger
  ------------------------*/
  const btnHamburger = document.getElementById('btn-hamburger');
  const mainNav = document.getElementById('main-nav');
  const siteHeader = document.querySelector('.site-header');

  btnHamburger.addEventListener('click', function () {
    const isOpen = mainNav.classList.toggle('open');
    this.classList.toggle('open');
    this.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        btnHamburger.classList.remove('open');
        btnHamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Header shadow on scroll (after 10px)
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) siteHeader.classList.add('scrolled');
    else siteHeader.classList.remove('scrolled');
    updateScrollSpy(); // update active nav as user scrolls
  }, { passive: true });

  /* -----------------------
     Scroll Spy (active link)
  ------------------------*/
  const sections = Array.from(document.querySelectorAll('main section[id]'));
  const navLinks = Array.from(document.querySelectorAll('.main-nav a'));

  function findCurrentSection() {
    const offset = 120; // header offset
    const scrollPos = window.scrollY + offset;
    let current = sections[0];
    for (const sec of sections) {
      const top = sec.offsetTop;
      if (scrollPos >= top) current = sec;
    }
    return current ? current.id : null;
  }

  function updateScrollSpy() {
    const id = findCurrentSection();
    navLinks.forEach(a => {
      if (a.getAttribute('href') === `#${id}`) a.classList.add('active');
      else a.classList.remove('active');
    });
  }
  // initial run
  updateScrollSpy();

  /* -----------------------
     Year element
  ------------------------*/
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* -----------------------
     Focus trap utilities
  ------------------------*/
  let focusTrapHandlers = null;
  function trapFocus(container) {
    const focusable = Array.from(container.querySelectorAll('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    focusTrapHandlers = function (e) {
      if (modal.getAttribute('aria-hidden') === 'true') return;
      if (e.key === 'Tab') {
        if (e.shiftKey) { // shift + tab
          if (document.activeElement === first) {
            e.preventDefault(); last.focus();
          }
        } else { // tab
          if (document.activeElement === last) {
            e.preventDefault(); first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', focusTrapHandlers);
  }
  function releaseFocusTrap() {
    if (focusTrapHandlers) {
      document.removeEventListener('keydown', focusTrapHandlers);
      focusTrapHandlers = null;
    }
  }

  /* -----------------------
     Scroll-to anchors (smooth)
  ------------------------*/
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        if (mainNav.classList.contains('open')) mainNav.classList.remove('open');
        const offset = 70;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* -----------------------
     Utility: update scroll spy on load/resize too
  ------------------------*/
  window.addEventListener('resize', updateScrollSpy);
  window.addEventListener('load', updateScrollSpy);

  const shareFallback = document.getElementById('share-fallback');

if (shareFallback) {
  shareFallback.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShareFallback();
  });
}


const hero = document.querySelector(".hero");
const dots = document.querySelectorAll(".hero-dots input");

if (hero && dots.length > 0) {

  const images = [
    "Img/002.jpg",
    "Img/003.jpg",
    "Img/001.jpg"
  ];

  let current = 0;

  function changeSlide(index) {
    hero.style.backgroundImage = `url('${images[index]}')`;
    dots[index].checked = true;
    current = index;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener("change", () => {
      changeSlide(index);
    });
  });

  setInterval(() => {
    let next = (current + 1) % images.length;
    changeSlide(next);
  }, 6000);
}


});
