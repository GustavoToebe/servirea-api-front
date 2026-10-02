import { Component, ChangeDetectionStrategy, Input, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { FUNCIONALIDADES, FuncionalidadesPlanoService, moduloDoPlano } from './funcionalidades-plano.service';
@Component({selector:'app-funcionalidades-plano',changeDetection:ChangeDetectionStrategy.OnPush,imports:[RouterLink],template:`
  @if (!contextual || modulo()) {
    @if (erro()) {<div class="card p-4 mb-4 text-amber-700 dark:text-amber-300" role="alert">Não foi possível consultar os recursos do plano. A API verificará as operações. <button type="button" class="btn-secondary" (click)="buscar()">Tentar novamente</button></div>}
    @else if (dados(); as liberadas) {
      @if (contextual) {
        @if (modulo() && !liberadas.includes(modulo()!)) {
          <div class="card p-4 mb-4 text-amber-700 dark:text-amber-300" role="status"><b>Modo de consulta.</b> Esta funcionalidade não está incluída no plano. Os dados existentes continuam acessíveis conforme suas permissões; novas operações estão bloqueadas. Consulte o administrador para ajustar o plano. <button type="button" class="btn-secondary" (click)="buscar()">Atualizar direitos</button></div>
        }
      } @else {
        <section class="card p-5 space-y-3"><h3 class="secao-titulo">Funcionalidades do plano</h3>
          <p class="text-sm text-slate-500">A liberação do plano e as permissões do seu perfil são verificações separadas. Dados existentes continuam disponíveis para consulta.</p>
          @for (item of itens;track item.codigo) {
            <div class="flex justify-between gap-3"><span>{{ item.nome }}</span><span class="badge" [class.bg-emerald-50]="liberadas.includes(item.codigo)" [class.text-emerald-700]="liberadas.includes(item.codigo)" [class.bg-amber-50]="!liberadas.includes(item.codigo)" [class.text-amber-700]="!liberadas.includes(item.codigo)">{{ liberadas.includes(item.codigo) ? 'Incluída' : 'Somente consulta' }}</span></div>
          }
          <button type="button" class="btn-secondary" (click)="buscar()">Atualizar direitos</button>
          <a routerLink="/dashboard" class="btn-secondary ml-2">Início</a>
        </section>
      }
    }
  }
`})
export class FuncionalidadesPlanoComponent implements OnInit,OnDestroy {
  @Input() contextual=false;
  private api=inject(FuncionalidadesPlanoService);private router=inject(Router);
  private carga?:Subscription;private navegacao?:Subscription;
  dados=signal<string[]|null>(null);erro=signal(false);itens=FUNCIONALIDADES;
  private url=signal('');modulo=computed(() => moduloDoPlano(this.url()));
  ngOnInit() {this.url.set(this.router.url);this.buscar();if(this.contextual) this.navegacao=this.router.events.subscribe(e => {if(e instanceof NavigationEnd) {this.url.set(e.urlAfterRedirects);this.buscar();}});}
  buscar() {
    this.carga?.unsubscribe();this.dados.set(null);this.erro.set(false);
    if(this.contextual && !this.modulo()) return;
    this.carga=this.api.consultar().subscribe({next:d => this.dados.set(d),error:() => this.erro.set(true)});
  }
  ngOnDestroy() {this.carga?.unsubscribe();this.navegacao?.unsubscribe();}
}
