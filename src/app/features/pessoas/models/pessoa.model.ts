export type PessoaPapel = 'VOLUNTARIO' | 'RESPONSAVEL';
export type TipoVoluntario = 'COROINHA' | 'ACOLITO' | 'AMBOS';
export type FuncaoEscala = 'MISSAL' | 'CRUZ' | 'CREDENCIA' | 'VELA' | 'COLETA' | 'SINO' | 'OUTRO';
export type HorarioEstudo = 'MANHA' | 'TARDE' | 'NOITE';

export interface ContatoEmail {
  id?: string;
  tipo: string;
  email: string;
  principal: boolean;
}

export interface ContatoTelefone {
  id?: string;
  tipo: string;
  numero: string;
  principal: boolean;
}

/**
 * Relação vista da pessoa exibida/salva: `parentesco` é o que a OUTRA pessoa
 * é (Mãe, na lista de responsáveis; Filho, na de dependentes) e
 * `parentescoInverso` é o que ESTA pessoa é para ela. Mesmo sentido na
 * resposta e no request — dá para reenviar o que veio sem inverter nada.
 */
export interface Relacao {
  id?: string;
  pessoaId: string;
  nomeCompleto?: string;
  papeisOutro?: PessoaPapel[];
  parentesco: string;
  parentescoInverso?: string | null;
  principal: boolean;
}

export interface VoluntarioPerfil {
  tipo: TipoVoluntario;
  ativo: boolean;
  fotoPath?: string | null;
  etapaCatequese?: string | null;
  eucaristiaAno?: string | null;
  crismaAno?: string | null;
  horarioEstudo?: HorarioEstudo | null;
  autorizaWhatsapp: boolean;
  funcoesHabilitadas: FuncaoEscala[];
}

export interface Pessoa {
  id: string;
  papeis: PessoaPapel[];
  nomeCompleto: string;
  dataNascimento: string | null;
  sexo: string | null;
  cpf: string | null;
  rg: string | null;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  /** Quem responde por esta pessoa (só quando ela é VOLUNTARIO). */
  responsaveis: Relacao[];
  /** Por quem esta pessoa responde (só quando ela é RESPONSAVEL). */
  dependentes: Relacao[];
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  observacoes: string | null;
  voluntario: VoluntarioPerfil | null;
}

export interface PessoaRequest {
  papeis: PessoaPapel[];
  nomeCompleto: string;
  dataNascimento: string | null;
  sexo: string | null;
  cpf: string | null;
  rg: string | null;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  responsaveis: RelacaoRequest[];
  dependentes: RelacaoRequest[];
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  observacoes: string | null;
  voluntario: VoluntarioPerfil | null;
}

/** Informe `pessoaId` OU `novaPessoa` (esta só em `responsaveis`; criada na mesma transação). */
export interface RelacaoRequest {
  pessoaId?: string | null;
  novaPessoa?: NovaPessoaRequest | null;
  parentesco: string;
  parentescoInverso?: string | null;
  principal: boolean;
}

export interface NovaPessoaRequest {
  nomeCompleto: string;
  email?: string | null;
  telefone?: string | null;
}

export interface VoluntarioLista {
  id: string;
  nomeCompleto: string;
  nome_completo: string;
  tipo: TipoVoluntario;
  ativo: boolean;
  fotoPath: string | null;
  fotoUrl?: string | null;
  etapaCatequese: string | null;
  eucaristiaAno: string | null;
  crismaAno: string | null;
  horarioEstudo: HorarioEstudo | null;
  autorizaWhatsapp: boolean;
  funcoesHabilitadas: FuncaoEscala[];
  dataNascimento?: string | null;
}

export const FUNCOES_LABEL: Record<FuncaoEscala, string> = {
  MISSAL: 'Missal',
  CRUZ: 'Cruz',
  CREDENCIA: 'Credência',
  VELA: 'Vela',
  COLETA: 'Coleta',
  SINO: 'Sino',
  OUTRO: 'Outro'
};

export const TIPO_LABEL: Record<TipoVoluntario, string> = {
  COROINHA: 'Coroinha',
  ACOLITO: 'Acólito',
  AMBOS: 'Coroinha / Acólito'
};

export const PARENTESCOS = [
  'Pai', 'Mãe', 'Avô', 'Avó', 'Tio', 'Tia', 'Irmão', 'Irmã',
  'Padrinho', 'Madrinha', 'Responsável', 'Outro'
];

export const PARENTESCOS_DEPENDENTE = [
  'Filho', 'Filha', 'Neto', 'Neta', 'Sobrinho', 'Sobrinha', 'Irmão', 'Irmã',
  'Afilhado', 'Afilhada', 'Outro'
];

export const FUNCOES_FORM: FuncaoEscala[] = ['MISSAL', 'CRUZ', 'CREDENCIA', 'VELA', 'COLETA', 'SINO'];

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export function ageFromDate(date: string | null | undefined): number | null {
  if (!date) return null;
  const birth = new Date(`${date}T12:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function contatoPrincipalEmail(pessoa: Pessoa): string {
  return pessoa.emails.find(e => e.principal)?.email || pessoa.emails[0]?.email || '';
}

export function contatoPrincipalTelefone(pessoa: Pessoa): string {
  return pessoa.telefones.find(t => t.principal)?.numero || pessoa.telefones[0]?.numero || '';
}
