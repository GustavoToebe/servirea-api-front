import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { MeuPerfil, Perfil, SecaoCatalogo, UsuarioParoquia } from './acesso.models';

@Injectable({ providedIn: 'root' })
export class AcessoApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  catalogo() {
    return this.http.get<SecaoCatalogo[]>(`${this.api}/permissoes/catalogo`);
  }

  perfis() {
    return this.http.get<Perfil[]>(`${this.api}/perfis`);
  }

  salvarPerfil(perfil: Partial<Perfil> & { nome: string; ativo: boolean; acessoTotal: boolean; permissoes: string[] }, id?: string) {
    const corpo = {
      nome: perfil.nome,
      ativo: perfil.ativo,
      acessoTotal: perfil.acessoTotal,
      permissoes: perfil.permissoes
    };
    return id
      ? this.http.put<Perfil>(`${this.api}/perfis/${id}`, corpo)
      : this.http.post<Perfil>(`${this.api}/perfis`, corpo);
  }

  duplicarPerfil(id: string) {
    return this.http.post<Perfil>(`${this.api}/perfis/${id}/duplicar`, {});
  }

  usuarios() {
    return this.http.get<UsuarioParoquia[]>(`${this.api}/usuarios`);
  }

  salvarUsuario(corpo: {
    nome: string;
    email: string;
    tipoTelefone: string | null;
    telefone: string | null;
    perfilId: string;
    ativo: boolean;
  }, id?: string) {
    return id
      ? this.http.put<UsuarioParoquia>(`${this.api}/usuarios/${id}`, corpo)
      : this.http.post<UsuarioParoquia>(`${this.api}/usuarios`, corpo);
  }

  reenviarConvite(id: string) {
    return this.http.post<void>(`${this.api}/usuarios/${id}/convite`, {});
  }

  eu() {
    return this.http.get<MeuPerfil>(`${this.api}/me`);
  }

  salvarEu(corpo: { nome: string; tipoTelefone: string | null; telefone: string | null; senha: string | null }) {
    return this.http.put<MeuPerfil>(`${this.api}/me`, corpo);
  }
}
