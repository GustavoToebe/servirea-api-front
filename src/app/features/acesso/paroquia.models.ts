export interface ContatoEmail {
  tipo: string;
  email: string;
  principal: boolean;
}

export interface ContatoTelefone {
  tipo: string;
  numero: string;
  principal: boolean;
}

export interface Paroquia {
  id: string;
  codigo: string;
  slug: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  diocese: string | null;
  status: string;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  endereco: Endereco | null;
}

/** Endereço da paróquia (27/09/2026); cidade e UF vão no subtítulo da lista de assinatura. */
export interface Endereco {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}

export interface Diocese {
  id: string;
  nome: string;
  uf: string | null;
}

export interface ParoquiaRequest {
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  diocese: string | null;
  emails: ContatoEmail[];
  telefones: ContatoTelefone[];
  endereco: Endereco;
}
