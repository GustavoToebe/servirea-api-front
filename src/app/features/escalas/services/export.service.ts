import { Injectable, inject } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AuthService } from '../../../core/auth/auth.service';
import { ColunaEscala, EscalaDetalhe, EscalaEvento, MESES, resolverTags, textosDoLayout, vagasDoLayout } from '../models/escala.model';
import { FuncaoEscala } from '../../voluntarios/models/voluntario.model';

const BLUE = '#1e1b4b';
const RED = '#c62828';
const HEADER = '#b71c1c';
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
    // Sem a orientação explícita, o jsPDF vira a página quando a altura é menor que a largura (escala curta) e
    // a imagem, de 285 mm, sai cortada numa página de 210 mm.
    const doc = new jsPDF({ unit: 'mm', format: [mmW, mmH], orientation: mmW > mmH ? 'landscape' : 'portrait' });
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
    host.style.cssText = "position:fixed;left:-12000px;top:0;width:1500px;background:#ffffff;padding:24px 28px;font-family:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;color:#0f172a;";
    const month = MESES[escala.mes - 1].toUpperCase();
    const paroquia = (this.auth.tenantNome() || 'Paróquia').toUpperCase();
    const ctx = { titulo: escala.titulo, mesAno: `${MESES[escala.mes - 1]} ${escala.ano}`, paroquia };
    const cabecalho = this.cabecalhoDoLayout(escala, ctx);
    const textosCel = textosDoLayout(escala.colunas, 'CELEBRACAO').filter(t => t.tipo === 'TEXTO_LIVRE');
    const colunas = this.colunasDa(escala);
    
    let blocks = '';
    let semanaAnterior = '';
    
    for (const event of escala.eventos.filter(e => !e.referencia)) {
      if (escala.tipo === 'SEMANAL') {
        const semana = this.segundaDaSemana(event.data);
        if (semanaAnterior && semana !== semanaAnterior) blocks += this.linhaSemanalEspaco(colunas.length);
        semanaAnterior = semana;
      }
      blocks += this.eventBlock(event, colunas as any, textosCel, ctx);
    }
    
    const cabTop = 'background:#1e1b4b;color:#ffffff;font-weight:900;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;border:1px solid #312e81;padding:0;';
    const cabCol = 'background:#312e81;color:#ffffff;font-weight:800;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;border:1px solid #4338ca;padding:0;';
    const txt = (t: string, alinhar = 'center', py = '8px') => `<div style="padding:${py} 8px;line-height:22px;text-align:${alinhar};">${t}</div>`;
    
    const colHeaders = colunas.map(c => `<th style="${cabCol}">${txt(this.esc(c.rotulo || ''))}</th>`).join('');
    
    host.innerHTML = `
      <div style="margin:0 0 14px;">${cabecalho}</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;border:2px solid #1e1b4b;border-radius:10px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
        <thead>
          <tr>
            <td style="${cabTop}width:190px;">${txt(`ESCALA ${escala.tipo}`, 'center', '10px')}</td>
            <td style="${cabTop}" colspan="${colunas.length}">${txt(`${this.esc(month)} ${escala.ano}`, 'center', '10px')}</td>
          </tr>
          <tr>
            <th style="${cabCol}width:190px;">${txt('Dia/Horário', 'center', '9px')}</th>
            ${colHeaders}
          </tr>
        </thead>
        <tbody>
          ${blocks}
        </tbody>
      </table>
      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;padding:10px 4px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;">
        <div style="font-weight:700;display:flex;align-items:center;gap:6px;">
          <span>${this.esc(paroquia)} • Pastoral de Coroinhas e Acólitos</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;color:#475569;">Chegar com 15 minutos de antecedência</span>
          <span style="font-weight:600;color:#94a3b8;">Servirea — Gestão Paroquial</span>
        </div>
      </div>
    `;
    return host;
  }

  /** Cabeçalho pelos blocos de texto do layout (Título, Subtítulo, Texto Livre). Sem blocos, usa o título padrão. */
  private cabecalhoDoLayout(escala: EscalaDetalhe, ctx: { titulo: string; mesAno: string; paroquia: string }): string {
    const textos = textosDoLayout(escala.colunas, 'DOCUMENTO').filter(t => t.tipo !== 'DATA');
    if (!textos.length) {
      return `
        <div style="text-align:center;padding:18px 24px;margin-bottom:14px;background:linear-gradient(135deg, #1e1b4b 0%, #2e1065 50%, #1e1b4b 100%);border-radius:14px;color:#ffffff;box-shadow:0 4px 14px rgba(30,27,75,0.15);">
          <div style="display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#c7d2fe;margin-bottom:6px;">
            <span>${this.esc(ctx.paroquia)}</span>
          </div>
          <div style="font-size:26px;font-weight:900;letter-spacing:-0.01em;text-transform:uppercase;color:#ffffff;line-height:1.2;">
            ${this.esc(ctx.paroquia)} - ESCALA ${MESES[escala.mes - 1].toUpperCase()} ${escala.ano}
          </div>
          <div style="display:inline-block;margin-top:10px;padding:4px 18px;border-radius:9999px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.25);font-size:12px;font-weight:700;color:#f8fafc;letter-spacing:0.06em;text-transform:uppercase;">
            Pastoral de Coroinhas e Acólitos • ${escala.tipo === 'SEMANAL' ? 'Missas Semanais (Dias Úteis)' : 'Missas Dominicais (Fins de Semana)'}
          </div>
        </div>
      `;
    }
    return `
      <div style="text-align:center;padding:16px 20px;margin-bottom:14px;background:#ffffff;border:2px solid #e0e7ff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
        <div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#6366f1;margin-bottom:6px;">
          <span>${this.esc(ctx.paroquia)}</span>
        </div>
        ${textos.map(t => {
          const conteudo = this.esc(resolverTags(t.conteudo, ctx));
          const align = t.alinhamento === 'left' ? 'left' : t.alinhamento === 'right' ? 'right' : 'center';
          if (t.tipo === 'TITULO') return `<div style="font-size:26px;font-weight:900;color:#1e1b4b;text-align:${align};line-height:1.2;margin-bottom:4px;">${conteudo || this.esc(ctx.titulo)}</div>`;
          if (t.tipo === 'SUBTITULO') return `<div style="margin-bottom:6px;font-size:15px;font-weight:700;color:#475569;text-align:${align};text-transform:uppercase;letter-spacing:0.04em;">${conteudo}</div>`;
          return `<div style="margin-top:6px;padding:8px 12px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #6366f1;border-radius:8px;font-size:13px;color:#334155;text-align:${align};white-space:pre-wrap;font-weight:600;">${conteudo}</div>`;
        }).join('')}
      </div>
    `;
  }

  /** Sem o layout copiado na escala, as colunas saem das vagas. Senão o PNG fica só com a data. */
  private colunasDa(escala: EscalaDetalhe): ColunaEscala[] {
    const vagas = vagasDoLayout(escala.colunas);
    if (vagas.length) return vagas;
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
    const celula = 'border-bottom:1px solid #c7d2fe;border-top:1px solid #c7d2fe;padding:0;height:10px;line-height:0;font-size:0;background:#eef2ff;';
    return `<tr><td style="${celula}"></td>${Array(numCols).fill(`<td style="${celula}"></td>`).join('')}</tr>`;
  }

  private eventBlock(event: EscalaEvento, colunas: { funcao: string, posicao: number }[], textosCel: ColunaEscala[] = [], ctx: { titulo?: string; mesAno?: string; paroquia?: string } = {}): string {
    const extras = textosCel.map(t => `<div style="margin-top:3px;font-size:12px;font-weight:700;color:#4338ca;">${this.esc(resolverTags(t.conteudo, ctx))}</div>`).join('');
    const nomes = colunas.map(c => {
      const nome = event.vagas.find(v => v.funcao === c.funcao && v.posicao === c.posicao)?.voluntario?.nome_completo || '';
      return nomeCurto(nome);
    });
    
    const feast = event.celebracao && event.celebracao !== 'Missa'
      ? `<div style="margin-top:4px;"><span style="display:inline-block;padding:2px 6px;border-radius:4px;background:#ffe4e6;color:#9f1239;font-size:11px;font-weight:800;text-transform:uppercase;">${this.esc(event.celebracao)}</span></div>`
      : '';
      
    const dow = new Date(`${event.data}T12:00:00`).getDay();
    const isDom = dow === 0;
    const isSab = dow === 6;
    
    const bgDia = isDom ? '#faf5ff' : isSab ? '#f0f9ff' : '#f8fafc';
    const bordaDia = isDom ? '#9333ea' : isSab ? '#0284c7' : '#64748b';
    const corSemana = isDom ? '#7e22ce' : isSab ? '#0369a1' : '#475569';
    const bgHora = isDom ? '#f3e8ff' : isSab ? '#e0f2fe' : '#ede9fe';
    const corHora = isDom ? '#6b21a8' : isSab ? '#075985' : '#4338ca';

    const dia = `
        <td style="border-bottom:1px solid #cbd5e1;border-right:1px solid #cbd5e1;padding:8px 10px;vertical-align:middle;background:${bgDia};border-left:4px solid ${bordaDia};width:190px;">
          <div style="font-size:17px;font-weight:900;line-height:1.2;color:#0f172a;">${this.esc(this.dataCompleta(event.data))}</div>
          <div style="margin-top:2px;font-size:13px;font-weight:800;line-height:1.2;color:${corSemana};">${this.esc(this.dayLabel(event.data))}</div>
          <div style="margin-top:4px;"><span style="display:inline-block;padding:2px 8px;border-radius:6px;background:${bgHora};color:${corHora};font-size:12px;font-weight:800;">${this.esc(event.horario.slice(0, 5))}hs</span></div>
          ${feast}
          ${extras}
        </td>`;
        
    const celulaNome = 'border-bottom:1px solid #e2e8f0;border-right:1px solid #e2e8f0;padding:8px 6px;font-size:16px;font-weight:700;color:#0f172a;text-align:center;vertical-align:middle;background:#ffffff;';

    return `
      <tr>
        ${dia}
        ${nomes.map((n, i) => `<td style="${celulaNome}">${this.esc(n) || '<span style="color:#cbd5e1;font-weight:400;font-size:16px;">—</span>'}</td>`).join('')}
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
