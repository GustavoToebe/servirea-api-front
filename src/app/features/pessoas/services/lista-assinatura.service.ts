import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Orientacao } from '../../../shared/export/orientacao';

/** Uma linha da lista: só o necessário para ordenar e imprimir o nome. */
export interface ItemAssinatura {
  nome: string;
  numero?: number | null;
  nascimento?: string | null;
  tipo?: string | null;
}

export type OrdenarPor = 'NOME' | 'NUMERO' | 'IDADE' | 'TIPO';
export type Ordem = 'ASC' | 'DESC';

export interface OpcoesListaAssinatura {
  titulo: string;
  subtitulo: string;
  ordenarPor: OrdenarPor;
  ordem: Ordem;
  /** Sem valor, retrato (como sempre foi). */
  orientacao?: Orientacao;
}

export const ORDENAR_POR: { valor: OrdenarPor; rotulo: string }[] = [
  { valor: 'NOME', rotulo: 'Nome' },
  { valor: 'NUMERO', rotulo: 'Número' },
  { valor: 'IDADE', rotulo: 'Idade' },
  { valor: 'TIPO', rotulo: 'Tipo (coroinha, acólito...)' }
];

/** Linhas por folha A4 no PDF (cabeçalho + 22 linhas altas, com espaço para assinar). */
export const LINHAS_POR_FOLHA = 22;
/** Em paisagem a folha A4 é mais baixa: menos linhas por página. */
export const LINHAS_POR_FOLHA_PAISAGEM = 11;

/**
 * Ordena a lista. Sem o dado (número, nascimento, tipo), a pessoa vai para o fim nos dois sentidos, e o
 * desempate é sempre o nome. Idade crescente = mais novo primeiro.
 */
export function ordenar(itens: ItemAssinatura[], por: OrdenarPor, ordem: Ordem): ItemAssinatura[] {
  const sentido = ordem === 'ASC' ? 1 : -1;
  const porNome = (a: ItemAssinatura, b: ItemAssinatura) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
  const chave = (i: ItemAssinatura): string | number | null => {
    switch (por) {
      case 'NUMERO': return i.numero ?? null;
      // Nascimento mais recente = mais novo: inverte para "idade crescente" começar pelo mais novo.
      case 'IDADE': return i.nascimento ? -Date.parse(`${i.nascimento}T00:00:00Z`) : null;
      case 'TIPO': return i.tipo || null;
      default: return null;
    }
  };
  return [...itens].sort((a, b) => {
    if (por === 'NOME') return sentido * porNome(a, b);
    const [ka, kb] = [chave(a), chave(b)];
    if (ka === null && kb === null) return porNome(a, b);
    if (ka === null) return 1;
    if (kb === null) return -1;
    const comparacao = typeof ka === 'number' && typeof kb === 'number'
      ? ka - kb
      : String(ka).localeCompare(String(kb), 'pt-BR', { sensitivity: 'base' });
    return comparacao !== 0 ? sentido * comparacao : porNome(a, b);
  });
}

/**
 * Lista de assinatura (27/09/2026): título, subtítulo e a tabela "Nome | Assinatura / Responsável",
 * como a folha que a paróquia fazia no Word. PDF em A4 (várias folhas) ou imagem PNG (uma só).
 */
@Injectable({ providedIn: 'root' })
export class ListaAssinaturaService {

  async gerarPdf(itens: ItemAssinatura[], opcoes: OpcoesListaAssinatura) {
    const linhas = ordenar(itens, opcoes.ordenarPor, opcoes.ordem);
    const paisagem = opcoes.orientacao === 'PAISAGEM';
    const porFolha = paisagem ? LINHAS_POR_FOLHA_PAISAGEM : LINHAS_POR_FOLHA;
    const [larguraPagina, alturaPagina] = paisagem ? [297, 210] : [210, 297];
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: paisagem ? 'landscape' : 'portrait' });
    const folhas = Math.max(1, Math.ceil(linhas.length / porFolha));
    const margem = 10;
    for (let f = 0; f < folhas; f++) {
      const canvas = await this.desenhar(linhas.slice(f * porFolha, (f + 1) * porFolha), opcoes,
        folhas > 1 ? `Folha ${f + 1} de ${folhas}` : '', f * porFolha);
      if (f > 0) doc.addPage();
      // Cabe na página inteira: se a imagem ficar mais alta que a folha, encolhe em vez de cortar.
      let largura = larguraPagina - margem * 2;
      let altura = canvas.height * largura / canvas.width;
      const alturaMaxima = alturaPagina - margem * 2;
      if (altura > alturaMaxima) {
        altura = alturaMaxima;
        largura = canvas.width * altura / canvas.height;
      }
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', (larguraPagina - largura) / 2, margem, largura, altura);
    }
    doc.save(this.nomeArquivo(opcoes.titulo, 'pdf'));
  }

  async gerarImagem(itens: ItemAssinatura[], opcoes: OpcoesListaAssinatura) {
    const canvas = await this.desenhar(ordenar(itens, opcoes.ordenarPor, opcoes.ordem), opcoes, '', 0);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = this.nomeArquivo(opcoes.titulo, 'png');
    link.click();
  }

  private async desenhar(linhas: ItemAssinatura[], opcoes: OpcoesListaAssinatura, rodape: string,
                         inicio: number): Promise<HTMLCanvasElement> {
    const folha = this.montarFolha(linhas, opcoes, rodape, inicio);
    // Mesmo ajuste do ExportService: o preflight do Tailwind põe `img { display: block }` e o html2canvas mede a
    // linha de base do texto com uma imagem em linha, então todo texto saía mais baixo.
    const baseDoTexto = document.createElement('style');
    baseDoTexto.textContent = 'img { display: inline !important; vertical-align: baseline !important; }';
    document.head.appendChild(baseDoTexto);
    document.body.appendChild(folha);
    try {
      return await html2canvas(folha, { scale: 2, backgroundColor: '#ffffff' });
    } finally {
      folha.remove();
      baseDoTexto.remove();
    }
  }

  /**
   * Visível para o teste: a folha em HTML antes de virar imagem. `inicio` continua a numeração na folha
   * seguinte. Altura e `vertical-align` fixos: sem eles o html2canvas desenhava o nome encostado embaixo.
   */
  montarFolha(linhas: ItemAssinatura[], opcoes: OpcoesListaAssinatura, rodape: string, inicio = 0): HTMLElement {
    const folha = document.createElement('div');
    const largura = opcoes.orientacao === 'PAISAGEM' ? 1100 : 760;
    folha.style.cssText = `position:fixed;left:-12000px;top:0;width:${largura}px;background:#ffffff;padding:20px 24px;`
      + "font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;color:#0f172a;";
    const borda = 'border-bottom:1px solid #e2e8f0;';
    const celula = 'height:42px;padding:0 14px;vertical-align:middle;line-height:1.25;';
    const corpo = linhas.map((l, i) => {
      const bg = i % 2 === 0 ? '#ffffff' : '#fcfcfd';
      return `
      <tr style="background:${bg};">
        <td style="${borda}border-right:1px solid #e2e8f0;${celula}font-size:16px;font-weight:700;color:#0f172a;">${inicio + i + 1}. ${this.esc(l.nome)}</td>
        <td style="${borda}${celula}"><div style="border-bottom:1px dashed #cbd5e1;margin-top:18px;width:100%;"></div></td>
      </tr>`;
    }).join('');

    folha.innerHTML = `
      <div style="text-align:center;padding:16px 20px;margin-bottom:14px;background:linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%);border-radius:12px;color:#ffffff;box-shadow:0 3px 10px rgba(30,27,75,0.12);">
        <div style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#c7d2fe;margin-bottom:4px;">
          <span>SERVIREA • GESTÃO PAROQUIAL</span>
        </div>
        <div style="font-size:24px;font-weight:900;letter-spacing:-0.01em;text-transform:uppercase;color:#ffffff;line-height:1.2;">
          ${this.esc(opcoes.titulo)}
        </div>
        ${opcoes.subtitulo ? `
          <div style="display:inline-block;margin-top:6px;padding:3px 14px;border-radius:9999px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);font-size:12px;font-weight:700;color:#f8fafc;letter-spacing:0.04em;text-transform:uppercase;">
            ${this.esc(opcoes.subtitulo)}
          </div>` : ''}
      </div>

      <table style="width:100%;border-collapse:collapse;table-layout:fixed;border:2px solid #1e1b4b;border-radius:10px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.03);">
        <colgroup><col style="width:48%"><col style="width:52%"></colgroup>
        <thead>
          <tr style="background:#1e1b4b;color:#ffffff;">
            <th style="padding:10px 14px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;vertical-align:middle;text-align:left;border-right:1px solid #312e81;">Nome</th>
            <th style="padding:10px 14px;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;vertical-align:middle;text-align:left;">Assinatura / Responsável</th>
          </tr>
        </thead>
        <tbody>
          ${corpo}
        </tbody>
      </table>

      <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#64748b;padding:0 4px;">
        <span style="font-weight:600;">Pastoral de Coroinhas e Acólitos • Servirea</span>
        ${rodape ? `<span style="font-weight:700;color:#475569;">${this.esc(rodape)}</span>` : ''}
      </div>
    `;
    return folha;
  }

  private nomeArquivo(titulo: string, extensao: string): string {
    const base = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lista-de-assinatura';
    return `${base}.${extensao}`;
  }

  private esc(v: string) {
    return (v || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
  }
}
