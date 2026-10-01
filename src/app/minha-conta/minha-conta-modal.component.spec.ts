import { SessaoAtual } from '../core/layout/sessao-atual';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { MinhaContaModalComponent } from './minha-conta-modal.component';
import { MinhaContaDados, MinhaContaService } from './minha-conta.service';

/** Mesmo formato do MinhaContaDto da Central (documento, CEP e telefone já vêm formatados). */
function resposta(): MinhaContaDados {
  return {
    cliente: {
      nome: 'Paróquia São José Operário',
      documento: '12.345.678/0001-95',
      endereco: {
        logradouro: 'Rua General Osório', numero: '3191', complemento: 'Sala 2',
        bairro: 'Centro', cidade: 'Cascavel', uf: 'PR', cep: '85810-000'
      },
      contatos: [
        { nome: 'Maria', email: 'maria@paroquia.test', telefone: '(45) 99965-0660', principal: true },
        { nome: 'João', email: null, telefone: '(45) 3099-2700', principal: false }
      ]
    },
    contratacao: {
      planoNome: 'Plano Base', periodicidade: 'MENSAL', valor: 150, diaVencimento: 10,
      inicio: '2026-09-01', vigenteAte: null, situacaoComercial: 'ATIVA', nomeInstancia: 'São José Operário',
      adicionais: [{ nome: 'Usuários extras', quantidade: 3 }]
    },
    cobrancas: [
      { id: 'c3', competenciaInicio: '2026-11-01', competenciaFim: '2026-11-30', vencimento: '2026-11-10', valor: 150, situacao: 'ABERTA', vencida: false, pagoEm: null },
      { id: 'c2', competenciaInicio: '2026-10-01', competenciaFim: '2026-10-31', vencimento: '2026-10-10', valor: 150, situacao: 'ABERTA', vencida: true, pagoEm: null },
      { id: 'c1', competenciaInicio: '2026-09-01', competenciaFim: '2026-09-30', vencimento: '2026-09-10', valor: 150, situacao: 'PAGA', vencida: false, pagoEm: '2026-09-08' }
    ]
  };
}

describe('MinhaContaModalComponent', () => {
  let fixture: ComponentFixture<MinhaContaModalComponent>;
  let servico: jasmine.SpyObj<MinhaContaService>;

  beforeEach(async () => {
    servico = jasmine.createSpyObj('MinhaContaService', ['buscar', 'consumo']);
    servico.consumo.and.returnValue(of({planoNome: null, versaoDireitos: null, direitosConfirmadosEm: null, consultadoEm: '', itens: []}));
    await TestBed.configureTestingModule({
      imports: [MinhaContaModalComponent],
      providers: [{provide:SessaoAtual,useValue:{permissoes:() => []}},
        { provide: MinhaContaService, useValue: servico },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    }).compileComponents();
  });

  function criar(): void {
    fixture = TestBed.createComponent(MinhaContaModalComponent);
    fixture.detectChanges();
  }

  function texto(seletor: string): string {
    return (document.querySelector(seletor) as HTMLElement | null)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function abrirAba(aba: string): void {
    (document.querySelector(`[data-aba="${aba}"]`) as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  afterEach(() => fixture?.destroy());

  it('mostra "buscando" enquanto a Central não responde', () => {
    servico.buscar.and.returnValue(NEVER);
    criar();
    expect(document.querySelector('[data-estado="carregando"]')).not.toBeNull();
  });

  it('cadastro: nome, documento, endereço com o CEP como veio e contatos', () => {
    servico.buscar.and.returnValue(of(resposta()));
    criar();

    const cadastro = texto('[data-bloco="cadastro"]');
    expect(cadastro).toContain('Paróquia São José Operário');
    expect(cadastro).toContain('12.345.678/0001-95');
    expect(texto('[data-campo="endereco"]')).toContain('Rua General Osório, 3191 – Sala 2');
    expect(texto('[data-campo="endereco"]')).toContain('Centro – Cascavel/PR · CEP 85810-000');
    expect(texto('[data-campo="endereco"]')).not.toContain('--');
    expect(texto('[data-bloco="contatos"]')).toContain('Maria');
    expect(texto('[data-bloco="contatos"]')).toContain('Principal');
    expect(texto('[data-bloco="contatos"]')).toContain('(45) 3099-2700');
  });

  it('cadastro sem endereço mostra "Não informado"', () => {
    const r = resposta();
    r.cliente.endereco = { logradouro: null, numero: null, complemento: null, bairro: null, cidade: null, uf: null, cep: null };
    servico.buscar.and.returnValue(of(r));
    criar();
    expect(texto('[data-campo="endereco"]')).toContain('Não informado');
  });

  it('meu plano: situação em texto legível, periodicidade e adicionais', () => {
    servico.buscar.and.returnValue(of(resposta()));
    criar();
    abrirAba('plano');

    expect(texto('[data-bloco="plano"]')).toContain('Plano Base');
    expect(texto('[data-campo="situacao"]')).toBe('Ativa');
    expect(document.querySelector('[data-campo="situacao"]')!.className).toContain('emerald');
    expect(document.body.textContent).toContain('Mensal');
    expect(texto('[data-bloco="adicionais"]')).toContain('Usuários extras');
  });

  it('financeiro: cada fatura com o texto e a cor da situação', () => {
    servico.buscar.and.returnValue(of(resposta()));
    criar();
    abrirAba('financeiro');

    const faturas = Array.from(document.querySelectorAll('[data-cobranca]'));
    expect(faturas.length).toBe(3);
    const badges = faturas.map(f => f.querySelector('.badge') as HTMLElement);
    expect(badges.map(b => b.textContent!.trim())).toEqual(['Aberta', 'Vencida', 'Paga']);
    expect(badges[0].className).toContain('amber');
    expect(badges[1].className).toContain('red');
    expect(badges[2].className).toContain('emerald');
  });

  it('erro da API aparece com a mensagem do back e "Tentar de novo" busca outra vez', () => {
    const falha = new HttpErrorResponse({ status: 502, error: { message: 'Não foi possível consultar sua conta agora.' } });
    servico.buscar.and.returnValues(throwError(() => falha), of(resposta()));
    criar();

    expect(texto('[data-estado="erro"]')).toContain('Não foi possível consultar sua conta agora.');
    (document.querySelector('[data-estado="erro"] button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(servico.buscar).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[data-estado="erro"]')).toBeNull();
    expect(texto('[data-bloco="cadastro"]')).toContain('Paróquia São José Operário');
  });
});
