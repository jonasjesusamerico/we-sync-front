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

| Lib                    | Versão |
| ---------------------- | ------ |
| Angular (`@angular/*`) | 22.2   |
| Angular Material / CDK | 22.2   |
| RxJS                   | 7.8    |
| TypeScript             | 6.0    |
| Vitest                 | 5      |
| Playwright             | 1.64   |

## Inventário

Componentes e utilitários reutilizáveis. Antes de criar algo novo, veja se já existe aqui.

| Item                                          | Onde                                                       | Para que serve                                                                                                                                                           |
| --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ShellComponent`                              | `src/app/layout/shell.component.ts`                        | Casca das telas logadas: topo (☰, marca, menu de conta com Sair) e menu lateral (`NAV_ITEMS`), fixo a partir de 960 px e por cima abaixo disso                          |
| `AuthLayoutComponent` (`app-auth-layout`)     | `src/app/layout/auth-layout/`                              | Layout das telas de visitante: abas `Entrar`/`Criar conta` (`mat-tab-nav-bar`, uma rota por aba) e painel azul com a marca a partir de 960 px                            |
| `FormAlertComponent`                          | `src/app/shared/form-alert/`                               | Aviso fixo no formulário                                                                                                                                                 |
| `PasswordFieldComponent`                      | `src/app/shared/password-field/`                           | Campo de senha com mostrar/ocultar                                                                                                                                       |
| Validadores                                   | `src/app/shared/validators/`                               | E-mail, senha, bytes UTF-8 e mensagem de erro por campo; `controlErrorFrom(control, messageOf)` para mensagens com tradução própria (feature 003)                        |
| `BrandComponent` (`app-brand`)                | `src/app/shared/brand/`                                    | Marca: ícone `sync` + `we-sync`. `size` `small`/`large`, `tone` `on-primary`/`primary`                                                                                   |
| `PageHeaderComponent` (`app-page-header`)     | `src/app/shared/page-header/`                              | Cabeçalho de tela interna em `mat-card`: `h1` com `title` + data de hoje (`PAGE_HEADER_DATE_FORMAT`)                                                                     |
| `NAV_ITEMS`                                   | `src/app/layout/nav-items.ts`                              | Itens do menu lateral; um item entra junto com a rota da tela (RN-02 da 002)                                                                                             |
| `WIDE_LAYOUT_QUERY`                           | `src/app/layout/breakpoints.ts`                            | Media query do modo largo (960 px); par de `src/styles/_breakpoints.scss` (`$wide`)                                                                                      |
| Textos do layout                              | `src/app/layout/layout.messages.ts`                        | Constantes sem import do Angular (o e2e reexporta)                                                                                                                       |
| `FakeBreakpointObserver`                      | `src/testing/fake-breakpoint-observer.ts`                  | Teste: troca o `BreakpointObserver`; `setWide(bool)` muda o modo                                                                                                         |
| Helpers de layout (e2e)                       | `e2e/support/layout.ts`                                    | `logout(page)` pelo menu de conta, `tab(page, nome)`, `horizontalOverflow(page)`                                                                                         |
| `contrastRatio` / `parseRgb` (e2e)            | `e2e/support/contrast.ts`                                  | Contraste WCAG 2.x entre duas cores `rgb()`                                                                                                                              |
| `focusRingColor` (e2e)                        | `e2e/support/focus.ts`                                     | Cor do contorno de foco forte do Material, ou `null` sem foco                                                                                                            |
| `mockPurchasesApi` (e2e)                      | `e2e/support/purchases-mock.ts`                            | Servidor falso de `/purchases`, `/categories` e `/payment-methods` com estado por token (`seeds`, `override`, `delayMs`, `expiredTokens`); registrar depois do `mockApi` |
| `ConfirmDialogComponent` / `openConfirm`      | `src/app/shared/confirm-dialog/`                           | Confirmação com título, linhas, aviso e dois botões; com `action`, executa, mostra carregando e erro dentro do diálogo                                                   |
| `BrDateAdapter` / `BR_DATE_FORMATS`           | `src/app/features/purchases/br-date-adapter.ts`            | `DateAdapter` do `mat-datepicker` com entrada e exibição `dd/mm/aaaa` (o `NativeDateAdapter` lê no formato americano)                                                    |
| `PtBrPaginatorIntl`                           | `src/app/features/purchases/pt-br-paginator-intl.ts`       | Textos do `mat-paginator` em pt-BR (`1–20 de 47`, `Próxima página`)                                                                                                      |
| `PtBrDatepickerIntl`                          | `src/app/features/purchases/pt-br-datepicker-intl.ts`      | Textos do calendário em pt-BR (inclui `formatYearRangeLabel`)                                                                                                            |
| `notify`                                      | `src/app/features/purchases/notify.ts`                     | Aviso em `MatSnackBar` (5 s, `polite`) que sobrevive à navegação                                                                                                         |
| `unsavedChangesGuard` / `UnsavedChangesAware` | `src/app/features/purchases/form/unsaved-changes.guard.ts` | `canDeactivate` que pergunta "Descartar alterações?" quando `hasUnsavedChanges()`; sem sessão, libera                                                                    |
| `MoneyInputDirective` (`appMoneyInput`)       | `src/app/features/purchases/form/`                         | Campo de valor em reais: só aceita dígitos, pontos e até 2 casas após a vírgula (pelo evento `input`); formata `1.234,56` no `blur`                                      |
| `money.ts`                                    | `src/app/features/purchases/money.ts`                      | Dinheiro em centavos inteiros: `parseBrl`, `formatBrl`, `centsToApi`, `apiToCents`, `MONEY_TYPING_PATTERN`                                                               |
| `plain-date.ts`                               | `src/app/features/purchases/plain-date.ts`                 | Datas sem hora (`YYYY-MM-DD` da API e `dd/mm/aaaa`) sem `new Date(string)`: `parseApiDate`, `parseBrDate`, `toLocalDate`, `formatMonthLabel` etc.                        |

## Aprendizados

Um item por assunto, agrupado por lib. Formato:

```markdown
### <Lib>: <assunto em poucas palavras>

- **Versão:** <versão da lib quando foi registrado> · **Registrado em:** AAAA-MM-DD (feature NNN, TF-xx)
- **Resposta:** o que fazer, direto.
- **Exemplo:** trecho curto, se ajudar.
- **Fonte:** link da documentação oficial (ou "erro do compilador: <mensagem>").
```

### Angular Material: gerar paletas M3 a partir de um hex

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, SDD)
- **Resposta:** `ng generate @angular/material:theme-color` com `--primary-color`, `--tertiary-color` (e, se
  quiser, `--secondary-color`, `--neutral-color`, `--neutral-variant-color`, `--error-color`), `--directory`,
  `--is-scss` e `--include-high-contrast`. Gera `_theme-colors.scss` com `$primary-palette` e `$tertiary-palette`.
  No tema claro, `--mat-sys-primary` é o tom 40 da paleta, e não o hex informado: para a cor exata, use
  `mat.theme-overrides`.
- **Fonte:** `node_modules/@angular/material/schematics/ng-generate/theme-color/schema.json`.

### Angular Material: `mat.theme-overrides` ignora chaves desconhecidas

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, SDD)
- **Resposta:** chave com erro de digitação é descartada **sem erro de build**. Confira o valor de
  `--mat-sys-<nome>` no DevTools. Use dentro do seletor do tema (`html { … }`). Já os
  `mat.<componente>-overrides` dão erro de build se o token não existir.
- **Exemplo:** `@include mat.theme-overrides((primary: #4B66FE, on-primary: #FFFFFF));`
- **Confirmado na TF-01 (002):** com o `theme-overrides` logo depois do `mat.theme` no mesmo seletor, o CSS gera
  as duas declarações (`--mat-sys-primary: #2d4be5` do tom 40 e depois `#4b66fe`) e a última vale: no navegador
  `--mat-sys-primary` = `#4b66fe`. O schematic `theme-color` gerou `src/styles/_theme-colors.scss` sem perguntas
  interativas quando as cores vão por flag.
- **Fonte:** `node_modules/@angular/material/core/tokens/_system.scss` (`theme-overrides`).

### Angular Material: nomes de token dos `*-overrides` usados no tema

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, SDD)
- **Resposta:** as chaves são o nome do token sem o prefixo do componente:
  - `toolbar-overrides`: `container-background-color`, `container-text-color`;
  - `sidenav-overrides`: `container-background-color`, `container-shape`, `container-width` (padrão 360px),
    `content-background-color` (também é o fundo do `mat-sidenav-container`), `scrim-color`;
  - `card-overrides` (aparência padrão = elevated): `elevated-container-color`, `elevated-container-shape`,
    `elevated-container-elevation`;
  - `form-field-overrides`: `filled-container-color`, `filled-active-indicator-color`;
  - lista: as variáveis CSS são `--mat-list-list-item-<token>` (`container-color`, `label-text-color`,
    `leading-icon-color`, `label-text-weight` etc.), e podem ser redefinidas num seletor local.
- **Fonte:** `node_modules/@angular/material/{toolbar,sidenav,card,form-field,list}/_m3-*.scss`.

### Angular Material: indicador de foco forte

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, SDD)
- **Resposta:** `@include mat.strong-focus-indicators((border-color: …))` fora de seletor emite as variáveis em
  `html`. Para mudar a cor num trecho (ex.: branco no topo), redefina `--mat-focus-indicator-border-color` no
  seletor. O contorno é o `::before` de `.mat-focus-indicator`, que aparece só com `:focus-visible`. Nos botões, o
  `.mat-focus-indicator` é um filho do botão.
- **Fonte:** `node_modules/@angular/material/core/focus-indicators/_private.scss`.

### Angular Material: foco do `mat-sidenav`

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, SDD)
- **Resposta:** sem `autoFocus`, o padrão é `'dialog'` no modo `side` (não move o foco ao abrir nem o devolve ao
  fechar) e `'first-tabbable'` nos outros modos (foca o primeiro elemento ao abrir e devolve o foco ao elemento
  anterior ao fechar). `Esc` fecha, a não ser com `disableClose`.
- **Fonte:** `node_modules/@angular/material/fesm2022/sidenav.mjs` (`get autoFocus`, `_takeFocus`).

### Angular Material: desligar animações nos testes

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, SDD)
- **Resposta:** `{ provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } }`, de
  `@angular/material/core`. Não há mais `provideNoopAnimations` para isso.
- **Fonte:** `node_modules/@angular/material/types/core.d.ts`.

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

### Angular Material: `openedChange` do `mat-sidenav` é assíncrono (cuidado com `[opened]`)

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-03)
- **Resposta:** o `openedChange` sai depois da animação (com animações desligadas, depois de um `setTimeout`). Com
  `[opened]="sinal()"` e `(openedChange)="sinal.set($event)"`, um aviso atrasado reabre ou fecha o drawer e cria um
  ciclo infinito de abre e fecha (nos testes, `whenStable` nunca resolve). Sincronize com o estado real:
  `#sidenav` e `(openedChange)="onOpenedChange(sidenav.opened)"`.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/sidenav/drawer.ts (`_setOpen`,
  `_simulateAnimation`, `openedChange` com `isAsync`) e teste do Shell.

### Angular Material: formato do item no `mat-nav-list`

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-03)
- **Resposta:** o item do `mat-nav-list` usa `--mat-list-active-indicator-shape` (padrão `corner-full`, pílula) como
  `border-radius`, mesmo sem `[activated]`. Para fundo na largura toda: `--mat-list-active-indicator-shape: 0`.
  `--mat-list-list-item-container-shape` não afeta o nav-list.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/list/_m3-list.scss

### Angular Material: `mat-nav-list` já é landmark de navegação

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-03)
- **Resposta:** o `mat-nav-list` tem `role="navigation"`. Dentro de um `<nav aria-label>`, a página fica com dois
  landmarks; no Playwright use `getByRole('navigation', { name: … })`.
- **Fonte:** navegador (Chromium), atributo `role` do `mat-nav-list`.

### Angular Material: `mat-icon-button` dentro do `mat-toolbar`

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-03)
- **Resposta:** o `mat-icon-button` não herda o `container-text-color` do toolbar (fica `on-surface-variant`). Em
  `styles.scss`: `.mat-toolbar { @include mat.icon-button-overrides((icon-color: …, state-layer-color: …,
ripple-color: …)); }`. Os três tokens existem (o build valida).
- **Fonte:** navegador (cor calculada do ícone) e `npm run build`.

### Angular Router: pai `''` com filhas casa `/` mesmo sem filha

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-05)
- **Resposta:** uma rota `{ path: '', component: X, children: [{ path: 'login' }, …] }` casa a URL `/` sozinha
  (ativa `X` com o outlet vazio); o roteador **não** passa para a próxima rota `''`. Com duas rotas-layout `''`,
  ponha primeiro a que deve atender `/` (no projeto, o Shell, cuja filha `''` não consome `login`). Para
  `/login`, o Shell não casa e o roteador segue para a próxima, sem rodar os guards do Shell.
- **Fonte:** testes de `auth.guards.spec.ts` (`RouterTestingHarness`) com as rotas do app.

### Angular Material: abas ligadas a rotas (`mat-tab-nav-bar`)

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-05)
- **Resposta:** `<nav mat-tab-nav-bar [tabPanel]="panel">` + `<a mat-tab-link [routerLink] routerLinkActive
#rla="routerLinkActive" [active]="rla.isActive">` + `<mat-tab-nav-panel #panel><router-outlet /></mat-tab-nav-panel>`.
  Com `[tabPanel]`, os links ganham `role="tab"` e `aria-selected`; setas trocam o foco entre as abas. O
  próprio `<nav>` recebe `role="tablist"` (deixa de ser landmark de navegação): o `aria-label` nomeia o
  `tablist`, e no Playwright é `getByRole('tablist', { name })`, não `navigation`.
  `mat-stretch-tabs` estica as abas na largura.
- **Exemplo:** `src/app/layout/auth-layout/auth-layout.component.html`.
- **Fonte:** https://material.angular.dev/components/tabs/overview (Tabs and navigation) e o spec do AuthLayout.

### Angular Material: `Esc` no `mat-sidenav` só funciona com o foco dentro dele

- **Versão:** 22.2 · **Registrado em:** 2026-10-22 (feature 002, TF-07)
- **Resposta:** o `keydown` de `Esc` é ouvido no elemento do drawer. No modo `over`, o foco só entra no drawer
  (primeiro item) quando a abertura termina. Um `Esc` antes disso, com o foco ainda no botão que abriu, não fecha.
  Nos e2e, espere `toBeFocused()` no primeiro item antes de apertar `Escape`.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/sidenav/drawer.ts (listener de
  `keydown`) e o e2e `layout › CA-03 Esc fecha` (intermitente sem a espera).

### Angular Material: `NativeDateAdapter` interpreta datas no formato americano

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** `parse(value, parseFormat?)` faz `new Date(Date.parse(value))` e ignora o `parseFormat`:
  `05/10/2026` vira 10 de maio, e um texto que não dá para ler vira um `Date` inválido (não `null`). Só um valor
  vazio devolve `null`. `format(date, displayFormat)` usa `Intl.DateTimeFormat` com `timeZone: 'utc'` e lança erro
  com data inválida. `invalid()` é `new Date(NaN)`. `createDate` usa `setFullYear` (o ano 50 não vira 1950). Na
  22.2 a classe tem `@Service({ autoProvided: false })` e um construtor sem parâmetros que injeta
  `MAT_DATE_LOCALE`. Para `dd/mm/aaaa`, estenda a classe e sobrescreva `parse` e `format`, e forneça com
  `{ provide: DateAdapter, useClass: … }`.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/core/datetime/native-date-adapter.ts

### Angular Material: o que o input do datepicker faz com um texto inválido

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** se o `DateAdapter` não consegue ler o texto, o controle recebe `null` e o validador do input põe o
  erro `matDatepickerParse: { text }`. Por isso um texto inválido também ativa o `required`: para mostrar "data
  inválida", confira primeiro `matDatepickerParse`. No `blur`, o texto só é reformatado (com
  `display.dateInput`) quando o valor não é `null`. Os outros erros do input são `matDatepickerMin`,
  `matDatepickerMax` e `matDatepickerFilter`.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/datepicker/datepicker-input-base.ts

### Angular Material: formatos de data (`MAT_DATE_FORMATS`) e seletor de mês e ano

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** `MatDateFormats` = `{ parse: { dateInput, timeInput? }, display: { dateInput, monthYearLabel,
dateA11yLabel, monthYearA11yLabel, monthLabel?, timeInput?, timeOptionLabel? } }`, todos `any` (o adapter decide
  o formato). `MAT_DATE_LOCALE` usa o `LOCALE_ID` por padrão. Seletor de mês e ano: `startView="multi-year"` no
  `mat-datepicker` e `(monthSelected)`, que emite o dia 1 do mês; chame `picker.close()` no handler. Os botões
  internos do calendário usam o `MatDatepickerIntl`, que vem em inglês (`Open calendar` etc.): forneça uma
  subclasse em pt-BR.
- **Confirmado na TF-07 (003):** o `mat-datepicker` sem campo visível, ancorado num `<input>` invisível embaixo de um
  botão e aberto por `picker.open()`, funciona. Na visão `multi-year`, as células têm `aria-label` com o ano
  (`2025`) e, na visão de ano, com `monthYearA11yLabel` (`março de 2025`); o Playwright as acha por
  `getByRole('button', { name, exact: true })`.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/datepicker/datepicker.md e
  https://github.com/angular/components/blob/22.2.x/src/material/core/datetime/date-formats.ts

### Angular Material: `mat-option` com valor `null` limpa o `mat-select`

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** por padrão, uma opção com valor `null` ou `undefined` limpa o select (ele fica sem texto). Para uma
  opção "Todos" com valor `null` que aparece selecionada, use `[canSelectNullableOptions]="true"` no `mat-select`
  (ou o padrão global por `MAT_SELECT_CONFIG`). Todo select precisa de nome acessível (`mat-label`, `aria-label`
  ou `aria-labelledby`).
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/select/select.md

### Angular Material: `MatPaginatorIntl` vem em inglês e com espaços no intervalo

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** os campos são `itemsPerPageLabel`, `nextPageLabel`, `previousPageLabel`, `firstPageLabel`,
  `lastPageLabel`, `changes: Subject<void>` e `getRangeLabel(page, pageSize, length)`, em que `page` começa em 0.
  O padrão devolve `"1 – 20 of 47"` (com espaços em volta do traço). Para outro texto, estenda a classe e forneça
  com `{ provide: MatPaginatorIntl, useClass: … }`.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/paginator/paginator-intl.ts

### Angular Material: padrões do `MatDialogConfig`

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** `role` aceita `'dialog'` (o padrão) ou `'alertdialog'`. `autoFocus` é `'first-tabbable'` por
  padrão (também aceita `'dialog'`, `'first-heading'` ou um seletor CSS). `restoreFocus` é `true`, e
  `disableClose` é `false`. O primeiro botão do diálogo recebe o foco, então ponha o botão de cancelar primeiro.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/dialog/dialog-config.ts

### Angular Router: `canceledNavigationResolution: 'computed'`

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, SDD)
- **Resposta:** com o padrão (`'replace'`), uma navegação cancelada por um guard faz `replaceState`. Se a navegação
  veio do voltar do navegador, a entrada atual do histórico é trocada e o histórico fica errado. Com `'computed'`,
  o roteador volta à entrada do histórico em que estava (depois de um voltar cancelado, ele navega para a frente).
  Configure com `provideRouter(routes, withRouterConfig({ canceledNavigationResolution: 'computed' }))`. Não
  funciona com um `UrlHandlingStrategy` que trate só parte da URL.
- **Fonte:** https://angular.dev/api/router/RouterConfigOptions

### Playwright: ler o indicador de foco forte do Material

- **Versão:** 1.64 · **Registrado em:** 2026-10-22 (feature 002, TF-07)
- **Resposta:** o contorno é o `::before` de `.mat-focus-indicator` ou `.mat-mdc-focus-indicator` (o helper
  aceita as duas classes), no próprio elemento ou num filho direto. Leia com
  `getComputedStyle(el, '::before')` (`content`, `display`, `borderTopWidth`, `borderTopColor`). Helper pronto:
  `e2e/support/focus.ts` (`focusRingColor`), que devolve `null` sem foco.
- **Fonte:** e2e `keyboard.spec.ts`.

### Angular Material: subclasse do `NativeDateAdapter` (decorador e assinatura do `format`)

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, TF-04)
- **Resposta:** `@Injectable()` na subclasse funciona (o compilador aceita, mesmo com o `@Service` da base). O
  `format` da base tem `displayFormat: Object`: com `object` na subclasse, comparar com uma string dá `TS2367`.
  Declare `displayFormat: unknown` (tipo mais largo, override válido) e repasse com `as object` ao `super.format`.
- **Exemplo:** `src/app/features/purchases/br-date-adapter.ts`.
- **Fonte:** erro do compilador: `TS2367: This comparison appears to be unintentional because the types 'object' and 'string' have no overlap`.

### Angular Material: campos de texto do `MatDatepickerIntl`

- **Versão:** 22.2 · **Registrado em:** 2026-10-27 (feature 003, TF-04)
- **Resposta:** além dos 11 rótulos (`calendarLabel`, `openCalendarLabel`, `closeCalendarLabel`, `prev/nextMonthLabel`,
  `prev/nextYearLabel`, `prev/nextMultiYearLabel`, `switchToMonthViewLabel`, `switchToMultiYearViewLabel`), há
  `formatYearRange(start, end)` (texto visível `2016 – 2039`, serve em pt-BR) e `formatYearRangeLabel(start, end)`
  (lido pelo leitor de tela, padrão `2016 to 2039`: sobrescreva). `startDateLabel`, `endDateLabel` e
  `comparisonDateLabel` são só do seletor de intervalo.
- **Fonte:** https://github.com/angular/components/blob/22.2.x/src/material/datepicker/datepicker-intl.ts

### Vitest + jsdom: foco inicial e `Esc` do `MatDialog`

- **Versão:** Material 22.2, Vitest 5 · **Registrado em:** 2026-10-27 (feature 003, TF-05)
- **Resposta:** o jsdom não tem layout, então o `InteractivityChecker` acha que nenhum botão é visível e o
  `autoFocus: 'first-tabbable'` foca o contêiner. No teste,
  `vi.spyOn(TestBed.inject(InteractivityChecker), 'isVisible').mockReturnValue(true)`. Para o `Esc`, o overlay
  confere `keyCode === 27`, que o `new KeyboardEvent('keydown', { key: 'Escape' })` não preenche: defina com
  `Object.defineProperty(event, 'keyCode', { get: () => 27 })` e despache no `mat-dialog-container` (com
  `bubbles: true`).
- **Exemplo:** `src/app/shared/confirm-dialog/confirm-dialog.component.spec.ts`.
- **Fonte:** testes do projeto.

### Angular Router + Vitest: `whenStable` não resolve com um guard esperando o usuário

- **Versão:** Angular 22.2, Vitest 5 · **Registrado em:** 2026-10-31 (feature 003, TF-12)
- **Resposta:** a navegação em andamento conta como tarefa pendente. Com um `canDeactivate` que devolve um
  `Observable` aberto (o diálogo de "Descartar alterações?"), o `fixture.whenStable()` e o
  `ApplicationRef.whenStable()` só resolvem quando o usuário responde, e o teste estoura o tempo. Enquanto o
  diálogo está aberto, deixe o tempo passar com macrotarefas e atualize a tela com `ApplicationRef.tick()`; depois
  de clicar no botão do diálogo, o `whenStable` volta a funcionar.
- **Exemplo:** `render()` em `src/app/features/purchases/form/purchase-form.page.spec.ts` (bloco do guard).
- **Fonte:** testes do projeto (timeout de 5 s no `whenStable`).

### Playwright + Angular Material: `getByLabel` do campo de data acha também o calendário

- **Versão:** Playwright 1.64, Material 22.2 · **Registrado em:** 2026-10-31 (feature 003, TF-14)
- **Resposta:** com o `mat-datepicker` aberto (ou fechando), o painel `role="dialog"` tem `aria-labelledby` apontando
  para o `mat-label` do campo, e `getByLabel('Data')` resolve dois elementos (erro de modo estrito). Localize o
  campo por papel: `getByRole('textbox', { name: 'Data', exact: true })`. O `mat-select` é
  `getByRole('combobox', { name })` e as opções, `getByRole('option', { name })`.
- **Fonte:** e2e `purchases-form › calendário` (strict mode violation).
