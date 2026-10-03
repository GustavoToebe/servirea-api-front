# Conferência do contrato da API — T17

`scripts/verificar-contrato-api.py` compara as chamadas HTTP do front com `servirea-api-back/docs/contrato-api.json` (ou o arquivo indicado em `CONTRATO_API`). Rode depois de mexer em serviços de API e depois de atualizar o contrato do back. Detalhes e limites: `docs/contrato-api.md` do back.

## Tipos gerados

`scripts/gerar-tipos-api.py` escreve `src/app/core/api/contrato-api.gerado.ts` (interfaces dos DTOs, enums e o mapa `ContratoRotas` por `"VERBO /caminho"`). Não edite o arquivo: mude o DTO no back, regenere o contrato lá e rode o script aqui; `--verificar` falha se o arquivo estiver desatualizado. Nomes de DTO aninhado levam a classe-mãe (`DistribuicaoDtos_Conflito`).

`src/app/core/api/contrato-api.ts` traz `SemCamposInventados`, `EnviavelComo` e `Exigir`: um tipo escrito à mão que ganhe um campo que o back não tem, ou um corpo incompatível, deixa de compilar nos testes. A distribuição já usa isso (`distribuicao-contrato.spec.ts`); migrar os demais serviços é incremental, um por vez, sem trocar o serviço de lugar. Campos anuláveis do back saem como `campo?: X | null`, então o tipo gerado é mais frouxo que o manual de propósito: a checagem pega campo renomeado ou removido, não nulidade.
