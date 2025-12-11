/* script.js - Versão atualizada
   - Remove filtros/categorias
   - Remove botão WhatsApp fixo
   - Modal layout B (imagem à esquerda / receita à direita)
   - Receitas em JSON com texto puro (\n para quebras)
   - Compartilhar usa Web Share API (fallback copia)
*/

document.addEventListener('DOMContentLoaded', function () {

  // Hamburger menu (permanece)
  const btnHamburger = document.getElementById('btn-hamburger');
  const mainNav = document.getElementById('main-nav');
  btnHamburger.addEventListener('click', function () {
    const isOpen = mainNav.classList.toggle('open');
    this.classList.toggle('open');
    this.setAttribute('aria-expanded', String(isOpen));
  });
  // Close menu on nav link click (mobile)
  document.querySelectorAll('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      if (mainNav.classList.contains('open')) {
        mainNav.classList.remove('open');
        btnHamburger.classList.remove('open');
        btnHamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Smooth scroll (anchors)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        if (mainNav.classList.contains('open')) mainNav.classList.remove('open');
        const offset = 70; // header height offset
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ==== Modal logic (imagem + receita) ====
  const modal = document.getElementById('image-modal');
  const modalPanel = modal.querySelector('.modal-panel');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalRecipe = document.getElementById('modal-recipe');
  const modalClose = modal.querySelector('.modal-close');
  const btnCopy = document.getElementById('btn-copy-recipe');
  const btnShare = document.getElementById('btn-share');

  let lastFocusedElement = null;

  // Helper: find recipe JSON by id (returns object {title, recipe} or null)
  function getRecipeById(id) {
    if (!id) return null;
    const script = document.getElementById(`recipe-${id}`);
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch (err) {
      console.warn('Erro ao parsear receita', id, err);
      return null;
    }
  }

  // Convert recipe text (with \n) into HTML (br)
  function renderRecipeTextAsHtml(text) {
    if (!text) return '';
    // sanitize minimal: escape < and >
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // replace consecutive newlines with double <br> & preserve single newlines
    const withBr = escaped.replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
    return withBr;
  }

  // Open modal and populate
  function openModal({ imgSrc, title, recipeText }) {
    lastFocusedElement = document.activeElement;
    modalImg.src = imgSrc || '';
    modalImg.alt = title || 'Imagem do produto';
    modalTitle.textContent = title || '';
    modalRecipe.innerHTML = recipeText ? renderRecipeTextAsHtml(recipeText) : '<em>Receita não disponível para este item.</em>';

    // show modal
    modal.setAttribute('aria-hidden', 'false');
    modalClose.focus();
    document.documentElement.style.overflow = 'hidden';
  }

  // Close modal
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    modalTitle.textContent = '';
    modalRecipe.innerHTML = '';
    document.documentElement.style.overflow = '';
    if (lastFocusedElement) {
      try { lastFocusedElement.focus(); } catch (e) {}
      lastFocusedElement = null;
    }
  }

  // Attach click to images in cards
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  productCards.forEach(card => {
    const img = card.querySelector('img');
    const titleEl = card.querySelector('.product-name');
    const recipeId = card.dataset.recipeId;

    if (img) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const title = titleEl ? titleEl.textContent.trim() : '';
        const recipeObj = getRecipeById(recipeId);
        const recipeText = recipeObj ? recipeObj.recipe : null;
        const displayTitle = recipeObj && recipeObj.title ? recipeObj.title : title;
        openModal({ imgSrc: img.src, title: displayTitle, recipeText });
      });
    }

    // keyboard activate on card (Enter / Space)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const triggerImg = card.querySelector('img');
        if (triggerImg) triggerImg.click();
      }
    });
  });

  // Copy button: copies the plain recipe text (not HTML)
  btnCopy.addEventListener('click', async () => {
    // get original recipe text from the modal (we can reconstruct by reversing <br> if needed)
    // Better: find recipeId from currently displayed title by searching recipes — fallback: strip tags
    const title = modalTitle.textContent || '';
    let plain = stripHtmlToText(modalRecipe.innerHTML); // plain text with newlines
    if (!plain) {
      alert('Receita vazia.');
      return;
    }
    try {
      await navigator.clipboard.writeText(plain);
      btnCopy.textContent = 'Copiado!';
      setTimeout(() => btnCopy.textContent = 'Copiar receita', 1800);
    } catch (err) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = plain;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        btnCopy.textContent = 'Copiado!';
      } catch (e) {
        alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
      }
      ta.remove();
      setTimeout(() => btnCopy.textContent = 'Copiar receita', 1800);
    }
  });

  // Share button: use Web Share API (share text only). Fallback: copy to clipboard & notify user.
  btnShare.addEventListener('click', async () => {
    const title = modalTitle.textContent || '';
    const plain = stripHtmlToText(modalRecipe.innerHTML);
    const textToShare = plain ? `${title}\n\n${plain}` : title;

    if (navigator.share) {
      try {
        await navigator.share({ title: title, text: textToShare });
        // on success nothing more needed
      } catch (err) {
        // user cancelled or error; fallback to copy
        fallbackCopyAndInform(textToShare);
      }
    } else {
      // fallback: copy to clipboard and prompt user to paste
      fallbackCopyAndInform(textToShare);
    }
  });

  function fallbackCopyAndInform(text) {
    navigator.clipboard?.writeText(text).then(() => {
      alert('Receita copiada para a área de transferência. Abra o app desejado e cole a mensagem.');
    }).catch(() => {
      // last resort textarea
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        alert('Receita copiada para a área de transferência. Abra o app desejado e cole a mensagem.');
      } catch (e) {
        alert('Não foi possível copiar automaticamente. Selecione e copie manualmente.');
      }
      ta.remove();
    });
  }

  // Close handlers
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeModal();
    }
  });

  // Accessibility: trap focus simply
  document.addEventListener('focus', function (event) {
    if (modal.getAttribute('aria-hidden') === 'false') {
      if (!modal.contains(event.target)) {
        modalClose.focus();
      }
    }
  }, true);

  // Utility: strip HTML back to text with newlines
  function stripHtmlToText(html) {
    if (!html) return '';
    // convert <br> to \n and </p> to \n
    let text = html.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/p>/gi, '\n');
    // remove remaining tags
    text = text.replace(/<\/?[^>]+(>|$)/g, '');
    // decode HTML entities basic
    text = text.replace(/&nbsp;/g, ' ');
    const ta = document.createElement('textarea');
    ta.innerHTML = text;
    return ta.value.trim();
  }

});
