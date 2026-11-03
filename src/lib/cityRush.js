// Partículas do mergulho: luzes da cidade (bokeh) e gotas de chuva saindo de um ponto de
// fuga em direção à câmera. Quanto maior a velocidade, mais rápidas e mais "esticadas".

const BOKEH_COLORS = ['255,176,92', '255,120,80', '255,214,150', '120,200,255', '255,110,170'];
const MAX = 170;

export function createRush() {
  const parts = [];
  let acc = 0;

  const spawn = (V, w, h, kind) => {
    const a = Math.random() * Math.PI * 2;
    const d = 6 + Math.random() * Math.min(w, h) * 0.08;
    parts.push({
      kind,
      a,
      d,
      v: 0.6 + Math.random() * 1.1,
      size: kind === 'bokeh' ? 2 + Math.random() * 7 : 0.6 + Math.random() * 0.9,
      color: BOKEH_COLORS[(Math.random() * BOKEH_COLORS.length) | 0],
      life: 0,
    });
  };

  /**
   * @param ctx    contexto 2D (já escalado pelo dpr)
   * @param V      ponto de fuga [x, y]
   * @param speed  0–1
   * @param dt     ms desde o último frame
   */
  function draw(ctx, w, h, V, speed, dt) {
    ctx.clearRect(0, 0, w, h);
    const k = Math.min(dt, 40) / 16.7;

    // nasce mais partícula quanto mais rápido
    acc += speed * 3.2 * k;
    while (acc > 1 && parts.length < MAX) {
      acc -= 1;
      spawn(V, w, h, Math.random() < 0.55 ? 'bokeh' : 'rain');
    }
    if (parts.length >= MAX) acc = 0;

    const far = Math.hypot(w, h) * 0.75;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      const prev = p.d;
      // perspectiva: acelera conforme se aproxima da câmera
      p.d += (p.v * (2 + p.d * 0.045) * (0.25 + speed * 2.2)) * k;
      p.life += dt;
      if (p.d > far) { parts.splice(i, 1); continue; }

      const t = p.d / far;
      const ca = Math.cos(p.a);
      const sa = Math.sin(p.a);
      const x = V[0] + ca * p.d;
      const y = V[1] + sa * p.d;
      const fade = Math.min(1, p.life / 250) * (1 - t * 0.6);

      if (p.kind === 'bokeh') {
        const r = p.size * (0.4 + t * 3);
        const tail = Math.max(0, (p.d - prev) * (0.6 + speed * 3));
        if (tail > r * 0.8) {
          // em alta velocidade vira um risco de luz
          const g = ctx.createLinearGradient(x - ca * tail, y - sa * tail, x, y);
          g.addColorStop(0, `rgba(${p.color},0)`);
          g.addColorStop(1, `rgba(${p.color},${0.55 * fade})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = r;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x - ca * tail, y - sa * tail);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, `rgba(${p.color},${0.5 * fade})`);
          g.addColorStop(0.7, `rgba(${p.color},${0.18 * fade})`);
          g.addColorStop(1, `rgba(${p.color},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        const len = 6 + (p.d - prev) * (2 + speed * 5);
        ctx.strokeStyle = `rgba(220,235,255,${0.55 * fade})`;
        ctx.lineWidth = p.size * (0.6 + t * 1.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - ca * len, y - sa * len);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    // linhas de velocidade nas bordas
    if (speed > 0.05) {
      ctx.globalCompositeOperation = 'source-over';
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.12;
        const r0 = far * (0.42 + Math.random() * 0.2);
        const r1 = r0 + far * (0.12 + Math.random() * 0.25) * speed;
        ctx.strokeStyle = `rgba(255,255,255,${0.12 * speed})`;
        ctx.lineWidth = 1 + Math.random() * 1.5;
        ctx.beginPath();
        ctx.moveTo(V[0] + Math.cos(a) * r0, V[1] + Math.sin(a) * r0);
        ctx.lineTo(V[0] + Math.cos(a) * r1, V[1] + Math.sin(a) * r1);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  return { draw };
}
