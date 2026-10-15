import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clamp, lerp, smooth, easeOutCubic, easeInOutCubic, prefersReducedMotion } from '../lib/ease.js';
import { LOCAL_SPIDER, VIEW } from '../lib/spider.js';
import Segments from './Segments.jsx';

/*
 * 05 — BOA NOITE, QUEENS.
 * Queens à noite, em traço claro. Rolando, um farol liga no alto de um prédio e varre o
 * céu; o feixe encontra as nuvens e projeta o sinal da aranha. Aí vem a frase final.
 *
 *   0.04–0.30  o farol liga e varre o céu
 *   0.30–0.52  o feixe converge e o sinal da aranha se acende nas nuvens
 *   0.50–0.60  pulso de luz; as janelas da cidade acendem
 *   0.58–0.90  a frase final aparece
 */

function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Cidade em pixels para o tamanho atual da tela (determinística por seed). */
function makeCity(vw, vh, seed, { minH, maxH, wMin, wMax, blink = false }) {
  const rnd = rng(seed);
  const buildings = [];
  const wins = [];
  let x = -20;
  while (x < vw + 20) {
    const w = wMin + rnd() * (wMax - wMin);
    const h = vh * (minH + rnd() * rnd() * (maxH - minH));
    buildings.push([x, vh - h, w, h]);
    for (let wy = vh - h + 12; wy < vh - 8; wy += 14) {
      for (let wx = x + 8; wx < x + w - 8; wx += 12) {
        if (rnd() < 0.2) wins.push([wx, wy, blink && rnd() < 0.16]);
      }
    }
    x += w + rnd() * 5;
  }
  return { buildings, wins };
}

/** Textura de nuvem (fbm de value-noise) gerada uma vez num canvas → dataURL (alpha = densidade). */
function makeCloudTexture(w = 256, h = 256, seed = 5) {
  const rnd = rng(seed);
  const G = 64;
  const grid = Array.from({ length: G * G }, () => rnd());
  const val = (x, y) => {
    const xi = Math.floor(x); const yi = Math.floor(y);
    const xf = x - xi; const yf = y - yi;
    const at = (i, j) => grid[((j % G + G) % G) * G + ((i % G + G) % G)];
    const sx = xf * xf * (3 - 2 * xf); const sy = yf * yf * (3 - 2 * yf);
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
    return a + (b - a) * sy;
  };
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const img = x.createImageData(w, h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let v = 0; let amp = 0.55; let f = 4 / w;
      for (let o = 0; o < 5; o++) { v += amp * val(i * f * 16 / 4, j * f * 16 / 4); amp *= 0.5; f *= 2; }
      const d = Math.max(0, Math.min(1, (v - 0.32) * 1.9));
      const k = (j * w + i) * 4;
      img.data[k] = 255; img.data[k + 1] = 255; img.data[k + 2] = 255; img.data[k + 3] = d * 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c.toDataURL();
}

const MOTES = Array.from({ length: 46 }, (_, i) => {
  const r = rng(101 + i);
  return { t: r(), off: r() * 2 - 1, sp: 0.02 + r() * 0.05, size: 0.6 + r() * 1.6, tw: r() * 6 };
});

function makeStars(vw, vh) {
  const rnd = rng(23);
  return Array.from({ length: 90 }, () => [rnd() * vw, rnd() * vh * 0.62, 0.6 + rnd() * 1.4, rnd() * 4]);
}

export default function FinalSection() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const beamRefs = useRef([]);
  const beamGradRef = useRef(null);
  const drumRef = useRef(null);
  const moteRefs = useRef([]);
  const discHaloRef = useRef(null);
  const discTexRef = useRef(null);
  const discMaskRef = useRef(null);
  const lampGlowRef = useRef(null);
  const discRef = useRef(null);
  const signRef = useRef(null);
  const cloudRef = useRef(null);
  const cityRef = useRef(null);
  const lineRefs = useRef([]);
  const subRef = useRef(null);
  const [geo, setGeo] = useState(null);
  const [cloudTex] = useState(() => makeCloudTexture());

  useLayoutEffect(() => {
    const measure = () => {
      const r = stageRef.current.getBoundingClientRect();
      const vw = r.width;
      const vh = r.height;
      const back = makeCity(vw, vh, 3, { minH: 0.1, maxH: 0.36, wMin: 44, wMax: 96 });
      const front = makeCity(vw, vh, 8, { minH: 0.05, maxH: 0.2, wMin: 40, wMax: 92, blink: true });
      // prédio do farol: o mais próximo de 80% da largura, mais alto que os vizinhos
      let k = 0;
      front.buildings.forEach((b, i) => {
        if (Math.abs(b[0] + b[2] / 2 - vw * 0.8) < Math.abs(front.buildings[k][0] + front.buildings[k][2] / 2 - vw * 0.8)) k = i;
      });
      const [bx, , bw] = front.buildings[k];
      const h = vh * 0.26;
      front.buildings[k] = [bx, vh - h, bw, h];
      front.wins = front.wins.filter(([wx, wy]) => !(wx > bx && wx < bx + bw && wy < vh - h + 6));
      const lamp = [bx + bw / 2, vh - h];
      setGeo({ vw, vh, back, front, lamp, stars: makeStars(vw, vh), T: [vw * 0.47, vh * 0.25] });
    };
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!geo) return undefined;
    const reduced = prefersReducedMotion();
    const { vw, vh, lamp, T } = geo;
    let raf = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom < -50 || rect.top > innerHeight + 50) return;
      const p = reduced ? 1 : clamp(-rect.top / (rect.height - vh));

      // ---------- Farol: varre o céu e para no alvo ----------
      const on = smooth(0.04, 0.12, p);
      const sweep = Math.sin(clamp(p / 0.34) * Math.PI * 2.2 + 0.6);
      const settle = easeInOutCubic(clamp((p - 0.3) / 0.22));
      const ex = lerp(vw * (0.5 + sweep * 0.32), T[0], settle);
      const ey = lerp(vh * (0.16 + 0.07 * Math.cos(p * 18)), T[1], settle);
      const hit = easeOutCubic(clamp((p - 0.3) / 0.22));
      const pulse = 1 + 0.06 * Math.sin(clamp((p - 0.5) / 0.1) * Math.PI);
      const R = vh * 0.19 * Math.max(0.0001, hit) * pulse;
      const [lx, ly0] = lamp;
      const ang = Math.atan2(ey - (ly0 - 20), ex - lx);
      // lente na boca do tambor (que gira apontando para o alvo)
      const hx = lx + Math.cos(ang) * 22;
      const hy = ly0 - 20 + Math.sin(ang) * 22;
      drumRef.current.setAttribute('transform', `translate(${lx} ${ly0 - 20}) rotate(${(ang * 180) / Math.PI})`);
      // largura do feixe no fim: abre do tamanho da lente até o disco
      const L = Math.hypot(ex - hx, ey - hy);
      const nx = -Math.sin(ang); const ny = Math.cos(ang);
      const wEnd = lerp(vw * 0.045, R * 0.98, hit);
      [[1.9, 7], [1, 4.5], [0.38, 2]].forEach(([k, w0], i) => {
        const el = beamRefs.current[i];
        const we = wEnd * k;
        el.setAttribute('points', `${hx + nx * w0},${hy + ny * w0} ${hx - nx * w0},${hy - ny * w0} ${ex - nx * we},${ey - ny * we} ${ex + nx * we},${ey + ny * we}`);
        el.style.opacity = on;
      });
      beamGradRef.current.setAttribute('x1', hx);
      beamGradRef.current.setAttribute('y1', hy);
      beamGradRef.current.setAttribute('x2', ex);
      beamGradRef.current.setAttribute('y2', ey);
      lampGlowRef.current.setAttribute('cx', hx);
      lampGlowRef.current.setAttribute('cy', hy);
      lampGlowRef.current.style.opacity = on;

      // poeira flutuando dentro do feixe
      const tsec = now / 1000;
      MOTES.forEach((m, i) => {
        const el = moteRefs.current[i];
        if (!el) return;
        const t = (m.t + tsec * m.sp) % 1;
        const w = lerp(4, wEnd, t) * m.off * 0.85;
        el.setAttribute('cx', hx + (ex - hx) * t + nx * w);
        el.setAttribute('cy', hy + (ey - hy) * t + ny * w);
        el.style.opacity = on * (0.25 + 0.55 * Math.abs(Math.sin(tsec * 1.3 + m.tw))) * (1 - t * 0.6);
      });
      void L;

      // ---------- Sinal da aranha projetado nas nuvens ----------
      const discT = `translate(${T[0]} ${T[1]})`;
      discRef.current.setAttribute('rx', R);
      discRef.current.setAttribute('ry', R * 0.93);
      discRef.current.style.opacity = hit;
      discHaloRef.current.setAttribute('r', R * 1.55);
      discHaloRef.current.style.opacity = hit * 0.55;
      discTexRef.current.setAttribute('x', T[0] - R * 1.1);
      discTexRef.current.setAttribute('y', T[1] - R * 1.1);
      discTexRef.current.setAttribute('width', R * 2.2);
      discTexRef.current.setAttribute('height', R * 2.2);
      discMaskRef.current.setAttribute('rx', R);
      discMaskRef.current.setAttribute('ry', R * 0.93);
      const sp = easeOutCubic(clamp((p - 0.38) / 0.16));
      const sc = (R * 1.5) / VIEW.h;
      signRef.current.setAttribute('transform', `${discT} scale(${sc}) translate(${-VIEW.w / 2} ${-VIEW.h / 2})`);
      signRef.current.style.opacity = sp * 0.92;
      cloudRef.current.style.opacity = hit;
      cloudRef.current.style.setProperty('--tx', `${(T[0] / vw) * 100}%`);
      cloudRef.current.style.setProperty('--ty', `${(T[1] / vh) * 100}%`);

      // cidade acende
      cityRef.current.style.setProperty('--lit', 0.35 + 0.65 * smooth(0.5, 0.65, p));

      // ---------- Frase final ----------
      // rádio: aparece e a frase vai sendo "transmitida"
      const rt = clamp((p - 0.58) / 0.1);
      const radio = lineRefs.current[0];
      radio.style.opacity = smooth(0, 0.25, rt);
      radio.style.setProperty('--type', clamp((rt - 0.15) / 0.85));
      // resposta: carimba na tela (escala de cima para baixo, com tranco)
      const ht = clamp((p - 0.7) / 0.08);
      const reply = lineRefs.current[1];
      reply.style.opacity = ht > 0 ? 1 : 0;
      reply.style.transform = `scale(${lerp(1.6, 1, easeOutCubic(ht))}) rotate(${lerp(-4, -1.5, ht)}deg)`;
      reply.style.filter = `blur(${(1 - ht) * 6}px)`;
      const st = easeOutCubic(clamp((p - 0.8) / 0.1));
      subRef.current.style.opacity = st;
      subRef.current.style.transform = `translateY(${(1 - st) * 16}px) rotate(-2deg)`;
      void now;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [geo]);

  return (
    <section className="finale" id="boa-noite" ref={sectionRef}>
      <div className="finale-stage" ref={stageRef}>
        <div className="finale-sky" />
        <div className="finale-clouds" ref={cloudRef} aria-hidden="true">
          <i style={{ backgroundImage: `url(${cloudTex})` }} />
          <i style={{ backgroundImage: `url(${cloudTex})` }} />
        </div>

        {geo && (
          <svg className="finale-svg" viewBox={`0 0 ${geo.vw} ${geo.vh}`} aria-hidden="true">
            <defs>
              <linearGradient id="beamGrad" ref={beamGradRef} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fffaf0" stopOpacity=".85" />
                <stop offset=".35" stopColor="#ffefcc" stopOpacity=".38" />
                <stop offset="1" stopColor="#ffe4b0" stopOpacity=".16" />
              </linearGradient>
              <radialGradient id="discGrad" cx=".5" cy=".46" r=".55">
                <stop offset="0" stopColor="#fffbef" />
                <stop offset=".6" stopColor="#fff0cc" />
                <stop offset=".86" stopColor="#ffdf9e" stopOpacity=".9" />
                <stop offset="1" stopColor="#ffd38a" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="haloGrad">
                <stop offset="0" stopColor="#ffe9bd" stopOpacity=".6" />
                <stop offset=".55" stopColor="#ffd9a0" stopOpacity=".18" />
                <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
              </radialGradient>
              <filter id="beamSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="14" /></filter>
              <filter id="beamMid" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4" /></filter>
              <filter id="beamCore" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" /></filter>
              <filter id="discEdge" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="3" /></filter>
              {/* projeção: o logo "deforma" de leve com a textura da nuvem e tem borda macia */}
              <filter id="projected" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="2" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="16" xChannelSelector="R" yChannelSelector="G" result="d" />
                <feGaussianBlur in="d" stdDeviation="1.1" />
              </filter>
              <mask id="discCloud" maskUnits="userSpaceOnUse">
                <ellipse ref={discMaskRef} cx={geo.T[0]} cy={geo.T[1]} rx="0.1" ry="0.1" fill="#fff" filter="url(#discEdge)" />
              </mask>
            </defs>

            {geo.stars.map(([x, y, r, d], i) => (
              <circle key={i} cx={x} cy={y} r={r} className="finale-star" style={{ animationDelay: `${d}s` }} />
            ))}

            {/* cidade ao fundo */}
            <g className="finale-city finale-city--back">
              {geo.back.buildings.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
              {geo.back.wins.map(([x, y], i) => <rect key={`w${i}`} x={x} y={y} width="3" height="4" className="fwin" />)}
            </g>

            {/* feixe: halo difuso, corpo e núcleo */}
            <g className="finale-beam">
              <polygon ref={(el) => { beamRefs.current[0] = el; }} fill="url(#beamGrad)" filter="url(#beamSoft)" opacity="0" />
              <polygon ref={(el) => { beamRefs.current[1] = el; }} fill="url(#beamGrad)" filter="url(#beamMid)" opacity="0" />
              <polygon ref={(el) => { beamRefs.current[2] = el; }} fill="url(#beamGrad)" filter="url(#beamCore)" opacity="0" />
            </g>
            <g className="finale-motes">
              {MOTES.map((m, i) => <circle key={i} r={m.size} ref={(el) => { moteRefs.current[i] = el; }} />)}
            </g>

            {/* disco de luz nas nuvens */}
            <circle ref={discHaloRef} cx={geo.T[0]} cy={geo.T[1]} r="0.1" fill="url(#haloGrad)" style={{ opacity: 0 }} />
            <g mask="url(#discCloud)">
              <ellipse ref={discRef} cx={geo.T[0]} cy={geo.T[1]} rx="0.1" ry="0.1" fill="url(#discGrad)" style={{ opacity: 0 }} />
              <image ref={discTexRef} href={cloudTex} preserveAspectRatio="none" className="finale-disc-tex" />
            </g>
            <g ref={signRef} style={{ opacity: 0 }} filter="url(#projected)"><path d={LOCAL_SPIDER} className="finale-sign" /></g>

            {/* cidade da frente + farol */}
            <g className="finale-city finale-city--front" ref={cityRef}>
              {geo.front.buildings.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
              {geo.front.wins.map(([x, y, b], i) => <rect key={`w${i}`} x={x} y={y} width="3.5" height="5" className={`fwin ${b ? 'is-blink' : ''}`} />)}
              {/* holofote: base + tambor que gira para o alvo */}
              <path d={`M${geo.lamp[0] - 18} ${geo.lamp[1]}l6 -12h24l6 12z`} className="finale-lamp" />
              <path d={`M${geo.lamp[0] - 10} ${geo.lamp[1] - 12}l10 -8 10 8`} className="finale-lamp-yoke" />
              <g ref={drumRef}>
                <rect x="-12" y="-11" width="34" height="22" rx="3" className="finale-lamp" />
                <rect x="18" y="-13" width="6" height="26" rx="2" className="finale-lamp-rim" />
              </g>
              <circle ref={lampGlowRef} cx={geo.lamp[0]} cy={geo.lamp[1] - 20} r="20" className="finale-lamp-glow" filter="url(#glow)" style={{ opacity: 0 }} />
            </g>
          </svg>
        )}

        <div className="finale-copy">
          {/* rádio da polícia chamando… */}
          <div className="radio" ref={(el) => { lineRefs.current[0] = el; }}>
            <div className="scanner" aria-label="Rádio da polícia, canal 7, 23:58">
              <i className="scanner-antenna" aria-hidden="true" />
              <i className="scanner-screw scanner-screw--l" aria-hidden="true" />
              <i className="scanner-screw scanner-screw--r" aria-hidden="true" />
              <div className="scanner-grille" aria-hidden="true" />
              <div className="scanner-lcd" aria-hidden="true">
                <div className="lcd-ch">
                  <span>CH</span>
                  <div className="lcd-digits">
                    <Segments value="88" className="lcd-ghost" />
                    <Segments value="07" className="lcd-on" />
                  </div>
                </div>
                <div className="lcd-mid">
                  <span className="lcd-freq">460.125<small>MHz</small></span>
                  <span className="lcd-tag">POLÍCIA · QUEENS · 23:58</span>
                </div>
                <div className="lcd-right">
                  <span className="lcd-bars"><i /><i /><i /><i /><i /></span>
                  <span className="lcd-rx">RX</span>
                </div>
              </div>
            </div>
            <p className="radio-line">“Ocorrência em Jackson Heights. Alguma unidade por perto?”</p>
          </div>
          {/* …e a resposta */}
          <h2 className="reply" ref={(el) => { lineRefs.current[1] = el; }} data-text="TÔ INDO.">TÔ INDO.</h2>
          <p className="finale-sub" ref={subRef}>boa noite, Queens. <b>— P.P.</b></p>
        </div>
      </div>
    </section>
  );
}
