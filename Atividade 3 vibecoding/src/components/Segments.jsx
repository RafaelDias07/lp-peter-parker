// Dígitos de 7 segmentos (rádio-relógio), desenhados em SVG. Segmentos apagados aparecem
// bem fracos, como no LED de verdade.
const SEG = {
  a: 'M14 4h32l-6 6H20z', b: 'M48 6v32l-6-4V12z', c: 'M48 46v32l-6-6V50z', d: 'M14 84h32l-6-6H20z',
  e: 'M12 46v32l6-6V50z', f: 'M12 6v32l6-4V12z', g: 'M16 44l4-4h20l4 4-4 4H20z',
};
const DIGITS = {
  0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg',
};

export default function Segments({ value, className }) {
  const chars = [...value];
  let x = 0;
  const parts = chars.map((ch, i) => {
    if (ch === ':') {
      const el = (
        <g key={i} transform={`translate(${x} 0)`} className="seg-colon">
          <rect x="6" y="26" width="8" height="8" rx="1.5" /><rect x="6" y="56" width="8" height="8" rx="1.5" />
        </g>
      );
      x += 22;
      return el;
    }
    const on = DIGITS[ch] || '';
    const el = (
      <g key={i} transform={`translate(${x} 0) skewX(-6)`}>
        {Object.entries(SEG).map(([k, d]) => <path key={k} d={d} className={on.includes(k) ? 'seg-on' : 'seg-off'} />)}
      </g>
    );
    x += 64;
    return el;
  });
  return (
    <svg className={className} viewBox={`-4 0 ${x + 8} 88`} role="img" aria-label={value}>
      {parts}
    </svg>
  );
}
