import { useEffect, useRef, useState } from 'react';
import { clamp, lerp, prefersReducedMotion } from '../lib/ease.js';
import { LOCAL_SPIDER } from '../lib/spider.js';
import { DAY, NIGHT } from './VidaDoodles.jsx';

/*
 * 04 — A VIDA DUPLA.
 * O dia do Peter é uma folha de caderno por cima da noite do Homem-Aranha. A folha rasga
 * onde o mouse está (a aranha pendurada no fio é o puxador); rolando, os horários passam e
 * as duas vidas mudam juntas.
 */

const SCENES = [
  {
    time: '07:30', period: 'manhã',
    day: { head: 'Aula de química.', note: 'Dormi duas horas. A prova é hoje.' },
    night: { head: 'Costurando o traje.', note: 'Rasgou de novo na patrulha. Linha e agulha da tia May.' },
  },
  {
    time: '15:00', period: 'tarde',
    day: { head: 'Lição de casa.', note: 'Fórmula do fluido: quase certa. Entrega: ontem.' },
    night: { head: 'Testando a teia.', note: 'No telhado da escola. Ninguém vê. (O Ned viu.)' },
  },
  {
    time: '18:40', period: 'fim de tarde',
    day: { head: 'Jantar da tia May.', note: 'Já estou atrasado. De novo.' },
    night: { head: 'Pulando prédios.', note: 'Quatro quarteirões em 40 segundos, com a mochila nas costas.' },
  },
  {
    time: '23:47', period: 'noite',
    day: { head: 'Câmera na mão.', note: 'Fotos pro jornal. US$ 50 cada, se a foto prestar.' },
    night: { head: 'Patrulha em Queens.', note: 'Sirenes em Jackson Heights. Já é a terceira hoje.' },
  },
];

// Borda rasgada: ruído fixo, para a folha ter sempre o mesmo "recorte".
const TEAR = (() => {
  let s = 17;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 49 }, () => (rnd() - 0.5) * 1.5 + (rnd() - 0.5) * 0.9);
})();

const RANGE = [36, 64];

// Silhueta de Queens (desenhada em traço claro) com janelas acesas — gerada uma vez, sempre igual.
const CITY = (() => {
  let s = 91;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const buildings = [];
  const wins = [];
  let x = -10;
  while (x < 1010) {
    const w = 26 + rnd() * 52;
    const h = 38 + rnd() * rnd() * 150;
    buildings.push([x, 200 - h, w, h]);
    for (let wy = 200 - h + 10; wy < 192; wy += 12) {
      for (let wx = x + 7; wx < x + w - 7; wx += 11) {
        if (rnd() < 0.2) wins.push([wx, wy]);
      }
    }
    x += w + rnd() * 6;
  }
  return { buildings, wins };
})();

function Doodle({ children, kind }) {
  return (
    <svg className={`vd-doodle vd-doodle--${kind}`} viewBox="0 0 260 190" aria-hidden="true">
      <g filter="url(#pen)">{children}</g>
    </svg>
  );
}

export default function VidaSection() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const dayRef = useRef(null);
  const handleRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const m = { target: 50, x: 50, drag: false, t0: performance.now() };
    const toPct = (cx) => lerp(RANGE[0], RANGE[1], clamp(cx / innerWidth));

    const onMove = (e) => {
      if (e.pointerType !== 'mouse' && !m.drag) return;
      const r = stageRef.current.getBoundingClientRect();
      if (e.pointerType === 'mouse' && (e.clientY < r.top || e.clientY > r.bottom)) return;
      m.target = toPct(e.clientX);
      setMoved(true);
    };
    const onDown = (e) => { m.drag = true; e.target.setPointerCapture?.(e.pointerId); };
    const onUp = () => { m.drag = false; };
    addEventListener('pointermove', onMove);
    const h = handleRef.current;
    h.addEventListener('pointerdown', onDown);
    addEventListener('pointerup', onUp);

    let raf = 0;
    let last = -1;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom < -50 || rect.top > innerHeight + 50) return;

      const p = clamp(-rect.top / (rect.height - innerHeight));
      const i = reduced ? 0 : Math.min(SCENES.length - 1, Math.floor(p * SCENES.length));
      if (i !== last) { last = i; setIdx(i); }

      // sem mouse por perto a folha "respira" sozinha
      const drift = reduced || m.drag ? 0 : Math.sin((now - m.t0) / 1700) * 1.4;
      m.x = lerp(m.x, m.target + drift, 0.09);

      const pts = ['0 0'];
      for (let k = 0; k < TEAR.length; k++) pts.push(`${(m.x + TEAR[k]).toFixed(2)}% ${((k / (TEAR.length - 1)) * 100).toFixed(2)}%`);
      pts.push('0 100%');
      dayRef.current.style.clipPath = `polygon(${pts.join(',')})`;
      stageRef.current.style.setProperty('--x', `${m.x.toFixed(2)}%`);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      h.removeEventListener('pointerdown', onDown);
      removeEventListener('pointerup', onUp);
    };
  }, []);

  const goTo = (i) => {
    const s = sectionRef.current;
    const span = s.offsetHeight - innerHeight;
    scrollTo({ top: s.offsetTop + ((i + 0.5) / SCENES.length) * span, behavior: 'smooth' });
  };

  const sc = SCENES[idx];

  return (
    <section className="vida" id="vida" ref={sectionRef}>
      <div className="vida-stage" ref={stageRef} data-scene={idx}>
        {/* NOITE (embaixo, sempre inteira) */}
        <div className="vd-night">
          {SCENES.map((_, i) => <div key={i} className={`vd-night-sky vd-night-sky--${i} ${i === idx ? 'is-on' : ''}`} />)}
          <div className="vd-night-grid" />
          <div className="vd-moon" aria-hidden="true" />
          <svg className="vd-city" viewBox="0 0 1000 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <g filter="url(#pen)">
              {CITY.buildings.map(([bx, by, bw, bh], i) => (
                <rect key={i} x={bx} y={by} width={bw} height={bh} />
              ))}
            </g>
            {CITY.wins.map(([wx, wy], i) => <rect key={i} x={wx} y={wy} width="4" height="5" className="vd-win" />)}
          </svg>
          <div className="vd-copy vd-copy--night" key={`n${idx}`}>
            <span className="vd-who">o Homem-Aranha</span>
            <h3>{sc.night.head}</h3>
            <p>{sc.night.note}</p>
            <Doodle kind="night">{NIGHT[idx]}</Doodle>
          </div>
        </div>

        {/* DIA (folha de caderno por cima, rasgada onde está o mouse) */}
        <div className="vd-day-wrap">
          <div className="vd-day" ref={dayRef}>
            {SCENES.map((_, i) => <div key={i} className={`vd-day-sky vd-day-sky--${i} ${i === idx ? 'is-on' : ''}`} />)}
            <div className="vd-grid" />
            <div className="vd-copy vd-copy--day" key={`d${idx}`}>
              <span className="vd-who">o Peter</span>
              <h3>{sc.day.head}</h3>
              <p>{sc.day.note}</p>
              <Doodle kind="day">{DAY[idx]}</Doodle>
            </div>
          </div>
        </div>

        {/* Puxador: a aranha pendurada no fio que rasga a folha */}
        <div className="vd-thread" aria-hidden="true" />
        <button className="vd-handle" ref={handleRef} aria-label="Arraste para rasgar a folha">
          <svg viewBox="0 0 200 240"><path d={LOCAL_SPIDER} /></svg>
        </button>
        <span className={`vd-hint ${moved ? 'is-off' : ''}`}>mexa o mouse — rasgue a folha</span>

        {/* Relógio (mistura com o fundo para ler nos dois lados) */}
        <header className="vd-clock">
          <span className="vd-clock-side">Peter</span>
          <div className="vd-clock-time" key={sc.time}><b>{sc.time}</b><i>{sc.period}</i></div>
          <span className="vd-clock-side">Homem-Aranha</span>
        </header>

        <nav className="vd-ticks" aria-label="Horários do dia">
          {SCENES.map((s, i) => (
            <button key={s.time} className={i === idx ? 'is-on' : ''} onClick={() => goTo(i)}>{s.time}</button>
          ))}
        </nav>
      </div>
    </section>
  );
}
