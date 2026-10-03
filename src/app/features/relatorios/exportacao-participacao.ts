import { exportarTabela, FormatoExportacao, lerCsv } from '../../shared/utils/exportacao-tabela';
export { lerCsv } from '../../shared/utils/exportacao-tabela';
export type FormatoParticipacao = FormatoExportacao;

/** A entrada é o CSV autorizado pelo servidor; não usa só a página visível. */
export async function exportarParticipacao(blob: Blob, formato: FormatoParticipacao, contexto = '', ativo: () => boolean = () => true): Promise<void> {
  const [colunas, ...linhas] = lerCsv(await blob.text());
  if (!colunas?.length) throw new Error('O arquivo retornado está vazio.');
  await exportarTabela({ nome: 'participacao', titulo: 'Servirea · Participação', contexto, colunas, linhas }, formato, ativo);
}
