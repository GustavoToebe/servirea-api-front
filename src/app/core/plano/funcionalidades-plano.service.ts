import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export const FUNCIONALIDADES = [
  {codigo:'PASTORAIS',nome:'Pastorais e equipes'},{codigo:'PORTAL_VOLUNTARIO',nome:'Portal do voluntário'},{codigo:'CALENDARIO',nome:'Calendário privado'},
  {codigo:'MURAL',nome:'Mural de avisos'}, {codigo:'TAREFAS',nome:'Tarefas e solicitações'},
  {codigo:'ESCALAS',nome:'Escalas'}, {codigo:'INSCRICAO_PUBLICA',nome:'Inscrição pública'},
  {codigo:'EVENTOS',nome:'Eventos'}, {codigo:'FINANCEIRO',nome:'Financeiro'},
  {codigo:'COMUNICACAO',nome:'Comunicação e WhatsApp'}, {codigo:'IMPORTACAO_PESSOAS',nome:'Importação CSV de pessoas'}
];
@Injectable({providedIn:'root'})
export class FuncionalidadesPlanoService {
  private http=inject(HttpClient);
  consultar() {return this.http.get<string[]>(`${environment.apiUrl}/funcionalidades-plano`);}
}
export function moduloDoPlano(url:string):string|null {
  const caminho=url.split('?')[0].split('(')[0];
  if(caminho.startsWith('/portal')) return 'PORTAL_VOLUNTARIO';
  if(caminho.startsWith('/pastorais')) return 'PASTORAIS';
  if(caminho.startsWith('/mural')) return 'MURAL';
  if(caminho.startsWith('/tarefas')) return 'TAREFAS';
  if(caminho.startsWith('/escalas')) return 'ESCALAS';
  if(caminho.startsWith('/eventos')) return 'EVENTOS';
  if(caminho.startsWith('/financeiro')) return 'FINANCEIRO';
  if(caminho.startsWith('/comunicados') || caminho.startsWith('/layouts')) return 'COMUNICACAO';
  if(caminho.startsWith('/pessoas/importar')) return 'IMPORTACAO_PESSOAS';
  if(caminho.startsWith('/pessoas/inscricoes')) return 'INSCRICAO_PUBLICA';
  return null;
}
