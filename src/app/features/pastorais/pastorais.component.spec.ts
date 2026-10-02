import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of,Subject } from 'rxjs';
import { PastoraisComponent } from './pastorais.component';
import { PastoraisApiService,Pagina,Equipe } from './pastorais-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
describe('Pastorais simples',()=>{
 let api:jasmine.SpyObj<PastoraisApiService>;const equipe={id:'a',nome:'Liturgia',descricao:null,ativo:true,versao:0};
 beforeEach(()=>{api=jasmine.createSpyObj('api',['equipes','membros','pessoas','membro','salvar']);api.equipes.and.returnValue(of({itens:[equipe],total:1,pagina:0,tamanho:30}));api.membros.and.returnValue(of({itens:[],total:0,pagina:0,tamanho:30}));TestBed.configureTestingModule({imports:[PastoraisComponent],providers:[{provide:PastoraisApiService,useValue:api},{provide:SessaoAtual,useValue:{permissoes:signal(['PASTORAL'])}}]});});
 it('leitor consulta equipes sem botões de escrita',()=>{const f=TestBed.createComponent(PastoraisComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('Liturgia');expect(f.nativeElement.textContent).not.toContain('Nova equipe');f.componentInstance.abrir(equipe);f.detectChanges();expect(f.nativeElement.textContent).not.toContain('Adicionar participante');});
 it('nova busca cancela lista antiga',()=>{const anterior=new Subject<Pagina<Equipe>>();api.equipes.and.returnValue(anterior);const f=TestBed.createComponent(PastoraisComponent);f.detectChanges();api.equipes.and.returnValue(of({itens:[],total:0,pagina:0,tamanho:30}));f.componentInstance.buscar();anterior.next({itens:[equipe],total:1,pagina:0,tamanho:30});expect(f.componentInstance.total()).toBe(0);f.destroy();});
});
