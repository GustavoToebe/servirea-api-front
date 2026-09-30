import { Injectable } from '@angular/core';
import { VoluntariosApiService } from '../../pessoas/services/voluntarios-api.service';
import { TipoVoluntario, VoluntarioLista } from '../../pessoas/models/pessoa.model';
import { Voluntario, VoluntarioFilters } from '../models/voluntario.model';

/** Ponte para a escala/dashboard: GET /voluntarios (sem Supabase). */
@Injectable({ providedIn: 'root' })
export class VoluntariosService {
  constructor(private api: VoluntariosApiService) {}

  async list(filters: VoluntarioFilters = {}): Promise<Voluntario[]> {
    const ativo = filters.status === 'ATIVO' ? true : filters.status === 'INATIVO' ? false : undefined;
    const rows = await this.api.listar({ ativo, tipo: filters.tipo, nome: filters.nome });
    return rows
      .filter(v => !filters.funcao || v.funcoesHabilitadas.includes(filters.funcao))
      .map(paraVoluntarioAntigo);
  }

  async active(): Promise<Voluntario[]> {
    return this.list({ status: 'ATIVO' });
  }

  async countByActive(ativo: boolean): Promise<number> {
    return this.api.contar(ativo);
  }
}

function paraVoluntarioAntigo(v: VoluntarioLista): Voluntario {
  return {
    id: v.id,
    nome_completo: v.nomeCompleto,
    data_nascimento: v.dataNascimento || null,
    tipo: v.tipo as TipoVoluntario,
    ativo: v.ativo,
    foto_path: v.fotoPath,
    foto_url: v.fotoUrl || null,
    etapa_catequese: v.etapaCatequese,
    eucaristia_ano: v.eucaristiaAno,
    crisma_ano: v.crismaAno,
    rua: null,
    numero: null,
    bairro: null,
    telefone: null,
    celular: null,
    email: null,
    horario_estudo: v.horarioEstudo,
    observacoes: null,
    autoriza_whatsapp: v.autorizaWhatsapp,
    funcoes_habilitadas: v.funcoesHabilitadas,
    mandato_inicio: v.mandatoInicio || null,
    mandato_fim: v.mandatoFim || null
  };
}
