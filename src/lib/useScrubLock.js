import { useEffect, useRef } from 'react';
import { clamp, prefersReducedMotion } from './ease.js';
import { isAutoScrolling } from './smoothScroll.js';

/**
 * Trava a página quando a seção encosta no topo e usa a rolagem (roda, trackpad,
 * toque e teclado) só para avançar/voltar a cena — no estilo "scroll-locked video hero".
 * No fim (ou no começo) a trava solta e a página segue normalmente; voltando para a
 * seção, ela trava de novo e a cena roda ao contrário.
 *
 * Retorna um ref { target, current, locked }: `current` é o progresso suavizado (0–1).
 */
export default function useScrubLock(sectionRef, { distance = 4200, enabled = true } = {}) {
  const state = useRef({ target: 0, current: 0, locked: false });

  useEffect(() => {
    const st = state.current;
    if (prefersReducedMotion()) {
      st.target = st.current = 1;
      return undefined;
    }
    if (!enabled) return undefined;

    const top = () => sectionRef.current.getBoundingClientRect().top + scrollY;
    const root = document.documentElement;
    let lastY = scrollY;

    const lock = () => {
      st.locked = true;
      root.classList.add('scrub-lock');
      scrollTo(0, top());
      lastY = scrollY;
    };
    const unlock = () => {
      st.locked = false;
      root.classList.remove('scrub-lock');
    };

    /** Aplica um "empurrão" na cena. Retorna true se consumiu o evento. */
    const feed = (dy) => {
      if (!st.locked) return false;
      const next = st.target + dy / distance;
      // solta só quando a cena já terminou de verdade (o suavizado chegou junto)
      if (dy > 0 && st.target >= 1 && st.current > 0.985) { unlock(); return false; }
      if (dy < 0 && st.target <= 0 && st.current < 0.015) { unlock(); return false; }
      st.target = clamp(next);
      return true;
    };

    // Parado exatamente no topo da seção (ex.: ela é a última da página) e mexendo
    // no sentido que ainda tem cena para rodar → trava de novo.
    const relockAtEdge = (dy) => {
      if (isAutoScrolling()) return;
      if (st.locked || document.body.classList.contains('is-locked')) return;
      if (Math.abs(scrollY - top()) > 2) return;
      if ((dy < 0 && st.target > 0) || (dy > 0 && st.target < 1)) lock();
    };

    const onWheel = (e) => {
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      relockAtEdge(dy);
      if (feed(dy)) e.preventDefault();
    };

    let touchY = 0;
    const onTouchStart = (e) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchMove = (e) => {
      const y = e.touches[0]?.clientY ?? touchY;
      const dy = (touchY - y) * 2.2;
      touchY = y;
      relockAtEdge(dy);
      if (feed(dy)) e.preventDefault();
    };

    const KEYS = { ArrowDown: 140, ArrowUp: -140, PageDown: 600, PageUp: -600, ' ': 600 };
    const onKey = (e) => {
      let dy = KEYS[e.key];
      if (dy === undefined) return;
      if (e.key === ' ' && e.shiftKey) dy = -dy;
      relockAtEdge(dy);
      if (feed(dy)) e.preventDefault();
    };

    // Detecta a entrada na seção (descendo ou subindo) e mantém a página presa enquanto trava
    const onScroll = () => {
      const y = scrollY;
      const t = top();
      // rolagem animada de um link interno: só passa pela seção, sem travar
      if (isAutoScrolling()) {
        if (st.locked) unlock();
        lastY = y;
        return;
      }
      // Salto grande (âncora do menu, "voltar ao topo", arrastar a barra de rolagem) não é
      // rolagem: não trava ao passar pela seção e, se estava travado, solta.
      if (Math.abs(y - lastY) > innerHeight * 1.2) {
        if (st.locked) unlock();
        lastY = y;
        return;
      }
      if (st.locked) {
        if (Math.abs(y - t) > 1) scrollTo(0, t);
      } else if (!document.body.classList.contains('is-locked')) {
        if (lastY < t - 1 && y >= t - 1 && st.target < 1) lock();
        else if (lastY > t + 1 && y <= t + 1 && st.target > 0) lock();
      }
      lastY = scrollY;
    };

    addEventListener('wheel', onWheel, { passive: false });
    addEventListener('touchstart', onTouchStart, { passive: true });
    addEventListener('touchmove', onTouchMove, { passive: false });
    addEventListener('keydown', onKey);
    addEventListener('scroll', onScroll, { passive: true });

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      st.current += (st.target - st.current) * 0.1;
      if (Math.abs(st.target - st.current) < 0.0005) st.current = st.target;
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('wheel', onWheel);
      removeEventListener('touchstart', onTouchStart);
      removeEventListener('touchmove', onTouchMove);
      removeEventListener('keydown', onKey);
      removeEventListener('scroll', onScroll);
      unlock();
    };
  }, [sectionRef, distance, enabled]);

  return state;
}
