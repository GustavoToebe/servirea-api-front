import { Injectable, inject } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AuthService } from '../../../core/auth/auth.service';
import { ColunaEscala, EscalaDetalhe, EscalaEvento, MESES } from '../models/escala.model';
import { FuncaoEscala } from '../../voluntarios/models/voluntario.model';

const BLUE = '#1e4fa3';
const RED = '#c62828';
const HEADER = '#b71c1c';
const SEMANAL_VERMELHO = '#c00000';
const SEMANAL_AZUL = '#0070c0';
const AGNOMES = new Set(['neto', 'filho', 'junior', 'júnior', 'sobrinho']);

/**
 * Primeiro nome e último sobrenome, como na planilha da paróquia ("Valentina Linzmeyer Zonitta Silvati" →
 * "Valentina Silvati"). Neto, Filho e Júnior levam o sobrenome de antes ("João Oliveira Neto").
 */
export function nomeCurto(completo: string): string {
  const partes = (completo || '').trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 2) return partes.join(' ');
  const ultimo = partes[partes.length - 1];
  if (AGNOMES.has(ultimo.toLowerCase())) return `${partes[0]} ${partes[partes.length - 2]} ${ultimo}`;
  return `${partes[0]} ${ultimo}`;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private auth = inject(AuthService);

  async exportPdf(escala: EscalaDetalhe) {
    const canvas = await this.renderCanvas(escala);
    const img = canvas.toDataURL('image/png');
    const mmW = 297;
    const mmH = Math.max(210, canvas.height * mmW / canvas.width + 12);
    const doc = new jsPDF({ unit: 'mm', format: [mmW, mmH] });
    const margin = 6;
    const imgW = mmW - margin * 2;
    const imgH = canvas.height * imgW / canvas.width;
    doc.addImage(img, 'PNG', margin, margin, imgW, imgH);
    doc.save(this.fileName(escala, 'pdf'));
  }

  async exportPng(escala: EscalaDetalhe) {
    const canvas = await this.renderCanvas(escala);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = this.fileName(escala, 'png');
    link.click();
  }

  private async renderCanvas(escala: EscalaDetalhe): Promise<HTMLCanvasElement> {
    const host = this.buildSheet(escala);
    // O preflight do Tailwind põe `img { display: block }`, e o html2canvas mede a linha de base do texto com uma
    // imagem em linha: com a regra, todo texto saía mais baixo e o cabeçalho ficava cortado (PDF de 29/09/2026).
    const baseDoTexto = document.createElement('style');
    baseDoTexto.textContent = 'img { display: inline !important; vertical-align: baseline !important; }';
    document.head.appendChild(baseDoTexto);
    document.body.appendChild(host);
    try {
      return await html2canvas(host, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
    } finally {
      host.remove();
      baseDoTexto.remove();
    }
  }


  private buildSheet(escala: EscalaDetalhe): HTMLElement {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:1500px;background:#fff;padding:18px;font-family:Calibri,Arial,sans-serif;color:#000;';
    const month = MESES[escala.mes - 1].toUpperCase();
    const paroquia = (this.auth.tenantNome() || 'Paróquia').toUpperCase();
    const title = `${paroquia} - ESCALA ${month}`;
    const colunas = this.colunasDa(escala);
    
    let blocks = '';
    let semanaAnterior = '';
    
    for (const event of escala.eventos.filter(e => !e.referencia)) {
      if (escala.tipo === 'SEMANAL') {
        const semana = this.segundaDaSemana(event.data);
        if (semanaAnterior && semana !== semanaAnterior) blocks += this.linhaSemanalEspaco(colunas.length);
        semanaAnterior = semana;
      }
      blocks += this.eventBlock(event, colunas);
    }
    
    const cab = `background:${SEMANAL_VERMELHO};color:#fff;font-weight:700;font-size:21px;border:1px solid #000;padding:0;`;
    const txt = (t: string, alinhar = 'center') => `<div style="padding:4px 6px;line-height:28px;text-align:${alinhar};">${t}</div>`;
    
    const colHeaders = colunas.map(c => `<th style="${cab}">${txt(this.esc(c.rotulo))}</th>`).join('');
    
    host.innerHTML = `
      <div style="margin:0 0 10px;font-size:22px;font-weight:800;text-align:center;">${this.esc(title)}</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <tr>
          <td style="${cab}">${txt(`ESCALA ${escala.tipo}`)}</td>
          <td style="${cab}" colspan="${colunas.length}">${txt(this.esc(month))} ${escala.ano}</td>
        </tr>
        <tr>
          <th style="${cab}">${txt('Dia/Horário')}</th>
          ${colHeaders}
        </tr>
        ${blocks}
      </table>
    `;
    return host;
  }

  /** Sem o layout copiado na escala, as colunas saem das vagas. Senão o PNG fica só com a data. */
  private colunasDa(escala: EscalaDetalhe): ColunaEscala[] {
    if (escala.colunas?.length) return escala.colunas;
    const vistas = new Map<string, ColunaEscala>();
    for (const evento of escala.eventos) {
      for (const vaga of evento.vagas) {
        const chave = `${vaga.funcao}:${vaga.posicao}`;
        if (!vistas.has(chave)) vistas.set(chave, { funcao: vaga.funcao, posicao: vaga.posicao, rotulo: vaga.funcao });
      }
    }
    return [...vistas.values()];
  }

  private linhaSemanalEspaco(numCols: number): string {
    const celula = `border:1px solid #000;padding:0;height:10px;line-height:0;font-size:0;background:${SEMANAL_AZUL};`;
    return `<tr><td style="${celula}"></td>${Array(numCols).fill(`<td style="${celula}"></td>`).join('')}</tr>`;
  }

  private eventBlock(event: EscalaEvento, colunas: { funcao: string, posicao: number }[]): string {
    const celula = 'border:1px solid #000;padding:3px 6px;font-size:21px;font-weight:700;height:30px;';
    const nomes = colunas.map(c => {
      const nome = event.vagas.find(v => v.funcao === c.funcao && v.posicao === c.posicao)?.voluntario?.nome_completo || '';
      return nomeCurto(nome);
    });
    
    const feast = event.celebracao && event.celebracao !== 'Missa'
      ? `<div style="margin-top:4px;font-size:14px;font-weight:800;color:${HEADER};">${this.esc(event.celebracao)}</div>`
      : '';
      
    const dia = `
        <td style="border:1px solid #000;padding:8px 10px;vertical-align:middle;background:#fff7f7;color:${SEMANAL_AZUL};">
          <div style="font-size:20px;font-weight:800;line-height:1.2;">${this.esc(this.dataCompleta(event.data))}</div>
          <div style="margin-top:2px;font-size:20px;font-weight:800;line-height:1.2;">${this.esc(this.dayLabel(event.data))}</div>
          <div style="margin-top:4px;font-size:17px;font-weight:700;">${this.esc(event.horario.slice(0, 5))}hs</div>
          ${feast}
        </td>`;
        
    return `
      <tr>
        ${dia}
        ${nomes.map((n, i) => `<td style="${celula}text-align:center;">${this.esc(n)}</td>`).join('')}
      </tr>
    `;
  }




  private segundaDaSemana(iso: string): string {
    const d = new Date(`${iso}T12:00:00`);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private dayLabel(iso: string): string {
    const d = new Date(`${iso}T12:00:00`);
    const day = String(d.getDate()).padStart(2, '0');
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d);
    return `${day}/${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
  }

  private dataCompleta(iso: string): string {
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private fileName(e: EscalaDetalhe, ext: string) {
    return `escala-${e.tipo.toLowerCase()}-${e.ano}-${String(e.mes).padStart(2, '0')}.${ext}`;
  }

  private esc(v: string) {
    return (v || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));
  }
}
