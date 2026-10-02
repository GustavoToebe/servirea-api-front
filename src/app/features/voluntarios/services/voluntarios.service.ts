import { Injectable } from '@angular/core';
import {firstValueFrom, map} from 'rxjs';
import {PainelVoluntarios,VoluntarioOpcao} from '../../pessoas/services/voluntarios-api.service';
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

  opcoes(nome='',pagina=0,tipo:TipoVoluntario|''='') {
    return this.api.opcoes(nome,pagina,tipo).pipe(map(r=>({...r,itens:r.itens.map(paraOpcao)})));
  }
  async resolverOpcoes(ids:string[]):Promise<Voluntario[]> {
    const unicos=[...new Set(ids)];const rows:Voluntario[]=[];
    for(let i=0;i<unicos.length;i+=100) rows.push(...(await this.api.resolverOpcoes(unicos.slice(i,i+100))).map(paraOpcao));
    return rows;
  }
  /** Composição dos ativos calculada no servidor; não carrega a lista de voluntários. */
  painel(): Promise<PainelVoluntarios> {
    return this.api.painel();
  }

  /**
   * Todos os ativos pela projeção leve e paginada (id, nome, tipo, funções), em páginas de 30. Para telas que precisam
   * da paróquia inteira (grade mensal) sem a ficha completa. Limite de páginas evita laço sem fim.
   */
  async ativosLeves(maxPaginas = 60): Promise<Voluntario[]> {
    const todos: Voluntario[] = [];
    for (let pagina = 0; pagina < maxPaginas; pagina++) {
      const r = await firstValueFrom(this.opcoes('', pagina));
      todos.push(...r.itens);
      if (!r.temMais) return todos;
    }
    throw new Error('Há mais voluntários ativos do que a grade consegue carregar.');
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

function paraOpcao(v:VoluntarioOpcao):Voluntario {
 return paraVoluntarioAntigo({...v,nome_completo:v.nomeCompleto,dataNascimento:null,fotoPath:null,fotoUrl:null,etapaCatequese:null,eucaristiaAno:null,crismaAno:null,horarioEstudo:null,autorizaWhatsapp:false,mandatoInicio:null,mandatoFim:null});
}
