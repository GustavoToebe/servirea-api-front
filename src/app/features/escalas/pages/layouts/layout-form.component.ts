import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CabecalhoPaginaComponent } from '../../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { RodapeFormComponent } from '../../../../shared/components/rodape-form/rodape-form.component';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { FUNCOES_ESCALA, FUNCOES_LABEL } from '../../../voluntarios/models/voluntario.model';
import { ColunaEscala } from '../../models/escala.model';

@Component({
  selector: 'app-layout-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CabecalhoPaginaComponent, RodapeFormComponent],
  template: `
    <app-cabecalho-pagina [titulo]="isEdicao ? 'Editar Layout' : 'Novo Layout'"></app-cabecalho-pagina>

    <form [formGroup]="form" (ngSubmit)="salvar()">
      <div class="card mb-4">
        <h2 class="h5 mb-3">Dados Básicos</h2>
        <div class="row g-3">
          <div class="col-md-8">
            <label class="form-label" for="nome">Nome *</label>
            <input type="text" id="nome" class="form-control" formControlName="nome" [class.is-invalid]="f['nome'].invalid && f['nome'].touched">
            @if (f['nome'].errors?.['required'] && f['nome'].touched) {
              <div class="invalid-feedback">Nome é obrigatório.</div>
            }
          </div>
          <div class="col-md-4">
            <label class="form-label" for="tipo">Tipo *</label>
            <select id="tipo" class="form-select" formControlName="tipo" [class.is-invalid]="f['tipo'].invalid && f['tipo'].touched">
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 mb-0">Colunas</h2>
          <button type="button" class="btn btn-outline-primary btn-sm" (click)="adicionarColuna()">
            <i class="ph ph-plus"></i> Adicionar Coluna
          </button>
        </div>

        @if (colunas.length === 0) {
          <p class="text-muted">Nenhuma coluna adicionada. O layout precisa de pelo menos uma.</p>
        }

        <div class="tabela-rolagem" *ngIf="colunas.length > 0">
          <table class="tabela">
            <thead>
              <tr>
                <th style="width: 100px;">Ordem</th>
                <th>Função *</th>
                <th>Posição *</th>
                <th>Rótulo *</th>
                <th class="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody formArrayName="colunas">
              @for (col of colunas.controls; track col; let i = $index) {
                <tr [formGroupName]="i">
                  <td>
                    <div class="d-flex gap-1">
                      <button type="button" class="btn-icone btn-sm" [disabled]="i === 0" (click)="moverColuna(i, -1)" title="Subir">
                        <i class="ph ph-caret-up"></i>
                      </button>
                      <button type="button" class="btn-icone btn-sm" [disabled]="i === colunas.length - 1" (click)="moverColuna(i, 1)" title="Descer">
                        <i class="ph ph-caret-down"></i>
                      </button>
                    </div>
                  </td>
                  <td>
                    <select class="form-select form-select-sm" formControlName="funcao" [class.is-invalid]="col.get('funcao')?.invalid && col.get('funcao')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      @for (f of funcoesOpcoes; track f.valor) {
                        <option [value]="f.valor">{{ f.label }}</option>
                      }
                    </select>
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm" formControlName="posicao" min="1" [class.is-invalid]="col.get('posicao')?.invalid && col.get('posicao')?.touched">
                  </td>
                  <td>
                    <input type="text" class="form-control form-control-sm" formControlName="rotulo" [class.is-invalid]="col.get('rotulo')?.invalid && col.get('rotulo')?.touched">
                  </td>
                  <td class="col-acoes">
                    <button type="button" class="btn-icone text-danger" title="Remover" (click)="removerColuna(i)">
                      <i class="ph ph-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (form.hasError('colunaDuplicada')) {
          <div class="text-danger mt-2 small">
            Há colunas com a mesma Função e Posição. Corrija para continuar.
          </div>
        }
      </div>

      <app-rodape-form
        [voltarUrl]="['/escalas/layouts']"
        [carregando]="salvando"
        [desabilitado]="form.invalid">
      </app-rodape-form>
    </form>
  `
})
export class LayoutFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(LayoutsEscalaService);
  private dialogo = inject(DialogoService);
  private location = inject(Location);

  id: string | null = null;
  isEdicao = false;
  salvando = false;

  funcoesOpcoes = FUNCOES_ESCALA.map(f => ({ valor: f, label: FUNCOES_LABEL[f] }));

  form: FormGroup = this.fb.group({
    id: [null],
    nome: ['', Validators.required],
    tipo: ['SEMANAL', Validators.required],
    ativo: [true],
    sistema: [false],
    colunas: this.fb.array([], Validators.required)
  }, { validators: this.validarColunasUnicas });

  get f() { return this.form.controls; }
  get colunas() { return this.form.get('colunas') as FormArray; }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.isEdicao = true;
      try {
        const layout = await this.service.carregar(this.id);
        if (layout.sistema) {
          this.form.disable();
          this.dialogo.avisar('Layouts de sistema não podem ser editados.', 'info');
        }
        
        while (this.colunas.length !== 0) {
          this.colunas.removeAt(0);
        }

        const colsOrdenadas = [...layout.colunas].sort((a, b) => a.ordem - b.ordem);
        colsOrdenadas.forEach(c => this.adicionarColuna(c));

        this.form.patchValue(layout);
      } catch (e: any) {
        this.dialogo.avisar(e.message, 'error');
        this.location.back();
      }
    }
  }

  adicionarColuna(col?: ColunaEscala) {
    this.colunas.push(this.fb.group({
      ordem: [col?.ordem ?? this.colunas.length + 1],
      funcao: [col?.funcao ?? null, Validators.required],
      posicao: [col?.posicao ?? 1, [Validators.required, Validators.min(1)]],
      rotulo: [col?.rotulo ?? '', Validators.required]
    }));
  }

  removerColuna(index: number) {
    this.colunas.removeAt(index);
    this.reordenarColunas();
  }

  moverColuna(index: number, direcao: number) {
    const novaPosicao = index + direcao;
    if (novaPosicao < 0 || novaPosicao >= this.colunas.length) return;

    const current = this.colunas.at(index);
    this.colunas.removeAt(index);
    this.colunas.insert(novaPosicao, current);
    
    this.reordenarColunas();
  }

  private reordenarColunas() {
    this.colunas.controls.forEach((ctrl, i) => {
      ctrl.get('ordem')?.setValue(i + 1);
    });
  }

  private validarColunasUnicas(group: FormGroup) {
    const colunas = group.get('colunas')?.value as ColunaEscala[];
    if (!colunas || !colunas.length) return null;

    const chaves = new Set<string>();
    for (const c of colunas) {
      if (!c.funcao) continue;
      const key = `${c.funcao}-${c.posicao}`;
      if (chaves.has(key)) {
        return { colunaDuplicada: true };
      }
      chaves.add(key);
    }
    return null;
  }

  async salvar() {
    if (this.form.invalid || this.salvando) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando = true;
    try {
      const formValue = this.form.getRawValue();
      await this.service.salvar(formValue);
      this.dialogo.avisar('Layout salvo com sucesso.', 'success');
      this.router.navigate(['/escalas/layouts']);
    } catch (e: any) {
      this.dialogo.avisar(e.message, 'error');
    } finally {
      this.salvando = false;
    }
  }
}
