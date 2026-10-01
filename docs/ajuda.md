# Ajuda estática do Servirea

Rota /ajuda dentro da sessão autenticada; item Ajuda no menu e links com tema em Pessoas, ficha de pessoa, Eventos, ficha de evento e Financeiro. Query tema abre o tópico correspondente quando permitido.

Orientações curtas versionadas em features/ajuda/ajuda.component.ts. Incluem acesso, vínculos, seleção por página, escala, evento, mensagens e financeiro simples. Busca local ignora acentos e maiúsculas; nenhum endpoint de dados pessoais é consultado. Tópicos e atalhos de módulos exigem as permissões correspondentes; acesso é orientação geral.

Conteúdo estático: sem chatbot, RAG ou outro recurso de IA. Atualizar os textos ao mudar os fluxos. Equipes específicas com VAGA sem ESCALA ainda não têm orientação própria. Ajuda contextual da Central continua pendente. Teste cobre filtro por permissão, busca sem acento e link ao módulo permitido; menu verificado pelos testes existentes.
