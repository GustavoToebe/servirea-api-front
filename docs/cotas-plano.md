# Consumo e importação CSV

Minha conta mostra cadastros, fotos/anexos e itens mensais com competência AAAA-MM (Brasília). emails_mes/whatsapp_mes são primeiras tentativas de mensagens da fila, incluindo eventos; falhas consomem a unidade, reenvio da mesma mensagem não duplica. Ao atingir o limite, novos envios aguardam disponibilidade e reavaliam em cinco minutos. E-mails de acesso/recuperação e teste técnico do WhatsApp ficam fora. Armazenamento em bytes convertido em MB; desconhecido não vira zero. Conferência exige PAROQUIA_ALTERAR.

Pessoas → Importar pessoas, com PESSOA/PESSOA_CRIAR. CSV UTF-8 ou XLSX até 512 KiB/100 pessoas, abas e mapeamento de até 30 colunas. Modelo CSV disponível na tela. Nome e papel obrigatórios; CPF/e-mail/telefone opcionais. Prévia mostra os dados normalizados e erros/duplicidades; trocar arquivo/aba/mapeamento apaga prévia e renova chave. Guard alerta ao sair com arquivo pendente. Angular escapa os dados, sem renderizar HTML. [Contrato e limites](importacao-pessoas.md).

Confirmar reenvia o mesmo arquivo/aba/mapeamento com chave UUID/hash, mantidos após erro para repetição segura. Server relê/valida; lote atômico sem sobrescrever cadastros, perfil voluntário sem consentimento WhatsApp inventado. Um lote confirmado gasta uma unidade importacoes_mes; prévia/repetição não gastam. Após sucesso, limpa arquivo/prévia da memória e invalida caches de pessoas/voluntários. Sem guardar CSV/XLSX no Storage. A confirmação pode falhar se dados/cotas mudarem desde a prévia.

Contrato local: POST /pessoas/importacoes/previa multipart arquivo → hash/quantidade/podeConfirmar/linhas; /confirmar multipart arquivo e params chave/hash → id/quantidade/repetida. API autenticada; não anexar Bearer para destino externo. Uso mensal competencia é campo opcional no DTO para compatibilidade. Não inferir armazenamento físico do consumo de arquivos vinculados.

Pendentes: documentos gerais, vínculos/mesclagem/lotes maiores, funcionalidades comerciais e consumo agregado da Central. Backend: docs/cotas-envios-importacao.md.
