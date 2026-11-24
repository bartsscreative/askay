const menu = document.querySelector('#menu');
const menuToggle = document.querySelector('.menu-toggle');
const mobile = matchMedia('(max-width: 820px)');
document.documentElement.classList.add('js');
menuToggle.hidden = false;

function setMenu(open) {
  menu.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
}
menuToggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
mobile.addEventListener('change', () => setMenu(false));
document.querySelector('.header').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('open')) {
    setMenu(false);
    menuToggle.focus();
  }
});
const navLinks = [...menu.querySelectorAll('a:not(.button)')];
function updateNavigation(hash) {
  const active = navLinks.find((link) => link.hash === hash) ?? navLinks[0];
  navLinks.forEach((link) => link.removeAttribute('aria-current'));
  active.setAttribute('aria-current', 'location');
}
updateNavigation(location.hash);
window.addEventListener('hashchange', () => updateNavigation(location.hash));
menu.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  if (mobile.matches) {
    setMenu(false);
    const destination = document.querySelector(link.hash);
    destination.setAttribute('tabindex', '-1');
    destination.focus({ preventScroll: true });
  }
});

const hero = document.querySelector('.hero');
const slides = [...hero.querySelectorAll('.slide')];
const controls = hero.querySelector('.controls');
const dots = [...controls.querySelectorAll('[data-slide]')];
const rotation = document.querySelector('#rotation');
const status = document.querySelector('#slide-status');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let index = 0;
let paused = reducedMotion.matches;
let timer;
let touch;

function showSlide(next) {
  index = (next + slides.length) % slides.length;
  slides.forEach((slide, number) => slide.classList.toggle('active', number === index));
  dots.forEach((dot, number) => {
    if (number === index) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  });
  status.textContent = dots[index].getAttribute('aria-label');
}

function scheduleRotation() {
  clearInterval(timer);
  if (!paused && !document.hidden) timer = setInterval(() => showSlide(index + 1), 6000);
}

function setPaused(value) {
  paused = value;
  rotation.textContent = paused ? '▶' : 'Ⅱ';
  rotation.setAttribute('aria-label', paused ? 'Slayt gösterisini başlat' : 'Slayt gösterisini duraklat');
  status.setAttribute('aria-live', paused ? 'polite' : 'off');
  scheduleRotation();
}

function moveSlide(next) {
  setPaused(true);
  showSlide(next);
}

controls.hidden = false;
showSlide(0);
setPaused(paused);
controls.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button === rotation) setPaused(!paused);
  else if (button.hasAttribute('data-slide')) moveSlide(Number(button.dataset.slide));
  else moveSlide(index + Number(button.dataset.step));
});
controls.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  event.preventDefault();
  moveSlide(index + (event.key === 'ArrowRight' ? 1 : -1));
});
hero.addEventListener('touchstart', (event) => {
  const point = event.touches[0];
  touch = { x: point.clientX, y: point.clientY };
}, { passive: true });
hero.addEventListener('touchcancel', () => { touch = undefined; });
hero.addEventListener('touchend', (event) => {
  if (!touch) return;
  const point = event.changedTouches[0];
  const x = point.clientX - touch.x;
  const y = point.clientY - touch.y;
  if (Math.abs(x) > 48 && Math.abs(x) > Math.abs(y) * 1.5) moveSlide(index + (x < 0 ? 1 : -1));
  touch = undefined;
}, { passive: true });
document.addEventListener('visibilitychange', scheduleRotation);
reducedMotion.addEventListener('change', (event) => { if (event.matches) setPaused(true); });

const dialog = document.querySelector('#project-dialog');
if (typeof dialog.showModal === 'function') {
  const content = document.querySelector('#dialog-content');
  const closeButton = dialog.querySelector('.dialog-close');
  let selectedCard;
  document.querySelector('.project-grid').addEventListener('click', (event) => {
    const card = event.target.closest('.project');
    if (!card || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const detail = document.querySelector(card.hash);
    if (!detail) return;
    event.preventDefault();
    selectedCard = card;
    content.replaceChildren(...[...detail.children].map((child) => child.cloneNode(true)));
    content.querySelector('h3').id = 'dialog-title';
    content.querySelector('.category-back').remove();
    dialog.showModal();
    closeButton.focus();
  });
  function closeProject() {
    const card = selectedCard;
    dialog.close();
    card?.focus({ preventScroll: true });
  }
  closeButton.addEventListener('click', closeProject);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeProject();
  });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeProject(); });
}

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.classList.add('entering');
      observer.unobserve(target);
    });
  }, { threshold: .15 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

