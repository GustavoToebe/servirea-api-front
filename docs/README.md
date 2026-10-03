# Documentos do servire-api-front

- [Fontes e retomada](desenvolvimento/fontes-e-retomada.md): precedência, estado atual e histórico.

Índice. As instruções de quem mexe no código ficam na raiz, porque as ferramentas leem esses arquivos ali.

| Arquivo | Para quê |
| --- | --- |
| [../AGENTS.md](../AGENTS.md) | Regras atuais do front |
| [../CLAUDE.md](../CLAUDE.md) | Atalho que importa o AGENTS.md |
| [../README.md](../README.md) | Como rodar |
| [design-system.md](design-system.md) | Os 3 pilares do design e as classes de cada app |

O dump `DOCUMENTACAO-COMPLETA-PARA-IA.md` descrevia o front falando direto com o Supabase e foi removido. O que vale hoje é o código e o `AGENTS.md`.

- [financeiro.md](financeiro.md): operação, permissões, cálculos e limites do financeiro paroquial.

## Entrada rápida

- [estado-projeto.json](estado-projeto.json): componente, comandos e migration local quando houver. Não confirma publicação.
- Histórico explica decisões antigas; contrato e código atuais definem o comportamento vigente.

- [Listas paginadas](listas-paginadas.md): contratos, ordenação, seleção por página e compatibilidade.

- [Ajuda](ajuda.md): 33 temas por seção e permissão, com cuidados e perguntas frequentes, botão Ajuda em toda tela, sem IA.

- [Consumo do plano](cotas-plano.md): comportamento, contratos e limitações.

## Quatro entregas de produto — 01/10/2026

- [Funcionalidades por plano](funcionalidades-plano.md).
- [Mural e tarefas](mural-tarefas.md).

- [Portal, calendário e pastorais](portal-calendario-pastorais.md): configuração, identidade pessoal, assinatura privada e equipes simples.

- [Respostas de participação](respostas-escala.md): confirmar/recusar, prazo, histórico e consulta da coordenação.

- [Candidaturas a vagas](candidaturas-vagas.md): portal, decisão da coordenação, elegibilidade e concorrência.

- [Trocas de escala com aceite e aprovação](trocas-escala.md).

- [Tarefas, relatórios e indisponibilidade](tarefas-relatorios-disponibilidade.md): responsável, CSV autorizado e portal próprio (V065).

- [Primeiros passos](onboarding.md): checklist compartilhado, pré-requisitos, retomada e revisão versionada (F07/V066).

## Rodada 6–10 — 02/10/2026

- [mural publico leituras ](mural-publico-leituras.md): contrato, limites e homologação.
- [historico consumo ](historico-consumo.md): contrato, limites e homologação.
- [arraste escala ](arraste-escala.md): contrato, limites e homologação.
- [aniversarios ](aniversarios.md): contrato, limites e homologação.
- [site publico ](site-publico.md): contrato, limites e homologação.

## Rodada 11–17 — 02/10/2026

- [liturgia ](liturgia.md).
- [indicadores-participacao ](indicadores-participacao.md).
- [estoque-patrimonio ](estoque-patrimonio.md).
- [seletores-escala ](seletores-escala.md).
- [testes-navegacao ](testes-navegacao.md).

- [Importação CSV/XLSX de pessoas](importacao-pessoas.md): abas, mapeamento, prévia, atomicidade e limites (F08).

- [Ambiente local atual](ambiente-local-atual.md): bases novas e portas 8070/8071/4210/4211.

- [MFA dos usuários](mfa-usuarios.md): proteção da conta global, recuperação e revogação de sessões.

- [Responsáveis e coordenação própria](acessos-responsaveis-coordenacao.md): autorização explícita, escopo e revogação.

- [Distribuição por regras](distribuicao-escala.md): F04, prévia, conflitos e aplicação.

- [Centro de entregas](notificacoes-entregas.md): F05/F13, gatilhos, histórico e botões de aviso.

- [Privacidade](privacidade.md): F09, histórico, exportação e retenção.

- [Check-in e PWA](checkin-pwa.md): F15/F16, telas de check-in e instalação sem cache de dados sensíveis.

- [Contrato da API](contrato-api.md): T17, conferência das chamadas do front contra o contrato versionado.

- [Ajustes do PDF: formulários, ajuda e exportações](ajustes-pdf.md).
