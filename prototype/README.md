# we-sync — protótipo do novo front-end

Protótipo clicável (HTML + Bootstrap 5.3.8, roda offline) do novo visual e das novas ideias do we-sync.
Dados de exemplo, nada é salvo. É a referência visual para o front Angular novo — não é código de produção.

**Abrir:** `xdg-open prototype/index.html` (ou dois cliques em `index.html`). Celular no navegador: F12 → Ctrl+Shift+M.

## Documentação (`docs/`)

1. [Visão geral e decisões](docs/01-visao-geral-e-decisoes.md) — objetivo, onde está cada coisa, decisões, histórico
2. [Design system](docs/02-design-system.md) — cores, tipografia, layout, componentes, padrões
3. [Telas](docs/03-telas.md) — o que cada tela do protótipo faz
4. [Regras de negócio](docs/04-regras-de-negocio.md) — todas as regras combinadas (decididas e sugeridas)
5. [Cálculos](docs/05-calculos.md) — fórmulas com exemplos (divisão, acerto, padrão, IR, CDI, projeção, tendência)
6. [Impacto técnico](docs/06-impacto-tecnico.md) — API atual × o que falta, segurança, ordem das features
7. [Pendências e próximos passos](docs/07-pendencias-e-proximos-passos.md) — situação atual e próximos passos
8. [Fontes de dados](docs/08-fontes-de-dados.md) — pesquisa de APIs públicas: CDI, salário mínimo, Tesouro, cotações, proventos

## Arquivos

- `assets/we-sync.css` — tokens de tema (claro/escuro) e componentes
- `assets/app.js` — layout compartilhado, ícones, dados de exemplo, cálculos da casa
- Telas: `login`, `cadastro`, `dashboard`, `compras`, `nova-compra`, `configuracoes`, `casa`, `convite`, `metas`, `investimentos`, `admin`
- `vendor/` — Bootstrap copiado do `node_modules` (sem CDN)
- `tests/` — testes Playwright do protótipo: `npx playwright test -c prototype/tests` (ver `tests/README.md`)
