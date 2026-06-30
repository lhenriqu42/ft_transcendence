# Monorepo Template

Este repositório organiza o projeto em formato de monorepo para facilitar o desenvolvimento de diferentes partes da aplicação em um unico lugar, com padronizacao de ferramentas, automacoes e fluxo de trabalho.

## Objetivo

A ideia deste template e manter cada servico bem separado, mas ainda assim compartilhando configuracoes e processos comuns como lint, formatacao, testes, build e integracao continua.

## Estrutura do projeto

A base do projeto esta organizada assim:

- `packages/`: pasta principal onde ficam os servicos (Projetos Individuais).
  Como exemplo, deixei os 2 primeiros modulos: BFF e Front-End.
- `.github/workflows/ci.yml`: pipeline de integracao continua.
- `eslint.config.mjs`: configuracao global de lint.
- `commitlint.config.mjs`: regras padrao para commits.
- `nx.json`: configuracao do Nx e regras de targets.
- `pnpm-workspace.yaml`: define os pacotes que fazem parte do workspace.
- `package.json`: scripts principais do projeto.

> Observacao: cada novo servico deve ser criado dentro de `packages/<nome-do-servico>`, mantendo os projetos separados e organizados.

## Ferramentas usadas

### pnpm

O projeto usa pnpm como gerenciador de pacotes. Ele e responsavel pela instalacao das dependencias e pelo workspace do monorepo.

Comandos mais comuns:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

### Nx

O Nx coordena os projetos do monorepo e executa tarefas como lint, build, testes e start de forma centralizada.

Os scripts principais estao no `package.json` e usam Nx por baixo:

```bash
pnpm lint
pnpm format
pnpm test
pnpm build
pnpm start
```

O arquivo `nx.json` define comportamentos como cache e dependencias entre tarefas. No pipeline de CI, o Nx tambem e usado para executar apenas o que foi afetado pelas mudancas quando possivel.

### ESLint

O ESLint faz a validacao de codigo e ajuda a manter padrao entre os projetos.

A configuracao principal esta em `eslint.config.mjs`, usando a base do `@antfu/eslint-config`.

### Husky

O Husky e usado para automatizar hooks de Git, normalmente antes de commits ou pushes, para garantir que as regras do projeto sejam seguidas antes do codigo chegar ao repositorio remoto.

O script `prepare` do `package.json` ativa essa configuracao.

### Commitlint

O Commitlint valida o formato das mensagens de commit.

O projeto usa o padrao convencional, entao os commits devem seguir um formato como:

```bash
git commit -m "feat: adicionar tela de login"
git commit -m "fix: corrigir validacao do formulario"
git commit -m "chore: atualizar dependencias"
```

### GitHub Actions

A automacao de CI esta em `.github/workflows/ci.yml`.

Hoje o fluxo:

- roda em pull requests e em push na branch `main`;
- instala as dependencias com `pnpm --frozen-lockfile`;
- configura Node 22.14.0 e pnpm 10.6.2;
- executa o Nx para validar `lint` e `build` nas partes afetadas.

## Como desenvolver

### Onde codar

Todo desenvolvimento deve acontecer dentro de `packages/<nome-do-servico>`. Cada pasta representa um projeto independente dentro do monorepo.

Exemplo de organizacao:

- `packages/BFF/` Projeto Backend-For-FrontEnd, API que vai ser chamada pelo front-end;
- `packages/Front-End/` Projeto Front-End;
- outros servicos podem ser adicionados seguindo o mesmo padrao.

### Fluxo recomendado

1. Crie uma branch separada para sua tarefa.
2. Desenvolva apenas dentro do servico correspondente em `packages/<nome-do-servico>`.
3. Rode lint, testes e build antes de abrir PR.
4. Faça commits pequenos e com mensagem padrao convencional.
5. Abra um pull request para revisao.

## Padrao de branch e PR

Para manter o historico organizado, o ideal e trabalhar com branches separadas por tarefa, por exemplo:

- `feature/login`
- `fix/header-mobile`
- `chore/update-deps`

Boas praticas para pull request:

- o PR deve ter um objetivo claro;
- descreva o que mudou e porque;
- inclua prints, links ou observacoes quando houver impacto visual ou de comportamento;
- garanta que o CI esteja verde antes do merge.

## Comandos principais

```bash
pnpm install
pnpm lint
pnpm format
pnpm test
pnpm build
pnpm start
```

## Resumo rapido

- Monorepo gerenciado com pnpm e Nx.
- Lint com ESLint.
- Hooks com Husky.
- Commits validados com Commitlint.
- CI automatizada com GitHub Actions.
- Codigo de cada servico fica em `packages/<nome-do-servico>`.

Este README serve como guia inicial para novos colaboradores.
