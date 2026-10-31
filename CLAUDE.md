# we-sync-front

Front-end do we-sync em Angular 22 com o visual do ArchitectUI (Bootstrap 5.3 + `@angular/cdk`). A API (Go) fica em `../we-sync-api`. Requisitos, ADRs e
specs ficam em `../we-sync-requirements` (`docs/features/NNN-nome/`). O contrato da API de cada feature está em
`2-contrato.md`: não divirja dele.

## Verificação (rode antes de dar uma tarefa por pronta)

```bash
npm run lint
npm test
npm run build
npm run format:check
npm run e2e        # Playwright, API simulada (uma vez: npx playwright install chromium)
```

## Convenções (ADR-01 da feature 001)

- **Standalone** em tudo. Nada de NgModules.
- **Zoneless**: toda mudança que aparece na tela passa por um `signal` (ou `toSignal`). Componentes com
  `ChangeDetectionStrategy.OnPush`. Não use `ChangeDetectorRef.detectChanges()` para contornar.
- `inject()` em vez de construtor; `input()`/`output()` em vez de decorators; `@if`/`@for` nos templates.
- Estado em serviços com `signal`/`computed`. Sem store global (NgRx etc.) sem um ADR novo.
- Formulários: Reactive Forms tipados (`NonNullableFormBuilder`) com validadores próprios em `shared/validators`.
- HTTP: `provideHttpClient(withFetch(), withInterceptors([...]))`, interceptors funcionais.
- Rotas: `loadComponent` (lazy) por tela, guards funcionais.
- UI: visual do ArchitectUI free sobre Bootstrap 5.3 (só SCSS, sem o JS do Bootstrap nem ng-bootstrap). Menus,
  diálogos e painéis por cima com o `@angular/cdk` (`cdkMenu`, `Dialog`, `cdkConnectedOverlay`, `cdkTrapFocus`).
  Ícones Pe-icon-7-stroke (`pe7-icon`) empacotados (sem CDN, por causa da CSP).
- Idioma: textos pt-BR direto nos templates, sem i18n. `LOCALE_ID = 'pt-BR'`, `DEFAULT_CURRENCY_CODE = 'BRL'`.
- Textos de interface ficam em constantes exportadas, e os testes usam a mesma constante.
- Testes: Vitest para unitários (`*.spec.ts` ao lado do arquivo); Playwright para e2e (`e2e/`).

## Tema e layout

- **Cores só em `src/styles.scss` e `src/styles/`** (variáveis do tema em `styles/architectui/themes/`, tokens
  `--app-*` em `styles/_we-sync.scss`). Componentes usam só `var(--bs-*)` e `var(--app-*)`. Hex, `rgb()`, `hsl()` ou
  nome de cor fora disso é proibido. Para conferir (deve dar vazio):
  `grep -rEn '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src/app --include='*.scss'`.
- `src/styles/architectui/` é o SCSS do template (MIT, `LICENSE` na pasta), só o que o app usa. Ajuste do we-sync
  vai em `_we-sync.scss`; mexa no SCSS copiado só para tirar o que quebra acessibilidade (comente o porquê).
- Nada de `outline: none` sem um foco visível no lugar (ADR-05 da 002): o tema zera o `box-shadow` de foco do
  Bootstrap, e `_we-sync.scss` devolve o contorno.
- Breakpoint em dois lugares que se referenciam: `src/app/layout/breakpoints.ts` (`WIDE_LAYOUT_QUERY`) e
  `src/styles/_breakpoints.scss` (`$wide`). Nos `.scss`: `@use '<caminho>/styles/breakpoints' as bp;` e
  `@media (min-width: bp.$wide)`. Mude os dois juntos.
- **Tela interna nova**: rota filha do Shell em `app.routes.ts`; começa com
  `<app-page-header [title]="…" icon="pe-7s-…" />` (ações projetadas à direita); conteúdo em
  `<div class="main-card mb-3 card">`; host `display: block` com `min-width: 0` (ver `features/home/home.page.ts`). O item
  entra em `NAV_ITEMS` (`layout/nav-items.ts`) junto com a rota, nunca antes (RN-02 da 002).
- **Telas de visitante** ficam sob o `AuthLayoutComponent` (rota `''` de baixo do `app.routes.ts`, **depois** do
  Shell: um pai `''` com filhas casa `/` mesmo sem filha).
- Textos do layout em `layout/layout.messages.ts`, sem import do Angular (o `e2e/support/texts.ts` reexporta).

## Dados da API (feature 003)

- **Datas sem hora** (`"YYYY-MM-DD"` da API, `dd/mm/aaaa` na tela) só por `features/purchases/plain-date.ts`. Nunca
  `new Date(string)`, `toISOString()` nem `DatePipe` sobre elas. O campo de data usa o `appBrDateInput` (texto
  `dd/mm/aaaa` ↔ `Date`, erro `dateParse`) e o calendário é o `CalendarPanelComponent`.
- **Dinheiro** em centavos inteiros por `features/purchases/money.ts` (`parseBrl`, `formatBrl`, `centsToApi`,
  `apiToCents`). Nada de `parseFloat` nem conta com `float`; a resposta vem sem zeros à direita (`"10"`, `"89.9"`).
- **Estado de lista no endereço** (mês, filtros, página) com um normalizador puro (`list-query.ts`): todo valor do
  endereço passa por ele antes de chegar à API, e toda ação da tela só navega.
- **Sem cache** de dados fora das páginas: os serviços de API não guardam estado, e cada página carrega o que usa
  (`switchMap` + `takeUntilDestroyed`).
- Erro de campo só com o campo tocado: `touchedErrorFrom`/`touchedErrorMessage` (`shared/validators`), com
  `.is-invalid` no campo e `.invalid-feedback` ligado por `aria-describedby`.
- Aviso que sobrevive à navegação: `Notifier.show(texto)` (`shared/notifier`), mostrado pelo `ToastHostComponent` do
  `App`.
- Formulário que avisa antes de sair: `canDeactivate: [unsavedChangesGuard]` na rota e `hasUnsavedChanges()` na
  página (fotografia do valor, `beforeunload` no `host`). Sem sessão, o guard libera.

## Design system

`docs/design-system.md`: inventário dos componentes e padrões de UI reutilizáveis e aprendizados sobre as libs
(com versão e fonte). Consulte antes de pesquisar como uma lib funciona ou de criar um componente; registre lá o
que aprender e o que criar.

## Segurança

- **Tokens nunca** em `console`, URL, mensagem de erro ou `title`.
- Nada de `innerHTML` nem `bypassSecurityTrust*`.
- O campo `message` dos erros da API **nunca** aparece na tela. O front decide pelo status (e pelo `code`).
- O `Authorization` só vai para `apiBaseUrl` e nunca para `/auth/*`.

## Estrutura

```
src/
  styles.scss                              # Bootstrap + ArchitectUI + ícones + overlay do CDK (ordem importa)
  styles/architectui/                      # SCSS copiado do ArchitectUI free (MIT), só o usado
  styles/_we-sync.scss                     # tokens --app-*, foco, Shell, overlays do CDK
  styles/_breakpoints.scss                 # $wide, par de layout/breakpoints.ts
  environments/environment.ts              # apiBaseUrl do build de produção (compose)
  environments/environment.development.ts  # apiBaseUrl do ng serve (/api/v1 + proxy)
  app/
    app.config.ts, app.routes.ts
    core/
      auth/      # sessão, API de auth, renovação de token, interceptor, guards, returnUrl, sync entre abas
      http/      # API_BASE_URL, mensagens de erro genéricas
    shared/
      validators/      # e-mail, senha, bytes UTF-8, mensagens por campo
      password-field/  # campo de senha com mostrar/ocultar
      form-alert/      # aviso fixo no formulário
      brand/           # marca em texto (we-sync), como o logo do ArchitectUI
      page-header/     # cabeçalho de tela interna (`app-page-title`: ícone, título, data e ações)
      confirm-dialog/  # confirmação genérica (openConfirm, Dialog do CDK), com ação, carregando e erro dentro do diálogo
      notifier/        # Notifier (aviso de 5 s) + ToastHostComponent (no App)
    layout/      # ShellComponent (topo, menu de conta, menu lateral), auth-layout/ (Login e Cadastro com abas),
                 # breakpoints.ts, nav-items.ts, layout.messages.ts
    features/
      auth/login/, auth/register/
      home/
      purchases/       # lançamentos (003): purchases.routes.ts, list/, form/, calendar/ (painel de calendário),
                       # purchase.messages.ts, list-query.ts, plain-date.ts, money.ts, APIs sem estado
  testing/       # utilitários só de teste (FakeLockManager, FakeBreakpointObserver, nativeSelect)
e2e/             # Playwright (support/: api-mock, purchases-mock, session, texts, layout, contrast, focus)
proxy.conf.json  # /api → http://localhost:8080
```
