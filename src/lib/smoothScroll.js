import { clamp, easeInOutCubic, prefersReducedMotion } from './ease.js';

// Rolagem animada para links internos (#secao). Enquanto ela acontece, a página fica marcada
// com data-autoscroll: a trava da cena dos Poderes ignora essa rolagem e não "prende" no meio.
let raf = 0;

export const isAutoScrolling = () => document.documentElement.dataset.autoscroll === '1';

export function smoothScrollTo(targetY) {
  cancelAnimationFrame(raf);
  const root = document.documentElement;
  const go = () => {
    const startY = scrollY;
    const maxY = root.scrollHeight - innerHeight;
    const endY = clamp(targetY, 0, maxY);
    const dist = Math.abs(endY - startY);
    if (dist < 2 || prefersReducedMotion()) {
      scrollTo(0, endY);
      return;
    }
    const duration = clamp(700 + dist * 0.11, 900, 2600);
    root.dataset.autoscroll = '1';
    root.classList.remove('scrub-lock');
    const t0 = performance.now();
    const step = (now) => {
      const t = clamp((now - t0) / duration);
      scrollTo(0, startY + (endY - startY) * easeInOutCubic(t));
      if (t < 1) raf = requestAnimationFrame(step);
      else delete root.dataset.autoscroll;
    };
    raf = requestAnimationFrame(step);
  };
  // se o menu estava aberto (página travada), espera ele fechar antes de rolar
  let tries = 0;
  const wait = () => {
    if (document.body.classList.contains('is-locked') && tries++ < 60) raf = requestAnimationFrame(wait);
    else go();
  };
  wait();
}

/** Liga a rolagem animada em todos os links "#..." da página. */
export function enableSmoothAnchors() {
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const href = a.getAttribute('href');
    e.preventDefault();
    if (href === '#') return smoothScrollTo(0);
    const el = document.querySelector(href);
    if (el) smoothScrollTo(el.getBoundingClientRect().top + scrollY);
  };
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
