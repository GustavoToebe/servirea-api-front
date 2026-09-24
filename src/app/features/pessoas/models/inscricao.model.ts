import { ContatoEmail, ContatoTelefone, FuncaoEscala, HorarioEstudo, TipoVoluntario } from './pessoa.model';

export type StatusInscricao = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface InscricaoResponsavel {
  id: string;
  parentesco: string;
  parentescoInverso: string | null;
  nome: string;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  principal: boolean;
}

export interface Inscricao {
  id: string;
  nomeCompleto: string;
  dataNascimento: string | null;
  sexo: string | null;
  cpf: string | null;
  rg: string | null;
  tipo: TipoVoluntario;
  fotoPath: string | null;
  etapaCatequese: string | null;
  eucaristiaAno: string | null;
  crismaAno: string | null;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  responsaveis: InscricaoResponsavel[];
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  horarioEstudo: HorarioEstudo | null;
  observacoes: string | null;
  autorizaWhatsapp: boolean;
  funcoesHabilitadas: FuncaoEscala[];
  status: StatusInscricao;
  dataAprovacao: string | null;
  voluntarioId: string | null;
  dataRejeicao: string | null;
  motivoRejeicao: string | null;
}

export interface InscricaoPublicaRequest {
  turnstileToken: string;
  nomeCompleto: string;
  dataNascimento: string | null;
  sexo: string | null;
  cpf: string | null;
  rg: string | null;
  tipo: TipoVoluntario;
  etapaCatequese: string | null;
  eucaristiaAno: string | null;
  crismaAno: string | null;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  responsaveis: InscricaoResponsavelRequest[];
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  horarioEstudo: HorarioEstudo | null;
  observacoes: string | null;
  autorizaWhatsapp: boolean;
  funcoesHabilitadas: FuncaoEscala[];
}

export interface InscricaoResponsavelRequest {
  parentesco: string;
  parentescoInverso?: string | null;
  nome: string;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  principal: boolean;
}
