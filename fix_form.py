import os

new_template = """
  template: `
    <app-cabecalho-pagina [titulo]="isEdicao ? 'Editar Layout' : 'Novo Layout'" subtitulo="Configure as colunas que irão aparecer na tabela da escala."></app-cabecalho-pagina>

    <form [formGroup]="form" (ngSubmit)="salvar()" class="mx-auto max-w-5xl space-y-6">
      
      <!-- Dica geral -->
      <div class="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm flex gap-3">
        <i class="ph ph-info flex-shrink-0 text-2xl text-blue-600"></i>
        <div class="text-sm">
          <p class="font-bold mb-1">Como funcionam os layouts?</p>
          <p>Um layout de escala é a <strong>receita das colunas da grade</strong>. Você monta essa receita uma vez e, ao criar a escala, escolhe qual deseja usar. <br>O <strong>Semanal</strong> continua gerando uma tabela (um dia por linha), enquanto o <strong>Mensal</strong> continua gerando os tradicionais cartões por missa. O que o layout altera são as colunas disponíveis para preenchimento!</p>
        </div>
      </div>

      <section class="card p-6">
        <h2 class="mb-4 text-lg font-black text-slate-800 border-b pb-2">1. Dados Básicos</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="label" for="nome">Nome do Layout *</label>
            <input type="text" id="nome" class="field" formControlName="nome" placeholder="Ex.: Especial de Natal"
                   [class.border-red-500]="f['nome'].invalid && f['nome'].touched">
            @if (f['nome'].errors?.['required'] && f['nome'].touched) {
              <div class="mt-1 text-xs font-semibold text-red-600">O nome é obrigatório.</div>
            }
          </div>
          <div>
            <label class="label" for="tipo">Modelo Base *</label>
            <select id="tipo" class="field" formControlName="tipo" 
                    [class.border-red-500]="f['tipo'].invalid && f['tipo'].touched">
              <option value="SEMANAL">Tabela Semanal (Dias Úteis)</option>
              <option value="MENSAL">Cartões Mensais (Finais de Semana)</option>
            </select>
          </div>
        </div>
      </section>

      <section class="card p-6">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h2 class="text-lg font-black text-slate-800">2. Colunas da Grade</h2>
            <p class="text-sm text-slate-500 mt-1">Configure exatamente as vagas que aparecerão na escala.</p>
          </div>
          <button type="button" class="btn-primary whitespace-nowrap shadow-sm hover:shadow-md transition-all" (click)="adicionarColuna()">
            <i class="ph ph-plus-circle mr-1"></i> Adicionar Coluna
          </button>
        </div>

        <!-- Dicas de colunas -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
            <strong class="block text-slate-800 mb-1"><i class="ph ph-arrows-left-right text-brand-blue"></i> Ordem</strong>
            É a posição da coluna na tela, da esquerda para a direita. Use as setinhas para reordenar.
          </div>
          <div class="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
            <strong class="block text-slate-800 mb-1"><i class="ph ph-user-focus text-brand-blue"></i> Função e Posição</strong>
            A função filtra quem pode ser escalado. A posição diferencia vagas iguais (ex: Vela 1 e Vela 2). Não podem haver duplicadas!
          </div>
          <div class="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
            <strong class="block text-slate-800 mb-1"><i class="ph ph-text-aa text-brand-blue"></i> Rótulo</strong>
            É o texto que aparece no cabeçalho da grade. Escreva como preferir ("Acólito Missal", "Vela 01").
          </div>
        </div>

        @if (colunas.length === 0) {
          <div class="py-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
            <i class="ph ph-table text-4xl text-slate-400 mb-2"></i>
            <p class="text-slate-500 font-medium">Nenhuma coluna adicionada ainda.</p>
            <p class="text-sm text-slate-400">Clique no botão "Adicionar Coluna" para começar.</p>
          </div>
        }

        <div class="overflow-x-auto" *ngIf="colunas.length > 0">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-100 text-slate-600">
              <tr>
                <th class="px-4 py-3 font-bold rounded-tl-lg w-24 text-center">Ordem</th>
                <th class="px-4 py-3 font-bold w-48">Função Real *</th>
                <th class="px-4 py-3 font-bold w-24">Posição *</th>
                <th class="px-4 py-3 font-bold">Rótulo no Cabeçalho *</th>
                <th class="px-4 py-3 font-bold rounded-tr-lg w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody formArrayName="colunas">
              @for (col of colunas.controls; track col; let i = $index) {
                <tr [formGroupName]="i" class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-2 text-center">
                    <div class="flex items-center justify-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                      <button type="button" class="p-1 rounded text-slate-400 hover:text-brand-blue hover:bg-blue-50 disabled:opacity-30 transition-colors" [disabled]="i === 0" (click)="moverColuna(i, -1)" title="Subir">
                        <i class="ph-bold ph-caret-up"></i>
                      </button>
                      <span class="font-bold w-5 text-center text-slate-600">{{i + 1}}º</span>
                      <button type="button" class="p-1 rounded text-slate-400 hover:text-brand-blue hover:bg-blue-50 disabled:opacity-30 transition-colors" [disabled]="i === colunas.length - 1" (click)="moverColuna(i, 1)" title="Descer">
                        <i class="ph-bold ph-caret-down"></i>
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <select class="field w-full py-1.5 px-3 text-sm" formControlName="funcao" 
                            [class.border-red-500]="col.get('funcao')?.invalid && col.get('funcao')?.touched">
                      <option [ngValue]="null">Selecione...</option>
                      @for (f of funcoesOpcoes; track f.valor) {
                        <option [value]="f.valor">{{ f.label }}</option>
                      }
                    </select>
                  </td>
                  <td class="px-4 py-2">
                    <input type="number" class="field w-full py-1.5 px-3 text-sm text-center" formControlName="posicao" min="1" 
                           [class.border-red-500]="col.get('posicao')?.invalid && col.get('posicao')?.touched">
                  </td>
                  <td class="px-4 py-2">
                    <input type="text" class="field w-full py-1.5 px-3 text-sm" formControlName="rotulo" placeholder="Ex: Acólito Missal"
                           [class.border-red-500]="col.get('rotulo')?.invalid && col.get('rotulo')?.touched">
                  </td>
                  <td class="px-4 py-2 text-center">
                    <button type="button" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors mx-auto" title="Remover" (click)="removerColuna(i)">
                      <i class="ph ph-trash text-lg"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        @if (form.hasError('colunaDuplicada')) {
          <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm font-medium">
            <i class="ph-fill ph-warning-circle text-lg"></i>
            Há colunas com a mesma Função e Posição! Mude a posição ou a função para continuar.
          </div>
        }
      </section>

      <app-rodape-form
        [voltarUrl]="['/escalas/layouts']"
        [carregando]="salvando"
        [desabilitado]="form.invalid">
      </app-rodape-form>
    </form>
  `
"""

with open('src/app/features/escalas/pages/layouts/layout-form.component.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import re
# Replace everything between template: ` and `
content = re.sub(r'template: `[\s\S]*?`\s*\n}\)', new_template + '\n})', content)

with open('src/app/features/escalas/pages/layouts/layout-form.component.ts', 'w', encoding='utf-8') as f:
    f.write(content)
