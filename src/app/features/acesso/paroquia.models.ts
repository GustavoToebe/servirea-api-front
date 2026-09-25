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
}
