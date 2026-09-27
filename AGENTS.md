# AGENTS.md — servire-api-front

Front Angular do **Servire** (gestão paroquial: pessoas/voluntários, escalas de missa,
inscrição pública). A API é o irmão **`servire-api-back`** (outro git); regras de negócio,
multi-tenancy e contrato ficam lá (`AGENTS.md` e `README.md` do back). Idioma da interface,
do código e dos commits: **português**.

## Manter este arquivo atualizado
Arquivo de instruções compartilhado entre ferramentas de IA (Cursor, Codex, Copilot etc.); o
`CLAUDE.md` só importa este (`@AGENTS.md`). Edite **só aqui**, curto. Mudança que invalida
algo daqui atualiza este arquivo junto. `DOCUMENTACAO-COMPLETA-PARA-IA.md` descreve a época
do Supabase direto e está em grande parte superada; na dúvida, vale o código e este arquivo.

## Stack e comandos
Angular 21 (standalone, control flow `@if/@for`), Tailwind 3, Karma + Jasmine, jsPDF 4 +
html2canvas (exportação da escala). API em `environment.apiUrl` (dev: `http://localhost:8080`).

```powershell
npm ci                 # depois de pull que mexeu no package.json
npm start              # http://localhost:4200
npm test               # Karma + Chrome headless
npm run build:prod
```
Rodar junto com as APIs e a Central no PC: README do `central-api-back`, seção
"Ponta a ponta local (Windows, tudo no PC)". Antes de commitar: `npm test` e `npm run build:prod` verdes.

## Estrutura (`src/app/`)
- `core/auth/` — sessão (`sessionStorage`), `parishAuthInterceptor` (Bearer + `X-XSRF-TOKEN` **só** para
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
  ao clicar; use ao lado do nome de todo cadastro que tem `sequencial`.
- Lista suspensa dentro de `.card` (tem `backdrop-filter` e `overflow-hidden`): painel movido para o `body` ao abrir
  (ver `volunteer-picker` e `shared/components/datas/painel-flutuante.ts`).
- Datas: nunca `type="date"`/`type="month"` nativo. `app-campo-data` (form control ISO, tela `DD/MM/AAAA`,
  `[max]="hoje"` em nascimento) e `app-campo-competencia` (`AAAA-MM`, tela `MM/AAAA`), em `shared/components/datas/`.
- Lista de assinatura (`pessoas-list`): marcar todos/alguns e "Gerar lista de assinatura" (título, subtítulo, ordem;
  PDF A4 com 25 linhas por folha ou imagem), `features/pessoas/services/lista-assinatura.service.ts`.
- Campo de senha sempre com o olho: `<div class="relative"><input #s type="password" class="field pr-11"><app-olho-senha [campo]="s" /></div>`.

## Regras
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
