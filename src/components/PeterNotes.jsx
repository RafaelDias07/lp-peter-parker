// Anotações do caderno do Peter: cada poder é uma folha arrancada, com rabisco à mão
// (traço "tremido" pelo filtro #pen) e comentário em caneta vermelha.

const D = { // atalhos para os desenhos (viewBox 0 0 120 90)
  sense: (
    <>
      <circle cx="46" cy="54" r="19" />
      <path d="M40 73c2 7 8 10 16 10" />
      <path d="M52 51h6M40 51h5" />
      <path d="M30 32l-7-7 6-3-5-9" className="hot" />
      <path d="M46 30v-8l6-3-4-9" className="hot" />
      <path d="M61 34l7-6-2-5 8-6" className="hot" />
      <path d="M82 60c-6-2-12 0-16 4" />
      <path d="M68 60l-3 5 6 0" />
      <text x="84" y="64">2s!</text>
    </>
  ),
  strength: (
    <>
      <rect x="14" y="6" width="88" height="32" rx="6" />
      <path d="M22 13h15v11H22zM43 13h15v11H43zM64 13h15v11H64zM85 13h11v18" />
      <circle cx="30" cy="40" r="5" /><circle cx="86" cy="40" r="5" />
      <circle cx="58" cy="58" r="5" />
      <path d="M58 63v14M58 66l-9-20M58 66l9-20M58 77l-6 9M58 77l6 9" className="hot" />
      <text x="78" y="70">~10t?</text>
    </>
  ),
  web: (
    <>
      <path d="M8 48c34-14 70-14 104 0v16c-34-14-70-14-104 0z" />
      <circle cx="60" cy="49" r="8" className="hot" />
      <circle cx="60" cy="49" r="2.5" />
      <path d="M68 46l14-20h12" />
      <path d="M52 44L34 24H20" />
      <text x="84" y="24">fluido v3</text>
      <text x="2" y="20">bico</text>
    </>
  ),
  agility: (
    <>
      <path d="M6 10h108" />
      <path d="M14 10l-6-6M28 10l-6-6M42 10l-6-6M56 10l-6-6M70 10l-6-6M84 10l-6-6M98 10l-6-6M112 10l-6-6" />
      <path d="M52 10l4 18M66 10l-4 18M60 28v22M60 36l-12 10M60 36l12 10" className="hot" />
      <circle cx="60" cy="57" r="7" />
      <path d="M90 74c12-6 16-20 10-34" />
      <path d="M96 42l4-4 3 6" />
      <text x="72" y="86">0,04s</text>
    </>
  ),
};

export const NOTES = [
  {
    key: 'sense',
    paper: 'lined',
    title: 'Sentido aranha',
    body: <>Formigamento na nuca uns <mark>2 segundos</mark> antes do perigo.</>,
    aside: 'não funciona com prova surpresa',
    tilt: -2.4,
  },
  {
    key: 'strength',
    paper: 'lined',
    title: 'Força',
    body: <>Segurei a balsa de Staten Island. <mark>Quase.</mark></>,
    aside: 'pote de azeitona: ainda difícil',
    tilt: 1.8,
  },
  {
    key: 'web',
    paper: 'grid',
    title: 'Teia',
    body: <>Fluido feito no lab da escola. Gruda em tudo, <mark>some em 2h</mark>.</>,
    aside: 'NÃO lavar na máquina',
    tilt: 1.3,
  },
  {
    key: 'agility',
    paper: 'lined',
    title: 'Agilidade',
    body: <>Grudo em qualquer parede. Reflexo medido: <mark>0,04 s</mark>.</>,
    aside: 'dormir de cabeça pra baixo: não',
    tilt: -1.7,
  },
];

/** Filtro de "caneta": deixa os traços levemente tremidos, como feitos à mão. */
export function PenFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="pen" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="2.6" />
      </filter>
    </svg>
  );
}

export function Note({ note }) {
  return (
    <article className={`note note--${note.paper}`} style={{ '--tilt': `${note.tilt}deg` }}>
      <span className="note-tape" aria-hidden="true" />
      <h3>{note.title}</h3>
      <p>{note.body}</p>
      <svg className="note-doodle" viewBox="0 0 120 90" aria-hidden="true">
        <g filter="url(#pen)">{D[note.key]}</g>
      </svg>
      <span className="note-aside">{note.aside}</span>
    </article>
  );
}
