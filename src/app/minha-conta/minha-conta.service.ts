import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MinhaContaDados {
  cliente: {
    id: string;
    nome: string;
    documento: string;
    tipo: 'PF' | 'PJ';
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    contatos: { nome: string; email: string; telefone: string; principal: boolean }[];
  };
  contratacao: {
    planoNome: string;
    periodicidade: string;
    valor: number;
    diaVencimento: number;
    inicio: string;
    vigenteAte: string;
    situacaoComercial: string;
    nomeInstancia: string;
    slugInstancia: string;
    direitos: { limites: Record<string, number>; funcionalidades: string[] };
    adicionais: { codigo: string; quantidade: number }[];
  };
  cobrancas: {
    id: string;
    competenciaInicio: string;
    competenciaFim: string;
    vencimento: string;
    valor: number;
    status: string;
    vencida: boolean;
    pagoEm: string | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class MinhaContaService {
  private http = inject(HttpClient);

  buscar(): Observable<MinhaContaDados> {
    return this.http.get<MinhaContaDados>('/api/minha-conta');
  }
}

