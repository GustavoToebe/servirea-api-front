import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { ColunaEscala, LayoutEscala } from '../models/escala.model';

const STORAGE_KEY = 'servire.layouts_escala';

/** Modelos de fábrica prontos para uso em qualquer paróquia. */
export const RECEITAS_LAYOUT: {
  id: string;
  nome: string;
  tipo: 'SEMANAL' | 'MENSAL';
  descricao: string;
  sistema: boolean;
  colunas: ColunaEscala[];
}[] = [
  {
    id: 'padrao-semanal',
    nome: 'Padrão Semanal',
    tipo: 'SEMANAL',
    descricao: 'Tabela de dias úteis com Acólito Missal, Cruz, Credência, 2 Velas e 2 Sinos.',
    sistema: true,
    colunas: [
      { idLocal: 'c-tit', tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, largura: 12, conteudo: '#TITULO_ESCALA#', alinhamento: 'center' },
      { idLocal: 'c-sub', tipo: 'SUBTITULO', escopo: 'DOCUMENTO', linha: 1, coluna: 0, largura: 12, conteudo: '#MES_ANO#', alinhamento: 'center' },
      { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 2, conteudo: '#DATA_HORA#', alinhamento: 'left' },
      { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 1, largura: 2, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
      { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 2, largura: 2, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
      { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 3, largura: 2, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
      { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 4, largura: 1, funcao: 'VELA', posicao: 1, rotulo: 'Vela 1' },
      { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 5, largura: 1, funcao: 'VELA', posicao: 2, rotulo: 'Vela 2' },
      { idLocal: 'v-sn1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 6, largura: 1, funcao: 'SINO', posicao: 1, rotulo: 'Sino 1' },
      { idLocal: 'v-sn2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 7, largura: 1, funcao: 'SINO', posicao: 2, rotulo: 'Sino 2' }
    ]
  },
  {
    id: 'padrao-mensal',
    nome: 'Padrão Mensal',
    tipo: 'MENSAL',
    descricao: 'Formato clássico com Missal, Cruz, Credência, 2 Velas, 4 Coletas e 2 Sinos.',
    sistema: true,
    colunas: [
      { idLocal: 'c-tit', tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, largura: 12, conteudo: '#TITULO_ESCALA#', alinhamento: 'center' },
      { idLocal: 'c-sub', tipo: 'SUBTITULO', escopo: 'DOCUMENTO', linha: 1, coluna: 0, largura: 12, conteudo: '#MES_ANO#', alinhamento: 'center' },
      { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#', alinhamento: 'left' },
      { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 0, largura: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
      { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 1, largura: 1, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
      { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 2, largura: 1, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
      { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 3, largura: 1, funcao: 'VELA', posicao: 1, rotulo: 'Vela 1' },
      { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 0, largura: 1, funcao: 'VELA', posicao: 2, rotulo: 'Vela 2' },
      { idLocal: 'v-cl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 1, largura: 1, funcao: 'COLETA', posicao: 1, rotulo: 'Coleta 1' },
      { idLocal: 'v-cl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 2, largura: 1, funcao: 'COLETA', posicao: 2, rotulo: 'Coleta 2' },
      { idLocal: 'v-cl3', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 3, largura: 1, funcao: 'COLETA', posicao: 3, rotulo: 'Coleta 3' },
      { idLocal: 'v-cl4', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 0, largura: 1, funcao: 'COLETA', posicao: 4, rotulo: 'Coleta 4' },
      { idLocal: 'v-sn1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 1, largura: 1, funcao: 'SINO', posicao: 1, rotulo: 'Sino 1' },
      { idLocal: 'v-sn2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 2, largura: 1, funcao: 'SINO', posicao: 2, rotulo: 'Sino 2' }
    ]
  },
  {
    id: 'missa-dominical-completa',
    nome: 'Missa Dominical Completa',
    tipo: 'MENSAL',
    descricao: 'Ideal para matrizes e festividades: Data no topo, Missal/Cruz/Credência, Círios e 3 Ofertas.',
    sistema: false,
    colunas: [
      { idLocal: 'c-tit', tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, largura: 12, conteudo: '#PAROQUIA#', alinhamento: 'center' },
      { idLocal: 'c-sub', tipo: 'SUBTITULO', escopo: 'DOCUMENTO', linha: 1, coluna: 0, largura: 12, conteudo: 'Escala de Acólitos — #MES_ANO#', alinhamento: 'center' },
      { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#', alinhamento: 'left' },
      { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 0, largura: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
      { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 1, largura: 1, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
      { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 2, largura: 1, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
      { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 0, largura: 1, funcao: 'VELA', posicao: 1, rotulo: 'Círio 1' },
      { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 1, largura: 1, funcao: 'VELA', posicao: 2, rotulo: 'Círio 2' },
      { idLocal: 'v-cl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 0, largura: 1, funcao: 'COLETA', posicao: 1, rotulo: 'Oferta 1' },
      { idLocal: 'v-cl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 1, largura: 1, funcao: 'COLETA', posicao: 2, rotulo: 'Oferta 2' },
      { idLocal: 'v-cl3', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 2, largura: 1, funcao: 'COLETA', posicao: 3, rotulo: 'Oferta 3' }
    ]
  },
  {
    id: 'missa-diaria-enxuta',
    nome: 'Missa Diária Enxuta',
    tipo: 'SEMANAL',
    descricao: 'Para missas de segunda a sexta: Data/Celebração, Missal e Sino lado a lado.',
    sistema: false,
    colunas: [
      { idLocal: 'c-tit', tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, largura: 12, conteudo: 'Escala Diária (#MES_ANO#)', alinhamento: 'center' },
      { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 1, conteudo: '#DATA_HORA#', alinhamento: 'left' },
      { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 1, largura: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
      { idLocal: 'v-sn1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 2, largura: 1, funcao: 'SINO', posicao: 1, rotulo: 'Sino' }
    ]
  },
  {
    id: 'quadro-de-avisos',
    nome: 'Escala com Quadro de Avisos',
    tipo: 'MENSAL',
    descricao: 'Com destaque no cabeçalho para recados importantes e avisos da coordenação.',
    sistema: false,
    colunas: [
      { idLocal: 'c-tit', tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, largura: 12, conteudo: 'Escala Mensal — #MES_ANO#', alinhamento: 'center' },
      { idLocal: 'c-aviso', tipo: 'TEXTO_LIVRE', escopo: 'DOCUMENTO', linha: 1, coluna: 0, largura: 12, conteudo: '⚠️ ATENÇÃO: Reunião geral e ensaio no próximo dia 15. Favor não se atrasar!', alinhamento: 'left', negrito: true },
      { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#', alinhamento: 'left' },
      { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 0, largura: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Missal' },
      { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 1, largura: 1, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
      { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 2, largura: 1, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
      { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 0, largura: 1, funcao: 'VELA', posicao: 1, rotulo: 'Vela 1' },
      { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 1, largura: 1, funcao: 'VELA', posicao: 2, rotulo: 'Vela 2' }
    ]
  },
  {
    id: 'escala-simplificada',
    nome: 'Escala Simplificada',
    tipo: 'MENSAL',
    descricao: 'Sem Missal e sem Coletas: apenas Cruz, Credência, Vela 1 e Vela 2.',
    sistema: false,
    colunas: [
      { idLocal: 'c-tit', tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, largura: 12, conteudo: 'Escala Simplificada — #MES_ANO#', alinhamento: 'center' },
      { idLocal: 'c-sub', tipo: 'SUBTITULO', escopo: 'DOCUMENTO', linha: 1, coluna: 0, largura: 12, conteudo: 'Comunidade Paroquial', alinhamento: 'center' },
      { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#', alinhamento: 'left' },
      { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 0, largura: 1, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
      { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 1, largura: 1, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
      { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 0, largura: 1, funcao: 'VELA', posicao: 1, rotulo: 'Vela 1' },
      { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 1, largura: 1, funcao: 'VELA', posicao: 2, rotulo: 'Vela 2' }
    ]
  }
];

@Injectable({ providedIn: 'root' })
export class LayoutsEscalaService {
  private readonly url = `${environment.apiUrl}/escalas/layouts`;

  constructor(private http: HttpClient) {}

  private carregarCacheLocal(): LayoutEscala[] {
    try {
      const bruto = localStorage.getItem(STORAGE_KEY);
      if (bruto) {
        const salvos = JSON.parse(bruto) as LayoutEscala[];
        if (Array.isArray(salvos) && salvos.length > 0) {
          return salvos;
        }
      }
    } catch {
      // sem localStorage
    }
    const defaults: LayoutEscala[] = RECEITAS_LAYOUT.map(r => ({
      id: r.id,
      nome: r.nome,
      tipo: r.tipo,
      ativo: true,
      sistema: r.sistema,
      colunas: r.colunas
    }));
    this.salvarCacheLocal(defaults);
    return defaults;
  }

  private salvarCacheLocal(layouts: LayoutEscala[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
    } catch {
      // ignore
    }
  }

  async listar(): Promise<LayoutEscala[]> {
    try {
      const apiLayouts = await firstValueFrom(this.http.get<LayoutEscala[]>(this.url));
      if (Array.isArray(apiLayouts) && apiLayouts.length > 0) {
        // Assegura que layouts de sistema estejam presentes
        const combinados = [...apiLayouts];
        for (const receita of RECEITAS_LAYOUT) {
          if (!combinados.some(l => l.id === receita.id || l.nome === receita.nome)) {
            combinados.push({
              id: receita.id,
              nome: receita.nome,
              tipo: receita.tipo,
              ativo: true,
              sistema: receita.sistema,
              colunas: receita.colunas
            });
          }
        }
        this.salvarCacheLocal(combinados);
        return combinados;
      }
      return this.carregarCacheLocal();
    } catch {
      // fallback gracioso se API estiver inacessível
      return this.carregarCacheLocal();
    }
  }

  async carregar(id: string): Promise<LayoutEscala> {
    try {
      return await firstValueFrom(this.http.get<LayoutEscala>(`${this.url}/${id}`));
    } catch {
      const locais = this.carregarCacheLocal();
      const achado = locais.find(l => l.id === id);
      if (achado) return achado;
      throw new Error('Layout não encontrado.');
    }
  }

  async salvar(layout: Partial<LayoutEscala>): Promise<LayoutEscala> {
    let salvo: LayoutEscala;
    const novoId = layout.id || 'layout-' + Date.now();
    const objeto: LayoutEscala = {
      id: novoId,
      nome: layout.nome || 'Novo Layout',
      tipo: layout.tipo || 'MENSAL',
      colunas: layout.colunas || [],
      ativo: layout.ativo ?? true,
      sistema: layout.sistema ?? false
    };

    try {
      if (layout.id && !layout.id.startsWith('padrao-') && !layout.id.startsWith('layout-')) {
        salvo = await firstValueFrom(this.http.put<LayoutEscala>(`${this.url}/${layout.id}`, layout));
      } else {
        salvo = await firstValueFrom(this.http.post<LayoutEscala>(this.url, layout));
      }
    } catch {
      // Fallback local caso a API não esteja respondendo
      salvo = objeto;
    }

    // Atualiza cache local
    const locais = this.carregarCacheLocal();
    const idx = locais.findIndex(l => l.id === salvo.id);
    if (idx >= 0) {
      locais[idx] = salvo;
    } else {
      locais.push(salvo);
    }
    this.salvarCacheLocal(locais);

    return salvo;
  }

  async excluir(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
    } catch {
      // continua para remover do local
    }
    const locais = this.carregarCacheLocal().filter(l => l.id !== id);
    this.salvarCacheLocal(locais);
  }
}
