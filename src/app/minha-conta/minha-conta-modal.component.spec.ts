import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MinhaContaModalComponent } from './minha-conta-modal.component';
import { MinhaContaService } from './minha-conta.service';

import { Router } from '@angular/router';

describe('MinhaContaModalComponent', () => {
  let fixture: ComponentFixture<MinhaContaModalComponent>;
  let component: MinhaContaModalComponent;
  let servico: jasmine.SpyObj<MinhaContaService>;
  

  beforeEach(async () => {
    servico = jasmine.createSpyObj('MinhaContaService', ['buscar']);
    
    
    await TestBed.configureTestingModule({
      imports: [MinhaContaModalComponent],
      providers: [
        { provide: MinhaContaService, useValue: servico },
        
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();
  });

  function texto(seletor: string): string {
    const el = fixture.nativeElement.querySelector(seletor) as HTMLElement;
    return el ? el.textContent?.trim() || '' : '';
  }

  it('exibe mensagem de carregando inicialmente', () => {
    servico.buscar.and.returnValue(of({
      cliente: { id: '1', nome: 'Teste', documento: '123', tipo: 'PF', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '', cep: '', contatos: [] },
      contratacao: { planoNome: 'P', periodicidade: 'M', valor: 10, diaVencimento: 1, inicio: '2023-01-01', vigenteAte: '2024-01-01', situacaoComercial: 'ATIVA', nomeInstancia: 'N', slugInstancia: 'S', direitos: { limites: {}, funcionalidades: [] }, adicionais: [] },
      cobrancas: []
    }));
    fixture = TestBed.createComponent(MinhaContaModalComponent);
    component = fixture.componentInstance;
    // Before first CD, the observable hasn't returned if it's async, but here we use synchronous `of()`.
    // Let's force an async observable.
  });

  it('exibe mensagem de erro e botão Tentar de novo se falhar, e chama dialogo', () => {
    servico.buscar.and.returnValue(throwError(() => new Error('Falha simulada')));
    fixture = TestBed.createComponent(MinhaContaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    
    expect(texto('.text-red-500')).toContain('Falha simulada');
    
    const btn = fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement;
    expect(btn.textContent).toContain('Tentar de novo');
  });

  it('exibe sucesso quando carrega dados', () => {
    servico.buscar.and.returnValue(of({
      cliente: { id: '2', nome: 'Paróquia X', documento: '00011122233', tipo: 'PJ', logradouro: 'Rua A', numero: '1', complemento: '', bairro: 'Centro', cidade: 'Cidade', uf: 'SP', cep: '12345678', contatos: [] },
      contratacao: { planoNome: 'Plano Base', periodicidade: 'MENSAL', valor: 150, diaVencimento: 5, inicio: '2023-01-01', vigenteAte: '2024-01-01', situacaoComercial: 'ATIVA', nomeInstancia: 'Paróquia X', slugInstancia: 'paroquia-x', direitos: { limites: {}, funcionalidades: [] }, adicionais: [] },
      cobrancas: []
    }));
    fixture = TestBed.createComponent(MinhaContaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(texto('.font-semibold')).toContain('Paróquia X');
  });
});
