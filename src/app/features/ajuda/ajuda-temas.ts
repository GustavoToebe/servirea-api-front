/** Conteúdo estático, sem fichas ou requisições de negócio. */
export interface TemaAjuda {id:string;titulo:string;permissao:string|readonly string[]|null;url:string|null;passos:readonly string[];}
export const TEMAS:readonly TemaAjuda[] = [
  {id:'acesso',titulo:'Acesso e permissões',permissao:null,url:'/meu-perfil',passos:[
    'Use o e-mail do convite para definir sua senha e entrar. Se esqueceu a senha, use a recuperação na tela de login.',
    'O menu mostra os módulos permitidos pelo seu perfil. Se uma ação necessária não aparecer, peça à pessoa responsável pelos acessos da paróquia.',
    'Se aparecer a mensagem de muitas tentativas, aguarde o intervalo informado antes de tentar novamente.']},
  {id:'pessoas',titulo:'Pessoas, responsáveis e dependentes',permissao:'PESSOA',url:'/pessoas',passos:[
    'Busque pelo nome ou número da pessoa antes de criar outra ficha. Confira os possíveis duplicados apresentados no cadastro.',
    'Uma pessoa pode ser voluntária, responsável ou ter ambos os papéis. Nos vínculos, busque pelo nome de quem já está cadastrado.',
    'Marque as pessoas da página atual para imprimir uma listagem ou preparar um comunicado. Ao trocar de página, a seleção é limpa.',
    'Cuidados pessoais aparecem somente para perfis autorizados. Informe apenas o necessário para acolher e cuidar da pessoa.']},
  {id:'escalas',titulo:'Montar uma escala',permissao:'ESCALA',url:'/escalas',passos:[
    'Cadastre as celebrações e as funções necessárias. Confira o mês e os horários antes de distribuir as pessoas.',
    'O voluntário pode informar suas datas pelo portal em Minha indisponibilidade. Consulte indisponibilidades e funções habilitadas ao preencher as vagas. Confira os avisos e conflitos apresentados.',
    'Revise a escala antes de compartilhar ou exportar. Confirmar a participação e registrar a presença são ações diferentes.']},
  {id:'eventos',titulo:'Eventos e inscrições',permissao:'EVENTO',url:'/eventos',passos:[
    'Crie o evento com título, data, local e vagas. Revise as informações e publique antes de inscrever pessoas.',
    'Na ficha do evento, busque uma pessoa cadastrada pelo nome para inscrevê-la. Respeite a disponibilidade de vagas.',
    'Confira a situação das mensagens na ficha. Uma pessoa inscrita pode não ter autorizado receber WhatsApp.']},
  {id:'financeiro',titulo:'Financeiro: lançamento, baixa e estorno',permissao:'FINANCEIRO',url:'/financeiro',passos:[
    'Cadastre as contas ou bancos e as categorias antes do primeiro lançamento. Confira o saldo inicial e a data correspondente.',
    'Registre uma entrada ou saída com valor, conta, categoria e vencimento. Um lançamento pendente ainda não é um recebimento ou pagamento confirmado.',
    'Dê baixa quando o dinheiro tiver sido recebido ou pago. Confira valor e data da baixa.',
    'Para corrigir uma baixa, estorne primeiro. Cancelamento preserva o histórico. Se houver conflito de atualização, recarregue o lançamento antes de tentar novamente.']},
  {id:'comunicados',titulo:'Comunicados e autorização de envio',permissao:'COMUNICADO',url:'/comunicados',passos:[
    'Selecione os destinatários em Pessoas e use a opção de criar comunicado, se seu perfil permitir.',
    'Confira o canal, o texto e a prévia antes de enviar. Mantenha os contatos atualizados e respeite a autorização de WhatsApp.',
    'Acompanhe as mensagens no histórico. Envio aceito pelo serviço não significa que a pessoa leu a mensagem.']},
  {id:'portal',titulo:'Meus compromissos: confirmar ou recusar',permissao:'PORTAL_VOLUNTARIO',url:'/portal',passos:[
    'O portal mostra suas escalas finalizadas e eventos em que você está inscrito. Se não houver vínculo pessoal, peça ao administrador para associar sua conta à ficha correta.',
    'Confira o período e os horários de Brasília. Confirmar indica intenção de participar; presença é registrada separadamente pela coordenação.',
    'Você pode confirmar ou recusar antes do início da celebração, se seu perfil permitir. Recusar mantém sua alocação até a coordenação providenciar substituição.',
    'Se a vaga mudou, atualize a página antes de responder novamente. Consulte Histórico para acompanhar suas decisões.']},
  {id:'candidaturas',titulo:'Vagas abertas e candidaturas',permissao:'PORTAL_VOLUNTARIO',url:'/portal/vagas',passos:[
    'Abra Vagas e candidaturas e escolha o período. Confira função, horário e possíveis impedimentos.',
    'Candidatar-se não reserva a vaga: aguarde a decisão da coordenação. É necessário ter função habilitada e disponibilidade compatível.',
    'Acompanhe o pedido em Minhas candidaturas. Você pode desistir de um pedido pendente.',
    'Após aprovação, o compromisso aparece no portal e sua participação ainda precisa ser confirmada.']},
  {id:'trocas',titulo:'Trocas de escala: pedir, aceitar e aprovar',permissao:['PORTAL_VOLUNTARIO','VAGA_TROCA_LER'],url:null,passos:[
    'No portal, abra Trocas de escala, selecione seu compromisso e busque o nome do substituto com pelo menos duas letras.',
    'O indicado entra na própria conta e aceita ou recusa o pedido. Aceitar ainda não muda a escala.',
    'A coordenação abre Trocas na montagem da escala para aprovar ou recusar depois do aceite. A pessoa original permanece alocada até a aprovação.',
    'A aprovação troca somente aquela vaga e reinicia participação e presença como pendentes. Antes da aprovação, o solicitante pode cancelar o pedido.',
    'Se a vaga ou a disponibilidade mudar, atualize os dados. Consulte os pedidos enviados e recebidos para acompanhar a situação.']},
  {id:'coordenacao',titulo:'Coordenação: respostas, candidaturas e trocas',permissao:['VAGA_RESPOSTA_LER','VAGA_CANDIDATURA_LER','VAGA_TROCA_LER'],url:'/escalas',passos:[
    'Abra a montagem da escala e use Respostas, Candidaturas ou Trocas, conforme as permissões do seu perfil.',
    'Resposta de participação e presença são informações diferentes. Uma recusa não remove automaticamente a pessoa da vaga.',
    'Aprovar candidatura aloca a pessoa em uma vaga livre. Aprovar troca substitui a pessoa original depois do aceite do indicado.',
    'A API revalida função, disponibilidade e conflito de horário antes de aprovar. Reabrir ou cancelar escala invalida pedidos em andamento.']},
  {id:'vinculos',titulo:'Vincular usuário à pessoa do portal',permissao:'USUARIO_ALTERAR',url:'/usuarios/vinculos',passos:[
    'Selecione a conta e a ficha da pessoa correta em Vínculos de pessoas.',
    'A associação é explícita: compartilhar nome ou e-mail não cria um vínculo automaticamente.',
    'Confira a identidade antes de salvar. Mudar o vínculo altera os compromissos acessíveis e invalida o calendário privado anterior.',
    'Este vínculo dá acesso à própria pessoa. O acesso ao portal de dependentes ainda não está disponível.']},
  {id:'calendario',titulo:'Calendário privado dos compromissos',permissao:'CALENDARIO',url:'/portal',passos:[
    'No portal, gere a assinatura do calendário privado e copie o endereço para o aplicativo de calendário escolhido.',
    'O endereço dá acesso aos seus compromissos. Guarde-o como uma senha e não o compartilhe.',
    'Você pode revogar a assinatura. Gerar outra substitui o endereço anterior.',
    'A atualização depende do aplicativo de calendário. Confira sempre o portal para a situação atual de participação.']},
  {id:'pastorais',titulo:'Pastorais, equipes e participantes',permissao:'PASTORAL',url:'/pastorais',passos:[
    'Crie a equipe e organize os participantes, conforme as permissões do seu perfil.',
    'Marcar uma pessoa como coordenadora da equipe não altera as permissões de sua conta.',
    'As permissões de leitura e edição continuam sendo definidas nos perfis da paróquia.']},
  {id:'mural',titulo:'Mural: avisos publicados',permissao:'MURAL',url:'/mural',passos:[
    'Abra o mural para ler os avisos publicados. Se seu perfil permitir, crie e revise o aviso antes de publicar.',
    'Arquive o aviso quando ele deixar de ser atual.',
    'Publicar no mural não envia e-mail ou WhatsApp automaticamente e não registra confirmação de leitura.']},
  {id:'tarefas',titulo:'Tarefas e solicitações',permissao:'TAREFA',url:'/tarefas',passos:[
    'Registre título, prazo, equipe e uma conta responsável da paróquia, conforme as permissões do seu perfil.',
    'Atualize a situação e filtre por responsável, por minhas tarefas ou por tarefas pendentes. A atribuição não concede acesso nem envia mensagens.',
    'O nome da equipe é uma referência de organização. Ele não concede acesso nem envia uma notificação automática.']},
  {id:'importacao',titulo:'Importar pessoas por CSV ou XLSX',permissao:['PESSOA','PESSOA_CRIAR'],url:'/pessoas',passos:[
    'Em Pessoas, abra Importar se seu perfil permitir criar pessoas. Use o modelo CSV oferecido pela tela.',
    'Revise a prévia, os erros e os possíveis duplicados antes de confirmar.',
    'Confira os limites do plano antes de concluir o lote. Um lote CSV/XLSX confirmado conta como uma importação mensal.',
    'Selecione CSV ou XLSX, leia as colunas, escolha a aba e mapeie nome/papel e contatos opcionais. CPF e telefone no Excel precisam estar como texto. A prévia não cria pessoas; duplicidades bloqueiam o lote, sem mesclar fichas.']},
  {id:'limites',titulo:'Meu plano, limites e consumo',permissao:null,url:null,passos:[
    'Abra Minha conta no menu do perfil para consultar o plano, recursos e consumo disponíveis.',
    'Limite do plano e permissão do usuário são controles diferentes. Uma funcionalidade incluída também pode exigir autorização no perfil.',
    'Inventário pendente de arquivos indica tamanhos ainda desconhecidos. Peça ao administrador para conferir antes de considerar o espaço disponível.',
    'Se uma ação for bloqueada pelo limite, confira o consumo e fale com o administrador. Repetir a ação não aumenta a cota.']}

];
