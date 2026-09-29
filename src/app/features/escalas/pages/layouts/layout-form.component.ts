import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { FUNCOES_ESCALA, FuncaoEscala } from '../../../voluntarios/models/voluntario.model';
import { ColunaEscala, EscopoLayout, TipoElementoLayout, LayoutEscala } from '../../models/escala.model';

interface LinhaGrade {
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

  elementos = signal<ColunaEscala[]>([]);
  activeTab = signal<'elementos'|'propriedades'>('elementos');
  selectedId = signal<string | null>(null);

  selectedElement = computed(() => this.elementos().find(e => e.idLocal === this.selectedId()) || null);

  linhasDocumento = computed(() => {
    return this.agruparLinhas(this.elementos().filter(e => e.escopo === 'DOCUMENTO'));
  });

  linhasCelebracao = computed(() => {
    return this.agruparLinhas(this.elementos().filter(e => e.escopo === 'CELEBRACAO'));
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
                 tipo: 'VAGA' as TipoElementoLayout,
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

  onDragStart(event: DragEvent, tipo: string) {
    event.dataTransfer?.setData('text/plain', tipo);
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(event: DragEvent, escopo: EscopoLayout, linhaDestino: number) {
    event.preventDefault();
    const tipo = event.dataTransfer?.getData('text/plain') as TipoElementoLayout;
    if (!tipo) return;

    const idLocal = 'el-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    let novaLinha = linhaDestino;
    if (linhaDestino === -1) {
       const escopoEls = this.elementos().filter(e => e.escopo === escopo);
       novaLinha = escopoEls.length > 0 ? Math.max(...escopoEls.map(e => e.linha || 0)) + 1 : 0;
    }

    const linhaEls = this.elementos().filter(e => e.escopo === escopo && e.linha === novaLinha);
    const novaColuna = linhaEls.length;

    const novoElemento: ColunaEscala = {
      idLocal,
      tipo,
      escopo,
      linha: novaLinha,
      coluna: novaColuna,
      largura: 1,
      alinhamento: tipo === 'TEXTO_LIVRE' ? 'left' : 'center'
    };

    if (tipo === 'TITULO') novoElemento.conteudo = '#TITULO_ESCALA#';
    if (tipo === 'DATA') novoElemento.conteudo = '#DATA_HORA#';
    if (tipo === 'VAGA') {
       novoElemento.funcao = 'OUTRO';
       novoElemento.posicao = 1;
       novoElemento.rotulo = 'Nova Vaga';
    }

    this.elementos.update(els => [...els, novoElemento]);
    this.selectedId.set(idLocal);
    this.activeTab.set('propriedades');
  }

  addLinha(escopo: EscopoLayout) {
     const escopoEls = this.elementos().filter(e => e.escopo === escopo);
     const novaLinha = escopoEls.length > 0 ? Math.max(...escopoEls.map(e => e.linha || 0)) + 1 : 0;
     const idLocal = 'el-' + Date.now();
     this.elementos.update(els => [...els, {
        idLocal, tipo: 'TEXTO_LIVRE', escopo, linha: novaLinha, coluna: 0, largura: 1, alinhamento: 'left', conteudo: ''
     }]);
     this.selectedId.set(idLocal);
     this.activeTab.set('propriedades');
  }

  selectElement(el: ColunaEscala) {
    this.selectedId.set(el.idLocal || null);
    this.activeTab.set('propriedades');
  }

  removeElement(el: ColunaEscala) {
    this.elementos.update(els => els.filter(x => x.idLocal !== el.idLocal));
    if (this.selectedId() === el.idLocal) {
       this.selectedId.set(null);
       this.activeTab.set('elementos');
    }
  }

  updateProp(prop: keyof ColunaEscala, valor: any) {
    const id = this.selectedId();
    if (!id) return;
    this.elementos.update(els => els.map(e => e.idLocal === id ? { ...e, [prop]: valor } : e));
    this.form.updateValueAndValidity(); // forçar revalidação geral caso afete colunas duplicadas
  }

  private hasDuplicatedVagas(): boolean {
    const vagas = this.elementos().filter(e => e.tipo === 'VAGA' || (!e.tipo && e.funcao));
    const set = new Set<string>();
    for (const v of vagas) {
       if (!v.funcao) continue;
       const key = v.funcao + '-' + (v.posicao || 1);
       if (set.has(key)) return true;
       set.add(key);
    }
    return false;
  }

  async salvar() {
    if (this.form.invalid) return;
    if (this.hasDuplicatedVagas()) {
       this.form.setErrors({ colunaDuplicada: true });
       return;
    }

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