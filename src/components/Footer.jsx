import { useEffect, useRef, useState } from 'react';
import { clamp, lerp } from '../lib/ease.js';
import { LOCAL_SPIDER } from '../lib/spider.js';

// Troque aqui pelos seus dados reais.
const AUTHOR = 'Rafael Dias';
const CONTACTS = [
  ['LinkedIn', 'https://www.linkedin.com/in/rafael-dias-fontes-2a947b3a7/'],
  ['GitHub', 'https://github.com/RafaelDias07/CP5-Frontend'],
];
const NAV = [
  ['Início', '#'],
  ['Poderes', '#poderes'],
  ['Queens à noite', '#queens'],
  ['A vida dupla', '#vida'],
  ['Boa noite, Queens', '#boa-noite'],
];

function WebCorner({ flip }) {
  const spokes = 7;
  const lines = Array.from({ length: spokes }, (_, i) => {
    const a = (i / (spokes - 1)) * (Math.PI / 2);
    return `M0 0L${Math.cos(a) * 260} ${Math.sin(a) * 260}`;
  }).join('');
  const rings = [40, 80, 125, 175, 230].map((r) => {
    let d = '';
    for (let i = 0; i < spokes - 1; i++) {
      const a = (i / (spokes - 1)) * (Math.PI / 2);
      const b = ((i + 1) / (spokes - 1)) * (Math.PI / 2);
      const m = (a + b) / 2;
      d += `${i === 0 ? `M${Math.cos(a) * r} ${Math.sin(a) * r}` : ''}Q${Math.cos(m) * r * 0.84} ${Math.sin(m) * r * 0.84} ${Math.cos(b) * r} ${Math.sin(b) * r}`;
    }
    return d;
  }).join('');
  return (
    <svg className={`ft-web ${flip ? 'ft-web--r' : ''}`} viewBox="0 0 260 260" aria-hidden="true">
      <path d={lines + rings} />
    </svg>
  );
}

export default function Footer({ onTop }) {
  const footRef = useRef(null);
  const dropRef = useRef(null);
  const giantRef = useRef(null);
  const [climbing, setClimbing] = useState(false);

  // A aranha pendurada segue o mouse (pêndulo) e a palavra gigante se pinta de vermelho
  useEffect(() => {
    const m = { x: innerWidth * 0.5, tx: innerWidth * 0.5, vx: 0, py: -9999, px: -9999 };
    const onMove = (e) => {
      m.tx = e.clientX;
      m.px = e.clientX;
      m.py = e.clientY;
    };
    addEventListener('pointermove', onMove);
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const prev = m.x;
      m.x = lerp(m.x, m.tx, 0.06);
      m.vx = lerp(m.vx, m.x - prev, 0.25);
      // o "pincel" vermelho é recalculado a cada quadro: acompanha também quando a página rola
      const g = giantRef.current;
      if (g) {
        const r = g.getBoundingClientRect();
        g.style.setProperty('--mx', `${m.px - r.left}px`);
        g.style.setProperty('--my', `${m.py - r.top}px`);
      }
      const el = dropRef.current;
      if (el) el.style.transform = `translateX(${m.x}px) rotate(${clamp(-m.vx * 1.4, -22, 22)}deg)`;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, []);

  const goTop = () => {
    if (climbing) return;
    setClimbing(true);
    setTimeout(() => {
      setClimbing(false);
      onTop?.();
    }, 900);
  };

  return (
    <footer className="ft" ref={footRef}>
      <WebCorner />
      <WebCorner flip />

      <div className={`ft-drop-rail ${climbing ? 'is-climbing' : ''}`}>
        <div className="ft-drop" ref={dropRef}>
          <i className="ft-thread" />
          <button className="ft-spider" onClick={goTop} aria-label="Voltar ao começo">
            <svg viewBox="0 0 200 240"><path d={LOCAL_SPIDER} /></svg>
          </button>
          <span className="ft-spider-tip">sobe pelo fio</span>
        </div>
      </div>

      <div className="ft-grid">
        <div className="ft-brand">
          <div className="ft-logo"><span>PETER</span><b>PARKER</b></div>
          <p>Seu vizinho do Queens. Fotógrafo de dia, tapa-buraco de telhado à noite.</p>
        </div>

        <nav className="ft-col" aria-label="Navegar">
          <h4>Navegar</h4>
          {NAV.map(([t, h]) => <a key={t} href={h}>{t}</a>)}
        </nav>

        <div className="ft-col">
          <h4>Contato</h4>
          {CONTACTS.map(([t, h]) => <a key={t} href={h} target="_blank" rel="noopener noreferrer">{t} ↗</a>)}
        </div>

        <div className="ft-note" aria-hidden="true">
          <i className="ft-tape" />
          obrigado por ler as anotações do Peter.
          <span>volte sempre ♥</span>
        </div>
      </div>

      {/* Contorno só da borda externa (as letras da fonte têm formas sobrepostas que o text-stroke riscaria) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="ftOutline" x="-4%" y="-25%" width="108%" height="150%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.4" result="grown" />
          <feComposite in="grown" in2="SourceAlpha" operator="out" result="ring" />
          <feFlood floodColor="#ffffff" floodOpacity=".34" result="ink" />
          <feComposite in="ink" in2="ring" operator="in" />
        </filter>
      </svg>
      <div className="ft-giant" ref={giantRef} aria-hidden="true">
        <span className="ft-giant-line">PETER PARKER</span>
        <span className="ft-giant-red">PETER PARKER</span>
      </div>

      <div className="ft-bar">
        <span>© 2026 · Atividade 3 — Front-end Design · FIAP · feito por {AUTHOR}</span>
        <span>Projeto acadêmico.</span>
      </div>
    </footer>
  );
}
