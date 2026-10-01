import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';

const TEMAS = [
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
    'Consulte indisponibilidades e funções habilitadas ao preencher as vagas. Confira os avisos e conflitos apresentados.',
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
    'Acompanhe as mensagens no histórico. Envio aceito pelo serviço não significa que a pessoa leu a mensagem.']}
] as const;
const normalizar=(texto:string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

@Component({
  selector:'app-ajuda',
  imports:[RouterLink,CabecalhoPaginaComponent,BarraFiltrosComponent],
  changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Ajuda" subtitulo="Orientações rápidas para as rotinas da paróquia." />
      <app-barra-filtros placeholder="Buscar uma orientação" [termo]="busca()" (termoChange)="busca.set($event)" />
      @for(tema of temas();track tema.id) {
        <details class="card p-5" [open]="tema.id===temaInicial" [attr.data-tema]="tema.id">
          <summary class="cursor-pointer text-lg font-bold text-[var(--ink)]">{{ tema.titulo }}</summary>
          <ol class="mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--muted)]">
            @for(passo of tema.passos;track $index){<li>{{ passo }}</li>}
          </ol>
          <a class="btn-secondary mt-4 inline-flex" [routerLink]="tema.url">Abrir módulo</a>
        </details>
      } @empty {<p class="card p-6 text-[var(--muted)]">Nenhuma orientação encontrada para esta busca.</p>}
    </div>
  `
})
export class AjudaComponent {
  private readonly sessao=inject(SessaoAtual);
  readonly temaInicial=inject(ActivatedRoute).snapshot.queryParamMap.get('tema');
  readonly busca=signal('');
  readonly temas=computed(() => {
    const termo=normalizar(this.busca().trim());
    return TEMAS.filter(t => (!t.permissao || this.sessao.permissoes().includes(t.permissao)) &&
      (!termo || normalizar(t.titulo+' '+t.passos.join(' ')).includes(termo)));
  });
}
