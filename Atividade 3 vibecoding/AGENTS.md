# AGENTS.md: LP "Peter Parker"

Guia para agentes (e pessoas) que forem mexer neste projeto. Leia antes de alterar qualquer coisa:
boa parte do comportamento depende de detalhes que não são óbvios lendo um arquivo só.

## Visão geral

Landing page narrativa sobre o Peter Parker / Homem-Aranha, feita para a **Atividade 3 (Vibecoding)
de Front-end Design, FIAP**. É um projeto acadêmico, sem fins comerciais.

A página conta uma história em 5 seções + footer, quase tudo guiado pela rolagem:

| # | Seção | `id` | Componente | Mecânica de rolagem |
|---|-------|------|------------|---------------------|
|, | Intro (aranha cresce e "atravessa" a tela) |, | `SpiderIntro.jsx` | Tempo (não rola; página travada) |
| 1 | Home: foto do Peter + pincel que veste a máscara |, | `App.jsx`, `PaintCanvas.jsx`, `HomeUI.jsx` | Normal |
| 2 | Poderes: despertador → olho abre → mergulho → teia + folhas do caderno | `poderes` | `PowersSection.jsx` | **Trava de rolagem** (`useScrubLock`) |
| 3 | Queens à noite: "Primeira página" (capas da Gazeta caindo) | `queens` | `QueensSection.jsx` | Palco `sticky` (560vh) |
| 4 | A vida dupla: folha do dia rasgada sobre a noite | `vida` | `VidaSection.jsx` | Palco `sticky` (480vh) |
| 5 | Boa noite, Queens: holofote, sinal da aranha, rádio, "TÔ INDO." | `boa-noite` | `FinalSection.jsx` | Palco `sticky` (340vh) |
|, | Footer |, | `Footer.jsx` | Normal |

## Comandos

```bash
npm install        # dependências
npm run dev        # servidor local (Vite)
npm run build      # build de produção em dist/, rode sempre antes de dar algo por pronto
npm run preview    # serve o build
```

Não há testes automatizados nem linter configurados. A verificação é feita no navegador
(veja [Como verificar](#como-verificar)).

## Stack e restrições

- **React 19 + Vite 6, JavaScript puro (JSX).** Sem TypeScript, sem Tailwind, sem shadcn.
- **Zero dependências de runtime além de React.** Animações, scroll, canvas e SVG são escritos à mão.
  Não adicione GSAP, Framer Motion, Lenis, Three.js etc. sem o dono do projeto pedir.
- Fontes vêm do Google Fonts, linkadas em `index.html`.
- Textos da interface e comentários do código são em **português**.

## Mapa do código

```
index.html                 fontes (Google Fonts) + preload da foto
src/main.jsx               monta o App e importa src/styles/index.css
src/App.jsx                fase intro/ready, home, menu, ordem das seções, rolagem suave dos links
src/components/
  SpiderIntro.jsx          intro: clip-path no formato da aranha crescendo (escala logarítmica)
  PaintCanvas.jsx          pincel de cerdas (canvas): revela máscara, traje gerado e "HOMEM ARANHA" no logo
  HomeUI.jsx               header, nome com fio + aranha, card "Esta noite", coordenadas, teia de fundo, menu, linhas dos olhos
  Cursor.jsx               cursor customizado (anel do tamanho do pincel na home)
  PowersSection.jsx        seção 2 inteira (linha do tempo por progresso q de 0 a 1)
  PeterNotes.jsx           folhas do caderno (textos, rabiscos, filtro #pen de traço tremido)
  Segments.jsx             dígitos de 7 segmentos em SVG (despertador e LCD do rádio)
  QueensSection.jsx        seção 3: capas da Gazeta + folha de contato
  VidaSection.jsx          seção 4 (+ VidaDoodles.jsx com os rabiscos de cada horário)
  FinalSection.jsx         seção 5: cidade, holofote, nuvens geradas, rádio-scanner, resposta
  Footer.jsx               footer (CONTACTS e AUTHOR ficam no topo do arquivo)
src/lib/
  ease.js                  clamp, lerp, smooth (smoothstep), easings, prefersReducedMotion
  spider.js                logo da aranha (contorno vetorizado) + spiderPath() + coverScale()
  align.js                 alinhamento foto ↔ máscara ↔ traje, a partir da posição dos olhos
  useScrubLock.js          trava a página e converte roda/trackpad/toque/teclado em progresso da cena
  smoothScroll.js          rolagem animada dos links "#secao" (e aviso para a trava não travar no caminho)
  cityRush.js              partículas do mergulho (luzes/chuva em direção à câmera)
src/styles/                um CSS por seção, importados em ordem por index.css
public/assets/             peter.webp, mask.webp, dive.webp
```

## Arquitetura: o que não é óbvio

### Animação: refs + `requestAnimationFrame`, nunca `setState` por quadro
Todas as cenas seguem o mesmo padrão:
1. `useLayoutEffect` mede a geometria (tamanho da tela, centros, caminhos) e recalcula no `resize`.
2. `useEffect` roda um loop `requestAnimationFrame` que lê o progresso (rolagem ou tempo) e escreve
   **direto em `el.style` / atributos SVG** via `ref`.
3. O loop sai cedo quando a seção está fora da tela (`rect.bottom < -50 || rect.top > innerHeight + 50`).
4. O cleanup cancela o `raf` e remove todos os listeners.

`setState` só é usado para mudanças discretas (ex.: qual capa/horário está ativo), sempre com guarda
para não disparar a cada quadro (`setX((c) => (c === novo ? c : novo))`).

Linhas do tempo são escritas como faixas de progresso com `smooth(a, b, p)` / `clamp((p - a) / d)` e
documentadas num comentário no topo do componente. **Se mudar um intervalo, atualize o comentário.**

### Trava de rolagem da seção Poderes (`useScrubLock` + `smoothScroll`)
- A seção tem 100vh. Quando o topo dela encosta no topo da tela, `html.scrub-lock` é aplicado
  (`overflow: hidden` de verdade) e a roda/trackpad/toque/teclado viram progresso da cena
  (`distance` = quantos px de rolagem equivalem à cena inteira; hoje 4600).
- Solta no fim (rolando para baixo) e no começo (para cima); volta a travar ao reentrar.
- **Não troque o `overflow: hidden` por só `preventDefault`.** No Chrome/Mac o gesto de trackpad que
  começou antes da trava não pode ser cancelado por JS; o Chrome e a trava "brigavam" e a tela piscava preto.
- Saltos grandes de rolagem (âncora, barra de rolagem) e a rolagem animada dos links (`data-autoscroll`
  em `<html>`) são ignorados pela trava, senão "voltar ao topo" ficaria preso no meio.
- `body` usa `overflow-x: clip` (não `hidden`): `hidden` transforma o body em área de rolagem e quebra a trava.

### Alinhamento foto ↔ máscara ↔ traje (`align.js`)
- Máscara, traje e linhas dos olhos foram desenhados num **espaço de referência**. A conversão para a
  foto atual é calculada a partir de `PHOTO.eyes` (centro das duas pupilas, em pixels da foto).
- **Para trocar a foto do Peter:** substitua `public/assets/peter.webp` (PNG/WebP com fundo transparente)
  e atualize `PHOTO.w`, `PHOTO.h` e `PHOTO.eyes`. Tamanho/posição na tela (`PHOTO_LAYOUT`) se ajustam sozinhos.
- **Para trocar a máscara** (mesmo enquadramento, outra resolução): atualize `MASK.file`
  (= largura do arquivo ÷ 2000). As outras medidas de `MASK` estão no espaço original de 2000 px.
- O traje do pescoço para baixo é **gerado em código** a partir da silhueta da foto (`prepareSuit` em
  `PaintCanvas.jsx`); a máscara é recortada pela silhueta abaixo do pescoço (`MASK_CLIP`).

### A aranha (`spider.js`)
- `LOGO` é o contorno do logo vetorizado de uma imagem de referência, normalizado em 200×240,
  **um único contorno fechado** (funciona igual como `clip-path: path(nonzero, …)` e como `<path>`).
- `ANCHOR` (centro do abdômen) é o ponto de onde a intro cresce; `coverScale()` acha a escala em que o
  corpo cobre a tela inteira.
- Para centralizar a aranha num SVG use o centro da caixa (100, 120), ex.: `translate(-100 -120)` ou
  `VIEW.w / 2, VIEW.h / 2`, não o `ANCHOR`.

### Pincel da home (`PaintCanvas.jsx`)
- Rastro em "camadas de tempo" (`LAYER_MS`): cada trecho é desenhado uma vez e só a opacidade da camada
  muda; some em `LIFE` ms. Isso permite 110 cerdas sem redesenhar tudo a cada quadro.
- Coordenadas do rastro são **locais à home** (ela rola com a página).

## CSS

- Um arquivo por seção em `src/styles/`, importados em ordem por `index.css`. Regras globais (tokens,
  reset, `::selection`, cursor, grão, `prefers-reduced-motion`) ficam **só** em `base.css`.
- Cada seção tem prefixo próprio: `.powers*`/`.note*`/`.web-*`, `.gazette*`/`.paper*`/`.gz-*`/`.contact*`,
  `.vd-*`, `.finale*`/`.scanner*`/`.lcd-*`, `.ft-*`. Mantenha o prefixo ao criar classes novas.
- Media queries de celular ficam no fim do arquivo da seção (`max-aspect-ratio: 4/5`).
- Tokens em `:root`: `--red #e3262b`, `--ink`, `--paper`, `--serif`, `--sans`, `--hand`, `--script`,
  `--ease`, `--gutter`. Use os tokens em vez de repetir valores.
- Classes "sem uso" aparentes geralmente são montadas no JSX (`pen--${d.arrow}`, `vd-day-sky--${i}`,
  `is-${phase}`), procure o template antes de apagar.

## Design: identidade e o que evitar

O dono do projeto rejeitou várias vezes resultados como **"Genérico"**. A identidade que funcionou é:
**objetos do mundo do Peter**, não interface genérica.

- **Linguagem visual:** caderno escolar (pauta, quadriculado, fita adesiva, caneta azul + correção em
  vermelho), jornal de bairro (Gazeta de Queens, fictícia), kit de fotógrafo (folha de contato com
  círculo de lápis de cera, fita Dymo), rádio-relógio de LED, rádio-scanner com LCD âmbar.
- **Voz:** o Peter escrevendo, com humor ("pote de azeitona: ainda difícil", "não era eu. (era eu)").
- **Paleta:** vermelho `#e3262b`, papel `#efeeea`/`#ebe3cf`, tinta `#141414`, azul de caneta `#1d3a8f`,
  noite `#05070d`–`#0b1022`, âmbar de LCD `#e2a33d`.
- **Fontes por papel:** Instrument Serif (títulos editoriais), Inter Tight (UI), Caveat (mão do Peter),
  Bodoni Moda / UnifrakturMaguntia (jornal), Special Elite (máquina de escrever), Permanent Marker,
  Archivo Black (Dymo), Anton (cartaz), Share Tech Mono (LCD/rádio).

**Evite (foi rejeitado):**
- Rótulos de seção tipo "02, PODERES", numeração "01/02/03" em cards, ícones de linha genéricos.
- Cards de vidro fosco (glassmorphism) e a fórmula "serifa grande + uma palavra em itálico vermelho".
- Pílulas/faixas com borda fina, letras espaçadas e brilho neon (ex.: o antigo cabeçalho do rádio).
- Mapas/ilustrações "simples" que destoam do nível cinematográfico das outras cenas.
- Repetir a mesma foto como fundo em várias seções.
- Desenhar uma aranha genérica: use sempre o `LOCAL_SPIDER`/`spiderPath` de `spider.js`.

Antes de criar algo novo, pergunte: "que objeto do Peter seria isso?".

## Desempenho (lições aprendidas)

- **Não escale imagens gigantes com `transform`.** A cena do mergulho tinha 5232 px escalada para baixo e
  piscava; hoje o elemento tem o tamanho "cover" e só o zoom relativo vai no `transform`.
- Evite `mix-blend-mode`, `filter: blur()` que liga/desliga a cada quadro e camadas muito maiores que a tela.
- Texturas (nuvens, ruído) são **geradas uma vez** (canvas → dataURL) e reaproveitadas, não recalculadas.
- Para um elemento 3D inclinar sem cortar os vizinhos, use `perspective()` **no próprio transform**,
  sem `transform-style: preserve-3d` compartilhado (foi assim que se corrigiu o corte entre as capas).
- Contorno de texto: fontes com formas sobrepostas mostram traços internos com `-webkit-text-stroke`;
  use o filtro SVG `#ftOutline` (dilata e subtrai) como no footer.

## Assets

- `public/assets/peter.webp` (1230×1278, fundo transparente), `mask.webp` (2560×1978),
  `dive.webp` (5232×2944, imagem girada para a horizontal).
- As imagens de baixa resolução foram ampliadas com Real-ESRGAN (fora do projeto). Prefira fontes em boa
  resolução; se precisar ampliar, mantenha o enquadramento para não quebrar o alinhamento.
- Imagens de personagens/marca são da Marvel/Sony: uso apenas acadêmico.

## Acessibilidade

- `prefers-reduced-motion`: intro é pulada, cenas vão direto ao estado final, animações CSS são cortadas.
  Novas animações devem respeitar isso (`prefersReducedMotion()` em JS).
- Elementos decorativos com `aria-hidden="true"`; textos importantes continuam como texto real
  (ex.: `aria-label` no despertador e no rádio).
- Botões e links interativos precisam funcionar com teclado (`onFocus` já é tratado onde há hover).

## Como verificar

1. `npm run build` sem erros.
2. `npm run dev` e percorra a página inteira em **1440×900** e numa tela mais baixa (~1000×640).
   Confira também o console (sem erros).
3. Mudou a trava/rolagem? Teste: entrar nos Poderes rolando, avançar a cena, sair pelo fim e pelo começo,
   reentrar subindo, clicar nos links do footer/menu (devem deslizar e não travar no caminho) e a aranha
   do footer (volta ao topo e repete a intro).
4. Simular rolagem da cena em testes automatizados:
   `window.dispatchEvent(new WheelEvent('wheel', { deltaY: 4600 * q, cancelable: true }))`.
5. Mudou CSS em massa? Compare o estilo calculado dos elementos antes/depois (`getComputedStyle`) na
   mesma resolução, diferenças só em elementos animados (opacidade das estrelas/LEDs) são esperadas.

## Fora deste repositório

- **Plugin do Figma** que gera as 12 telas do protótipo: `~/Documents/spider-LP`
  (`manifest.json`, `code.js`, `ui.html`). É referência visual para a entrega, não precisa ser idêntico
  ao site. O Figma não aceita WebP: a `ui.html` converte para PNG/JPG (máx. 4096 px) antes de enviar.

## Não faça

- Não faça commit/push sem o dono do projeto pedir. As atividades anteriores seguem o padrão de
  mensagem "Atividade X concluida!".
- Não adicione dependências, TypeScript ou Tailwind.
- Não volte a fixar a primeira dobra (`.home`) com `position: fixed` nem use `overflow-x: hidden` no body.
- Não apague textos/fluxos já aprovados para "simplificar" sem combinar.
