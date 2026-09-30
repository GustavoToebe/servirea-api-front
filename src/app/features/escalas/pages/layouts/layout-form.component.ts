import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutsEscalaService, RECEITAS_LAYOUT } from '../../services/layouts-escala.service';
import { FUNCOES_ESCALA, FUNCOES_LABEL, FuncaoEscala } from '../../../voluntarios/models/voluntario.model';
import { ColunaEscala, EscopoLayout, TipoElementoLayout, LayoutEscala, TipoEscala } from '../../models/escala.model';
import { DialogoService } from '../../../../shared/services/dialogo.service';

export interface LinhaGrade {
  index: number;
  elementos: ColunaEscala[];
}

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
  receitas = RECEITAS_LAYOUT;

  /** Aba ativa no painel lateral: 'elementos' | 'propriedades' | 'receitas' */
  abaLateral = signal<'elementos' | 'propriedades' | 'receitas'>('elementos');

  elementos = signal<ColunaEscala[]>([]);
  selectedId = signal<string | null>(null);

  selectedElement = computed(() => this.elementos().find(e => e.idLocal === this.selectedId()) || null);

  linhasDocumento = computed(() => this.agruparLinhas(this.elementos().filter(e => e.escopo === 'DOCUMENTO')));
  linhasCelebracao = computed(() => this.agruparLinhas(this.elementos().filter(e => e.escopo === 'CELEBRACAO')));

  /** Lista de chaves (funcao-posicao) que aparecem duplicadas na celebração. */
  vagasDuplicadasMap = computed(() => {
    const contagem = new Map<string, number>();
    for (const v of this.elementos()) {
      if (v.escopo === 'CELEBRACAO' && (v.tipo === 'VAGA' || (!v.tipo && v.funcao))) {
        const key = `${v.funcao}-${v.posicao || 1}`;
        contagem.set(key, (contagem.get(key) || 0) + 1);
      }
    }
    const duplicadas = new Set<string>();
    for (const [k, count] of contagem.entries()) {
      if (count > 1) duplicadas.add(k);
    }
    return duplicadas;
  });

  vagasDuplicadas = computed(() => this.vagasDuplicadasMap().size > 0);

  totalVagas = computed(() =>
    this.elementos().filter(e => e.escopo === 'CELEBRACAO' && (e.tipo === 'VAGA' || (!e.tipo && e.funcao))).length
  );

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: LayoutsEscalaService,
    private dialogo: DialogoService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      tipo: ['MENSAL' as TipoEscala, Validators.required]
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
              escopo: (c.escopo || 'CELEBRACAO') as EscopoLayout,
              linha: c.linha ?? 0,
              coluna: c.coluna ?? i,
              largura: c.largura ?? 1,
              alinhamento: c.alinhamento || 'center'
            };
          }
          return {
            ...c,
            escopo: c.escopo || 'CELEBRACAO',
            linha: c.linha ?? 0,
            coluna: c.coluna ?? i,
            largura: c.largura ?? 1
          };
        });
        this.elementos.set(blocos);
      } catch (e) {
        console.error(e);
        this.router.navigate(['/escalas/layouts']);
      }
    } else {
      // Inicia com uma receita padrão recomendada para facilitar a vida do usuário
      this.aplicarReceitaPorId('missa-dominical-completa', false);
    }
  }

  // ---- Grade e Organização

  private agruparLinhas(lista: ColunaEscala[]): LinhaGrade[] {
    if (lista.length === 0) return [];
    const maxLinha = lista.reduce((max, e) => Math.max(max, e.linha || 0), -1);
    const result: LinhaGrade[] = [];
    for (let i = 0; i <= maxLinha; i++) {
      const els = lista.filter(e => e.linha === i).sort((a, b) => (a.coluna || 0) - (b.coluna || 0));
      if (els.length > 0) {
        result.push({ index: i, elementos: els });
      }
    }
    return result;
  }

  getAlignClass(align?: string) {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  }

  rotuloVaga(el: ColunaEscala): string {
    return el.rotulo || (el.funcao ? this.funcoesLabel[el.funcao] : 'Vaga');
  }

  isDuplicada(el: ColunaEscala): boolean {
    if (el.tipo !== 'VAGA' || !el.funcao || el.escopo !== 'CELEBRACAO') return false;
    const k = `${el.funcao}-${el.posicao || 1}`;
    return this.vagasDuplicadasMap().has(k);
  }

  // ---- Seleção e Abas

  selectElement(el: ColunaEscala) {
    this.selectedId.set(el.idLocal || null);
    this.abaLateral.set('propriedades');
  }

  fecharPropriedades() {
    this.selectedId.set(null);
    this.abaLateral.set('elementos');
  }

  // ---- Adicionar Blocos

  addElemento(tipo: TipoElementoLayout, escopo: EscopoLayout, linhaDestino?: number, funcaoSugerida?: FuncaoEscala) {
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
      largura: tipo === 'TITULO' || tipo === 'DATA' ? 12 : 1,
      alinhamento: tipo === 'TEXTO_LIVRE' ? 'left' : 'center'
    };

    if (tipo === 'TITULO') novoElemento.conteudo = '#TITULO_ESCALA#';
    if (tipo === 'SUBTITULO') novoElemento.conteudo = '#MES_ANO#';
    if (tipo === 'DATA') novoElemento.conteudo = '#DATA_HORA#';
    if (tipo === 'TEXTO_LIVRE') novoElemento.conteudo = 'Aviso ou orientação importante para a escala...';

    if (tipo === 'VAGA') {
      const func = funcaoSugerida || this.sugerirProximaFuncao(escopoEls);
      const existentesDessaFunc = escopoEls.filter(e => e.tipo === 'VAGA' && e.funcao === func);
      const pos = existentesDessaFunc.length + 1;
      novoElemento.funcao = func;
      novoElemento.posicao = pos;
      novoElemento.rotulo = this.funcoesLabel[func] + (pos > 1 ? ` ${pos}` : '');
    }

    this.elementos.update(els => [...els, novoElemento]);
    this.selectedId.set(novoElemento.idLocal ?? null);
    this.abaLateral.set('propriedades');
  }

  private sugerirProximaFuncao(escopoEls: ColunaEscala[]): FuncaoEscala {
    const usadas = new Set(escopoEls.filter(e => e.tipo === 'VAGA').map(e => e.funcao));
    for (const f of this.funcoesOpcoes) {
      if (!usadas.has(f)) return f;
    }
    return 'VELA';
  }

  addLinha(escopo: EscopoLayout, aposDaLinha?: number) {
    if (aposDaLinha !== undefined) {
      this.elementos.update(els => els.map(e =>
        e.escopo === escopo && (e.linha || 0) > aposDaLinha ? { ...e, linha: (e.linha || 0) + 1 } : e
      ));
      const novaLinhaIndex = aposDaLinha + 1;
      this.addElemento(escopo === 'DOCUMENTO' ? 'TEXTO_LIVRE' : 'VAGA', escopo, novaLinhaIndex);
    } else {
      const escopoEls = this.elementos().filter(e => e.escopo === escopo);
      const proximaLinha = escopoEls.length > 0 ? Math.max(...escopoEls.map(e => e.linha || 0)) + 1 : 0;
      this.addElemento(escopo === 'DOCUMENTO' ? 'TEXTO_LIVRE' : 'VAGA', escopo, proximaLinha);
    }
  }

  // ---- Reorganização e Movimentação

  moverElemento(el: ColunaEscala, delta: -1 | 1) {
    this.elementos.update(els => {
      const vizinhos = els
        .filter(e => e.escopo === el.escopo && (e.linha || 0) === (el.linha || 0))
        .sort((a, b) => (a.coluna || 0) - (b.coluna || 0));
      const i = vizinhos.findIndex(e => e.idLocal === el.idLocal);
      const j = i + delta;
      if (j < 0 || j >= vizinhos.length) return els;

      const idA = vizinhos[i].idLocal;
      const idB = vizinhos[j].idLocal;
      const colA = vizinhos[i].coluna ?? i;
      const colB = vizinhos[j].coluna ?? j;

      return els.map(e => {
        if (e.idLocal === idA) return { ...e, coluna: colB };
        if (e.idLocal === idB) return { ...e, coluna: colA };
        return e;
      });
    });
  }

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

  removerElemento(el: ColunaEscala) {
    this.elementos.update(els => {
      const filtrados = els.filter(x => x.idLocal !== el.idLocal);
      // Reordena colunas restantes na mesma linha
      return filtrados.map(e => {
        if (e.escopo === el.escopo && (e.linha || 0) === (el.linha || 0) && (e.coluna || 0) > (el.coluna || 0)) {
          return { ...e, coluna: (e.coluna || 1) - 1 };
        }
        return e;
      });
    });
    if (this.selectedId() === el.idLocal) {
      this.selectedId.set(null);
      this.abaLateral.set('elementos');
    }
  }

  removerLinha(escopo: EscopoLayout, linha: number) {
    this.elementos.update(els => {
      const restantes = els.filter(x => !(x.escopo === escopo && (x.linha || 0) === linha));
      // Re-indexa linhas posteriores
      return restantes.map(e => {
        if (e.escopo === escopo && (e.linha || 0) > linha) {
          return { ...e, linha: (e.linha || 0) - 1 };
        }
        return e;
      });
    });
    this.selectedId.set(null);
    this.abaLateral.set('elementos');
  }

  duplicarElemento(el: ColunaEscala) {
    const clone: ColunaEscala = {
      ...el,
      idLocal: 'el-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      coluna: (el.coluna || 0) + 1
    };
    if (clone.tipo === 'VAGA' && clone.funcao) {
      const existentes = this.elementos().filter(e => e.tipo === 'VAGA' && e.funcao === clone.funcao);
      clone.posicao = existentes.length + 1;
      clone.rotulo = `${this.funcoesLabel[clone.funcao]} ${clone.posicao}`;
    }
    this.elementos.update(els => [...els, clone]);
    this.selectedId.set(clone.idLocal ?? null);
    this.abaLateral.set('propriedades');
  }

  updateProp(prop: keyof ColunaEscala, valor: any) {
    const id = this.selectedId();
    if (!id) return;
    this.elementos.update(els => els.map(e => {
      if (e.idLocal !== id) return e;
      const mod = { ...e, [prop]: valor };
      // Se alterou a função da vaga, sincroniza rótulo sugerido
      if (prop === 'funcao' && valor) {
        const funcaoVal = valor as FuncaoEscala;
        if (!mod.rotulo || mod.rotulo === this.funcoesLabel[e.funcao || 'MISSAL']) {
          mod.rotulo = this.funcoesLabel[funcaoVal];
        }
      }
      return mod;
    }));
  }

  inserirTag(tag: string) {
    const el = this.selectedElement();
    if (!el) return;
    const atual = el.conteudo || '';
    this.updateProp('conteudo', atual ? `${atual} ${tag}` : tag);
  }

  // ---- Receitas Rápidas

  async confirmarAplicarReceita(idReceita: string) {
    if (this.elementos().length > 0) {
      const ok = await this.dialogo.confirmar({
        titulo: 'Substituir modelo atual?',
        mensagem: 'Aplicar esta receita irá substituir os blocos do layout atual. Deseja continuar?',
        confirmar: 'Aplicar Receita',
        perigo: false
      });
      if (!ok) return;
    }
    this.aplicarReceitaPorId(idReceita, true);
  }

  aplicarReceitaPorId(idReceita: string, mudaNome = false) {
    const receita = this.receitas.find(r => r.id === idReceita);
    if (!receita) return;

    if (mudaNome && (!this.form.get('nome')?.value || this.form.get('nome')?.value === 'Novo Layout')) {
      this.form.patchValue({ nome: receita.nome, tipo: receita.tipo });
    } else {
      this.form.patchValue({ tipo: receita.tipo });
    }

    // Clona os blocos gerando novos IDs locais
    const novosBlocos = receita.colunas.map((c, i) => ({
      ...c,
      idLocal: 'el-rec-' + i + '-' + Math.floor(Math.random() * 1000)
    }));

    this.elementos.set(novosBlocos);
    this.selectedId.set(null);
    this.abaLateral.set('elementos');
  }

  // ---- Salvar

  async salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.vagasDuplicadas()) {
      await this.dialogo.avisar(
        'Existem vagas com a mesma Função e Posição na celebração. Cada vaga deve ter uma posição diferente (ex: Vela 1 e Vela 2).',
        'warning'
      );
      return;
    }

    this.salvando = true;
    const value = this.form.value;

    const finalCols = this.elementos().map((e, index) => ({
      ...e,
      ordem: index + 1
    }));

    const payload: Partial<LayoutEscala> = {
      ...value,
      colunas: finalCols
    };
    if (this.id) payload.id = this.id;

    try {
      await this.service.salvar(payload);
      await this.dialogo.avisar('Layout salvo com sucesso!', 'success');
      this.router.navigate(['/escalas/layouts']);
    } catch (e: any) {
      console.error(e);
      await this.dialogo.avisar(e.message || 'Erro ao salvar layout.', 'error');
    } finally {
      this.salvando = false;
    }
  }
}
