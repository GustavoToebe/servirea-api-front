export type FormatoExportacao = 'csv' | 'json' | 'xlsx' | 'pdf' | 'png';
export type CelulaExportacao = string | number | boolean | null;
export interface TabelaExportacao {
  nome: string;
  titulo: string;
  contexto?: string;
  colunas: string[];
  linhas: CelulaExportacao[][];
  /** Quando informado, o JSON mantém a estrutura e os tipos do relatório. */
  dadosJson?: unknown;
  limiteLinhas?: number;
}

export function lerCsv(conteudo: string): string[][] {
  const texto = conteudo.replace(/^\uFEFF/, '');
  const separador = texto.split(/\r?\n/, 1)[0].includes(';') ? ';' : ',';
  const linhas: string[][] = []; let linha: string[] = [], campo = '', aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === '"') {
      if (aspas && texto[i + 1] === '"') { campo += '"'; i++; } else aspas = !aspas;
    } else if (c === separador && !aspas) { linha.push(campo); campo = ''; }
    else if ((c === '\r' || c === '\n') && !aspas) {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (aspas) throw new Error('O arquivo CSV contém um campo incompleto.');
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

export function csvDaTabela(tabela: TabelaExportacao): string {
  const celula = (valor: CelulaExportacao) => {
    const texto = valor === null ? '' : typeof valor === 'number' ? String(valor).replace('.', ',') : String(valor);
    const seguro = typeof valor === 'string' && /^[=+@\-]/.test(texto.replace(/^[\s\uFEFF]+/, '')) ? `'${texto}` : texto;
    return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  return '\uFEFF' + [tabela.colunas, ...tabela.linhas].map(linha => linha.map(celula).join(';')).join('\r\n');
}

function baixar(nome: string, blob: Blob, ativo: () => boolean): void {
  if (!ativo()) return;
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a'); link.href = url; link.download = nome; link.click();
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export async function criarXlsx(tabela: TabelaExportacao): Promise<Blob> {
  const ExcelJS = await import('exceljs');
  const livro = new ExcelJS.Workbook();
  const aba = livro.addWorksheet('Dados', { views: [{ state: 'frozen', ySplit: 1 }] });
  aba.addRow(tabela.colunas);
  tabela.linhas.forEach(linha => aba.addRow(linha));
  aba.getRow(1).eachCell(celula => {
    celula.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
    celula.alignment = { vertical: 'middle', wrapText: true };
  });
  aba.getRow(1).height = 30;
  aba.columns.forEach((coluna, indice) => { coluna.width = Math.min(50, Math.max(18, tabela.colunas[indice].length + 3)); });
  aba.eachRow((linha, numero) => {
    if (numero === 1) return;
    linha.eachCell(celula => {
      celula.alignment = { vertical: 'top', wrapText: true };
      if (numero % 2 === 0) celula.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    });
  });
  aba.autoFilter = { from: 'A1', to: aba.getRow(1).getCell(tabela.colunas.length).address };
  const guia = livro.addWorksheet('Sobre');
  guia.addRows([['Relatório', tabela.titulo], ['Filtros', tabela.contexto ?? ''], ['Registros', tabela.linhas.length], ['Gerado em', new Date().toISOString()]]);
  guia.getColumn(1).width = 20; guia.getColumn(2).width = 80;
  guia.getColumn(2).alignment = { wrapText: true };
  return new Blob([await livro.xlsx.writeBuffer() as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

function quebrarTexto(texto: string, largura: number, contexto: CanvasRenderingContext2D): string[] {
  const linhas: string[] = [];
  for (const paragrafo of texto.split(/\r?\n/)) {
    let linha = '';
    for (const palavra of paragrafo.split(/\s+/)) {
      const candidato = linha ? linha + ' ' + palavra : palavra;
      if (contexto.measureText(candidato).width <= largura) { linha = candidato; continue; }
      if (linha) { linhas.push(linha); linha = ''; }
      for (const caractere of palavra) {
        if (linha && contexto.measureText(linha + caractere).width > largura) { linhas.push(linha); linha = ''; }
        linha += caractere;
      }
    }
    linhas.push(linha);
  }
  return linhas;
}

/** Páginas A4 deitadas, com texto completo; mantém só uma tela de desenho em memória por vez. */
function* paginasImagem(tabela: TabelaExportacao): Generator<HTMLCanvasElement> {
  const largura = 1600, altura = 1130, margem = 32, alturaTexto = 23;
  const larguraColuna = (largura - margem * 2) / tabela.colunas.length;
  let canvas!: HTMLCanvasElement, contexto!: CanvasRenderingContext2D, y = 0, pagina = 0;
  const novaPagina = () => {
    canvas = document.createElement('canvas'); canvas.width = largura; canvas.height = altura;
    const desenho = canvas.getContext('2d'); if (!desenho) throw new Error('Não foi possível desenhar a imagem.'); contexto = desenho;
    contexto.fillStyle = '#ffffff'; contexto.fillRect(0, 0, largura, altura);
    const marca = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#334155';
    contexto.fillStyle = marca; contexto.fillRect(0, 0, largura, 9);
    contexto.fillStyle = '#1e293b'; contexto.font = 'bold 29px Arial'; contexto.fillText(tabela.titulo, margem, 49);
    contexto.font = '17px Arial'; contexto.fillStyle = '#475569';
    const filtros = quebrarTexto(tabela.contexto ?? '', largura - margem * 2, contexto);
    filtros.forEach((texto, indice) => contexto.fillText(texto, margem, 80 + indice * alturaTexto));
    y = 96 + filtros.length * alturaTexto;
    contexto.font = 'bold 18px Arial';
    const cabecalhos = tabela.colunas.map(c => quebrarTexto(c, larguraColuna - 16, contexto));
    const alturaCabecalho = Math.max(...cabecalhos.map(c => c.length)) * alturaTexto + 20;
    contexto.fillStyle = '#e2e8f0'; contexto.fillRect(margem, y, largura - margem * 2, alturaCabecalho);
    contexto.fillStyle = '#1e293b';
    cabecalhos.forEach((coluna, i) => coluna.forEach((texto, j) => contexto.fillText(texto, margem + i * larguraColuna + 8, y + 26 + j * alturaTexto)));
    y += alturaCabecalho; ++pagina;
    contexto.font = '16px Arial'; contexto.fillStyle = '#64748b';
    contexto.fillText(`Página ${pagina} · ${tabela.linhas.length} registro(s) · ${new Date().toLocaleDateString('pt-BR')}`, margem, altura - 20);
  };
  novaPagina();
  if (!tabela.linhas.length) { contexto.fillText('Nenhum registro encontrado para os filtros aplicados.', margem, y + 35); yield canvas; return; }
  for (let indice = 0; indice < tabela.linhas.length; indice++) {
    contexto.font = '18px Arial';
    const colunas = tabela.colunas.map((_, i) => quebrarTexto(typeof tabela.linhas[indice][i] === 'number' ? tabela.linhas[indice][i]!.toLocaleString('pt-BR') : String(tabela.linhas[indice][i] ?? ''), larguraColuna - 16, contexto));
    const quantidade = Math.max(1, ...colunas.map(c => c.length));
    let linhaTexto = 0;
    while (linhaTexto < quantidade) {
      let cabem = Math.floor((altura - 55 - y - 16) / alturaTexto);
      if (cabem < 1) { yield canvas; novaPagina(); cabem = Math.floor((altura - 55 - y - 16) / alturaTexto); }
      const usar = Math.min(cabem, quantidade - linhaTexto), alturaLinha = usar * alturaTexto + 16;
      contexto.fillStyle = indice % 2 ? '#f1f5f9' : '#ffffff'; contexto.fillRect(margem, y, largura - margem * 2, alturaLinha);
      contexto.strokeStyle = '#cbd5e1'; contexto.strokeRect(margem, y, largura - margem * 2, alturaLinha);
      contexto.font = '18px Arial'; contexto.fillStyle = '#1e293b';
      colunas.forEach((coluna, i) => coluna.slice(linhaTexto, linhaTexto + usar).forEach((texto, j) => contexto.fillText(texto, margem + i * larguraColuna + 8, y + 25 + j * alturaTexto)));
      linhaTexto += usar; y += alturaLinha;
      if (linhaTexto < quantidade) { yield canvas; novaPagina(); }
    }
  }
  yield canvas;
}

const imagemBlob = (canvas: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem.')), 'image/png'));
const respirar = () => new Promise<void>(resolve => setTimeout(resolve, 0));

/** A coleta e a autorização pertencem à tela/API; esta função exporta somente as colunas recebidas. */
export async function exportarTabela(tabela: TabelaExportacao, formato: FormatoExportacao, ativo: () => boolean = () => true): Promise<void> {
  const limite = tabela.limiteLinhas ?? 5000;
  if ((tabela.contexto?.length ?? 0) > 1400) throw new Error('Resuma os filtros antes de exportar.');
  if (!tabela.colunas.length || tabela.linhas.length > limite) throw new Error(`Reduza os filtros para exportar até ${limite} linhas.`);
  if (!ativo()) return;
  if (formato === 'csv') { baixar(`${tabela.nome}.csv`, new Blob([csvDaTabela(tabela)], { type: 'text/csv;charset=utf-8' }), ativo); return; }
  if (formato === 'json') {
    const dados = tabela.dadosJson ?? tabela.linhas.map(l => Object.fromEntries(tabela.colunas.map((chave, i) => [chave, l[i] ?? null])));
    baixar(`${tabela.nome}.json`, new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json;charset=utf-8' }), ativo); return;
  }
  if (formato === 'xlsx') { baixar(`${tabela.nome}.xlsx`, await criarXlsx(tabela), ativo); return; }
  if (formato === 'pdf') {
    const { jsPDF } = await import('jspdf'); const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
    let pagina = 0;
    for (const canvas of paginasImagem(tabela)) {
      if (!ativo()) return;
      if (pagina++) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
      await respirar();
    }
    if (ativo()) pdf.save(`${tabela.nome}.pdf`); return;
  }
  const paginas = paginasImagem(tabela), primeira = paginas.next().value as HTMLCanvasElement;
  const segunda = paginas.next();
  if (segunda.done) { baixar(`${tabela.nome}.png`, await imagemBlob(primeira), ativo); return; }
  const { default: JSZip } = await import('jszip'); const zip = new JSZip();
  zip.file('pagina-001.png', await imagemBlob(primeira));
  zip.file('pagina-002.png', await imagemBlob(segunda.value));
  let numero = 2;
  for (const canvas of paginas) {
    if (!ativo()) return;
    zip.file(`pagina-${String(++numero).padStart(3, '0')}.png`, await imagemBlob(canvas)); await respirar();
  }
  baixar(`${tabela.nome}-imagens.zip`, await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), ativo);
}
