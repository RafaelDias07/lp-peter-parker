# Front-end Design: CP5

**Aluno:** Rafael Dias Fontes
**RM:** 570504
**Turma:** 1ESPW
**Curso:** FIAP, disciplina de Front-end Design

Repositório com as três atividades do CP5. Cada uma está na sua própria pasta, com o código e os prints.

## Atividades

| # | Pasta | Tema | Tecnologia |
|---|-------|------|------------|
| 1 | [Atividade 1 bootstrap](./Atividade%201%20bootstrap) | Página de café de origem | HTML, CSS e Bootstrap 5.3 |
| 2 | [Atividade 2 Tailwind](./Atividade%202%20Tailwind) | Site "Fio & Prensa" (ateliê de livros) | HTML e Tailwind CSS 4 |
| 3 | [Atividade 3 vibecoding](./Atividade%203%20vibecoding) | Landing page animada do Peter Parker | React, Vite e IA |

---

### Atividade 1: Bootstrap

Página estática sobre café de origem, feita só com os componentes e o grid do Bootstrap.

- Seção principal com título e imagem.
- Carrossel com três imagens (componente do Bootstrap).
- Perguntas frequentes em acordeão.
- Bootstrap carregado por CDN, sem instalar nada.

**Como ver:** abra o `index.html` da pasta no navegador. Os prints ficam em `prints da atividade/`.

### Atividade 2: Tailwind

Site de um ateliê de livros artesanais, o "Fio & Prensa", estilizado só com classes utilitárias do Tailwind.

- Seção de abertura com título e chamada.
- "O ofício, em quatro etapas".
- "Peças recentes".
- "Visite o ateliê".
- Tailwind carregado por CDN (`@tailwindcss/browser@4`), sem instalar nada.

**Como ver:** abra o `index.html` da pasta no navegador. Os prints ficam em `prints/`.

### Atividade 3: Vibecoding

Landing page narrativa sobre o Peter Parker e o Homem-Aranha, guiada pela rolagem e toda animada. Foi feita em parceria com ferramentas de IA (vibecoding), com um rascunho das telas no Figma.

- Intro com a aranha crescendo e o pincel que veste a máscara no rosto do Peter.
- Seções Poderes, Queens à noite, A vida dupla e Boa noite, Queens.
- React 19 e Vite 6, só JavaScript e CSS, sem biblioteca de animação.
- Documentação própria: referências usadas e como a IA foi usada.

**Como rodar:**

```bash
cd "Atividade 3 vibecoding"
npm install
npm run dev
```

Mais detalhes no [README da atividade](./Atividade%203%20vibecoding/README.md), no [AGENTS.md](./Atividade%203%20vibecoding/AGENTS.md), nas [referências](./Atividade%203%20vibecoding/docs/references/references.md) e no [uso de IA](./Atividade%203%20vibecoding/docs/Prompts/uso-de-ia.md).

---

## Estrutura do repositório

```
CP5-Frontend/
  Atividade 1 bootstrap/    index.html, style.css, imagens/, prints
  Atividade 2 Tailwind/     index.html, prints
  Atividade 3 vibecoding/   projeto React + Vite com docs/
  README.md                 este arquivo
```

## Autor

Rafael Dias Fontes, RM 570504, turma 1ESPW.
[LinkedIn](https://www.linkedin.com/in/rafael-dias-fontes-2a947b3a7/) · [GitHub](https://github.com/RafaelDias07/CP5-Frontend)
