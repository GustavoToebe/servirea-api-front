import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { EscalasService } from '../../services/escalas.service';
import { IndisponibilidadesComponent, fimDeSemanaDoMes } from './indisponibilidades.component';

describe('IndisponibilidadesComponent', () => {
  let escalas: jasmine.SpyObj<EscalasService>;

  async function montar() {
    escalas = jasmine.createSpyObj<EscalasService>('EscalasService', ['indisponibilidades', 'salvarIndisponibilidades']);
    escalas.salvarIndisponibilidades.and.callFake(async (ano,mes,dados)=>({ano,mes,...dados,versao:dados.versao+1}));
    escalas.indisponibilidades.and.resolveTo({ ano: 2026, mes: 10, itens: [], semRestricao: [], versao: 0 });
    TestBed.configureTestingModule({
      imports: [IndisponibilidadesComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ ano: '2026', mes: '10' }) } } },
        { provide: EscalasService, useValue: escalas },
        { provide: VoluntariosService, useValue: { ativosLeves: () => Promise.resolve([
          { id: 'a', nome_completo: 'Ana', tipo: 'COROINHA', ativo: true },
          { id: 'b', nome_completo: 'Bruno', tipo: 'ACOLITO', ativo: true }
        ]) } }
      ]
    });
    const fixture = TestBed.createComponent(IndisponibilidadesComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('colunas são os sábados e domingos do mês', () => {
    const cols = fimDeSemanaDoMes(2026, 10);
    expect(cols[0].data).toBe('2026-10-03');
    expect(cols.map(c => c.data)).toContain('2026-10-04');
    expect(cols.length).toBe(9);
  });

  it('a data só é marcada quando uma opção é escolhida, e mostra o texto completo', async () => {
    const fixture = await montar();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-situacao="a"]')!.textContent).toContain('Pendente');
    const celula = el.querySelector('[data-celula="a|2026-10-03"]') as HTMLSelectElement;
    celula.click();
    fixture.detectChanges();
    expect(el.querySelector('[data-marcada="a|2026-10-03"]')).toBeNull();

    celula.value = 'TARDE';
    celula.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.querySelector('[data-marcada="a|2026-10-03"]')!.textContent).toContain('Só tarde');
    expect(el.querySelector('[data-situacao="a"]')!.textContent).toContain('Com restrição');

    const outra = el.querySelector('[data-celula="a|2026-10-04"]') as HTMLSelectElement;
    outra.value = 'DIA';
    outra.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.querySelector('[data-marcada="a|2026-10-04"]')!.textContent).toContain('Dia inteiro');
  });

  it('marcar todas as datas não muda a largura das colunas', async () => {
    const fixture = await montar();
    const el: HTMLElement = fixture.nativeElement;
    document.body.appendChild(el);
    const larguras = () => Array.from(el.querySelectorAll('thead th')).map(th => Math.round(th.getBoundingClientRect().width));
    const antes = larguras();
    for (const col of fixture.componentInstance.colunas) fixture.componentInstance.marcar('a', col.data);
    fixture.componentInstance.trocarPeriodo('a', '2026-10-04', 'MANHA');
    fixture.detectChanges();
    expect(el.querySelectorAll('[data-marcada^="a|"]').length).toBe(9);
    expect(larguras()).toEqual(antes);
    el.remove();
  });

  it('"Sem restrição" limpa as datas da linha e salvar manda o corpo esperado', async () => {
    const fixture = await montar();
    const c = fixture.componentInstance;
    c.marcar('a', '2026-10-03');
    c.marcar('b', '2026-10-04');
    c.trocarPeriodo('b', '2026-10-04', 'MANHA');
    spyOn(TestBed.inject(DialogoService), 'confirmar').and.resolveTo(true);
    const caixa = document.createElement('input');
    caixa.type = 'checkbox';
    caixa.checked = true;
    await c.alternarSemRestricao('a', { target: caixa } as unknown as Event);
    expect(c.situacao('a')).toBe('SEM_RESTRICAO');

    await c.salvar();
    expect(escalas.salvarIndisponibilidades).toHaveBeenCalledWith(2026, 10, {
      itens: [{ voluntarioId: 'b', data: '2026-10-04', periodo: 'MANHA', observacao: null }],
      semRestricao: ['a'], versao: 0
    });
    expect(c.hasPendingChanges()).toBeFalse();
  });
  it('preserva períodos múltiplos e observações do portal em datas não editadas',async()=>{
    const f=await montar();escalas.indisponibilidades.and.resolveTo({ano:2026,mes:10,versao:6,semRestricao:[],itens:[{voluntarioId:'a',data:'2026-10-03',periodo:'MANHA',observacao:'Aviso da coordenação'},{voluntarioId:'a',data:'2026-10-03',periodo:'NOITE',observacao:null}]});await f.componentInstance.carregar();expect(f.componentInstance.corpo().itens.length).toBe(2);expect(f.componentInstance.corpo().itens[0].observacao).toBe('Aviso da coordenação');await f.componentInstance.salvar();expect(f.componentInstance.versao).toBe(7);
  });
  it('consulta de mês que falha não permite salvar dados do mês anterior',async()=>{const f=await montar();escalas.indisponibilidades.and.rejectWith(new Error('Sem conexão'));await f.componentInstance.trocarMes('2026-11');await f.componentInstance.salvar();expect(escalas.salvarIndisponibilidades).not.toHaveBeenCalled();});
  it('resposta de mês anterior não substitui consulta nova',async()=>{const f=await montar();let resolver!:(v:any)=>void;escalas.indisponibilidades.and.returnValue(new Promise(r=>resolver=r));const antiga=f.componentInstance.carregar();escalas.indisponibilidades.and.resolveTo({ano:2026,mes:11,versao:8,itens:[],semRestricao:[]});await f.componentInstance.trocarMes('2026-11');resolver({ano:2026,mes:10,versao:1,itens:[],semRestricao:[]});await antiga;expect(f.componentInstance.versao).toBe(8);});
});
