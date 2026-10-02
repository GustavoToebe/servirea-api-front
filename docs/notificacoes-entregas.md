# Centro de entregas — F05/F13

Página `/entregas` (menu "Centro de entregas", permissão NOTIFICACAO): gatilhos automáticos por origem e canal, desligados por padrão (NOTIFICACAO_CONFIGURAR, com confirmação ao ligar), e histórico paginado das notificações com a situação do envio (na fila, enviados, falhas) e quantas pessoas ficaram sem contato ou autorização. ENVIADO indica aceitação do provedor.

Na montagem de uma escala FINALIZADA aparecem "Avisar escalados por e-mail" e "Avisar por WhatsApp" (NOTIFICACAO_ENVIAR). No detalhe de um aviso publicado do mural aparecem "Notificar por e-mail/WhatsApp". Ambos pedem confirmação, mostram o total enfileirado e os ignorados, e não repetem a mesma versão no mesmo canal. Contrato e regras: `docs/notificacoes-entregas.md` do `servirea-api-back`. Sem IA.
