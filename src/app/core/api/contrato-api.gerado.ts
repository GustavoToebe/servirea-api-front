// GERADO por scripts/gerar-tipos-api.py a partir de servirea-api-back/docs/contrato-api.json. Não edite à mão.
/* eslint-disable */

export interface AccessTokenResponse {
  accessToken?: string | null;
  expiresInSeconds: number;
  tenantAtual?: TenantResumo | null;
}

export interface AcessosDependentesController_Autorizar {
  consulta?: boolean | null;
  resposta?: boolean | null;
  versao?: number | null;
}

export interface AcessosDependentesService_Autorizacao {
  consulta: boolean;
  nome?: string | null;
  pessoaId?: string | null;
  relacaoId?: string | null;
  resposta: boolean;
  versao: number;
}

export interface AcessosDependentesService_Dependente {
  nome?: string | null;
  pessoaId?: string | null;
  podeResponder: boolean;
}

export interface AlocacaoVagaRequest {
  voluntarioId?: string | null;
}

export interface AniversarianteResponse {
  dia?: number | null;
  id?: string | null;
  nome?: string | null;
}

export interface AniversarioDtos_Autorizacao {
  autorizado: boolean;
  canal?: TipoEnvio | null;
  fonte?: string | null;
  pessoaId?: string | null;
  registradoEm?: string | null;
  versao: number;
}

export interface AniversarioDtos_Autorizar {
  autorizado?: boolean | null;
  fonte?: string | null;
  versao?: number | null;
}

export interface AniversarioDtos_Config {
  agendadorAtivo: boolean;
  ativo: boolean;
  canal?: TipoEnvio | null;
  layoutId?: string | null;
  versao: number;
}

export interface AniversarioDtos_Configurar {
  ativo?: boolean | null;
  layoutId?: string | null;
  versao?: number | null;
}

export interface AniversarioDtos_OpcaoLayout {
  canal?: TipoEnvio | null;
  id?: string | null;
  nome?: string | null;
}

export interface AuditLogResponse {
  acao?: string | null;
  changedFields?: string[] | null;
  createdAt?: string | null;
  entidade?: string | null;
  entidadeId?: string | null;
  id?: string | null;
  ip?: string | null;
  requestId?: string | null;
  userId?: string | null;
}

export interface AvisoDtos_Confirmar {
  versao?: number | null;
}

export interface AvisoDtos_Conta {
  id?: string | null;
  nome?: string | null;
}

export interface AvisoDtos_Pagina {
  itens?: AvisoDtos_Resposta[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface AvisoDtos_Resposta {
  atualizadoEm?: string | null;
  criadoEm?: string | null;
  descricao?: string | null;
  destinatarios?: string[] | null;
  id?: string | null;
  leituras: number;
  lido: boolean;
  prazo?: string | null;
  publico?: Aviso_Publico | null;
  status?: Aviso_Status | null;
  titulo?: string | null;
  versao: number;
}

export interface AvisoDtos_Salvar {
  descricao?: string | null;
  destinatarios?: string[] | null;
  prazo?: string | null;
  publico?: Aviso_Publico | null;
  status?: Aviso_Status | null;
  titulo?: string | null;
  versao?: number | null;
}

export type Aviso_Publico = 'TODOS' | 'SELECIONADOS';

export type Aviso_Status = 'PUBLICADO' | 'ARQUIVADO';

export interface CalendarioService_Criada {
  expiraEm?: string | null;
  token?: string | null;
}

export interface CandidatoResponse {
  fotoPath?: string | null;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  id?: string | null;
  nomeCompleto?: string | null;
  tipo?: TipoVoluntario | null;
}

export interface CandidaturaDtos_Decisao {
  aprovar?: boolean | null;
  versao?: number | null;
}

export interface CandidaturaDtos_Pagina<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface CandidaturaDtos_Pedido {
  atualizadaEm?: string | null;
  celebracao?: string | null;
  criadaEm?: string | null;
  funcao?: string | null;
  id?: string | null;
  inicio?: string | null;
  pessoaNome?: string | null;
  situacao?: Candidatura_Situacao | null;
  vagaId?: string | null;
  versao: number;
  vigente: boolean;
}

export interface CandidaturaDtos_Vaga {
  celebracao?: string | null;
  elegivel: boolean;
  funcao?: string | null;
  impedimento?: string | null;
  inicio?: string | null;
  vagaId?: string | null;
  versao: number;
}

export interface CandidaturaDtos_Versao {
  versao?: number | null;
}

export type Candidatura_Situacao = 'PENDENTE' | 'APROVADA' | 'RECUSADA' | 'DESISTIDA' | 'EXPIRADA';

export interface CatalogoDeRecursos_RecursoDoApp {
  aplicado: boolean;
  codigo?: string | null;
  nome?: string | null;
  tipo?: CatalogoDeRecursos_Tipo | null;
  unidade?: string | null;
}

export type CatalogoDeRecursos_Tipo = 'LIMITE' | 'FUNCIONALIDADE';

export interface CatalogoPermissao_Acao {
  codigo?: string | null;
  nome?: string | null;
}

export interface CatalogoPermissao_Modulo {
  acoes?: CatalogoPermissao_Acao[] | null;
  codigo?: string | null;
  nome?: string | null;
}

export interface CatalogoPermissao_Secao {
  modulos?: CatalogoPermissao_Modulo[] | null;
  nome?: string | null;
}

export interface CheckinDtos_Aberto {
  expiraEm?: string | null;
  sessaoId?: string | null;
  token?: string | null;
}

export interface CheckinDtos_Abrir {
  minutos?: number | null;
}

export interface CheckinDtos_Estado {
  ativa: boolean;
  escalados: number;
  expiraEm?: string | null;
  presentes: number;
  registros?: CheckinDtos_Presente[] | null;
}

export interface CheckinDtos_Presente {
  funcao?: string | null;
  nome?: string | null;
  registradoEm?: string | null;
}

export interface CheckinDtos_Registrar {
  token?: string | null;
}

export interface CheckinDtos_Resultado {
  celebracao?: string | null;
  data?: string | null;
  funcao?: string | null;
  horario?: string | null;
  jaRegistrado: boolean;
}

export interface ColunaEscalaDto {
  alinhamento?: string | null;
  coluna?: number | null;
  conteudo?: string | null;
  escopo?: string | null;
  funcao?: FuncaoEscala | null;
  idLocal?: string | null;
  largura?: number | null;
  linha?: number | null;
  negrito?: boolean | null;
  ordem?: number | null;
  posicao: number;
  rotulo?: string | null;
  tipo?: string | null;
}

export interface CompromissoResponse {
  celebracao?: string | null;
  data?: string | null;
  escalaId?: string | null;
  escalaStatus?: StatusEscala | null;
  escalaTitulo?: string | null;
  funcao?: FuncaoEscala | null;
  horario?: string | null;
  voluntarioId?: string | null;
}

export interface ComunicadoDtos_AnexoLinha {
  id?: string | null;
  nome?: string | null;
  tamanho: number;
}

export interface ComunicadoDtos_Criado {
  id?: string | null;
  total: number;
}

export interface ComunicadoDtos_DestinatarioLinha {
  destino?: string | null;
  enviadoEm?: string | null;
  erro?: string | null;
  id?: string | null;
  nome?: string | null;
  status?: StatusEnvio | null;
}

export interface ComunicadoDtos_DestinatarioPrevia {
  autorizaWhatsapp?: boolean | null;
  destinos?: ComunicadoDtos_Destino[] | null;
  nome?: string | null;
  pessoaId?: string | null;
}

export interface ComunicadoDtos_DestinatariosRequest {
  canal?: TipoEnvio | null;
  contatos?: QuaisContatos | null;
  enviarPara?: EnviarPara | null;
  pessoaIds?: string[] | null;
}

export interface ComunicadoDtos_Destino {
  deQuem?: string | null;
  endereco?: string | null;
  nome?: string | null;
}

export interface ComunicadoDtos_Detalhe {
  anexos?: ComunicadoDtos_AnexoLinha[] | null;
  comunicado?: ComunicadoDtos_Resumo | null;
  destinatarios?: ComunicadoDtos_DestinatarioLinha[] | null;
}

export interface ComunicadoDtos_PreVisualizacao {
  assunto?: string | null;
  conteudo?: string | null;
  de?: string | null;
  para?: string | null;
}

export interface ComunicadoDtos_PreVisualizarRequest {
  assunto?: string | null;
  enviarPara?: EnviarPara | null;
  layoutId?: string | null;
  pessoaId?: string | null;
}

export interface ComunicadoDtos_Resumo {
  assunto?: string | null;
  canal?: TipoEnvio | null;
  concluidoEm?: string | null;
  createdAt?: string | null;
  enviados: number;
  enviarPara?: EnviarPara | null;
  falhas: number;
  id?: string | null;
  layoutNome?: string | null;
  status?: StatusComunicado | null;
  total: number;
}

export type CondicaoEspecial = 'SINDROME_DOWN' | 'TEA' | 'TDAH' | 'ANSIEDADE' | 'DEPRESSAO' | 'BORDERLINE' | 'OUTRA';

export interface ConsumoHistoricoService_Ponto {
  consumo?: CotasService_Consumo | null;
  dia?: string | null;
}

export interface ConsumoInstanciaService_Resposta {
  consumo?: CotasService_Consumo | null;
  contratacaoId?: string | null;
  funcionalidades?: string[] | null;
  tenantId?: string | null;
  versaoContrato: number;
}

export interface ContagemVoluntarios {
  ativos: number;
  inativos: number;
}

export interface ContatoEmailRequest {
  email?: string | null;
  principal: boolean;
  tipo?: string | null;
}

export interface ContatoEmailResponse {
  email?: string | null;
  id?: string | null;
  principal: boolean;
  tipo?: string | null;
}

export interface ContatoTelefoneRequest {
  numero?: string | null;
  principal: boolean;
  tipo?: string | null;
}

export interface ContatoTelefoneResponse {
  id?: string | null;
  numero?: string | null;
  principal: boolean;
  tipo?: string | null;
}

export interface CotasService_Consumo {
  consultadoEm?: string | null;
  direitosConfirmadosEm?: string | null;
  itens?: CotasService_Item[] | null;
  planoNome?: string | null;
  versaoDireitos?: number | null;
}

export interface CotasService_Item {
  codigo?: string | null;
  competencia?: string | null;
  disponivel?: number | null;
  estado?: string | null;
  limite?: number | null;
  nome?: string | null;
  pendentes: number;
  unidade?: string | null;
  usado: number;
}

export interface DioceseResponse {
  id?: string | null;
  nome?: string | null;
  uf?: string | null;
}

export interface DireitosInstancia {
  acessoLiberado: boolean;
  clienteId?: string | null;
  contratacaoId?: string | null;
  funcionalidades?: string[] | null;
  geradoEm?: string | null;
  limites?: Record<string, number> | null;
  motivoBloqueio?: string | null;
  plano?: DireitosInstancia_Plano | null;
  produto?: string | null;
  situacao?: string | null;
  tenantId?: string | null;
  versao: number;
  vigenteAte?: string | null;
}

export interface DireitosInstancia_Plano {
  codigo?: string | null;
  nome?: string | null;
}

export interface DisponibilidadeDtos_Bloqueio {
  data?: string | null;
  periodo?: Periodo | null;
}

export interface DisponibilidadeDtos_Resposta {
  ano: number;
  itens?: DisponibilidadeDtos_Bloqueio[] | null;
  mes: number;
  semRestricao: boolean;
  versao: number;
}

export interface DisponibilidadeDtos_Salvar {
  itens?: DisponibilidadeDtos_Bloqueio[] | null;
  semRestricao?: boolean | null;
  versao?: number | null;
}

export interface DisponibilidadeVoluntarioRequest {
  data?: string | null;
  diaSemana?: string | null;
  observacao?: string | null;
  periodo?: Periodo | null;
}

export interface DisponibilidadeVoluntarioResponse {
  data?: string | null;
  diaSemana?: string | null;
  id?: string | null;
  observacao?: string | null;
  periodo?: Periodo | null;
  voluntarioId?: string | null;
}

export interface DistribuicaoDtos_Aplicada {
  aplicadas: number;
  escalaId?: string | null;
  versao: number;
}

export interface DistribuicaoDtos_AplicarRequest {
  escolhas?: DistribuicaoDtos_Escolha[] | null;
  regras?: DistribuicaoDtos_Regras | null;
  versao?: number | null;
}

export interface DistribuicaoDtos_Conflito {
  alocacaoExistente: boolean;
  celebracao?: string | null;
  data?: string | null;
  descartes?: DistribuicaoDtos_Descarte[] | null;
  eventoId?: string | null;
  explicacao?: string | null;
  funcao?: FuncaoEscala | null;
  horario?: string | null;
  vagaId?: string | null;
}

export interface DistribuicaoDtos_Descarte {
  codigo?: string | null;
  motivo?: string | null;
  quantidade: number;
}

export interface DistribuicaoDtos_Escolha {
  pessoaId?: string | null;
  vagaId?: string | null;
}

export interface DistribuicaoDtos_Previa {
  bloqueado: boolean;
  conflitos?: DistribuicaoDtos_Conflito[] | null;
  escalaId?: string | null;
  sugestoes?: DistribuicaoDtos_Sugestao[] | null;
  vagasVazias: number;
  versao: number;
}

export interface DistribuicaoDtos_PreviaRequest {
  regras?: DistribuicaoDtos_Regras | null;
}

export interface DistribuicaoDtos_Regras {
  exigirResposta: boolean;
  intervaloDias: number;
  maximoPorPessoa: number;
}

export interface DistribuicaoDtos_Sugestao {
  celebracao?: string | null;
  data?: string | null;
  eventoId?: string | null;
  explicacao?: string | null;
  funcao?: FuncaoEscala | null;
  horario?: string | null;
  nome?: string | null;
  pessoaId?: string | null;
  vagaId?: string | null;
}

export interface DuplicidadeRequest {
  cpf?: string | null;
  dataNascimento?: string | null;
  ignorarId?: string | null;
  nomeCompleto?: string | null;
  nomesResponsaveis?: string[] | null;
  telefones?: string[] | null;
}

export interface DuplicidadeResponse {
  bloqueia: boolean;
  dataNascimento?: string | null;
  id?: string | null;
  motivos?: string[] | null;
  nomeCompleto?: string | null;
  sequencial?: number | null;
}

export interface EnderecoDto {
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  uf?: string | null;
}

export type EnviarPara = 'PESSOA' | 'RESPONSAVEIS' | 'AMBOS';

export interface EscalaEventoRequest {
  celebracao?: string | null;
  data?: string | null;
  horario?: string | null;
  referencia?: boolean | null;
  vagas?: EscalaVagaRequest[] | null;
}

export interface EscalaEventoResponse {
  celebracao?: string | null;
  data?: string | null;
  horario?: string | null;
  id?: string | null;
  referencia: boolean;
  vagas?: EscalaVagaResponse[] | null;
}

export interface EscalaRequest {
  ano?: number | null;
  colunas?: ColunaEscalaDto[] | null;
  eventos?: EscalaEventoRequest[] | null;
  layoutId?: string | null;
  mes?: number | null;
  observacao?: string | null;
  tipo?: TipoEscala | null;
  titulo?: string | null;
  version?: number | null;
}

export interface EscalaResponse {
  ano?: number | null;
  colunas?: ColunaEscalaDto[] | null;
  createdBy?: string | null;
  eventos?: EscalaEventoResponse[] | null;
  id?: string | null;
  layoutId?: string | null;
  mes?: number | null;
  observacao?: string | null;
  sequencial?: number | null;
  status?: StatusEscala | null;
  tipo?: TipoEscala | null;
  titulo?: string | null;
  version?: number | null;
}

export interface EscalaVagaRequest {
  funcao?: FuncaoEscala | null;
  posicao: number;
  voluntarioId?: string | null;
}

export interface EscalaVagaResponse {
  funcao?: FuncaoEscala | null;
  id?: string | null;
  posicao: number;
  presenca?: Presenca | null;
  voluntarioId?: string | null;
  voluntarioNome?: string | null;
}

export interface EstoqueDtos_Item {
  ativo: boolean;
  codigo?: string | null;
  id?: string | null;
  local?: string | null;
  nome?: string | null;
  responsavelNome?: string | null;
  responsavelUsuarioId?: string | null;
  saldo?: number | null;
  tipo?: string | null;
  unidade?: string | null;
  versao: number;
}

export interface EstoqueDtos_Movimentar {
  chave?: string | null;
  motivo?: string | null;
  quantidade?: number | null;
  responsavelUsuarioId?: string | null;
  tipo?: string | null;
  versao: number;
}

export interface EstoqueDtos_Movimento {
  chave?: string | null;
  id?: string | null;
  itemId?: string | null;
  motivo?: string | null;
  quantidade?: number | null;
  registradoEm?: string | null;
  registradoPor?: string | null;
  registradoPorNome?: string | null;
  responsavelNome?: string | null;
  responsavelUsuarioId?: string | null;
  saldoAntes?: number | null;
  saldoDepois?: number | null;
  tipo?: string | null;
}

export interface EstoqueDtos_Pagina<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface EstoqueDtos_Responsavel {
  id?: string | null;
  nome?: string | null;
}

export interface EstoqueDtos_Salvar {
  ativo: boolean;
  codigo?: string | null;
  local?: string | null;
  nome?: string | null;
  responsavelUsuarioId?: string | null;
  tipo?: string | null;
  unidade?: string | null;
  versao: number;
}

export type EtapaOnboarding = 'PAROQUIA' | 'CONVITE' | 'PESSOAS' | 'VOLUNTARIOS' | 'ESCALA';

export interface EventoDtos_CancelarRequest {
  avisarInscritos: boolean;
}

export interface EventoDtos_EventoDetalhe {
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  descricao?: string | null;
  emailHabilitado: boolean;
  emailLayoutConfirmacaoId?: string | null;
  emailLayoutLembreteId?: string | null;
  fotos?: EventoDtos_FotoResponse[] | null;
  id?: string | null;
  inicio?: string | null;
  inscritos?: EventoDtos_InscritoResponse[] | null;
  lembreteDias?: number[] | null;
  localNome?: string | null;
  logradouro?: string | null;
  mapaUrl?: string | null;
  mensagemConfirmacao?: string | null;
  mensagemLembrete?: string | null;
  numero?: string | null;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  situacao?: EventoDtos_SituacaoTela | null;
  tags?: Record<string, string> | null;
  termino?: string | null;
  titulo?: string | null;
  uf?: string | null;
  vagas?: number | null;
  whatsappHabilitado: boolean;
  whatsappLayoutConfirmacaoId?: string | null;
  whatsappLayoutLembreteId?: string | null;
}

export interface EventoDtos_EventoRequest {
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  descricao?: string | null;
  emailHabilitado?: boolean | null;
  emailLayoutConfirmacaoId?: string | null;
  emailLayoutLembreteId?: string | null;
  inicio?: string | null;
  lembreteDias?: number[] | null;
  localNome?: string | null;
  logradouro?: string | null;
  mapaUrl?: string | null;
  mensagemConfirmacao?: string | null;
  mensagemLembrete?: string | null;
  numero?: string | null;
  responsavelNome?: string | null;
  responsavelTelefone?: string | null;
  termino?: string | null;
  titulo?: string | null;
  uf?: string | null;
  vagas?: number | null;
  whatsappHabilitado?: boolean | null;
  whatsappLayoutConfirmacaoId?: string | null;
  whatsappLayoutLembreteId?: string | null;
}

export interface EventoDtos_EventoResumo {
  capaUrl?: string | null;
  id?: string | null;
  inicio?: string | null;
  inscritos: number;
  localNome?: string | null;
  situacao?: EventoDtos_SituacaoTela | null;
  termino?: string | null;
  titulo?: string | null;
  vagas?: number | null;
}

export interface EventoDtos_FotoResponse {
  capa: boolean;
  id?: string | null;
  url?: string | null;
}

export interface EventoDtos_InscreverRequest {
  pessoaId?: string | null;
}

export interface EventoDtos_InscritoResponse {
  confirmacao?: EventoDtos_SituacaoMensagem | null;
  confirmacaoEmail?: EventoDtos_SituacaoMensagem | null;
  confirmacaoWhatsapp?: EventoDtos_SituacaoMensagem | null;
  email?: string | null;
  id?: string | null;
  lembrete?: EventoDtos_SituacaoMensagem | null;
  lembreteEmail?: EventoDtos_SituacaoMensagem | null;
  lembreteWhatsapp?: EventoDtos_SituacaoMensagem | null;
  nome?: string | null;
  pessoaId?: string | null;
  telefone?: string | null;
}

export type EventoDtos_SituacaoMensagem = 'PENDENTE' | 'ENVIADA' | 'FALHOU' | 'SEM_AUTORIZACAO' | 'SEM_TELEFONE' | 'SEM_EMAIL';

export type EventoDtos_SituacaoTela = 'RASCUNHO' | 'PUBLICADO' | 'ENCERRADO' | 'CANCELADO';

export interface FinanceiroDtos_BaixaRequest {
  dataPagamento?: string | null;
  versao?: number | null;
}

export interface FinanceiroDtos_CategoriaRequest {
  ativo: boolean;
  nome?: string | null;
}

export interface FinanceiroDtos_CategoriaResponse {
  ativo: boolean;
  id?: string | null;
  nome?: string | null;
}

export interface FinanceiroDtos_ContaRequest {
  ativo: boolean;
  dataSaldoInicial?: string | null;
  nome?: string | null;
  saldoInicial?: number | null;
}

export interface FinanceiroDtos_ContaResponse {
  ativo: boolean;
  dataSaldoInicial?: string | null;
  id?: string | null;
  nome?: string | null;
  saldoInicial?: number | null;
}

export interface FinanceiroDtos_MovimentoRequest {
  categoriaId?: string | null;
  contaId?: string | null;
  descricao?: string | null;
  observacoes?: string | null;
  tipo?: MovimentoFinanceiro_Tipo | null;
  valor?: number | null;
  vencimento?: string | null;
  versao?: number | null;
}

export interface FinanceiroDtos_MovimentoResponse {
  categoria?: string | null;
  categoriaId?: string | null;
  conta?: string | null;
  contaId?: string | null;
  dataPagamento?: string | null;
  descricao?: string | null;
  id?: string | null;
  observacoes?: string | null;
  situacao?: MovimentoFinanceiro_Situacao | null;
  tipo?: MovimentoFinanceiro_Tipo | null;
  valor?: number | null;
  vencimento?: string | null;
  versao: number;
}

export interface FinanceiroDtos_Pagina {
  itens?: FinanceiroDtos_MovimentoResponse[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface FinanceiroDtos_Resumo {
  ate?: string | null;
  contas?: FinanceiroDtos_SaldoConta[] | null;
  de?: string | null;
  despesas?: number | null;
  receitas?: number | null;
  resultado?: number | null;
  saldoTotal?: number | null;
}

export interface FinanceiroDtos_SaldoConta {
  id?: string | null;
  nome?: string | null;
  saldo?: number | null;
}

export interface FinanceiroDtos_VersaoRequest {
  versao?: number | null;
}

export interface ForgotPasswordRequest {
  email?: string | null;
}

export interface FotoUrlResponse {
  url?: string | null;
}

export type FuncaoEscala = 'MISSAL' | 'CRUZ' | 'CREDENCIA' | 'VELA' | 'COLETA' | 'SINO' | 'OUTRO';

export interface ImportacaoPessoaDtos_Aba {
  indice: number;
  nome?: string | null;
}

export interface ImportacaoPessoaDtos_Coluna {
  indice: number;
  titulo?: string | null;
}

export interface ImportacaoPessoaDtos_Estrutura {
  aba: number;
  abas?: ImportacaoPessoaDtos_Aba[] | null;
  colunas?: ImportacaoPessoaDtos_Coluna[] | null;
  linhaCabecalho: number;
  sugestao?: Record<string, number> | null;
}

export interface ImportacaoPessoaDtos_Linha {
  cpf?: string | null;
  email?: string | null;
  erro?: string | null;
  linha: number;
  nome?: string | null;
  papel?: string | null;
  telefone?: string | null;
}

export interface ImportacaoPessoaDtos_Previa {
  hash?: string | null;
  linhas?: ImportacaoPessoaDtos_Linha[] | null;
  podeConfirmar: boolean;
  quantidade: number;
}

export interface ImportacaoPessoaDtos_Resultado {
  id?: string | null;
  quantidade: number;
  repetida: boolean;
}

export interface IndicadoresService_Contagens {
  alocacoes: number;
  confirmacoes: number;
  faltas: number;
  presencasPendentes: number;
  presentes: number;
  recusas: number;
}

export interface IndicadoresService_Pagina {
  itens?: IndicadoresService_Pessoa[] | null;
  pagina: number;
  resumo?: IndicadoresService_Contagens | null;
  tamanho: number;
  total: number;
}

export interface IndicadoresService_Pessoa {
  contagens?: IndicadoresService_Contagens | null;
  nome?: string | null;
  pessoaId?: string | null;
}

export interface IndisponibilidadeDtos_ApoioEscala {
  voluntarios?: IndisponibilidadeDtos_ApoioVoluntario[] | null;
}

export interface IndisponibilidadeDtos_ApoioVoluntario {
  indisponiveis?: IndisponibilidadeDtos_Indisponivel[] | null;
  irmaos?: string[] | null;
  situacao?: IndisponibilidadeDtos_Situacao | null;
  voluntarioId?: string | null;
}

export interface IndisponibilidadeDtos_Indisponivel {
  data?: string | null;
  periodo?: Periodo | null;
}

export interface IndisponibilidadeDtos_Item {
  data?: string | null;
  observacao?: string | null;
  periodo?: Periodo | null;
  voluntarioId?: string | null;
}

export interface IndisponibilidadeDtos_MesRequest {
  itens?: IndisponibilidadeDtos_Item[] | null;
  semRestricao?: string[] | null;
  versao?: number | null;
}

export interface IndisponibilidadeDtos_MesResponse {
  ano: number;
  itens?: IndisponibilidadeDtos_Item[] | null;
  mes: number;
  semRestricao?: string[] | null;
  versao: number;
}

export type IndisponibilidadeDtos_Situacao = 'COM_RESTRICAO' | 'SEM_RESTRICAO' | 'PENDENTE';

export interface InscricaoAtualizarRequest {
  autorizaWhatsapp: boolean;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  condicaoOutra?: string | null;
  condicoes?: CondicaoEspecial[] | null;
  cpf?: string | null;
  crismaAno?: string | null;
  cuidados?: string | null;
  dataNascimento?: string | null;
  emails?: ContatoEmailRequest[] | null;
  etapaCatequese?: string | null;
  eucaristiaAno?: string | null;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  horarioEstudo?: Voluntario_HorarioEstudo | null;
  nivelSuporteTea?: number | null;
  nomeCompleto?: string | null;
  numero?: string | null;
  observacoes?: string | null;
  responsaveis?: InscricaoResponsavelRequest[] | null;
  rg?: string | null;
  rua?: string | null;
  sexo?: string | null;
  telefones?: ContatoTelefoneRequest[] | null;
  tipo?: TipoVoluntario | null;
  uf?: string | null;
}

export interface InscricaoRejeitarRequest {
  motivo?: string | null;
}

export interface InscricaoResponsavelRequest {
  emails?: ContatoEmailRequest[] | null;
  nome?: string | null;
  parentesco?: string | null;
  parentescoInverso?: string | null;
  principal: boolean;
  telefones?: ContatoTelefoneRequest[] | null;
}

export interface InscricaoResponsavelResponse {
  emails?: ContatoEmailResponse[] | null;
  id?: string | null;
  nome?: string | null;
  parentesco?: string | null;
  parentescoInverso?: string | null;
  principal: boolean;
  telefones?: ContatoTelefoneResponse[] | null;
}

export interface InscricaoResponse {
  aprovadoPor?: string | null;
  autorizaWhatsapp: boolean;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  condicaoOutra?: string | null;
  condicoes?: CondicaoEspecial[] | null;
  consentimentoCuidadosEm?: string | null;
  cpf?: string | null;
  crismaAno?: string | null;
  cuidados?: string | null;
  dataAprovacao?: string | null;
  dataNascimento?: string | null;
  dataRejeicao?: string | null;
  emails?: ContatoEmailResponse[] | null;
  etapaCatequese?: string | null;
  eucaristiaAno?: string | null;
  fotoPath?: string | null;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  horarioEstudo?: Voluntario_HorarioEstudo | null;
  id?: string | null;
  motivoRejeicao?: string | null;
  nivelSuporteTea?: number | null;
  nomeCompleto?: string | null;
  numero?: string | null;
  observacoes?: string | null;
  rejeitadoPor?: string | null;
  responsaveis?: InscricaoResponsavelResponse[] | null;
  rg?: string | null;
  rua?: string | null;
  sequencial?: number | null;
  sexo?: string | null;
  status?: StatusInscricao | null;
  telefones?: ContatoTelefoneResponse[] | null;
  tipo?: TipoVoluntario | null;
  uf?: string | null;
  voluntarioId?: string | null;
}

export interface IntegracaoController_Operador {
  email?: string | null;
  id?: string | null;
  nome?: string | null;
}

export interface IntegracaoController_SuportePedido {
  motivo?: string | null;
  operador?: IntegracaoController_Operador | null;
}

export interface LayoutEscalaDto {
  ativo?: boolean | null;
  colunas?: ColunaEscalaDto[] | null;
  descricao?: string | null;
  id?: string | null;
  nome?: string | null;
  padrao?: boolean | null;
  sistema: boolean;
  tipo?: TipoEscala | null;
}

export interface LayoutRequest {
  assunto?: string | null;
  ativo: boolean;
  conteudo?: string | null;
  nome?: string | null;
  tipoEnvio?: TipoEnvio | null;
  tipoLayout?: TipoLayout | null;
}

export interface LayoutResponse {
  assunto?: string | null;
  ativo: boolean;
  conteudo?: string | null;
  id?: string | null;
  nome?: string | null;
  tipoEnvio?: TipoEnvio | null;
  tipoLayout?: TipoLayout | null;
}

export interface LiturgiaDtos_Pagina<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface LiturgiaDtos_Passo {
  observacao?: string | null;
  referenciaId?: string | null;
  titulo?: string | null;
}

export interface LiturgiaDtos_Referencia {
  ativo: boolean;
  fonte?: string | null;
  id?: string | null;
  observacao?: string | null;
  titulo?: string | null;
  url?: string | null;
  versao: number;
}

export interface LiturgiaDtos_ReferenciaSalvar {
  ativo: boolean;
  fonte?: string | null;
  observacao?: string | null;
  titulo?: string | null;
  url?: string | null;
  versao: number;
}

export interface LiturgiaDtos_Roteiro {
  ativo: boolean;
  celebracao?: string | null;
  id?: string | null;
  passos?: LiturgiaDtos_Passo[] | null;
  titulo?: string | null;
  versao: number;
}

export interface LiturgiaDtos_RoteiroSalvar {
  ativo: boolean;
  celebracao?: string | null;
  passos?: LiturgiaDtos_Passo[] | null;
  titulo?: string | null;
  versao: number;
}

export interface LoginRequest {
  codigoMfa?: string | null;
  email?: string | null;
  senha?: string | null;
}

export interface LoginResponse {
  accessToken?: string | null;
  expiresInSeconds?: number | null;
  precisaSelecionarTenant: boolean;
  tenantAtual?: TenantResumo | null;
  tenantsDisponiveis?: TenantResumo[] | null;
  tokenSelecaoTenant?: string | null;
}

export interface MeRequest {
  codigoMfa?: string | null;
  nome?: string | null;
  senha?: string | null;
  senhaAtual?: string | null;
  telefone?: string | null;
  tipoTelefone?: string | null;
}

export interface MeResponse {
  email?: string | null;
  id?: string | null;
  nome?: string | null;
  perfil?: string | null;
  permissoes?: string[] | null;
  telefone?: string | null;
  tipoTelefone?: string | null;
}

export type MembroPastoral_Papel = 'MEMBRO' | 'COORDENADOR';

export interface MfaController_Confirmacao {
  codigo?: string | null;
  senha?: string | null;
}

export interface MfaController_Senha {
  senha?: string | null;
}

export interface MfaService_Preparacao {
  expiraEm?: string | null;
  segredo?: string | null;
}

export interface MfaService_Recuperacao {
  codigos?: string[] | null;
}

export interface MfaService_Status {
  ativo: boolean;
  codigosRestantes: number;
  configurado: boolean;
}

export type MovimentoFinanceiro_Situacao = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export type MovimentoFinanceiro_Tipo = 'RECEITA' | 'DESPESA';

export interface NotificacaoDtos_AvisoRequest {
  canal?: TipoEnvio | null;
  versao?: number | null;
}

export interface NotificacaoDtos_Config {
  ativo: boolean;
  canal?: TipoEnvio | null;
  origem?: OrigemNotificacao | null;
  versao: number;
}

export interface NotificacaoDtos_Configurar {
  ativo: boolean;
  versao?: number | null;
}

export interface NotificacaoDtos_Entrega {
  canal?: TipoEnvio | null;
  criadoEm?: string | null;
  enviados: number;
  falhas: number;
  gatilho?: NotificacaoEntrega_Gatilho | null;
  id?: string | null;
  ignorados: number;
  origem?: OrigemNotificacao | null;
  pendentes: number;
  referenciaId?: string | null;
  referenciaVersao: number;
  titulo?: string | null;
  total: number;
}

export interface NotificacaoDtos_EscalaRequest {
  canal?: TipoEnvio | null;
}

export interface NotificacaoDtos_Pagina {
  itens?: NotificacaoDtos_Entrega[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface NotificacaoDtos_Resultado {
  entregaId?: string | null;
  ignorados: number;
  total: number;
}

export type NotificacaoEntrega_Gatilho = 'MANUAL' | 'AUTOMATICO';

export interface NovaPessoaRequest {
  email?: string | null;
  nomeCompleto?: string | null;
  telefone?: string | null;
}

export type OnboardingDtos_Acao = 'CONCLUIR' | 'REABRIR' | 'PULAR';

export interface OnboardingDtos_Etapa {
  codigo?: EtapaOnboarding | null;
  orientacao?: string | null;
  permissao?: string | null;
  podeConcluir: boolean;
  podePular: boolean;
  podeReabrir: boolean;
  situacao?: OnboardingDtos_Situacao | null;
  titulo?: string | null;
  url?: string | null;
}

export interface OnboardingDtos_Resposta {
  atualizadoEm?: string | null;
  concluidas: number;
  etapas?: OnboardingDtos_Etapa[] | null;
  iniciadoEm?: string | null;
  percentual: number;
  proximaEtapa?: EtapaOnboarding | null;
  total: number;
  versao: number;
}

export interface OnboardingDtos_Salvar {
  acao?: OnboardingDtos_Acao | null;
  versao?: number | null;
}

export type OnboardingDtos_Situacao = 'PENDENTE' | 'PRONTA' | 'CONCLUIDA' | 'DISPENSADA' | 'REVISAR' | 'SEM_PERMISSAO' | 'NAO_CONTRATADA';

export type OrigemNotificacao = 'ESCALA' | 'MURAL' | 'ESCALA_LEMBRETE';

export interface PaginaLista<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  paginas: number;
  tamanho: number;
  total: number;
}

export interface PainelVoluntarios {
  acolitos: number;
  ativos: number;
  coroinhas: number;
  mandatosAVencer: number;
  mesc: number;
}

export interface ParticipacaoDtos_Linha {
  celebracao?: string | null;
  data?: string | null;
  escala?: string | null;
  funcao?: FuncaoEscala | null;
  horario?: string | null;
  pessoa?: string | null;
  presenca?: Presenca | null;
  resposta?: RespostaParticipacao | null;
  vagaId?: string | null;
}

export interface ParticipacaoDtos_Pagina {
  itens?: ParticipacaoDtos_Linha[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface PastoralController_Ativo {
  ativo?: boolean | null;
  versao?: number | null;
}

export interface PastoralDtos_Equipe {
  ativo: boolean;
  descricao?: string | null;
  id?: string | null;
  nome?: string | null;
  versao: number;
}

export interface PastoralDtos_Membro {
  ativo: boolean;
  id?: string | null;
  nome?: string | null;
  papel?: MembroPastoral_Papel | null;
  pessoaId?: string | null;
  versao: number;
}

export interface PastoralDtos_Pagina<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface PastoralDtos_PessoaOpcao {
  id?: string | null;
  nome?: string | null;
}

export interface PastoralDtos_SalvarEquipe {
  ativo?: boolean | null;
  descricao?: string | null;
  nome?: string | null;
  versao?: number | null;
}

export interface PastoralDtos_SalvarMembro {
  ativo?: boolean | null;
  papel?: MembroPastoral_Papel | null;
  pessoaId?: string | null;
  versao?: number | null;
}

export interface PerfilRequest {
  acessoTotal: boolean;
  ativo: boolean;
  nome?: string | null;
  permissoes?: string[] | null;
}

export interface PerfilResponse {
  acessoTotal: boolean;
  ativo: boolean;
  id?: string | null;
  nome?: string | null;
  permissoes?: string[] | null;
  sequencial?: number | null;
  sistema: boolean;
  usuarios: number;
}

export type Periodo = 'MANHA' | 'TARDE' | 'NOITE';

export type PessoaPapel = 'VOLUNTARIO' | 'RESPONSAVEL';

export interface PessoaRequest {
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  condicaoOutra?: string | null;
  condicoes?: CondicaoEspecial[] | null;
  cpf?: string | null;
  cuidados?: string | null;
  dataNascimento?: string | null;
  dependentes?: RelacaoRequest[] | null;
  emails?: ContatoEmailRequest[] | null;
  logradouro?: string | null;
  nivelSuporteTea?: number | null;
  nomeCompleto?: string | null;
  numero?: string | null;
  observacoes?: string | null;
  papeis?: PessoaPapel[] | null;
  responsaveis?: RelacaoRequest[] | null;
  rg?: string | null;
  sexo?: string | null;
  telefones?: ContatoTelefoneRequest[] | null;
  uf?: string | null;
  voluntario?: VoluntarioPerfilRequest | null;
}

export interface PessoaResponse {
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  complemento?: string | null;
  condicaoOutra?: string | null;
  condicoes?: CondicaoEspecial[] | null;
  cpf?: string | null;
  cuidados?: string | null;
  dataNascimento?: string | null;
  dependentes?: RelacaoResponse[] | null;
  emails?: ContatoEmailResponse[] | null;
  id?: string | null;
  logradouro?: string | null;
  nivelSuporteTea?: number | null;
  nomeCompleto?: string | null;
  numero?: string | null;
  observacoes?: string | null;
  papeis?: PessoaPapel[] | null;
  responsaveis?: RelacaoResponse[] | null;
  rg?: string | null;
  sequencial?: number | null;
  sexo?: string | null;
  telefones?: ContatoTelefoneResponse[] | null;
  uf?: string | null;
  voluntario?: VoluntarioPerfilResponse | null;
}

export interface PessoaService_Opcao {
  id?: string | null;
  nomeCompleto?: string | null;
  responsavel: boolean;
  sequencial?: number | null;
  voluntario: boolean;
}

export interface PessoaService_Resumo {
  ativos: number;
  inativos: number;
  pendentes: number;
  pessoas: number;
}

export interface PortalService_Compromisso {
  funcao?: string | null;
  id?: string | null;
  inicio?: string | null;
  local?: string | null;
  prazoResposta?: string | null;
  respondidoEm?: string | null;
  resposta?: RespostaParticipacao | null;
  termino?: string | null;
  tipo?: string | null;
  titulo?: string | null;
  vagaId?: string | null;
  versao?: number | null;
}

export interface PortalService_Resposta {
  compromissos?: PortalService_Compromisso[] | null;
  vinculado: boolean;
}

export interface PreVisualizacaoResponse {
  assunto?: string | null;
  conteudo?: string | null;
}

export interface PreVisualizarRequest {
  assunto?: string | null;
  conteudo?: string | null;
  tipoEnvio?: TipoEnvio | null;
  tipoLayout?: TipoLayout | null;
}

export type Presenca = 'PENDENTE' | 'PRESENTE' | 'FALTOU';

export interface PresencaRequest {
  presenca?: Presenca | null;
}

export interface PrivacidadeDtos_AtualizarRetencao {
  comunicadosDias?: number | null;
  versao?: number | null;
}

export interface PrivacidadeDtos_ComunicacaoExport {
  assunto?: string | null;
  canal?: string | null;
  enviadoEm?: string | null;
  origem?: string | null;
  situacao?: string | null;
}

export interface PrivacidadeDtos_ConsentimentoItem {
  concedido: boolean;
  fonte?: string | null;
  registradoEm?: string | null;
  tipo?: Privacidade_TipoConsentimento | null;
}

export interface PrivacidadeDtos_ContatoExport {
  principal: boolean;
  tipo?: string | null;
  valor?: string | null;
}

export interface PrivacidadeDtos_CuidadosExport {
  condicaoOutra?: string | null;
  condicoes?: string[] | null;
  cuidados?: string | null;
  nivelSuporteTea?: number | null;
}

export interface PrivacidadeDtos_ExecucaoItem {
  comunicadosAnonimizados: number;
  corte?: string | null;
  executadoEm?: string | null;
}

export interface PrivacidadeDtos_ExecutarRetencao {
  versao?: number | null;
}

export interface PrivacidadeDtos_Exportacao {
  comunicacoes?: PrivacidadeDtos_ComunicacaoExport[] | null;
  consentimentos?: PrivacidadeDtos_ConsentimentoItem[] | null;
  cpf?: string | null;
  cuidados?: PrivacidadeDtos_CuidadosExport | null;
  dataNascimento?: string | null;
  dependentes?: PrivacidadeDtos_RelacaoExport[] | null;
  emails?: PrivacidadeDtos_ContatoExport[] | null;
  endereco?: string | null;
  geradaEm?: string | null;
  nome?: string | null;
  observacoes?: string | null;
  papeis?: string[] | null;
  participacoes?: PrivacidadeDtos_ParticipacaoExport[] | null;
  pessoaId?: string | null;
  responsaveis?: PrivacidadeDtos_RelacaoExport[] | null;
  rg?: string | null;
  sequencial?: number | null;
  sexo?: string | null;
  telefones?: PrivacidadeDtos_ContatoExport[] | null;
  voluntario?: PrivacidadeDtos_VoluntarioExport | null;
}

export interface PrivacidadeDtos_PaginaConsentimentos {
  itens?: PrivacidadeDtos_ConsentimentoItem[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface PrivacidadeDtos_ParticipacaoExport {
  celebracao?: string | null;
  data?: string | null;
  funcao?: string | null;
  horario?: string | null;
  presenca?: string | null;
  resposta?: string | null;
}

export interface PrivacidadeDtos_RelacaoExport {
  parentesco?: string | null;
  pessoa?: string | null;
  principal: boolean;
}

export interface PrivacidadeDtos_ResultadoRetencao {
  comunicadosAnonimizados: number;
  corte?: string | null;
}

export interface PrivacidadeDtos_Retencao {
  comunicadosDias?: number | null;
  elegiveis: number;
  execucoes?: PrivacidadeDtos_ExecucaoItem[] | null;
  versao: number;
}

export interface PrivacidadeDtos_VoluntarioExport {
  ativo: boolean;
  autorizaWhatsapp: boolean;
  funcoes?: string[] | null;
  tipo?: string | null;
}

export type Privacidade_TipoConsentimento = 'WHATSAPP' | 'ANIVERSARIO_EMAIL' | 'ANIVERSARIO_WHATSAPP';

export interface ProvisionarInstanciaRequest {
  administrador?: ProvisionarInstanciaRequest_Administrador | null;
  clienteId?: string | null;
  contratacaoId?: string | null;
  direitos?: DireitosInstancia | null;
  instancia?: ProvisionarInstanciaRequest_Instancia | null;
}

export interface ProvisionarInstanciaRequest_Administrador {
  email?: string | null;
  nome?: string | null;
}

export interface ProvisionarInstanciaRequest_Instancia {
  nome?: string | null;
  slug?: string | null;
}

export type QuaisContatos = 'PRINCIPAL' | 'TODOS';

export interface ReconciliadorArmazenamento_Resultado {
  conferidos: number;
  falhas: number;
  pendentes: number;
  proximoInicio: number;
}

export interface RefreshRequest {
  tenantId?: string | null;
}

export interface RelacaoRequest {
  novaPessoa?: NovaPessoaRequest | null;
  parentesco?: string | null;
  parentescoInverso?: string | null;
  pessoaId?: string | null;
  principal: boolean;
}

export interface RelacaoResponse {
  id?: string | null;
  nomeCompleto?: string | null;
  papeisOutro?: PessoaPapel[] | null;
  parentesco?: string | null;
  parentescoInverso?: string | null;
  pessoaId?: string | null;
  principal: boolean;
}

export interface ResetPasswordRequest {
  codigoMfa?: string | null;
  novaSenha?: string | null;
  token?: string | null;
}

export interface RespostaEscalaDtos_Atual {
  respondidoEm?: string | null;
  resposta?: RespostaParticipacao | null;
  versao: number;
}

export interface RespostaEscalaDtos_Historico {
  id?: string | null;
  respondidoEm?: string | null;
  resposta?: RespostaParticipacao | null;
  versao: number;
}

export interface RespostaEscalaDtos_Item {
  celebracao?: string | null;
  funcao?: string | null;
  inicio?: string | null;
  pessoaNome?: string | null;
  respondidoEm?: string | null;
  resposta?: RespostaParticipacao | null;
  vagaId?: string | null;
}

export interface RespostaEscalaDtos_Pagina<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface RespostaEscalaDtos_Responder {
  resposta?: RespostaParticipacao | null;
  versao?: number | null;
}

export type RespostaParticipacao = 'PENDENTE' | 'CONFIRMADA' | 'RECUSADA';

export interface SelectTenantRequest {
  tenantId?: string | null;
  tokenSelecaoTenant?: string | null;
}

export interface SiteDtos_Bloco {
  local?: string | null;
  quando?: string | null;
  texto?: string | null;
  tipo?: SiteDtos_Tipo | null;
  titulo?: string | null;
}

export interface SiteDtos_Dados {
  apresentacao?: string | null;
  blocos?: SiteDtos_Bloco[] | null;
  contato?: string | null;
  endereco?: string | null;
  horarios?: string | null;
  titulo?: string | null;
}

export interface SiteDtos_Estado {
  publicado?: SiteDtos_Dados | null;
  publicadoEm?: string | null;
  rascunho?: SiteDtos_Dados | null;
  slug?: string | null;
  versao: number;
}

export interface SiteDtos_Publicar {
  confirmar?: boolean | null;
  versao?: number | null;
}

export interface SiteDtos_Revisao {
  versao?: number | null;
}

export interface SiteDtos_Salvar {
  dados?: SiteDtos_Dados | null;
  versao?: number | null;
}

export type SiteDtos_Tipo = 'AVISO' | 'EVENTO';

export type StatusComunicado = 'NA_FILA' | 'ENVIANDO' | 'CONCLUIDO';

export type StatusEnvio = 'PENDENTE' | 'ENVIADO' | 'FALHA';

export type StatusEscala = 'RASCUNHO' | 'FINALIZADA' | 'CANCELADA';

export type StatusInscricao = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface SuporteTrocaController_Pedido {
  codigo?: string | null;
}

export interface TagResponse {
  codigo?: string | null;
  descricao?: string | null;
}

export interface TarefaDtos_Pagina {
  itens?: TarefaDtos_Resposta[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface TarefaDtos_Responsavel {
  id?: string | null;
  nome?: string | null;
}

export interface TarefaDtos_Resposta {
  atualizadoEm?: string | null;
  criadoEm?: string | null;
  descricao?: string | null;
  equipe?: string | null;
  id?: string | null;
  prazo?: string | null;
  responsavelNome?: string | null;
  responsavelUsuarioId?: string | null;
  status?: Tarefa_Status | null;
  titulo?: string | null;
  versao: number;
}

export interface TarefaDtos_Salvar {
  descricao?: string | null;
  equipe?: string | null;
  prazo?: string | null;
  responsavelUsuarioId?: string | null;
  status?: Tarefa_Status | null;
  titulo?: string | null;
  versao?: number | null;
}

export type Tarefa_Status = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface TenantRequest {
  cnpj?: string | null;
  diocese?: string | null;
  emails?: ContatoEmailRequest[] | null;
  endereco?: EnderecoDto | null;
  nome?: string | null;
  razaoSocial?: string | null;
  telefones?: ContatoTelefoneRequest[] | null;
}

export interface TenantResponse {
  cnpj?: string | null;
  codigo?: string | null;
  diocese?: string | null;
  emails?: ContatoEmailResponse[] | null;
  endereco?: EnderecoDto | null;
  id?: string | null;
  nome?: string | null;
  razaoSocial?: string | null;
  slug?: string | null;
  status?: Tenant_Status | null;
  telefones?: ContatoTelefoneResponse[] | null;
}

export interface TenantResumo {
  id?: string | null;
  nome?: string | null;
  slug?: string | null;
}

export type Tenant_Status = 'ATIVO' | 'TRIAL' | 'BLOQUEADO' | 'CANCELADO';

export interface TestarWhatsappRequest {
  telefone?: string | null;
}

export type TipoEnvio = 'EMAIL' | 'WHATSAPP';

export type TipoEscala = 'SEMANAL' | 'MENSAL';

export type TipoLayout = 'TODOS' | 'RESPONSAVEL' | 'COROINHA' | 'ACOLITO' | 'COROINHA_ACOLITO' | 'MINISTRO' | 'EVENTO';

export type TipoVoluntario = 'COROINHA' | 'ACOLITO' | 'AMBOS' | 'MESC';

export interface TrocaDtos_Decisao {
  aprovar?: boolean | null;
  versao?: number | null;
}

export interface TrocaDtos_Pagina<T = unknown> {
  itens?: T[] | null;
  pagina: number;
  tamanho: number;
  total: number;
}

export interface TrocaDtos_Pedido {
  atualizadaEm?: string | null;
  celebracao?: string | null;
  criadaEm?: string | null;
  funcao?: string | null;
  id?: string | null;
  inicio?: string | null;
  situacao?: Troca_Situacao | null;
  solicitante: boolean;
  solicitanteNome?: string | null;
  substituto: boolean;
  substitutoNome?: string | null;
  vagaId?: string | null;
  versao: number;
  vigente: boolean;
}

export interface TrocaDtos_Solicitar {
  substitutoId?: string | null;
  versao?: number | null;
}

export interface TrocaDtos_Substituto {
  id?: string | null;
  nome?: string | null;
}

export interface TrocaDtos_Versao {
  versao?: number | null;
}

export type Troca_Situacao = 'AGUARDANDO_ACEITE' | 'ACEITA' | 'APROVADA' | 'RECUSADA' | 'CANCELADA' | 'EXPIRADA';

export interface UsuarioParoquiaRequest {
  ativo: boolean;
  email?: string | null;
  nome?: string | null;
  perfilId?: string | null;
  telefone?: string | null;
  tipoTelefone?: string | null;
}

export interface UsuarioParoquiaResponse {
  ativo: boolean;
  email?: string | null;
  nome?: string | null;
  perfilId?: string | null;
  perfilNome?: string | null;
  senhaDefinida: boolean;
  sequencial?: number | null;
  situacaoAcesso?: string | null;
  somenteLeitura: boolean;
  telefone?: string | null;
  tipoTelefone?: string | null;
  usuarioId?: string | null;
}

export interface VinculoPessoaService_Vinculo {
  pessoaId?: string | null;
  pessoaNome?: string | null;
}

export interface VoluntarioOpcaoService_Opcao {
  ativo: boolean;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  id?: string | null;
  nomeCompleto?: string | null;
  tipo?: TipoVoluntario | null;
}

export interface VoluntarioOpcaoService_Pagina {
  itens?: VoluntarioOpcaoService_Opcao[] | null;
  pagina: number;
  tamanho: number;
  temMais: boolean;
}

export interface VoluntarioOpcaoService_Resolver {
  ids?: string[] | null;
}

export interface VoluntarioPerfilRequest {
  ativo: boolean;
  autorizaWhatsapp: boolean;
  crismaAno?: string | null;
  etapaCatequese?: string | null;
  eucaristiaAno?: string | null;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  horarioEstudo?: Voluntario_HorarioEstudo | null;
  mandatoFim?: string | null;
  mandatoInicio?: string | null;
  tipo?: TipoVoluntario | null;
}

export interface VoluntarioPerfilResponse {
  ativo: boolean;
  autorizaWhatsapp: boolean;
  crismaAno?: string | null;
  etapaCatequese?: string | null;
  eucaristiaAno?: string | null;
  fotoPath?: string | null;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  horarioEstudo?: Voluntario_HorarioEstudo | null;
  mandatoFim?: string | null;
  mandatoInicio?: string | null;
  tipo?: TipoVoluntario | null;
}

export interface VoluntarioResponse {
  ativo: boolean;
  autorizaWhatsapp: boolean;
  crismaAno?: string | null;
  etapaCatequese?: string | null;
  eucaristiaAno?: string | null;
  fotoPath?: string | null;
  funcoesHabilitadas?: FuncaoEscala[] | null;
  horarioEstudo?: Voluntario_HorarioEstudo | null;
  id?: string | null;
  mandatoFim?: string | null;
  mandatoInicio?: string | null;
  nomeCompleto?: string | null;
  tipo?: TipoVoluntario | null;
}

export type Voluntario_HorarioEstudo = 'MANHA' | 'TARDE' | 'NOITE';

export interface WhatsappConfigRequest {
  ativo: boolean;
  instancia?: string | null;
  token?: string | null;
}

export interface WhatsappConfigResponse {
  ativo: boolean;
  instancia?: string | null;
  tokenConfigurado: boolean;
}

/** Rotas do contrato: chave "VERBO /caminho"; `corpo` e `resposta` são os DTOs declarados no controlador. */
export interface ContratoRotas {
  "GET /aniversarios/configuracoes": { corpo: null; resposta: AniversarioDtos_Config[] };
  "PUT /aniversarios/configuracoes/{canal}": { corpo: AniversarioDtos_Configurar; resposta: AniversarioDtos_Config };
  "GET /aniversarios/layouts": { corpo: null; resposta: AniversarioDtos_OpcaoLayout[] };
  "GET /aniversarios/pessoas/{id}": { corpo: null; resposta: AniversarioDtos_Autorizacao[] };
  "PUT /aniversarios/pessoas/{id}/{canal}": { corpo: AniversarioDtos_Autorizar; resposta: AniversarioDtos_Autorizacao };
  "GET /audit-log": { corpo: null; resposta: AuditLogResponse[] };
  "POST /auth/forgot-password": { corpo: ForgotPasswordRequest; resposta: void };
  "POST /auth/login": { corpo: LoginRequest; resposta: LoginResponse };
  "POST /auth/logout": { corpo: null; resposta: void };
  "POST /auth/refresh": { corpo: RefreshRequest; resposta: AccessTokenResponse };
  "POST /auth/reset-password": { corpo: ResetPasswordRequest; resposta: void };
  "POST /auth/select-tenant": { corpo: SelectTenantRequest; resposta: AccessTokenResponse };
  "POST /auth/suporte/trocar": { corpo: SuporteTrocaController_Pedido; resposta: AccessTokenResponse };
  "DELETE /calendario/assinatura": { corpo: null; resposta: void };
  "POST /calendario/assinatura": { corpo: null; resposta: CalendarioService_Criada };
  "GET /comunicados": { corpo: null; resposta: ComunicadoDtos_Resumo[] };
  "POST /comunicados": { corpo: null; resposta: ComunicadoDtos_Criado };
  "POST /comunicados/destinatarios": { corpo: ComunicadoDtos_DestinatariosRequest; resposta: ComunicadoDtos_DestinatarioPrevia[] };
  "POST /comunicados/pre-visualizar": { corpo: ComunicadoDtos_PreVisualizarRequest; resposta: ComunicadoDtos_PreVisualizacao };
  "GET /comunicados/{id}": { corpo: null; resposta: ComunicadoDtos_Detalhe };
  "POST /comunicados/{id}/reenviar-falhas": { corpo: null; resposta: ComunicadoDtos_Resumo };
  "GET /dioceses": { corpo: null; resposta: DioceseResponse[] };
  "GET /escalas": { corpo: null; resposta: EscalaResponse[] };
  "POST /escalas": { corpo: EscalaRequest; resposta: EscalaResponse };
  "PUT /escalas/candidaturas/{id}/decisao": { corpo: CandidaturaDtos_Decisao; resposta: CandidaturaDtos_Pedido };
  "DELETE /escalas/eventos/{id}/checkin": { corpo: null; resposta: void };
  "GET /escalas/eventos/{id}/checkin": { corpo: null; resposta: CheckinDtos_Estado };
  "POST /escalas/eventos/{id}/checkin": { corpo: CheckinDtos_Abrir; resposta: CheckinDtos_Aberto };
  "GET /escalas/indisponibilidades": { corpo: null; resposta: IndisponibilidadeDtos_MesResponse };
  "PUT /escalas/indisponibilidades": { corpo: IndisponibilidadeDtos_MesRequest; resposta: IndisponibilidadeDtos_MesResponse };
  "GET /escalas/layouts": { corpo: null; resposta: LayoutEscalaDto[] };
  "POST /escalas/layouts": { corpo: LayoutEscalaDto; resposta: LayoutEscalaDto };
  "DELETE /escalas/layouts/{id}": { corpo: null; resposta: void };
  "GET /escalas/layouts/{id}": { corpo: null; resposta: LayoutEscalaDto };
  "PUT /escalas/layouts/{id}": { corpo: LayoutEscalaDto; resposta: LayoutEscalaDto };
  "PUT /escalas/trocas/{id}/decisao": { corpo: TrocaDtos_Decisao; resposta: TrocaDtos_Pedido };
  "PATCH /escalas/vagas/{vagaId}": { corpo: AlocacaoVagaRequest; resposta: EscalaVagaResponse };
  "PATCH /escalas/vagas/{vagaId}/presenca": { corpo: PresencaRequest; resposta: EscalaVagaResponse };
  "GET /escalas/{eventoId}/candidatos": { corpo: null; resposta: CandidatoResponse[] };
  "DELETE /escalas/{id}": { corpo: null; resposta: void };
  "GET /escalas/{id}": { corpo: null; resposta: EscalaResponse };
  "PUT /escalas/{id}": { corpo: EscalaRequest; resposta: EscalaResponse };
  "GET /escalas/{id}/apoio": { corpo: null; resposta: IndisponibilidadeDtos_ApoioEscala };
  "POST /escalas/{id}/cancelar": { corpo: null; resposta: EscalaResponse };
  "GET /escalas/{id}/candidaturas": { corpo: null; resposta: CandidaturaDtos_Pagina<CandidaturaDtos_Pedido> };
  "POST /escalas/{id}/distribuicao/aplicacao": { corpo: DistribuicaoDtos_AplicarRequest; resposta: DistribuicaoDtos_Aplicada };
  "POST /escalas/{id}/distribuicao/previa": { corpo: DistribuicaoDtos_PreviaRequest; resposta: DistribuicaoDtos_Previa };
  "POST /escalas/{id}/finalizar": { corpo: null; resposta: EscalaResponse };
  "POST /escalas/{id}/notificacoes": { corpo: NotificacaoDtos_EscalaRequest; resposta: NotificacaoDtos_Resultado };
  "POST /escalas/{id}/reabrir": { corpo: null; resposta: EscalaResponse };
  "GET /escalas/{id}/respostas": { corpo: null; resposta: RespostaEscalaDtos_Pagina<RespostaEscalaDtos_Item> };
  "GET /escalas/{id}/trocas": { corpo: null; resposta: TrocaDtos_Pagina<TrocaDtos_Pedido> };
  "GET /estoque": { corpo: null; resposta: EstoqueDtos_Pagina<EstoqueDtos_Item> };
  "POST /estoque": { corpo: EstoqueDtos_Salvar; resposta: EstoqueDtos_Item };
  "GET /estoque/responsaveis": { corpo: null; resposta: EstoqueDtos_Responsavel[] };
  "GET /estoque/{id}": { corpo: null; resposta: EstoqueDtos_Item };
  "PUT /estoque/{id}": { corpo: EstoqueDtos_Salvar; resposta: EstoqueDtos_Item };
  "GET /estoque/{id}/movimentos": { corpo: null; resposta: EstoqueDtos_Pagina<EstoqueDtos_Movimento> };
  "POST /estoque/{id}/movimentos": { corpo: EstoqueDtos_Movimentar; resposta: EstoqueDtos_Movimento };
  "GET /eventos": { corpo: null; resposta: EventoDtos_EventoResumo[] };
  "POST /eventos": { corpo: EventoDtos_EventoRequest; resposta: EventoDtos_EventoDetalhe };
  "GET /eventos/pagina": { corpo: null; resposta: PaginaLista<EventoDtos_EventoResumo> };
  "GET /eventos/{id}": { corpo: null; resposta: EventoDtos_EventoDetalhe };
  "PUT /eventos/{id}": { corpo: EventoDtos_EventoRequest; resposta: EventoDtos_EventoDetalhe };
  "POST /eventos/{id}/cancelar": { corpo: EventoDtos_CancelarRequest; resposta: EventoDtos_EventoDetalhe };
  "POST /eventos/{id}/fotos": { corpo: null; resposta: EventoDtos_EventoDetalhe };
  "DELETE /eventos/{id}/fotos/{fotoId}": { corpo: null; resposta: EventoDtos_EventoDetalhe };
  "PUT /eventos/{id}/fotos/{fotoId}/capa": { corpo: null; resposta: EventoDtos_EventoDetalhe };
  "POST /eventos/{id}/inscricoes": { corpo: EventoDtos_InscreverRequest; resposta: EventoDtos_EventoDetalhe };
  "DELETE /eventos/{id}/inscricoes/{inscricaoId}": { corpo: null; resposta: EventoDtos_EventoDetalhe };
  "POST /eventos/{id}/publicar": { corpo: null; resposta: EventoDtos_EventoDetalhe };
  "GET /financeiro/categorias": { corpo: null; resposta: FinanceiroDtos_CategoriaResponse[] };
  "POST /financeiro/categorias": { corpo: FinanceiroDtos_CategoriaRequest; resposta: FinanceiroDtos_CategoriaResponse };
  "PUT /financeiro/categorias/{id}": { corpo: FinanceiroDtos_CategoriaRequest; resposta: FinanceiroDtos_CategoriaResponse };
  "GET /financeiro/contas": { corpo: null; resposta: FinanceiroDtos_ContaResponse[] };
  "POST /financeiro/contas": { corpo: FinanceiroDtos_ContaRequest; resposta: FinanceiroDtos_ContaResponse };
  "PUT /financeiro/contas/{id}": { corpo: FinanceiroDtos_ContaRequest; resposta: FinanceiroDtos_ContaResponse };
  "GET /financeiro/movimentos": { corpo: null; resposta: FinanceiroDtos_Pagina };
  "POST /financeiro/movimentos": { corpo: FinanceiroDtos_MovimentoRequest; resposta: FinanceiroDtos_MovimentoResponse };
  "PUT /financeiro/movimentos/{id}": { corpo: FinanceiroDtos_MovimentoRequest; resposta: FinanceiroDtos_MovimentoResponse };
  "POST /financeiro/movimentos/{id}/baixar": { corpo: FinanceiroDtos_BaixaRequest; resposta: FinanceiroDtos_MovimentoResponse };
  "POST /financeiro/movimentos/{id}/cancelar": { corpo: FinanceiroDtos_VersaoRequest; resposta: FinanceiroDtos_MovimentoResponse };
  "POST /financeiro/movimentos/{id}/estornar": { corpo: FinanceiroDtos_VersaoRequest; resposta: FinanceiroDtos_MovimentoResponse };
  "GET /financeiro/resumo": { corpo: null; resposta: FinanceiroDtos_Resumo };
  "GET /funcionalidades-plano": { corpo: null; resposta: string[] };
  "GET /indicadores/participacao": { corpo: null; resposta: IndicadoresService_Pagina };
  "GET /inscricoes": { corpo: null; resposta: InscricaoResponse[] };
  "GET /inscricoes/pagina": { corpo: null; resposta: PaginaLista<InscricaoResponse> };
  "GET /inscricoes/{id}": { corpo: null; resposta: InscricaoResponse };
  "PUT /inscricoes/{id}": { corpo: InscricaoAtualizarRequest; resposta: InscricaoResponse };
  "POST /inscricoes/{id}/aprovar": { corpo: null; resposta: InscricaoResponse };
  "GET /inscricoes/{id}/duplicidades": { corpo: null; resposta: DuplicidadeResponse[] };
  "POST /inscricoes/{id}/rejeitar": { corpo: InscricaoRejeitarRequest; resposta: InscricaoResponse };
  "POST /integracao/v1/instancias": { corpo: ProvisionarInstanciaRequest; resposta: void };
  "GET /integracao/v1/instancias/{id}/consumo": { corpo: null; resposta: ConsumoInstanciaService_Resposta };
  "GET /integracao/v1/instancias/{tenantId}": { corpo: null; resposta: Record<string, unknown> };
  "PUT /integracao/v1/instancias/{tenantId}/direitos": { corpo: DireitosInstancia; resposta: Record<string, unknown> };
  "POST /integracao/v1/instancias/{tenantId}/suporte": { corpo: IntegracaoController_SuportePedido; resposta: Record<string, unknown> };
  "GET /integracao/v1/recursos": { corpo: null; resposta: CatalogoDeRecursos_RecursoDoApp[] };
  "GET /layouts": { corpo: null; resposta: LayoutResponse[] };
  "POST /layouts": { corpo: LayoutRequest; resposta: LayoutResponse };
  "POST /layouts/pre-visualizar": { corpo: PreVisualizarRequest; resposta: PreVisualizacaoResponse };
  "GET /layouts/tags": { corpo: null; resposta: TagResponse[] };
  "DELETE /layouts/{id}": { corpo: null; resposta: void };
  "GET /layouts/{id}": { corpo: null; resposta: LayoutResponse };
  "PUT /layouts/{id}": { corpo: LayoutRequest; resposta: LayoutResponse };
  "GET /liturgia/referencias": { corpo: null; resposta: LiturgiaDtos_Pagina<LiturgiaDtos_Referencia> };
  "POST /liturgia/referencias": { corpo: LiturgiaDtos_ReferenciaSalvar; resposta: LiturgiaDtos_Referencia };
  "PUT /liturgia/referencias/{id}": { corpo: LiturgiaDtos_ReferenciaSalvar; resposta: LiturgiaDtos_Referencia };
  "GET /liturgia/roteiros": { corpo: null; resposta: LiturgiaDtos_Pagina<LiturgiaDtos_Roteiro> };
  "POST /liturgia/roteiros": { corpo: LiturgiaDtos_RoteiroSalvar; resposta: LiturgiaDtos_Roteiro };
  "PUT /liturgia/roteiros/{id}": { corpo: LiturgiaDtos_RoteiroSalvar; resposta: LiturgiaDtos_Roteiro };
  "GET /me": { corpo: null; resposta: MeResponse };
  "PUT /me": { corpo: MeRequest; resposta: MeResponse };
  "GET /me/mfa": { corpo: null; resposta: MfaService_Status };
  "POST /me/mfa/ativar": { corpo: MfaController_Confirmacao; resposta: MfaService_Recuperacao };
  "POST /me/mfa/desativar": { corpo: MfaController_Confirmacao; resposta: void };
  "POST /me/mfa/preparar": { corpo: MfaController_Senha; resposta: MfaService_Preparacao };
  "POST /me/mfa/recuperacao": { corpo: MfaController_Confirmacao; resposta: MfaService_Recuperacao };
  "GET /minha-conta": { corpo: null; resposta: string };
  "POST /minha-conta/armazenamento/conferir": { corpo: null; resposta: ReconciliadorArmazenamento_Resultado };
  "GET /minha-conta/consumo": { corpo: null; resposta: CotasService_Consumo };
  "GET /minha-conta/consumo/historico": { corpo: null; resposta: ConsumoHistoricoService_Ponto[] };
  "GET /monitoramento/metrics": { corpo: null; resposta: string };
  "GET /mural/avisos": { corpo: null; resposta: AvisoDtos_Pagina };
  "POST /mural/avisos": { corpo: AvisoDtos_Salvar; resposta: AvisoDtos_Resposta };
  "GET /mural/avisos/destinatarios": { corpo: null; resposta: AvisoDtos_Conta[] };
  "GET /mural/avisos/{id}": { corpo: null; resposta: AvisoDtos_Resposta };
  "PUT /mural/avisos/{id}": { corpo: AvisoDtos_Salvar; resposta: AvisoDtos_Resposta };
  "PUT /mural/avisos/{id}/leitura": { corpo: AvisoDtos_Confirmar; resposta: AvisoDtos_Resposta };
  "POST /mural/avisos/{id}/notificacoes": { corpo: NotificacaoDtos_AvisoRequest; resposta: NotificacaoDtos_Resultado };
  "GET /notificacoes/configuracoes": { corpo: null; resposta: NotificacaoDtos_Config[] };
  "PUT /notificacoes/configuracoes/{origem}/{canal}": { corpo: NotificacaoDtos_Configurar; resposta: NotificacaoDtos_Config };
  "GET /notificacoes/entregas": { corpo: null; resposta: NotificacaoDtos_Pagina };
  "GET /onboarding": { corpo: null; resposta: OnboardingDtos_Resposta };
  "PUT /onboarding/etapas/{codigo}": { corpo: OnboardingDtos_Salvar; resposta: OnboardingDtos_Resposta };
  "GET /pastorais/equipes": { corpo: null; resposta: PastoralDtos_Pagina<PastoralDtos_Equipe> };
  "POST /pastorais/equipes": { corpo: PastoralDtos_SalvarEquipe; resposta: PastoralDtos_Equipe };
  "PUT /pastorais/equipes/{id}": { corpo: PastoralDtos_SalvarEquipe; resposta: PastoralDtos_Equipe };
  "GET /pastorais/equipes/{id}/membros": { corpo: null; resposta: PastoralDtos_Pagina<PastoralDtos_Membro> };
  "POST /pastorais/equipes/{id}/membros": { corpo: PastoralDtos_SalvarMembro; resposta: void };
  "GET /pastorais/minhas-equipes": { corpo: null; resposta: PastoralDtos_Equipe[] };
  "GET /pastorais/minhas-equipes/{id}/membros": { corpo: null; resposta: PastoralDtos_Pagina<PastoralDtos_Membro> };
  "PUT /pastorais/minhas-equipes/{id}/membros/{pessoa}": { corpo: PastoralController_Ativo; resposta: void };
  "GET /pastorais/pessoas": { corpo: null; resposta: PastoralDtos_PessoaOpcao[] };
  "GET /perfis": { corpo: null; resposta: PerfilResponse[] };
  "POST /perfis": { corpo: PerfilRequest; resposta: PerfilResponse };
  "GET /perfis/{id}": { corpo: null; resposta: PerfilResponse };
  "PUT /perfis/{id}": { corpo: PerfilRequest; resposta: PerfilResponse };
  "POST /perfis/{id}/duplicar": { corpo: null; resposta: PerfilResponse };
  "GET /permissoes/catalogo": { corpo: null; resposta: CatalogoPermissao_Secao[] };
  "GET /pessoas": { corpo: null; resposta: PessoaResponse[] };
  "POST /pessoas": { corpo: PessoaRequest; resposta: PessoaResponse };
  "GET /pessoas/aniversariantes": { corpo: null; resposta: AniversarianteResponse[] };
  "POST /pessoas/duplicidades": { corpo: DuplicidadeRequest; resposta: DuplicidadeResponse[] };
  "POST /pessoas/importacoes/confirmar": { corpo: null; resposta: ImportacaoPessoaDtos_Resultado };
  "POST /pessoas/importacoes/estrutura": { corpo: null; resposta: ImportacaoPessoaDtos_Estrutura };
  "POST /pessoas/importacoes/previa": { corpo: null; resposta: ImportacaoPessoaDtos_Previa };
  "GET /pessoas/opcoes": { corpo: null; resposta: PessoaService_Opcao[] };
  "GET /pessoas/pagina": { corpo: null; resposta: PaginaLista<PessoaResponse> };
  "GET /pessoas/resumo": { corpo: null; resposta: PessoaService_Resumo };
  "GET /pessoas/{id}": { corpo: null; resposta: PessoaResponse };
  "PUT /pessoas/{id}": { corpo: PessoaRequest; resposta: PessoaResponse };
  "GET /pessoas/{id}/consentimentos": { corpo: null; resposta: PrivacidadeDtos_PaginaConsentimentos };
  "GET /pessoas/{id}/exportacao": { corpo: null; resposta: PrivacidadeDtos_Exportacao };
  "GET /pessoas/{responsavel}/acessos-dependentes": { corpo: null; resposta: AcessosDependentesService_Autorizacao[] };
  "PUT /pessoas/{responsavel}/acessos-dependentes/{dependente}": { corpo: AcessosDependentesController_Autorizar; resposta: void };
  "GET /portal/candidaturas": { corpo: null; resposta: CandidaturaDtos_Pagina<CandidaturaDtos_Pedido> };
  "PUT /portal/candidaturas/{id}/desistencia": { corpo: CandidaturaDtos_Versao; resposta: CandidaturaDtos_Pedido };
  "POST /portal/checkin": { corpo: CheckinDtos_Registrar; resposta: CheckinDtos_Resultado };
  "GET /portal/compromissos": { corpo: null; resposta: PortalService_Resposta };
  "GET /portal/dependentes": { corpo: null; resposta: AcessosDependentesService_Dependente[] };
  "GET /portal/dependentes/{id}/compromissos": { corpo: null; resposta: PortalService_Resposta };
  "PUT /portal/dependentes/{pessoa}/vagas/{vaga}/resposta": { corpo: RespostaEscalaDtos_Responder; resposta: RespostaEscalaDtos_Atual };
  "GET /portal/indisponibilidades": { corpo: null; resposta: DisponibilidadeDtos_Resposta };
  "PUT /portal/indisponibilidades": { corpo: DisponibilidadeDtos_Salvar; resposta: DisponibilidadeDtos_Resposta };
  "GET /portal/trocas": { corpo: null; resposta: TrocaDtos_Pagina<TrocaDtos_Pedido> };
  "GET /portal/trocas/substitutos": { corpo: null; resposta: TrocaDtos_Substituto[] };
  "PUT /portal/trocas/{id}/aceite": { corpo: TrocaDtos_Decisao; resposta: TrocaDtos_Pedido };
  "PUT /portal/trocas/{id}/cancelamento": { corpo: TrocaDtos_Versao; resposta: TrocaDtos_Pedido };
  "GET /portal/vagas-abertas": { corpo: null; resposta: CandidaturaDtos_Pagina<CandidaturaDtos_Vaga> };
  "POST /portal/vagas/{id}/candidaturas": { corpo: CandidaturaDtos_Versao; resposta: CandidaturaDtos_Pedido };
  "PUT /portal/vagas/{id}/resposta": { corpo: RespostaEscalaDtos_Responder; resposta: RespostaEscalaDtos_Atual };
  "GET /portal/vagas/{id}/respostas": { corpo: null; resposta: RespostaEscalaDtos_Pagina<RespostaEscalaDtos_Historico> };
  "POST /portal/vagas/{id}/trocas": { corpo: TrocaDtos_Solicitar; resposta: TrocaDtos_Pedido };
  "GET /privacidade/retencao": { corpo: null; resposta: PrivacidadeDtos_Retencao };
  "PUT /privacidade/retencao": { corpo: PrivacidadeDtos_AtualizarRetencao; resposta: PrivacidadeDtos_Retencao };
  "POST /privacidade/retencao/execucao": { corpo: PrivacidadeDtos_ExecutarRetencao; resposta: PrivacidadeDtos_ResultadoRetencao };
  "GET /public/calendario/{token}.ics": { corpo: null; resposta: string };
  "GET /public/paroquias/{slug}": { corpo: null; resposta: SiteDtos_Dados };
  "POST /public/{tenantSlug}/inscricoes": { corpo: null; resposta: InscricaoResponse };
  "GET /relatorios/participacao": { corpo: null; resposta: ParticipacaoDtos_Pagina };
  "GET /relatorios/participacao/csv": { corpo: null; resposta: number[] };
  "GET /site-paroquia": { corpo: null; resposta: SiteDtos_Estado };
  "PUT /site-paroquia": { corpo: SiteDtos_Salvar; resposta: SiteDtos_Estado };
  "POST /site-paroquia/despublicar": { corpo: SiteDtos_Revisao; resposta: SiteDtos_Estado };
  "POST /site-paroquia/publicar": { corpo: SiteDtos_Publicar; resposta: SiteDtos_Estado };
  "GET /tarefas": { corpo: null; resposta: TarefaDtos_Pagina };
  "POST /tarefas": { corpo: TarefaDtos_Salvar; resposta: TarefaDtos_Resposta };
  "GET /tarefas/responsaveis": { corpo: null; resposta: TarefaDtos_Responsavel[] };
  "GET /tarefas/{id}": { corpo: null; resposta: TarefaDtos_Resposta };
  "PUT /tarefas/{id}": { corpo: TarefaDtos_Salvar; resposta: TarefaDtos_Resposta };
  "GET /tenant": { corpo: null; resposta: TenantResponse };
  "PUT /tenant": { corpo: TenantRequest; resposta: TenantResponse };
  "GET /tenant/whatsapp": { corpo: null; resposta: WhatsappConfigResponse };
  "PUT /tenant/whatsapp": { corpo: WhatsappConfigRequest; resposta: WhatsappConfigResponse };
  "POST /tenant/whatsapp/testar": { corpo: TestarWhatsappRequest; resposta: void };
  "GET /usuarios": { corpo: null; resposta: UsuarioParoquiaResponse[] };
  "POST /usuarios": { corpo: UsuarioParoquiaRequest; resposta: UsuarioParoquiaResponse };
  "GET /usuarios/{id}": { corpo: null; resposta: UsuarioParoquiaResponse };
  "PUT /usuarios/{id}": { corpo: UsuarioParoquiaRequest; resposta: UsuarioParoquiaResponse };
  "POST /usuarios/{id}/convite": { corpo: null; resposta: void };
  "GET /usuarios/{id}/pessoa": { corpo: null; resposta: VinculoPessoaService_Vinculo };
  "PUT /usuarios/{id}/pessoa": { corpo: VinculoPessoaService_Vinculo; resposta: VinculoPessoaService_Vinculo };
  "GET /voluntarios": { corpo: null; resposta: VoluntarioResponse[] };
  "GET /voluntarios/contagens": { corpo: null; resposta: ContagemVoluntarios };
  "GET /voluntarios/count": { corpo: null; resposta: number };
  "GET /voluntarios/opcoes": { corpo: null; resposta: VoluntarioOpcaoService_Pagina };
  "POST /voluntarios/opcoes/ids": { corpo: VoluntarioOpcaoService_Resolver; resposta: VoluntarioOpcaoService_Opcao[] };
  "GET /voluntarios/painel": { corpo: null; resposta: PainelVoluntarios };
  "GET /voluntarios/{id}": { corpo: null; resposta: VoluntarioResponse };
  "PATCH /voluntarios/{id}/ativo": { corpo: null; resposta: VoluntarioResponse };
  "GET /voluntarios/{id}/commitments": { corpo: null; resposta: CompromissoResponse[] };
  "POST /voluntarios/{id}/foto": { corpo: null; resposta: VoluntarioResponse };
  "GET /voluntarios/{id}/foto-url": { corpo: null; resposta: FotoUrlResponse };
  "GET /voluntarios/{voluntarioId}/disponibilidades": { corpo: null; resposta: DisponibilidadeVoluntarioResponse[] };
  "POST /voluntarios/{voluntarioId}/disponibilidades": { corpo: DisponibilidadeVoluntarioRequest; resposta: DisponibilidadeVoluntarioResponse };
  "DELETE /voluntarios/{voluntarioId}/disponibilidades/{id}": { corpo: null; resposta: void };
}

export type RotaApi = keyof ContratoRotas;
export type CorpoApi<R extends RotaApi> = ContratoRotas[R]['corpo'];
export type RespostaApi<R extends RotaApi> = ContratoRotas[R]['resposta'];
