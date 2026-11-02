# we-sync-front

Front-end do we-sync em **Angular 22 + Bootstrap 5.3**, com design system próprio. A API (Go) fica em
`../we-sync-api`. Requisitos, ADRs e specs ficam em `../we-sync-requirements` (`docs/features/NNN-nome/`). O
contrato da API de cada feature está em `2-contrato.md`: não divirja dele.

## Front novo (leia antes de tudo)

- O front está sendo **refeito do zero** a partir do protótipo em `../we-sync-requirements/prototype/` (decisão de 01/11/2026). A
  referência de telas, regras e visual são `../we-sync-requirements/prototype/index.html` e `../we-sync-requirements/prototype/docs/` (01 decisões, 02 design
  system, 03 telas, 04 regras de negócio, 05 cálculos, 06 ordem das features). Só regras marcadas "(decidido)" são
  aprovadas; o que entra em cada feature é o que o `1-requisitos.md` dela aprovar.
- **Sem Angular Material/CDK.** Visual e componentes seguem `../we-sync-requirements/prototype/docs/02-design-system.md`; o inventário e os
  aprendizados ficam em `docs/design-system.md`.
- O código atual de `src/` e `e2e/` é o **front legado** (Angular Material, features 001–003), guardado também na
  branch `legacy`. Ele será substituído pela feature 004: não o use como padrão de UI nem o estenda. As seções
  "Dados da API" e "Segurança" abaixo continuam valendo como regras; os caminhos de arquivo citados são do legado.

## Verificação (rode antes de dar uma tarefa por pronta)

```bash
npm run lint
npm test
npm run build
npm run format:check
npm run e2e        # Playwright, API simulada (uma vez: npx playwright install chromium)
```

## Convenções de Angular (ADR-01 da feature 001; o ADR da 004 confirma ou troca)

- **Standalone** em tudo. Nada de NgModules.
- **Zoneless**: toda mudança que aparece na tela passa por um `signal` (ou `toSignal`). Componentes com
  `ChangeDetectionStrategy.OnPush`. Não use `ChangeDetectorRef.detectChanges()` para contornar.
- `inject()` em vez de construtor; `input()`/`output()` em vez de decorators; `@if`/`@for` nos templates.
- Estado em serviços com `signal`/`computed`. Sem store global (NgRx etc.) sem um ADR novo.
- Formulários: Reactive Forms tipados (`NonNullableFormBuilder`) com validadores próprios em `shared/validators`.
- HTTP: `provideHttpClient(withFetch(), withInterceptors([...]))`, interceptors funcionais.
- Rotas: `loadComponent` (lazy) por tela, guards funcionais.
- UI: Bootstrap 5.3 + componentes próprios do design system do protótipo (`.ws-*`). Bootstrap, fontes e ícones
  (SVG próprios) empacotados, sem CDN, por causa da CSP. Nada de Angular Material, CDK, `ng-bootstrap` ou outra lib
  de componentes sem ADR.
- Idioma: textos pt-BR direto nos templates, sem i18n. `LOCALE_ID = 'pt-BR'`, `DEFAULT_CURRENCY_CODE = 'BRL'`.
- Textos de interface ficam em constantes exportadas, e os testes usam a mesma constante.
- Testes: Vitest para unitários (`*.spec.ts` ao lado do arquivo); Playwright para e2e (`e2e/`).

## Tema e layout

- **Cores só como tokens** num único arquivo global (no protótipo: `--ws-*` em `../we-sync-requirements/prototype/assets/we-sync.css`, tema
  claro e escuro por `data-bs-theme`). Componentes usam só os tokens; hex, `rgb()`, `hsl()` ou nome de cor fora
  desse arquivo é proibido.
- Layout do protótipo: menu lateral a partir de `lg` (992 px) e menu inferior com botão "+" abaixo disso; topo com
  ajuda (tour), tema, notificações e conta.
- Toda tela nova traz o seu **tour guiado** (TOUR-02 em `../we-sync-requirements/prototype/docs/04-regras-de-negocio.md`).
- Os detalhes de estrutura (onde ficam tokens, breakpoints, shell e rotas) são definidos no ADR da feature 004 e
  registrados aqui quando ela for implementada.

## Dados da API (regras da feature 003, valem para o front novo)

- **Datas sem hora** (`"YYYY-MM-DD"` da API, `dd/mm/aaaa` na tela) só por `features/purchases/plain-date.ts`. Nunca
  `new Date(string)`, `toISOString()` nem `DatePipe` sobre elas.
- **Dinheiro** em centavos inteiros por `features/purchases/money.ts` (`parseBrl`, `formatBrl`, `centsToApi`,
  `apiToCents`). Nada de `parseFloat` nem conta com `float`; a resposta vem sem zeros à direita (`"10"`, `"89.9"`).
- **Estado de lista no endereço** (mês, filtros, página) com um normalizador puro (`list-query.ts`): todo valor do
  endereço passa por ele antes de chegar à API, e toda ação da tela só navega.
- **Sem cache** de dados fora das páginas: os serviços de API não guardam estado, e cada página carrega o que usa
  (`switchMap` + `takeUntilDestroyed`).
- Formulário que avisa antes de sair: `canDeactivate: [unsavedChangesGuard]` na rota e `hasUnsavedChanges()` na
  página (fotografia do valor, `beforeunload` no `host`). Sem sessão, o guard libera.

## Design system

- Visual (tokens, componentes, padrões de interação): `../we-sync-requirements/prototype/docs/02-design-system.md`.
- `docs/design-system.md`: inventário dos componentes e padrões de UI reutilizáveis do front novo e aprendizados
  sobre as libs (com versão e fonte). Consulte antes de pesquisar como uma lib funciona ou de criar um componente;
  registre lá o que aprender e o que criar.

## Segurança

- **Tokens nunca** em `console`, URL, mensagem de erro ou `title`.
- Nada de `innerHTML` nem `bypassSecurityTrust*`.
- O campo `message` dos erros da API **nunca** aparece na tela. O front decide pelo status (e pelo `code`).
- O `Authorization` só vai para `apiBaseUrl` e nunca para `/auth/*`.

## Estrutura (front legado, até a feature 004)

```
src/
  styles.scss                              # tema M3 e tokens --app-* (único lugar com cores)
  styles/_theme-colors.scss                # gerado pelo schematic theme-color (não editar)
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
      brand/           # marca (ícone sync + we-sync)
      page-header/     # cabeçalho de tela interna (título + data)
      confirm-dialog/  # confirmação genérica (openConfirm), com ação, carregando e erro dentro do diálogo
    layout/      # ShellComponent (topo, menu de conta, menu lateral), auth-layout/ (Login e Cadastro com abas),
                 # breakpoints.ts, nav-items.ts, layout.messages.ts
    features/
      auth/login/, auth/register/
      home/
      purchases/       # lançamentos (003): rotas com providers próprios (purchases.routes.ts), list/, form/,
                       # purchase.messages.ts, list-query.ts, plain-date.ts, money.ts, APIs sem estado
  testing/       # utilitários só de teste (FakeLockManager, FakeBreakpointObserver)
e2e/             # Playwright (support/: api-mock, purchases-mock, session, texts, layout, contrast, focus)
proxy.conf.json  # /api → http://localhost:8080
```
