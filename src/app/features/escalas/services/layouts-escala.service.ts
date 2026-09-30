import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { ColunaEscala, LayoutEscala } from '../models/escala.model';

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

  async listar(): Promise<LayoutEscala[]> {
    try {
      return await firstValueFrom(this.http.get<LayoutEscala[]>(this.url));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar os layouts.'));
    }
  }

  async carregar(id: string): Promise<LayoutEscala> {
    try {
      return await firstValueFrom(this.http.get<LayoutEscala>(`${this.url}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível carregar o layout.'));
    }
  }

  async salvar(layout: Partial<LayoutEscala>): Promise<LayoutEscala> {
    try {
      if (layout.id) {
        return await firstValueFrom(this.http.put<LayoutEscala>(`${this.url}/${layout.id}`, layout));
      }
      return await firstValueFrom(this.http.post<LayoutEscala>(this.url, layout));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível salvar o layout.'));
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível excluir o layout.'));
    }
  }
}
