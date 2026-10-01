import { Injectable, signal } from '@angular/core';

export type PaletaId = 'ROXO' | 'MARIANA' | 'COMUM' | 'QUARESMA' | 'OURO' | 'MONASTICO'
  | 'PENTECOSTES' | 'ROSA' | 'CELESTE' | 'TURQUESA' | 'OLIVA' | 'TERRACOTA';
export type FonteId = 'PADRAO' | 'CONFORTO' | 'GRANDE' | 'EXTRA';
export type ContrasteId = 'padrao' | 'forte';

export interface Paleta {
  id: PaletaId;
  nome: string;
  descricao: string;
  brand: string;
  hover: string;
  navy: string;
  bg: string;
}

export interface ContrasteOpcao {
  id: ContrasteId;
  rotulo: string;
}

export const CONTRASTES: ContrasteOpcao[] = [
  { id: 'padrao', rotulo: 'Padrão' },
  { id: 'forte', rotulo: 'Forte' }
];

export interface Aparencia {
  paleta: PaletaId;
  noturno: boolean;
  fonte: FonteId;
  contraste: ContrasteId;
  vibrar: boolean;
}

export const PALETAS: Paleta[] = [
  { id: 'ROXO', nome: 'Roxo litúrgico', descricao: 'Advento, Quaresma e o roxo da coordenação', brand: '#673DE6', hover: '#5025D1', navy: '#2F1C6A', bg: '#F4F5FF' },
  { id: 'MARIANA', nome: 'Azul mariana', descricao: 'Serenidade e festas de Nossa Senhora', brand: '#2B4C7E', hover: '#1E365B', navy: '#1A2840', bg: '#F4F7FB' },
  { id: 'COMUM', nome: 'Verde tempo comum', descricao: 'O cotidiano da paróquia', brand: '#2E6B4F', hover: '#23533D', navy: '#163323', bg: '#F3F8F5' },
  { id: 'QUARESMA', nome: 'Borgonha sacro', descricao: 'Recolhimento e solenidade', brand: '#7B283A', hover: '#611E2D', navy: '#3D121B', bg: '#FAF4F5' },
  { id: 'OURO', nome: 'Âmbar eucarístico', descricao: 'Festas do Senhor e ouro velho', brand: '#855812', hover: '#6A460E', navy: '#422D08', bg: '#FAF7F2' },
  { id: 'MONASTICO', nome: 'Ardósia monástico', descricao: 'Neutro, para leitura longa', brand: '#475569', hover: '#334155', navy: '#0F172A', bg: '#F8FAFC' },
  { id: 'PENTECOSTES', nome: 'Vermelho pentecostes', descricao: 'Fogo do Espírito, mártires e festas de Pentecostes', brand: '#B42318', hover: '#912018', navy: '#4A0F0B', bg: '#FBF5F4' },
  { id: 'ROSA', nome: 'Rosa gaudete', descricao: 'A alegria do terceiro domingo do Advento e do Laetare', brand: '#B83280', hover: '#97266D', navy: '#4A1234', bg: '#FBF4F8' },
  { id: 'CELESTE', nome: 'Azul celeste', descricao: 'Céu aberto, claro e sereno para a tela o dia todo', brand: '#0369A1', hover: '#075985', navy: '#0C2E47', bg: '#F2F8FC' },
  { id: 'TURQUESA', nome: 'Turquesa batismal', descricao: 'Água viva, batismo e renovação', brand: '#0F766E', hover: '#115E59', navy: '#0B3B38', bg: '#F2F9F8' },
  { id: 'OLIVA', nome: 'Verde oliva', descricao: 'Paz e oliveira, um verde mais terroso que o do tempo comum', brand: '#4D7C0F', hover: '#3F6212', navy: '#1A2E05', bg: '#F7F9F2' },
  { id: 'TERRACOTA', nome: 'Terracota', descricao: 'Barro e tijolo, acolhedor para a sacristia', brand: '#C2410C', hover: '#9A3412', navy: '#431407', bg: '#FCF6F2' }
];

export const FONTES: { id: FonteId; rotulo: string; detalhe: string; px: string }[] = [
  { id: 'PADRAO', rotulo: '14 px', detalhe: 'Padrão compacto', px: '16px' },
  { id: 'CONFORTO', rotulo: '16 px', detalhe: 'Médio confortável', px: '18.3px' },
  { id: 'GRANDE', rotulo: '18 px', detalhe: 'Grande para leitura', px: '20.6px' },
  { id: 'EXTRA', rotulo: '20 px', detalhe: 'Extra acessível', px: '22.9px' }
];

const CHAVE = 'sv_aparencia';
const INICIAL: Aparencia = { paleta: 'ROXO', noturno: false, fonte: 'PADRAO', contraste: 'padrao', vibrar: false };

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly paleta = signal<PaletaId>(INICIAL.paleta);
  readonly noturno = signal(INICIAL.noturno);
  readonly fonte = signal<FonteId>(INICIAL.fonte);
  readonly contraste = signal<ContrasteId>(INICIAL.contraste);
  readonly vibrar = signal(INICIAL.vibrar);

  constructor() {
    const salva = this.ler();
    this.paleta.set(salva.paleta);
    this.noturno.set(salva.noturno);
    this.fonte.set(salva.fonte);
    this.contraste.set(salva.contraste);
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

  definirContraste(id: ContrasteId) {
    this.contraste.set(id);
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
    this.contraste.set(INICIAL.contraste);
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
      contraste: this.contraste(),
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
    const contraste = this.contraste();

    root.style.setProperty('--brand', paleta.brand);
    root.style.setProperty('--brand-hover', paleta.hover);
    root.style.setProperty('--brand-navy', paleta.navy);
    root.style.setProperty('--app-bg', escuro ? '#0F0F14' : paleta.bg);
    root.style.setProperty('--ink', escuro ? '#F1F0F7' : '#131b2e');
    root.style.setProperty('--muted', escuro ? '#9D9BB0' : '#64748b');
    root.style.setProperty('--card', escuro ? 'rgba(26, 24, 38, 0.92)' : 'rgba(255, 255, 255, 0.86)');

    if (escuro) {
      root.style.setProperty('--line', contraste === 'forte' ? 'rgba(255, 255, 255, 0.28)' : 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--field-line', contraste === 'forte' ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.14)');
    } else {
      root.style.setProperty('--line', contraste === 'forte' ? '#b8b0db' : '#E7E4F5');
      root.style.setProperty('--field-line', contraste === 'forte' ? '#9488bf' : '#DDD8F0');
    }

    root.style.fontSize = fonte.px;
    root.classList.toggle('dark', escuro);
    root.setAttribute('data-contrast', contraste);
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
      const contraste = CONTRASTES.some(c => c.id === lido.contraste) ? lido.contraste as ContrasteId : INICIAL.contraste;
      return {
        paleta,
        fonte,
        contraste,
        noturno: !!lido.noturno,
        vibrar: !!lido.vibrar
      };
    } catch {
      return { ...INICIAL };
    }
  }
}
