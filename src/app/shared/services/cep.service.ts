import { Injectable } from '@angular/core';
import { somenteDigitos } from '../utils/formatos';

export interface EnderecoDoCep {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/**
 * Endereço pelo CEP no ViaCEP (gratuito, sem chave, com CORS). Usa `fetch`
 * de propósito: pelo HttpClient o interceptor de autenticação poderia mandar
 * o token da sessão para fora. Falha ou CEP inexistente devolvem null e o
 * usuário preenche à mão.
 */
@Injectable({ providedIn: 'root' })
export class CepService {
  private readonly cache = new Map<string, EnderecoDoCep | null>();

  async buscar(cep: string): Promise<EnderecoDoCep | null> {
    const d = somenteDigitos(cep);
    if (d.length !== 8) return null;
    if (this.cache.has(d)) return this.cache.get(d) ?? null;
    const controle = new AbortController();
    const prazo = setTimeout(() => controle.abort(), 6000);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal: controle.signal });
      if (!resposta.ok) return null;
      const corpo = await resposta.json() as {
        erro?: boolean | string; logradouro?: string; bairro?: string; localidade?: string; uf?: string;
      };
      const endereco = corpo.erro ? null : {
        logradouro: corpo.logradouro ?? '',
        bairro: corpo.bairro ?? '',
        cidade: corpo.localidade ?? '',
        uf: corpo.uf ?? ''
      };
      this.cache.set(d, endereco);
      return endereco;
    } catch {
      return null;
    } finally {
      clearTimeout(prazo);
    }
  }
}
