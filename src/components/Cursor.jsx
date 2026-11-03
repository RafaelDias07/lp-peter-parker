import { useEffect, useRef } from 'react';
import { lerp } from '../lib/ease.js';

/** Cursor com anel que acompanha com atraso e mostra o tamanho do pincel. */
export default function Cursor({ brushRef, painting, paintAreaRef }) {
  const dot = useRef(null);
  const ring = useRef(null);
  const paintingRef = useRef(painting);
  paintingRef.current = painting;

  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) return undefined;
    document.documentElement.classList.add('has-cursor');

    const target = { x: innerWidth / 2, y: innerHeight / 2 };
    const pos = { ...target };
    let size = 14;
    let hover = false;

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      hover = !!e.target.closest?.('a, button');
    };
    addEventListener('pointermove', onMove);

    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      pos.x = lerp(pos.x, target.x, 0.18);
      pos.y = lerp(pos.y, target.y, 0.18);
      // Anel do tamanho do pincel só quando o mouse está sobre a primeira tela
      const area = paintAreaRef?.current?.getBoundingClientRect();
      const overPaint = paintingRef.current && (!area || target.y < area.bottom);
      const want = hover ? 56 : overPaint ? (brushRef.current || 80) * 1.4 : 14;
      size = lerp(size, want, 0.15);
      dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      ring.current.style.width = ring.current.style.height = `${size}px`;
      ring.current.classList.toggle('is-hover', hover);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      document.documentElement.classList.remove('has-cursor');
    };
  }, [brushRef, paintAreaRef]);

  return (
    <>
      <div className="cursor-ring" ref={ring} />
      <div className="cursor-dot" ref={dot} />
    </>
  );
}
