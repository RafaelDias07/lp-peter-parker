import { LOCAL_SPIDER } from '../lib/spider.js';

// Rabiscos de cada cena (viewBox 0 0 260 190), desenhados à mão e tremidos pelo filtro #pen.
// Lado do dia: caneta azul + vermelha no caderno. Lado da noite: traço claro sobre o escuro.

const spider = (x, y, rot, s) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-100 -120)`}>
    <path d={LOCAL_SPIDER} className="fill-solid" />
  </g>
);

export const DAY = [
  // 07:30 — prova de química
  (
    <>
      <path d="M60 22L176 12 190 150 70 164Z" className="paperfill" />
      <path d="M82 52h84M84 68h80M86 84h58M88 100h70M90 116h44" />
      <path d="M132 22c28-8 54 4 52 24s-34 24-56 18-22-34 4-42" className="red" />
      <text x="143" y="52" className="red txt">D–</text>
      <path d="M214 84v26l-18 36h56l-18-36V84M208 84h12" />
      <path d="M200 130h40" className="red" />
      <circle cx="222" cy="68" r="4" /><circle cx="231" cy="52" r="3" />
      <path d="M26 156l60-34 4 8-60 34zM26 156l-4 12 12-4" />
      <text x="96" y="140" className="txt small">dormi 2h</text>
    </>
  ),
  // 15:00 — lição de casa
  (
    <>
      <path d="M28 46L128 34V160L28 172ZM128 34L234 46V172L128 160Z" className="paperfill" />
      <path d="M128 34V160" />
      <text x="40" y="82" className="txt">x² + y = ?</text>
      <text x="38" y="112" className="txt small">H₂O + fluido</text>
      <path d="M40 124h70M40 138h54" />
      <text x="146" y="84" className="txt red">???</text>
      <path d="M144 100h66M144 114h58M144 128h44" />
      <path d="M200 156l44-30 6 9-44 30zM200 156l-6 12 12-4" className="red" />
    </>
  ),
  // 18:40 — jantar da tia May
  (
    <>
      <circle cx="84" cy="104" r="46" /><circle cx="84" cy="104" r="30" />
      <path d="M150 58v76M144 58v22c0 8 12 8 12 0V58M150 134v30" />
      <path d="M26 66c10 10 10 54 0 70M26 66v96" />
      <circle cx="214" cy="56" r="32" />
      <path d="M214 56V34M214 56l16 10" className="red" />
      <path d="M214 28v4M214 80v4M186 56h4M238 56h4" />
      <path d="M168 112h72v64h-72z" className="note-fill" />
      <text x="176" y="138" className="txt small">tia May ♥</text>
      <text x="176" y="160" className="txt small red">cadê você?</text>
    </>
  ),
  // 23:47 — câmera
  (
    <>
      <rect x="40" y="64" width="164" height="96" rx="10" className="paperfill" />
      <path d="M80 64l10-20h44l10 20" />
      <circle cx="122" cy="112" r="34" /><circle cx="122" cy="112" r="21" />
      <path d="M108 100c8-8 22-8 28 0" />
      <path d="M184 80h12" />
      <path d="M222 22v34M205 39h34M210 27l24 24M234 27l-24 24" className="red" />
      <text x="24" y="40" className="txt red">click!</text>
      <path d="M40 130c-20 4-22 30-8 40M204 130c20 4 22 30 8 40" />
    </>
  ),
];

export const NIGHT = [
  // 07:30 — costurando o traje
  (
    <>
      <path d="M70 36c30-26 90-26 120 0 14 30 8 80-20 104-24 20-56 20-80 0-28-24-34-74-20-104z" />
      <path d="M92 78l32 12-8 24-34-14zM168 78l-32 12 8 24 34-14z" className="lens" />
      <path d="M130 14l-9 24 15 15-13 20 11 24" className="red" />
      <path d="M118 30l10 -4M124 48l12 -3M121 66l12 -2M126 86l10 0" className="red" />
      <path d="M196 156l46-72" />
      <ellipse cx="243" cy="82" rx="2.5" ry="6" transform="rotate(32 243 82)" />
      <path d="M196 156c-30 8-34 24-62 18" className="dash" />
    </>
  ),
  // 15:00 — testando a teia
  (
    <>
      <path d="M8 166h244" />
      <rect x="22" y="104" width="50" height="38" rx="4" /><path d="M30 142v24M64 142v24M22 118h50" />
      <circle cx="212" cy="34" r="20" />
      <path d="M232 22c-6 4-9 12-8 20" className="moon" />
      <path d="M186 122l-32-12" /><circle cx="150" cy="108" r="8" /><circle cx="150" cy="108" r="2.5" className="fill-solid" />
      <path d="M142 104C104 62 66 44 38 52" className="dash web" />
      <path d="M38 52l-16-8M38 52l-4-18M38 52l12-16M38 52l-18 8M38 52l-8 14" className="web" />
    </>
  ),
  // 18:40 — pulando prédios
  (
    <>
      <path d="M8 174V128h26V98h18v76h14V118h28v56h18V78h24v96h14V136h32v38h24V108h26v66" />
      <path d="M12 96C60 4 160 4 236 92" className="dash" />
      {spider(120, 38, -14, 0.3)}
      <path d="M40 150h6M90 138h6M150 152h6M210 130h6" className="win" />
    </>
  ),
  // 23:47 — patrulha
  (
    <>
      <circle cx="206" cy="40" r="22" />
      <path d="M216 26c-8 4-12 14-9 24" className="moon" />
      <path d="M44 176V138h172v38" />
      <path d="M44 138l-14 -16h24M216 138l14 -16h-24" />
      {spider(128, 100, 0, 0.34)}
      <path d="M14 70c20-24 42-24 62 0" className="red" />
      <path d="M14 82c14-14 30-14 44 0" className="red" />
      <path d="M186 96c14-10 30-10 44 4" className="blue" />
      <text x="14" y="30" className="txt small">Jackson Heights</text>
    </>
  ),
];
