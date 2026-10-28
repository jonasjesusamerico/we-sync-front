# we-sync-front

Front-end do we-sync em Angular 22 + Angular Material. A API (Go) fica em `../we-sync-api`. Requisitos, ADRs e
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
- UI: Angular Material com tema M3 próprio (feature 002). Fonte Roboto e ícones `material-symbols` empacotados (sem CDN, por
  causa da CSP).
- Idioma: textos pt-BR direto nos templates, sem i18n. `LOCALE_ID = 'pt-BR'`, `DEFAULT_CURRENCY_CODE = 'BRL'`.
- Textos de interface ficam em constantes exportadas, e os testes usam a mesma constante.
- Testes: Vitest para unitários (`*.spec.ts` ao lado do arquivo); Playwright para e2e (`e2e/`).

## Tema e layout (feature 002)

- **Cores só em `src/styles.scss`** (tokens `--app-*` e `mat.*-overrides`). Componentes usam só `var(--mat-sys-*)` e
  `var(--app-*)`. Hex, `rgb()`, `hsl()` ou nome de cor fora dele é proibido. Para conferir (deve dar vazio):
  `grep -rEn '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(' src/app --include='*.scss'`.
- `src/styles/_theme-colors.scss` é gerado por `ng g @angular/material:theme-color` (comando no `README.md`) e
  **não** é editado à mão (está no `.prettierignore`).
- Breakpoint em dois lugares que se referenciam: `src/app/layout/breakpoints.ts` (`WIDE_LAYOUT_QUERY`) e
  `src/styles/_breakpoints.scss` (`$wide`). Nos `.scss`: `@use '<caminho>/styles/breakpoints' as bp;` e
  `@media (min-width: bp.$wide)`. Mude os dois juntos.
- **Tela interna nova**: rota filha do Shell em `app.routes.ts`; começa com `<app-page-header [title]="…" />`;
  conteúdo em `mat-card`; host em coluna com `gap: 24px` e `min-width: 0` (ver `features/home/home.page.ts`). O item
  entra em `NAV_ITEMS` (`layout/nav-items.ts`) junto com a rota, nunca antes (RN-02 da 002).
- **Telas de visitante** ficam sob o `AuthLayoutComponent` (rota `''` de baixo do `app.routes.ts`, **depois** do
  Shell: um pai `''` com filhas casa `/` mesmo sem filha).
- Textos do layout em `layout/layout.messages.ts`, sem import do Angular (o `e2e/support/texts.ts` reexporta).

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
    layout/      # ShellComponent (topo, menu de conta, menu lateral), auth-layout/ (Login e Cadastro com abas),
                 # breakpoints.ts, nav-items.ts, layout.messages.ts
    features/
      auth/login/, auth/register/
      home/
  testing/       # utilitários só de teste (FakeLockManager, FakeBreakpointObserver)
e2e/             # Playwright (support/: api-mock, session, texts, layout, contrast, focus)
proxy.conf.json  # /api → http://localhost:8080
```
