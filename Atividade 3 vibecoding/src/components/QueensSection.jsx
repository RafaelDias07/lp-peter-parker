import { useEffect, useRef, useState } from 'react';
import { clamp, lerp, easeOutCubic, prefersReducedMotion } from '../lib/ease.js';

/*
 * 03 — QUEENS À NOITE: "Primeira página".
 * O Peter vende as fotos do Homem-Aranha para o jornal. Numa mesa à noite, a cada
 * rolagem uma capa da "Gazeta de Queens" (jornal fictício) cai sobre a pilha com um
 * flash de câmera — segunda a sábado. Por cima, a caneta vermelha do Peter.
 */

const DAYS = [
  {
    day: 'Segunda-feira', short: 'seg', time: '22h10', place: 'Long Island City',
    head: 'Guindaste parado no ar',
    deck: 'Operários juram que um sujeito “de pijama vermelho” segurou 40 toneladas com cordas grudentas.',
    body: 'O cabo de aço rompeu pouco depois das dez da noite, a dez andares do chão. Segundo a equipe, a carga simplesmente parou no ar, presa por fios brancos que desapareceram na manhã seguinte. A construtora não comentou.',
    photo: { src: '/assets/dive.webp', pos: '86% 18%', size: '330%' },
    note: 'foto minha!! $50', arrow: 'credit',
  },
  {
    day: 'Terça-feira', short: 'ter', time: '23h05', place: 'Astoria',
    head: 'Ladrões amanhecem grudados no teto',
    deck: 'A polícia levou duas horas para soltar a dupla que tentou levar um caixa eletrônico inteiro.',
    body: 'Os suspeitos foram encontrados pendurados de cabeça para baixo dentro da agência, envoltos no que os peritos descreveram como “um material parecido com teia, só que muito pior”. Nenhum deles quis falar com a imprensa.',
    photo: { src: '/assets/dive.webp', pos: '48% 30%', size: '260%' },
    note: 'some em 2h, eu avisei', arrow: 'head',
  },
  {
    day: 'Quarta-feira', short: 'qua', time: '19h40', place: 'Jackson Heights',
    head: 'Gato salvo a segundos do trem 7',
    deck: 'Passageiros viram um vulto descer nos trilhos e voltar com o bichano no colo.',
    body: 'O animal, um gato laranja chamado Biscoito, havia escapado de uma loja da Roosevelt Avenue. A dona diz que o resgatador “fez carinho, pediu desculpas pelo susto e sumiu pela parede”. Biscoito passa bem.',
    photo: { src: '/assets/dive.webp', pos: '14% 84%', size: '300%' },
    note: 'ele me arranhou.', arrow: 'photo',
  },
  {
    day: 'Quinta-feira', short: 'qui', time: '00h30', place: 'Flushing',
    head: 'A van que brilhava',
    deck: 'Veículo com “armas estranhas” aparece embrulhado em teia perto da Main Street. Ninguém explica.',
    body: 'Moradores relatam um zumbido agudo minutos antes da polícia chegar. O material apreendido foi levado por agentes que não se identificaram. A van, registrada em nome de uma empresa que não existe, segue no pátio.',
    photo: { src: '/assets/dive.webp', pos: '72% 72%', size: '240%' },
    note: 'contar pro Ned? NÃO.', arrow: 'head',
  },
  {
    day: 'Sexta-feira', short: 'sex', time: '03h15', place: 'Flushing Meadows',
    head: 'Alguém dormiu no Unisphere?',
    deck: 'Vigia do parque jura que a figura mascarada acenou para ele antes de sumir no escuro.',
    body: 'O segurança, há 22 anos no cargo, diz nunca ter visto nada parecido. “Estava encolhido em cima do globo, parecia cansado. Acenou e foi embora pulando.” A administração do parque vai reforçar a iluminação.',
    photo: { src: '/assets/mask.webp', pos: '50% 38%', size: '150%' },
    note: 'não era eu. (era eu)', arrow: 'photo',
  },
  {
    day: 'Sábado', short: 'sáb', time: '18h00', place: 'Forest Hills',
    head: 'Herói ou ameaça?',
    deck: 'Enquete da Gazeta: 62% dos moradores de Queens aprovam o “vizinho amigão”. 38% querem saber quem paga os prejuízos.',
    body: 'A pesquisa ouviu 1.204 moradores dos seis bairros. Entre os mais jovens, a aprovação passa de 80%. Em Forest Hills, uma senhora votou duas vezes: “é um rapaz muito educado, me ajudou com as compras”.',
    photo: { src: '/assets/dive.webp', pos: '50% 46%', size: '150%' },
    note: '62%!! tia May votou 2x', arrow: 'head',
  },
];

const SIDEBAR = [
  ['Tempo', 'Garoa fina, 12°C. À noite, ventos fortes entre os prédios.'],
  ['Metrô', 'Linha 7 com atrasos. Motivo: “aranha nos trilhos”, segundo o maquinista.'],
  ['Classificados', 'Vendo lançador de teia usado. Brincadeira. Ou não. Tratar c/ P.'],
];

const TILT = [-3.5, 2.6, -1.8, 3.2, -2.4, 1.4];
const ENTER = [-18, 14, -12, 16, -15, 10];

function FrontPage({ d, i }) {
  return (
    <article className="paper" aria-label={`Gazeta de Queens, ${d.day}: ${d.head}`}>
      <div className="paper-top">
        <span>Edição de {d.day.toLowerCase()}</span>
        <span>Queens, Nova York · {d.time}</span>
        <span>US$ 1</span>
      </div>
      <div className="paper-mast">Gazeta de Queens</div>
      <div className="paper-strap">
        <span>Nº {2140 + i}</span>
        <span>“O jornal do bairro que nunca dorme”</span>
        <span>{d.place}</span>
      </div>

      <h3 className="paper-head">{d.head}</h3>
      <p className="paper-deck">{d.deck}</p>

      <div className="paper-grid">
        <figure className="paper-photo">
          <div
            className="paper-photo-img"
            style={{ backgroundImage: `url(${d.photo.src})`, backgroundPosition: d.photo.pos, backgroundSize: d.photo.size }}
          />
          <figcaption>
            Testemunhas descrevem o mesmo vulto mascarado.
            <span className="paper-credit">Foto: Peter Parker</span>
          </figcaption>
        </figure>
        <aside className="paper-side">
          {SIDEBAR.map(([t, txt]) => (
            <div key={t}><b>{t}</b><p>{txt}</p></div>
          ))}
        </aside>
      </div>

      <div className="paper-body">
        <p>{d.body}</p>
        <p>Continua na página 4.</p>
      </div>

      {/* caneta vermelha do Peter */}
      <div className={`pen pen--${d.arrow}`} aria-hidden="true">
        <svg viewBox="0 0 200 120" className="pen-mark">
          {d.arrow === 'credit' && <path d="M20 96C6 70 40 52 96 54s102 14 92 40-120 26-150 10-18-36 18-44" />}
          {d.arrow === 'photo' && <path d="M186 104C150 92 120 60 110 22M110 22l-10 18M110 22l16 14" />}
        </svg>
        <span className="pen-note">{d.note}</span>
      </div>
    </article>
  );
}

export default function QueensSection() {
  const sectionRef = useRef(null);
  const pageRefs = useRef([]);
  const flashRef = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const N = DAYS.length;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = e.clientX / innerWidth - 0.5;
      mouse.ty = e.clientY / innerHeight - 0.5;
    };
    addEventListener('pointermove', onMove);

    let raf = 0;
    let landed = -1;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const rect = sectionRef.current.getBoundingClientRect();
      if (rect.bottom < -50 || rect.top > innerHeight + 50) return;
      const p = reduced ? 1 : clamp(-rect.top / (rect.height - innerHeight));
      // a 1ª capa cai enquanto a seção entra na tela; as outras, ao longo da rolagem
      const enter = clamp(1 - rect.top / innerHeight);
      const f = reduced ? N : rect.top > 0 ? enter * 0.999 : 1 + p * (N - 1);
      mouse.x = lerp(mouse.x, mouse.tx, 0.08);
      mouse.y = lerp(mouse.y, mouse.ty, 0.08);

      const top = Math.max(0, Math.min(N - 1, Math.ceil(f - 0.02) - 1));
      pageRefs.current.forEach((el, i) => {
        const e = easeOutCubic(clamp(f - i));
        const depth = clamp(f - i - 1, 0, 4); // quantas capas já caíram por cima desta
        const y = (1 - e) * 120;
        const rot = lerp(ENTER[i], TILT[i], e);
        const s = lerp(1.1, 1, e) * (1 - 0.035 * depth);
        const isTop = i === top;
        const rx = isTop ? -mouse.y * 8 : 0;
        const ry = isTop ? mouse.x * 10 : 0;
        // a inclinação 3D usa a perspectiva da própria capa (não corta as outras)
        el.style.transform = `translate3d(${-depth * 1.4}vw, calc(${y}vh - ${depth * 1.2}vh), 0) `
          + `perspective(1400px) rotate(${rot}deg) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s})`;
        el.style.opacity = e > 0.001 ? 1 : 0;
        el.style.filter = depth > 0.01 ? `brightness(${1 - 0.16 * depth})` : 'none';
        el.classList.toggle('is-top', isTop);
      });

      // flash de câmera quando uma capa pousa
      const nowLanded = Math.floor(f + 0.02) - 1;
      if (nowLanded !== landed) {
        if (nowLanded > landed && nowLanded >= 0 && !reduced) {
          flashRef.current.classList.remove('is-on');
          void flashRef.current.offsetWidth;
          flashRef.current.classList.add('is-on');
        }
        landed = nowLanded;
      }
      setCurrent((c) => (c === top ? c : top));
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
    };
  }, []);

  const goTo = (i) => {
    const s = sectionRef.current;
    const span = s.offsetHeight - innerHeight;
    scrollTo({ top: s.offsetTop + (i / (DAYS.length - 1)) * span + 2, behavior: 'smooth' });
  };

  return (
    <section className="gazette" id="queens" ref={sectionRef}>
      <div className="gazette-stage">
        <div className="gazette-city" aria-hidden="true" />
        <div className="gazette-lamp" aria-hidden="true" />

        <header className="gazette-intro">
          {/* fita rotuladora (Dymo) */}
          <span className="dymo" aria-label="Queens à noite">
            {[...'QUEENS À NOITE'].map((ch, i) => <i key={i}>{ch === ' ' ? '\u00a0' : ch}</i>)}
          </span>

          <h2 className="gz-title">
            <span className="gz-t1">Primeira</span>
            <span className="gz-t2">página<b>.</b></span>
          </h2>

          {/* texto batido à máquina, em tiras de papel recortadas */}
          <div className="gz-strips">
            <p><span>Ninguém sabe quem ele é.</span></p>
            <p><span>Mas toda manhã ele está no jornal.</span></p>
          </div>
          <p className="gz-tape">e quem tira as fotos sou eu.</p>

          {/* folha de contato: o índice da semana em duas tiras de filme */}
          <nav className="contact" aria-label="Edições da semana">
            {[0, 3].map((start, row) => (
              <div key={row} className={`contact-strip contact-strip--${row}`}>
                <span className="contact-edge">QUEENS 400TX ▸ {14 + start * 2}</span>
                {DAYS.slice(start, start + 3).map((d, k) => {
                  const i = start + k;
                  return (
                    <button
                      key={d.short}
                      className={`frame ${i === current ? 'is-on' : ''} ${i < current ? 'is-past' : ''}`}
                      onClick={() => goTo(i)}
                      aria-label={`${d.day}: ${d.head}`}
                    >
                      <span
                        className="frame-img"
                        style={{ backgroundImage: `url(${d.photo.src})`, backgroundPosition: d.photo.pos, backgroundSize: d.photo.size }}
                      />
                      <span className="frame-day">{d.short}</span>
                      <span className="frame-n">{14 + i * 2}{i % 2 ? 'A' : ''}</span>
                      <svg className="frame-mark" viewBox="0 0 120 90" aria-hidden="true">
                        <path d="M70 6C34 2 6 18 8 46s34 40 66 38 42-20 38-44S88 2 52 9" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </header>

        <div className="gazette-stack">
          {DAYS.map((d, i) => (
            <div key={d.short} className="paper-slot" style={{ zIndex: i + 1 }} ref={(el) => { pageRefs.current[i] = el; }}>
              <FrontPage d={d} i={i} />
            </div>
          ))}
        </div>

        <div className="gazette-flash" ref={flashRef} aria-hidden="true" />
      </div>
    </section>
  );
}
