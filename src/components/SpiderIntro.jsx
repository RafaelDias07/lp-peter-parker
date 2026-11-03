import { useLayoutEffect, useRef } from 'react';
import { spiderPath, coverScale } from '../lib/spider.js';
import {
  clamp, smooth, easeOutBack, easeOutCubic, easeInOutCubic, easeInOutSine, prefersReducedMotion,
} from '../lib/ease.js';

// Linha do tempo (ms)
const APPEAR = 900;     // aranha surge
const HOLD = 1500;      // brilho passa pela aranha prateada
const ANTICIPATE = 1750; // encolhe um pouco antes do salto
const ZOOM_END = 4300;  // atravessou a tela

/**
 * Tela vermelha + aranha. A home inteira fica recortada (clip-path) no formato
 * da aranha; conforme ela cresce, o Peter aparece por dentro até a aranha "sair" da tela.
 */
export default function SpiderIntro({ homeRef, photoRef, onDone }) {
  const fx = useRef({});
  const loaderRef = useRef(null);
  const loaderNum = useRef(null);
  const bgRef = useRef(null);

  useLayoutEffect(() => {
    const home = homeRef.current;
    const photo = photoRef.current;
    const { body, shine, shineGrad, outline, g1, g2, g3, svg } = fx.current;

    const finish = () => {
      home.style.clipPath = 'none';
      photo.style.transform = '';
      onDone();
    };

    if (prefersReducedMotion()) {
      finish();
      return undefined;
    }

    let vw = innerWidth;
    let vh = innerHeight;
    let sEnd = coverScale(vw, vh) * 1.08;
    const onResize = () => {
      vw = innerWidth;
      vh = innerHeight;
      sEnd = coverScale(vw, vh) * 1.08;
    };
    addEventListener('resize', onResize);

    let raf = 0;
    let t0 = 0;

    const frame = (now) => {
      if (!t0) t0 = now;
      const t = now - t0;
      const cx = vw / 2;
      const cy = vh / 2;
      const s0 = (Math.min(vw, vh) * 0.15) / 200;
      svg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);

      let s = s0;
      let rot = 0;
      let silver = 1;
      let shineP = -1;
      let line = 0;
      let photoScale = 1.2;

      if (t < APPEAR) {
        const p = t / APPEAR;
        s = s0 * (0.35 + 0.65 * easeOutBack(p));
        rot = -0.3 * (1 - easeOutCubic(p));
        silver = easeOutCubic(p);
      } else if (t < HOLD) {
        const p = (t - APPEAR) / (HOLD - APPEAR);
        s = s0 * (1 + 0.025 * Math.sin(p * Math.PI));
        shineP = p;
      } else if (t < ANTICIPATE) {
        const p = (t - HOLD) / (ANTICIPATE - HOLD);
        s = s0 * (1 - 0.1 * easeInOutSine(p));
      } else {
        // Zoom em escala logarítmica: cada frame multiplica o tamanho, então o
        // movimento parece constante mesmo indo de 120px para 15.000px.
        const p = clamp((t - ANTICIPATE) / (ZOOM_END - ANTICIPATE));
        const e = easeInOutCubic(p);
        const from = Math.log(s0 * 0.9);
        s = Math.exp(from + (Math.log(sEnd) - from) * e);
        silver = 1 - smooth(0.02, 0.28, p);
        line = smooth(0.1, 0.3, p) * (1 - smooth(0.7, 0.94, p));
        photoScale = 1.2 - 0.2 * easeOutCubic(p);
      }

      const d = spiderPath({ cx, cy, s, rot });
      home.style.clipPath = `path(nonzero, '${d}')`;
      photo.style.transform = `scale(${photoScale})`;

      body.setAttribute('d', d);
      body.style.opacity = silver;

      shine.setAttribute('d', d);
      shine.style.opacity = shineP >= 0 ? Math.sin(shineP * Math.PI) : 0;
      if (shineP >= 0) {
        const w = 200 * s;
        const center = cx - w / 2 + (shineP * 1.6 - 0.3) * w;
        shineGrad.setAttribute('x1', center - w * 0.25);
        shineGrad.setAttribute('x2', center + w * 0.25);
        shineGrad.setAttribute('y1', cy - w);
        shineGrad.setAttribute('y2', cy + w);
      }

      // Contornos + "rastros" do zoom (as cópias atrasadas dão a sensação de velocidade)
      outline.setAttribute('d', d);
      outline.style.opacity = line;
      outline.style.strokeWidth = 1.6 * s;
      [[g1, 0.93, 0.5], [g2, 0.86, 0.3], [g3, 0.78, 0.16]].forEach(([g, k, o]) => {
        g.setAttribute('d', spiderPath({ cx, cy, s: s * k, rot }));
        g.style.opacity = line * o;
        g.style.strokeWidth = 1.2 * s * k;
      });

      loaderNum.current.textContent = String(Math.min(100, Math.floor((t / HOLD) * 100))).padStart(3, '0');
      loaderRef.current.classList.toggle('is-out', t > HOLD + 80);
      bgRef.current.style.transform = `scale(${1 + 0.08 * smooth(ANTICIPATE, ZOOM_END, t)})`;

      if (t >= ZOOM_END) finish();
      else raf = requestAnimationFrame(frame);
    };

    // Primeiro frame síncrono: evita piscar a home inteira antes do rAF.
    frame(performance.now());
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
    };
  }, [homeRef, photoRef, onDone]);

  const set = (k) => (el) => { fx.current[k] = el; };

  return (
    <>
      <div className="intro-bg" ref={bgRef} />

      <svg className="spider-fx" ref={set('svg')} aria-hidden="true">
        <defs>
          <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf3f3" />
            <stop offset=".55" stopColor="#dccfcf" />
            <stop offset="1" stopColor="#a39494" />
          </linearGradient>
          <linearGradient id="shine" ref={set('shineGrad')} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <filter id="drop" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#4a0000" floodOpacity=".5" />
          </filter>
        </defs>
        <path ref={set('g3')} className="ghost" />
        <path ref={set('g2')} className="ghost" />
        <path ref={set('g1')} className="ghost" />
        <path ref={set('outline')} className="outline" />
        <path ref={set('body')} fill="url(#silver)" filter="url(#drop)" />
        <path ref={set('shine')} fill="url(#shine)" />
      </svg>

      <div className="loader" ref={loaderRef}>
        <span>TECENDO A TEIA</span>
        <b ref={loaderNum}>000</b>
      </div>
    </>
  );
}
