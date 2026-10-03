import { SecaoId } from '../../core/layout/navegacao';

/** Conteúdo estático da Ajuda: sem fichas, sem requisições de negócio. Todo texto aqui descreve o que a tela realmente faz. */
export interface PerguntaAjuda { pergunta: string; resposta: string; }

export interface TemaAjuda {
  id: string;
  titulo: string;
  /** Seção do menu em que o tema aparece agrupado na página de Ajuda. */
  secao: SecaoId;
  permissao: string | readonly string[] | null;
  /** Tela que o tema explica; vira o botão "Abrir módulo". */
  url: string | null;
  /** Para que serve, em uma ou duas frases. */
  resumo: string;
  passos: readonly string[];
  cuidados?: readonly string[];
  perguntas?: readonly PerguntaAjuda[];
  /** Ids de outros temas que costumam ser úteis em seguida. */
  relacionados?: readonly string[];
}

export const TEMAS: readonly TemaAjuda[] = [
  // ---- Início
  {
    id: 'inicio', titulo: 'Início: o painel da paróquia', secao: 'inicio', permissao: null, url: '/dashboard',
    resumo: 'Resume o que importa hoje: servidores ativos, próxima missa, presenças e vagas abertas, com atalhos para as tarefas mais comuns.',
    passos: [
      'Os quatro cartões do topo mostram servidores ativos, a próxima missa do mês, presenças marcadas e vagas ainda abertas. Clique nos links dos cartões para ir direto à tela de cada assunto.',
      'Em Próximas celebrações você vê as missas já cadastradas, e em Aniversariantes, quem faz aniversário no mês.',
      'As Ações rápidas levam à criação de escala e ao cadastro de pessoa. O que aparece depende do seu perfil.',
      'Use a barra "O que você deseja fazer?" no topo (ou Ctrl+K) para ir a qualquer tela sem procurar no menu.',
    ],
    cuidados: ['Os números são um retrato de agora: atualize a página para ver mudanças feitas por outras pessoas.'],
    perguntas: [{ pergunta: 'Por que não vejo algum cartão ou atalho?', resposta: 'O painel mostra apenas o que o seu perfil permite. Se faltar algo de que você precisa, peça ao administrador da paróquia para ajustar o perfil.' }],
    relacionados: ['primeiros-passos', 'acesso'],
  },
  {
    id: 'primeiros-passos', titulo: 'Primeiros passos: configurar a paróquia por etapas', secao: 'inicio', permissao: 'ONBOARDING', url: '/primeiros-passos',
    resumo: 'Um checklist compartilhado que leva a paróquia da configuração inicial até a primeira escala finalizada.',
    passos: [
      'As etapas são: revisar a paróquia, convidar a equipe, cadastrar pessoas, preparar voluntários e finalizar a primeira escala. Cada cartão tem o botão Abrir módulo.',
      'Faça a configuração no módulo indicado, volte e use Revisei e concluí. Consultar a tela não conclui nada sozinho.',
      'Se você trabalha sozinho, use Trabalho sozinho na etapa da equipe. Dá para reabrir depois.',
      'O progresso fica salvo na paróquia: outra pessoa autorizada continua de onde você parou.',
    ],
    cuidados: ['O percentual considera só as etapas que o seu perfil pode ver e que o plano inclui; pessoas com perfis diferentes podem ver percentuais diferentes.'],
    perguntas: [{ pergunta: 'Uma etapa voltou para "Revisar". Perdi o que fiz?', resposta: 'Não. Significa que algo mudou depois da revisão (por exemplo, o último voluntário foi inativado). O histórico fica preservado; confira e conclua de novo.' }],
    relacionados: ['paroquia', 'usuarios', 'pessoas', 'escalas'],
  },

  // ---- Cadastro
  {
    id: 'acesso', titulo: 'Acesso, senha e segundo fator', secao: 'cadastro', permissao: null, url: '/meu-perfil',
    resumo: 'Como entrar, trocar a senha, ativar a verificação em duas etapas e o que fazer quando algo não aparece.',
    passos: [
      'Use o e-mail do convite para definir a senha e entrar. Se esqueceu a senha, use a recuperação na tela de login.',
      'Em Meu perfil você altera nome e telefone e troca a senha. Para trocar a senha é preciso informar a senha atual.',
      'Ainda em Meu perfil, ative a Verificação em duas etapas: informe a senha, cadastre a chave no aplicativo autenticador e confirme. Guarde os dez códigos de recuperação: cada um funciona uma vez e eles aparecem uma única vez.',
      'O menu mostra só os módulos que o seu perfil permite. Se uma ação necessária não aparece, peça à pessoa responsável pelos acessos.',
    ],
    cuidados: [
      'Perder o autenticador e todos os códigos não se resolve por e-mail: não existe atalho para contornar a verificação. Guarde os códigos em lugar seguro.',
      'Se aparecer "muitas tentativas", aguarde o intervalo informado antes de tentar de novo.',
    ],
    perguntas: [
      { pergunta: 'Posso usar a mesma conta em mais de uma paróquia?', resposta: 'Sim. A conta é uma só; ao entrar, escolha a paróquia. A verificação em duas etapas vale para todas elas.' },
      { pergunta: 'Esqueci a senha e tenho a verificação ativada. E agora?', resposta: 'A redefinição por e-mail também pede o código do autenticador (ou um código de recuperação). O link sozinho não desativa a verificação.' },
    ],
    relacionados: ['usuarios', 'limites'],
  },
  {
    id: 'pessoas', titulo: 'Pessoas, responsáveis e dependentes', secao: 'cadastro', permissao: 'PESSOA', url: '/pessoas',
    resumo: 'O cadastro de coroinhas, acólitos, ministros e responsáveis. É daqui que saem as escalas, os comunicados e as inscrições.',
    passos: [
      'Busque pelo nome ou número antes de criar outra ficha e confira os possíveis duplicados que o cadastro apresentar.',
      'Use as abas Todas, Ativos, Inativos, Aguardando e Histórico para filtrar a lista. Aguardando reúne as inscrições públicas que ainda precisam de aprovação.',
      'Uma pessoa pode ser voluntária, responsável ou ambos. Nos vínculos, busque pelo nome de quem já está cadastrado.',
      'Marque as pessoas da página para imprimir uma listagem ou preparar um comunicado (menu Opções). Ao trocar de página, a seleção é limpa.',
      'Cuidados pessoais (alergias, observações de acolhimento) só aparecem para perfis autorizados. Informe apenas o necessário para cuidar bem da pessoa.',
    ],
    cuidados: [
      'Para WhatsApp, a autorização da pessoa precisa estar marcada no cadastro; sem ela nenhuma mensagem é enviada.',
      'Inativar preserva o histórico. Prefira inativar a apagar.',
    ],
    perguntas: [
      { pergunta: 'Como cadastro muita gente de uma vez?', resposta: 'Use Importar pessoas (CSV ou planilha). Há uma prévia que mostra erros e duplicados antes de criar qualquer ficha.' },
      { pergunta: 'Como vejo o que foi guardado de uma pessoa?', resposta: 'Na ficha, abra Privacidade e dados pessoais: ali estão o histórico de autorizações e, para quem tem permissão, a exportação dos dados.' },
    ],
    relacionados: ['importacao', 'privacidade', 'comunicados', 'vinculos'],
  },
  {
    id: 'importacao', titulo: 'Importar pessoas por CSV ou XLSX', secao: 'cadastro', permissao: ['PESSOA', 'PESSOA_CRIAR'], url: '/pessoas/importar',
    resumo: 'Cria muitas fichas de uma vez a partir de uma planilha, com uma prévia que não grava nada até você confirmar.',
    passos: [
      'Em Pessoas, abra Importar pessoas e baixe o modelo Excel. A aba Pessoas já traz as colunas e a aba Como preencher explica cada passo. Se preferir, baixe o modelo CSV. Preencha uma pessoa por linha; o limite é de 100 pessoas, 30 colunas e 512 KiB por arquivo.',
      'Selecione o arquivo e use Ler colunas. No XLSX escolha a aba; no CSV a primeira linha preenchida é o cabeçalho.',
      'Mapeie as colunas (nome e papel são obrigatórios; CPF, e-mail e telefone são opcionais) e gere a prévia.',
      'Leia os erros e os duplicados. Duplicidade por nome ou CPF bloqueia o lote para revisão; nenhuma ficha existente é alterada.',
      'Só então use Confirmar importação. Um lote confirmado conta como uma importação do mês no seu plano.',
    ],
    cuidados: [
      'No Excel, mantenha CPF e telefone como texto para não perder zeros à esquerda. Substitua fórmulas por valores e remova macros e células mescladas.',
      'Voluntários importados não recebem autorização de WhatsApp: ela precisa ser registrada depois, pessoa a pessoa.',
    ],
    perguntas: [{ pergunta: 'Confirmei duas vezes sem querer. Duplicou?', resposta: 'Não. Repetir a mesma confirmação não cria fichas de novo nem consome outra importação.' }],
    relacionados: ['pessoas', 'limites'],
  },
  {
    id: 'privacidade', titulo: 'Privacidade: autorizações, exportação e retenção', secao: 'cadastro', permissao: 'PRIVACIDADE', url: '/privacidade',
    resumo: 'Mostra o histórico de autorizações de cada pessoa, permite exportar os dados dela e definir por quanto tempo guardar o texto dos comunicados enviados.',
    passos: [
      'Na ficha da pessoa, abra Privacidade e dados pessoais para ver quando cada autorização (WhatsApp, felicitações) foi dada ou retirada e por quem.',
      'Quem tem permissão de exportar pode baixar os dados da pessoa em um arquivo. Ele não inclui o texto das mensagens nem contatos de terceiros, e cada exportação fica registrada.',
      'Em Retenção de dados, informe por quantos dias (de 30 a 3.650) guardar o texto e o contato dos comunicados já enviados e use Salvar prazo.',
      'A execução é manual: Anonimizar agora troca nome, contato e texto por um marcador nos comunicados mais antigos que o prazo. Antes, a tela mostra quantos destinatários seriam afetados.',
    ],
    cuidados: [
      'Anonimizar não tem como desfazer. Confira a contagem antes de confirmar.',
      'A retenção cobre somente os comunicados. Fotos, logs de auditoria e cadastros inativos não têm prazo automático.',
    ],
    perguntas: [{ pergunta: 'O histórico mostra autorizações anteriores a hoje?', resposta: 'Só a partir do momento em que o histórico passou a ser gravado. Cadastros antigos aparecem com o estado atual, sem passado retroativo.' }],
    relacionados: ['pessoas', 'comunicados'],
  },
  {
    id: 'usuarios', titulo: 'Usuários e perfis de acesso', secao: 'cadastro', permissao: ['USUARIO', 'PERFIL'], url: '/usuarios',
    resumo: 'Convida pessoas para usar o sistema e define o que cada perfil pode ver e fazer.',
    passos: [
      'Em Usuários, use Convidar, informe nome, e-mail e o perfil. A senha chega por convite; ela não é digitada no formulário.',
      'Em Perfis, crie ou ajuste um perfil marcando os módulos (leitura) e, separadamente, as ações (criar, alterar, baixar, publicar etc.).',
      'Para quem usa o portal de voluntário, vincule a conta à ficha da pessoa em Vínculos de pessoas.',
      'Revise os acessos de tempos em tempos e inative quem saiu da equipe.',
    ],
    cuidados: [
      'Permissão de leitura não concede escrita: cada ação é liberada separadamente.',
      'A funcionalidade precisa também estar incluída no plano da paróquia. Plano e permissão são controles diferentes.',
    ],
    perguntas: [{ pergunta: 'A pessoa não recebeu o convite.', resposta: 'Confira o e-mail digitado, a caixa de spam e reenvie o convite. Enquanto não definir a senha, a conta aparece como pendente.' }],
    relacionados: ['vinculos', 'acesso', 'limites'],
  },
  {
    id: 'vinculos', titulo: 'Vincular usuário à pessoa do portal', secao: 'cadastro', permissao: 'USUARIO_ALTERAR', url: '/usuarios/vinculos',
    resumo: 'Liga uma conta de acesso à ficha da pessoa, para que ela veja os próprios compromissos no portal.',
    passos: [
      'Selecione a conta e, em seguida, a ficha da pessoa correta.',
      'A ligação é sempre explícita: ter o mesmo nome ou e-mail não cria vínculo sozinho.',
      'Confira a identidade antes de salvar. Mudar o vínculo altera os compromissos que a conta enxerga e invalida o calendário privado anterior.',
    ],
    cuidados: ['Este vínculo dá acesso às informações da própria pessoa. O acesso de responsáveis aos dependentes é liberado à parte, na ficha do dependente.'],
    perguntas: [{ pergunta: 'Minha conta mostra "Peça ao administrador para vincular sua pessoa".', resposta: 'É exatamente isto que falta: alguém com permissão precisa fazer este vínculo aqui.' }],
    relacionados: ['portal', 'usuarios'],
  },
  {
    id: 'paroquia', titulo: 'Cadastro da paróquia', secao: 'cadastro', permissao: 'PAROQUIA', url: '/paroquia',
    resumo: 'Nome, diocese, endereço e contatos da paróquia, além da configuração do WhatsApp da instância.',
    passos: [
      'Em Identificação, confira o nome, a razão social e o CNPJ. A diocese pode ser escolhida na lista ou digitada.',
      'Em Endereço, preencha o CEP: o restante pode ser completado automaticamente. Revise cidade e UF.',
      'Cadastre os contatos que aparecem para a coordenação e salve com o botão no rodapé.',
      'Se a paróquia usa WhatsApp, a conexão é configurada na própria seção, com o QR code da instância.',
    ],
    cuidados: ['Os dados daqui aparecem em relatórios e mensagens. Mantenha-os atualizados.'],
    perguntas: [{ pergunta: 'Mudei o nome e ele não apareceu no topo.', resposta: 'Saia e entre de novo, ou atualize a página: o nome da paróquia no menu é lido no início da sessão.' }],
    relacionados: ['site', 'primeiros-passos'],
  },
  {
    id: 'site', titulo: 'Página pública da paróquia', secao: 'cadastro', permissao: 'SITE', url: '/site-paroquia',
    resumo: 'Monta e publica uma página aberta ao público com apresentação, horários, contato e avisos.',
    passos: [
      'Preencha o rascunho: título, apresentação, endereço, horários, contato e até 30 blocos de aviso ou evento.',
      'Salvar o rascunho não muda a página pública. Para isso use Publicar rascunho salvo e confirme.',
      'Para tirar do ar, use Retirar do ar: a página some, mas o rascunho é mantido.',
      'O endereço público tem o formato /p/nome-da-paróquia.',
    ],
    cuidados: [
      'Publique somente o que pode ser público. Nada de pessoas, escalas ou contatos privados é importado automaticamente.',
      'Alterações não salvas bloqueiam a publicação; salve primeiro.',
    ],
    perguntas: [{ pergunta: 'Editei o texto e a página pública continua igual.', resposta: 'A página mostra a última versão publicada. Salve o rascunho e use Publicar rascunho salvo.' }],
    relacionados: ['paroquia'],
  },
  {
    id: 'limites', titulo: 'Meu plano, limites e consumo', secao: 'cadastro', permissao: null, url: null,
    resumo: 'Mostra o que a paróquia contratou, quanto já usou e o que está bloqueado por limite.',
    passos: [
      'Abra Minha conta no menu do seu perfil (canto superior direito) para consultar o plano, os recursos e o consumo.',
      'Limite do plano e permissão do usuário são controles diferentes: uma funcionalidade incluída também pode exigir autorização no perfil.',
      'Inventário pendente de arquivos indica tamanhos ainda desconhecidos; peça ao administrador para conferir antes de considerar o espaço livre.',
      'Se uma ação for bloqueada por limite, confira o consumo e fale com o administrador.',
    ],
    cuidados: ['Repetir a ação não aumenta a cota.'],
    relacionados: ['usuarios', 'importacao'],
  },

  // ---- Escalas
  {
    id: 'escalas', titulo: 'Montar e finalizar uma escala', secao: 'escalas', permissao: 'ESCALA', url: '/escalas',
    resumo: 'Organiza quem serve em cada celebração do mês, com as funções de cada missa, e publica a escala para a equipe.',
    passos: [
      'Em Escalas, use Nova escala, escolha o mês, o modelo (mensal ou semanal) e o layout. A grade nasce com as celebrações do período.',
      'Ajuste os dias (+ Dia para acrescentar, a lixeira para remover) e os horários. Os layouts definem as funções e o formato impresso.',
      'Preencha as vagas escolhendo pessoas na lista ou arrastando um nome para a vaga. A tela avisa de indisponibilidades, repetições e conflitos.',
      'Salve o rascunho sempre que quiser. Gere a prévia em PDF para conferir como vai sair.',
      'Quando estiver pronta, use Finalizar. Escala finalizada fica travada para edição; para mexer de novo é preciso reabri-la.',
      'Depois de finalizar, você pode avisar os escalados por e-mail ou WhatsApp e exportar em PDF ou imagem.',
    ],
    cuidados: [
      'Confirmar participação e registrar presença são coisas diferentes: confirmar é a pessoa dizer que vem; presença é registrada depois.',
      'Reabrir ou cancelar uma escala invalida pedidos de candidatura e troca que estavam em andamento.',
      'Salve antes de sair: se houver alterações pendentes a tela pergunta antes de descartar.',
    ],
    perguntas: [
      { pergunta: 'Como repito a escala do mês passado?', resposta: 'Use Replicar no menu da escala. As linhas de referência mostram os dias que não existem no mês novo, para você decidir caso a caso.' },
      { pergunta: 'Dois voluntários são irmãos. Posso escalar juntos?', resposta: 'Sim. Quando alguém é escalado, a tela sugere o irmão para a mesma missa, mas nunca o coloca sozinha.' },
    ],
    relacionados: ['distribuicao', 'indisponibilidades', 'layouts-escala', 'notificacoes', 'coordenacao'],
  },
  {
    id: 'indisponibilidades', titulo: 'Indisponibilidades: quem não pode em quais datas', secao: 'escalas', permissao: ['ESCALA', 'VAGA', 'PORTAL_VOLUNTARIO'], url: '/escalas/indisponibilidades',
    resumo: 'Registra as datas em que cada pessoa não pode servir, para que a escala não coloque ninguém num dia impossível.',
    passos: [
      'Escolha o mês. Cada linha é uma pessoa e cada coluna é um sábado ou domingo do mês.',
      'Clique na data em que a pessoa não pode. Quem avisou que pode em todas as datas é marcado em Sem restrição. Quem não respondeu fica Pendente.',
      'Use Buscar e Tipo para filtrar a lista e Salvar para gravar. A coordenação vê o resumo (com restrição, sem restrição, pendentes) no rodapé.',
      'Cada voluntário também pode informar as próprias datas em Minha disponibilidade, no portal.',
    ],
    cuidados: ['Na montagem da escala, a tela avisa quando você tenta colocar alguém numa data indisponível.'],
    perguntas: [{ pergunta: 'Alguém mudou de ideia depois de salvar.', resposta: 'Edite a data e salve de novo. Escalas já finalizadas não mudam sozinhas: reabra a escala se for preciso trocar a pessoa.' }],
    relacionados: ['escalas', 'portal'],
  },
  {
    id: 'layouts-escala', titulo: 'Layouts de escala', secao: 'escalas', permissao: 'LAYOUT', url: '/escalas/layouts',
    resumo: 'Define as funções de cada celebração e como a escala é organizada e impressa (título, textos e colunas).',
    passos: [
      'Em Layouts de escala, abra um modelo existente ou crie um novo escolhendo se é mensal ou semanal.',
      'Monte o layout com os elementos disponíveis: título, subtítulo, textos livres, data e as vagas de cada função, com posição e largura.',
      'Use os marcadores de texto (título da escala, mês e ano, nome da paróquia) para que o cabeçalho se preencha sozinho.',
      'Marque um layout como padrão para que novas escalas já nasçam com ele. Layouts do sistema podem ser usados, mas não editados.',
    ],
    cuidados: ['Mudar o layout de uma escala já preenchida mantém as pessoas nas vagas que continuam existindo; vagas removidas do layout saem da grade.'],
    perguntas: [{ pergunta: 'Posso ter um layout para cada tipo de missa?', resposta: 'Sim. Crie quantos precisar e escolha o layout ao criar cada escala.' }],
    relacionados: ['escalas'],
  },
  {
    id: 'distribuicao', titulo: 'Distribuir por regras', secao: 'escalas', permissao: 'VAGA_DISTRIBUIR', url: '/escalas',
    resumo: 'Sugere pessoas para as vagas vazias de uma escala em rascunho, aplicando regras que você controla. Nada é gravado até você aplicar.',
    passos: [
      'Na montagem da escala, abra Distribuir por regras.',
      'Defina o máximo de participações por pessoa, o intervalo mínimo em dias entre uma participação e outra e se só entram pessoas que responderam a disponibilidade do mês.',
      'Gere a prévia: a tela mostra cada sugestão com o motivo e, para as vagas sem candidato, quantas pessoas foram descartadas e por quê.',
      'Marque apenas as sugestões que você aceita e use Aplicar. O servidor confere tudo de novo na hora de gravar.',
    ],
    cuidados: [
      'A distribuição é determinística: com os mesmos dados dá o mesmo resultado, sem sorteio escondido.',
      'Se a escala mudou depois da prévia, a aplicação é recusada e você precisa gerar outra prévia.',
      'Sugestão não é decisão: revise as pessoas antes de aplicar.',
    ],
    perguntas: [
      { pergunta: 'A prévia aparece como bloqueada.', resposta: 'Alguma alocação que já existe viola as regras (por exemplo, a pessoa está indisponível). Corrija esse caso na grade e gere de novo.' },
      { pergunta: 'Não vejo o botão.', resposta: 'Ele exige a permissão de distribuir vagas, além da de alocar. Peça ao administrador para incluir no seu perfil.' },
    ],
    relacionados: ['escalas', 'indisponibilidades'],
  },
  {
    id: 'checkin', titulo: 'Check-in dos encontros', secao: 'escalas', permissao: ['CHECKIN', 'PORTAL_VOLUNTARIO'], url: '/portal/checkin',
    resumo: 'Permite que cada pessoa escalada registre a própria presença com um código aberto pela coordenação.',
    passos: [
      'A coordenação, em uma escala finalizada, abre o check-in da celebração e informa por quantos minutos o código vale. O código aparece uma única vez; é possível compartilhar o link.',
      'A pessoa escalada abre o link (ou o Check-in no portal), digita o código e confirma. A presença dela passa a Presente.',
      'Se ela tentar de novo, a tela avisa que já está registrado, sem duplicar.',
      'A coordenação acompanha quem já registrou, encerra o código quando quiser ou abre outro (o anterior deixa de valer).',
    ],
    cuidados: [
      'O check-in só vale para quem tem vaga naquela celebração e dentro da janela de tempo (começa uma hora antes da missa).',
      'Falta marcada pela coordenação não é desfeita pelo código: procure a coordenação.',
      'Quem não consegue usar o código pode ter a presença marcada à mão na escala.',
    ],
    perguntas: [{ pergunta: 'O código foi recusado.', resposta: 'Por segurança a mensagem é a mesma para código errado, vencido ou de outra celebração. Confirme com a coordenação se o código ainda está aberto.' }],
    relacionados: ['escalas', 'portal'],
  },
  {
    id: 'coordenacao', titulo: 'Coordenação: respostas, candidaturas e trocas', secao: 'escalas', permissao: ['VAGA_RESPOSTA_LER', 'VAGA_CANDIDATURA_LER', 'VAGA_TROCA_LER'], url: '/escalas',
    resumo: 'Reúne o que os voluntários responderam, pediram e propuseram para uma escala, para a coordenação decidir.',
    passos: [
      'Abra a escala e use Respostas, Candidaturas ou Trocas, conforme as permissões do seu perfil.',
      'Respostas mostram quem confirmou ou recusou. Uma recusa não tira a pessoa da vaga sozinha: a coordenação providencia a substituição.',
      'Aprovar uma candidatura coloca a pessoa em uma vaga livre. Aprovar uma troca substitui a pessoa original, depois que o indicado aceitou.',
      'Antes de aprovar, o servidor revalida função, disponibilidade e conflito de horário.',
    ],
    cuidados: ['Reabrir ou cancelar a escala invalida os pedidos que estavam em andamento.'],
    relacionados: ['candidaturas', 'trocas', 'escalas'],
  },

  // ---- Comunicação
  {
    id: 'comunicados', titulo: 'Comunicados e autorização de envio', secao: 'comunicacao', permissao: 'COMUNICADO', url: '/comunicados',
    resumo: 'Envia mensagens por e-mail ou WhatsApp para as pessoas selecionadas, usando modelos revisados, e guarda o histórico dos envios.',
    passos: [
      'Em Pessoas, marque os destinatários e use Opções para criar o comunicado, se o seu perfil permitir.',
      'Escolha o canal e o layout. Confira o texto e a prévia antes de enviar.',
      'Acompanhe em Comunicados: o histórico mostra total, enviados, falhas e a situação de cada envio.',
      'Para quem falhou, use Reenviar falhas depois de corrigir o contato.',
      'Em Layouts (menu Comunicação) você mantém os modelos de mensagem de e-mail e de WhatsApp.',
    ],
    cuidados: [
      'Envio aceito pelo serviço não significa que a pessoa leu. O status mostra aceitação, não leitura.',
      'O WhatsApp só chega para quem autorizou. Quem não autorizou aparece como ignorado.',
      'O plano tem cota mensal de mensagens: quando acaba, os envios ficam aguardando sem se perder.',
    ],
    perguntas: [{ pergunta: 'Por que algumas pessoas não receberam?', resposta: 'Veja o histórico do comunicado: o motivo aparece por destinatário (sem contato, sem autorização, falha do provedor).' }],
    relacionados: ['notificacoes', 'pessoas', 'privacidade'],
  },
  {
    id: 'notificacoes', titulo: 'Centro de entregas e avisos automáticos', secao: 'comunicacao', permissao: 'NOTIFICACAO', url: '/entregas',
    resumo: 'Controla os avisos que o sistema envia sozinho (escala finalizada, lembrete, mural) e mostra o histórico de cada entrega.',
    passos: [
      'Em Gatilhos automáticos, ligue só o que a paróquia quer. Todos começam desligados: Escala finalizada, Mural e Lembrete de escala, cada um por e-mail ou WhatsApp.',
      'Com o gatilho ligado, o aviso sai no momento certo (ao finalizar a escala, ao publicar o aviso, ou 24 horas antes da celebração).',
      'Para avisar manualmente uma escala já finalizada, use Avisar escalados dentro da escala. Cada versão da escala é avisada uma única vez por canal.',
      'No Histórico, filtre por origem e veja quantas mensagens estão na fila, foram enviadas ou falharam.',
    ],
    cuidados: [
      'Só recebe quem tem contato e, no WhatsApp, autorização. Os demais são contados como ignorados.',
      'Enviado significa aceito pelo provedor, não lido.',
      'Reabrir e finalizar a escala de novo gera uma versão nova, que pode ser avisada outra vez.',
    ],
    perguntas: [{ pergunta: 'Ligar o gatilho envia o que já passou?', resposta: 'Não. O gatilho vale daqui para frente. Para uma escala já finalizada, use o aviso manual.' }],
    relacionados: ['comunicados', 'escalas', 'mural'],
  },
  {
    id: 'mural', titulo: 'Mural: avisos publicados', secao: 'comunicacao', permissao: 'MURAL', url: '/mural',
    resumo: 'Quadro de avisos internos da paróquia, para todos ou para pessoas selecionadas.',
    passos: [
      'Abra o Mural para ler os avisos publicados. Quem tem permissão cria o aviso, revisa e publica.',
      'Escolha o público: todos ou um grupo selecionado de pessoas.',
      'Arquive o aviso quando ele deixar de valer.',
    ],
    cuidados: [
      'Publicar no mural não envia e-mail nem WhatsApp por conta própria; isso só acontece se o gatilho do Mural estiver ligado no Centro de entregas.',
      'Não há confirmação de leitura.',
    ],
    relacionados: ['notificacoes', 'tarefas'],
  },
  {
    id: 'aniversarios', titulo: 'Felicitações de aniversário', secao: 'comunicacao', permissao: 'ANIVERSARIO', url: '/aniversarios',
    resumo: 'Prepara mensagens de aniversário apenas para quem autorizou esse tipo de mensagem.',
    passos: [
      'Em cada canal (e-mail e WhatsApp), escolha o layout revisado e habilite as felicitações.',
      'Registre a autorização de cada pessoa separadamente, com uma referência curta de como foi dada. Autorização geral de WhatsApp não vale para felicitações.',
      'Para revogar, registre a revogação com o motivo: a pessoa deixa de receber.',
      'O envio depende de o agendador estar ativado no ambiente; a tela mostra um aviso quando ele está desligado.',
    ],
    cuidados: ['Não presuma autorização a partir de telefone, nascimento ou participação. Sem autorização específica, nada é enviado.', 'Quem nasceu em 29/02 é lembrado em 28/02 nos anos não bissextos.'],
    relacionados: ['privacidade', 'comunicados'],
  },

  // ---- Financeiro
  {
    id: 'contas-bancarias', titulo: 'Cadastrar contas bancárias e caixa', secao: 'financeiro', permissao: 'FINANCEIRO', url: '/contas-bancarias',
    resumo: 'Guarda onde a paróquia movimenta dinheiro. A conta bancária é diferente da conta contábil, que classifica cada entrada ou saída.',
    passos: [
      'Abra Cadastro › Contas bancárias e use Nova conta. Dê um nome fácil de reconhecer, como Banco do Brasil principal ou Caixa da secretaria.',
      'Escolha o tipo. Para conta corrente ou poupança, preencha banco, agência, número e titular. Para dinheiro físico, escolha Caixa.',
      'Informe o saldo que já existia e a data desse saldo antes de registrar lançamentos. Depois do primeiro lançamento, esses dois campos ficam protegidos.',
      'Se a conta receber PIX, adicione as chaves e marque uma como principal. Confira cada chave antes de salvar.',
      'No Financeiro, escolha a conta ao criar um lançamento. Dê baixa quando o dinheiro realmente entrar ou sair.',
    ],
    cuidados: ['Agência, número da conta, titular e chaves PIX ficam visíveis apenas para quem configura o financeiro.', 'Uma conta inativa mantém o histórico, mas não recebe lançamentos novos.'],
    perguntas: [{ pergunta: 'O que faço se só tenho dinheiro em espécie?', resposta: 'Cadastre uma conta do tipo Caixa. Ela representa o dinheiro físico e não exige agência nem número bancário.' }],
    relacionados: ['financeiro'],
  },
  {
    id: 'financeiro', titulo: 'Financeiro: plano de contas, lançamentos e saldos', secao: 'financeiro', permissao: 'FINANCEIRO', url: '/financeiro',
    resumo: 'Controla o dinheiro da paróquia: contas ou bancos, plano de contas, entradas e saídas, baixas e saldo.',
    passos: [
      'Em Cadastro › Contas bancárias, use Nova conta para cadastrar o Caixa e cada conta do banco: tipo, banco, agência, conta, titular, chaves PIX, saldo inicial e a data dele. Em conta corrente ou poupança, banco, agência, conta e titular são obrigatórios.',
      'Em Plano de contas, crie os grupos (por exemplo Despesas fixas, Doações) e, dentro de cada grupo, as contas contábeis (Energia, Dízimo). Só a conta contábil recebe lançamento; ela herda o tipo do grupo (entrada ou saída).',
      'Em Lançamentos, crie a entrada ou a saída com valor, vencimento, a conta/banco e a conta contábil. Um lançamento pendente ainda não é dinheiro recebido ou pago.',
      'Quando o dinheiro for recebido ou pago, use Dar baixa e informe a data real. O saldo e o resultado do período usam a data da baixa.',
      'Para corrigir uma baixa, use Estornar: o lançamento volta a pendente e pode ser editado. Cancelar preserva o histórico.',
    ],
    cuidados: [
      'O saldo inicial de uma conta não muda depois do primeiro lançamento nela.',
      'O tipo de um grupo ou conta não muda enquanto houver contas ou lançamentos ligados a eles.',
      'Se aparecer conflito de atualização, recarregue o lançamento: outra pessoa pode tê-lo alterado.',
    ],
    perguntas: [
      { pergunta: 'O que é "conta" e o que é "conta contábil"?', resposta: 'Conta (ou banco) é onde o dinheiro está: Caixa, Banco. Conta contábil é a classificação do lançamento: Energia, Doações. Cada lançamento tem as duas.' },
      { pergunta: 'Por que o Novo lançamento está desabilitado?', resposta: 'É preciso ter ao menos uma conta/banco ativa e uma conta contábil ativa, dentro de um grupo ativo.' },
      { pergunta: 'Posso apagar um lançamento?', resposta: 'Não: para manter o histórico, cancele (se pendente) ou estorne a baixa antes de cancelar.' },
    ],
    relacionados: ['relatorios'],
  },

  // ---- Pastoral e eventos
  {
    id: 'pastorais', titulo: 'Pastorais, equipes e participantes', secao: 'pastoral', permissao: 'PASTORAL', url: '/pastorais',
    resumo: 'Organiza as equipes da paróquia, seus participantes e quem as coordena.',
    passos: [
      'Crie a equipe e inclua os participantes, conforme as permissões do seu perfil.',
      'Marque quem é coordenador da equipe. Em Minhas pastorais, o coordenador vê as equipes que coordena e consegue acompanhar os participantes.',
      'Equipes inativas preservam os participantes, mas não aceitam novos.',
    ],
    cuidados: [
      'Ser coordenador de uma equipe não muda as permissões da conta. O que cada pessoa pode fazer continua definido no perfil.',
      'Para aparecer em Minhas pastorais, a conta precisa estar vinculada a uma pessoa: veja Vincular usuário à pessoa.',
    ],
    perguntas: [{ pergunta: 'Minhas pastorais mostra "Vincule a conta à pessoa da coordenação".', resposta: 'A conta ainda não está ligada à sua ficha. Peça ao administrador para fazer o vínculo.' }],
    relacionados: ['vinculos', 'tarefas'],
  },
  {
    id: 'eventos', titulo: 'Eventos e inscrições', secao: 'pastoral', permissao: 'EVENTO', url: '/eventos',
    resumo: 'Cria eventos com vagas, recebe inscrições e acompanha quem confirmou.',
    passos: [
      'Em Eventos, use Novo evento: título, descrição, data e hora de início e término, número de vagas (vazio = sem limite) e os lembretes.',
      'Revise e publique para começar as inscrições. Na ficha do evento, busque uma pessoa já cadastrada pelo nome para inscrevê-la.',
      'Respeite a disponibilidade de vagas: com o evento cheio, a inscrição é recusada.',
      'Confira na ficha a situação das mensagens: uma pessoa inscrita pode não ter autorizado receber WhatsApp.',
    ],
    cuidados: ['A inscrição pública (por link) exige aprovação em Pessoas, na aba Aguardando.'],
    relacionados: ['pessoas', 'comunicados'],
  },
  {
    id: 'tarefas', titulo: 'Tarefas e solicitações', secao: 'pastoral', permissao: 'TAREFA', url: '/tarefas',
    resumo: 'Registra pendências da paróquia com prazo, equipe e responsável.',
    passos: [
      'Crie a tarefa com título, prazo, equipe e uma conta responsável, conforme o seu perfil.',
      'Atualize a situação e filtre por responsável, por minhas tarefas ou pendentes.',
    ],
    cuidados: ['Atribuir uma tarefa não concede acesso e não envia mensagem: é uma referência de organização.'],
    relacionados: ['mural', 'pastorais'],
  },
  {
    id: 'liturgia', titulo: 'Referências e roteiros litúrgicos', secao: 'pastoral', permissao: 'LITURGIA', url: '/liturgia',
    resumo: 'Guarda as referências que a equipe usa e monta roteiros de celebração passo a passo, tudo escrito por vocês.',
    passos: [
      'Em Referências, cadastre título, fonte, endereço (opcional) e observações. O sistema não acessa o endereço nem copia textos.',
      'Em Roteiros, crie o roteiro com título, a celebração e uma sequência de 1 a 50 passos, cada um com título, referência opcional e observação.',
      'Reordenar ou editar passos exige salvar de forma explícita.',
      'Referência arquivada continua aparecendo nos roteiros que já a usam; para salvar o roteiro de novo, reative a referência ou troque o passo.',
    ],
    cuidados: ['O conteúdo litúrgico é informado e revisado pela equipe: não é gerado pelo sistema e não está ligado ao calendário.'],
    relacionados: ['escalas'],
  },
  {
    id: 'estoque', titulo: 'Estoque e patrimônio', secao: 'pastoral', permissao: 'ESTOQUE', url: '/estoque',
    resumo: 'Controla itens consumíveis (velas, hóstias) e patrimônio (alfaias, equipamentos) com entradas, saídas e inventário.',
    passos: [
      'Cadastre o item: tipo (consumível ou patrimônio), código ou etiqueta único, nome, unidade, local e responsável opcional. Todo item começa com saldo zero.',
      'O saldo só muda por movimentos: Entrada, Saída ou Ajuste de inventário (você informa o saldo contado, não a diferença).',
      'Informe o motivo de cada movimento. O histórico guarda saldo antes e depois, quem fez e quando.',
    ],
    cuidados: [
      'Não existe estoque negativo.',
      'Não há exclusão nem estorno automático: erros se corrigem com um novo movimento explicado.',
      'Estoque não é lançamento financeiro: entrada e saída aqui não mexem no Financeiro.',
    ],
    perguntas: [{ pergunta: 'A conexão caiu ao salvar um movimento.', resposta: 'Repita exatamente o mesmo pedido: o sistema reconhece a repetição e não soma duas vezes. Depois confira o histórico.' }],
    relacionados: ['financeiro'],
  },

  // ---- Meu espaço
  {
    id: 'portal', titulo: 'Meus compromissos: confirmar ou recusar', secao: 'meu-espaco', permissao: 'PORTAL_VOLUNTARIO', url: '/portal',
    resumo: 'A área do voluntário: escalas finalizadas e eventos em que ele está inscrito, com a opção de confirmar ou recusar.',
    passos: [
      'O portal mostra seus compromissos. Se não aparecer nada, a conta talvez não esteja vinculada à sua ficha: peça ao administrador.',
      'Confira o período e os horários (de Brasília). Confirmar indica que você vai; a presença é registrada depois.',
      'Você pode confirmar ou recusar antes do início da celebração. Recusar mantém você na vaga até a coordenação providenciar substituição.',
      'Se a vaga mudou, atualize a página antes de responder de novo. Consulte o Histórico para ver suas decisões.',
      'Em Dependentes, responsáveis autorizados veem os compromissos dos filhos. Peça à paróquia para conferir o vínculo e a autorização, se a lista estiver vazia.',
    ],
    cuidados: ['O calendário privado dá acesso aos seus compromissos: trate o endereço como uma senha.'],
    relacionados: ['candidaturas', 'trocas', 'calendario', 'indisponibilidades', 'checkin'],
  },
  {
    id: 'candidaturas', titulo: 'Vagas abertas e candidaturas', secao: 'meu-espaco', permissao: 'PORTAL_VOLUNTARIO', url: '/portal/vagas',
    resumo: 'Permite se oferecer para vagas que ficaram abertas na escala.',
    passos: [
      'Abra Vagas e candidaturas, escolha o período e confira função, horário e possíveis impedimentos.',
      'Candidatar-se não reserva a vaga: a coordenação decide. É preciso ter a função habilitada e disponibilidade compatível.',
      'Acompanhe o pedido em Minhas candidaturas. Você pode desistir de um pedido pendente.',
      'Se for aprovado, o compromisso aparece no portal e você ainda precisa confirmar a participação.',
    ],
    relacionados: ['portal', 'coordenacao'],
  },
  {
    id: 'trocas', titulo: 'Trocas de escala: pedir, aceitar e aprovar', secao: 'meu-espaco', permissao: ['PORTAL_VOLUNTARIO', 'VAGA_TROCA_LER'], url: '/portal/trocas',
    resumo: 'Fluxo para trocar de lugar com outra pessoa, com o aceite do substituto e a aprovação da coordenação.',
    passos: [
      'No portal, abra Trocas de escala, selecione seu compromisso e busque o nome do substituto (a partir de duas letras).',
      'O indicado entra na própria conta e aceita ou recusa. Aceitar ainda não muda a escala.',
      'A coordenação aprova ou recusa depois do aceite. Até lá, quem pediu continua na vaga e pode cancelar o pedido.',
      'A aprovação troca somente aquela vaga e reinicia participação e presença como pendentes.',
    ],
    cuidados: ['Se a vaga ou a disponibilidade mudar, atualize os dados antes de insistir.'],
    relacionados: ['portal', 'coordenacao'],
  },
  {
    id: 'calendario', titulo: 'Calendário privado dos compromissos', secao: 'meu-espaco', permissao: 'CALENDARIO', url: '/portal',
    resumo: 'Leva seus compromissos para o aplicativo de calendário do celular.',
    passos: [
      'No portal, gere a assinatura do calendário e copie o endereço para o aplicativo de calendário que você usa.',
      'Você pode revogar a assinatura a qualquer momento; gerar outra substitui o endereço anterior.',
      'A atualização depende do aplicativo: confira sempre o portal para a situação de participação.',
    ],
    cuidados: ['O endereço dá acesso aos seus compromissos. Guarde-o como uma senha e não o compartilhe.'],
    relacionados: ['portal'],
  },

  // ---- Relatórios e indicadores
  {
    id: 'relatorios', titulo: 'Relatórios', secao: 'relatorios', permissao: 'AUDITORIA', url: '/relatorios/participacao',
    resumo: 'Lista a participação nas escalas finalizadas em um período e permite baixar os resultados filtrados em vários formatos.',
    passos: [
      'Escolha o período (até 366 dias) e use Buscar. A lista mostra, por pessoa, as participações, presenças e faltas.',
      'Para levar os dados para fora do sistema, escolha CSV, JSON, Excel, PDF ou imagem e use Exportar. Ela traz todos os resultados dos filtros aplicados, até 5.000 linhas.',
      'Quando a imagem ocupar várias páginas, o arquivo baixado será um ZIP com as imagens numeradas.',
      'Se o resultado vier vazio, confira se há escalas finalizadas no período: rascunhos não entram.',
    ],
    cuidados: ['O arquivo exportado contém nomes e datas. Guarde e compartilhe com cuidado.'],
    relacionados: ['indicadores', 'escalas'],
  },
  {
    id: 'indicadores', titulo: 'Indicadores privados de participação', secao: 'relatorios', permissao: ['INDICADORES', 'ESCALA'], url: '/indicadores',
    resumo: 'Contagens para a coordenação acompanhar a participação, em ordem alfabética: nunca como ranking ou pontuação.',
    passos: [
      'Escolha o período e, se quiser, busque por nome. O resumo do topo vale para o período inteiro, não só para a página.',
      'Por pessoa, a tela mostra alocações, presenças, faltas, presenças pendentes, confirmações e recusas.',
      'Use os números para conversar e acolher, não para punir.',
    ],
    cuidados: [
      'Confirmar não prova presença, e presença pendente pode ser de uma celebração futura.',
      'Só entram as escalas finalizadas. Participação em eventos gerais não é medida aqui.',
      'Os indicadores são privados: não há página pública nem envio automático.',
    ],
    relacionados: ['relatorios', 'escalas'],
  },
];
