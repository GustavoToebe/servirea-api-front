import { Injectable, signal } from '@angular/core';

export type PaletaId = 'ROXO' | 'MARIANA' | 'COMUM' | 'QUARESMA' | 'OURO' | 'MONASTICO';
export type FonteId = 'PADRAO' | 'CONFORTO' | 'GRANDE' | 'EXTRA';

export interface Paleta {
  id: PaletaId;
  nome: string;
  descricao: string;
  brand: string;
  hover: string;
  navy: string;
  bg: string;
}

export interface Aparencia {
  paleta: PaletaId;
  noturno: boolean;
  fonte: FonteId;
  vibrar: boolean;
}

export const PALETAS: Paleta[] = [
  { id: 'ROXO', nome: 'Roxo litúrgico', descricao: 'Advento, Quaresma e o roxo da coordenação', brand: '#673DE6', hover: '#5025D1', navy: '#2F1C6A', bg: '#F4F5FF' },
  { id: 'MARIANA', nome: 'Azul mariana', descricao: 'Serenidade e festas de Nossa Senhora', brand: '#2B4C7E', hover: '#1E365B', navy: '#1A2840', bg: '#F4F7FB' },
  { id: 'COMUM', nome: 'Verde tempo comum', descricao: 'O cotidiano da paróquia', brand: '#2E6B4F', hover: '#23533D', navy: '#163323', bg: '#F3F8F5' },
  { id: 'QUARESMA', nome: 'Borgonha sacro', descricao: 'Recolhimento e solenidade', brand: '#7B283A', hover: '#611E2D', navy: '#3D121B', bg: '#FAF4F5' },
  { id: 'OURO', nome: 'Âmbar eucarístico', descricao: 'Festas do Senhor e ouro velho', brand: '#855812', hover: '#6A460E', navy: '#422D08', bg: '#FAF7F2' },
  { id: 'MONASTICO', nome: 'Ardósia monástico', descricao: 'Neutro, para leitura longa', brand: '#475569', hover: '#334155', navy: '#0F172A', bg: '#F8FAFC' }
];

export const FONTES: { id: FonteId; rotulo: string; detalhe: string; px: string }[] = [
  { id: 'PADRAO', rotulo: '14px', detalhe: 'Padrão', px: '16px' },
  { id: 'CONFORTO', rotulo: '+1', detalhe: '16px', px: '18.3px' },
  { id: 'GRANDE', rotulo: '+2', detalhe: '18px', px: '20.6px' },
  { id: 'EXTRA', rotulo: '+3', detalhe: '20px', px: '22.9px' }
];

const CHAVE = 'sv_aparencia';
const INICIAL: Aparencia = { paleta: 'ROXO', noturno: false, fonte: 'PADRAO', vibrar: false };

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly paleta = signal<PaletaId>(INICIAL.paleta);
  readonly noturno = signal(INICIAL.noturno);
  readonly fonte = signal<FonteId>(INICIAL.fonte);
  readonly vibrar = signal(INICIAL.vibrar);

  constructor() {
    const salva = this.ler();
    this.paleta.set(salva.paleta);
    this.noturno.set(salva.noturno);
    this.fonte.set(salva.fonte);
    this.vibrar.set(salva.vibrar);
    this.aplicar();
  }

  escolherPaleta(id: PaletaId) {
    this.paleta.set(id);
    this.persistir();
    this.tocar();
  }

  definirNoturno(ativo: boolean) {
    this.noturno.set(ativo);
    this.persistir();
    this.tocar();
  }

  definirFonte(id: FonteId) {
    this.fonte.set(id);
    this.persistir();
    this.tocar();
  }

  definirVibrar(ativo: boolean) {
    this.vibrar.set(ativo);
    this.persistir();
    if (ativo) this.tocar();
  }

  restaurar() {
    this.paleta.set(INICIAL.paleta);
    this.noturno.set(INICIAL.noturno);
    this.fonte.set(INICIAL.fonte);
    this.vibrar.set(INICIAL.vibrar);
    this.persistir();
  }

  paletaAtual(): Paleta {
    return PALETAS.find(p => p.id === this.paleta()) || PALETAS[0];
  }

  tocar() {
    if (!this.vibrar()) return;
    navigator.vibrate?.(12);
  }

  private persistir() {
    const aparencia: Aparencia = {
      paleta: this.paleta(),
      noturno: this.noturno(),
      fonte: this.fonte(),
      vibrar: this.vibrar()
    };
    try {
      localStorage.setItem(CHAVE, JSON.stringify(aparencia));
    } catch {
      // navegador sem armazenamento: a aparência vale só nesta visita
    }
    this.aplicar();
  }

  private aplicar() {
    const root = document.documentElement;
    const paleta = this.paletaAtual();
    const fonte = FONTES.find(f => f.id === this.fonte()) || FONTES[0];
    const escuro = this.noturno();
    root.style.setProperty('--brand', paleta.brand);
    root.style.setProperty('--brand-hover', paleta.hover);
    root.style.setProperty('--brand-navy', paleta.navy);
    root.style.setProperty('--app-bg', escuro ? '#0F0F14' : paleta.bg);
    root.style.setProperty('--ink', escuro ? '#F1F0F7' : '#131b2e');
    root.style.setProperty('--muted', escuro ? '#9D9BB0' : '#64748b');
    root.style.setProperty('--card', escuro ? 'rgba(26, 24, 38, 0.92)' : 'rgba(255, 255, 255, 0.86)');
    root.style.setProperty('--line', escuro ? 'rgba(255, 255, 255, 0.08)' : '#E7E4F5');
    root.style.setProperty('--field-line', escuro ? 'rgba(255, 255, 255, 0.14)' : '#DDD8F0');
    root.style.fontSize = fonte.px;
    root.classList.toggle('dark', escuro);
    document.body.style.background = escuro ? '#0F0F14' : paleta.bg;
    document.body.style.color = escuro ? '#F1F0F7' : '#131b2e';
  }

  private ler(): Aparencia {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return { ...INICIAL };
      const lido = JSON.parse(bruto) as Partial<Aparencia>;
      const paleta = PALETAS.some(p => p.id === lido.paleta) ? lido.paleta as PaletaId : INICIAL.paleta;
      const fonte = FONTES.some(f => f.id === lido.fonte) ? lido.fonte as FonteId : INICIAL.fonte;
      return {
        paleta,
        fonte,
        noturno: !!lido.noturno,
        vibrar: !!lido.vibrar
      };
    } catch {
      return { ...INICIAL };
    }
  }
}
