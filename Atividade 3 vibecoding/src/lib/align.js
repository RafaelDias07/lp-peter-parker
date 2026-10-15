// Alinhamento entre a foto do Peter, a máscara e o traje.
//
// Toda a geometria (máscara, traje, linhas dos olhos) foi desenhada num "espaço de
// referência". Para trocar de foto basta informar onde ficam os olhos nela:
// o código calcula a escala/deslocamento e converte tudo sozinho.

/** Foto atual (public/assets/peter.webp). */
export const PHOTO = {
  w: 1230,
  h: 1278,
  eyes: [[515, 458], [722, 457]], // centro das pupilas, em pixels da foto
};

/** Espaço de referência em que os desenhos foram feitos. */
const REF_EYES = [[523, 517], [757, 517]];

const mid = ([a, b]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = ([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Referência → pixels da foto: p' = p * s + [tx, ty] */
export const REF_TO_PHOTO = (() => {
  const s = dist(PHOTO.eyes) / dist(REF_EYES);
  const [rx, ry] = mid(REF_EYES);
  const [px, py] = mid(PHOTO.eyes);
  return { s, tx: px - rx * s, ty: py - ry * s };
})();

export const toPhoto = ([x, y]) => [x * REF_TO_PHOTO.s + REF_TO_PHOTO.tx, y * REF_TO_PHOTO.s + REF_TO_PHOTO.ty];

/** Aplica a conversão num contexto 2D (por cima de uma escala/posição já existente). */
export function applyRef(ctx) {
  const { s, tx, ty } = REF_TO_PHOTO;
  ctx.transform(s, 0, 0, s, tx, ty);
}

/**
 * Máscara do Homem-Aranha. As medidas abaixo estão no "espaço da máscara" original
 * (2000 px de largura): centro do rosto 1045,765 → 645,505 da referência.
 * `file` = largura do arquivo atual ÷ 2000 (o arquivo pode ter outra resolução
 * desde que o enquadramento seja o mesmo).
 */
export const MASK = {
  src: '/assets/mask.webp',
  file: 2560 / 2000,
  w: 2000,
  cropH: 1440, // corta o rodapé (barra preta + URL)
  anchor: [1045, 765],
  refAnchor: [645, 505],
  scale: 0.62,
};

/**
 * Posição da foto na tela (desktop), derivada dos olhos: o rosto fica sempre do
 * mesmo tamanho (olhos a 18.4vh de distância), com os olhos a 51.6vh do topo
 * e centralizado na horizontal — qualquer que seja o enquadramento da foto.
 */
export const PHOTO_LAYOUT = (() => {
  const k = 18.4 / dist(PHOTO.eyes); // vh por pixel da foto
  const [mx, my] = mid(PHOTO.eyes);
  return {
    '--photo-h': `${(PHOTO.h * k).toFixed(2)}vh`,
    '--photo-top': `${(51.6 - my * k).toFixed(2)}vh`,
    '--photo-left': `calc(50% - ${(mx * k).toFixed(2)}vh)`,
    '--photo-ratio': `${PHOTO.w} / ${PHOTO.h}`,
  };
})();
