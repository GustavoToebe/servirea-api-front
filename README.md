# Paróquia São José Operário — Escalas de Coroinhas e Acólitos

Projeto Angular + Tailwind + Supabase para substituir as planilhas usadas no cadastro e na criação das escalas da paróquia.

> **Estado atual (24/09/2026):** o front fala só com a **API Java**
> (`servire-api-back`, `environment.apiUrl`). Login é JWT da API (não mais
> Supabase Auth); pessoas, inscrições e escalas usam `/pessoas`, `/inscricoes`
> e `/escalas`. As seções abaixo sobre `supabase/schema.sql` e Supabase Auth são
> históricas. Para rodar: API em `http://localhost:8080` (ver README do back) e
> `npm start`.
>
> - `core/auth/auth.interceptor.ts` põe o `Bearer`, renova o token uma vez só
>   para vários 401 simultâneos e manda `X-XSRF-TOKEN` (`core/auth/xsrf.ts`) nas
>   rotas do cookie de refresh. O XSRF nativo do Angular fica desligado porque
>   ignora URL absoluta.
> - Ficha de pessoa: `responsaveis` e `dependentes` em listas separadas; em cada
>   item, `parentesco` é o que a **outra** pessoa é. Responsável novo vai como
>   `novaPessoa` e a API cria na mesma transação.

## O que já está implementado

- Login com Supabase Auth.
- Dashboard com totais e escalas recentes.
- CRUD de coroinhas/acólitos.
- Filtros por nome, idade, função, status e tipo.
- Upload de foto em bucket privado do Supabase Storage, com Signed URL.
- Cadastro dinâmico de responsáveis (pai, mãe, avô, avó, tia etc.), com contato principal marcado por estrela.
- Perfil/Get By ID com dados completos e compromissos vindos automaticamente das escalas, agrupados/filtrados por mês.
- Gestão de funções habilitadas (Missal, Cruz, Credência, Vela, Coleta, Sino).
- Listagem de escalas por ano, mês, modelo e status.
- Builder de escala com dois layouts/lógicas:
  - **Semanal**: gera todos os dias úteis do mês.
  - **Mensal / fim de semana**: gera sábado 19:00 e domingo 09:30 + 19:00.
- Suggest pesquisável por nome para cada vaga.
- O suggest respeita tipo e função configurada no cadastro.
- Bloqueio de nome duplicado dentro da mesma missa.
- Status: Não finalizada (rascunho), Finalizada e Cancelada.
- Confirmações de segurança para sair sem salvar, finalizar, cancelar, recriar a grade e excluir, no diálogo do próprio Servire (`DialogoService` + `app-dialogo-host`; nada de `confirm()`/`alert()` do navegador).
- Cadastros com máscara e validação de CPF, CNPJ (inclusive alfanumérico), RG, CEP, UF, telefone e e-mail (`shared/utils/formatos.ts`, `appMascara`), sexo em lista (Masculino, Feminino, Outro) e endereço preenchido pelo CEP (ViaCEP, `CepService`). A API confere as mesmas regras e grava no mesmo formato.
- Exclusão permitida somente para escala cancelada (regra aplicada no front e no serviço).
- Exportação de escala finalizada para PDF e PNG.
- Tela específica de Relatórios/Exportações.
- SQL completo do Supabase com PostgreSQL, RLS, Storage, índices e view de compromissos.

## 1. Instalação

Requer Node.js 24.21.0 LTS.

```bash
npm install
npm start
```

A aplicação abre em `http://localhost:4200`.

## 2. Criar o projeto no Supabase

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor**.
3. Execute `supabase/schema.sql` inteiro.
4. Opcionalmente execute `supabase/seed-demo.sql` para ter alguns cadastros de teste.
5. Em **Authentication > Users**, crie o usuário que sua mãe/responsável utilizará para acessar o sistema.

## 3. Configurar as chaves no Angular

Edite:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Exemplo:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://abcxyz.supabase.co',
  supabaseAnonKey: 'eyJ...'
};
```

Use somente a **anon/public key** no Angular. Nunca coloque `service_role` no front-end.

## 4. Regras atuais das escalas

### Modelo Semanal

É baseado na planilha enviada como referência. Ao selecionar mês/ano, o sistema gera uma missa para cada segunda a sexta-feira do mês, inicialmente às 19:00, com as vagas:

- Missal: 1
- Cruz: 1
- Credência: 1
- Vela: 2
- Sino: 2

### Modelo Mensal / fim de semana

Baseado na planilha de setembro/2026 enviada como referência. O sistema gera:

- Sábado: 19:00
- Domingo: 09:30 e 19:00

Vagas:

- Missal: 1
- Cruz: 1
- Credência: 1
- Vela: 2
- Coleta: 1
- Sino: 2

Os horários e o nome da celebração podem ser alterados na própria tela antes da finalização.

### Filtro de nomes no suggest

- `MISSAL`: sugere Acólitos ou pessoas cadastradas como “Ambos”.
- Demais funções: sugere Coroinhas ou “Ambos”.
- Se a pessoa tem funções habilitadas configuradas, o suggest respeita essa lista.

Essas regras estão centralizadas em:

- `src/app/shared/components/volunteer-picker/volunteer-picker.component.ts`
- `src/app/features/escalas/services/escalas.service.ts`

Assim é simples alterar a regra caso a paróquia tenha outra organização.

## 5. Hospedagem no cPanel / HostMídia

Gere o build:

```bash
npm run build:prod
```

Os arquivos serão gerados em `dist/paroquia-escalas-front/browser/` (Angular Application Builder). Envie o conteúdo dessa pasta para o diretório do subdomínio no cPanel.

Como o Angular usa rotas, configure o servidor para redirecionar URLs desconhecidas para `index.html`. Em hospedagem Apache, um `.htaccess` típico é:

```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 6. Segurança

- Fotos ficam em bucket **privado**.
- O front usa Signed URLs temporárias.
- Todas as tabelas têm RLS habilitado.
- As políticas atuais permitem CRUD apenas para `authenticated`.
- A chave `service_role` não deve ser usada no Angular.

Se futuramente houver perfis diferentes (administrador, coordenador, somente leitura), pode-se adicionar uma tabela `profiles` e restringir as policies por papel.

## 7. Estrutura principal

```text
src/app/
  core/
    auth/
    guards/
    layout/
    supabase/
  features/
    auth/
    dashboard/
    voluntarios/
    escalas/
    relatorios/
  shared/
    components/volunteer-picker/
    components/dialogo-host/   diálogo de confirmação/aviso (DialogoService)
    directives/mascara.directive.ts
    services/cep.service.ts    ViaCEP por fetch (sem o token da sessão)
    utils/formatos.ts          máscaras e validações (mesmas regras de web/Formatos.java)
supabase/
  schema.sql
  seed-demo.sql
```

## 8. Próximas evoluções possíveis

A base foi deixada preparada para evoluções como disponibilidade por dia, bloqueio de datas, envio automático para WhatsApp, importação da planilha atual, notificações, histórico de alterações e múltiplos usuários/perfis.
