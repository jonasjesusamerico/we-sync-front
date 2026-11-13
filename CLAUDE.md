# we-sync-front

Front-end do we-sync em **Angular 22 + Bootstrap 5.3**, com design system próprio. A API (Go) fica em
`../we-sync-api`. Requisitos, ADRs e specs ficam em `../we-sync-requirements` (`docs/features/NNN-nome/`). O
contrato da API de cada feature está em `2-contrato.md`: não divirja dele.

## Front novo (leia antes de tudo)

- O front foi **refeito do zero** na feature 004 a partir do protótipo em `../we-sync-requirements/prototype/`. A
  referência de telas, regras e visual são `../we-sync-requirements/prototype/index.html` e
  `../we-sync-requirements/prototype/docs/` (01 decisões, 02 design system, 03 telas, 04 regras de negócio, 05
  cálculos, 06 ordem das features). Só regras marcadas "(decidido)" são aprovadas; o que entra em cada feature é o que
  o `1-requisitos.md` dela aprovar.
- **Sem Angular Material/CDK.** Visual e componentes seguem `../we-sync-requirements/prototype/docs/02-design-system.md`;
  o inventário e os aprendizados ficam em `docs/design-system.md`.
- O front antigo (Angular Material, features 001–003) está só na branch `legacy`. Não o use como padrão.

## Verificação (rode antes de dar uma tarefa por pronta)

```bash
npm run lint
npm test
npm run build
npm run format:check
npm run e2e        # Playwright, API simulada (uma vez: npx playwright install chromium)
npm run e2e:double-submit   # clique duplo, 20 repetições (ao mexer em login, cadastro, salvar ou excluir compra)
npm run e2e:compose         # contra a stack real (docker compose no we-sync-api), quando a tarefa toca a API
npm run e2e:capture         # capturas do app e do protótipo lado a lado, em test-results/capture/ (telas)
```

O contexto Docker padrão do PC aponta para o servidor: rode `npm run e2e:compose` com `DOCKER_CONTEXT=default`.
O CI (`.gitlab-ci.yml`, GitLab) repete essas verificações (lint, formato, testes com cobertura mínima, e2e, build) e
reprova o MR em qualquer falha.

## Branches e entrega

`feature/WS-NNNN` → MR (squash) → `develop` (ambiente dev) → `release/X.Y.Z` (homolog, QA) → MR → `master` (tag
`vX.Y.Z`, produção). Correção urgente: `hotfix/X.Y.Z` a partir da última tag; bug do QA: `fix/<issue>-<resumo>` a
partir da `release/X.Y.Z`, com MR para ela. Detalhes em `../we-sync-infra/docs/03-ci-cd.md`; regras dos agentes
(branch criada pelo `dev-frontend`, commit só depois da aprovação, ordem dos MRs entre API e front) em
`../we-sync-requirements/.claude/fluxo.md`, seção "Git, branches e entrega". Nunca trabalhe direto na `develop`,
`master`, `release/*` ou `hotfix/*`. Commits em Conventional Commits, em inglês.

## Convenções de Angular (ADR-01 da feature 004)

- **Standalone** em tudo. Nada de NgModules.
- **Zoneless**: toda mudança que aparece na tela passa por um `signal` (ou `toSignal`). Componentes com
  `ChangeDetectionStrategy.OnPush`. Não use `ChangeDetectorRef.detectChanges()` para contornar.
- `inject()` em vez de construtor; `input()`/`output()` em vez de decorators; `@if`/`@for` nos templates.
- Estado em serviços com `signal`/`computed`. Sem store global (NgRx etc.) sem um ADR novo.
- Formulários: Reactive Forms tipados (`NonNullableFormBuilder`) com validadores próprios em `shared/validators`.
- HTTP: `provideHttpClient(withFetch(), withInterceptors([...]))`, interceptors funcionais.
- Rotas: `loadComponent` (lazy) por tela, guards funcionais.
- UI: Bootstrap 5.3 **só como CSS** (ADR-02 da 004): nenhum `data-bs-*` de comportamento (`data-bs-toggle` etc.) e
  nenhum import do JS do Bootstrap; `data-bs-theme` (CSS) é permitido. Comportamento (menu, por exemplo) é componente
  Angular próprio. Componentes `.ws-*` do protótipo. Bootstrap e ícones (SVG próprios) empacotados, sem CDN, por causa
  da CSP. Nada de Angular Material, CDK, `ng-bootstrap` ou outra lib de componentes sem ADR.
- Idioma: textos pt-BR direto nos templates, sem i18n. `LOCALE_ID = 'pt-BR'`.
- Textos de interface ficam em constantes exportadas, e os testes usam a mesma constante.
- Testes: Vitest para unitários (`*.spec.ts` ao lado do arquivo); Playwright para e2e (`e2e/`).

## Tema e layout

- **Cores só como tokens** (ADR-03 da 004): `--ws-*` em `src/styles/_tokens.scss`, o único arquivo com hex, `rgb()`,
  `hsl()` ou nome de cor (tema claro e escuro por `data-bs-theme`). Componentes e partials usam `var(--ws-*)`
  (`color-mix(in srgb, var(--ws-…) N%, transparent)` é permitido). O `npm run lint` roda `scripts/check-tokens.mjs`,
  que falha se a regra quebrar (`src/testing/**` e `*.spec.ts` ficam fora). Cor nova começa por um token.
- **Ícones** só por `<ws-icon name="…" />` (`shared/ui/icon/icons.ts`, caminhos do `ICONS` do protótipo). Nada de
  `innerHTML`, SVG externo, fonte de ícones ou emoji.
- **Tema** (ADR-16): `public/theme-init.js` aplica `localStorage['we-sync.theme']` (ou a preferência do sistema) antes
  da primeira pintura; `ThemeService.set()` troca e grava; o botão é `layout/theme-toggle/`. Desde a 006 (ADR-14), o
  tema também fica **na conta**: com sessão, `set()` envia `PUT /users/me/preferences` (um por vez, na ordem; falha →
  toast de aviso, sem desfazer); o `CurrentUserStore.load()` adota o `theme` do `GET /users/me` (`adoptAccountTheme`,
  sem chamar a API; `null` não muda nada).
- Layout do protótipo: menu lateral a partir de `lg` (992 px) e menu inferior com botão "+" abaixo disso, só por CSS
  (sem `matchMedia` em TypeScript); topo com tema, notificações e conta. Os ids `ws-sidebar`, `ws-topbar` e
  `ws-bottomnav` são alvos do tour.
- Itens que ainda não existem usam a diretiva `wsSoon` num `<button type="button">` (RN-16).
- Toda tela nova traz o seu **tour guiado** (TOUR-02 em `../we-sync-requirements/prototype/docs/04-regras-de-negocio.md`),
  a partir da feature que criar o tour.

## Sessão (feature 004)

- **ADR-12:** tokens em `localStorage['we-sync.session']` (só `access_token` e `refresh_token`), lidos a cada
  requisição pelo `SessionStore`; sem cópia em memória.
- **ADR-13:** renovação única: uma promise por aba + Web Locks (`we-sync.refresh`, espera de 10 s) + releitura do
  storage antes e depois do `/auth/refresh` (`TokenRefresher`); o interceptor repete a chamada uma vez.
- **ADR-14:** as abas se acompanham pelo evento `storage` (`SessionSync`): saiu numa, sai em todas; entrou numa, as
  telas de acesso vão para o Início.
- **ADR-15:** rota de retorno na URL (`?returnUrl=`, sempre por `sanitizeReturnUrl`), avisos do login no `state` da
  navegação (`readLoginNotice`); o e-mail nunca vai para a URL.
- **Conta excluída (ADR-16 da 006):** `SessionEnd.accountDeleted()` limpa a sessão e o usuário e vai para o login com o
  aviso `account-deleted` ("Sua conta foi excluída."), sem `returnUrl` e sem `POST /auth/logout`. A troca de senha grava
  o par novo (`SessionStore.save`); os outros aparelhos saem no próximo `401`.
- Usuário atual: `CurrentUserStore` (`GET /users/me`), carregado pelo `currentUserResolver` da casca; falha → dados
  indisponíveis (RN-20), sem bloquear a tela.

## Dados da API (regras da feature 003, valem para o front novo)

- **Datas sem hora** (`"YYYY-MM-DD"` da API, `dd/mm/aaaa` na tela) só por `shared/date/plain-date.ts` (`parseIsoDate`,
  `toIsoDate`, `formatDate`, `formatDayMonth`, rótulos e aritmética de mês). Nunca `new Date(string)`, `toISOString()`
  nem `DatePipe` sobre elas. "Hoje" é o token `TODAY` (`core/navigation/today.ts`), a data local; nos testes, fixe-o.
- **Dinheiro** em centavos inteiros por `shared/money/money.ts` (`apiToCents`, `centsToApi`, `formatBrl`,
  `formatMoneyInput`, `digitsToCents`). Nada de `parseFloat` nem conta com `float`; a resposta vem sem zeros à direita
  (`"10"`, `"89.9"`) e as somas podem passar de R$ 99.999.999,99 (até 13 dígitos, D-19 da 005).
- **Estado de lista no endereço** (mês, filtros, página) com um normalizador puro: `shared/date/month-query.ts` (mês do
  Início) e `features/purchases/purchase-list-query.ts` (Compras). Todo valor do endereço passa por ele antes de chegar
  à API, e toda ação da tela só navega. Texto livre na query vai com o `STRICT_PARAM_CODEC` (o Go descarta pares com `;`).
- **Sem cache** de dados fora das páginas: os serviços de API não guardam estado, e cada página carrega o que usa
  (`switchMap` + `takeUntilDestroyed`), num `Loadable<T>` (`shared/loadable.ts`) por área.
- Formulário que avisa antes de sair: `canDeactivate: [unsavedChangesGuard]` (`core/navigation/unsaved-changes.guard.ts`)
  na rota e `hasUnsavedChanges()` na página (fotografia do valor, `beforeunload` no `host`). Sem sessão, o guard libera.
- Aviso e confirmação: `ToastService` e `ConfirmService` (`shared/ui/toast/`, `shared/ui/confirm/`), com os hosts na
  casca.

## Design system

- Visual (tokens, componentes, padrões de interação): `../we-sync-requirements/prototype/docs/02-design-system.md`.
- `docs/design-system.md`: inventário dos componentes e padrões de UI reutilizáveis do front novo e aprendizados
  sobre as libs (com versão e fonte). Consulte antes de pesquisar como uma lib funciona ou de criar um componente;
  registre lá o que aprender e o que criar.

## Segurança

- **Tokens nunca** em `console`, URL, mensagem de erro ou `title`.
- Nada de `innerHTML` nem `bypassSecurityTrust*`.
- O campo `message` dos erros da API **nunca** aparece na tela. O front decide pelo status (e pelo `code`).
- O `Authorization` só vai para `API_BASE_URL + '/'` e nunca para `/auth/*` (`authInterceptor`).
- Nome e e-mail do usuário só por interpolação (`{{ }}`); e-mail nunca na URL.

## Estrutura (ADR-04 da feature 004)

```
public/
  theme-init.js                  # tema antes da primeira pintura (ADR-16)
scripts/
  check-tokens.mjs               # nenhuma cor fora de _tokens.scss (ADR-03), roda no npm run lint
src/
  index.html, main.ts, styles.scss
  styles/
    _tokens.scss                 # único arquivo com cores
    _bootstrap-bridge.scss       # --bs-* → --ws-*
    _base.scss                   # corpo, foco visível, utilitários (.ws-tabular, .min-w-0)
    components/_*.scss           # um partial por componente .ws-* (inventário em docs/design-system.md)
    contrast.spec.ts             # contraste dos pares de tokens (ADR-05)
  environments/                  # apiBaseUrl por ambiente
  app/
    app.ts, app.config.ts, app.routes.ts
    core/                        # não importa de features/ nem de layout/
      http/                      # API_BASE_URL, error-messages.ts, http-error.ts (RN-19)
      auth/                      # session-store, auth-api, token-refresher, lock-manager, auth-interceptor,
                                 # session-end, session-sync, auth-guards, return-url, login-notice
      user/                      # current-user-store (setUser), user-api (me, perfil, preferências, senha,
                                 # exclusão), current-user-resolver, initials
      catalog/                   # CatalogApi, catalog-style (catalogStyle, escolhas), catalog-options, mensagens
      theme/                     # ThemeService (set, adoptAccountTheme), theme.messages
      navigation/                # TODAY, unsaved-changes.guard, navigation.messages.ts
    shared/                      # não importa de core/, layout/ nem features/
      ui/                        # icon, brand, soon (wsSoon), password-field, strength-meter, form-alert,
                                 # month-switcher, paginator, category-bubble, status-pill, area-status,
                                 # money-input (wsMoneyInput), toast, confirm, dialog (ws-form-dialog),
                                 # ui.messages.ts
      text/                      # code-point-limit (wsCodePointLimit)
      validators/                # auth-validators, purchase-validators, text-measure, password-strength, field-error
      money/                     # money.ts (centavos)
      date/                      # plain-date.ts, month-query.ts
      loadable.ts                # Loadable<T> de cada área
    layout/
      shell/                     # casca interna (shell, nav-items, user-menu/, shell.messages.ts)
      access/                    # moldura de login/cadastro (painel azul + formulário)
      theme-toggle/              # botão de tema (usa o ThemeService de core/)
    features/
      auth/                      # login/, register/, auth.messages.ts
      home/                      # Início (home-page), spending-card/ (cartão do gasto), spending-seal, blocos do
                                 # mês (007, só apresentação): month-kpis/, daily-bars/, category-donut/,
                                 # latest-purchases/, payment-meters/; home-charts.ts (geometria), home.messages.ts
      purchases/                 # data/ (modelos, PurchasesApi, purchase-status), list/ (Compras), form/ (nova e edição),
                                 # purchases.routes, purchase-list-query, purchase-links (o único que a casca e o
                                 # Início importam), purchase-description, purchases.messages
      settings/                  # Configurações (006): settings.routes, settings-page (menu de seções),
                                 # account/ (Conta, diálogo de exclusão), catalog/ (Categorias e Formas, diálogo
                                 # de edição), settings.messages
  testing/                       # só de teste (api-examples, FakeLockManager, contraste, helpers)
e2e/
  support/                       # api-mock (API simulada com estado: compras, resumo e overview do mês, catálogo
                                 # com arquivadas, conta), home (dados dos CAs da 007),
                                 # fixtures (HOME_URL), session, texts, layout, a11y, purchases (dados do app.js,
                                 # fixedToday), settings (JONAS, seedCatalog, openSettings)
  *.spec.ts                      # API simulada
  smoke.compose.spec.ts          # contra a stack real (npm run e2e:compose)
  prototype.capture.spec.ts      # capturas app × protótipo (npm run e2e:capture)
proxy.conf.json                  # /api → http://localhost:8080
```
