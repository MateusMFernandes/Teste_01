/* script.js - Versão final com:
   - remoção de preços e categorias
   - botão "Ver Receita" flutuante sobre a imagem
   - modal layout B (imagem esquerda / receita direita)
   - receitas em JSON com texto puro (\n)
   - compartilhar via Web Share API (texto puro) + fallback modal
   - copy com toast
   - foco controlado/trap no modal
   - scroll spy (active nav) e header shadow on scroll
   - print-friendly para a receita
   - lazy load improvements (decoding, fetchpriority attributes in HTML)
*/

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
     Modal - elements & helpers
  ------------------------*/
  const modal = document.getElementById('image-modal');
  const modalPanel = modal.querySelector('.modal-panel');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalRecipe = document.getElementById('modal-recipe');
  const modalClose = modal.querySelector('.modal-close');
  const btnCopy = document.getElementById('btn-copy-recipe');
  const btnShare = document.getElementById('btn-share');

  const shareFallback = document.getElementById('share-fallback');
  const shareClose = shareFallback.querySelector('.share-close');
  const shareTextarea = document.getElementById('share-textarea');
  const shareCopyBtn = document.getElementById('share-copy-btn');
  const shareCloseBtn = document.getElementById('share-close-btn');

  const toast = document.getElementById('toast');

  let lastFocused = null;

  function showToast(message, ms = 1500) {
    toast.textContent = message;
    toast.setAttribute('aria-hidden', 'false');
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      toast.setAttribute('aria-hidden', 'true');
    }, ms);
  }

  // recipe json lookup
  function getRecipeById(id) {
    if (!id) return null;
    const script = document.getElementById(`recipe-${id}`);
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch (err) {
      console.warn('Erro parse recipe', id, err);
      return null;
    }
  }

  // render text (with \n) into safe HTML (escape then <br>)
  function renderRecipeTextAsHtml(text) {
    if (!text) return '';
    // escape
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // highlight keywords (Materiais, Abreviações, Carreira \d+)
    const highlighted = escaped
      .replace(/(Materiais:)/gi, '<strong>$1</strong>')
      .replace(/(Abreviações:)/gi, '<strong>$1</strong>')
      .replace(/(Carreira\s*\d+:)/gi, '<strong>$1</strong>');
    // newlines to <br>
    return highlighted.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
  }

  // strip HTML back to plaintext (for copy/share fallback)
  function stripHtmlToText(html) {
    if (!html) return '';
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/?[^>]+(>|$)/g, '');
    const ta = document.createElement('textarea');
    ta.innerHTML = text;
    return ta.value.trim();
  }

  // open modal: populate and trap focus
  function openModal({ imgSrc, title, recipeText }) {
    lastFocused = document.activeElement;
    modalImg.src = imgSrc || '';
    modalImg.alt = title || 'Imagem do produto';
    modalTitle.textContent = title || '';
    modalRecipe.innerHTML = recipeText ? renderRecipeTextAsHtml(recipeText) : '<em>Receita não disponível.</em>';

    // show
    modal.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';

    // focus management
    setTimeout(() => { // give browser time to render
      modalClose.focus();
      trapFocus(modalPanel);
    }, 40);
  }

  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    modalTitle.textContent = '';
    modalRecipe.innerHTML = '';
    document.documentElement.style.overflow = '';
    releaseFocusTrap();
    if (lastFocused) try { lastFocused.focus(); } catch (e) {}
    lastFocused = null;
  }

  // attach actions to product card buttons and images
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  productCards.forEach(card => {
    const media = card.querySelector('.product-media img');
    const btn = card.querySelector('.btn-card-action');
    const titleEl = card.querySelector('.product-name');
    const recipeId = card.dataset.recipeId;

    function triggerOpen() {
      const title = (getRecipeById(recipeId) && getRecipeById(recipeId).title) || (titleEl ? titleEl.textContent.trim() : '');
      const recipeObj = getRecipeById(recipeId);
      const recipeText = recipeObj ? recipeObj.recipe : null;
      openModal({ imgSrc: media ? media.src : '', title, recipeText });
    }

    if (btn) {
      btn.addEventListener('click', (e) => { e.stopPropagation(); triggerOpen(); });
    }
    if (media) {
      // clicking image also opens modal (keeps affordance)
      media.addEventListener('click', (e) => { e.stopPropagation(); triggerOpen(); });
      media.style.cursor = 'zoom-in';
    }

    // keyboard accessibility: Enter/Space on entire card opens modal if btn exists
    card.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && (btn || recipeId)) {
        e.preventDefault();
        triggerOpen();
      }
    });
  });

  // modal close handlers
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
  });

  /* -----------------------
     Copy recipe (button)
  ------------------------*/
  btnCopy.addEventListener('click', async () => {
    const plain = stripHtmlToText(modalRecipe.innerHTML);
    if (!plain) { showToast('Receita vazia'); return; }
    try {
      await navigator.clipboard.writeText(plain);
      showToast('Receita copiada');
    } catch (err) {
      // fallback: textarea
      const ta = document.createElement('textarea');
      ta.value = plain;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Receita copiada'); } catch (e) { alert('Não foi possível copiar automaticamente.'); }
      ta.remove();
    }
  });

  /* -----------------------
     Share recipe (Web Share API)
  ------------------------*/
  btnShare.addEventListener('click', async () => {
    const title = modalTitle.textContent || '';
    const plain = stripHtmlToText(modalRecipe.innerHTML);
    const textToShare = plain ? `${title}\n\n${plain}` : title;

    if (navigator.share) {
      try {
        await navigator.share({ title: title, text: textToShare });
      } catch (err) {
        // user cancelled or error -> fallback
        openShareFallback(textToShare);
      }
    } else {
      openShareFallback(textToShare);
    }
  });

  // share fallback modal handlers
  function openShareFallback(text) {
    shareTextarea.value = text;
    shareFallback.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    shareClose.focus();
  }
  function closeShareFallback() {
    shareFallback.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
  }
  shareClose.addEventListener('click', closeShareFallback);
  shareClose.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShareFallback(); });
  shareCopyBtn.addEventListener('click', async () => {
    const val = shareTextarea.value;
    try {
      await navigator.clipboard.writeText(val);
      showToast('Receita copiada');
    } catch (err) {
      const ta = document.createElement('textarea'); ta.value = val; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); showToast('Receita copiada'); } catch (e) { alert('Não foi possível copiar.'); }
      ta.remove();
    }
  });
  shareCloseBtn.addEventListener('click', closeShareFallback);

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

  /* -----------------------
     Small accessibility: trap focus in share fallback too
  ------------------------*/
  shareFallback.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShareFallback();
  });

});
