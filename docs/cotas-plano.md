# Consumo e importação CSV

Minha conta mostra cadastros, fotos/anexos e itens mensais com competência AAAA-MM (Brasília). emails_mes/whatsapp_mes são primeiras tentativas de mensagens da fila, incluindo eventos; falhas consomem a unidade, reenvio da mesma mensagem não duplica. Ao atingir o limite, novos envios aguardam disponibilidade e reavaliam em cinco minutos. E-mails de acesso/recuperação e teste técnico do WhatsApp ficam fora. Armazenamento em bytes convertido em MB; desconhecido não vira zero. Conferência exige PAROQUIA_ALTERAR.

Pessoas → Importar CSV, com PESSOA e PESSOA_CRIAR. UTF-8 até 512 KiB/100 pessoas, cabeçalho nome;papel;cpf;email;telefone. RESPONSAVEL/COROINHA/ACOLITO/AMBOS/MESC. Campos de contato/documento opcionais; não suporta células com múltiplas linhas. Prévia exibe erros/duplicidades antes de confirmar; arquivo novo apaga prévia/chave anterior. Guard alerta ao sair com arquivo pendente. Angular escapa nomes/erros; não renderizar HTML do CSV.

Confirmar reenvia o mesmo arquivo com chave UUID/hash, mantidos após erro para repetição segura. Server relê/valida; lote atômico sem sobrescrever cadastros, perfil voluntário sem consentimento WhatsApp inventado. Um lote confirmado gasta uma unidade importacoes_mes; prévia/repetição não gastam. Após sucesso, limpa arquivo/prévia da memória e invalida caches de pessoas/voluntários. Sem guardar CSV no Storage. A confirmação pode falhar se dados/cotas mudarem desde a prévia.

Contrato local: POST /pessoas/importacoes/previa multipart arquivo → hash/quantidade/podeConfirmar/linhas; /confirmar multipart arquivo e params chave/hash → id/quantidade/repetida. API autenticada; não anexar Bearer para destino externo. Uso mensal competencia é campo opcional no DTO para compatibilidade. Não inferir armazenamento físico do consumo de arquivos vinculados.

Pendentes: XLSX, documentos gerais, vínculos/mapeamento livre/lotes maiores, funcionalidades comerciais e consumo agregado da Central. Backend: docs/cotas-envios-importacao.md.
