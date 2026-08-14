'use strict';

// Menu responsivo
document.addEventListener('click', function (e) {
  const toggle = e.target.closest('[data-nav-toggle]');
  if (toggle) {
    const nav = document.querySelector('[data-nav]');
    if (nav) nav.classList.toggle('open');
    return;
  }

  // Tela cheia do jogo
  if (e.target.closest('[data-fullscreen]')) {
    const frame = document.getElementById('game-frame');
    if (frame && frame.requestFullscreen) frame.requestFullscreen().catch(function () {});
    return;
  }

  // Voltar
  if (e.target.closest('[data-back]')) {
    history.back();
    return;
  }

  // Abrir foto no lightbox
  const fig = e.target.closest('[data-lightbox]');
  if (fig) {
    openLightbox(fig.getAttribute('data-lightbox'), fig.getAttribute('data-caption'));
    return;
  }

  // Fechar lightbox
  if (e.target.closest('[data-lightbox-close]') || e.target.hasAttribute('data-lightbox-modal')) {
    closeLightbox();
  }
});

// Confirmação de ações destrutivas (respeitando o CSP, sem inline handlers)
document.addEventListener('submit', function (e) {
  const form = e.target.closest('[data-confirm]');
  if (form && !confirm(form.getAttribute('data-confirm'))) {
    e.preventDefault();
  }
});

// Mostra o nome do arquivo escolhido
document.addEventListener('change', function (e) {
  const input = e.target.closest('[data-file]');
  if (!input) return;
  const label = input.parentElement.querySelector('[data-file-name]');
  if (label) label.textContent = input.files && input.files[0] ? input.files[0].name : '';
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeLightbox();
});

function openLightbox(src, caption) {
  const modal = document.querySelector('[data-lightbox-modal]');
  if (!modal) return;
  modal.querySelector('[data-lightbox-img]').src = src;
  modal.querySelector('[data-lightbox-caption]').textContent = caption || '';
  modal.hidden = false;
  document.body.classList.add('no-scroll');
}

function closeLightbox() {
  const modal = document.querySelector('[data-lightbox-modal]');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  modal.querySelector('[data-lightbox-img]').src = '';
  document.body.classList.remove('no-scroll');
}
