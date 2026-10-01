# Consumo do plano

A seção Consumo do plano de Minha conta consulta GET /minha-conta/consumo na API local e funciona independentemente da consulta comercial à Central. Mostra pessoas, voluntários e vínculos ativos/convites, limite e alertas de atenção/atingido/excedido. Ausência de limite é apresentada como Sem limite configurado, nunca como cota zero.

Falha limpa dados antigos e apresenta erro; atualizar cancela a requisição anterior. Fotos/documentos/envios são explicitamente identificados como cotas ainda não aplicadas. Cadastro acima do limite retorna COTA_EXCEDIDA com mensagem da API; dados existentes não são apagados.

Contrato e trava: servirea-api-back/docs/cotas-plano.md no repositório irmão.
