# Design system do front

Memória do front do we-sync: os componentes e padrões de UI que já existem e o que já se
aprendeu sobre as libs. O objetivo é não pesquisar duas vezes a mesma coisa.

- O `sdd-frontend` e o `dev-frontend` consultam este arquivo quando precisam: antes de pesquisar como uma lib
  funciona e antes de criar um componente ou padrão de UI.
- Toda vez que uma pesquisa (documentação oficial, erro de compilação, teste) ensinar algo que vai servir de novo,
  o agente registra aqui, na hora, antes de seguir com a tarefa.
- Toda vez que um componente ou padrão de UI reutilizável for criado ou mudar, o agente atualiza o "Inventário".
- As convenções gerais (standalone, zoneless, signals, Reactive Forms tipados etc.) ficam em
  `CLAUDE.md` e não são repetidas aqui.
- Se uma entrada estiver errada ou desatualizada (a lib subiu de versão, por exemplo), corrija-a ou apague-a. Não
  acumule versões conflitantes.

## Versões de referência

Atualize quando o `package.json` mudar. Uma entrada de "Aprendizados" vale para a versão em que foi
registrada.

| Lib                     | Versão |
| ----------------------- | ------ |
| Angular (`@angular/*`)  | 22.2   |
| Angular CDK             | 22.2   |
| Bootstrap (só SCSS)     | 5.3.8  |
| ArchitectUI free (SCSS) | 3.4.0  |
| pe7-icon                | 1.0.4  |
| RxJS                    | 7.8    |
| TypeScript              | 6.0    |
| Vitest                  | 5      |
| Playwright              | 1.64   |

## Inventário

Componentes e utilitários reutilizáveis. Antes de criar algo novo, veja se já existe aqui. Classes de layout do
template (`app-page-title`, `main-card`, `vsm-*`, `app-header`, `app-sidebar`) e do Bootstrap (`card`, `btn`,
`form-control`, `form-select`, `table`, `list-group`, `badge`, `pagination`, `alert`) são usadas direto no HTML.

| Item                                            | Onde                                                         | Para que serve                                                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ShellComponent`                                | `src/app/layout/shell.component.ts`                          | Casca das telas logadas no layout do ArchitectUI: topo (☰ no estreito, marca, menu de conta `cdkMenu` com Sair) e menu lateral (`NAV_ITEMS`), fixo a partir de 960 px e por cima abaixo disso (fundo escurecido, `cdkTrapFocus`, `Esc`) |
| `AuthLayoutComponent` (`app-auth-layout`)       | `src/app/layout/auth-layout/`                                | Telas de visitante no estilo "boxed": fundo `bg-plum-plate`, marca e cartão com as abas `Entrar`/`Criar conta` (`nav-tabs`, `role="tab"`, setas/Home/End, uma rota por aba)                                                              |
| `FormAlertComponent`                            | `src/app/shared/form-alert/`                                 | Aviso fixo no formulário (`.alert-danger`/`.alert-info`)                                                                                                                                                                                 |
| `PasswordFieldComponent`                        | `src/app/shared/password-field/`                             | Campo de senha (`input-group`) com mostrar/ocultar e erro só com o campo tocado                                                                                                                                                          |
| Validadores                                     | `src/app/shared/validators/`                                 | E-mail, senha, bytes UTF-8 e mensagem de erro por campo; `controlErrorFrom(control, messageOf)`; `touchedErrorFrom`/`touchedErrorMessage` para o erro embaixo do campo                                                                   |
| `BrandComponent` (`app-brand`)                  | `src/app/shared/brand/`                                      | Marca em texto (`we-sync`), como o logo do template. `size` `small`/`large`, `tone` `on-primary` (branco)/`primary` (azul do logo)                                                                                                       |
| `PageHeaderComponent` (`app-page-header`)       | `src/app/shared/page-header/`                                | `app-page-title` do template: ícone (`icon`, classe Pe-icon-7-stroke), `h1` com `title`, data de hoje (`PAGE_HEADER_DATE_FORMAT`) e ações projetadas à direita                                                                           |
| `Notifier` / `ToastHostComponent`               | `src/app/shared/notifier/`                                   | Aviso de 5 s que sobrevive à navegação (`Notifier.show`), mostrado como `.toast` numa região `aria-live="polite"` do `App`; um aviso novo substitui o anterior                                                                           |
| `ConfirmDialogComponent` / `openConfirm`        | `src/app/shared/confirm-dialog/`                             | Confirmação (`Dialog` do CDK, `role="alertdialog"`, miolo `.modal-content`) com título, linhas, aviso e dois botões; com `action`, executa, mostra carregando e erro dentro do diálogo                                                   |
| `NAV_ITEMS`                                     | `src/app/layout/nav-items.ts`                                | Itens do menu lateral (ícone Pe-icon-7-stroke); um item entra junto com a rota da tela (RN-02 da 002)                                                                                                                                    |
| `WIDE_LAYOUT_QUERY`                             | `src/app/layout/breakpoints.ts`                              | Media query do modo largo (960 px); par de `src/styles/_breakpoints.scss` (`$wide`)                                                                                                                                                      |
| Textos do layout                                | `src/app/layout/layout.messages.ts`                          | Constantes sem import do Angular (o e2e reexporta)                                                                                                                                                                                       |
| `CalendarPanelComponent` (`app-calendar-panel`) | `src/app/features/purchases/calendar/`                       | Calendário em painel (abrir num `cdkConnectedOverlay`): `mode="day"` escolhe o dia (`15 de outubro de 2026`); `mode="month"` vai de anos (24 por página) a meses                                                                         |
| `BrDateInputDirective` (`appBrDateInput`)       | `src/app/features/purchases/form/br-date-input.directive.ts` | Campo de texto `dd/mm/aaaa` ↔ `Date` (ControlValueAccessor + validador): texto que não é data deixa `null` com o erro `dateParse`; reescreve `05/10/2026` no `blur`                                                                      |
| `PaginatorComponent` (`app-paginator`)          | `src/app/features/purchases/list/paginator.component.ts`     | Paginação do Bootstrap com o intervalo `1–20 de 47` e as setas; emite a página (1…)                                                                                                                                                      |
| `STATUS_BADGE_CLASS`                            | `src/app/features/purchases/list/purchase-row.ts`            | Cor do `badge` de cada status (pago, pendente, cancelado)                                                                                                                                                                                |
| `unsavedChangesGuard` / `UnsavedChangesAware`   | `src/app/features/purchases/form/unsaved-changes.guard.ts`   | `canDeactivate` que pergunta "Descartar alterações?" quando `hasUnsavedChanges()`; sem sessão, libera                                                                                                                                    |
| `MoneyInputDirective` (`appMoneyInput`)         | `src/app/features/purchases/form/`                           | Campo de valor em reais: só aceita dígitos, pontos e até 2 casas após a vírgula (pelo evento `input`); formata `1.234,56` no `blur`                                                                                                      |
| `money.ts`                                      | `src/app/features/purchases/money.ts`                        | Dinheiro em centavos inteiros: `parseBrl`, `formatBrl`, `centsToApi`, `apiToCents`, `MONEY_TYPING_PATTERN`                                                                                                                               |
| `plain-date.ts`                                 | `src/app/features/purchases/plain-date.ts`                   | Datas sem hora (`YYYY-MM-DD` da API e `dd/mm/aaaa`) sem `new Date(string)`: `parseApiDate`, `parseBrDate`, `toLocalDate`, `formatMonthLabel` etc.                                                                                        |
| `FakeBreakpointObserver`                        | `src/testing/fake-breakpoint-observer.ts`                    | Teste: troca o `BreakpointObserver`; `setWide(bool)` muda o modo                                                                                                                                                                         |
| `nativeSelect`                                  | `src/testing/native-select.ts`                               | Teste: lê e escolhe opções de um `<select>` nativo (`getValueText`, `getOptions`, `select(texto)`), ignorando a opção vazia `hidden`                                                                                                     |
| Helpers de layout (e2e)                         | `e2e/support/layout.ts`                                      | `logout(page)` pelo menu de conta, `tab(page, nome)`, `horizontalOverflow(page)`                                                                                                                                                         |
| `contrastRatio` / `parseRgb` (e2e)              | `e2e/support/contrast.ts`                                    | Contraste WCAG 2.x entre duas cores `rgb()`                                                                                                                                                                                              |
| `focusRingColor` (e2e)                          | `e2e/support/focus.ts`                                       | Cor do contorno de foco (`outline` em `:focus-visible`), ou `null` sem contorno                                                                                                                                                          |
| `mockPurchasesApi` (e2e)                        | `e2e/support/purchases-mock.ts`                              | Servidor falso de `/purchases`, `/categories` e `/payment-methods` com estado por token (`seeds`, `override`, `delayMs`, `expiredTokens`); registrar depois do `mockApi`                                                                 |

## Aprendizados

Um item por assunto, agrupado por lib. Formato:

```markdown
### <Lib>: <assunto em poucas palavras>

- **Versão:** <versão da lib quando foi registrado> · **Registrado em:** AAAA-MM-DD (feature NNN, TF-xx)
- **Resposta:** o que fazer, direto.
- **Exemplo:** trecho curto, se ajudar.
- **Fonte:** link da documentação oficial (ou "erro do compilador: <mensagem>").
```

### ArchitectUI + Bootstrap: o tema some com o foco por teclado

- **Versão:** Bootstrap 5.3.8, ArchitectUI free 3.4.0 · **Registrado em:** 2026-10-31 (visual ArchitectUI)
- **Resposta:** o Bootstrap troca o `outline` por `box-shadow` no foco (`.btn`, `.nav-link`, `.page-link`,
  `.form-control`), e o tema do template define `$btn-focus-box-shadow: none` e ainda tem `outline: none !important`
  em `a, button, .btn` e em `.app-header-right .btn-link:focus`. Resultado: foco invisível. O projeto tirou os
  `outline: none` do SCSS copiado e devolve o contorno em `src/styles/_we-sync.scss`
  (`.btn:focus-visible, .nav-link:focus-visible, … { outline: 2px solid var(--app-focus-ring) }`). Campo de texto
  e select mantêm o `box-shadow` próprio do Bootstrap.
- **Fonte:** e2e `keyboard.spec.ts` (`focusRingColor` devolvia `null`).

### Bootstrap: `.modal-content` fora de `.modal` fica transparente

- **Versão:** 5.3.8 · **Registrado em:** 2026-10-31 (visual ArchitectUI)
- **Resposta:** as variáveis `--bs-modal-*` (fundo, padding, bordas) são declaradas na classe `.modal`. Com o
  `Dialog` do CDK posicionando o diálogo (sem `.modal`/`.modal-dialog`), o `.modal-content` sai sem fundo nem
  padding. Declare as variáveis no `panelClass` do diálogo (`.app-modal-pane` em `_we-sync.scss`), a partir das
  variáveis Sass `$modal-*`. O `.dropdown-menu` não tem esse problema (declara as variáveis nele mesmo), mas só
  aparece com `display: block` (`.show` ou a regra `.cdk-overlay-pane .dropdown-menu`).
- **Fonte:** `node_modules/bootstrap/scss/_modal.scss` (`modal-css-vars`).

### Sass: avisos de deprecação do Bootstrap 5.3 e do template

- **Versão:** Angular 22.2 (`@angular/build`), Bootstrap 5.3.8 · **Registrado em:** 2026-10-31 (visual ArchitectUI)
- **Resposta:** o Bootstrap 5.3 e o SCSS do template usam `@import`, funções globais e divisão com `/`. Para o build
  não encher de avisos: `stylePreprocessorOptions.sass.silenceDeprecations` no `angular.json` (`import`,
  `global-builtin`, `color-functions`, `slash-div`, `if-function`). `mixed-decls` já é obsoleto e gera aviso próprio:
  não ponha. A sobrescrita de variável do Bootstrap só funciona com `@import` (antes das variáveis dele), então o
  `styles.scss` usa `@import`; um arquivo importado que precise de um módulo (`breakpoints`) faz o próprio `@use`.
- **Fonte:** saída do `npm run build`.

### ArchitectUI: transição do recuo do conteúdo causa rolagem horizontal momentânea

- **Versão:** ArchitectUI free 3.4.0 · **Registrado em:** 2026-10-31 (visual ArchitectUI)
- **Resposta:** o template anima o `padding-left` de `.app-main__outer` e `.app-header__content` (0,3 s) para o menu
  recolhível. Ao passar do modo largo ao estreito, o conteúdo fica um instante mais largo que a janela, e o teste de
  "sem rolagem horizontal" logo depois do `setViewportSize` falha (101 px). O we-sync não tem o menu recolhível e
  desliga essas transições em `_we-sync.scss`.
- **Fonte:** e2e `purchases-list › CA-09 tabela e itens`.

### Vitest + jsdom: foco inicial e `Esc` do `Dialog` do CDK

- **Versão:** CDK 22.2, Vitest 5 · **Registrado em:** 2026-10-27 (feature 003, TF-05), revisto em 2026-10-31
- **Resposta:** o jsdom não tem layout, então o `InteractivityChecker` acha que nenhum botão é visível e o
  `autoFocus: 'first-tabbable'` foca o contêiner. No teste,
  `vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true)`. Para o `Esc`, o overlay
  confere `keyCode === 27`, que o `new KeyboardEvent('keydown', { key: 'Escape' })` não preenche: defina com
  `Object.defineProperty(event, 'keyCode', { get: () => 27 })` e despache no `cdk-dialog-container` (com
  `bubbles: true`).
- **Exemplo:** `src/app/shared/confirm-dialog/confirm-dialog.component.spec.ts`.
- **Fonte:** testes do projeto.

### Playwright: `<select>` nativo

- **Versão:** Playwright 1.64 · **Registrado em:** 2026-10-31 (visual ArchitectUI)
- **Resposta:** escolha com `getByRole('combobox', { name }).selectOption({ label })` (clicar na `option` não vale
  para select nativo). O texto do select é o de todas as opções: confira a escolhida com
  `.locator('option:checked')` e a lista com `.locator('option:not([hidden])')` (a opção vazia `hidden` dos campos
  obrigatórios). O campo de data continua por papel: `getByRole('textbox', { name: 'Data', exact: true })`.
- **Fonte:** e2e `purchases-form.spec.ts` e `purchases-list.spec.ts`.

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
