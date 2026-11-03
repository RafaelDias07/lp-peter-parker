import { useEffect, useMemo, useState } from 'react';
import { LOCAL_SPIDER } from '../lib/spider.js';
import { PHOTO, MASK, REF_TO_PHOTO } from '../lib/align.js';

export function SplitText({ text, delay = 0, step = 40 }) {
  return (
    <span className="split" aria-label={text}>
      {[...text].map((ch, i) => (
        <span key={i} className="split-mask" aria-hidden="true">
          <span className="split-char" style={{ '--d': `${delay + i * step}ms` }}>{ch}</span>
        </span>
      ))}
    </span>
  );
}

export function Header({ onReplay, onMenu, logoPaintRef }) {
  return (
    <header className="topbar">
      <a href="#" className="logo" aria-label="Peter Parker">
        <span className="logo-peter"><SplitText text="PETER" delay={100} /></span>
        <span className="logo-parker"><SplitText text="PARKER" delay={220} /></span>
        {/* O pincel revela "HOMEM ARANHA" aqui, só onde pintar (desenhado pelo PaintCanvas) */}
        <canvas ref={logoPaintRef} className="logo-paint" aria-hidden="true" />
        <span className="logo-drop" aria-hidden="true">
          <i className="logo-thread" />
          <MiniSpider className="logo-spider" />
        </span>
      </a>

      <button className="monogram reveal" style={{ '--d': '350ms' }} onClick={onReplay} title="Rever a intro">
        PP
      </button>

      <nav className="actions">
        <a href="#vida" className="btn-shop reveal" style={{ '--d': '450ms' }}>
          <span className="btn-fill" />
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 3.5v17" />
            <path d="M12 3.5a8.5 8.5 0 0 0 0 17z" fill="currentColor" />
          </svg>
          <span>VIDA DUPLA</span>
        </a>
        <button className="btn-menu reveal" style={{ '--d': '520ms' }} onClick={onMenu} aria-label="Abrir menu">
          <i /><i />
        </button>
      </nav>
    </header>
  );
}

export function MiniSpider({ className }) {
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      <path d={LOCAL_SPIDER} />
    </svg>
  );
}

export function Ticket() {
  return (
    <aside className="ticket reveal" style={{ '--d': '650ms' }}>
      <span className="ticket-tab">ESTA NOITE</span>
      <div className="ticket-body">
        <div className="ticket-row">
          <svg viewBox="0 0 90 30" className="wave" aria-hidden="true">
            <path d="M2 20 H18 C26 20 28 8 38 8 S50 20 58 14 L64 10" />
            <circle cx="2" cy="20" r="2" /><circle cx="10" cy="20" r="2" />
            <circle cx="70" cy="10" r="2.4" /><circle cx="78" cy="10" r="2.4" /><circle cx="86" cy="10" r="2.4" />
          </svg>
          <small>QUEENS</small>
        </div>
        <div className="ticket-row">
          <div className="mini-spider"><span>{'{'}</span><MiniSpider /><span>{'}'}</span></div>
          <small>SEU VIZINHO<br />DO QUEENS</small>
        </div>
      </div>
    </aside>
  );
}

export function Coords() {
  const [time, setTime] = useState('--:--:--');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="coords reveal" style={{ '--d': '750ms' }}>
      <span>40.7282° N — 73.7949° W</span>
      <span>QUEENS, NY · <b>{time}</b></span>
    </div>
  );
}

/** Teia sutil no fundo, desenhada traço a traço quando a home aparece. */
export function WebLines() {
  const paths = useMemo(() => {
    const cx = 500;
    const cy = 470;
    const spokes = 18;
    const out = [];
    const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + 0.08);
    angles.forEach((a) => out.push(`M${cx} ${cy}L${cx + Math.cos(a) * 900} ${cy + Math.sin(a) * 900}`));
    [70, 140, 230, 340, 470, 620].forEach((r) => {
      let d = '';
      angles.forEach((a, i) => {
        const b = angles[(i + 1) % spokes];
        const p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
        const q = [cx + Math.cos(b) * r, cy + Math.sin(b) * r];
        const mid = (a + b) / 2 + (i === spokes - 1 ? Math.PI : 0);
        const c = [cx + Math.cos(mid) * r * 0.86, cy + Math.sin(mid) * r * 0.86];
        d += `${i === 0 ? `M${p[0]} ${p[1]}` : ''}Q${c[0]} ${c[1]} ${q[0]} ${q[1]}`;
      });
      out.push(d);
    });
    return out;
  }, []);

  return (
    <svg className="web" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} pathLength="1" style={{ '--d': `${200 + i * 45}ms` }} />
      ))}
    </svg>
  );
}

export function Menu({ open, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  const items = [['Início', '#'], ['Poderes', '#poderes'], ['Queens à noite', '#queens'], ['A vida dupla', '#vida'], ['Boa noite, Queens', '#boa-noite']];
  return (
    <div className={`menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="menu-close" onClick={onClose}>FECHAR ✕</button>
      <MiniSpider className="menu-spider" />
      <ul>
        {items.map(([item, href], i) => (
          <li key={item} style={{ '--d': `${250 + i * 70}ms` }}>
            <a href={href} onClick={onClose}><em>0{i + 1}</em>{item}</a>
          </li>
        ))}
      </ul>
      <p style={{ '--d': '600ms' }}>Com grandes poderes vêm grandes responsabilidades.</p>
    </div>
  );
}

// ---------- Contorno discreto da máscara sobre o rosto real ----------
// Desenhado em pixels da imagem da máscara e posicionado com o mesmo alinhamento
// do PaintCanvas (lib/align.js), então acompanha qualquer troca de foto.
const MIRROR_X = 1042;
const LENS_OUTER = [[640, 462], [680, 540], [760, 605], [860, 688], [930, 768], [975, 822], [948, 872],
  [900, 925], [835, 962], [755, 955], [682, 902], [632, 808], [612, 690], [618, 562]];
const LENS_INNER = [[662, 636], [760, 664], [850, 722], [905, 802], [862, 858], [790, 880], [712, 846],
  [668, 770], [656, 690]];
const FACE_WEB = [[1060, 140], [770, 260], [1320, 260], [560, 1000], [1520, 1000], [1045, 1420]];
const WEB_CENTER = [1040, 835];

/** Curva Catmull-Rom fechada → path SVG com cúbicas. */
function smoothClosed(pts) {
  const n = pts.length;
  const p = (i) => pts[(i + n) % n];
  let d = `M${p(0)[0]} ${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} `
      + `${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return `${d}Z`;
}
const mirror = (pts) => pts.map(([x, y]) => [2 * MIRROR_X - x, y]);

export function FaceLines() {
  const lenses = [LENS_OUTER, LENS_INNER, mirror(LENS_OUTER), mirror(LENS_INNER)].map(smoothClosed);
  const [cx, cy] = WEB_CENTER;
  const { s, tx, ty } = REF_TO_PHOTO;
  const web = FACE_WEB.map(([x, y]) => `M${cx} ${cy}Q${(cx + x) / 2 + (y - cy) * 0.06} ${(cy + y) / 2} ${x} ${y}`);
  return (
    <svg className="face-lines" viewBox={`0 0 ${PHOTO.w} ${PHOTO.h}`} aria-hidden="true">
      <g transform={`matrix(${s} 0 0 ${s} ${tx} ${ty}) translate(${MASK.refAnchor.join(' ')}) scale(${MASK.scale}) translate(${-MASK.anchor[0]} ${-MASK.anchor[1]})`}>
        {web.map((d, i) => (
          <path key={`w${i}`} d={d} pathLength="1" className="face-web" style={{ '--d': `${1500 + i * 80}ms` }} />
        ))}
        {lenses.map((d, i) => (
          <path key={`l${i}`} d={d} pathLength="1" style={{ '--d': `${900 + (i % 2) * 250 + (i > 1 ? 120 : 0)}ms` }} />
        ))}
      </g>
    </svg>
  );
}
