import {firstValueFrom} from 'rxjs';
import { NotificacoesApiService, CanalNotificacao } from '../../../notificacoes/notificacoes-api.service';
import { mensagemApi } from '../../../../core/api/api-error';
import { OrientacaoToggleComponent } from '../../../../shared/components/orientacao-toggle/orientacao-toggle.component';
import { Orientacao, lerOrientacao } from '../../../../shared/export/orientacao';
import { SessaoAtual } from '../../../../core/layout/sessao-atual';
import { CommonModule } from '@angular/common';
import { NumeroComponent } from '../../../../shared/components/numero/numero.component';
import { CampoDataComponent } from '../../../../shared/components/datas/campo-data.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { Marcadores, VolunteerPickerComponent } from '../../../../shared/components/volunteer-picker/volunteer-picker.component';
import { FUNCOES_LABEL, FuncaoEscala, Voluntario } from '../../../voluntarios/models/voluntario.model';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  ApoioEscala, ColunaEscala, COLUNAS_PADRAO_MENSAL, COLUNAS_PADRAO_SEMANAL, EscalaDetalhe, EscalaEvento,
  EscalaVaga, LayoutEscala, MESES, STATUS_LABEL, StatusEscala, TipoEscala, vagasDoLayout, indisponivelEm
} from '../../models/escala.model';
import { TITULOS_CELEBRACAO } from '../../data/calendario-liturgico';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { ReplicarDialogComponent } from '../replicar-dialog.component';
import { AindaNaoEscaladosComponent } from '../../components/ainda-nao-escalados.component';
import { dataCurta, dataLonga, diaDaSemana, diaEData } from './formatos-data';

/** Uma linha da grade, calculada só quando os eventos mudam (PLANO-008). */
interface Linha {
  evento: EscalaEvento;
  chave: string;
  diaEData: string;
  dataLonga: string;
  diaSemana: string;
  /** Semana do mês (segunda a domingo); 0 = fora do mês (referência). */
  semana: number;
  novaSemana: boolean;
  hoje: boolean;
  fimDeSemana: 'SAB' | 'DOM' | null;
  vagasPorColuna: Record<string, EscalaVaga>;
  /** "Vela 1", "Missal": rótulo de cada vaga do cartão da mensal. */
  rotulos: Record<string, string>;
  usados: ReadonlySet<string>;
  marcadores: Marcadores | null;
  preenchidas: number;
}

interface Painel { top: number; left: number; }

const CHAVE_PAINEL = 'servire.painelEscalados';

@Component({
    selector: 'app-escala-builder',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, OrientacaoToggleComponent, VolunteerPickerComponent, NumeroComponent, CampoDataComponent,
      ReplicarDialogComponent, AindaNaoEscaladosComponent],
    templateUrl: './escala-builder.component.html'
})
export class EscalaBuilderComponent implements OnInit, HasPendingChanges {
  id: string | null = null;
  months = MESES;
  volunteers: Voluntario[] = [];
  status: StatusEscala = 'RASCUNHO';
  loading = true; saving = false; error = ''; saved = false; eventsDirty = false;
  addDate = '';
  addTime = '19:00';
  addCelebration = 'Missa';
  celebrationOptions = TITULOS_CELEBRACAO;
  currentDetail: EscalaDetalhe | null = null;
  replicarAberto = false;
  observacaoAberta = false;
  layouts: LayoutEscala[] = [];
  readonly esqueleto = [1, 2, 3, 4, 5, 6];
  colunas: ColunaEscala[] = [...COLUNAS_PADRAO_SEMANAL];
  /** Só as vagas do layout — Título, Subtítulo e Textos não viram coluna da grade. */
  get colunasVaga() { return vagasDoLayout(this.colunas); }

  // ---- Modelo de tela pré-calculado (PLANO-008)
  linhas: Linha[] = [];
  linhasSemanal: Linha[] = [];
  preenchidas = 0;
  total = 0;
  referenciasCount = 0;
  revisao = 0;

  // ---- Apoio à mensal (PLANO-007)
  apoio: ApoioEscala | null = null;
  sugestaoIrmao: { chave: string; irmaoId: string; nomeIrmao: string; nomePessoa: string } | null = null;
  painelAberto = false;
  painelDesktop = true;
  modoSemanal: 'CARTOES' | 'TABELA' = 'CARTOES';

  // ---- Mini-painéis
  painelAtivo: Painel | null = null;
  edicao: Linha | null = null;
  novoDiaAberto = false;
  menuAberto = false;

  private _events: EscalaEvento[] = [];

  form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    tipo: ['MENSAL' as TipoEscala, Validators.required],
    layoutId: [null as string | null],
    ano: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
    mes: [new Date().getMonth()+1, [Validators.required, Validators.min(1), Validators.max(12)]],
    observacao: ['']
  });

  get events(): EscalaEvento[] { return this._events; }
  /** Trocar os eventos recalcula as linhas da grade. */
  set events(valor: EscalaEvento[]) { this._events = valor; this.recalcular(); }

  get readOnly() { return this.status !== 'RASCUNHO'; }
  /** Numa escala já salva, modelo/ano/mês não mudam pela tela (apagaria a grade); para outro mês existe o Replicar. */
  get metaTravada() { return this.readOnly || !!this.id; }
  /** Só layouts ativos do modelo; o já escolhido numa escala existente fica mesmo se foi inativado depois. */
  get layoutsFiltrados() {
    const atual = this.form.controls.layoutId.value;
    return this.layouts.filter(l => l.tipo === this.form.controls.tipo.value && (l.ativo || l.id === atual));
  }
  get ehMensal() { return this.form.controls.tipo.value === 'MENSAL'; }
  get progresso() { return this.total ? Math.round((this.preenchidas / this.total) * 100) : 0; }
  get pendentes() { return this.apoio?.voluntarios.filter(v => v.situacao === 'PENDENTE').length ?? 0; }
  get temAcoesExtras() { return this.status === 'RASCUNHO' || !!this.id; }

  private dialogo = inject(DialogoService);
  private authService = inject(AuthService);
  private notificacoes = inject(NotificacoesApiService);
  avisando = false;

  /** Enfileira a escala finalizada para cada pessoa escalada com contato (e, no WhatsApp, autorização). */
  async avisarEscalados(canal: CanalNotificacao) {
    if (!this.id || this.avisando) return;
    const nome = canal === 'EMAIL' ? 'e-mail' : 'WhatsApp';
    if (!await this.dialogo.confirmar({ mensagem: `Avisar por ${nome} cada pessoa escalada? As mensagens entram na fila de comunicados e esta versão da escala não é avisada de novo por este canal.`, confirmar: 'Avisar' })) return;
    this.avisando = true;
    try {
      const r = await firstValueFrom(this.notificacoes.notificarEscala(this.id, canal));
      await this.dialogo.avisar(`${r.total} mensagens na fila.${r.ignorados ? ` ${r.ignorados} pessoas sem contato ou autorização foram ignoradas.` : ''}`, 'Escalados avisados');
    } catch (e) {
      await this.dialogo.avisar(mensagemApi(e, 'Não foi possível avisar os escalados.'));
    } finally {
      this.avisando = false;
    }
  }
  readonly sessaoRespostas = inject(SessaoAtual);

  get linhasCelebracaoLayout(): { index: number; elementos: ColunaEscala[] }[] {
    const celBlocos = (this.colunas || []).filter(c => (c.escopo || 'CELEBRACAO') === 'CELEBRACAO');
    const temLinhas = celBlocos.some(c => c.linha !== undefined);
    if (!temLinhas) {
      const vagas = vagasDoLayout(this.colunas);
      if (!vagas.length) return [];
      const res: { index: number; elementos: ColunaEscala[] }[] = [];
      res.push({ index: 0, elementos: [{ tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#' }] });
      let lin = 1;
      for (let i = 0; i < vagas.length; i += 3) {
        const pedaco = vagas.slice(i, i + 3).map((v, col) => ({
          ...v,
          tipo: 'VAGA' as const,
          escopo: 'CELEBRACAO' as const,
          linha: lin,
          coluna: col,
          largura: 1
        }));
        res.push({ index: lin, elementos: pedaco });
        lin++;
      }
      return res;
    }
    const maxLinha = celBlocos.reduce((max, e) => Math.max(max, e.linha || 0), -1);
    const result: { index: number; elementos: ColunaEscala[] }[] = [];
    for (let i = 0; i <= maxLinha; i++) {
      const els = celBlocos.filter(e => (e.linha || 0) === i).sort((a, b) => (a.coluna || 0) - (b.coluna || 0));
      if (els.length > 0) result.push({ index: i, elementos: els });
    }
    return result;
  }

  get textosCabecalho(): ColunaEscala[] {
    return (this.colunas || [])
      .filter(c => c.escopo === 'DOCUMENTO' && c.tipo && c.tipo !== 'VAGA')
      .sort((a, b) => (a.linha || 0) - (b.linha || 0) || (a.coluna || 0) - (b.coluna || 0));
  }

  getAlignClass(align?: string) {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  }

  resolverTextoTag(texto?: string): string {
    const { titulo, mes, ano } = this.form.getRawValue();
    const paroquia = this.authService.tenantNome() || 'Paróquia';
    const mesAno = `${MESES[mes - 1]} ${ano}`;
    return (texto || '')
      .replaceAll('#TITULO_ESCALA#', titulo || '')
      .replaceAll('#MES_ANO#', mesAno)
      .replaceAll('#PAROQUIA#', paroquia);
  }

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private service: EscalasService, private volunteersService: VoluntariosService, private exporter: ExportService, private layoutsService: LayoutsEscalaService) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    try {
      this.painelDesktop = localStorage.getItem(CHAVE_PAINEL) !== 'recolhido';
    } catch { /* sem localStorage: painel aberto */ }
    try {

      await this.carregarArraste();
      this.layouts = await this.layoutsService.listar();


      if (this.id) {
        const d = await this.service.getById(this.id); this.currentDetail = d; this.status = d.status;
        this.form.setValue({ titulo:d.titulo, tipo:d.tipo, ano:d.ano, mes:d.mes, observacao:d.observacao||'', layoutId: d.layoutId || null });
        this.colunas = d.colunas || [];
        if ((!this.colunas || !this.colunas.length) && d.layoutId) {
          const l = this.layouts.find(x => x.id === d.layoutId);
          if (l) this.colunas = l.colunas;
        }
        if (!this.colunas || !this.colunas.length) {
          this.atualizarColunasNovo();
        }

        this.observacaoAberta = !!d.observacao;
        this.events = d.eventos.map(e => ({...e, vagas:e.vagas.map(v=>({...v}))}));
        if (this.status !== 'RASCUNHO') this.form.disable({ emitEvent: false });
        if (d.tipo === 'MENSAL') await this.carregarApoio();

      } else {
        const type = this.form.controls.tipo.value; const year=this.form.controls.ano.value; const month=this.form.controls.mes.value;
        this.form.controls.titulo.setValue(`Escala ${type==='SEMANAL'?'Semanal':'Mensal'} - ${MESES[month-1]} ${year}`);
        this.atualizarColunasNovo();
        this.events = this.service.buildDefaultEvents(type, year, month, (vagasDoLayout(this.colunas) as any));
      }

      const ids=this.events.flatMap(e=>e.vagas.flatMap(v=>v.voluntario_id?[v.voluntario_id]:[]));
      const irmaos=(this.apoio?.voluntarios??[]).filter(v=>ids.includes(v.voluntarioId)).flatMap(v=>v.irmaos);
      for(const v of await this.volunteersService.resolverOpcoes([...ids,...irmaos]))this.lembrarVoluntario(v);
      this.form.markAsPristine(); this.eventsDirty=false;
      this.syncAddDate();
    } catch(e:any){this.error=e?.message||'Erro ao carregar a tela de escala.';}
    finally{this.loading=false;}
  }

  private async carregarApoio() {
    if (!this.id) return;
    try {
      this.apoio = await this.service.apoio(this.id);
      this.recalcular();
    } catch {
      this.apoio = null;
    }
  }

  // ---- Linhas da grade

  /** Recalcula as linhas (textos, vagas por coluna, usados, marcadores e contagens). Só quando os eventos mudam. */
  recalcular() {
    const anterior = new Map(this.linhas.map(l => [l.chave, l]));
    const hoje = new Date();
    const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const { ano, mes } = this.form.getRawValue();
    const primeiroSeg = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;
    const vezes = this.vezesNoMes();
    const nomes = new Map(this.volunteers.map(v => [v.id, v.nome_completo]));
    let preenchidas = 0; let total = 0; let refs = 0;
    const repetidas = new Map<string, number>();
    this.linhas = this._events.map(evento => {
      const base = `${evento.data}|${evento.horario}${evento.referencia ? '|ref' : ''}`;
      const n = repetidas.get(base) ?? 0;
      repetidas.set(base, n + 1);
      const chave = n ? `${base}|${n}` : base;
      const vagasPorColuna: Record<string, EscalaVaga> = {};
      const rotulos: Record<string, string> = {};
      const usados = new Set<string>();
      let cheias = 0;
      for (const v of evento.vagas) {
        vagasPorColuna[`${v.funcao}-${v.posicao}`] = v;
        rotulos[`${v.funcao}-${v.posicao}`] = this.funcaoLabel(v.funcao) + this.multiLabel(evento, v);
        if (v.voluntario_id) { usados.add(v.voluntario_id); cheias++; }
      }
      if (evento.referencia) refs++; else { preenchidas += cheias; total += evento.vagas.length; }
      const dia = Number(evento.data.slice(8, 10));
      const doMes = Number(evento.data.slice(0, 4)) === ano && Number(evento.data.slice(5, 7)) === mes;
      const dow = new Date(`${evento.data}T12:00:00`).getDay();
      // Mantém o mesmo Set quando os usados não mudaram: o seletor não refaz nada.
      const velho = anterior.get(chave);
      const mesmos = !!velho && velho.usados.size === usados.size && [...usados].every(u => velho.usados.has(u));
      const linha: Linha = {
        evento, chave,
        diaEData: diaEData(evento.data), dataLonga: dataLonga(evento.data), diaSemana: diaDaSemana(evento.data),
        semana: doMes && !evento.referencia ? Math.floor((dia - 1 + primeiroSeg) / 7) + 1 : 0,
        novaSemana: false,
        hoje: evento.data === hojeIso,
        fimDeSemana: dow === 6 ? 'SAB' : dow === 0 ? 'DOM' : null,
        vagasPorColuna,
        rotulos,
        usados: mesmos ? velho!.usados : usados,
        marcadores: this.marcadoresDo(evento, usados, vezes, nomes),
        preenchidas: cheias
      };
      return linha;
    });
    const refsPrimeiro = [...this.linhas.filter(l => l.evento.referencia), ...this.linhas.filter(l => !l.evento.referencia)];
    let semanaAnterior = 0;
    for (const l of refsPrimeiro) {
      l.novaSemana = l.semana > 1 && semanaAnterior > 0 && l.semana !== semanaAnterior;
      if (l.semana) semanaAnterior = l.semana;
    }
    this.linhasSemanal = refsPrimeiro;
    this.preenchidas = preenchidas;
    this.total = total;
    this.referenciasCount = refs;
    this.revisao++;
  }

  /** Quantas vagas reais (não referência) de cada pessoa há no rascunho atual. */
  private vezesNoMes(): Map<string, number> {
    const m = new Map<string, number>();
    for (const e of this._events) {
      if (e.referencia) continue;
      for (const v of e.vagas) if (v.voluntario_id) m.set(v.voluntario_id, (m.get(v.voluntario_id) ?? 0) + 1);
    }
    return m;
  }

  /** Marcas da mensal (PLANO-007): ⛔ indisponível na data/horário, "N× no mês" e irmão já nesta missa. */
  private marcadoresDo(evento: EscalaEvento, usados: Set<string>, vezes: Map<string, number>, nomes: Map<string, string>): Marcadores | null {
    if (!this.apoio || this.form.controls.tipo.value !== 'MENSAL') return null;
    const m: Marcadores = {};
    for (const v of this.apoio.voluntarios) {
      const indisponivel = indisponivelEm(this.apoio, v.voluntarioId, evento.data, evento.horario);
      const irmao = v.irmaos.find(i => usados.has(i));
      const n = vezes.get(v.voluntarioId) ?? 0;
      if (indisponivel || irmao || n) {
        m[v.voluntarioId] = { indisponivel, vezesNoMes: n || undefined, irmaoNaMissa: irmao ? nomes.get(irmao) : undefined };
      }
    }
    return m;
  }

  // ---- Ações da grade


  async metaChanged() {
    if (this.metaTravada) return;
    this.form.markAsDirty();
    const { tipo, ano, mes } = this.form.getRawValue();
    this.atualizarColunasNovo();

    if (!this.id && !this.eventsDirty) {
      this.events = this.service.buildDefaultEvents(tipo, ano, mes, (vagasDoLayout(this.colunas) as any));
      this.form.controls.titulo.setValue(`Escala ${tipo === 'SEMANAL' ? 'Semanal' : 'Mensal'} - ${MESES[mes - 1]} ${ano}`);
    } else {
      this.adaptarVagasDosEventos();
    }
    this.syncAddDate();
  }

  private atualizarColunasNovo() {
    const { tipo, layoutId } = this.form.getRawValue();
    if (layoutId) {
      const l = this.layouts.find(x => x.id === layoutId);
      if (l && vagasDoLayout(l.colunas).length) {
        this.colunas = l.colunas || [];
        return;
      }
    }
    const padrao = this.layouts.find(x => x.tipo === tipo && x.padrao && x.ativo)
      ?? this.layouts.find(x => x.tipo === tipo && x.sistema && x.ativo);
    this.colunas = padrao ? padrao.colunas : (tipo === 'MENSAL' ? COLUNAS_PADRAO_MENSAL : COLUNAS_PADRAO_SEMANAL);
  }

  private adaptarVagasDosEventos() {
    const layoutVagas = vagasDoLayout(this.colunas);
    this._events = this._events.map(e => {
      const novasVagas: EscalaVaga[] = layoutVagas.map(lv => {
        const existente = e.vagas.find(v => v.funcao === lv.funcao && v.posicao === (lv.posicao || 1));
        return {
          funcao: lv.funcao!,
          posicao: lv.posicao || 1,
          voluntario_id: existente?.voluntario_id || null,
          voluntario: existente?.voluntario || null
        };
      });
      return { ...e, vagas: novasVagas };
    });
    this.recalcular();
  }



  rolarParaTopo(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  rolarParaFinal(): void {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }

  async gerarEstrutura() {
    if (this.readOnly) return;
    const filled = this.filledCount();
    if (filled > 0) {
      const sim = await this.dialogo.confirmar({
        titulo: 'Gerar dias da escala?',
        mensagem: `A grade já possui ${filled} vaga(s) preenchida(s). Gerar os dias novamente irá recriar as celebrações com o layout selecionado. Deseja continuar?`,
        confirmar: 'Sim, gerar',
        perigo: true
      });
      if (!sim) return;
    }
    const { tipo, ano, mes, layoutId } = this.form.getRawValue();
    this.atualizarColunasNovo();
    this.events = this.service.buildDefaultEvents(tipo, ano, mes, vagasDoLayout(this.colunas) as any);
    this.form.controls.titulo.setValue(`Escala ${tipo === 'SEMANAL' ? 'Semanal' : 'Mensal'} - ${MESES[mes - 1]} ${ano}`);
    this.eventsDirty = true;
    this.syncAddDate();
    const lNome = layoutId ? this.layouts.find(x => x.id === layoutId)?.nome : 'Padrão';
    this.dialogo.avisar(`Dias e estrutura gerados com sucesso para ${MESES[mes - 1]}/${ano} com o layout "${lNome}"!`, 'success');
  }

  async regenerate() {
    if (this.readOnly) return;
    const filled=this.filledCount();
    if (filled && !await this.dialogo.confirmar({ titulo: 'Recriar a grade?', mensagem: `A grade possui ${filled} vaga(s) preenchida(s). Recriar a grade apagará essas seleções.`, confirmar: 'Recriar', perigo: true })) return;
    const {tipo,ano,mes}=this.form.getRawValue(); this.atualizarColunasNovo(); this.events=this.service.buildDefaultEvents(tipo,ano,mes, (vagasDoLayout(this.colunas) as any)); this.eventsDirty=true;
  }


  paginaArraste=0;maisArraste=false;buscandoArraste=false;erroArraste='';private rodadaArraste=0;private timerArraste?:ReturnType<typeof setTimeout>;
  private destruidoSeletores=false;
  ngOnDestroy(){this.destruidoSeletores=true;this.rodadaArraste++;clearTimeout(this.timerArraste);}
  lembrarVoluntario(v:Voluntario){this.volunteers=[...this.volunteers.filter(x=>x.id!==v.id),v];this.recalcular();}
  lembrarOpcao(v:Voluntario){this.lembrarVoluntario(v);const ids=this.apoio?.voluntarios.find(x=>x.voluntarioId===v.id)?.irmaos??[];if(!ids.length)return;
    void this.volunteersService.resolverOpcoes(ids).then(rows=>{if(this.destruidoSeletores)return;for(const r of rows)this.lembrarVoluntario(r);const evento=this.events.find(e=>e.vagas.some(s=>s.voluntario_id===v.id));if(evento)this.sugerirIrmao(evento,v.id);}).catch(()=>{this.avisoArraste='Não foi possível consultar irmãos desta pessoa.';});
  }
  buscarArraste(){clearTimeout(this.timerArraste);this.rodadaArraste++;this.pessoasArraste=[];this.timerArraste=setTimeout(()=>{this.paginaArraste=0;void this.carregarArraste();},300);}
  paginarArraste(d:number){if(this.buscandoArraste||this.paginaArraste+d<0||d>0&&!this.maisArraste)return;this.paginaArraste+=d;void this.carregarArraste();}
  async carregarArraste(){const rodada=++this.rodadaArraste;this.buscandoArraste=true;this.erroArraste='';
    try{const r=await firstValueFrom(this.volunteersService.opcoes(this.buscaArraste,this.paginaArraste));if(this.destruidoSeletores||rodada!==this.rodadaArraste)return;
      const selecionados=new Set(this.events.flatMap(e=>e.vagas.flatMap(v=>v.voluntario_id?[v.voluntario_id]:[])));
      for(const a of this.apoio?.voluntarios??[])if(selecionados.has(a.voluntarioId))for(const id of a.irmaos)selecionados.add(id);
      this.volunteers=this.volunteers.filter(v=>selecionados.has(v.id)||v.id===this.pessoaArraste);for(const v of r.itens)this.lembrarVoluntario(v);this.pessoasArraste=r.itens;this.maisArraste=r.temMais;
    }catch{if(rodada===this.rodadaArraste){this.pessoasArraste=[];this.maisArraste=false;this.erroArraste='Busca indisponível. Tente novamente.';}}
    finally{if(rodada===this.rodadaArraste)this.buscandoArraste=false;}
  }
  buscaArraste='';pessoasArraste:Voluntario[]=[];pessoaArraste:string|null=null;avisoArraste='';arrasteOcupado=false;private arrastada:string|null=null;
  podeArrastar(){return this.sessaoRespostas.permissoes().includes(this.id?'ESCALA_ALTERAR':'ESCALA_CRIAR');}
  filtrarArraste(){const q=this.buscaArraste.trim().toLocaleLowerCase('pt-BR');this.pessoasArraste=this.volunteers.filter(v=>v.ativo&&v.nome_completo.toLocaleLowerCase('pt-BR').includes(q)).slice(0,30);}
  iniciarArraste(e:DragEvent,id:string){if(this.readOnly||this.saving||this.arrasteOcupado||!this.podeArrastar()||!this.volunteers.some(v=>v.id===id&&v.ativo)){e.preventDefault();return;}this.arrastada=id;this.pessoaArraste=id;e.dataTransfer?.setData('application/x-servirea-voluntario',id);if(e.dataTransfer)e.dataTransfer.effectAllowed='copy';}
  encerrarArraste(){this.arrastada=null;}
  permitirArraste(e:DragEvent){if(this.arrastada&&!this.readOnly&&!this.saving&&this.podeArrastar())e.preventDefault();}
  soltarPessoa(e:DragEvent,event:EscalaEvento,slot:EscalaVaga){e.preventDefault();const id=this.arrastada;this.arrastada=null;if(!id||e.dataTransfer?.getData('application/x-servirea-voluntario')!==id)return;this.pessoaArraste=id;void this.aplicarArraste(event,slot);}
  private impedimentoArraste(event:EscalaEvento,slot:EscalaVaga,id:string):string|null{
    if(this.readOnly||this.saving||!this.podeArrastar())return 'A escala não está disponível para edição.';
    if(!this.events.includes(event)||!event.vagas.includes(slot)||event.referencia)return 'Escolha uma vaga deste rascunho, sem referência.';
    const v=this.volunteers.find(v=>v.id===id);if(!v?.ativo)return 'Voluntário não está ativo.';
    if(!v.funcoes_habilitadas?.includes(slot.funcao))return 'Voluntário não está habilitado para esta função.';
    if(this.usedIds(event,slot.voluntario_id).includes(id))return 'Esta pessoa já está alocada em outra função nesta mesma missa.';
    if(indisponivelEm(this.apoio,id,event.data,event.horario))return 'A pessoa informou indisponibilidade nesta data e período.';
    if(this.events.some(e=>e!==event&&!e.referencia&&e.data===event.data&&e.horario.slice(0,5)===event.horario.slice(0,5)&&e.vagas.some(v=>v.voluntario_id===id)))return 'A pessoa já está em outra celebração deste rascunho no mesmo horário.';
    return null;
  }
  async aplicarArraste(event:EscalaEvento,slot:EscalaVaga){const id=this.pessoaArraste;if(!id||this.arrasteOcupado)return;let erro=this.impedimentoArraste(event,slot,id);if(erro){this.avisoArraste=erro;return;}if(slot.voluntario_id===id)return;
    this.arrasteOcupado=true;const anterior=slot.voluntario_id;
    try{if(anterior&&!await this.dialogo.confirmar({mensagem:'Substituir a pessoa desta vaga no rascunho?',confirmar:'Substituir'}))return;
      erro=this.impedimentoArraste(event,slot,id);if(erro||slot.voluntario_id!==anterior){this.avisoArraste=erro||'A vaga mudou. Confira novamente.';return;}
      this.selectVolunteer(event,slot,id);this.avisoArraste='Pessoa alocada no rascunho. Salve para registrar.';this.pessoaArraste=null;
    }finally{this.arrasteOcupado=false;}
  }
  selectVolunteer(event: EscalaEvento, slot: EscalaVaga, id: string | null) {
    if (id && this.usedIds(event, slot.voluntario_id).includes(id)) { void this.dialogo.avisar('Esta pessoa já está alocada em outra função nesta mesma missa.'); return; }
    slot.voluntario_id=id; slot.voluntario=id?this.volunteers.find(v=>v.id===id)||null:null; this.eventsDirty=true;
    this.recalcular();
    this.sugerirIrmao(event, id);
  }

  /** Irmão fora desta missa: só sugere, com botão; nunca coloca sozinho. */
  private sugerirIrmao(event: EscalaEvento, id: string | null) {
    this.sugestaoIrmao = null;
    if (!id || !this.apoio) return;
    const irmaos = this.apoio.voluntarios.find(v => v.voluntarioId === id)?.irmaos ?? [];
    const usados = new Set(event.vagas.map(v => v.voluntario_id).filter(Boolean));
    const fora = irmaos.find(i => !usados.has(i) && this.volunteers.some(v => v.id === i));
    if (!fora) return;
    this.sugestaoIrmao = {
      chave: this.linhas.find(l => l.evento === event)?.chave ?? '',
      irmaoId: fora,
      nomeIrmao: this.volunteers.find(v => v.id === fora)?.nome_completo ?? '',
      nomePessoa: this.volunteers.find(v => v.id === id)?.nome_completo ?? ''
    };
  }

  /** Primeira vaga livre do evento, na ordem das colunas. */
  vagaLivre(event: EscalaEvento): EscalaVaga | null {
    return event.vagas.find(v => !v.voluntario_id) ?? null;
  }

  colocarIrmao(event: EscalaEvento) {
    const s = this.sugestaoIrmao;
    const vaga = this.vagaLivre(event);
    if (!s || !vaga) return;
    this.sugestaoIrmao = null;
    this.selectVolunteer(event, vaga, s.irmaoId);
  }

  usedIds(event: EscalaEvento, current: string | null) { return event.vagas.map(v=>v.voluntario_id).filter((x):x is string=>!!x && x!==current); }
  changeTime(e: EscalaEvento, ev: Event){e.horario=(ev.target as HTMLInputElement).value;this.eventsDirty=true;this.recalcular();}
  changeCelebration(e: EscalaEvento, ev: Event){e.celebracao=(ev.target as HTMLInputElement).value;this.eventsDirty=true;this.recalcular();}
  setAddTime(ev: Event){this.addTime=(ev.target as HTMLInputElement).value;}
  setAddCelebration(ev: Event){this.addCelebration=(ev.target as HTMLInputElement).value;}

  addDay() {
    if (this.readOnly) return;
    if (!this.addDate || !this.addTime) { void this.dialogo.avisar('Informe a data e o horário.'); return; }
    const time = this.addTime.slice(0, 5);
    if (this.events.some(e => e.data === this.addDate && e.horario.slice(0, 5) === time)) {
      void this.dialogo.avisar('Já existe uma celebração neste dia e horário.');
      return;
    }
    const { tipo } = this.form.getRawValue();
    this.events = [...this.events, this.service.createEvent(tipo, this.addDate, time, this.addCelebration || 'Missa', (vagasDoLayout(this.colunas) as any))]
      .sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    this.eventsDirty = true;
  }

  async removeDay(event: EscalaEvento) {
    if (this.readOnly) return;
    this.fecharPaineis();
    if (!await this.dialogo.confirmar({ titulo: 'Excluir celebração?', mensagem: `Excluir ${this.date(event.data)} às ${event.horario.slice(0, 5)} (${event.celebracao}) desta escala?`, confirmar: 'Excluir', perigo: true })) return;
    this.events = this.events.filter(e => e !== event);
    this.eventsDirty = true;
  }

  apagarReferencia(event: EscalaEvento) {
    this.fecharPaineis();
    this.events = this.events.filter(e => e !== event);
    this.eventsDirty = true;
  }

  private syncAddDate() {
    const { ano, mes } = this.form.getRawValue();
    this.addDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
  }

  // ---- Mini-painéis e painel lateral

  private posicao(evento: Event): Painel {
    const r = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 300));
    const top = r.bottom + 330 > window.innerHeight ? Math.max(8, r.top - 330) : r.bottom + 4;
    return { top, left };
  }

  abrirEdicao(linha: Linha, evento: Event) { this.fecharPaineis(); this.edicao = linha; this.painelAtivo = this.posicao(evento); }
  abrirNovoDia(evento: Event) { this.fecharPaineis(); this.novoDiaAberto = true; this.painelAtivo = this.posicao(evento); }
  abrirMenu(evento: Event) {
    this.fecharPaineis();
    this.menuAberto = true;
    const p = this.posicao(evento);
    this.painelAtivo = { top: Math.max(8, p.top - 230), left: Math.max(8, p.left - 230) };
  }
  fecharPaineis() { this.painelAtivo = null; this.edicao = null; this.novoDiaAberto = false; this.menuAberto = false; }

  alternarPainelDesktop() {
    this.painelDesktop = !this.painelDesktop;
    try { localStorage.setItem(CHAVE_PAINEL, this.painelDesktop ? 'aberto' : 'recolhido'); } catch { /* sem localStorage */ }
  }

  // ---- Salvar, finalizar e status

  async saveDraft() { await this.persist('RASCUNHO', false); }
  async finalize() {
    const refs=this.referenciasCount;
    if (refs>0) {
      if (!await this.dialogo.confirmar({ titulo: 'Linhas de referência', mensagem: `Ainda há ${refs} linha(s) de referência. Apagar e finalizar?`, confirmar: 'Apagar e finalizar' })) return;
      this.events=this.events.filter(e=>!e.referencia); this.eventsDirty=true;
    }
    const missing=this.totalSlots()-this.filledCount();
    if (missing>0 && !await this.dialogo.confirmar({ titulo: 'Vagas sem nome', mensagem: `Ainda existem ${missing} vaga(s) sem nome. Deseja finalizar mesmo assim?`, confirmar: 'Continuar' })) return;
    if (!await this.dialogo.confirmar({ titulo: 'Finalizar escala?', mensagem: 'A escala ficará bloqueada para edição até ser reaberta.', confirmar: 'Finalizar' })) return;
    await this.persist('FINALIZADA', true);
  }

  private async persist(status: StatusEscala, navigate: boolean) {
    if(this.form.invalid)return;this.saving=true;this.error='';
    try{
      const m=this.form.getRawValue();
      const eraNova=!this.id;

      const result=await this.service.save({id:this.id||undefined,titulo:m.titulo,tipo:m.tipo,ano:m.ano,mes:m.mes,status,observacao:m.observacao||null,version:this.currentDetail?.version??null,eventos:this.events, layoutId: m.layoutId || null, colunas: this.colunas});

      this.id=result.id;this.currentDetail=result;this.status=result.status;this.events=result.eventos;this.saved=true;this.form.markAsPristine();this.eventsDirty=false;
      if (this.readOnly) this.form.disable({ emitEvent: false });
      if (eraNova && m.tipo==='MENSAL') await this.carregarApoio();
      if(navigate) await this.router.navigate(['/escalas',result.id]);
      else if(this.route.snapshot.paramMap.get('id')===null) await this.router.navigate(['/escalas',result.id]);
    }catch(e:any){this.error=e?.message||'Não foi possível salvar a escala.';}finally{this.saving=false;}
  }

  async cancelScale(){if(!this.id)return;if(!await this.dialogo.confirmar({ titulo: 'Cancelar escala?', mensagem: `Tem certeza que deseja cancelar a escala ${MESES[this.form.controls.mes.value-1]} / ${this.form.controls.ano.value}?`, confirmar: 'Cancelar escala', cancelar: 'Voltar', perigo: true }))return;try{this.currentDetail=await this.service.setStatus(this.id,'CANCELADA');this.status='CANCELADA';this.form.disable({emitEvent:false});this.saved=true;}catch(e:any){this.error=e?.message||'Erro ao cancelar escala.';}}
  async reopen(){if(!this.id)return;if(!await this.dialogo.confirmar({ titulo: 'Reabrir escala?', mensagem: 'A escala volta a ser não finalizada e aceita alterações de novo.', confirmar: 'Reabrir' }))return;try{this.currentDetail=await this.service.setStatus(this.id,'RASCUNHO');this.status='RASCUNHO';this.form.enable({emitEvent:false});this.saved=true;}catch(e:any){this.error=e?.message||'Erro ao reabrir escala.';}}
  async remove(){if(!this.id)return;if(!await this.dialogo.confirmar({ titulo: 'Excluir escala?', mensagem: `Excluir definitivamente a escala de ${MESES[this.form.controls.mes.value-1]} / ${this.form.controls.ano.value}? Esta ação não pode ser desfeita.`, confirmar: 'Excluir', perigo: true }))return;try{await this.service.deleteCancelled(this.id);this.saved=true;await this.router.navigate(['/escalas']);}catch(e:any){this.error=e?.message||'Erro ao excluir escala.';}}

  orientacao: Orientacao = lerOrientacao('escala', 'PAISAGEM');

  async gerarPrevia() {
    const { titulo, tipo, ano, mes } = this.form.getRawValue();
    const mockDetail: EscalaDetalhe = {
      id: '', titulo, tipo, ano, mes, status: 'RASCUNHO', observacao: null, version: null, colunas: this.colunas,
      eventos: this.events.filter(e => !e.referencia)
    };
    try {
      await this.exporter.exportPdf(mockDetail, this.orientacao);
    } catch(e:any) { this.error=e?.message||'Erro ao gerar prévia.'; }
  }

  async exportPdf(){if(!this.id)return;try{await this.exporter.exportPdf(await this.service.getById(this.id), this.orientacao);}catch(e:any){this.error=e?.message||'Erro ao exportar PDF.';}}
  async exportPng(){if(!this.id)return;try{await this.exporter.exportPng(await this.service.getById(this.id), this.orientacao);}catch(e:any){this.error=e?.message||'Erro ao exportar PNG.';}}

  /** Referência (escala replicada) não conta em vagas: nunca é publicada. Lê o que `recalcular` já contou. */
  totalSlots(){return this.total;}
  filledCount(){return this.preenchidas;}
  referencias(){return this.events.filter(e=>!!e.referencia);}
  funcaoLabel(f:FuncaoEscala){return FUNCOES_LABEL[f];}
  multiLabel(e:EscalaEvento,slot:EscalaVaga){const count=e.vagas.filter(v=>v.funcao===slot.funcao).length;return count>1?` ${slot.posicao}`:'';}
  slotFor(e: EscalaEvento, funcao: FuncaoEscala, posicao: number) { return e.vagas.find(v => v.funcao === funcao && v.posicao === posicao) || null; }
  mesDe(v:string){return MESES[Number(v.slice(5,7))-1].toLowerCase();}
  date(v:string){return dataLonga(v);}
  dateShort(v:string){return dataCurta(v);}
  weekday(v:string){return diaDaSemana(v);}
  statusLabel(s:StatusEscala){return STATUS_LABEL[s];}
  statusClass(s:StatusEscala){return s==='FINALIZADA'?'bg-emerald-50 text-emerald-700':s==='CANCELADA'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700';}
  hasPendingChanges(){return this.status==='RASCUNHO' && (this.form.dirty||this.eventsDirty);}
}
