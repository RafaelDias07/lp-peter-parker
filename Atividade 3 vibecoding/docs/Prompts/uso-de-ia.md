# Uso de IA no desenvolvimento: LP Peter Parker

Este documento conta **como usei IA para construir a LP**: quais ferramentas, como organizei os prompts por
sessão, o que a IA sugeriu e eu **rejeitei ou mudei**, os bugs que apareceram e as melhorias que eu pedi.

> **Nota sobre os prompts:** como eu ajustava a ideia ao longo de cada sessão, os prompts abaixo estão
> organizados e reescritos de forma mais limpa a partir do que eu pedi. Eles mostram o conteúdo e a estrutura
> de cada pedido, não o texto exato, palavra por palavra.

---

## 1. Ferramentas usadas

| Ferramenta | Para que usei |
|---|---|
| **Gemini** | Criatividade: escolher o tema, estruturar a ideia de cada sessão e montar o prompt ideal antes de enviar |
| **Claude Code** (modelos Claude) | **Desenvolvimento** do código da LP, no terminal e no app, em sessões separadas (uma por seção) |
| **OpenCode** com o modelo gratuito **Big Pickle** | Tirar dúvidas sobre linhas de código, direto no terminal |
| **Figma** (plugin gerado pelo Claude Code) | Rascunho das telas: primeiro da primeira tela e, no fim, de todas |
| **Real-ESRGAN** | Ampliar com IA as imagens de baixa resolução |
| **Pinterest** | Origem das imagens (foto do Peter, máscara, cena do mergulho, logo da aranha) |

---

## 2. Como trabalhei

- **Um prompt bem estruturado por sessão**, e depois ajustes em cima dele. Antes de escrever cada prompt, eu
  jogava a ideia no Gemini para ele me ajudar a estruturar e montar o prompt ideal.
- **Desenvolvimento no Claude Code.** Todo o código da LP foi desenvolvido no Claude Code, em sessões
  separadas, e o Gemini ficou só para a ideia e para estruturar os prompts.
- **Código "quebrado" de propósito.** Optei por deixar o código **quebrado em partes pequenas**: um componente
  por seção, arquivos separados para a lógica (`src/lib/`) e um CSS por seção (`src/styles/`), em vez de poucos
  arquivos gigantes. Fiz isso justamente para **conseguir entender e acompanhar o código mais facilmente**:
  cada arquivo cuida de uma coisa só, então dá para ler, testar e perguntar sobre um pedaço de cada vez.
- **Modo manual.** Eu não deixei a IA fazer tudo sozinha: ela **pedia permissão** para cada ação (criar
  arquivo, rodar comando, instalar algo) e eu ia aceitando **depois de ler**. Todo o código gerado foi
  aprovado por mim.
- **Eu lia tudo para entender.** O que eu não entendia, eu perguntava, primeiro ao próprio Claude e, para
  dúvidas de linha de código, ao **OpenCode**.
- **Eu decidia o rumo.** Quando algo ficava feio ou genérico, eu rejeitava e pedia outra
  direção. Várias das melhores ideias da LP vieram dessas correções (o olho que abre, a página preta de
  caderno, o rádio-scanner).

### Como usei o OpenCode para tirar dúvidas

Para dúvidas de linha de código, usei o **OpenCode**, que tem modelos gratuitos, com o modelo **Big Pickle**.
Ele é muito bom para essa função por três motivos:
1. **Roda no terminal**, dentro da pasta do projeto, então tem o **contexto** do código.
2. Lê o arquivo **AGENTS.md** do projeto, que explica a arquitetura, e por isso responde com precisão.
3. É gratuito, então dá para perguntar à vontade sem gastar o limite das outras ferramentas.

Exemplos de dúvidas que levei para ele: o que é um `ref` e por que a animação não usa `setState`; como o
`requestAnimationFrame` funciona; o que `clip-path` faz na intro; por que a trava de rolagem precisa de
`overflow: hidden`.

---

## 3. Sessão 0: A ideia (Gemini)

**Objetivo:** escolher o tema da landing page.

Usei o Gemini para me ajudar na criatividade e a escolher um tema e um modelo de landing page como base. Foi
daí que veio a ideia de fazer uma LP do **Peter Parker / Homem-Aranha**.

Com o tema escolhido, lembrei do site do **Lando Norris** (landonorris.com), que tem um retrato no centro da
tela e um efeito de revelar outra camada ao passar o mouse no rosto. Decidi **reproduzir esse efeito para
entender como funcionava o código**, e porque ia ficar muito bom com o Homem-Aranha (o rosto do Peter virando
a máscara).

Depois fui ao Claude e escrevi o prompt inicial dizendo que queria uma LP do Peter Parker / Homem-Aranha,
seguindo a regra de **um prompt bem estruturado por sessão**.

---

## 4. Sessão 1: Primeira tela: intro, home e pincel

Antes de enviar, joguei a ideia no Gemini para estruturar o prompt.

### Prompt usado (versão base)

```text
Contexto
Quero criar uma landing page do Peter Parker / Homem-Aranha em React + Vite (JavaScript, sem Tailwind e
sem bibliotecas de animação). A primeira tela deve lembrar o site landonorris.com: retrato centralizado em
fundo claro, logo no canto superior esquerdo, botão de destaque e botão de menu no canto direito.

Objetivo da primeira tela
1. Intro: tela inteira vermelha com uma aranha no meio, bem pequena. A aranha cresce e, por dentro dela
   (como um recorte transparente), vai aparecendo o Peter Parker, até a aranha "sair da tela" e a home
   completa aparecer.
2. Home: foto do Peter em PNG sem fundo, centralizada, com o fundo branco.
3. Ao passar o mouse no rosto, a parte tocada vira o rosto do Homem-Aranha (máscara), e o fundo branco
   fica vermelho na região.
4. Header com logo "PETER PARKER", botão de destaque vermelho e botão de menu; um card "Esta noite" no
   canto inferior esquerdo.

Requisitos técnicos
- Animações feitas à mão (CSS + JavaScript + canvas), sem GSAP ou Framer Motion.
- Código organizado em componentes, com comentários em português explicando o que cada parte faz.
- Respeitar prefers-reduced-motion.

Entrega
Explique o que vai criar antes de criar, peça permissão para cada arquivo e me diga como rodar.
```

Antes de codar, pedi também um **plugin do Figma** para ter um **rascunho** da primeira tela e entender o que ia ser feito. No fim do projeto, pedi um **rascunho de todas as telas** no Figma.

### O que a IA propôs que eu rejeitei ou mudei

- **Pincel.** A primeira versão pintava de forma contínua e acumulava tinta. Eu pedi que o pincel fosse **"peludo"**
  (cerdas, como na imagem de referência que mandei) e que **não pintasse**: só **revelasse a tela por onde o
  mouse passa e depois saísse sozinho**. Depois pedi que o rastro durasse **2 segundos** para sumir.
- **Traje no pescoço e na roupa.** Quando eu passava o pincel no pescoço ou na roupa, aparecia só vermelho
  chapado. Eu pedi o **traje do Homem-Aranha** ali. A IA primeiro usou a textura da roupa da foto e a cor
  ficou diferente entre pescoço, camisa e paletó. Eu rejeitei: *"o Homem-Aranha só tem um traje, é uma peça
  só"*. Ela refez o traje usando só a silhueta do corpo, com um vermelho único.
- **Máscara sobrando.** Do lado esquerdo, uma parte da máscara ficava para fora do traje. Pedi a correção, e a
  máscara passou a ser recortada pela silhueta do corpo abaixo do pescoço.
- **Nome que vira HOMEM ARANHA.** Pedi um efeito no nome "PETER PARKER". A primeira versão trocava as letras
  com `:hover` e **não funcionava**. Eu disse que o certo era **igual ao desenho**: pintar com o pincel e,
  onde pinta, aparecer "HOMEM ARANHA".
- **Foto do Peter.** Eu troquei a foto mais de uma vez. A IA assumiu que uma delas tinha fundo transparente,
  mas o **xadrez estava desenhado na imagem**. Eu mandei uma versão com transparência real.
- **Linhas nos olhos.** Pedi um contorno **bem discreto** da máscara sobre os olhos do Peter real, como na foto
  de referência.
- **Aranha real.** A IA tinha desenhado uma aranha qualquer. Mandei o **logo real** e pedi que usasse a aranha
  de verdade na intro e no resto da página. Ela vetorizou o logo da imagem.

### Bugs e melhorias que apontei

- O hover do nome parava de funcionar porque as próprias letras se mexiam sob o mouse, e o navegador achava
  que o mouse tinha saído. A solução foi comparar a posição do mouse com uma área fixa.
- O vermelho do traje ficava diferente em cada parte do corpo.
- A imagem da máscara tinha uma sobra no canto que aparecia fora do corpo.

---

## 5. Sessão 2: Poderes (referências e scroll)

Aqui comecei a **procurar referências** (estão em `docs/references/references.md`) e estruturei os prompts a
partir dos componentes que eu queria usar. A principal foi o componente **Scroll-Locked Video Hero** do
21st.dev, que trava a página e usa a rolagem para controlar uma animação.

### Prompt usado (versão base)

```text
Contexto
Landing page do Peter Parker em React + Vite (JavaScript). A segunda seção se chama "Poderes".

Referência
Componente "Scroll-Locked Video Hero" do 21st.dev: a página trava e a rolagem passa a controlar a cena,
para frente e para trás, com suavização. No fim da cena a página destrava e segue normalmente.
O componente original usa TypeScript e Tailwind: reescreva a ideia em JavaScript puro, sem copiar.

Objetivo
Uma cena controlada pela rolagem: o Homem-Aranha dispara uma teia, a teia se espalha pela tela e, nela,
ficam presos 4 cards com os poderes dele (sentido aranha, força, teia e agilidade).

Requisitos
- Hook próprio para a trava de rolagem, com roda, trackpad, toque e teclado.
- A cena deve ser fluida e ter uma barra de progresso fina.
- Cards com efeito ao passar o mouse.

Entrega
Explique cada parte, peça permissão antes de criar arquivos e liste o que eu preciso testar.
```

### O que a IA propôs que eu rejeitei ou mudei

- **Mão desenhada em SVG.** A primeira versão tinha uma mão estilizada. Eu rejeitei: *"ficou muito ruim, muito
  infantil"*. Perguntei se o ChatGPT poderia gerar uma imagem; a IA explicou que ele recusa personagens com
  marca, então segui **pegando imagens no Pinterest e melhorando com IA**.
- **Transição.** A tela começava **colada na luva** e não dava para entender. Pedi o contrário: começar **de
  longe e aproximar**. Depois, ao receber uma imagem melhor (o mergulho sobre a cidade), pedi uma transição
  com ela.
- **Imagem em quadro pequeno.** A imagem aparecia num quadro com faixas pretas. Eu pedi **tela inteira**,
  e depois **na horizontal**.
- **Zoom na testa.** O zoom terminava "do nada" na testa do Homem-Aranha. Pedi um movimento mais natural, e a
  câmera passou a descer pela imagem com zoom suave.
- **Abertura.** A abertura era uma fresta vertical. Eu tive a ideia de ser **um olho que fecha e abre**, e a
  cena passou a abrir como um olho acordando.
- **Visual dos cards.** Não gostei dos rótulos "02, Poderes", dos números "01/02", dos ícones e dos
  cards de vidro: achei tudo **genérico**. Pedi algo mais criativo. Surgiu a ideia do **caderno do
  Peter** (folhas pautadas, caneta, rabiscos).
- **Fundo confuso.** O fundo com a cena atrás dos cards estava confuso. Pedi **mais escuro**, e depois pedi
  **vermelho**.
- **Texto da abertura.** Achei "A cidade nunca dorme." genérico. Pedi só para melhorar o texto, e
  a abertura virou um despertador de LED.

### Bugs e melhorias que apontei

- A qualidade da imagem estava ruim: ampliamos com o **Real-ESRGAN**.

---

## 6. Sessão 3: Queens à noite

### Prompt usado (versão base)

```text
Contexto
Landing page do Peter Parker em React + Vite (JavaScript). Terceira seção: "Queens à noite".

Ideia
O Peter é fotógrafo e vende fotos do Homem-Aranha para um jornal. A seção mostra a semana dele em Queens.

Objetivo
Capas de um jornal fictício que caem uma sobre a outra, de segunda a sábado, com manchete, foto,
colunas e anotações à mão do Peter por cima. Um índice para ir direto a cada dia.

Referências
Cartas empilhadas em perspectiva (CinematicCardDeck, Stacked Card do 21st.dev) e folha de contato de
fotógrafo (template Selects).

Requisitos
- Efeito 3D ao passar o mouse na capa de cima.
- Fontes que não sejam as padrão.
- Não parecer feito por IA.

Entrega
Peça permissão antes de criar e explique as escolhas.
```

### O que a IA propôs que eu rejeitei ou mudei

- **Mapa de Queens.** A primeira ideia era um mapa desenhado à mão com uma rota de patrulha. Eu rejeitei:
  *"não gostei do design, acho que você pode fazer algo bem melhor"*. A IA trocou por um conceito novo, as
  **capas de jornal** ("Primeira página").
- **Bloco de texto da esquerda.** Achei o título, o parágrafo cinza e a frase em cursiva muito genéricos.
  Pedi para buscar referências, deixar mais humano e **não usar as fontes padrão**. Surgiram a fita
  Dymo, as tiras de papel datilografadas e a folha de contato com o círculo de lápis de cera.

### Bugs e melhorias que apontei

- **Capas se cortando.** Quando eu passava o mouse na capa de cima, ela **cortava** a de baixo, em vez de
  ficar sobreposta. A causa era o espaço 3D compartilhado entre as capas, e cada uma passou a ter a sua
  própria perspectiva.

---

## 7. Sessão 4: A vida dupla

### Prompt usado (versão base)

```text
Contexto
Landing page do Peter Parker em React + Vite (JavaScript). Quarta seção: "A vida dupla".

Ideia
A tela dividida entre o dia do Peter (escola, tia May, lição de casa) e a noite do Homem-Aranha.

Objetivo
Um divisor que o mouse controla e que "rasga" a metade do dia para mostrar a noite. Um relógio no meio
com 4 horários (07:30, 15:00, 18:40, 23:47); cada horário muda as duas vidas ao mesmo tempo.

Requisitos
- O estilo visual deve combinar com o resto da página (caderno, rabiscos).
- Não depender de imagens novas.

Entrega
Peça permissão, explique e me diga o que testar.
```

### O que a IA propôs que eu rejeitei ou mudei

- **Loja.** Para essa parte a IA sugeriu uma **loja** (por causa do botão "LOJA" do topo) com produtos. Eu
  disse que **não fazia sentido** e que eu não tinha fotos dos produtos. Combinamos uma seção sem imagens novas,
  e o botão do topo passou a levar para a vida dupla.
- **Foto de fundo.** A noite usava a foto do Homem-Aranha desfocada. Eu rejeitei: *"não seria melhor ter outra
  coisa, por exemplo só a cor de caderno, e o outro lado ser outra cor de caderno?"*. A noite virou **a outra
  página do mesmo caderno, em papel preto**.

---

## 8. Sessão 5: Encerramento e footer

### Prompt usado (versão base)

```text
Contexto
Landing page do Peter Parker em React + Vite (JavaScript). Últimas seções: Encerramento e footer.

Encerramento
Cena de noite em tela cheia. Rolando, um holofote liga e o feixe projeta o sinal da aranha nas nuvens.
Depois aparece a frase final.

Footer
Aranha pendurada num fio que sobe ao topo e repete a intro. Navegação, contato, créditos e um
"PETER PARKER" gigante que se pinta onde o mouse passa.

Requisitos
- Usar a aranha real do Homem-Aranha (não uma aranha qualquer).
- Textos e design que não pareçam genéricos.

Entrega
Peça permissão antes de criar e explique cada decisão.
```

### O que a IA propôs que eu rejeitei ou mudei

- **Aranha.** A que a IA desenhou era "uma aranha qualquer". Eu mandei o logo e pedi a aranha real.
- **Luz do holofote.** Achei o desenho da luz simples. Pedi para melhorar, e ele ganhou feixe em camadas,
  poeira flutuando, nuvens e disco de luz.
- **Texto do final.** Achei "Seu vizinho amigão está de plantão." genérico. Pedi só para melhorar o
  texto, e virou a cena do **rádio da polícia chamando e o Peter respondendo "TÔ INDO."**
- **Rádio.** A faixa do rádio (borda fina, letras espaçadas, brilho verde) também não gostei: achei genérico.
  Eu gostei da ideia, mas pedi **só para mudar o design**, e ele virou um rádio-scanner de verdade.

### Bugs e melhorias que apontei

- **Traços internos** nas letras P, A e R do "PETER PARKER" gigante. A fonte tem formas sobrepostas, e o contorno
  comum mostrava linhas que não deveriam aparecer. Foi trocado por um contorno desenhado só por fora.
- **Clicar numa seção do footer só aparecia na seção.** Pedi que o link **rolasse até a seção**, de baixo para
  cima. A rolagem animada precisou ser ensinada a ignorar a trava dos Poderes para não ficar presa no meio.

---

## 9. Responsabilidade

**Todo o código gerado pela IA (no Claude Code) foi aprovado por mim.** Eu usei o modo manual: a IA pedia permissão antes de cada
ação e eu aceitava depois de ler. O que eu não entendia, eu perguntava (ao Claude e ao OpenCode com o Big
Pickle). As ideias principais (tema, referências, olho que abre, caderno preto da vida dupla, rádio-scanner)
e as decisões de rejeitar o que não ficou bom foram minhas.
