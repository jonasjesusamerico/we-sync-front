# we-sync-front

Front-end do we-sync: Angular 22 (standalone, signals, zoneless) com Angular Material.

## Requisitos

- Node na versão da `.nvmrc` (`nvm use`).
- Para usar o app de verdade: a stack do [`we-sync-api`](../we-sync-api) de pé em `http://localhost:8080`
  (`docker compose up -d` no repositório da API). Em desenvolvimento, o `ng serve` encaminha `/api` para lá
  (`proxy.conf.json`), então não é preciso mexer no CORS da API.

## Rodar

```bash
npm ci
npm start
```

Abra `http://localhost:4200`.

## Tema

Tema Material 3 próprio (feature 002). As paletas vêm do schematic do Material, a partir das cores do ADR-02:

```bash
ng generate @angular/material:theme-color --primary-color='#4B66FE' --tertiary-color='#EA0050' \
  --directory=src/styles/ --is-scss --no-include-high-contrast
```

Isso gera `src/styles/_theme-colors.scss`, que não é editado à mão. As cores exatas (`mat.theme-overrides`), os
tokens do app (`--app-*`) e os ajustes de componentes (`mat.*-overrides`) ficam em `src/styles.scss`, o único lugar
com valores de cor. Os componentes usam só `var(--mat-sys-*)` e `var(--app-*)`. O breakpoint de 960 px fica em
`src/styles/_breakpoints.scss` e em `src/app/layout/breakpoints.ts`.

## Scripts

| Script                 | Comando                                                 | Para quê                                                         |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| `npm start`            | `ng serve --proxy-config proxy.conf.json`               | servidor de desenvolvimento em `:4200`, com `/api` → `:8080`     |
| `npm run build`        | `ng build`                                              | build de produção em `dist/we-sync-front/browser`                |
| `npm test`             | `ng test --watch=false`                                 | testes unitários (Vitest), uma vez                               |
| `npm run test:watch`   | `ng test`                                               | testes unitários em modo watch                                   |
| `npm run lint`         | `ng lint`                                               | ESLint (`angular-eslint`)                                        |
| `npm run format`       | `prettier --write .`                                    | formata o código                                                 |
| `npm run format:check` | `prettier --check .`                                    | confere a formatação                                             |
| `npm run e2e`          | `playwright test`                                       | e2e (Chromium) com a API simulada; sobe o `npm start` se preciso |
| `npm run e2e:compose`  | `playwright test --config playwright.compose.config.ts` | fumaça contra a stack do compose (`:3000`)                       |

## Testes e2e (Playwright)

Uma vez por máquina:

```bash
npx playwright install chromium
```

Depois, `npm run e2e`. A API **não** precisa estar de pé: tudo em `/api/v1/**` é respondido por `page.route`
(`e2e/support/api-mock.ts`, com os exemplos do contrato). Se já houver um `npm start` rodando em `:4200`, ele é
reaproveitado. Relatório em `playwright-report/` (`npx playwright show-report`).

### Fumaça contra a stack real

Com a stack do `we-sync-api` de pé (`docker compose up --build -d` lá, que também sobe este front em `:3000`):

```bash
npm run e2e:compose
```

Faz cadastro (com um e-mail novo a cada execução), login, Início e Sair contra a API de verdade
(`playwright.compose.config.ts`, `e2e/smoke.compose.spec.ts`), e falha se o console mostrar erro de CORS ou de CSP.
Esse teste não roda no `npm run e2e`.

## Configuração

| Arquivo                                       | `apiBaseUrl`                   | Usado em                                     |
| --------------------------------------------- | ------------------------------ | -------------------------------------------- |
| `src/environments/environment.development.ts` | `/api/v1`                      | `ng serve` (com o proxy)                     |
| `src/environments/environment.ts`             | `http://localhost:8080/api/v1` | build de produção (imagem Docker do compose) |

## Docker

A imagem faz o build de produção (Node da `.nvmrc`) e serve os estáticos num `nginx:1.27-alpine` na porta **80**,
sem variáveis de ambiente. No compose do `we-sync-api` ela sobe como o serviço `front` em `http://localhost:3000`
(`build.context: ../we-sync-front`, então os dois repositórios ficam lado a lado). A URL da API vem de
`environment.ts`: mudar a URL exige rebuild da imagem e ajuste do `connect-src` da CSP.

`nginx.conf`:

- fallback de SPA para `index.html`, com `Cache-Control: no-cache`;
- arquivos com hash (`*-XXXXXXXX.js|css` e `/media/`) com `Cache-Control: public, max-age=31536000, immutable`;
- gzip para CSS, JS, JSON e SVG;
- cabeçalhos de segurança em todas as respostas (`nginx/security-headers.conf`): CSP só com `'self'` (mais a API
  em `connect-src`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.

O build de produção não inline o CSS crítico (`inlineCritical: false` no `angular.json`): o Angular faria isso com
um `<script>` inline, que a CSP (`script-src 'self'`) bloqueia.

Construir e conferir sozinho:

```bash
docker build -t we-sync-front .
docker run --rm -d -p 3000:80 -m 16m --cpus 0.05 --name wsf we-sync-front
curl -sI localhost:3000/cadastro                        # 200, Cache-Control: no-cache, CSP
docker exec wsf ls /usr/share/nginx/html                # nomes dos main-<hash>.js
curl -sI localhost:3000/main-<hash>.js                  # Cache-Control: public, max-age=31536000, immutable
curl -sI -H 'Accept-Encoding: gzip' localhost:3000/main-<hash>.js   # Content-Encoding: gzip
docker stats --no-stream wsf                            # bem abaixo de 16 MiB
docker stop wsf
```
