import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { FUNCOES_ESCALA, FUNCOES_LABEL, FuncaoEscala } from '../../../voluntarios/models/voluntario.model';
import { ColunaEscala, EscopoLayout, TipoElementoLayout, LayoutEscala } from '../../models/escala.model';

interface LinhaGrade {
  index: number;
  elementos: ColunaEscala[];
}

/**
 * Editor de layout 100% por clique (sem arrastar): os botões "＋" adicionam
 * blocos, as setas reordenam e o painel da direita edita o bloco selecionado.
 */
@Component({
  selector: 'app-layout-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './layout-form.component.html'
})
export class LayoutFormComponent implements OnInit {
  id: string | null = null;
  form!: FormGroup;
  salvando = false;
  funcoesOpcoes = FUNCOES_ESCALA;
  funcoesLabel = FUNCOES_LABEL;

  elementos = signal<ColunaEscala[]>([]);
  selectedId = signal<string | null>(null);

  selectedElement = computed(() => this.elementos().find(e => e.idLocal === this.selectedId()) || null);

  linhasDocumento = computed(() => this.agruparLinhas(this.elementos().filter(e => e.escopo === 'DOCUMENTO')));
  linhasCelebracao = computed(() => this.agruparLinhas(this.elementos().filter(e => e.escopo === 'CELEBRACAO')));

  /** Função + Posição não podem se repetir: é a chave da vaga na API. */
  vagasDuplicadas = computed(() => {
    const set = new Set<string>();
    for (const v of this.elementos()) {
      if (v.tipo !== 'VAGA' || !v.funcao) continue;
      const key = v.funcao + '-' + (v.posicao || 1);
      if (set.has(key)) return true;
      set.add(key);
    }
    return false;
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: LayoutsEscalaService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      tipo: ['SEMANAL', Validators.required]
    });

    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      try {
        const dto = await this.service.carregar(this.id);
        this.form.patchValue({ nome: dto.nome, tipo: dto.tipo });

        const blocos = (dto.colunas || []).map((c, i) => {
           if (!c.idLocal) {
              return {
                 ...c,
                 idLocal: 'legado-' + i,
                 tipo: (c.funcao ? 'VAGA' : 'TEXTO_LIVRE') as TipoElementoLayout,
                 escopo: 'CELEBRACAO' as EscopoLayout,
                 linha: 0,
                 coluna: i,
                 largura: 1,
                 alinhamento: 'center' as const
              };
           }
           return c;
        });
        this.elementos.set(blocos);
      } catch (e) {
        console.error(e);
        this.router.navigate(['/escalas/layouts']);
      }
    } else {
      this.elementos.set([]);
    }
  }

  // ---- Grade

  private agruparLinhas(lista: ColunaEscala[]): LinhaGrade[] {
    const maxLinha = lista.reduce((max, e) => Math.max(max, e.linha || 0), -1);
    const result: LinhaGrade[] = [];
    for (let i = 0; i <= maxLinha; i++) {
      result.push({
        index: i,
        elementos: lista.filter(e => e.linha === i).sort((a,b) => (a.coluna||0) - (b.coluna||0))
      });
    }
    return result;
  }

  getAlignClass(align?: string) {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  }

  getIconFor(tipo?: string) {
    switch(tipo) {
       case 'TITULO': return 'ph-text-h-one text-indigo-500';
       case 'SUBTITULO': return 'ph-text-h-two text-indigo-500';
       case 'TEXTO_LIVRE': return 'ph-text-align-left text-indigo-500';
       case 'DATA': return 'ph-calendar-blank text-emerald-600';
       case 'VAGA': return 'ph-user-focus text-amber-600';
       default: return 'ph-square';
    }
  }

  getLabelFor(tipo?: string) {
    switch(tipo) {
       case 'TITULO': return 'Título Principal';
       case 'SUBTITULO': return 'Subtítulo';
       case 'TEXTO_LIVRE': return 'Texto Livre';
       case 'DATA': return 'Data / Celebração';
       case 'VAGA': return 'Vaga / Função';
       default: return 'Elemento';
    }
  }

  rotuloVaga(el: ColunaEscala): string {
    return el.rotulo || (el.funcao ? this.funcoesLabel[el.funcao] : 'Vaga');
  }

  // ---- Adicionar por clique

  /** Adiciona um bloco numa linha nova (fim da seção) ou dentro de uma linha existente. */
  addElemento(tipo: TipoElementoLayout, escopo: EscopoLayout, linhaDestino?: number) {
    const escopoEls = this.elementos().filter(e => e.escopo === escopo);
    let novaLinha: number;
    if (linhaDestino === undefined || linhaDestino < 0) {
      novaLinha = escopoEls.length > 0 ? Math.max(...escopoEls.map(e => e.linha || 0)) + 1 : 0;
    } else {
      novaLinha = linhaDestino;
    }

    const linhaEls = escopoEls.filter(e => e.linha === novaLinha);
    const novaColuna = linhaEls.length;

    const novoElemento: ColunaEscala = {
      idLocal: 'el-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      tipo,
      escopo,
      linha: novaLinha,
      coluna: novaColuna,
      largura: 1,
      alinhamento: tipo === 'TEXTO_LIVRE' ? 'left' : 'center'
    };

    if (tipo === 'TITULO') novoElemento.conteudo = '#TITULO_ESCALA#';
    if (tipo === 'SUBTITULO') novoElemento.conteudo = '#MES_ANO#';
    if (tipo === 'DATA') novoElemento.conteudo = '#DATA_HORA#';
    if (tipo === 'VAGA') {
       const usadas = new Set(escopoEls.filter(e => e.tipo === 'VAGA').map(e => e.funcao));
       const livre = (FUNCOES_ESCALA as FuncaoEscala[]).find(f => !usadas.has(f)) || 'MISSAL';
       const posicao = escopoEls.filter(e => e.tipo === 'VAGA' && e.funcao === livre).length + 1;
       novoElemento.funcao = livre;
       novoElemento.posicao = posicao;
       novoElemento.rotulo = this.funcoesLabel[livre];
    }

    this.elementos.update(els => [...els, novoElemento]);
    this.selectedId.set(novoElemento.idLocal ?? null);
  }

  addLinha(escopo: EscopoLayout, aposDaLinha?: number) {
    if (aposDaLinha !== undefined) {
      // abre espaço e desce as linhas de baixo
      this.elementos.update(els => els.map(e =>
        e.escopo === escopo && (e.linha || 0) > aposDaLinha ? { ...e, linha: (e.linha || 0) + 1 } : e
      ));
    }
    this.addElemento('TEXTO_LIVRE', escopo, aposDaLinha !== undefined ? aposDaLinha + 1 : undefined);
    this.selectedId.set(null);
  }

  // ---- Reordenar por clique

  /** Move o bloco ←/→ dentro da linha dele. */
  moverElemento(el: ColunaEscala, delta: -1 | 1) {
    this.elementos.update(els => {
      const vizinho = els
        .filter(e => e.escopo === el.escopo && (e.linha || 0) === (el.linha || 0))
        .sort((a, b) => (a.coluna || 0) - (b.coluna || 0));
      const i = vizinho.findIndex(e => e.idLocal === el.idLocal);
      const j = i + delta;
      if (j < 0 || j >= vizinho.length) return els;
      const trocas = new Map([[vizinho[i].idLocal, vizinho[j].coluna || 0], [vizinho[j].idLocal, vizinho[i].coluna || 0]]);
      return els.map(e => trocas.has(e.idLocal || '') ? { ...e, coluna: trocas.get(e.idLocal || '')! } : e);
    });
  }

  /** Sobe/desce a linha inteira, trocando de lugar com a vizinha. */
  moverLinha(escopo: EscopoLayout, linha: number, delta: -1 | 1) {
    const destino = linha + delta;
    if (destino < 0) return;
    const linhasExistentes = new Set(this.elementos().filter(e => e.escopo === escopo).map(e => e.linha || 0));
    if (!linhasExistentes.has(destino)) return;
    this.elementos.update(els => els.map(e => {
      if (e.escopo !== escopo) return e;
      if ((e.linha || 0) === linha) return { ...e, linha: destino };
      if ((e.linha || 0) === destino) return { ...e, linha };
      return e;
    }));
  }

  selectElement(el: ColunaEscala) {
    this.selectedId.set(el.idLocal || null);
  }

  removerElemento(el: ColunaEscala) {
    this.elementos.update(els => els.filter(x => x.idLocal !== el.idLocal));
    if (this.selectedId() === el.idLocal) this.selectedId.set(null);
  }

  removerLinha(escopo: EscopoLayout, linha: number) {
    this.elementos.update(els => els.filter(x => !(x.escopo === escopo && (x.linha || 0) === linha)));
    this.selectedId.set(null);
  }

  updateProp(prop: keyof ColunaEscala, valor: any) {
    const id = this.selectedId();
    if (!id) return;
    this.elementos.update(els => els.map(e => e.idLocal === id ? { ...e, [prop]: valor } : e));
  }

  // ---- Salvar

  async salvar() {
    if (this.form.invalid || this.vagasDuplicadas()) return;

    this.salvando = true;
    const value = this.form.value;

    const finalCols = this.elementos().map((e, index) => {
       return {
          ...e,
          ordem: index + 1
       };
    });

    const payload: Partial<LayoutEscala> = { ...value, colunas: finalCols };
    if (this.id) payload.id = this.id;

    try {
      await this.service.salvar(payload);
      this.router.navigate(['/escalas/layouts']);
    } catch (e) {
      console.error(e);
      this.salvando = false;
    }
  }
}
