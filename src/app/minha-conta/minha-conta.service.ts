import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** Resposta do GET /minha-conta: repasse do MinhaContaDto da Central (contrato-integracao-v1). */
export interface MinhaContaEndereco {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface MinhaContaContato {
  nome: string;
  email: string | null;
  telefone: string | null;
  principal: boolean;
}

export interface MinhaContaAdicional {
  nome: string;
  quantidade: number;
}

export type SituacaoComercial = 'TRIAL' | 'ATIVA' | 'INADIMPLENTE' | 'BLOQUEADA' | 'CANCELADA';
export type SituacaoCobranca = 'ABERTA' | 'PAGA' | 'CANCELADA' | 'ISENTA';

export interface MinhaContaCobranca {
  id: string;
  competenciaInicio: string;
  competenciaFim: string;
  vencimento: string;
  valor: number;
  situacao: SituacaoCobranca;
  vencida: boolean;
  pagoEm: string | null;
}

export interface MinhaContaDados {
  cliente: {
    nome: string;
    /** Já vem formatado pela Central (CPF ou CNPJ), como CEP e telefone. */
    documento: string;
    endereco: MinhaContaEndereco;
    contatos: MinhaContaContato[];
  };
  contratacao: {
    planoNome: string;
    periodicidade: 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
    valor: number;
    diaVencimento: number;
    inicio: string;
    vigenteAte: string | null;
    situacaoComercial: SituacaoComercial;
    nomeInstancia: string;
    adicionais: MinhaContaAdicional[];
  };
  cobrancas: MinhaContaCobranca[];
}

@Injectable({ providedIn: 'root' })
export class MinhaContaService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  buscar(): Observable<MinhaContaDados> {
    return this.http.get<MinhaContaDados>(`${this.api}/minha-conta`);
  }

  consumo(): Observable<ConsumoPlano> {return this.http.get<ConsumoPlano>(`${this.api}/minha-conta/consumo`);}
  conferirArmazenamento(inicio=0): Observable<{conferidos:number; falhas:number; pendentes:number; proximoInicio?:number}> {return this.http.post<{conferidos:number; falhas:number; pendentes:number; proximoInicio?:number}>(`${this.api}/minha-conta/armazenamento/conferir`,{}, {params:{inicio}});}
}

export interface ConsumoPlano {
  planoNome: string | null; versaoDireitos: number | null; direitosConfirmadosEm: string | null; consultadoEm: string;
  itens: {codigo: string; nome: string; usado: number; limite: number | null; disponivel: number | null; unidade?:string; pendentes?:number; competencia?:string | null; estado: 'SEM_LIMITE_CONFIGURADO' | 'EXCEDIDO' | 'ATINGIDO' | 'ATENCAO' | 'DISPONIVEL' | 'INVENTARIO_PENDENTE'}[];
}
