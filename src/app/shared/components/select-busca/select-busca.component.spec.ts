import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { fakeAsync, flushMicrotasks, tick, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { OpcaoSelectBusca, SelectBuscaComponent } from './select-busca.component';

@Component({
  imports: [FormsModule, SelectBuscaComponent],
  template: `<app-select-busca [opcoes]="opcoes" [buscar]="buscar" [(ngModel)]="valor" />`
})
class HostComponent {
  buscar?: (termo:string)=>Promise<OpcaoSelectBusca[]>;
  valor: string | null = null;
  opcoes: OpcaoSelectBusca[] = [
    { valor: '1', rotulo: 'João da Silva', detalhe: 'nº 12' },
    { valor: '2', rotulo: 'Maria Conceição', detalhe: 'nº 7' },
    { valor: '3', rotulo: 'Pedro Araújo' }
  ];
}

describe('SelectBuscaComponent', () => {
  function montar() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  function abrir(fixture: ReturnType<typeof montar>): HTMLInputElement {
    (fixture.nativeElement.querySelector('[data-select-busca]') as HTMLButtonElement).click();
    fixture.detectChanges();
    return document.body.querySelector('[data-busca-opcao]') as HTMLInputElement;
  }

  it('busca remota usa debounce e descarta resposta antiga', fakeAsync(() => {
    const fixture=montar();let antiga!: (opcoes:OpcaoSelectBusca[])=>void;
    const buscar=jasmine.createSpy().and.callFake((termo:string) => termo==='' ? new Promise<OpcaoSelectBusca[]>(r => antiga=r) : Promise.resolve([{valor:'nova',rotulo:'Nova'}]));
    fixture.componentInstance.buscar=buscar;fixture.detectChanges();const campo=abrir(fixture);
    campo.value='No';campo.dispatchEvent(new Event('input'));tick(200);
    campo.value='Nova';campo.dispatchEvent(new Event('input'));tick(299);expect(buscar.calls.count()).toBe(1);
    tick(1);flushMicrotasks();fixture.detectChanges();
    antiga([{valor:'antiga',rotulo:'Antiga'}]);flushMicrotasks();fixture.detectChanges();
    expect(document.body.querySelector('[data-opcao="nova"]')).not.toBeNull();
    expect(document.body.querySelector('[data-opcao="antiga"]')).toBeNull();fixture.destroy();
  }));

  it('preserva rótulo escolhido em novas buscas e ignora resposta após fechar', fakeAsync(() => {
    const fixture=montar();let concluir!: (opcoes:OpcaoSelectBusca[])=>void;
    fixture.componentInstance.buscar=() => Promise.resolve([{valor:'fora',rotulo:'Pessoa fora da lista inicial'}]);
    fixture.detectChanges();abrir(fixture);flushMicrotasks();fixture.detectChanges();
    (document.body.querySelector('[data-opcao="fora"]') as HTMLElement).click();fixture.detectChanges();flushMicrotasks();
    expect(fixture.nativeElement.textContent).toContain('Pessoa fora da lista inicial');
    fixture.componentInstance.buscar=() => new Promise(r => concluir=r);fixture.detectChanges();abrir(fixture);
    const seletor=fixture.debugElement.query(By.directive(SelectBuscaComponent)).componentInstance as SelectBuscaComponent;
    seletor.fechar();concluir([{valor:'tardia',rotulo:'Tardia'}]);flushMicrotasks();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pessoa fora da lista inicial');expect(seletor.carregando).toBeFalse();fixture.destroy();
  }));

  it('erro remoto é visível sem substituir o valor selecionado', fakeAsync(() => {
    const fixture=montar();fixture.componentInstance.buscar=() => Promise.reject(new Error('Sem conexão.'));
    fixture.detectChanges();abrir(fixture);flushMicrotasks();fixture.detectChanges();
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain('Sem conexão.');fixture.destroy();
  }));

  it('filtra sem acento e sem diferenciar maiúsculas', () => {
    const fixture = montar();
    const campo = abrir(fixture);
    campo.value = 'CONCEICAO';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const itens = document.body.querySelectorAll('li[role="option"]');
    expect(itens.length).toBe(1);
    expect(itens[0].textContent).toContain('Maria Conceição');
    fixture.destroy();
  });

  it('Enter escolhe o destacado e fecha', () => {
    const fixture = montar();
    const campo = abrir(fixture);
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.valor).toBe('2');
    expect(document.body.querySelector('[data-busca-opcao]')).toBeNull();
    fixture.destroy();
  });

  it('✕ limpa e emite null', async () => {
    const fixture = montar();
    fixture.componentInstance.valor = '1';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-limpar]') as HTMLElement).click();
    expect(fixture.componentInstance.valor).toBeNull();
  });

  it('fechado não registra listener global', () => {
    const add = spyOn(document, 'addEventListener').and.callThrough();
    const fixture = montar();
    expect(add.calls.allArgs().map(a => a[0])).not.toContain('mousedown');
    abrir(fixture);
    expect(add.calls.allArgs().map(a => a[0])).toContain('mousedown');
    fixture.destroy();
  });
});
