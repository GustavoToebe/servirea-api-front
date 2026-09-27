import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
}

export const ORDENAR_POR: { valor: OrdenarPor; rotulo: string }[] = [
  { valor: 'NOME', rotulo: 'Nome' },
  { valor: 'NUMERO', rotulo: 'Número' },
  { valor: 'IDADE', rotulo: 'Idade' },
  { valor: 'TIPO', rotulo: 'Tipo (coroinha, acólito...)' }
];

/** Linhas por folha A4 no PDF (cabeçalho + 25 linhas de assinatura cabem com folga). */
export const LINHAS_POR_FOLHA = 25;

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
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const folhas = Math.max(1, Math.ceil(linhas.length / LINHAS_POR_FOLHA));
    for (let f = 0; f < folhas; f++) {
      const canvas = await this.desenhar(linhas.slice(f * LINHAS_POR_FOLHA, (f + 1) * LINHAS_POR_FOLHA), opcoes,
        folhas > 1 ? `Folha ${f + 1} de ${folhas}` : '');
      if (f > 0) doc.addPage();
      const margem = 10;
      const largura = 210 - margem * 2;
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', margem, margem, largura, canvas.height * largura / canvas.width);
    }
    doc.save(this.nomeArquivo(opcoes.titulo, 'pdf'));
  }

  async gerarImagem(itens: ItemAssinatura[], opcoes: OpcoesListaAssinatura) {
    const canvas = await this.desenhar(ordenar(itens, opcoes.ordenarPor, opcoes.ordem), opcoes, '');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = this.nomeArquivo(opcoes.titulo, 'png');
    link.click();
  }

  private async desenhar(linhas: ItemAssinatura[], opcoes: OpcoesListaAssinatura, rodape: string): Promise<HTMLCanvasElement> {
    const folha = this.montarFolha(linhas, opcoes, rodape);
    document.body.appendChild(folha);
    try {
      return await html2canvas(folha, { scale: 2, backgroundColor: '#ffffff' });
    } finally {
      folha.remove();
    }
  }

  /** Visível para o teste: a folha em HTML antes de virar imagem. */
  montarFolha(linhas: ItemAssinatura[], opcoes: OpcoesListaAssinatura, rodape: string): HTMLElement {
    const folha = document.createElement('div');
    folha.style.cssText = 'position:fixed;left:-12000px;top:0;width:760px;background:#fff;padding:16px;'
      + 'font-family:Calibri,Arial,sans-serif;color:#111;';
    const borda = 'border:1px solid #222;';
    const corpo = linhas.map(l => `
      <tr>
        <td style="${borda}padding:8px 10px;font-size:15px;height:22px;">${this.esc(l.nome)}</td>
        <td style="${borda}"></td>
      </tr>`).join('');
    folha.innerHTML = `
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <colgroup><col style="width:48%"><col style="width:52%"></colgroup>
        <tr><td colspan="2" style="${borda}text-align:center;padding:14px 10px 26px;">
          <div style="font-size:24px;font-weight:800;">${this.esc(opcoes.titulo)}</div>
          ${opcoes.subtitulo ? `<div style="margin-top:4px;font-size:16px;font-weight:800;">${this.esc(opcoes.subtitulo)}</div>` : ''}
        </td></tr>
        <tr>
          <th style="${borda}padding:8px;font-size:18px;font-weight:600;">Nome</th>
          <th style="${borda}padding:8px;font-size:18px;font-weight:600;">Assinatura / Responsável</th>
        </tr>
        ${corpo}
      </table>
      ${rodape ? `<div style="margin-top:6px;text-align:right;font-size:12px;color:#555;">${this.esc(rodape)}</div>` : ''}
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
