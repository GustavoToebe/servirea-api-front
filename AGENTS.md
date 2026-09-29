# AGENTS.md — servire-api-front

Front Angular do **Servire** (gestão paroquial: pessoas/voluntários, escalas de missa,
inscrição pública). A API é o irmão **`servire-api-back`** (outro git); regras de negócio,
multi-tenancy e contrato ficam lá (`AGENTS.md` e `README.md` do back). Idioma da interface,
do código e dos commits: **português**.

## Manter este arquivo atualizado
Arquivo de instruções compartilhado entre ferramentas de IA (Cursor, Codex, Copilot etc.); o
`CLAUDE.md` só importa este (`@AGENTS.md`). Edite **só aqui**, curto. Mudança que invalida
algo daqui atualiza este arquivo junto. O dump da época do Supabase direto foi
removido; na dúvida, vale o código e este arquivo. O índice dos documentos está em `docs/README.md`.

## Stack e comandos
Angular 21 (standalone, control flow `@if/@for`), Tailwind 3, Karma + Jasmine, jsPDF 4 +
html2canvas (exportação da escala). API em `environment.apiUrl` (dev: `http://localhost:8080`; produção: `https://app.servirea.com.br/api`, mesma origem). Listas de pessoas e escalas guardam a última resposta da paróquia e mostram na hora ao voltar; o logout limpa.

```powershell
npm ci                 # depois de pull que mexeu no package.json
npm start              # http://localhost:4200
npm test               # Karma + Chrome headless
npm run build:prod
```
Rodar junto com as APIs e a Central no PC: README do `central-api-back`, seção
"Ponta a ponta local (Windows, tudo no PC)". Antes de commitar: `npm test` e `npm run build:prod` verdes.

## Estrutura (`src/app/`)
- `core/auth/` — sessão (`sessionStorage`; a paróquia também no `localStorage` para a aba nova renovar pelo cookie), `parishAuthInterceptor` (Bearer + `X-XSRF-TOKEN` **só** para
  URLs de `environment.apiUrl`; refresh compartilhado num 401), `authGuard`.
- `core/guards/pending-changes.guard.ts` — sair com alteração pendente pergunta no `DialogoService`.
- `core/layout/` — moldura, menu por permissão (`menu.ts`).
- `features/*` — telas por módulo (`pessoas`, `escalas`, `inscricoes`, `acesso`, ...).
- `shared/utils/formatos.ts` — máscaras e validações (CPF, CNPJ alfanumérico, RG, CEP, UF, telefone,
  e-mail, sexo). **Mesmas regras** de `web/Formatos.java` da API: mudou uma, muda a outra.
- `shared/utils/validadores.ts` — `Validar.cpf` etc. para formulário reativo + `erroDoCampo` (mensagem).
- `shared/directives/mascara.directive.ts` — `<input appMascara="cpf">`, com reativo ou `ngModel`.
- `shared/services/cep.service.ts` — endereço pelo CEP no ViaCEP.
- `shared/services/dialogo.service.ts` + `shared/components/dialogo-host/` — confirmação e aviso.
- `shared/components/numero/` — `<app-numero [numero]="x.sequencial" />`: número curto da paróquia "(12)" que copia
  ao clicar. Só no detalhe (ou no título do formulário de edição, quando a edição é na mesma página). A lista mostra só o nome.
- Lista suspensa dentro de `.card` (tem `backdrop-filter` e `overflow-hidden`): painel movido para o `body` ao abrir
  (ver `volunteer-picker` e `shared/components/datas/painel-flutuante.ts`).
- Datas: nunca `type="date"`/`type="month"` nativo. `app-campo-data` (form control ISO, tela `DD/MM/AAAA`,
  `[max]="hoje"` em nascimento) e `app-campo-competencia` (`AAAA-MM`, tela `MM/AAAA`), em `shared/components/datas/`.
- `shared/components/barra-filtros/` — barra padrão das listas: busca + Opções (ações sobre os marcados) + Buscar com
  painel de filtros recolhível (`<ng-content>`) e "Filtrado por". Toda lista nova usa esta barra; nada de chips de filtro soltos.
- `shared/utils/selecao.ts` + classes `.tabela` (`styles.scss`) — lista em tabela com cabeçalho em contraste, marcar todos e
  linha `marcada`.
- `shared/components/cuidados/` — seletor de cuidado e acolhimento, usado no cadastro e na inscrição.
- `features/comunicacao/` — layouts de envio (e-mail e WhatsApp) com tags. Quill 2 só no editor de e-mail
  (`components/editor-html.component.ts`, tema `quill.snow.css` em `angular.json`).
  Comunicados: `components/comunicado-dialog.component.ts` (assistente de 3 passos aberto por Pessoas → Opções →
  "Criar comunicado"), histórico em `/comunicados` e `/comunicados/:id` e a seção WhatsApp na tela Paróquia.
- Replicar semanal: `EscalasService.replicarSemanal` (mapeia por dia da semana + ocorrência no mês; dia a mais fica vazio com
  `ocorrenciaNova`, dia que falta vira `referencia`), diálogo `pages/replicar-dialog.component.ts`. Referência nunca entra em
  export, relatório, dashboard nem na lista de celebrações.
- Mensal: tela `escalas/indisponibilidades?ano=&mes=` (grade pessoa × sábados/domingos, "sem restrição", pendente),
  `volunteer-picker` com `[marcadores]` (⛔ indisponível por último e com confirmação, "N× no mês", irmão na missa) e o painel
  `components/ainda-nao-escalados.component.ts`. Irmão só é sugerido ("Colocar X também"), nunca colocado sozinho.
- Rotas com `data: { larguraTotal: true }` (montagem da escala) ocupam a largura toda no `main-layout`.
- Lista de assinatura (`pessoas-list`): marque as pessoas e abra por Opções → "Imprimir listagem" (título, subtítulo, ordem;
  PDF A4 com 22 linhas numeradas por folha ou imagem; subtítulo com a cidade do cadastro da paróquia), `features/pessoas/services/lista-assinatura.service.ts`.
- `app-duplicidades-dialog`: todo cadastro novo de pessoa ou aprovação de inscrição passa por ele para checar duplicidades.
- Campo de senha sempre com o olho: `<div class="relative"><input #s type="password" class="field pr-11"><app-olho-senha [campo]="s" /></div>`.

## Padrão de telas (estrutura do SIN+, cores do Servire)
Tela nova copia uma tela existente desse padrão antes de inventar controle novo. Componentes em `shared/components/`.
- **Lista** (ex.: `pessoas-list`, `layouts-list`): `app-cabecalho-pagina` (ação principal em `[acoes]`) + `app-barra-filtros`
  + `.tabela-rolagem > table.tabela` + `app-estado-lista` embaixo da tabela. Linha com `clicavel`, `tabindex="0"`,
  `(click)`/`(keydown.enter)` abrindo o registro; checkbox, links e botões da linha com `$event.stopPropagation()`.
- **Formulário** (ex.: `pessoa-form`, `paroquia`): cabeçalho + seções `.card.secao-form` com `h2.secao-titulo`
  (título + linha fina) e campos em `.grade-form` (2 colunas a partir de `md`), rótulo `.label` em cima. Cancelar/Salvar
  só no `app-rodape-form` (Salvar é `type="submit"`: fica dentro do `<form>`; sem `NgForm`, use `<form ngNoForm (submit)>`).
- **Opção longa** (pessoas, perfis): `app-select-busca` (filtro dentro do campo). Lista curta continua `<select>` nativo.
- **Modal**: sempre `app-modal` (`[rodape]` com Cancelar à esquerda, ação à direita). Um sobre o outro: o de cima com
  `[camada]="60"`; o Esc fecha só o de cima.
- **Desempenho**: OnPush + `markForCheck()` depois de carga assíncrona (ou listas derivadas em campos, nunca função no
  template), `track` por id, busca na API com debounce de 300 ms, busca em dado carregado filtra local. Listas pequenas
  e estáveis ficam em cache no serviço por paróquia (`AcessoApiService.perfis`, `LayoutsApiService.ativosPorCanal`),
  limpo quando a própria tela salva.

## Regras
- Tela com muitos seletores: listener global só com o painel aberto (fora da zona), OnPush, nada de função que cria
  objeto/array no template, `Intl.DateTimeFormat` só no escopo do módulo (`escala-builder/formatos-data.ts`).
- **Nunca** `confirm()`/`alert()` do navegador: `await dialogo.confirmar({...})` / `dialogo.avisar(...)`
  (o host já está no `AppComponent`). `app-confirm-dialog` segue para o caso com motivo obrigatório.
- Salvar com campo inválido: `markAllAsTouched()` + `focarPrimeiroInvalido(host)` (`shared/utils/foco.ts`); o CSS pinta
  `.field.ng-invalid.ng-touched` de vermelho.
- Campo de documento/contato usa `appMascara` + validador de `formatos.ts`, mensagem embaixo do campo e
  conferência antes de salvar. Sexo e UF são listas (`SEXOS`, `UFS`).
- Chamada para fora da API (ViaCEP etc.) vai por `fetch`, nunca pelo `HttpClient`, para o token da
  sessão não sair do domínio mesmo se o interceptor mudar.
- Ao carregar dado antigo no formulário, formate (`formatarCpf`, `normalizarSexo`...): a API só cobra o
  formato quando a ficha é salva de novo.
- Mensagem de erro da API: `mensagemApi(erro, 'fallback')` (`core/api/api-error.ts`).
- Tema escuro: estilos sob `.parish` (`styles.scss`); componente fora da moldura envolve o conteúdo em
  `<div class="parish">`.
- Commits vão direto na `main`.
