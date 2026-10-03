# Ajuda do Servirea

F11 ampliado em 02/10/2026. Rota autenticada /ajuda e menu Ajuda. Conteúdo estático separado em src/app/features/ajuda/ajuda-temas.ts para revisão junto com os módulos. Orientações filtradas pelas permissões atuais, seguindo a mesma regra do menu (uma das permissões quando o tema tem alternativas). O filtro visual não altera permissões da API ou recursos do plano.

Dezessete temas: acesso; pessoas; escalas; eventos; financeiro; comunicados; portal/participação; candidaturas; trocas; coordenação; vínculos usuário/pessoa; calendário privado; pastorais; mural; tarefas; importação CSV; plano/limites. Busca local por título/passos sem caixa ou acentos; contador, limpeza, estado vazio e tópicos expansíveis nativos. Parâmetro tema reage a navegação entre temas na mesma tela. Tópicos sem atalho único não exibem um link que leve a outro módulo.

Ajuda contextual no portal (/ajuda?tema=portal), candidaturas (tema=candidaturas) e trocas (tema=trocas), usando RouterLink. Conteúdo não consulta pessoas ou contatos e não guarda calendário, token ou dados de negócio. Explica confirmação versus presença, pedido sem reserva, original mantido até aprovação e os limites atuais de dependentes, mensagens automáticas, CSV/XLSX e permissões.

Validação: executar npm test, npm run build:prod e python scripts/verificar-docs.py antes de commitar. A fixture existente de ajuda acompanha queryParamMap observável, como no Angular Router. Sem alteração de API, migration, plano/perfil ou implantação. Homologação visual em staging permanece pendente.

## Validação executada em 02/10/2026

393 testes aprovados; build de produção, checagem documental e git diff --check aprovados. Um teste ignorado preexistente no Servirea; avisos CommonJS preexistentes no build. IDs únicos e atalhos com rotas existentes conferidos. Backends sem alteração e sem reexecução de testes nesta etapa. Homologação visual em staging pendente.

Links contextuais anteriores de Pessoas, ficha de pessoa, Eventos, ficha de evento e Financeiro permanecem disponíveis; o parâmetro tema abre a orientação correspondente quando autorizada.

Ajuda reformulada em 02/10/2026: 33 temas agrupados pelas seções do menu, cada um com "para que serve", passo a passo, cuidados, perguntas frequentes e temas relacionados (busca também nesses textos). Toda tela do painel tem o botão Ajuda: o app-cabecalho-pagina o inclui sozinho (src/app/features/ajuda/ajuda-da-rota.ts mapeia rota para tema; semAjuda desliga) e as telas sem esse cabeçalho usam app-ajuda-link. Os testes exigem que todas as rotas do painel apontem para um tema existente e que cada tema esteja completo. O tema financeiro descreve o plano de contas (grupo e conta contábil).

Contas bancárias: a tela /contas-bancarias (Cadastro) lista as contas com banco, titular, agência e conta; o cadastro e a edição abrem em página própria (/contas-bancarias/nova e /contas-bancarias/:id), com tipo de conta, dados do banco, abertura/encerramento, saldo inicial e chaves PIX. A Ajuda do financeiro explica o uso.
