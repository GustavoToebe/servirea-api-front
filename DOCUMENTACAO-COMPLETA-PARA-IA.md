# DOCUMENTAÇÃO COMPLETA DO SISTEMA — Paróquia São José Operário (Escalas)

**Propósito deste arquivo:** dump técnico completo para outra IA. Não é um README de usuário. Contém arquitetura, configs literais, rotas, serviços, SQL, Edge Functions, contratos de API, fluxos e problemas reais do código (setembro/2026).

**Atenção:** o `README.md` da raiz está **desatualizado** em vários pontos (cita Excel, filtros de suggest por função, e omite inscrição pública / Turnstile / Edge Functions). Este arquivo descreve o que o código realmente faz.

---

## 0. Resumo em uma frase

SPA Angular 18 (standalone + lazy load) + Tailwind, autenticada no Supabase (Postgres + Auth + Storage + RLS + RPCs + Edge Functions Deno), para cadastro de coroinhas/acólitos (menores), inscrição pública com captcha, aprovação, montagem de escalas de missa e exportação PDF/PNG.

---

## 1. Identidade do projeto

| Item | Valor |
|---|---|
| Nome npm | `paroquia-escalas-front` |
| Versão | `1.0.0` |
| Pasta | `C:\Users\ICONDESKTOP_02\Documents\paroquia-escalas-completo` |
| Paróquia | São José Operário — Cascavel/PR |
| UI title | `Paróquia São José Operário - Escalas` |
| Idioma | `pt-BR` |
| Prefix Angular | `app` |
| Project Angular | `paroquia-escalas-front` |
| Source | `src/` |
| Assets | pasta `public/` (vazia no repo) |
| Build output | `dist/paroquia-escalas-front/browser/` |
| Dev URL | `http://localhost:4200` |
| Supabase project ref | `qcybebkhwhrudbwoweip` |
| Supabase URL | `https://qcybebkhwhrudbwoweip.supabase.co` |
| Supabase dashboard name | GustavoToebe Project |
| Org slug | `wclaxbibidswtkzwpnri` |
| Edge Function inscrição | `https://qcybebkhwhrudbwoweip.supabase.co/functions/v1/enviar-inscricao` |
| Domínios CORS hardcoded | `http://localhost:4200`, `http://127.0.0.1:4200`, `https://sistema.mariatoebesemijoias.com.br`, `https://app.mariatoebesemijoias.com.br` |

Não há backend Node próprio. O “backend” é Supabase (PostgREST + Auth + Storage + Edge Functions).

---

## 2. Stack

### Front

- Angular **18.2** (standalone components, Application Builder / Vite)
- TypeScript **~5.5.4** (strict)
- RxJS **~7.8.1** (quase não usado; a maior parte é `async/await`)
- Tailwind **3.4.14** + PostCSS + Autoprefixer
- `@supabase/supabase-js` **^2.45.4**
- `jspdf` **^4.2.1** + `html2canvas` **^1.4.1** (export PDF/PNG)
- `jspdf-autotable`, `xlsx`, `@angular/animations`, `@angular/platform-browser-dynamic`
  e `@supabase/supabase-js` foram **removidos** em 26/09/2026 (não eram usados; `jspdf` 2.x,
  `jspdf-autotable` e `xlsx` tinham vulnerabilidades crítica/altas no `npm audit`)
- Cloudflare Turnstile (script em `index.html`)

### Back / dados

- PostgreSQL no Supabase
- Row Level Security
- Storage bucket privado `voluntarios-fotos`
- Edge Functions Deno (`verify_jwt = false`)
- RPCs Postgres (parte **não versionada** no repo)

### Scripts npm

```json
"start": "ng serve"
"build": "ng build"
"build:prod": "ng build --configuration production"
"watch": "ng build --watch --configuration development"
```

Não há `test`, `lint`, `e2e`, CI.

---

## 3. Configs literais

### 3.1 `src/environments/environment.ts` (dev)

```ts
/** turnstileSiteKey: chave de site do Cloudflare Turnstile. A chave secreta fica apenas na Edge Function (TURNSTILE_SECRET_KEY). */
export const environment = {
  production: false,
  supabaseUrl: 'https://qcybebkhwhrudbwoweip.supabase.co',
  supabaseAnonKey: 'sb_publishable_AHHQ4S_VM0hDJ5lFJgcrgQ_q-dwLgW0',
  turnstileSiteKey: '0x4AAAAAAE5LAuNTiGgIUjVG',
};
```

### 3.2 `src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  supabaseUrl: 'https://qcybebkhwhrudbwoweip.supabase.co',
  supabaseAnonKey: 'sb_publishable_AHHQ4S_VM0hDJ5lFJgcrgQ_q-dwLgW0',
  turnstileSiteKey: '0x4AAAAAAE5LAuNTiGgIUjVG',
};
```

**Mesmas chaves em dev e prod.** A anon key é o formato novo `sb_publishable_...` (não é JWT `eyJ...`). Ela é pública por desenho (vai no bundle). A `service_role` **não** está no front.

`angular.json` production usa `fileReplacements` trocando `environment.ts` → `environment.prod.ts`.

### 3.3 `tsconfig.json`

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"],
    "skipLibCheck": true
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

### 3.4 `tsconfig.app.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
```

Padrão Angular 18 Application Builder: o grafo começa em `src/main.ts` e segue imports. `src/**/*.d.ts` entra por causa de `src/types/turnstile.d.ts`.

### 3.5 `angular.json` (pontos relevantes)

- Builder: `@angular-devkit/build-angular:application`
- `browser`: `src/main.ts`
- `polyfills`: `["zone.js"]`
- `styles`: `["src/styles.scss"]`
- `assets`: `{ glob: "**/*", input: "public" }`
- Production budgets: initial warn 900kB / error 1.5MB; anyComponentStyle warn 12kB / error 20kB
- `outputHashing: all` em prod
- `defaultConfiguration` do build = `production`
- `serve` default = `development`
- Analytics CLI desligado

### 3.6 `tailwind.config.js`

```js
content: ["./src/**/*.{html,ts}"]
theme.extend.colors.brand.blue = '#006599'
theme.extend.colors.brand.navy = '#10344a'
theme.extend.colors.brand.gray = '#9ca3af'
theme.extend.colors.app = '#f5f7f9'
theme.extend.boxShadow.card = '0 8px 24px rgba(15, 23, 42, 0.06)'
```

### 3.7 `postcss.config.js`

```js
plugins: { tailwindcss: {}, autoprefixer: {} }
```

### 3.8 `.gitignore`

```
node_modules/
dist/
.angular/
.env
.DS_Store
Thumbs.db
```

Não ignora `supabase/.temp/`. A pasta `public/` de assets está vazia.

### 3.9 `src/index.html`

- `lang="pt-BR"`
- `theme-color: #006599`
- Script Turnstile: `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` (async defer)
- Sem favicon

### 3.10 `src/main.ts`

```ts
bootstrapApplication(AppComponent, appConfig)
```

### 3.11 `src/app/app.config.ts`

```ts
providers: [
  provideRouter(routes, withComponentInputBinding()),
  provideHttpClient()
]
```

`provideHttpClient()` está registrado, mas **nenhum serviço usa `HttpClient`**. Inscrição pública usa `fetch`.

### 3.12 `src/app/app.component.ts`

Só `<router-outlet />`. Standalone.

---

## 4. Arquitetura

```
Browser (Angular SPA)
  ├─ Rotas públicas
  │    /login
  │    /inscricao  → FormData POST → Edge Function enviar-inscricao
  │                      ├─ Turnstile siteverify (Cloudflare)
  │                      ├─ Storage upload (service_role) bucket voluntarios-fotos
  │                      └─ RPC criar_inscricao_publica (service_role)
  │
  └─ Rotas autenticadas (authGuard + MainLayout)
       dashboard / voluntarios / escalas / relatorios
         └─ supabase-js (anon key + JWT da sessão)
              ├─ PostgREST: tabelas + view
              ├─ RPCs: aprovar_inscricao, rejeitar_inscricao
              ├─ Auth: signInWithPassword / signOut / getSession
              └─ Storage: upload/remove + createSignedUrl (1h)
```

Camadas do front:

```
src/app/
  core/          infraestrutura (auth, guard, layout, supabase client)
  features/      domínio por tela
  shared/        componentes reutilizáveis
```

Não há NgModules de feature. Tudo é standalone + `loadComponent`. Não há state management (NgRx/signals store). Estado vive nos components. Serviços são `@Injectable({ providedIn: 'root' })`.

---

## 5. Árvore real de `src/` e `supabase/`

```
src/
  main.ts
  index.html
  styles.scss
  types/turnstile.d.ts
  environments/
    environment.ts
    environment.prod.ts
  app/
    app.component.ts
    app.config.ts
    app.routes.ts
    core/
      auth/auth.service.ts
      auth/auth.guard.ts
      guards/pending-changes.guard.ts
      layout/main-layout/main-layout.component.ts
      supabase/supabase.service.ts
    features/
      auth/pages/login/login.component.ts
      dashboard/pages/dashboard/dashboard.component.ts
      inscricoes/pages/inscricao-publica/inscricao-publica.component.ts
      voluntarios/
        models/voluntario.model.ts
        models/inscricao.model.ts
        forms/voluntario-ficha.factory.ts
        utils/photo.utils.ts
        utils/voluntario.utils.ts
        services/voluntarios.service.ts
        services/inscricoes.service.ts
        components/voluntario-ficha-fields/voluntario-ficha-fields.component.ts
        pages/voluntarios-list/voluntarios-list.component.ts
        pages/voluntario-form/voluntario-form.component.ts
        pages/voluntario-detail/voluntario-detail.component.ts
        pages/inscricao-detail/inscricao-detail.component.ts
        pages/inscricao-edit/inscricao-edit.component.ts
      escalas/
        models/escala.model.ts
        data/calendario-liturgico.ts
        services/escalas.service.ts
        services/export.service.ts
        pages/escalas-list/escalas-list.component.ts
        pages/escala-builder/escala-builder.component.ts
      relatorios/pages/relatorios-home/relatorios-home.component.ts
    shared/components/
      turnstile/turnstile.component.ts
      confirm-dialog/confirm-dialog.component.ts
      volunteer-picker/volunteer-picker.component.ts

supabase/
  config.toml
  schema.sql                 ← INCOMPLETO vs produção
  seed-demo.sql
  .temp/linked-project.json
  functions/
    enviar-inscricao/index.ts          ← USADA
    cloudflare-turnstile/index.ts      ← NÃO usada pelo Angular
    cloudflare-turnstile/deno.json
    cloudflare-turnstile/.npmrc
```

Templates estão **inline** nos `@Component({ template: \`...\` })`. Quase não há arquivos `.html` de component. CSS global em `src/styles.scss` (classes `.card .btn-primary .btn-secondary .btn-danger .field .label .badge .date-input-br`).

---

## 6. Rotas (`src/app/app.routes.ts`)

| Path | Guard | Component | Auth |
|---|---|---|---|
| `/login` | — | `LoginComponent` | público |
| `/inscricao` | — | `InscricaoPublicaComponent` | público |
| `''` | `authGuard` | `MainLayoutComponent` | autenticado |
| `''` → redirect `dashboard` | | | |
| `/dashboard` | herdado | `DashboardComponent` | autenticado |
| `/voluntarios` | herdado | `VoluntariosListComponent` | autenticado |
| `/voluntarios/novo` | `pendingChangesGuard` | `VoluntarioFormComponent` | autenticado |
| `/voluntarios/inscricoes/:id/editar` | `pendingChangesGuard` | `InscricaoEditComponent` | autenticado |
| `/voluntarios/inscricoes/:id` | — | `InscricaoDetailComponent` | autenticado |
| `/voluntarios/:id/editar` | `pendingChangesGuard` | `VoluntarioFormComponent` | autenticado |
| `/voluntarios/:id` | — | `VoluntarioDetailComponent` | autenticado |
| `/escalas` | — | `EscalasListComponent` | autenticado |
| `/escalas/nova` | `pendingChangesGuard` | `EscalaBuilderComponent` | autenticado |
| `/escalas/:id` | `pendingChangesGuard` | `EscalaBuilderComponent` | autenticado |
| `/relatorios` | — | `RelatoriosHomeComponent` | autenticado |
| `**` | — | redirect `''` | cai no guard |

**Ordem importa:** `voluntarios/inscricoes/:id` precisa vir **antes** de `voluntarios/:id`, senão `inscricoes` seria interpretado como UUID. Isso está correto.

Não há `guestGuard`: usuário logado ainda vê `/login`.

### authGuard

```ts
session = await auth.getSession()
return session ? true : router.createUrlTree(['/login'])
```

Só checa sessão. Sem roles.

### pendingChangesGuard

Se `component.hasPendingChanges()` → `window.confirm(...)`. Implementado em:

- `VoluntarioFormComponent`
- `InscricaoEditComponent`
- `EscalaBuilderComponent` (só se status === `RASCUNHO`)

---

## 7. Cliente Supabase e Auth

### `SupabaseService`

```ts
createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})
```

Um único client singleton.

### `AuthService`

| Método | Chamada |
|---|---|
| `signIn(email, password)` | `auth.signInWithPassword` |
| `signOut()` | `auth.signOut` |
| `getSession()` | `auth.getSession` → `data.session` |

Login: email + senha, min 6 chars. Erro cru do Supabase cai na tela (`e?.message`). Sem reset de senha, sem MFA, sem convite no app.

Layout: sidebar (Início, Coroinhas/Acólitos, Escalas, Relatórios) + botão Sair.

---

## 8. Enums / tipos de domínio (front)

Definidos em `voluntario.model.ts` e `escala.model.ts` / `inscricao.model.ts`. Precisam bater com Postgres ENUMs.

```
TipoVoluntario   = COROINHA | ACOLITO | AMBOS
FuncaoEscala     = MISSAL | CRUZ | CREDENCIA | VELA | COLETA | SINO | OUTRO
HorarioEstudo    = MANHA | TARDE | NOITE
TipoEscala       = SEMANAL | MENSAL
StatusEscala     = RASCUNHO | FINALIZADA | CANCELADA
StatusInscricao  = PENDENTE | APROVADA | REJEITADA
```

Labels:

- Status escala na UI: RASCUNHO = “Não finalizada”
- Status inscrição: PENDENTE = “Aguardando aprovação”

`FUNCOES_FORM` (checkboxes da ficha) **não inclui** `OUTRO`. A Edge Function aceita `OUTRO`.

Parentescos sugeridos (datalist): Pai, Mãe, Avô, Avó, Tio, Tia, Irmão, Irmã, Padrinho, Madrinha, Responsável, Outro. Campo é texto livre.

---

## 9. Banco de dados

Há **dois estados**: o SQL versionado (`supabase/schema.sql`) e o schema **real em produção** (dump que o usuário colou). Eles **não são iguais**.

### 9.1 ENUMs (schema.sql)

```sql
tipo_voluntario  ('COROINHA','ACOLITO','AMBOS')
funcao_escala    ('MISSAL','CRUZ','CREDENCIA','VELA','COLETA','SINO','OUTRO')
tipo_escala      ('SEMANAL','MENSAL')
status_escala    ('RASCUNHO','FINALIZADA','CANCELADA')
```

Produção também tem `status_inscricao` (`PENDENTE` default nas inscrições). **Não está em `schema.sql`.**

### 9.2 Tabelas — produção (dump do usuário)

#### `public.voluntarios`

| Coluna | Tipo | Default / notas |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| nome_completo | text NOT NULL | |
| data_nascimento | date | |
| tipo | tipo_voluntario NOT NULL | `'COROINHA'` |
| ativo | boolean NOT NULL | `true` |
| foto_path | text | path no bucket, não URL |
| etapa_catequese | text | |
| eucaristia_ano | text | |
| crisma_ano | text | |
| rua, numero, bairro | text | |
| telefone, celular, email | text | |
| horario_estudo | text | CHECK `MANHA\|TARDE\|NOITE` ou NULL |
| observacoes | text | |
| autoriza_whatsapp | boolean NOT NULL | `false` |
| funcoes_habilitadas | funcao_escala[] NOT NULL | `'{}'` |
| created_at / updated_at | timestamptz NOT NULL | `now()` |

Índices no `schema.sql` (podem existir em prod):

- GIN `to_tsvector('portuguese', nome_completo)` — **o front NÃO usa full-text**; filtra com `ilike %nome%`
- `ativo`, `tipo`

Trigger `trg_voluntarios_updated_at` → `set_updated_at()`.

#### `public.responsaveis`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| voluntario_id | uuid NOT NULL FK → voluntarios(id) | dump **sem ON DELETE**; schema.sql tem **ON DELETE CASCADE** |
| parentesco | text NOT NULL | |
| nome | text NOT NULL | |
| telefone, celular, email | text | |
| principal | boolean NOT NULL | default false |
| created_at | timestamptz | |

schema.sql: unique parcial `uq_responsavel_principal_por_voluntario` em `(voluntario_id) WHERE principal = true`.

O front **apaga todos** os responsáveis e reinsere (`replaceResponsaveis`). Sem transação explícita.

#### `public.escalas`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| titulo | text NOT NULL | |
| tipo | tipo_escala NOT NULL | |
| ano | int | CHECK 2020–2100 |
| mes | int | CHECK 1–12 |
| status | status_escala NOT NULL | default `RASCUNHO` |
| observacao | text | |
| created_by | uuid FK → auth.users(id) | default `auth.uid()` |
| created_at / updated_at | timestamptz | |

Índices: `(ano, mes)`, `status`. Trigger updated_at.

#### `public.escala_eventos`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| escala_id | uuid FK → escalas(id) | schema.sql: ON DELETE CASCADE |
| data | date NOT NULL | |
| horario | time NOT NULL | |
| celebracao | text NOT NULL | default `'Missa'` |
| created_at | timestamptz | |

Ao salvar escala existente, o front **DELETE FROM escala_eventos WHERE escala_id = id** e recria tudo (cascade nas vagas, se a FK tiver CASCADE).

#### `public.escala_vagas`

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| evento_id | uuid FK → escala_eventos(id) | schema.sql: CASCADE |
| funcao | funcao_escala NOT NULL | |
| posicao | int NOT NULL default 1 | CHECK > 0 |
| voluntario_id | uuid FK → voluntarios(id) | schema.sql: ON DELETE SET NULL |
| created_at | timestamptz | |

Constraints no schema.sql (dump do usuário **não lista** unique):

- `UNIQUE (evento_id, funcao, posicao)`
- unique parcial `uq_voluntario_por_evento (evento_id, voluntario_id) WHERE voluntario_id IS NOT NULL`

Front também bloqueia duplicata na mesma missa via `usedIds`.

#### `public.inscricoes` — **só em produção / dump. AUSENTE de schema.sql**

Espelho de `voluntarios` + workflow:

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | a Edge Function gera UUID e manda em `p_dados.id` |
| nome_completo, data_nascimento, tipo, foto_path, etapa_catequese, eucaristia_ano, crisma_ano, rua, numero, bairro, telefone, celular, email, horario_estudo, observacoes, autoriza_whatsapp, funcoes_habilitadas | iguais ao voluntário | |
| status | status_inscricao NOT NULL | default `PENDENTE` |
| data_aprovacao | timestamptz | |
| aprovado_por | uuid FK → auth.users(id) | |
| voluntario_id | uuid UNIQUE FK → voluntarios(id) | preenchido na aprovação |
| data_rejeicao | timestamptz | |
| rejeitado_por | uuid FK → auth.users(id) | |
| motivo_rejeicao | text | |
| created_at / updated_at | timestamptz | |

**Não tem coluna `ativo`.** A Edge Function bloqueia o cliente de enviar `status`, `ativo`, `voluntario_id`, `aprovado_por`, etc.

#### `public.inscricao_responsaveis` — **só em produção. AUSENTE de schema.sql**

Igual a `responsaveis`, mas `inscricao_id` → `inscricoes(id)`. Dump sem ON DELETE. Tem `updated_at`.

### 9.3 View `public.vw_voluntario_compromissos` (schema.sql)

```sql
with (security_invoker = true)
select
  v.voluntario_id,
  s.id as escala_id,
  s.titulo as escala_titulo,
  s.status::text as escala_status,
  e.data, e.horario, e.celebracao, v.funcao
from escala_vagas v
join escala_eventos e on e.id = v.evento_id
join escalas s on s.id = e.escala_id
where v.voluntario_id is not null
```

Usada em `VoluntariosService.commitments(id)` → perfil do voluntário.

### 9.4 RLS (schema.sql) — autenticado = superuser de dados

```
voluntarios          ALL to authenticated using(true) with check(true)
responsaveis         ALL to authenticated using(true) with check(true)
escalas              SELECT/INSERT/UPDATE to authenticated using(true)
escalas              DELETE to authenticated USING (status = 'CANCELADA')
escala_eventos       ALL to authenticated
escala_vagas         ALL to authenticated
```

**Não há papéis.** Qualquer usuário autenticado lê/escreve tudo (dados de menores inclusive).

RLS de `inscricoes` / `inscricao_responsaveis` **não está no repo**. Em produção precisa existir, senão o admin autenticado não lista inscrições, ou (pior) a tabela fica exposta. Inferência: políticas equivalentes `authenticated ALL true`, porque o front faz select/update direto nessas tabelas.

Anon (`anon` role) **não** tem policy no schema.sql → inscrição pública **não** grava via PostgREST com anon key. Passa pela Edge Function com **service_role**, que ignora RLS.

### 9.5 Storage

Bucket `voluntarios-fotos`:

- `public = false`
- `file_size_limit = 5242880` (5 MB)
- MIME: jpeg, png, webp, heic
- Policies: authenticated SELECT/INSERT/UPDATE/DELETE no bucket

Paths:

- Cadastro interno: `{voluntarioId}/perfil-{timestamp}.{ext}`
- Inscrição pública: `inscricoes/{inscricaoId}/foto.{ext}`

Front gera Signed URL 3600s (`createSignedUrl`).

A Edge Function faz upload com service_role (bypassa policy). Cleanup: se RPC falhar, tenta `storage.remove`.

### 9.6 RPCs — **código SQL NÃO está no repositório**

Inferidas pelo front / Edge Function. Sem o SQL, outra IA não consegue recriar o banco só com o repo.

#### `criar_inscricao_publica(p_dados jsonb, p_responsaveis jsonb)`

Chamada pela Edge Function com service_role.

`p_dados` depois da validação (a EF injeta `id` e opcionalmente `foto_path`):

```json
{
  "id": "<uuid gerado na EF>",
  "nome_completo": "...",
  "data_nascimento": "YYYY-MM-DD" | null,
  "tipo": "COROINHA|ACOLITO|AMBOS",
  "etapa_catequese": "...",
  "eucaristia_ano": "...",
  "crisma_ano": "...",
  "rua": "...",
  "numero": "...",
  "bairro": "...",
  "telefone": "...",
  "celular": "...",
  "email": "...",
  "horario_estudo": "MANHA|TARDE|NOITE"|null,
  "observacoes": "...",
  "autoriza_whatsapp": true|false,
  "funcoes_habilitadas": ["MISSAL", ...],
  "foto_path": "inscricoes/<id>/foto.jpg"   // só se houve foto
}
```

`p_responsaveis`: array `{ parentesco, nome, telefone, celular, email, principal }` com exatamente 1 `principal=true`.

Retorno: id (string ou `{ id }`). Front/EF usam `extractId`.

Comportamento esperado: INSERT em `inscricoes` status PENDENTE + INSERT responsáveis. Não deve aceitar status/aprovação do cliente.

#### `aprovar_inscricao(p_inscricao_id uuid)`

Chamada pelo Angular autenticado.

Esperado:

1. Ler inscrição PENDENTE
2. INSERT em `voluntarios` (cópia dos campos; `ativo=true`)
3. Copiar `inscricao_responsaveis` → `responsaveis`
4. UPDATE inscrição: `status=APROVADA`, `voluntario_id`, `aprovado_por=auth.uid()`, `data_aprovacao=now()`
5. Idealmente copiar/mover foto

Front em erro: mensagem genérica “Não foi possível aprovar a inscrição.” (descarta `error.message` do PostgREST).

#### `rejeitar_inscricao(p_inscricao_id uuid, p_motivo text)`

Front exige motivo trim; dialog pede ≥ 5 caracteres.

Esperado: `status=REJEITADA`, `motivo_rejeicao`, `rejeitado_por`, `data_rejeicao`.

### 9.7 Seed (`supabase/seed-demo.sql`)

4 voluntários fake (Gabriela Ortiz, Henrique Luciano, Laura Almeida, Pedro Henrique). `on conflict do nothing` (não tem unique de nome, então **reexecutar duplica**). Sem responsáveis.

---

## 10. Mapa de acessos ao banco (quem chama o quê)

Cliente: sempre `SupabaseService.client` (anon + JWT), exceto inscrição pública.

### VoluntariosService — tabela `voluntarios`, `responsaveis`, view, storage

| Método | Operação |
|---|---|
| `list(filters)` | `from('voluntarios').select('*').order('nome_completo')` + `ilike nome_completo`, `eq tipo`, `eq ativo`, `contains funcoes_habilitadas`. Idade filtrada **no cliente**. Depois N signed URLs. |
| `active()` | `list({ status: 'ATIVO' })` |
| `countByActive(ativo)` | `select('id', { count: 'exact', head: true }).eq('ativo')` |
| `getById(id)` | `select('*, responsaveis(*)').eq('id').single()` |
| `create` | `insert(clean).select().single()` → `replaceResponsaveis` → upload foto → `update foto_path`. Se falhar: `delete` o voluntário (não é transação; storage pode sobrar). |
| `update` | `update(clean)` + replace responsáveis + foto opcional |
| `setActive` | `update({ ativo })` — **não chamado por nenhum component** (só checkbox `ativo` no form de edição) |
| `commitments` | `from('vw_voluntario_compromissos').select('*').eq('voluntario_id').order data, horario` |
| `replaceResponsaveis` | `delete().eq('voluntario_id')` + `insert(rows)` |
| `uploadPhoto` | `storage.from('voluntarios-fotos').upload(path, file, { upsert: true })` |
| `attachSignedPhoto` | `createSignedUrl(path, 3600)` |

`cleanVoluntario` allowlist:  
`nome_completo data_nascimento tipo ativo foto_path etapa_catequese eucaristia_ano crisma_ano rua numero bairro telefone celular email horario_estudo observacoes autoriza_whatsapp funcoes_habilitadas`

### InscricoesService

| Método | Operação |
|---|---|
| `enviarPublica` | **NÃO usa supabase-js tabelas.** `fetch(supabaseUrl/functions/v1/enviar-inscricao)` POST FormData (`dados`, `responsaveis`, `turnstileToken`, `foto`). Headers `Authorization: Bearer anonKey` + `apikey: anonKey`. |
| `listByStatus` | `from('inscricoes').select('*, inscricao_responsaveis(*)').eq('status').order created_at asc` |
| `countByStatus` | count head exact |
| `getById` | `select('*, inscricao_responsaveis(*)').single()` |
| `updatePendente` | recusa se status ≠ PENDENTE no client; `update(payload).eq('id').eq('status','PENDENTE')` + replace `inscricao_responsaveis` + foto |
| `aprovar` | `rpc('aprovar_inscricao', { p_inscricao_id })` |
| `rejeitar` | `rpc('rejeitar_inscricao', { p_inscricao_id, p_motivo })` |
| `uploadPhoto` | path `inscricoes/{id}/foto.{ext}` |

### EscalasService

| Método | Operação |
|---|---|
| `list` | `from('escalas').select('*')` order ano desc, mes desc, created_at desc + filtros ano/mes/tipo/status |
| `getById` | nested select `*, eventos:escala_eventos(*, vagas:escala_vagas(*, voluntario:voluntarios(id,nome_completo,tipo,ativo)))` |
| `save` | se id: `update(meta)` + **`delete escala_eventos`** (recria eventos/vagas em loop). se novo: `insert(meta)`. On fail de escala nova: marca CANCELADA e tenta delete. **Não transacional.** Perde IDs de eventos/vagas a cada save. |
| `setStatus` | `update({ status })` |
| `deleteCancelled` | só se status CANCELADA; `delete().eq('id').eq('status','CANCELADA')` — reforça a policy RLS |
| `buildDefaultEvents` | gera grade no cliente (não toca DB) |

### Auth

`auth.users` indireto via `signInWithPassword`. `created_by` / `aprovado_por` / `rejeitado_por` apontam para `auth.users`.

### Dashboard (sem serviço próprio)

`VoluntariosService.active()` (baixa **todos** ativos só para contar) + `EscalasService.list()` (baixa **todas** as escalas). Ineficiente.

---

## 11. Edge Functions

`supabase/config.toml`:

```toml
project_id = "qcybebkhwhrudbwoweip"

[functions.enviar-inscricao]
verify_jwt = false

[functions.cloudflare-turnstile]
enabled = true
verify_jwt = false
entrypoint = "./functions/cloudflare-turnstile/index.ts"
```

### 11.1 `enviar-inscricao` — a que o app usa

Runtime: Deno.serve. JWT verification **desligada** (função pública). Ainda assim o front manda Bearer anon key.

Secrets esperados:

| Secret | Obrigatório | Uso |
|---|---|---|
| `SUPABASE_URL` | sim (auto) | client |
| `SUPABASE_SERVICE_ROLE_KEY` | sim (auto) | bypass RLS |
| `TURNSTILE_SECRET_KEY` | deveria | se **ausente, captcha é bypass** (`return true`) |
| `ALLOWED_ORIGINS` | opcional CSV | extra CORS |

Fluxo:

1. CORS + OPTIONS
2. Só POST
3. Parse multipart **ou** JSON+foto base64
4. `verifyTurnstile(token, cf-connecting-ip \|\| x-forwarded-for)`
5. `validateDados` / `validateResponsaveis`
6. UUID da inscrição
7. Upload foto (MIME jpeg/jpg/png/webp/heic, max 5MB)
8. `rpc('criar_inscricao_publica')`
9. Resposta `{ ok, id, message }`

CORS: se Origin não está na lista, responde `Access-Control-Allow-Origin` = primeiro da lista (`localhost:4200`), não o origin atacante — o browser bloqueia. Se `ALLOWED_ORIGINS` tiver `*`, CORS abre.

Sanitização: strip control chars, max lengths, strip campos proibidos.

Foto JSON base64: `atob` em string inteira — payload grande pode estourar memória; o caminho real do app é multipart.

### 11.2 `cloudflare-turnstile` — morta para o Angular

Usa `npm:@supabase/server` + `withSupabase({ auth: 'none' })`. Espera `{ token }` JSON, valida no Cloudflare, devolve `{ success }`. **Nenhum arquivo em `src/` chama essa função.** A validação real está dentro de `enviar-inscricao`.

---

## 12. Fluxos de negócio

### 12.1 Inscrição pública (`/inscricao`)

1. Form compartilhado `createVoluntarioFichaForm` + `VoluntarioFichaFieldsComponent` (`showAtivo=false`)
2. Turnstile explícito; botão submit desabilitado sem token (se siteKey existe)
3. Callbacks globais `window.onTurnstileSuccessCallback` / `Expired` (NgZone)
4. POST FormData para EF
5. Sucesso: mostra UUID. “Enviar outra” recria o form.

Validação nome: ≥ 2 palavras, ≥ 3 chars. ≥ 1 responsável, exatamente 1 principal.

### 12.2 Aprovação

Lista `/voluntarios?aba=aguardando` ou detalhe. Confirm dialog. RPC `aprovar_inscricao`. Cria voluntário. Inscrição vai para histórico APROVADA.

Edição de pendente: `/voluntarios/inscricoes/:id/editar` — só se `status === 'PENDENTE'` (checagem client + `eq status PENDENTE` no update). Status/aprovação não vão no payload do update.

### 12.3 Cadastro interno

CRUD direto em `voluntarios`. Foto opcional. Soft-inativo via `ativo` no form (não há botão “desativar” na lista). Sem hard delete de voluntário no front.

### 12.4 Escala

**SEMANAL:** dias úteis 19:00. Vagas: MISSAL, CRUZ, CREDENCIA, VELA×2, SINO×2. Sem Coleta.

**MENSAL:** sáb 19:00, dom 09:30 e 19:00. Vagas iguais + **1 Coleta**.

Festas (`calendario-liturgico.ts`): Páscoa (computus Gauss) + Carnaval (−47), Cinzas (−46), Sexta Santa (−2), Corpus Christi (+60); fixas 06/01, 12/10, 01/11, 02/11, 08/12, 25/12. Só **renomeia** celebração de evento já gerado no mesmo dia. Não cria missa extra. SEMANAL ignora festa de fim de semana; MENSAL ignora festa de dia útil.

Builder: picker por vaga, bloqueio de duplicata na missa, adicionar/excluir dia, recriar grade, rascunho / finalizar / cancelar / reabrir / excluir se cancelada.

**Save destrutivo:** delete eventos + insert. Concorrência: último save ganha. Sem lock.

Finalizada: formulário disabled; export PDF/PNG. Reabrir volta a RASCUNHO.

### 12.5 Export (`ExportService`)

Monta HTML offscreen 1180px (tabela estilo planilha vermelha “{NOME DA PARÓQUIA DA SESSÃO} - ESCALA {MÊS}”; até 26/09/2026 o nome era fixo “PARÓQUIA SÃO JOSÉ OPERÁRIO”), `html2canvas` scale 2, PDF landscape ~A4 ou PNG download.

Layout fixo 8 colunas: DIA/HORÁRIO | Acólitos (Missal, Cruz, Vela, Velas, Sino, Sino) | Ofertório (Credência×2, Coleta×4). Semanal no builder tem 1 credência e 0 coleta — export mostra células vazias.

Não há export Excel (o `xlsx` foi removido). Relatórios = mesma listagem de escalas `FINALIZADA` + mesmos botões PDF/PNG.

### 12.6 Volunteer picker — o que o README erra

Código atual filtra:

- só `ativo`
- chip de tipo **igualdade estrita** (`COROINHA` não inclui `AMBOS`)
- busca por nome sem acento
- `excludeIds` da mesma missa

**NÃO filtra por `funcoes_habilitadas` nem por função da vaga (MISSAL vs demais).** README afirma o contrário.

---

## 13. Contratos HTTP da inscrição

```
POST {supabaseUrl}/functions/v1/enviar-inscricao
Authorization: Bearer {anonKey}
apikey: {anonKey}
Content-Type: multipart/form-data

dados: JSON string InscricaoDados
responsaveis: JSON string InscricaoResponsavelPayload[]
turnstileToken: string
foto?: File
```

Sucesso 200:

```json
{ "ok": true, "id": "<uuid>", "message": "Inscrição enviada com sucesso" }
```

Erro 400/405:

```json
{ "ok": false, "message": "<mensagem da allowlist>" }
```

Allowlist de mensagens públicas está hardcoded em `isPublicMessage` na Edge Function. Qualquer outra vira “Não foi possível enviar a inscrição. Tente novamente.”

---

## 14. Formulário compartilhado

`createVoluntarioFichaForm` — usado em inscrição pública, cadastro interno e edição de inscrição.

Campos: nome_completo (nomeCompletoValidator), data_nascimento, tipo default COROINHA, ativo default true, etapa_catequese, eucaristia_ano, crisma_ano, horario_estudo, rua, numero, bairro, telefone, celular, email (Validators.email), observacoes, autoriza_whatsapp, funcoes_habilitadas (array), responsaveis FormArray (responsaveisValidator).

Helpers: `toInscricaoDados`, `toResponsaveisPayload`, `toVoluntarioPayload` (dados + ativo), `principalDe`.

Foto: max 5MB, MIME jpeg/jpg/png/webp/heic. Preview FileReader.

---

## 15. Query params da lista de voluntários

- `aba`: `ativos` | `aguardando` | `inativos` | `historico`
- `status`: `APROVADA` | `REJEITADA` (histórico)
- `aprovada=1`: toast “Inscrição aprovada...”

Filtros ativos/inativos: nome, idade (client-side), tipo, função (`contains` no array Postgres).

---

## 16. Problemas, dívidas e riscos

### Críticos / segurança

1. **RLS “authenticated = admin total”.** Qualquer conta Auth lê fotos, endereços, telefones de responsáveis, e-mails de menores. Sem roles.
2. **`TURNSTILE_SECRET_KEY` ausente = captcha desligado** (`verifyTurnstile` retorna `true`). Spam/flood na RPC.
3. **`enviar-inscricao` com `verify_jwt = false` + service_role.** A função é o perímetro. Rate limit não aparece no código. Depende de Turnstile + validação.
4. **Schema de inscrições/RPCs não versionado.** `schema.sql` não recria produção. Risco de drift e de ambiente novo quebrado.
5. **Dados de menores (LGPD).** Foto, endereço, responsáveis. Signed URL 1h. Sem retenção/anonimização no código.
6. **Chaves iguais em environment.ts e environment.prod.ts.** OK para anon; se alguém colar service_role aí, vaza no bundle.

### Integridade / bugs funcionais

7. **`EscalasService.save` apaga e recria eventos.** Sem transação. Falha no meio deixa escala incompleta. Escala nova em erro tenta CANCELADA+delete (precisa da policy de delete).
8. **`replaceResponsaveis` delete+insert sem transação.**
9. **Dump vs schema.sql:** ON DELETE CASCADE / uniques / índices / view / RLS de inscrição podem divergir. Dump do usuário **não mostra** `ON DELETE CASCADE` nem unique de vaga.
10. **Coleta no mensal:** builder gera **1** vaga COLETA; export desenha **4** células de coleta; README diz 1. Inconsistente.
11. **Volunteer picker não aplica regra Missal=Acólito.** Manual via chip, e chip COROINHA exclui AMBOS.
12. **Dashboard baixa listas inteiras para contar.**
13. **Lista de voluntários: 1 signed URL por foto** (N+1).
14. **`setActive()` morto.** Inativar só pelo form.
15. **Sem hard-delete de voluntário** no app; se FK de vaga for SET NULL, escalas perdem o nome; se for RESTRICT, delete no SQL Editor quebra.
16. **Seed `on conflict do nothing` sem unique** → duplica.
17. **Login mostra `error.message` cru do Supabase** (pode vazar detalhe).
18. **`tsconfig` `noPropertyAccessFromIndexSignature: false`** + vários `(clean as any)`.
19. **Turnstile via `window` global** — frágil com múltiplas instâncias / HMR.
20. **Função `cloudflare-turnstile` órfã** (deploy extra, superfície inútil).
21. ~~**xlsx / jspdf-autotable / animations** mortos. README promete Excel.~~ Removidos em 26/09/2026.
22. **Zero testes.**
23. **Auth sem recuperação de senha** na UI.
24. **Wildcard `**` → `''`:** URL inválida manda para dashboard (se logado) ou login, sem 404.
25. **Filtro idade no cliente** depois de baixar todos os voluntários do filtro SQL.
26. **Foto HEIC:** MIME permitido; preview/export no Chrome Windows pode falhar.
27. **`create` voluntário:** rollback apaga row mas pode deixar arquivo no storage se o update de path falhar depois do upload.
28. **Aprovação:** se a RPC não copiar `foto_path`/arquivo, voluntário nasce sem foto e a inscrição fica com path `inscricoes/...`.
29. **CORS hardcoded em domínio de joalheria** (`mariatoebesemijoias.com.br`) — hosting compartilhado; se o site da paróquia for outro host, Turnstile hostname e CORS quebram.
30. **Builder SEMANAL: `slotFor` se a vaga não existe renderiza vazio** (ex.: se alguém salvou escala antiga com slots diferentes).

### UX / produto

31. Não há disponibilidade / choque de horário entre escalas diferentes (só duplicata na **mesma** missa).
32. Compromissos do perfil incluem escalas CANCELADAS/RASCUNHO (a view não filtra status).
33. Relatórios = só export visual; sem estatística de faltas, carga por pessoa, etc.
34. Não há WhatsApp automático apesar do flag `autoriza_whatsapp`.

---

## 17. Como rodar

```bash
cd C:\Users\ICONDESKTOP_02\Documents\paroquia-escalas-completo
npm install
npm start
# http://localhost:4200
```

Build prod:

```bash
npm run build:prod
# dist/paroquia-escalas-front/browser/
```

Apache precisa de rewrite para `index.html` (Angular router). README tem `.htaccess` de exemplo.

Usuário admin: criado em Supabase Authentication > Users (não há tela de signup).

Turnstile: site key no environment; secret só na Edge Function; hostname no dashboard Cloudflare deve ser o da barra do navegador (localhost, 127.0.0.1, e o domínio real).

---

## 18. Instruções para a IA que receber este arquivo

Você está vendo o sistema **como ele é hoje**, não como o README descreve.

Ao alterar código:

1. Não invente Excel/xlsx no fluxo atual.
2. Não assuma que o picker filtra por função habilitada.
3. Não assuma que `schema.sql` contém `inscricoes` ou as RPCs — elas existem em produção e no front, mas o SQL **não está no git**.
4. Toda escrita autenticada passa pela anon key + JWT; inscrição pública **somente** pela Edge Function + service_role + RPC.
5. Componentes são standalone, templates inline, Tailwind utility + classes globais em `styles.scss`.
6. Prefixe paths com `src/app/...` e `supabase/...` exatamente como na árvore da seção 5.
7. Se for recriar o banco do zero, precisa: schema.sql + tabelas/enum/RPCs/RLS de inscrição extraídos da produção (não estão no repo).
8. Dados pessoais de crianças: trate como dado sensível.

### Arquivos-chave para abrir primeiro

- `src/app/app.routes.ts`
- `src/environments/environment.ts`
- `src/app/core/supabase/supabase.service.ts`
- `src/app/features/voluntarios/services/voluntarios.service.ts`
- `src/app/features/voluntarios/services/inscricoes.service.ts`
- `src/app/features/escalas/services/escalas.service.ts`
- `supabase/functions/enviar-inscricao/index.ts`
- `supabase/schema.sql`
- Dump de produção (tabelas `inscricoes` / `inscricao_responsaveis`) — neste documento, seção 9.2

---

## 19. Conteúdo extra que o usuário colou (produção)

Edge Function deployada: nome `enviar-inscricao`, 3 deployments, criada ~5 dias antes de 21/09/2026.

O dump SQL de produção (sem índices/RLS/triggers/RPCs) é o das 7 tabelas da seção 9.2. “USER-DEFINED” no dump = os ENUMs listados na 9.1 + `status_inscricao`.
