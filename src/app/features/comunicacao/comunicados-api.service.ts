import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemApi } from '../../core/api/api-error';
import {
  Comunicado, ComunicadoDetalhe, CriarComunicado, DestinatarioPrevia, EnviarPara, PreVisualizacaoComunicado,
  QuaisContatos, StatusComunicado, TipoEnvio, WhatsappConfig
} from './comunicacao.models';

@Injectable({ providedIn: 'root' })
export class ComunicadosApiService {
  private readonly base = `${environment.apiUrl}/comunicados`;
  private readonly whatsappUrl = `${environment.apiUrl}/tenant/whatsapp`;

  constructor(private http: HttpClient) {}

  async destinatarios(canal: TipoEnvio, pessoaIds: string[], enviarPara: EnviarPara, contatos: QuaisContatos): Promise<DestinatarioPrevia[]> {
    try {
      return await firstValueFrom(this.http.post<DestinatarioPrevia[]>(`${this.base}/destinatarios`, { canal, pessoaIds, enviarPara, contatos }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível montar os destinatários.'));
    }
  }

  async preVisualizar(layoutId: string, assunto: string | null, pessoaId: string, enviarPara: EnviarPara): Promise<PreVisualizacaoComunicado> {
    try {
      return await firstValueFrom(this.http.post<PreVisualizacaoComunicado>(`${this.base}/pre-visualizar`, { layoutId, assunto, pessoaId, enviarPara }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível gerar a visualização.'));
    }
  }

  /** Multipart: `dados` (JSON) + `anexos`. */
  async criar(dados: CriarComunicado, anexos: File[]): Promise<{ id: string; total: number }> {
    const form = new FormData();
    form.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
    for (const a of anexos) form.append('anexos', a, a.name);
    try {
      return await firstValueFrom(this.http.post<{ id: string; total: number }>(this.base, form));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível enviar o comunicado.'));
    }
  }

  async listar(canal?: TipoEnvio | '', status?: StatusComunicado | ''): Promise<Comunicado[]> {
    let params = new HttpParams();
    if (canal) params = params.set('canal', canal);
    if (status) params = params.set('status', status);
    try {
      return await firstValueFrom(this.http.get<Comunicado[]>(this.base, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar os comunicados.'));
    }
  }

  async detalhe(id: string): Promise<ComunicadoDetalhe> {
    try {
      return await firstValueFrom(this.http.get<ComunicadoDetalhe>(`${this.base}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Comunicado não encontrado.'));
    }
  }

  async reenviarFalhas(id: string): Promise<Comunicado> {
    try {
      return await firstValueFrom(this.http.post<Comunicado>(`${this.base}/${id}/reenviar-falhas`, {}));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível reenviar as falhas.'));
    }
  }

  async whatsapp(): Promise<WhatsappConfig> {
    try {
      return await firstValueFrom(this.http.get<WhatsappConfig>(this.whatsappUrl));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível ler a configuração do WhatsApp.'));
    }
  }

  async salvarWhatsapp(instancia: string, token: string, ativo: boolean): Promise<WhatsappConfig> {
    try {
      return await firstValueFrom(this.http.put<WhatsappConfig>(this.whatsappUrl, { instancia, token: token || null, ativo }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível salvar o WhatsApp.'));
    }
  }

  async testarWhatsapp(telefone: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${this.whatsappUrl}/testar`, { telefone }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível enviar o teste.'));
    }
  }
}
