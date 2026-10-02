# Distribuição por regras — F04

Tela `/escalas/:id/distribuicao`, aberta pelo botão "Distribuir por regras" na montagem de uma escala em rascunho. Exige `VAGA_DISTRIBUIR` para ver o formulário e `VAGA_ALOCAR` para aplicar. Contrato e regras do motor: `docs/distribuicao-escala.md` do `servirea-api-back`.

A coordenação informa máximo de participações, intervalo em dias e se só conta quem respondeu a disponibilidade do mês, gera a prévia e vê cada sugestão com a explicação e os conflitos com os motivos de descarte. Todas as sugestões vêm marcadas; desmarcar tira a vaga do pedido. A aplicação reenvia exatamente as regras e a versão da prévia, pede confirmação e volta à montagem. Prévia bloqueada (alocação existente em conflito) não aplica. Erro 409 descarta a prévia e pede nova geração. Nada é gravado antes da aplicação e não há IA.
