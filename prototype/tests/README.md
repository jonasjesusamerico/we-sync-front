# Testes do protótipo

Testes de comportamento (Playwright) das telas do protótipo. Rodam direto nos arquivos, sem servidor, em quatro
combinações: computador e celular, tema claro e escuro.

```bash
cd ~/Documentos/github/we-sync-front
npx playwright test -c prototype/tests            # tudo
npx playwright test -c prototype/tests casa       # só um arquivo
```

| Arquivo | O que garante |
|---|---|
| `telas.spec.mjs` | Toda tela abre sem erro no console e sem rolagem para o lado; índice e admin |
| `tour.spec.mjs` | Tour de cada tela, "Não exibir novamente", sessão, ajuda, novidade, "Rever os tours" (TOUR) |
| `casa.spec.mjs` | Acerto e ajuste (ACE-09), sonhos (SON), reserva (RSV), desfazer (CX-07), Encontro (ENC) |
| `pessoal.spec.mjs` | Pague-se primeiro (PAG), assinaturas (ASS), número da liberdade (LIB) |
| `helpers.mjs` | Endereço das telas, falha por erro no console, rolagem lateral, percorrer tour, esperar modal |

Regras:

- **Rodar tudo** a cada mudança no protótipo, não só o que mudou. Se quebrar algo que não foi alterado, a mudança
  é revista junto com o usuário antes de seguir.
- Toda tela, regra ou fluxo novo ganha teste aqui, com o ID da regra no nome.
- Os valores esperados são os dados de exemplo de `assets/app.js`; se um exemplo mudar de propósito, o teste muda
  junto.
- Resultados e rastros de falha ficam em `test-results/prototype/` (fora do git).
