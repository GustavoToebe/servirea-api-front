export interface AcaoCatalogo {
  codigo: string;
  nome: string;
}

export interface ModuloCatalogo {
  codigo: string;
  nome: string;
  acoes: AcaoCatalogo[];
}

export interface SecaoCatalogo {
  nome: string;
  modulos: ModuloCatalogo[];
}

export interface Perfil {
  id: string;
  nome: string;
  ativo: boolean;
  acessoTotal: boolean;
  sistema: boolean;
  usuarios: number;
  permissoes: string[];
}

export interface UsuarioParoquia {
  usuarioId: string;
  nome: string;
  email: string;
  tipoTelefone: string | null;
  telefone: string | null;
  perfilId: string | null;
  perfilNome: string | null;
  ativo: boolean;
  senhaDefinida: boolean;
  somenteLeitura: boolean;
  situacaoAcesso: string;
}

export interface MeuPerfil {
  id: string;
  nome: string;
  email: string;
  tipoTelefone: string | null;
  telefone: string | null;
  perfil: string;
}
