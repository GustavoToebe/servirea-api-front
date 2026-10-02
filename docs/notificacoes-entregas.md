# Centro de entregas — F05/F13

Página `/entregas` (menu "Centro de entregas", permissão NOTIFICACAO): gatilhos automáticos por origem e canal, desligados por padrão (NOTIFICACAO_CONFIGURAR, com confirmação ao ligar), e histórico paginado das notificações com a situação do envio (na fila, enviados, falhas) e quantas pessoas ficaram sem contato ou autorização. ENVIADO indica aceitação do provedor.

Na montagem de uma escala FINALIZADA aparecem "Avisar escalados por e-mail" e "Avisar por WhatsApp" (NOTIFICACAO_ENVIAR). No detalhe de um aviso publicado do mural aparecem "Notificar por e-mail/WhatsApp". Ambos pedem confirmação, mostram o total enfileirado e os ignorados, e não repetem a mesma versão no mesmo canal. Contrato e regras: `docs/notificacoes-entregas.md` do `servirea-api-back`. Sem IA.

## Lembrete de escala (V081)
Origem `ESCALA_LEMBRETE`, gatilho por canal, desligado por padrão. Um job (`LembretesDeEscala`, de hora em hora das 8h às 20h de Brasília, `servire.notificacoes.lembretes-ativo`) avisa quem está escalado em celebrações de escala FINALIZADA que começam nas **próximas 24 horas**, exceto quem recusou a participação, só com contato e, no WhatsApp, autorização. Um aviso por celebração e canal (chave com versão 0); rodar de novo não repete. Linhas de referência, escalas em rascunho e celebrações passadas ficam de fora. A entrega aparece no centro de entregas com o nome e a data da celebração.
