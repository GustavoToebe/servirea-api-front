# Ajustes solicitados no PDF — 03/10/2026

Formulários ampliados na própria página. Ajuda contextual abre o tópico correspondente expandido e o traz para a área visível; contas bancárias têm orientação própria com passos e exemplo. Cabeçalhos mantêm Ajuda junto das ações. A Central ganhou confirmação de alterações não salvas nas rotas de cadastro/edição e aviso ao fechar a aba.

## Exportações

CSV, JSON, XLSX, PDF e imagem disponíveis nas listagens administrativas e relatórios tratados nesta rodada. A exportação usa todas as páginas dos filtros aplicados, até 5.000 registros, conferindo total e IDs repetidos. Se a lista mudar durante a coleta, pede nova tentativa. Logs da Central recusam exportar quando alcançam o teto de 500 da consulta: reduzir os filtros evita truncamento.

XLSX mantém números como números, cabeçalho congelado, filtro e linhas alternadas. PDF A4 deitado e PNG têm bordas, título, filtros e páginas; observações longas continuam na página seguinte. Imagens de várias páginas baixam juntas em ZIP. CSV neutraliza fórmulas em textos. As bibliotecas de geração são carregadas sob demanda. Exportações de resumos usam colunas explícitas, sem senhas, tokens, dados de cuidados ou chaves PIX.

Escalas e listas de assinatura preservam os PDF/PNG visuais existentes e recebem CSV/JSON/XLSX. O relatório de participação continua solicitando o CSV autorizado e auditado no backend antes da conversão. Uma listagem de pessoas contém somente nome, papel e situação; não equivale à exportação completa de dados pessoais.

O modelo Excel de importação do Servirea mantém os cinco cabeçalhos do importador, oferece seleção de papel, campos de texto e uma aba explicativa. Não contém pessoas fictícias que possam ser importadas por engano. CSV vazio continua disponível.

## Verificação e limites

Amostras dos cinco formatos foram geradas em Chrome local com dados fictícios; PDF/PNG com texto longo em várias páginas e modelo Excel foram inspecionados visualmente. Testes automatizados cobrem paginação, alteração da lista, fórmulas CSV, tipos XLSX e cancelamento. Builds e contagens finais estão no registro da rodada. Sem mudança de API ou migration nesta etapa. Não houve deploy; homologação das telas com usuários reais permanece necessária.
