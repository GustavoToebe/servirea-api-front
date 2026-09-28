import { Injectable, inject } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AuthService } from '../../../core/auth/auth.service';
import { EscalaDetalhe, EscalaEvento, MESES } from '../models/escala.model';
import { FuncaoEscala } from '../../voluntarios/models/voluntario.model';

const BLUE = '#1e4fa3';
const RED = '#c62828';
const HEADER = '#b71c1c';

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
    document.body.appendChild(host);
    try {
      return await html2canvas(host, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });
    } finally {
      host.remove();
    }
  }

  private buildSheet(escala: EscalaDetalhe): HTMLElement {
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-12000px;top:0;width:1180px;background:#fff;padding:18px 18px 28px;font-family:Calibri,Arial,sans-serif;color:#111;';
    const month = MESES[escala.mes - 1].toUpperCase();
    // Nome da paróquia da sessão: o título era fixo ("PARÓQUIA SÃO JOSÉ
    // OPERÁRIO") e toda paróquia nova sairia com o nome da primeira.
    const paroquia = (this.auth.tenantNome() || 'Paróquia').toUpperCase();
    const title = `${paroquia} - ESCALA ${month}`;
    // Linha de referência (escala replicada) nunca sai no PDF/PNG.
    const blocks = escala.eventos.filter(event => !event.referencia).map(event => this.eventBlock(event)).join('');
    host.innerHTML = `
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
        <colgroup>
          <col style="width:15%">
          <col style="width:10%">
          <col style="width:14%">
          <col style="width:10%">
          <col style="width:14%">
          <col style="width:11%">
          <col style="width:13%">
          <col style="width:13%">
        </colgroup>
        <tr>
          <td colspan="8" style="background:${HEADER};color:#fff;font-weight:800;text-align:center;padding:14px 10px;font-size:24px;letter-spacing:.4px;">${this.esc(title)}</td>
        </tr>
        <tr>
          <td style="background:${HEADER};color:#fff;font-weight:800;padding:9px 10px;font-size:16px;">DIA / HORÁRIO</td>
          <td colspan="4" style="background:${HEADER};color:#fff;font-weight:800;text-align:center;padding:9px;font-size:16px;">ACÓLITOS</td>
          <td colspan="3" style="background:${HEADER};color:#fff;font-weight:800;text-align:center;padding:9px;font-size:16px;">OFERTÓRIO</td>
        </tr>
        ${blocks}
      </table>
    `;
    return host;
  }

  private eventBlock(event: EscalaEvento): string {
    const missal = this.person(event, 'MISSAL', 1);
    const cruz = this.person(event, 'CRUZ', 1);
    const vela1 = this.person(event, 'VELA', 1);
    const vela2 = this.person(event, 'VELA', 2);
    const sino1 = this.person(event, 'SINO', 1);
    const sino2 = this.person(event, 'SINO', 2);
    const credencia = this.people(event, 'CREDENCIA');
    const coleta = this.people(event, 'COLETA');
    const hasColeta = event.vagas.some(v => v.funcao === 'COLETA');
    const feast = event.celebracao && event.celebracao !== 'Missa'
      ? `<div style="margin-top:6px;font-size:14px;font-weight:800;color:${HEADER};">${this.esc(event.celebracao)}</div>`
      : '';
    return `
      <tr>
        <td rowspan="3" style="border:1px solid #cfcfcf;padding:12px 10px;vertical-align:middle;background:#fff7f7;">
          <div style="font-size:18px;font-weight:800;line-height:1.2;">${this.esc(this.dataCompleta(event.data))}</div>
          <div style="margin-top:4px;font-size:18px;font-weight:800;line-height:1.2;">${this.esc(this.dayLabel(event.data))}</div>
          <div style="margin-top:6px;font-size:16px;font-weight:700;">${this.esc(event.horario.slice(0, 5))}hs</div>
          ${feast}
        </td>
        ${this.fn('Missal', BLUE)}${this.nm(missal)}${this.fn('Cruz', BLUE)}${this.nm(cruz)}
        ${this.fn('Credência', BLUE)}${this.nm(credencia[0])}${this.nm(credencia[1])}
      </tr>
      <tr>
        ${this.fn('Vela', RED)}${this.nm(vela1)}${this.fn('Velas', RED)}${this.nm(vela2)}
        ${hasColeta ? this.fn('Coleta', RED) : this.empty()}${this.nm(coleta[0])}${this.nm(coleta[1])}
      </tr>
      <tr>
        ${this.fn('Sino', RED)}${this.nm(sino1)}${this.fn('Sino', RED)}${this.nm(sino2)}
        ${hasColeta ? this.fn('Coleta', RED) : this.empty()}${this.nm(coleta[2])}${this.nm(coleta[3])}
      </tr>
      <tr><td colspan="8" style="height:16px;border:none;background:#fff;"></td></tr>
    `;
  }

  private fn(label: string, color: string): string {
    return `<td style="border:1px solid #cfcfcf;padding:9px 10px;font-weight:800;color:${color};white-space:nowrap;font-size:17px;">${label}</td>`;
  }

  private nm(name: string): string {
    return `<td style="border:1px solid #cfcfcf;padding:9px 10px;font-size:17px;">${this.esc(name)}</td>`;
  }

  private empty(): string {
    return `<td style="border:1px solid #cfcfcf;padding:9px 10px;"></td>`;
  }

  private person(event: EscalaEvento, funcao: FuncaoEscala, posicao: number): string {
    return event.vagas.find(v => v.funcao === funcao && v.posicao === posicao)?.voluntario?.nome_completo || '';
  }

  private people(event: EscalaEvento, funcao: FuncaoEscala): string[] {
    return event.vagas
      .filter(v => v.funcao === funcao)
      .sort((a, b) => a.posicao - b.posicao)
      .map(v => v.voluntario?.nome_completo || '');
  }

  private dayLabel(iso: string): string {
    const d = new Date(`${iso}T12:00:00`);
    const day = String(d.getDate()).padStart(2, '0');
    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d);
    return `${day}/${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`;
  }

  /** "05/09/2026" em destaque acima de "05/Sábado" (teste de telas de 27/09/2026). */
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
