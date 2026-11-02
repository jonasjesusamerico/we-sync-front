# Design system do front

Memória do front do we-sync: os componentes e padrões de UI que já existem e o que já se aprendeu sobre as libs. O
objetivo é não pesquisar duas vezes a mesma coisa.

## Front novo: Angular + Bootstrap, sem Angular Material

Desde 01/11/2026 o front está sendo refeito do zero. A referência visual e de produto é o **protótipo**, que mora no
`we-sync-requirements` (o requisito é o dono dele):

- `../we-sync-requirements/prototype/index.html` — telas clicáveis (abrir no navegador, roda offline).
- `../we-sync-requirements/prototype/docs/02-design-system.md` — **fonte dos tokens, componentes e padrões de interação** (cores `--ws-*`
  claro/escuro, tipografia, layout, componentes `.ws-*`, tour guiado, formatos de dinheiro e data).
- `../we-sync-requirements/prototype/assets/we-sync.css` e `../we-sync-requirements/prototype/assets/app.js` — implementação de referência dos tokens, componentes,
  ícones SVG e do tour (o Angular reproduz o resultado, não copia o código de protótipo sem revisão).
- `../we-sync-requirements/prototype/docs/03-telas.md` e `04-regras-de-negocio.md` — o que cada tela faz e as regras com IDs.

Regras:

- **Angular Material e CDK não são usados** no front novo. Não adicione `@angular/material`, `@angular/cdk`,
  `ng-bootstrap`, `ngx-bootstrap` nem outra lib de componentes sem um ADR aprovado. A forma de integrar o Bootstrap
  (só CSS ou também o JS dele) é decidida no ADR da feature 004.
- O código Angular Material que ainda está em `src/` é **legado** (front das features 001–003) e será substituído
  pela feature 004. Não o use como padrão nem o estenda. O inventário e os aprendizados de Material ficaram no
  histórico do git (branch `legacy`).
- Cores só como **tokens** num único arquivo global, com tema claro e escuro (o protótipo usa `data-bs-theme` e
  `--ws-*`). Componentes não usam hex, `rgb()` ou `hsl()` direto.
- Sem CDN: Bootstrap, fontes e ícones vêm empacotados (CSP). Os ícones do protótipo são SVG próprios.
- Breakpoints do Bootstrap; o protótipo troca o menu inferior pelo lateral em `lg` (992 px) e ajusta detalhes
  abaixo de `sm` (576 px).
- Toda tela nova traz o seu **tour guiado** (TOUR-02 em `../we-sync-requirements/prototype/docs/04-regras-de-negocio.md`), a partir da
  feature que criar o tour.

## Como usar este arquivo

- O `sdd-frontend` e o `dev-frontend` consultam este arquivo quando precisam: antes de pesquisar como uma lib
  funciona e antes de criar um componente ou padrão de UI.
- Toda vez que uma pesquisa (documentação oficial, erro de compilação, teste) ensinar algo que vai servir de novo,
  o agente registra aqui, na hora, antes de seguir com a tarefa.
- Toda vez que um componente ou padrão de UI reutilizável for criado ou mudar, o agente atualiza o "Inventário".
- As convenções gerais (standalone, zoneless, signals, Reactive Forms tipados etc.) ficam em `CLAUDE.md` e não são
  repetidas aqui.
- Se uma entrada estiver errada ou desatualizada (a lib subiu de versão, por exemplo), corrija-a ou apague-a. Não
  acumule versões conflitantes.

## Versões de referência

Atualize quando o `package.json` mudar. Uma entrada de "Aprendizados" vale para a versão em que foi registrada.

| Lib                    | Versão                                                         |
| ---------------------- | -------------------------------------------------------------- |
| Angular (`@angular/*`) | 22.2                                                           |
| Bootstrap              | 5.3.8 (a do protótipo; entra no `package.json` na feature 004) |
| RxJS                   | 7.8                                                            |
| TypeScript             | 6.0                                                            |
| Vitest                 | 5                                                              |
| Playwright             | 1.64                                                           |

## Inventário

Componentes e utilitários reutilizáveis do front novo. Antes de criar algo novo, veja se já existe aqui e qual
componente `.ws-*` do protótipo ele reproduz.

| Item                        | Onde | Para que serve | Protótipo |
| --------------------------- | ---- | -------------- | --------- |
| _(vazio até a feature 004)_ |      |                |           |

## Aprendizados

Um item por assunto, agrupado por lib. Formato:

```markdown
### <Lib>: <assunto em poucas palavras>

- **Versão:** <versão da lib quando foi registrado> · **Registrado em:** AAAA-MM-DD (feature NNN, TF-xx)
- **Resposta:** o que fazer, direto.
- **Exemplo:** trecho curto, se ajudar.
- **Fonte:** link da documentação oficial (ou "erro do compilador: <mensagem>").
```

Só ficaram os aprendizados que não dependem do Angular Material; os de Material estão no histórico do git.

### Angular: SCSS `@use` em `styles` inline do componente

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-02)
- **Resposta:** o `styles` inline aceita `@use` com caminho relativo ao arquivo `.ts` do componente (o projeto
  usa `inlineStyleLanguage: scss`). Confirmado no build: o `@media (min-width: bp.$wide)` vira
  `@media(min-width:960px)`.
- **Exemplo:** em `src/app/shared/page-header/page-header.component.ts`: `@use '../../../styles/breakpoints' as bp;`
- **Fonte:** build do projeto (`npm run build`).

### Vitest: fixar a data sem travar o Angular

- **Versão:** 5 · **Registrado em:** 2026-10-22 (feature 002, TF-02)
- **Resposta:** `vi.useFakeTimers({ toFake: ['Date'] })` + `vi.setSystemTime(...)` falsifica só o `Date`; o
  `fixture.whenStable()` continua funcionando com os timers reais. Para "o tempo passar", chame `setSystemTime` de
  novo. Desfaça com `vi.useRealTimers()` no `afterEach`.
- **Fonte:** https://vitest.dev/api/vi.html#vi-usefaketimers

### ESLint do projeto: parâmetro não usado

- **Versão:** typescript-eslint 8.71 · **Registrado em:** 2026-10-22 (feature 002, TF-02)
- **Resposta:** a config do projeto não libera o prefixo `_` em `@typescript-eslint/no-unused-vars`. Em fakes de
  teste, omita o parâmetro (um método com menos parâmetros continua compatível com o tipo original).
- **Fonte:** `npm run lint` (`'_query' is defined but never used`).

### Angular Router: pai `''` com filhas casa `/` mesmo sem filha

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-05)
- **Resposta:** uma rota `{ path: '', component: X, children: [{ path: 'login' }, …] }` casa a URL `/` sozinha
  (ativa `X` com o outlet vazio); o roteador **não** passa para a próxima rota `''`. Com duas rotas-layout `''`,
  ponha primeiro a que deve atender `/` (no projeto, o Shell, cuja filha `''` não consome `login`). Para
  `/login`, o Shell não casa e o roteador segue para a próxima, sem rodar os guards do Shell.
- **Fonte:** testes de `auth.guards.spec.ts` (`RouterTestingHarness`) com as rotas do app.

### Angular Router: `canceledNavigationResolution: 'computed'`

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** com o padrão (`'replace'`), uma navegação cancelada por um guard faz `replaceState`. Se a navegação
  veio do voltar do navegador, a entrada atual do histórico é trocada e o histórico fica errado. Com `'computed'`,
  o roteador volta à entrada do histórico em que estava (depois de um voltar cancelado, ele navega para a frente).
  Configure com `provideRouter(routes, withRouterConfig({ canceledNavigationResolution: 'computed' }))`. Não
  funciona com um `UrlHandlingStrategy` que trate só parte da URL.
- **Fonte:** https://angular.dev/api/router/RouterConfigOptions

### Angular Router + Vitest: `whenStable` não resolve com um guard esperando o usuário

- **Versão:** Angular 22.2, Vitest 5 · **Registrado em:** 2026-10-31 (feature 003, TF-12)
- **Resposta:** a navegação em andamento conta como tarefa pendente. Com um `canDeactivate` que devolve um
  `Observable` aberto (o diálogo de "Descartar alterações?"), o `fixture.whenStable()` e o
  `ApplicationRef.whenStable()` só resolvem quando o usuário responde, e o teste estoura o tempo. Enquanto o
  diálogo está aberto, deixe o tempo passar com macrotarefas e atualize a tela com `ApplicationRef.tick()`; depois
  de clicar no botão do diálogo, o `whenStable` volta a funcionar.
- **Exemplo:** `render()` em `src/app/features/purchases/form/purchase-form.page.spec.ts` (bloco do guard).
- **Fonte:** testes do projeto (timeout de 5 s no `whenStable`).
