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
  `ng-bootstrap`, `ngx-bootstrap` nem outra lib de componentes sem um ADR aprovado. O Bootstrap entra **só como CSS**
  (ADR-02 da 004): nada do JS dele nem `data-bs-*` de comportamento.
- O front antigo (Angular Material, features 001–003) está só na branch `legacy`, com o inventário e os aprendizados
  de Material dele.
- Cores só como **tokens** num único arquivo global, com tema claro e escuro (`data-bs-theme` e `--ws-*`; ver "Onde
  ficam os tokens"). Componentes não usam hex, `rgb()` ou `hsl()` direto.
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

| Lib                                         | Versão                      |
| ------------------------------------------- | --------------------------- |
| Angular (`@angular/*`)                      | 22.2.4 (CLI e build 22.2.4) |
| Bootstrap                                   | 5.3.8 (só o CSS)            |
| RxJS                                        | 7.8.2                       |
| TypeScript                                  | 6.0.3                       |
| Vitest                                      | 5.1.0 (jsdom 30.1)          |
| Playwright                                  | 1.64.1                      |
| `@axe-core/playwright`                      | 4.14.0                      |
| ESLint / angular-eslint / typescript-eslint | 10.14 / 22.6 / 8.71         |
| Prettier                                    | 3.9.10                      |

## Onde ficam os tokens

ADR-03 da feature 004:

1. **Cores só em `src/styles/_tokens.scss`**: os tokens do doc 02 (claro em `:root, [data-bs-theme='light']`, escuro
   em `[data-bs-theme='dark']`), cores de categoria, gradiente, sombras e raios. É o único arquivo com hex, `rgb()`,
   `rgba()`, `hsl()` ou nome de cor.
2. **Ponte do Bootstrap** em `src/styles/_bootstrap-bridge.scss`: `--bs-*` → `var(--ws-*)`. Os valores RGB que o
   Bootstrap exige (links, `--bs-primary-rgb`, `--bs-danger-rgb`) vêm dos tokens `--ws-*-rgb`.
3. **Componentes `.ws-*`** e botões do doc 02 em `src/styles/components/_<nome>.scss`, só com `var(--ws-*)`
   (`color-mix(in srgb, var(--ws-…) N%, transparent)` é permitido).
4. **Estilo de componente Angular** só para layout interno, também só com `var(--ws-*)`.
5. **Fonte** do sistema (`--bs-body-font-family`); nenhum arquivo de fonte.
6. **Ícones** por `<ws-icon>` (caminhos em `src/app/shared/ui/icon/icons.ts`).
7. **Verificação**: `scripts/check-tokens.mjs` no `npm run lint` (ignora `_tokens.scss`, `src/testing/**` e
   `*.spec.ts`, que guardam cópias dos valores para o teste de contraste).

Tokens acrescentados na 004, além do doc 02: `--ws-primary-rgb`, `--ws-primary-strong-rgb` (cor de link por tema),
`--ws-danger-rgb`, `--ws-on-hero` (texto sobre o gradiente), `--ws-on-hero-muted` (`#e8f0fb`, 4,5:1 sobre o azul),
`--ws-hero-overlay`, `--ws-hero-btn-hover-bg` e `--ws-shadow-preview`. O contraste de cada par texto/fundo é testado
em `src/styles/contrast.spec.ts` (valores copiados em `src/testing/contrast.ts`: mude os dois juntos).

## Inventário

Componentes e utilitários reutilizáveis do front novo. Antes de criar algo novo, veja se já existe aqui e qual
componente `.ws-*` do protótipo ele reproduz.

| Item                     | Onde                                                   | Para que serve                                                                                                                                                                                                                                                                                                                                                                                                                            | Protótipo                                                    |
| ------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `<ws-icon name size>`    | `src/app/shared/ui/icon/` (`icons.ts` com os caminhos) | ícone SVG de traço, sempre decorativo (`aria-hidden`); `size="lg"` = 24 px                                                                                                                                                                                                                                                                                                                                                                | `WS.icon()` / `ICONS` de `app.js`, `.ws-icon`, `.ws-icon-lg` |
| `<ws-brand [link]>`      | `src/app/shared/ui/brand/`                             | marca "we-sync" com o ícone `sync`; com `link`, vai para `/inicio`                                                                                                                                                                                                                                                                                                                                                                        | `.ws-brand`, `.ws-brand-mark`                                |
| `wsSoon` / `wsSoonLabel` | `src/app/shared/ui/soon/`                              | item "em breve" (RN-16) num `<button type="button">`: `aria-disabled`, `title`, rótulo `<x>, em breve`, clique/Enter/Espaço sem efeito                                                                                                                                                                                                                                                                                                    | `.ws-badge-soon`, `aria-disabled` do `navLink`               |
| `<ws-password-field>`    | `src/app/shared/ui/password-field/`                    | campo de senha com ícone `lock` e botão "Mostrar senha"/"Ocultar senha"; `focus()`                                                                                                                                                                                                                                                                                                                                                        | campo de senha e `#toggle-pass` de `login.html`              |
| `<ws-strength-meter>`    | `src/app/shared/ui/strength-meter/`                    | barra (`aria-hidden`) e dica (`aria-live`) da força da senha (RN-04)                                                                                                                                                                                                                                                                                                                                                                      | `#strength` de `cadastro.html`, `.ws-strength`               |
| `<ws-form-alert kind>`   | `src/app/shared/ui/form-alert/`                        | aviso no topo do formulário: `error` (`role="alert"`), `success`/`info` (`role="status"`)                                                                                                                                                                                                                                                                                                                                                 | `.alert` de `login.html`                                     |
| Partials `.ws-*`         | `src/styles/components/_*.scss`                        | um partial por componente do doc 02 usado na 004: botões (`.btn-soft`, `.btn-ghost`, `.btn-icon`, `.is-soon`), formulário (`.input-icon`), ícone, marca, layout (`.ws-app`, `.ws-main`, `.ws-content`), menu lateral, barra superior, menu inferior, menu do usuário (`.ws-user-menu`), avatar, cabeçalho de página, card, callout, alertas, etiqueta "em breve", medidor, telas de acesso (`.ws-auth*`), transação (`.ws-tx`, `.ws-cat`) | `we-sync.css`                                                |

## Aprendizados

Um item por assunto, agrupado por lib. Formato:

```markdown
### <Lib>: <assunto em poucas palavras>

- **Versão:** <versão da lib quando foi registrado> · **Registrado em:** AAAA-MM-DD (feature NNN, TF-xx)
- **Resposta:** o que fazer, direto.
- **Exemplo:** trecho curto, se ajudar.
- **Fonte:** link da documentação oficial (ou "erro do compilador: <mensagem>").
```

Só ficaram os aprendizados que não dependem do Angular Material; os de Material estão na branch `legacy`.

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
- **Fonte:** testes de `auth.guards.spec.ts` (arquivo da 002, branch `legacy`) com `RouterTestingHarness`. Na 004, o
  `''` exato redireciona para `inicio` antes da casca (`app.routes.ts`).

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
- **Exemplo:** `render()` em `purchase-form.page.spec.ts` (arquivo da 003, branch `legacy`).
- **Fonte:** testes do projeto (timeout de 5 s no `whenStable`).

### Angular Router: navegação em andamento é o signal `currentNavigation`

- **Versão:** 22.2 · **Registrado em:** 2026-11-02 (feature 004, SDD)
- **Resposta:** `Router.getCurrentNavigation()` está **depreciado** ("Use the `currentNavigation` signal instead").
  Use `router.currentNavigation()`: `Signal<Navigation | null>`, com a navegação enquanto o roteamento acontece e
  `null` depois do `NavigationEnd`. Há também `router.lastSuccessfulNavigation()` (signal). `navigateByUrl` e
  `navigate` devolvem `Promise<boolean>`; `parseUrl`/`serializeUrl` são inversos.
- **Exemplo:** `const url = router.currentNavigation()?.finalUrl; const target = url ? router.serializeUrl(url) : router.url;`
- **Fonte:** https://angular.dev/api/router/Router

### Angular CLI: opções do `ng new`

- **Versão:** CLI 22.2 (conferido no angular.dev em 2026-11-02; confirme com `npx @angular/cli@22.2 new --help`) ·
  **Registrado em:** 2026-11-02 (feature 004, SDD)
- **Resposta:** `--zoneless` (sem `zone.js`), `--style=scss`, `--ssr=false`, `--test-runner=vitest` (padrão
  `vitest`), `--prefix` (padrão `app`), `--skip-git`, `--ai-config=none`, `--package-manager=npm`,
  `--interactive=false`, `--file-name-style-guide` (padrão `2025`: `login-page.ts` com a classe `LoginPage`, sem
  sufixo `.component`), `--standalone` (padrão `true`), `--strict` (padrão `true`).
  Conferido com `npx @angular/cli@22.2 new --help` na TF-02 (CLI 22.2.5): `--routing` não é padrão, passe-o. O
  `app.config.ts` gerado com `--zoneless` não chama `provideZonelessChangeDetection()` (zoneless é o padrão da 22);
  o projeto chama explicitamente, como pede o ADR-01. O `npx` instala o último patch do CLI (22.2.5); o
  `package.json` fixa 22.2.4 em tudo (`@angular/core` 22.2.5 não existia), para CLI, build e framework casarem.
- **Fonte:** https://angular.dev/cli/new

### Angular build: `inlineCritical: false` por causa da CSP

- **Versão:** 22.2 · **Registrado em:** 2026-11-02 (feature 004, SDD; vem do README da feature 001)
- **Resposta:** com o CSS crítico inline (padrão do build de produção), o Angular carrega o resto do CSS com um
  manipulador `onload` inline, que a CSP `script-src 'self'` bloqueia. Use
  `"optimization": { "styles": { "inlineCritical": false } }` na configuração `production` do `angular.json`.
- **Fonte:** README do front (feature 001) e https://angular.dev/reference/configs/workspace-config

### Bootstrap (só CSS): dropdown sem Popper e cor de link

- **Versão:** 5.3.8 · **Registrado em:** 2026-11-02 (feature 004, SDD)
- **Resposta:** sem o JS do Bootstrap, `.dropdown-menu` é só `position: absolute; display: none` (`.show` →
  `display: block`). `top`, `left` e o alinhamento de `.dropdown-menu-end` (`right: 0; left: auto`) só valem com o
  atributo `[data-bs-popper]`, que o JS põe. Posicione o menu com CSS próprio (`top: 100%; right: 0; left: auto`).
  Links usam `color: rgba(var(--bs-link-color-rgb), var(--bs-link-opacity, 1))`, e o hover troca
  `--bs-link-color-rgb` por `--bs-link-hover-color-rgb`: mudar só `--bs-link-color` não muda a cor do link.
- **Fonte:** https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_dropdown.scss e
  https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_reboot.scss

### Web Locks API: `navigator.locks.request` com espera máxima

- **Versão:** API do navegador (Chromium do Playwright 1.64) · **Registrado em:** 2026-11-02 (feature 004, SDD)
- **Resposta:** `navigator.locks.request(name, { signal }, callback)`; a promise resolve com o resultado do
  callback, depois de soltar o lock (o lock fica preso enquanto a promise do callback não termina). Se o `signal`
  abortar antes de o lock ser concedido, a promise rejeita (com `AbortError`; com `AbortSignal.timeout`, confira
  `signal.aborted` em vez do nome do erro). Só existe em **contexto seguro** (HTTPS e `http://localhost`); fora
  disso `navigator.locks` é `undefined`.
- **Fonte:** https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request

### Playwright: acessibilidade com `@axe-core/playwright`

- **Versão:** Playwright 1.64 · **Registrado em:** 2026-11-02 (feature 004, SDD)
- **Resposta:** `import AxeBuilder from '@axe-core/playwright'`; `await new AxeBuilder({ page }).withTags(['wcag2a',
'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()` e `expect(results.violations).toEqual([])`. O `analyze()` lê a página
  no estado atual (abra o menu antes de analisar). Para configuração comum, um fixture `makeAxeBuilder` com
  `test.extend`. `exclude()` tira o elemento e os filhos de todas as regras: use pouco.
- **Fonte:** https://playwright.dev/docs/accessibility-testing

### Vitest: `AbortSignal.timeout()` não obedece aos timers falsos

- **Versão:** Vitest 5.1 (jsdom 30) · **Registrado em:** 2026-11-02 (feature 004, TF-08)
- **Resposta:** `vi.useFakeTimers()` + `vi.advanceTimersByTimeAsync()` não disparam o `AbortSignal.timeout(ms)`: o
  teste fica esperando até estourar os 5 s. Para um tempo máximo que o teste precise adiantar, use
  `AbortController` + `setTimeout(() => controller.abort(), ms)` (e `clearTimeout` quando não precisar mais). O
  resultado é o mesmo para quem recebe o `signal`.
- **Exemplo:** `underLock()` em `src/app/core/auth/token-refresher.ts` (espera do lock `we-sync.refresh`).
- **Fonte:** teste `espera do lock estourada` (`Test timed out in 5000ms` com `AbortSignal.timeout`).

### Playwright: clique em item com `aria-disabled="true"`

- **Versão:** Playwright 1.64.1 · **Registrado em:** 2026-11-02 (feature 004, TF-14)
- **Resposta:** a checagem de "enabled" do `click()` trata `aria-disabled="true"` como desabilitado e espera até o
  tempo estourar. Para provar que um item "em breve" (`wsSoon`) não faz nada, use `click({ force: true })`; `press()`
  continua funcionando. Em `click({ trial: true })` o mesmo vale: para conferir se o item recebe o clique, faça o
  teste de acerto com `document.elementFromPoint` (ver `expectHitTarget` em `e2e/support/layout.ts`).
- **Fonte:** https://playwright.dev/docs/actionability

### Playwright: fixture que precisa rodar em todo teste

- **Versão:** Playwright 1.64.1 · **Registrado em:** 2026-11-02 (feature 004, TF-14)
- **Resposta:** um fixture de `test.extend` só roda se o teste o pede. A API simulada (`api`) é `{ auto: true }`, senão
  um teste que não usa `api` manda as chamadas para o proxy do `ng serve` (`ECONNREFUSED 127.0.0.1:8080`).
- **Exemplo:** `e2e/support/fixtures.ts`.
- **Fonte:** https://playwright.dev/docs/test-fixtures#automatic-fixtures

### axe: `label-content-name-mismatch` em botão com nome visível

- **Versão:** `@axe-core/playwright` 4.14.0 · **Registrado em:** 2026-11-02 (feature 004, TF-15)
- **Resposta:** com as tags `wcag21a`, o axe roda a regra de WCAG 2.5.3 (rótulo no nome): um `aria-label` que não
  contém o texto visível do botão é violação, e `aria-hidden` no texto visível não resolve. No menu da conta, o nome
  acessível é o conteúdo visível (iniciais e nome) seguido de um `span.visually-hidden` com "Menu da conta".
- **Exemplo:** `src/app/layout/shell/user-menu/user-menu.html`.
- **Fonte:** https://dequeuniversity.com/rules/axe/4.10/label-content-name-mismatch

### Angular: espaço entre texto e elemento no template

- **Versão:** 22.2 · **Registrado em:** 2026-11-02 (feature 004, TF-13 e TF-15)
- **Resposta:** o compilador remove nós de texto só com espaço entre elementos (`preserveWhitespaces: false`). Texto
  colado num `<span>` vira um nome acessível colado ("Comprasem breve"). Deixe o espaço dentro de um nó de texto
  (`{{ label }} <span>`) ou use a entidade `&ngsp;`, que o Angular preserva como um espaço.
- **Fonte:** https://angular.dev/api/core/Component#preserveWhitespaces

### Bootstrap (só CSS): foco do `.btn` em variações próprias

- **Versão:** 5.3.8 · **Registrado em:** 2026-11-02 (feature 004, TF-15)
- **Resposta:** `.btn:focus-visible` do Bootstrap zera o `outline` e usa `box-shadow` com `--bs-btn-focus-shadow-rgb`,
  que só as variações do Bootstrap definem. Em `.btn-ghost`/`.btn-soft` o foco ficaria invisível; o projeto põe o anel
  de foco do design system em `.btn:focus-visible` (`_buttons.scss`). `.btn` também troca o `font-size` de `.small`
  (use `--bs-btn-font-size`).
- **Fonte:** https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_buttons.scss
