import { useCallback, useEffect, useRef, useState } from 'react';
import SpiderIntro from './components/SpiderIntro.jsx';
import PaintCanvas from './components/PaintCanvas.jsx';
import Cursor from './components/Cursor.jsx';
import PowersSection from './components/PowersSection.jsx';
import QueensSection from './components/QueensSection.jsx';
import VidaSection from './components/VidaSection.jsx';
import FinalSection from './components/FinalSection.jsx';
import Footer from './components/Footer.jsx';
import { Header, Ticket, Coords, WebLines, Menu, FaceLines } from './components/HomeUI.jsx';
import { lerp } from './lib/ease.js';
import { PHOTO_LAYOUT } from './lib/align.js';
import { enableSmoothAnchors } from './lib/smoothScroll.js';

export default function App() {
  const [phase, setPhase] = useState('intro'); // intro → ready
  const [run, setRun] = useState(0);           // incrementa para repetir a intro
  const [menuOpen, setMenuOpen] = useState(false);
  const [painted, setPainted] = useState(false);

  const homeRef = useRef(null);
  const photoRef = useRef(null);
  const wrapRef = useRef(null);
  const brushRef = useRef(80);
  const logoPaintRef = useRef(null);

  const ready = phase === 'ready';
  const onIntroDone = useCallback(() => setPhase('ready'), []);
  const replay = () => {
    window.scrollTo(0, 0);
    setPhase('intro');
    setPainted(false);
    setRun((r) => r + 1);
  };

  // Links internos (#secao) deslizam até a seção em vez de pular
  useEffect(() => enableSmoothAnchors(), []);

  // A página só rola depois da intro (e com o menu fechado)
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('is-locked', !ready || menuOpen);
  }, [ready, menuOpen]);

  // Parallax leve da foto seguindo o mouse (a máscara acompanha, pois lê o retângulo da foto)
  useEffect(() => {
    if (!ready) return undefined;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e) => {
      target.x = (e.clientX / innerWidth - 0.5) * -18;
      target.y = (e.clientY / innerHeight - 0.5) * -10;
    };
    addEventListener('pointermove', onMove);
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      cur.x = lerp(cur.x, target.x, 0.06);
      cur.y = lerp(cur.y, target.y, 0.06);
      wrapRef.current.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, [ready]);

  return (
    <div className={`app is-${phase} ${menuOpen ? 'menu-open' : ''}`}>
      <main className="home" ref={homeRef}>
        <div className="paper" />
        <WebLines />

        <div className="photo-wrap" ref={wrapRef} style={PHOTO_LAYOUT}>
          <img ref={photoRef} className="photo" src="/assets/peter.webp" alt="Peter Parker" draggable="false" />
          <FaceLines />
        </div>

        <PaintCanvas
          photoRef={photoRef}
          brushRef={brushRef}
          logoPaintRef={logoPaintRef}
          active={ready && !menuOpen}
          onFirstPaint={() => setPainted(true)}
        />

        <Header onReplay={replay} onMenu={() => setMenuOpen(true)} logoPaintRef={logoPaintRef} />
        <Ticket />
        <Coords />

        <a href="#poderes" className="scroll-cue reveal" style={{ '--d': '850ms' }}>
          <span>ROLE</span><i />
        </a>

        <div className={`hint ${ready && !painted ? 'is-on' : ''}`}>
          passe o mouse no rosto <b>✦</b> vista a máscara
        </div>
      </main>

      <PowersSection enabled={ready} />
      <QueensSection />
      <VidaSection />
      <FinalSection />
      <Footer onTop={replay} />

      {/* Depois da <main>: os refs da home já estão ligados quando a intro roda */}
      {!ready && (
        <SpiderIntro key={run} homeRef={homeRef} photoRef={photoRef} onDone={onIntroDone} />
      )}

      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Cursor brushRef={brushRef} painting={ready && !menuOpen} paintAreaRef={homeRef} />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
