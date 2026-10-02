# Ajuda do Servirea

F11 ampliado em 02/10/2026. Rota autenticada /ajuda e menu Ajuda. Conteúdo estático separado em src/app/features/ajuda/ajuda-temas.ts para revisão junto com os módulos. Orientações filtradas pelas permissões atuais, seguindo a mesma regra do menu (uma das permissões quando o tema tem alternativas). O filtro visual não altera permissões da API ou recursos do plano.

Dezessete temas: acesso; pessoas; escalas; eventos; financeiro; comunicados; portal/participação; candidaturas; trocas; coordenação; vínculos usuário/pessoa; calendário privado; pastorais; mural; tarefas; importação CSV; plano/limites. Busca local por título/passos sem caixa ou acentos; contador, limpeza, estado vazio e tópicos expansíveis nativos. Parâmetro tema reage a navegação entre temas na mesma tela. Tópicos sem atalho único não exibem um link que leve a outro módulo.

Ajuda contextual no portal (/ajuda?tema=portal), candidaturas (tema=candidaturas) e trocas (tema=trocas), usando RouterLink. Conteúdo não consulta pessoas ou contatos e não guarda calendário, token ou dados de negócio. Explica confirmação versus presença, pedido sem reserva, original mantido até aprovação e os limites atuais de dependentes, mensagens automáticas, CSV/XLSX e permissões.

Validação: executar npm test, npm run build:prod e python scripts/verificar-docs.py antes de commitar. A fixture existente de ajuda acompanha queryParamMap observável, como no Angular Router. Sem alteração de API, migration, plano/perfil ou implantação. Homologação visual em staging permanece pendente.

## Validação executada em 02/10/2026

393 testes aprovados; build de produção, checagem documental e git diff --check aprovados. Um teste ignorado preexistente no Servirea; avisos CommonJS preexistentes no build. IDs únicos e atalhos com rotas existentes conferidos. Backends sem alteração e sem reexecução de testes nesta etapa. Homologação visual em staging pendente.

Links contextuais anteriores de Pessoas, ficha de pessoa, Eventos, ficha de evento e Financeiro permanecem disponíveis; o parâmetro tema abre a orientação correspondente quando autorizada.
