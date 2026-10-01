import { PaginaLista } from '../../core/api/pagina-lista';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemApi } from '../../core/api/api-error';
import { EventoDetalhe, EventoRequest, EventoResumo } from './eventos.models';

/** API de eventos. Cada chamada devolve o evento atualizado; erro vira Error com a mensagem do back. */
@Injectable({ providedIn: 'root' })
export class EventosApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/eventos`;

  listar(): Promise<EventoResumo[]> {
    return this.chamar(this.http.get<EventoResumo[]>(this.base), 'Não foi possível carregar os eventos.');
  }

  pagina(pagina = 0): Promise<PaginaLista<EventoResumo>> {
    return this.chamar(this.http.get<PaginaLista<EventoResumo>>(`${this.base}/pagina`, {params:{pagina,tamanho:30}}), 'Não foi possível carregar os eventos.');
  }

  buscar(id: string): Promise<EventoDetalhe> {
    return this.chamar(this.http.get<EventoDetalhe>(`${this.base}/${id}`), 'Não foi possível carregar o evento.');
  }

  criar(dados: EventoRequest): Promise<EventoDetalhe> {
    return this.chamar(this.http.post<EventoDetalhe>(this.base, dados), 'Não foi possível salvar o evento.');
  }

  atualizar(id: string, dados: EventoRequest): Promise<EventoDetalhe> {
    return this.chamar(this.http.put<EventoDetalhe>(`${this.base}/${id}`, dados), 'Não foi possível salvar o evento.');
  }

  publicar(id: string): Promise<EventoDetalhe> {
    return this.chamar(this.http.post<EventoDetalhe>(`${this.base}/${id}/publicar`, {}), 'Não foi possível publicar.');
  }

  cancelar(id: string, avisarInscritos: boolean): Promise<EventoDetalhe> {
    return this.chamar(this.http.post<EventoDetalhe>(`${this.base}/${id}/cancelar`, { avisarInscritos }), 'Não foi possível cancelar.');
  }

  inscrever(id: string, pessoaId: string): Promise<EventoDetalhe> {
    return this.chamar(this.http.post<EventoDetalhe>(`${this.base}/${id}/inscricoes`, { pessoaId }), 'Não foi possível inscrever.');
  }

  removerInscricao(id: string, inscricaoId: string): Promise<EventoDetalhe> {
    return this.chamar(this.http.delete<EventoDetalhe>(`${this.base}/${id}/inscricoes/${inscricaoId}`), 'Não foi possível remover a inscrição.');
  }

  enviarFoto(id: string, foto: File): Promise<EventoDetalhe> {
    const form = new FormData();
    form.append('foto', foto, foto.name);
    return this.chamar(this.http.post<EventoDetalhe>(`${this.base}/${id}/fotos`, form), 'Não foi possível enviar a foto.');
  }

  definirCapa(id: string, fotoId: string): Promise<EventoDetalhe> {
    return this.chamar(this.http.put<EventoDetalhe>(`${this.base}/${id}/fotos/${fotoId}/capa`, {}), 'Não foi possível definir a capa.');
  }

  excluirFoto(id: string, fotoId: string): Promise<EventoDetalhe> {
    return this.chamar(this.http.delete<EventoDetalhe>(`${this.base}/${id}/fotos/${fotoId}`), 'Não foi possível excluir a foto.');
  }

  private async chamar<T>(pedido: Observable<T>, padrao: string): Promise<T> {
    try {
      return await firstValueFrom(pedido);
    } catch (erro) {
      throw new Error(mensagemApi(erro, padrao));
    }
  }
}
