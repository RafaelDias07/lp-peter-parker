<p align="center">
  <img src="./docs/imagens/logo-aranha.png" alt="Logo da aranha do Homem-Aranha" width="160" />
</p>

<h1 align="center">LP Peter Parker</h1>

<p align="center">
  Landing page animada e guiada pela rolagem, sobre o Peter Parker e o Homem-Aranha.<br />
  Atividade 3 (Vibecoding), Front-end Design, FIAP. Projeto acadêmico.
</p>

---

## O que é

Uma página única que conta uma história enquanto você rola ou move o mouse. Feita com **React + Vite**, só JavaScript e CSS, sem bibliotecas de animação: tudo é animado com `requestAnimationFrame`.

## As telas

| # | Seção | O que acontece |
|---|-------|----------------|
| 1 | **Intro e Home** | Tela vermelha, uma aranha cresce e revela o Peter. Onde o mouse passa, o rosto vira a máscara, o corpo vira o traje e o nome muda de "PETER PARKER" para "HOMEM ARANHA". |
| 2 | **Poderes** | Um olho se abre, a câmera mergulha na cidade e o caderno do Peter mostra as anotações. |
| 3 | **Queens à noite** | Capas de jornal que se sobrepõem, uma por dia, com título de máquina de escrever e folha de contatos. |
| 4 | **A vida dupla** | Caderno com rabiscos: a rotina de Peter dividida entre o dia e a noite, com um despertador digital. |
| 5 | **Boa noite, Queens** | Rádio com scanner e display de LCD, holofote e nuvens. |
| 6 | **Footer** | Links de contato (LinkedIn e GitHub) e botão para voltar ao topo. |

## Tecnologias

**Linguagens**

- **JavaScript (JSX):** toda a lógica e os componentes. Sem TypeScript.
- **CSS:** estilos e animações, sem Tailwind nem pré-processadores.
- **HTML:** só o `index.html` base, o resto é gerado pelo React.
- **SVG e Canvas:** a aranha, a teia, os rabiscos, o pincel e as partículas.

**Dependências**

| Pacote | Versão | Para que serve |
|--------|--------|----------------|
| `react` | ^19.3.0 | Interface em componentes |
| `react-dom` | ^19.3.0 | Renderiza o React no navegador |
| `vite` | ^6.4.4 | Servidor de desenvolvimento e build (dev) |
| `@vitejs/plugin-react` | ^4.7.0 | Suporte a JSX no Vite (dev) |

Não há biblioteca de animação: tudo é feito com `requestAnimationFrame`, CSS e Canvas.

## Como rodar

Precisa do [Node.js](https://nodejs.org) instalado.

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

Para gerar a versão final:

```bash
npm run build
npm run preview
```

## Estrutura

```
src/
  App.jsx          fluxo geral: intro, home e seções
  components/      uma seção ou peça por arquivo
  lib/             alinhamento da foto, logo vetorizado, rolagem
  styles/          CSS dividido por seção
public/assets/     imagens (Peter, máscara, mergulho)
docs/
  figma/           rascunho das telas no Figma
  references/      referências de componentes e sites
  Prompts/         como a IA foi usada
AGENTS.md          guia detalhado para quem for mexer no código
```

Principais arquivos:

- `src/components/SpiderIntro.jsx`: animação de entrada (clip-path no formato da aranha).
- `src/components/PaintCanvas.jsx`: pincel, máscara, traje e nome revelados.
- `src/components/HomeUI.jsx`: header, menu e detalhes da home.
- `src/lib/align.js`: alinhamento foto e máscara. Para trocar a foto, atualize `w`, `h` e `eyes`.
- `src/styles/`: um CSS por seção (`base`, `intro`, `home`, `powers`, `gazette`, `vida`, `finale`, `footer`), importados em ordem por `index.css`.

## Documentação

- [`AGENTS.md`](./AGENTS.md): arquitetura, regras de design e cuidados com desempenho.
- [`docs/references/references.md`](./docs/references/references.md): referências usadas.
- [`docs/Prompts/uso-de-ia.md`](./docs/Prompts/uso-de-ia.md): como usei IA no projeto.

## Autor

Rafael Dias, [LinkedIn](https://www.linkedin.com/in/rafael-dias-fontes-2a947b3a7/) · [GitHub](https://github.com/RafaelDias07/CP5-Frontend)
