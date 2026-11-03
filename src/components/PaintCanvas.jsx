import { useEffect, useRef } from 'react';
import { clamp, lerp, smooth } from '../lib/ease.js';
import { spiderPath } from '../lib/spider.js';

import { PHOTO, MASK, applyRef, toPhoto } from '../lib/align.js';

// Máscara, traje e recortes abaixo estão no "espaço de referência" (ver lib/align.js):
// a conversão para a foto atual é feita por applyRef(), a partir da posição dos olhos.

const LIFE = 2000;     // ms até um trecho do rastro sumir por completo
const BRISTLES = 110;  // fios do pincel
const LAYER_MS = 250;   // granularidade do esmaecimento

/** Recorta o rodapé da imagem (barra preta + URL) e esfuma as bordas para fundir com o vermelho. */
function prepareMask(img) {
  const c = document.createElement('canvas');
  c.width = Math.round(MASK.w * MASK.file);
  c.height = Math.round(MASK.cropH * MASK.file);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'destination-in';

  const h = x.createLinearGradient(0, 0, c.width, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)');
  h.addColorStop(0.14, '#000');
  h.addColorStop(0.86, '#000');
  h.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = h;
  x.fillRect(0, 0, c.width, c.height);

  const v = x.createLinearGradient(0, 0, 0, c.height);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(0.05, '#000');
  v.addColorStop(0.82, '#000');
  v.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = v;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

/**
 * Máscara já alinhada no espaço de pixels da foto. Da cabeça para cima ela fica
 * inteira; do pescoço para baixo só aparece DENTRO da silhueta do Peter — assim
 * o pedaço de ombro que existe na imagem original não sobra para fora do traje.
 */
const MASK_CLIP = { from: 730, to: 830 };

function alignMask(maskCanvas, photo) {
  const w = photo.naturalWidth;
  const h = photo.naturalHeight;
  const k = MASK.scale;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  x.save();
  applyRef(x);
  x.drawImage(maskCanvas, MASK.refAnchor[0] - MASK.anchor[0] * k, MASK.refAnchor[1] - MASK.anchor[1] * k,
    MASK.w * k, MASK.cropH * k);
  x.restore();

  // Recorte = (tudo acima do pescoço, com transição suave) ∪ (silhueta do corpo)
  const clip = document.createElement('canvas');
  clip.width = w;
  clip.height = h;
  const cx = clip.getContext('2d');
  cx.save();
  applyRef(cx);
  const g = cx.createLinearGradient(0, MASK_CLIP.from, 0, MASK_CLIP.to);
  g.addColorStop(0, '#000');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g;
  cx.fillRect(-2000, -2000, 6000, MASK_CLIP.to + 2000);
  cx.restore();
  cx.drawImage(photo, 0, 0);

  x.globalCompositeOperation = 'destination-in';
  x.drawImage(clip, 0, 0);
  return c;
}

/**
 * Traje gerado por código. Da foto só usamos a SILHUETA (pescoço + ombros); nada
 * da roupa (gola, lapela, camisa) aparece. O volume é desenhado: pescoço cilíndrico
 * que continua o pescoço da máscara, sombra sob o queixo, ombros e peito.
 * Coordenadas no espaço de referência (convertidas por applyRef).
 */
const SUIT = {
  color: '#cc1d18',
  neck: { x0: 400, x1: 890, y0: 760, y1: 1060 }, // faixa do pescoço
  chin: [645, 935],                                // sombra embaixo do queixo
  emblem: [640, 1150],
  emblemScale: 0.62,
  fadeFrom: 660,
  fadeTo: 820,
};

/** Desenha um retângulo com degradê horizontal × vertical (dois degradês combinados). */
function crossGradient(x, w, h, rect, hStops, vStops) {
  const t = document.createElement('canvas');
  t.width = w;
  t.height = h;
  const c = t.getContext('2d');
  const hg = c.createLinearGradient(rect.x0, 0, rect.x1, 0);
  hStops.forEach(([o, col]) => hg.addColorStop(o, col));
  c.fillStyle = hg;
  c.fillRect(rect.x0, rect.y0, rect.x1 - rect.x0, rect.y1 - rect.y0);
  c.globalCompositeOperation = 'destination-in';
  const vg = c.createLinearGradient(0, rect.y0, 0, rect.y1);
  vStops.forEach(([o, col]) => vg.addColorStop(o, col));
  c.fillStyle = vg;
  c.fillRect(0, 0, w, h);
  x.drawImage(t, 0, 0);
}

function fabricPattern(x) {
  const t = document.createElement('canvas');
  t.width = t.height = 96;
  const c = t.getContext('2d');
  const img = c.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.random() * 145;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return x.createPattern(t, 'repeat');
}

function prepareSuit(photo) {
  const w = photo.naturalWidth;
  const h = photo.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');

  // 1. Silhueta do corpo preenchida com um vermelho único
  x.drawImage(photo, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = SUIT.color;
  x.fillRect(0, 0, w, h);

  // Tudo daqui pra baixo fica preso dentro da silhueta e é desenhado no espaço de referência
  x.globalCompositeOperation = 'source-atop';
  applyRef(x);
  const ALL = [-2000, -2000, 6000, 6000];

  // 2. Volume de ombros/peito: claro no centro do peito, escuro nas bordas
  const vol = x.createRadialGradient(640, 1130, 80, 640, 1130, 720);
  vol.addColorStop(0, 'rgba(255, 110, 100, .14)');
  vol.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  vol.addColorStop(1, 'rgba(30, 0, 0, .55)');
  x.fillStyle = vol;
  x.fillRect(...ALL);

  // Peitorais e clavículas: brilhos suaves
  x.filter = 'blur(40px)';
  x.fillStyle = 'rgba(255, 140, 130, .16)';
  [[455, 1110], [825, 1110]].forEach(([ex, ey]) => {
    x.beginPath();
    x.ellipse(ex, ey, 170, 90, 0, 0, Math.PI * 2);
    x.fill();
  });
  x.fillStyle = 'rgba(40, 0, 0, .22)';
  x.beginPath();
  x.ellipse(640, 1150, 40, 140, 0, 0, Math.PI * 2); // sulco do esterno
  x.fill();
  x.filter = 'none';

  // 3. Pescoço cilíndrico: escuro nas laterais, mais claro no meio
  crossGradient(x, w, h, SUIT.neck,
    [[0, 'rgba(25,0,0,0)'], [0.1, 'rgba(25,0,0,.38)'], [0.3, 'rgba(25,0,0,.08)'], [0.5, 'rgba(255,120,110,.10)'],
      [0.7, 'rgba(25,0,0,.08)'], [0.9, 'rgba(25,0,0,.38)'], [1, 'rgba(25,0,0,0)']],
    [[0, 'rgba(0,0,0,0)'], [0.3, '#000'], [0.6, '#000'], [1, 'rgba(0,0,0,0)']]);

  // 4. Sombra que o queixo da máscara projeta no pescoço
  x.filter = 'blur(34px)';
  x.fillStyle = 'rgba(70, 0, 0, .3)';
  x.beginPath();
  x.ellipse(SUIT.chin[0], SUIT.chin[1], 230, 55, 0, 0, Math.PI * 2);
  x.fill();
  x.filter = 'none';

  // 5. Textura de tecido bem sutil
  x.globalAlpha = 0.08;
  x.fillStyle = fabricPattern(x);
  x.fillRect(...ALL);
  x.globalAlpha = 1;

  // 6. Teia em relevo: linha escura + brilho fino deslocado
  const [cx, cy] = SUIT.emblem;
  const spokes = 22;
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + 0.07);
  const web = new Path2D();
  angles.forEach((a) => {
    web.moveTo(cx, cy);
    web.lineTo(cx + Math.cos(a) * 1400, cy + Math.sin(a) * 1400);
  });
  [70, 150, 245, 350, 465, 590, 730].forEach((r) => {
    angles.forEach((a, i) => {
      const b = angles[(i + 1) % spokes] + (i === spokes - 1 ? Math.PI * 2 : 0);
      const mid = (a + b) / 2;
      if (i === 0) web.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else web.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      web.quadraticCurveTo(
        cx + Math.cos(mid) * r * 0.88, cy + Math.sin(mid) * r * 0.88,
        cx + Math.cos(b) * r, cy + Math.sin(b) * r,
      );
    });
  });
  x.lineJoin = 'round';
  x.strokeStyle = 'rgba(45, 0, 0, .55)';
  x.lineWidth = 4;
  x.stroke(web);
  x.save();
  x.translate(-1.5, -1.5);
  x.strokeStyle = 'rgba(255, 190, 185, .35)';
  x.lineWidth = 1.4;
  x.stroke(web);
  x.restore();

  // 7. Aranha no peito
  const emblem = new Path2D(spiderPath({ cx, cy, s: SUIT.emblemScale }));
  x.shadowColor = 'rgba(255, 120, 110, .35)';
  x.shadowOffsetY = -1.5;
  x.fillStyle = '#120404';
  x.fill(emblem);
  x.shadowColor = 'transparent';

  // 8. Some acima do pescoço (a cabeça é da máscara)
  x.globalCompositeOperation = 'destination-in';
  const fade = x.createLinearGradient(0, SUIT.fadeFrom, 0, SUIT.fadeTo);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, '#000');
  x.fillStyle = fade;
  x.fillRect(...ALL);
  return c;
}

/**
 * Pincel de pelo: muitos fios finos com posição fixa na largura do pincel e uma
 * "carga" que oscila. Como os fios persistem de um trecho para o outro, viram
 * mechas contínuas no sentido do movimento. O miolo é denso; as bordas falham
 * bastante e soltam pelinhos curvos — aspecto de pincel peludo/arrastado.
 */
function createBristles() {
  return Array.from({ length: BRISTLES }, (_, i) => {
    const o = (i / (BRISTLES - 1)) * 2 - 1 + (Math.random() - 0.5) * 0.025;
    const edge = Math.abs(o);
    return {
      o,
      w: lerp(0.034, 0.008, edge) * (0.5 + Math.random()), // espessura relativa ao raio
      load: Math.random(),
      speed: lerp(0.18, 0.6, edge), // borda muda de carga mais rápido = mais falhada
      edge,
    };
  });
}

function stepBristles(bristles) {
  for (const b of bristles) {
    b.load = clamp(b.load + (Math.random() - 0.5) * b.speed);
  }
  // Retrato da carga de cada fio neste trecho (0 = fio seco, não desenha)
  return bristles.map((b) => {
    const threshold = 0.08 + 0.8 * b.edge ** 1.8;
    return b.load > threshold ? Math.min(1, (b.load - threshold) * 2.5 + 0.3) : 0;
  });
}

/** Pelinhos soltos: saem das bordas e da cauda do traço, curvos e de tamanhos variados. */
function makeHairs() {
  const hairs = [];
  const n = 5 + Math.floor(Math.random() * 8);
  for (let i = 0; i < n; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const outer = Math.random() < 0.75;
    hairs.push({
      o: side * (outer ? 0.75 + Math.random() * 0.4 : Math.random() * 0.8),
      along: Math.random(),
      len: outer ? 0.2 + Math.random() * 0.75 : 0.15 + Math.random() * 0.35,
      ang: side * (outer ? 0.08 + Math.random() * 0.45 : Math.random() * 0.15),
      curl: (Math.random() - 0.3) * side * 14,
      w: 0.45 + Math.random() * 0.9,
    });
  }
  return hairs;
}

/**
 * Nome alternativo desenhado no canvas do logo, na mesma posição das linhas do DOM.
 * HOMEM em branco, ARANHA em azul com contorno branco — legível sobre o vermelho.
 */
function drawAltLogo(l, logoEl) {
  const lines = [
    { el: logoEl.querySelector('.logo-peter'), text: 'HOMEM', kind: 'serif' },
    { el: logoEl.querySelector('.logo-parker'), text: 'ARANHA', kind: 'bold' },
  ];
  for (const { el, text, kind } of lines) {
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    l.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in l) l.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    l.textBaseline = 'alphabetic';
    const m = l.measureText(text);
    // Centraliza verticalmente o "olho" da letra na caixa da linha
    const y = r.top + r.height / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    if (kind === 'serif') {
      l.shadowColor = 'rgba(13, 36, 102, .55)';
      l.shadowOffsetY = 2;
      l.fillStyle = '#fff';
      l.fillText(text, r.left, y);
      l.shadowColor = 'transparent';
    } else {
      const g = l.createLinearGradient(0, r.top, 0, r.bottom);
      g.addColorStop(0, '#3d7bff');
      g.addColorStop(0.5, '#1d47b8');
      g.addColorStop(1, '#0d2466');
      l.lineJoin = 'round';
      l.lineWidth = 4;
      l.strokeStyle = '#fff';
      l.strokeText(text, r.left, y);
      l.fillStyle = g;
      l.fillText(text, r.left, y);
    }
  }
}

/**
 * Canvas por cima da foto. Desenha "fundo vermelho + máscara alinhada ao rosto"
 * e recorta isso pelo rastro do pincel (destination-in). O rastro é refeito a cada
 * frame a partir dos trechos recentes, que vão sumindo com a idade.
 */
export default function PaintCanvas({ photoRef, active, onFirstPaint, brushRef, logoPaintRef }) {
  const canvasRef = useRef(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const firstPaint = useRef(onFirstPaint);
  firstPaint.current = onFirstPaint;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const brush = document.createElement('canvas');
    const bctx = brush.getContext('2d');
    let dpr = 1;
    let W = 0;
    let H = 0;

    let suit = null;
    let mask = null;
    const maskImg = new Image();
    const body = new Image();
    let pending = 2;
    const onAsset = () => {
      if (--pending) return;
      suit = prepareSuit(body);
      mask = alignMask(prepareMask(maskImg), body);
    };
    maskImg.onload = onAsset;
    body.onload = onAsset;
    maskImg.src = MASK.src;
    body.src = photoRef.current.currentSrc || photoRef.current.src;

    // O rastro vive em "camadas de tempo": cada trecho é desenhado UMA vez na camada
    // atual, e a cada frame só compomos as camadas com a opacidade da idade delas.
    // Assim dá para ter centenas de fios e 2s de rastro sem redesenhar tudo.
    const layerCount = Math.ceil(LIFE / LAYER_MS) + 1;
    const layers = Array.from({ length: layerCount }, () => {
      const c = document.createElement('canvas');
      return { c, x: c.getContext('2d'), t0: -Infinity, used: false };
    });
    let current = layers[0];

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      brush.width = W;
      brush.height = H;
      for (const l of layers) {
        l.c.width = W;
        l.c.height = H;
        l.used = false;
      }
    };
    resize();
    addEventListener('resize', resize);

    const layerFor = (now) => {
      if (now - current.t0 < LAYER_MS) return current;
      const oldest = layers.reduce((a, b) => (a.t0 < b.t0 ? a : b));
      oldest.x.clearRect(0, 0, W, H);
      oldest.t0 = now;
      oldest.used = false;
      current = oldest;
      return current;
    };

    const bristles = createBristles();
    let last = null;
    let radius = 0;
    let painted = false;
    let lastPaint = -Infinity;

    const drawSegment = (x, s) => {
      x.lineCap = 'round';
      x.strokeStyle = '#000';
      for (let i = 0; i < BRISTLES; i++) {
        const load = s.loads[i];
        if (!load) continue;
        const o = bristles[i].o;
        x.globalAlpha = load;
        x.lineWidth = Math.max(0.6, bristles[i].w * (s.r0 + s.r1));
        x.beginPath();
        x.moveTo(s.x0 + s.nx * o * s.r0, s.y0 + s.ny * o * s.r0);
        x.lineTo(s.x1 + s.nx * o * s.r1, s.y1 + s.ny * o * s.r1);
        x.stroke();
      }
      const dx = s.x1 - s.x0;
      const dy = s.y1 - s.y0;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      for (const h of s.hairs) {
        const bx = s.x0 + dx * h.along + s.nx * h.o * s.r1;
        const by = s.y0 + dy * h.along + s.ny * h.o * s.r1;
        const c = Math.cos(h.ang);
        const sn = Math.sin(h.ang);
        // pelinho aponta para trás do movimento, levemente aberto para fora
        const hx = -(ux * c - uy * sn);
        const hy = -(ux * sn + uy * c);
        x.globalAlpha = 0.45 + 0.4 * Math.abs(h.o);
        x.lineWidth = h.w;
        x.beginPath();
        x.moveTo(bx, by);
        x.quadraticCurveTo(
          bx + hx * s.r1 * h.len * 0.5 + s.nx * h.curl,
          by + hy * s.r1 * h.len * 0.5 + s.ny * h.curl,
          bx + hx * s.r1 * h.len, by + hy * s.r1 * h.len,
        );
        x.stroke();
      }
      x.globalAlpha = 1;
    };

    const onMove = (e) => {
      if (!activeRef.current) { last = null; return; }
      // Rastro em coordenadas da primeira tela: ela rola junto com a página
      const cr = canvas.getBoundingClientRect();
      if (e.clientY < cr.top || e.clientY > cr.bottom) { last = null; return; }
      const p = [e.clientX - cr.left, e.clientY - cr.top];
      if (!last) { last = p; radius = 0; return; }
      const dx = p[0] - last[0];
      const dy = p[1] - last[1];
      const dist = Math.hypot(dx, dy);
      if (dist < 2) return;

      // Raio cresce com a velocidade e entra afinando no começo do traço
      const target = lerp(55, 105, clamp(dist / 50)) * clamp(Math.min(W, H) / 900, 0.55, 1.2);
      const r0 = radius;
      radius = lerp(radius, target, radius === 0 ? 0.45 : 0.25);
      brushRef.current = radius;

      const now = performance.now();
      const layer = layerFor(now);
      // Movimentos rápidos viram vários trechos curtos para os fios seguirem a curva
      const parts = Math.ceil(dist / 24);
      for (let i = 0; i < parts; i++) {
        const a = i / parts;
        const b = (i + 1) / parts;
        drawSegment(layer.x, {
          x0: last[0] + dx * a, y0: last[1] + dy * a,
          x1: last[0] + dx * b, y1: last[1] + dy * b,
          r0: lerp(r0, radius, a), r1: lerp(r0, radius, b),
          nx: -dy / dist, ny: dx / dist,
          loads: stepBristles(bristles),
          hairs: makeHairs(),
        });
      }
      layer.used = true;
      lastPaint = now;
      last = p;
      if (!painted) { painted = true; firstPaint.current?.(); }
    };
    const onLeave = () => { last = null; };
    addEventListener('pointermove', onMove);
    document.addEventListener('pointerleave', onLeave);

    const drawTrail = (now) => {
      bctx.clearRect(0, 0, W, H);
      for (const l of layers) {
        if (!l.used) continue;
        // Idade medida no meio da camada; segura um pouco e depois some
        const age = (now - l.t0 - LAYER_MS / 2) / LIFE;
        const fade = 1 - smooth(0.35, 1, age);
        if (fade <= 0) { l.used = false; continue; }
        bctx.globalAlpha = fade;
        bctx.drawImage(l.c, 0, 0);
      }
      bctx.globalAlpha = 1;
    };

    let raf = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const lc = logoPaintRef?.current;
      const lctx = lc?.getContext('2d');
      if (lctx) {
        lctx.setTransform(1, 0, 0, 1, 0, 0);
        lctx.clearRect(0, 0, lc.width, lc.height);
      }
      if (now - lastPaint > LIFE + LAYER_MS || !activeRef.current) return;

      drawTrail(now);

      // Desenha em coordenadas de tela; o canvas está em (cr.left, cr.top) depois do scroll
      const cr = canvas.getBoundingClientRect();
      ctx.setTransform(dpr, 0, 0, dpr, -cr.left * dpr, -cr.top * dpr);
      const r = photoRef.current.getBoundingClientRect();
      const k = r.width / PHOTO.w;
      const [ax, ay] = toPhoto(MASK.refAnchor);
      const fx = r.left + ax * k;
      const fy = r.top + ay * k;

      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, Math.max(W, H) * 0.8);
      g.addColorStop(0, '#d8291f');
      g.addColorStop(0.45, '#a3170e');
      g.addColorStop(1, '#3d0504');
      ctx.fillStyle = g;
      ctx.fillRect(cr.left, cr.top, W, H);

      if (suit) ctx.drawImage(suit, r.left, r.top, r.width, r.height);

      if (mask) ctx.drawImage(mask, r.left, r.top, r.width, r.height);

      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(brush, cr.left, cr.top, W, H);
      ctx.globalCompositeOperation = 'source-over';

      // Nome: onde o pincel passa, PETER PARKER vira HOMEM ARANHA
      if (lctx) {
        const lr = lc.getBoundingClientRect();
        const cw = Math.round(lr.width * dpr);
        const ch = Math.round(lr.height * dpr);
        if (lc.width !== cw || lc.height !== ch) { lc.width = cw; lc.height = ch; }
        // Desenha em coordenadas de tela, deslocado para a posição do canvas do logo
        lctx.setTransform(dpr, 0, 0, dpr, -lr.left * dpr, -lr.top * dpr);
        const lg = lctx.createRadialGradient(fx, fy, 0, fx, fy, Math.max(W, H) * 0.8);
        lg.addColorStop(0, '#d8291f');
        lg.addColorStop(0.45, '#a3170e');
        lg.addColorStop(1, '#3d0504');
        lctx.fillStyle = lg;
        lctx.fillRect(lr.left, lr.top, lr.width, lr.height);
        drawAltLogo(lctx, lc.parentElement);
        lctx.globalCompositeOperation = 'destination-in';
        lctx.drawImage(brush, cr.left, cr.top, W, H);
        lctx.globalCompositeOperation = 'source-over';
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, [photoRef, brushRef, logoPaintRef]);

  return <canvas ref={canvasRef} className="paint" aria-hidden="true" />;
}
