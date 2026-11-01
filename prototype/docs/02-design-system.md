# 02 — Design system

O "ecossistema visual" do we-sync. Implementado no protótipo em `assets/we-sync.css` (tokens e componentes) e
`assets/app.js` (layout, ícones). Base: **Bootstrap 5.3.8** (copiado em `vendor/`, sem CDN).

## Princípios

1. **Amigável e fluido**: cantos arredondados, cores suaves, linguagem próxima ("Que bom te ver de novo",
   "Dá para gastar R$ X por dia").
2. **Celular e computador** com a mesma qualidade: o layout muda, as funções não.
3. **Explicar números**: todo valor calculado mostra de onde veio (tooltip, "Por que?", "Como identificamos").
4. **Acessível**: contraste mínimo 4,5:1, foco visível, alvos de toque ≥ 44px, rótulos em tudo.
5. **Cores só em tokens**: componentes nunca usam cor "solta"; tudo vem de `--ws-*`.

## Tokens de cor

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--ws-primary` | `#1565d8` | `#5b9bff` | Ação principal, links, destaque |
| `--ws-primary-strong` | `#0f4fb0` | `#8ab8ff` | Hover/ativo do primário |
| `--ws-primary-soft` | `#eaf2fe` | `#16294a` | Fundo de item ativo, botões suaves |
| `--ws-bg` | `#f4f7fc` | `#0c1422` | Fundo da página |
| `--ws-surface` | `#ffffff` | `#141e30` | Cards, menus |
| `--ws-surface-2` | `#f8fafd` | `#1a2639` | Fundo secundário, hover |
| `--ws-border` | `#e3e9f2` | `#26344c` | Bordas e divisórias |
| `--ws-text` | `#1b2638` | `#e7eef8` | Texto |
| `--ws-muted` | `#5b6b82` | `#9aaac0` | Texto secundário |
| `--ws-success` / `-soft` | `#0e7a50` / `#e3f6ee` | `#4cd39a` / `#123326` | Paga, dentro da meta |
| `--ws-warning` / `-soft` | `#9a5b00` / `#fff3dc` | `#f3b64a` / `#3a2a0c` | Pendente, atenção |
| `--ws-danger` / `-soft` | `#c22f3c` / `#fde8ea` | `#ff7c86` / `#3d1a1f` | Erro, acima do limite |
| `--ws-hero-from` → `--ws-hero-to` | `#1565d8` → `#0b3f94` | `#1a4fa8` → `#0c2a5e` | Gradiente dos cartões de destaque |

**Cores das categorias** (bolhas com ícone; fundo = cor a 14%):
Alimentação `--ws-cat-food` (azul), Transporte `--ws-cat-transport` (verde-azulado), Moradia `--ws-cat-home`
(violeta), Saúde `--ws-cat-health` (rosa), Educação `--ws-cat-education` (âmbar), Lazer `--ws-cat-leisure` (verde).
A cor da **parceira** na casa usa `--ws-cat-health` (rosa); a do usuário, `--ws-primary`.

O Bootstrap é "ponteado" para os tokens (`--bs-body-bg`, `--bs-body-color`, `--bs-border-color`, `.btn-primary`
etc.), então componentes do Bootstrap já saem no tema.

## Tipografia, forma e sombra

- **Fonte**: do sistema (`system-ui, -apple-system, Segoe UI, Roboto, …`) — sem download, offline.
- Títulos de página: 800, `clamp(1.4rem, …, 1.9rem)`, `letter-spacing: -0.02em`. Títulos de card: 700, 1.05rem.
- Valores monetários: `font-variant-numeric: tabular-nums` (`.ws-tabular`).
- Raio: `--ws-radius` 18px (cards), `--ws-radius-sm` 12px (campos, botões); pílulas 999px.
- Sombras: `--ws-shadow` (cards) e `--ws-shadow-lg` (menus, modais, barra inferior).
- Ícones: SVG de traço 24×24 (`stroke-width 1.9`), embutidos em `app.js` (`WS.icon(nome)`); nunca emoji.

## Layout

- **Computador (≥ 992px)**: menu lateral fixo de 256px (marca, grupos Menu / Planejamento / Administração, cartão
  "Registre na hora"), barra superior com "Nova compra", tema, notificações e menu do usuário; conteúdo até 1280px.
- **Celular (< 992px)**: barra superior compacta (marca + ações) e **barra de navegação inferior flutuante** com
  Início, Compras, **botão "+" central** (nova compra), Casa e Ajustes.
- Grades Bootstrap (`row g-3`, `col-12 col-xl-7`…); tabelas largas rolam dentro do card; no celular, colunas
  secundárias somem (`d-none d-sm-table-cell`) e listas viram cartões.
- Breakpoints usados: `sm` 576, `md` 768, `lg` 992 (troca do layout), `xl` 1200.

## Componentes (classes)

| Componente | Classe | Observação |
|---|---|---|
| Card | `.ws-card`, `.ws-card-head` | Base de todas as seções |
| Cartão de destaque | `.ws-hero` | Gradiente azul, valor grande |
| Indicador (KPI) | `.ws-kpi`, `.ws-kpi-icon(.is-success/.is-warning)` | No celular empilha ícone e texto |
| Mini indicador | `.ws-mini` | Caixas pequenas da meta |
| Lista de transações | `.ws-tx-list`, `.ws-tx`, `.ws-tx-actions`, `.is-wrap` | Ações descem de linha no celular |
| Bolha de categoria | `.ws-cat` com `--cat` | Ícone colorido |
| Situação | `.ws-status.is-paid/.is-pending/.is-canceled/.is-provisional` | Pílula com ponto |
| Etiqueta | `.ws-tag(.is-primary)` | "casa", "fixa", "parcela 4/6", "padrão", "atenção" |
| Chips de escolha | `.ws-chips`, `.ws-chip` (radio escondido + label) | Categorias, formas de pagamento, filtros |
| Grade de categorias | `.ws-cat-grid` | Blocos grandes com ícone |
| Segmentado | `.ws-segmented` | Paga/Pendente, Pessoal/Compartilhada, Repetir |
| Valor em dinheiro | `.ws-money` (grande), `.ws-money-sm` (em lista) | Máscara: dígitos preenchem os centavos |
| Mês | `.ws-month` | ‹ outubro 2026 › |
| Aviso | `.ws-callout(.is-warning/.is-success)` | Alertas e resultados |
| Toast | `.ws-toast` | Confirmação curta; um por vez |
| Barras | `.ws-bars` (dia), `.ws-hist` (histórico + linha do padrão), `.ws-split` (divisão do casal) | |
| Rosca | `.ws-donut` | `conic-gradient` |
| Medidor | `.ws-meter` | Barra horizontal com rótulo |
| Abas de configurações | `.ws-settings-nav` | Vertical no PC, rolagem horizontal no celular |
| Amostras de cor | `.ws-swatches` | Cor da categoria própria |
| Botões | `.btn-primary`, `.btn-soft`, `.btn-ghost`, `.btn-icon`, `.btn-outline-danger` | |
| Modal | Bootstrap `.modal` (tela cheia no celular) | Formulários curtos e confirmações |

## Padrões de interação

- **Remover** sempre pede confirmação em modal ("Remover renda?"), explicando a consequência.
- **Salvar** mostra toast ("Compra salva com sucesso").
- **Erros de campo** só depois de tentar salvar; o primeiro campo inválido recebe foco.
- **Provisório**: valores que dependem de confirmação aparecem com a pílula azul "Provisório" e um aviso com
  "Sim, foi sacado/depositado" / "Não".
- **Sugestões** (tópico pela descrição, resgate) são marcadas como sugeridas e nunca aplicadas sem a pessoa ver.
- **Em breve**: itens futuros aparecem desabilitados com a etiqueta "em breve".

## Formatos

- Dinheiro: `R$ 1.234,56` (`Intl.NumberFormat('pt-BR', BRL)`); internamente em **centavos inteiros**.
- Datas: `dd/mm/aaaa` na tela, `AAAA-MM-DD` nos dados, sem converter por fuso; resumo curto "23 out".
- Meses: "outubro 2026", abreviado "out/2026".
