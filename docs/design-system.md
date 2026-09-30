# Design do ecossistema (Central, Servirea e apps futuros)

Para quem cria ou muda tela, pessoa ou IA. Leia antes de mexer em qualquer tela.

**A parte "Regras comuns" é igual nos dois fronts (`central-api-front` e `servirea-api-front`) e vale para todo app novo.** Mudou uma regra comum, mude nos dois arquivos. Só a cor da marca e os nomes das classes mudam de um app para o outro.

## Regra de ouro
Não invente controle novo. Copie a tela existente mais parecida e mantenha a estrutura. Cor tem significado, conteúdo vive em blocos, e a tela é limpa e espaçosa.

## Regras comuns

### Pilar 1 — Cor com significado (Semantic Color-Coded UI)
| Significado | Cor | Use para | Central | Servirea |
| --- | --- | --- | --- | --- |
| Marca | `var(--brand)` | cabeçalhos, títulos principais, foco dos campos, botão primário, item ativo do menu | `.bo-btn`, `.bo-title`, `.bo-field:focus` | `.btn-primary`, `.field:focus`, `bg-brand-blue` |
| Positivo | verde esmeralda | instância ativa, contratação criada no app, cobrança PAGA, aviso de sucesso | `.bo-ok` | `bg-emerald-50 text-emerald-700` |
| Atenção | âmbar / dourado | TRIAL, pendência (envio, aprovação), cobrança ABERTA | `.bo-warn` | `bg-amber-50 text-amber-700` |
| Problema ou destrutivo | vermelho / rose | BLOQUEADA, cobrança VENCIDA, erro de provisionamento, excluir, cancelar | `.bo-bad`, `.bo-btn-danger` | `bg-red-50 text-red-700`, `.btn-danger` |
| Neutro ou encerrado | cinza | cancelada, inativo, isenta | `.bo-mute` | `bg-slate-100 text-slate-600` |

Valores dos micro-badges no escuro (Central, `src/styles.scss`):
- verde `#34d399`, fundo `rgba(16,185,129,.15)`, borda `rgba(16,185,129,.32)`
- âmbar `#fbbf24`, fundo `rgba(245,158,11,.15)`, borda `rgba(245,158,11,.32)`
- vermelho `#fb7185`, fundo `rgba(244,63,94,.15)`, borda `rgba(244,63,94,.32)`
- neutro `#94a3b8`, fundo `rgba(148,163,184,.12)`, borda `rgba(148,163,184,.25)`

Regras:
1. **A cor da marca nunca diz status.** Status é sempre micro-badge. A marca serve para identidade e ação.
2. **Nunca só pela cor.** O badge sempre leva o texto do status. A marca de um app pode ser verde ou vermelha e se confundir com o status.
3. **Mesmo status, mesma cor, em qualquer tela e em qualquer app.** Status novo: escolha a cor pelo significado da tabela acima e acrescente a linha aqui.
4. **Ação destrutiva** usa botão de perigo e pede confirmação no diálogo do próprio sistema, nunca `confirm()` ou `alert()` do navegador.
5. **A marca só entra por variável** (`--brand`, `--brand-hover`, `--brand-glow` ou `color-mix` com elas). Hex da marca direto na tela é proibido.

### Pilar 2 — Blocos modulares (Block-Based Builder UI)
- Todo conteúdo fica em cartão: cantos de 16px (`rounded-2xl`; elementos internos `rounded-xl`), borda de 1px na cor de linha do app (no escuro da Central, `#26262c`) e vidro fosco (`backdrop-filter: blur(12px)`).
- Uma ficha (cliente, contratação, produto, cobrança, pessoa) é feita de **vários blocos pequenos**, cada um com título curto em caixa-alta e os botões que só dizem respeito àquele bloco no próprio bloco.
- Ação principal da página vai no cabeçalho da página. Ação de um bloco fica no bloco.
- Formulário: seções em cartão e rodapé com Cancelar à esquerda e Salvar à direita.

### Pilar 3 — SaaS moderno e limpo (Clean Modern SaaS)
- **Micro-badge:** 11px, peso forte, caixa-alta, espaçamento de letras `0.04em`, fundo translúcido da cor (12–15%), borda fina da cor (25–32%) e texto legível da mesma família.
- **Tabela:** cabeçalho de **45px**, linha de no mínimo **55px**, cabeçalho em 11px caixa-alta, zebra suave, **realce no hover** e linha clicável com foco visível. Linha marcada ganha uma barra de 3px da cor da marca à esquerda.
- **Espaço:** generoso. Sem sombra pesada, transições curtas (120–200 ms).
- **Estados:** carregando (esqueleto), vazio (mensagem), erro (bloco vermelho no topo).

## App: Central (`central-api-front`)
- Arquivo de estilo: `src/styles.scss`. Prefixo `bo-`.
- Classes: `.bo-card`, `.bo-title`, `.bo-label`, `.bo-field`, `.bo-btn`, `.bo-btn-ghost`, `.bo-btn-line`, `.bo-btn-danger`, `.bo-link`, `.bo-table` (+ `.bo-table-rolagem`, `tr.clicavel`, `tr.marcada`), `.bo-ok`, `.bo-warn`, `.bo-bad`, `.bo-mute`.
- Só tema escuro. Hover da linha da tabela: `#1c1c22`.
- **A cor da marca é escolhida pelo usuário** em Ajustes (`src/app/core/theme/theme.service.ts`: Vermelho Carmim `#e10600`, Azul Meia-Noite, Esmeralda Cyber, Roxo Obsidiana e outras). A paleta troca `--brand`, `--brand-hover`, `--brand-glow` e `--brand-dark`. **Nenhuma tela pode depender de a marca ser vermelha.**

## App: Servirea (`servirea-api-front`)
- Arquivo de estilo: `src/styles.scss`, com Tailwind. Sem prefixo.
- Classes: `.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.field`, `.label`, `.secao-form` e `.secao-titulo`, `.badge` (forma do micro-badge; a cor vem dos utilitários Tailwind da tabela acima), `.chip`, `.tabela` (+ `.tabela-rolagem`, `tr.clicavel`, `tr.marcada`).
- Claro e escuro. O escuro ajusta os utilitários de status em `html.dark .parish ...`. Toda tela nova fora da moldura envolve o conteúdo em `<div class="parish">`.
- Marca roxa fixa `#673de6`, por `--brand` / `--brand-hover` / `--brand-navy` (cabeçalho da tabela). Hover da linha: marca a 6%.

## Checklist para tela nova
1. Achei a tela existente mais parecida e copiei a estrutura (lista, ficha ou formulário).
2. Todo status usa o micro-badge da cor certa e mostra o texto.
3. Nenhum hex da marca no código; só variáveis.
4. Conteúdo em blocos, com botão contextual dentro do bloco.
5. Tabela com cabeçalho de 45px, linha de 55px ou mais, hover e linha clicável com foco.
6. Ação destrutiva com botão de perigo e confirmação no diálogo do sistema.
7. Testei no escuro e, no Servirea, também no claro. Com a paleta verde na Central, o status continua legível.

## App novo (futuro)
1. Crie os tokens: `--brand`, `--brand-hover`, `--brand-glow`, cor de cartão, cor de linha e os quatro pares de status com **os mesmos valores** da seção do Pilar 1.
2. Dê um prefixo curto ao app e mantenha os nomes: `-card`, `-btn`, `-btn-danger`, `-field`, `-table`, `-ok`, `-warn`, `-bad`, `-mute`.
3. A única coisa que muda entre apps é a cor da marca (e o prefixo). Estrutura, significado das cores e medidas são os mesmos.
4. Acrescente uma seção "App: <nome>" neste arquivo, em todos os repositórios que já o têm.
