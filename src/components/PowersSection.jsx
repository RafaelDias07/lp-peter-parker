import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useScrubLock from '../lib/useScrubLock.js';
import { createRush } from '../lib/cityRush.js';
import { NOTES, Note, PenFilter } from './PeterNotes.jsx';
import Segments from './Segments.jsx';
import {
  clamp, lerp, smooth, easeInOutCubic, easeOutCubic, easeOutBack,
} from '../lib/ease.js';

/*
 * 02 — PODERES: "o mergulho".
 * A página trava quando a seção encosta no topo (useScrubLock) e a rolagem passa a
 * controlar a cena (q = 0–1). No fim, destrava e segue.
 *
 *   0.00–0.14  tela preta, título se desfaz em blur; uma fresta abre a cena em tela cheia
 *   0.10–0.56  voo: a cena inteira e a câmera chegando até o rosto; luzes/chuva passam pela lente
 *   0.56–0.67  câmera lenta enquadrando o rosto inteiro
 *   0.68       THWIP — flash, tremor, fio sai do pulso e a teia voa até a tela
 *   0.72–0.80  cena escurece e desfoca atrás da teia
 *   0.76–0.95  título + cards chegam em 3D e grudam na teia
 */

const SCENE = {
  src: '/assets/dive.webp', // imagem girada para a horizontal: ele voa em direção à câmera
  w: 5232,
  h: 2944,
  // Câmera (sempre em tela cheia): [q, foco x, foco y, zoom sobre o "cover"]. Zoom sempre suave.
  camera: [
    [0.0, 0.5, 0.55, 1.3],   // a fresta abre já um pouco perto…
    [0.14, 0.5, 0.52, 1.06], // …e a câmera recua: cena inteira
    [0.36, 0.48, 0.47, 1.22], // vai chegando
    [0.56, 0.49, 0.4, 1.45], // rosto
    [0.66, 0.5, 0.38, 1.58], // câmera lenta: rosto inteiro, as duas lentes
    [0.71, 0.7, 0.3, 1.2],   // disparo: desliza até a mão direita
    [1.0, 0.7, 0.32, 1.28],  // afunda atrás da teia
  ],
  wrist: [0.84, 0.21],
  city: [0.5, 0.82], // ponto de fuga das partículas (a rua lá embaixo)
};

const SPOKES = 18;
const RINGS = [0.06, 0.13, 0.21, 0.3, 0.41, 0.54, 0.69, 0.86, 1.05];

/** Teia em coordenadas locais (hub em 0,0), irregular como uma teia real. */
function buildWeb(R) {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const angles = Array.from({ length: SPOKES }, (_, i) => (i / SPOKES) * Math.PI * 2 + (rnd() - 0.5) * 0.12);
  const spokes = angles.map((a) => `M0 0L${Math.cos(a) * R * 1.15} ${Math.sin(a) * R * 1.15}`).join('');
  const dew = [];
  const rings = RINGS.map((f) => {
    const r = f * R;
    let d = '';
    angles.forEach((a, i) => {
      const b = angles[(i + 1) % SPOKES] + (i === SPOKES - 1 ? Math.PI * 2 : 0);
      const m = (a + b) / 2;
      const ra = r * (0.97 + rnd() * 0.06);
      const sag = 0.82 + rnd() * 0.08;
      if (i === 0) d += `M${Math.cos(a) * ra} ${Math.sin(a) * ra}`;
      d += `Q${Math.cos(m) * r * sag} ${Math.sin(m) * r * sag} ${Math.cos(b) * r} ${Math.sin(b) * r}`;
      if (rnd() < 0.22) dew.push([Math.cos(a) * ra, Math.sin(a) * ra, 1.2 + rnd() * 2.2]);
    });
    return d;
  });
  return { spokes, rings, dew };
}

/** Abertura do olho (0 = fechado, 1 = tela inteira) em função do progresso da cena. */
function eyeOpen(q) {
  const k = (a, b) => clamp((q - a) / (b - a));
  if (q < 0.025) return 0;
  // Só cresce, nunca volta a fechar: um "pisca" no meio fazia a tela ir a preto e voltar
  // quando a rolagem é lenta (a pessoa fica parada nessa faixa) e parecia defeito.
  if (q < 0.05) return 0.11 * easeOutCubic(k(0.025, 0.05));          // espia
  if (q < 0.075) return 0.11;                                          // segura
  return 0.11 + 0.89 * easeInOutCubic(k(0.075, 0.17));                 // abre de vez
}

const bump = (p, a, b) => (p <= a || p >= b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));

/** Câmera no progresso q: interpola os keyframes com easing em cada trecho. */
function cameraAt(keys, q) {
  let i = 0;
  while (i < keys.length - 2 && q > keys[i + 1][0]) i++;
  const [q0, x0, y0, z0] = keys[i];
  const [q1, x1, y1, z1] = keys[i + 1];
  const f = easeInOutCubic(clamp((q - q0) / (q1 - q0)));
  return [lerp(x0, x1, f), lerp(y0, y1, f), Math.exp(lerp(Math.log(z0), Math.log(z1), f))];
}

export default function PowersSection({ enabled = true }) {
  const sectionRef = useRef(null);
  const sceneWrapRef = useRef(null);
  const lidsRef = useRef(null);
  const sceneRef = useRef(null);
  const blurRef = useRef(null);
  const shadeRef = useRef(null);
  const darkRef = useRef(null);
  const flashRef = useRef(null);
  const rushRef = useRef(null);
  const titleRef = useRef(null);
  const hintRef = useRef(null);
  const headRef = useRef(null);
  const barRef = useRef(null);
  const webRef = useRef(null);
  const strandRef = useRef(null);
  const gridRef = useRef(null);
  const slotRefs = useRef([]);
  const tetherRefs = useRef([]);
  const [geo, setGeo] = useState(null);
  const [blurSrc, setBlurSrc] = useState('');
  // tamanho do elemento da cena: a imagem "cobrindo" a tela (antes era 5232x2944 e escalada para baixo)
  const sceneCover = geo ? Math.max(geo.vw / SCENE.w, geo.vh / SCENE.h) : 0.3;

  // Versão desfocada do fundo, gerada uma vez em tamanho pequeno. Um filter: blur() em tempo real
  // numa imagem gigante que muda de escala fazia o Chrome re-rasterizar e piscar preto.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const w = 192;
      const h = Math.round((w * SCENE.h) / SCENE.w);
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      g.filter = 'blur(2px) saturate(.75) brightness(.8)'; // sem suporte (Safari): o próprio tamanho pequeno já suaviza
      g.drawImage(img, 0, 0, w, h);
      setBlurSrc(c.toDataURL('image/jpeg', 0.85));
    };
    img.src = SCENE.src;
  }, []);

  const scrub = useScrubLock(sectionRef, { distance: 4600, enabled });

  // Geometria: hub da teia = centro da grade; fios até os cantos dos cards
  useLayoutEffect(() => {
    const measure = () => {
      const st = sectionRef.current.getBoundingClientRect();
      const g = gridRef.current.getBoundingClientRect();
      const C = [g.left - st.left + g.width / 2, g.top - st.top + g.height / 2];
      const R = Math.hypot(st.width, st.height) * 0.62;
      const tethers = slotRefs.current.map((el) => {
        const x = el.offsetLeft + g.left - st.left;
        const y = el.offsetTop + g.top - st.top;
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        return [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]
          .sort((a, b) => Math.hypot(a[0] - C[0], a[1] - C[1]) - Math.hypot(b[0] - C[0], b[1] - C[1]))
          .slice(0, 2)
          .map(([cx, cy]) => `M${cx} ${cy}Q${(cx + C[0]) / 2} ${(cy + C[1]) / 2 + 18} ${C[0]} ${C[1]}`)
          .join('');
      });
      const canvas = rushRef.current;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = st.width * dpr;
      canvas.height = st.height * dpr;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      setGeo({ vw: st.width, vh: st.height, C, R, web: buildWeb(R), tethers });
    };
    measure();
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    if (!geo) return undefined;
    const { vw, vh, C } = geo;
    const rush = createRush();
    const rctx = rushRef.current.getContext('2d');
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = e.clientX / innerWidth - 0.5;
      mouse.ty = e.clientY / innerHeight - 0.5;
    };
    addEventListener('pointermove', onMove);

    let raf = 0;
    let last = performance.now();
    let prevQ = scrub.current.current;
    let vel = 0;       // velocidade da rolagem (suavizada): o tremor só existe enquanto a cena se move
    let flashAt = -1;  // instante em que o flash do disparo começou (-1 = armado)
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = now - last;
      last = now;
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom < -50 || rect.top > innerHeight + 50) return;
      const q = scrub.current.current;
      vel = lerp(vel, Math.abs(q - prevQ), 0.15);
      prevQ = q;
      const moving = clamp(vel * 500);
      mouse.x = lerp(mouse.x, mouse.tx, 0.06);
      mouse.y = lerp(mouse.y, mouse.ty, 0.06);

      // ---------- Abertura: título em blur + fresta ----------
      const tt = 1 - clamp(q / 0.1);
      titleRef.current.style.opacity = tt;
      titleRef.current.style.filter = `blur(${(1 - tt) * 14}px)`;
      titleRef.current.style.transform = `translateY(${(1 - tt) * -30}px) scale(${0.94 + tt * 0.06})`;
      hintRef.current.style.opacity = q > 0.005 ? 0 : 1;
      // ---------- O olho abre: traço fino → espia → pisca → abre de vez ----------
      const eye = eyeOpen(q);
      const slit = eye; // usado pelas partículas
      if (eye >= 0.999) {
        sceneWrapRef.current.style.clipPath = 'none';
      } else {
        // pálpebras: duas curvas que se afastam do centro (formato de olho, mais largo que a tela)
        const cx = vw / 2;
        const cy = vh / 2;
        const half = vw * 0.78;
        const h = Math.max(0.6, eye * vh * 1.25); // abertura no centro
        sceneWrapRef.current.style.clipPath = `path('M${cx - half} ${cy}Q${cx} ${cy - h * 2} ${cx + half} ${cy}Q${cx} ${cy + h * 2} ${cx - half} ${cy}Z')`;
      }
      lidsRef.current.style.opacity = 1 - smooth(0.55, 1, eye);
      lidsRef.current.style.setProperty('--open', eye);

      // ---------- Câmera: sempre cobrindo a tela, descendo pela queda ----------
      const cover = Math.max(vw / SCENE.w, vh / SCENE.h);
      const [cx0, cy0, zoom] = cameraAt(SCENE.camera, q);
      const S = cover * zoom;
      let tx = vw / 2 - cx0 * SCENE.w * S;
      let ty = vh / 2 - cy0 * SCENE.h * S;
      tx = clamp(tx, vw - SCENE.w * S, 0);
      ty = clamp(ty, vh - SCENE.h * S, 0);
      const dive = clamp((q - 0.1) / 0.46);
      const shotQ = smooth(0.67, 0.71, q);

      // velocidade da queda: sobe, segura, desacelera na câmera lenta
      const speed = smooth(0.1, 0.26, q) * (1 - smooth(0.5, 0.6, q)) + 0.25 * bump(q, 0.67, 0.76);
      const shake = (speed * 0.5 + bump(q, 0.675, 0.75) * 1.4) * moving;
      tx += (Math.random() - 0.5) * 12 * shake - mouse.x * 20;
      ty += (Math.random() - 0.5) * 12 * shake - mouse.y * 14;
      // rotação pequena em volta do centro da tela, com um zoom extra que esconde as bordas
      const rot = lerp(-2.2, 1.6, easeInOutCubic(dive)) * (1 - shotQ) + (Math.random() - 0.5) * 0.5 * shake;
      const guard = 1 + Math.abs(rot) * 0.05;
      // O elemento da cena já tem o tamanho "cover"; aqui só entra o zoom relativo (camada leve na GPU)
      sceneRef.current.style.transform = `translate3d(${vw / 2}px, ${vh / 2}px, 0) rotate(${rot}deg) scale(${guard}) `
        + `translate(${tx - vw / 2}px, ${ty - vh / 2}px) scale(${zoom})`;

      // ---------- Partículas da cidade ----------
      const V = [tx + SCENE.city[0] * SCENE.w * S, ty + SCENE.city[1] * SCENE.h * S];
      rush.draw(rctx, vw, vh, [clamp(V[0], vw * 0.15, vw * 0.85), clamp(V[1], vh * 0.2, vh * 0.9)], speed * slit, dt);
      rushRef.current.style.opacity = 1 - smooth(0.7, 0.8, q);

      // ---------- Disparo ----------
      const dim = smooth(0.72, 0.8, q);
      // ao abrir o olho a imagem sai do desfoque (vista acordando); no fim, desfoca atrás da teia
      blurRef.current.style.opacity = Math.max(dim, (1 - smooth(0.25, 1, eyeOpen(q))) * 0.95);
      shadeRef.current.style.opacity = 0.25 + 0.6 * dim;
      darkRef.current.style.opacity = 0.9 * dim; // fundo vermelho atrás da teia e das folhas
      // o flash é um pulso no tempo (dispara ao cruzar o disparo), não segue o progresso:
      // com rolagem lenta ele não fica "aceso" nem pisca de um lado para o outro
      if (q < 0.66) flashAt = -1;
      else if (q >= 0.68 && flashAt < 0 && q < 0.74) flashAt = now;
      const fl = flashAt < 0 ? 0 : clamp(1 - (now - flashAt) / 420);
      flashRef.current.style.opacity = fl * fl * 0.9;

      const shot = easeOutCubic(clamp((q - 0.68) / 0.03));
      const wx = tx + SCENE.wrist[0] * SCENE.w * S;
      const wy = ty + SCENE.wrist[1] * SCENE.h * S;
      strandRef.current.setAttribute('d', `M${wx} ${wy}Q${(wx + C[0]) / 2} ${(wy + C[1]) / 2 - 40} ${C[0]} ${C[1]}`);
      strandRef.current.style.strokeDashoffset = 1 - shot;
      strandRef.current.style.opacity = shot > 0 ? 1 - dim * 0.7 : 0;

      const fly = clamp((q - 0.685) / 0.055);
      const wscale = fly <= 0 ? 0.001 : 0.03 + 0.97 * (1 - (1 - fly) ** 4);
      const wobble = bump(q, 0.735, 0.79) * 0.025;
      webRef.current.setAttribute('transform',
        `translate(${C[0] + mouse.x * 14} ${C[1] + mouse.y * 10}) scale(${wscale * (1 + wobble)}) rotate(${lerp(-25, 0, easeOutCubic(fly))})`);
      // ao voar a teia chega forte; depois que gruda, suaviza um pouco para não brigar com as folhas
      const WEB_REST = 0.7;
      webRef.current.style.opacity = fly > 0 ? Math.min(1, fly * 4) * lerp(1, WEB_REST, smooth(0.74, 0.84, q)) : 0;

      // ---------- Cards ----------
      slotRefs.current.forEach((el, i) => {
        const cp = clamp((q - (0.77 + i * 0.04)) / 0.09);
        const b = easeOutBack(cp);
        const s2 = i % 2 ? 1 : -1;
        el.style.opacity = Math.min(1, cp * 3);
        el.style.transform = `translate3d(${(1 - b) * s2 * 60}px, ${(1 - b) * 90}px, ${(1 - cp) * -900}px) `
          + `rotateX(${(1 - b) * 55}deg) rotateY(${(1 - b) * s2 * -35}deg) rotateZ(${(1 - b) * s2 * 8}deg)`;
        el.classList.toggle('is-stuck', cp >= 1);
        const t = tetherRefs.current[i];
        if (t) t.style.strokeDashoffset = 1 - easeOutCubic(clamp((cp - 0.55) / 0.45));
      });

      const hp = easeOutCubic(clamp((q - 0.76) / 0.1));
      headRef.current.style.opacity = hp;
      headRef.current.style.filter = `blur(${(1 - hp) * 10}px)`;
      headRef.current.style.transform = `translateY(${(1 - hp) * 30}px)`;

      barRef.current.style.transform = `scaleX(${q})`;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, [geo, scrub]);

  return (
    <section className="powers" id="poderes" ref={sectionRef}>
      <PenFilter />
      {/* Cena: nítida + versão desfocada que aparece atrás da teia */}
      <div className="scene-wrap" ref={sceneWrapRef}>
        <div
          className="scene"
          ref={sceneRef}
          style={{ width: SCENE.w * sceneCover, height: SCENE.h * sceneCover }}
        >
          <img src={SCENE.src} alt="Homem-Aranha mergulhando entre os prédios de Nova York à noite" draggable="false" />
          <img src={blurSrc || undefined} alt="" aria-hidden="true" className="scene-blur" ref={blurRef} draggable="false" />
        </div>
        <canvas className="rush" ref={rushRef} aria-hidden="true" />
        {/* sombra das pálpebras: escurece as bordas do olho enquanto ele abre */}
        <div className="eye-lids" ref={lidsRef} aria-hidden="true" />
        <div className="scene-shade" ref={shadeRef} />
        <div className="scene-dark" ref={darkRef} />
      </div>

      {/* Abertura */}
      {/* Despertador: o olho ainda está fechado */}
      <div className="dive-title" ref={titleRef}>
        <span className="alarm-label"><i className="alarm-dot" />alarme · patrulha · Queens</span>
        <Segments value="23:47" className="alarm-clock" />
        <p className="alarm-note">só mais cinco minutos…</p>
      </div>
      <div className="dive-hint" ref={hintRef}>
        <span>ROLE</span>
        <svg width="14" height="18" viewBox="0 0 14 18"><path d="M7 1 L7 17 M2 12 L7 17 L12 12" /></svg>
      </div>

      {/* Teia + fio do disparo */}
      <svg className="web-net" aria-hidden="true" viewBox={geo ? `0 0 ${geo.vw} ${geo.vh}` : undefined}>
        <defs>
          <filter id="silk" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path ref={strandRef} pathLength="1" className="web-strand" />
        {geo && (
          <g ref={webRef} className="web-body" filter="url(#silk)" style={{ opacity: 0 }}>
            <path d={geo.web.spokes} className="web-spoke" />
            {geo.web.rings.map((d, i) => <path key={i} d={d} className="web-ring" />)}
            {geo.web.dew.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className="web-dew" />)}
            <circle r="5" className="web-hub" />
          </g>
        )}
        {geo?.tethers.map((d, i) => (
          <path key={i} d={d} pathLength="1" ref={(el) => { tetherRefs.current[i] = el; }} className="web-tether" />
        ))}
      </svg>

      <div className="flash" ref={flashRef} />

      <header className="powers-head" ref={headRef}>
        <span className="scrawl-label">anotações do Peter — não ler!!</span>
        <h2>Com grandes poderes</h2>
        <p className="scrawl-sub">
          …vem muita lição de casa.
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
            <path d="M4 12c60-8 130-9 210-4 30 2 55 1 82-4M30 17c70-5 150-6 230-2" />
          </svg>
        </p>
      </header>

      <div className="powers-grid" ref={gridRef}>
        {NOTES.map((note, i) => (
          <div key={note.key} className="power-slot" ref={(el) => { slotRefs.current[i] = el; }}>
            <Note note={note} />
          </div>
        ))}
      </div>

      <div className="dive-progress"><i ref={barRef} /></div>
    </section>
  );
}
