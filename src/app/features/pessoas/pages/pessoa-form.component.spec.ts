import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CepService } from '../../../shared/services/cep.service';
import { Pessoa } from '../models/pessoa.model';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';
import { PessoaFormComponent } from './pessoa-form.component';

describe('PessoaFormComponent (máscaras, validação e CEP)', () => {
  let pessoas: jasmine.SpyObj<PessoasService>;

  function montar(id: string | null) {
    pessoas = jasmine.createSpyObj<PessoasService>('PessoasService', ['listar', 'buscar', 'criar', 'atualizar', 'duplicidades']);
    pessoas.listar.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [PessoaFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
        { provide: PessoasService, useValue: pessoas },
        { provide: VoluntariosApiService, useValue: jasmine.createSpyObj('VoluntariosApiService', ['fotoUrl', 'enviarFoto']) }
      ]
    });
    return TestBed.createComponent(PessoaFormComponent);
  }

  it('CEP completo preenche o endereço e mantém o número', async () => {
    const fixture = montar(null);
    await fixture.componentInstance.ngOnInit();
    spyOn(TestBed.inject(CepService), 'buscar').and.resolveTo(
      { logradouro: 'Rua Paraná', bairro: 'Centro', cidade: 'Cascavel', uf: 'PR' });
    const form = fixture.componentInstance.form;
    form.patchValue({ numero: '123' });
    await fixture.componentInstance.buscarCep('85800-000');
    expect(form.value.logradouro).toBe('Rua Paraná');
    expect(form.value.bairro).toBe('Centro');
    expect(form.value.cidade).toBe('Cascavel');
    expect(form.value.uf).toBe('PR');
    expect(form.value.numero).toBe('123');
  });

  it('CPF inválido não chega à API', async () => {
    const fixture = montar(null);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.form.patchValue({ nomeCompleto: 'Ana', cpf: '101.175' });
    await fixture.componentInstance.save();
    expect(pessoas.criar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error).toBe('Corrija os campos marcados em vermelho.');
  });

  it('nome vazio fica vermelho e recebe o foco', async () => {
    const fixture = montar(null);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
    await fixture.componentInstance.save();
    fixture.detectChanges();
    await new Promise(r => setTimeout(r));
    const nome = fixture.nativeElement.querySelector('input[formcontrolname="nomeCompleto"]') as HTMLInputElement;
    expect(nome.classList).toContain('ng-invalid');
    expect(document.activeElement).toBe(nome);
    expect(pessoas.criar).not.toHaveBeenCalled();
    fixture.nativeElement.remove();
  });

  it('foto vai junto com a ficha (sem segunda chamada)', async () => {
    const fixture = montar(null);
    await fixture.componentInstance.ngOnInit();
    const foto = new File([new Uint8Array([1])], 'f.png', { type: 'image/png' });
    fixture.componentInstance.photoFile = foto;
    fixture.componentInstance.form.patchValue({ nomeCompleto: 'Ana' });
    pessoas.criar.and.rejectWith(new Error('Storage não configurado.'));
    await fixture.componentInstance.save();
    expect(pessoas.criar).toHaveBeenCalledWith(jasmine.anything(), foto);
    expect(TestBed.inject(VoluntariosApiService).enviarFoto).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error).toBe('Storage não configurado.');
  });

  function voluntario(): Pessoa {
    return {
      id: 'p1', papeis: ['VOLUNTARIO'], nomeCompleto: 'Ana Maria Souza', emails: [], telefones: [],
      responsaveis: [], dependentes: [], voluntario: { tipo: 'COROINHA', funcoesHabilitadas: [], fotoPath: null }
    } as unknown as Pessoa;
  }

  it('a foto fica no topo da página, no bloco Identidade, antes de Papéis', async () => {
    const fixture = montar(null);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const secoes = Array.from(fixture.nativeElement.querySelectorAll('form > section') as NodeListOf<HTMLElement>);
    expect(secoes[0].querySelector('[data-bloco="foto"]')).not.toBeNull();
    expect(secoes[0].textContent).toContain('Identidade');
    expect(secoes[1].textContent).toContain('Papéis');
  });

  it('sem foto mostra as iniciais do primeiro e do último nome', async () => {
    const fixture = montar('p1');
    pessoas.buscar.and.resolveTo(voluntario());
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-foto="iniciais"]').textContent.trim()).toBe('AS');
    expect(fixture.nativeElement.querySelector('[data-foto="imagem"]')).toBeNull();
  });

  it('voluntário tem o botão de câmera; quem não é voluntário não', async () => {
    const fixture = montar('p1');
    pessoas.buscar.and.resolveTo(voluntario());
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-foto="trocar"] input[type="file"]')).not.toBeNull();

    const outro = montarOutro();
    await outro.componentInstance.ngOnInit();
    outro.detectChanges();
    expect(outro.nativeElement.querySelector('[data-foto="trocar"]')).toBeNull();
    expect(outro.nativeElement.textContent).toContain('A foto é do cadastro de voluntário.');
  });

  function montarOutro() {
    TestBed.resetTestingModule();
    const f = montar('p2');
    pessoas.buscar.and.resolveTo({
      id: 'p2', papeis: ['RESPONSAVEL'], nomeCompleto: 'José', emails: [], telefones: [], responsaveis: [], dependentes: []
    } as unknown as Pessoa);
    return f;
  }

  it('arquivo que não é imagem mostra o erro embaixo da foto e não troca a prévia', async () => {
    const fixture = montar('p1');
    pessoas.buscar.and.resolveTo(voluntario());
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();

    const arquivo = new File(['x'], 'nota.txt', { type: 'text/plain' });
    await fixture.componentInstance.onPhoto({ target: { files: [arquivo] } } as unknown as Event);
    fixture.detectChanges();

    expect(fixture.componentInstance.photoFile).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-foto="erro"]')).not.toBeNull();
    expect(fixture.componentInstance.error).toBeFalsy();
  });

  it('ficha antiga abre com sexo na lista e documentos formatados', async () => {
    const fixture = montar('p1');
    pessoas.buscar.and.resolveTo({
      id: 'p1', papeis: ['RESPONSAVEL'], nomeCompleto: 'Maria', sexo: 'F', cpf: '52998224725', rg: '123456789',
      cep: '85800000', uf: 'pr', emails: [], telefones: [{ tipo: 'celular', numero: '45999998888', principal: true }],
      responsaveis: [], dependentes: []
    } as unknown as Pessoa);
    await fixture.componentInstance.ngOnInit();
    const v = fixture.componentInstance.form.getRawValue();
    expect(v.sexo).toBe('Feminino');
    expect(v.cpf).toBe('529.982.247-25');
    expect(v.rg).toBe('12.345.678-9');
    expect(v.cep).toBe('85800-000');
    expect(v.uf).toBe('PR');
    expect(v.telefones[0].numero).toBe('(45) 99999-8888');
  });

  it('com mock devolvendo um item bloqueia: true, salvar não chama criar', async () => {
    const fixture = montar(null);
    pessoas.duplicidades = jasmine.createSpy().and.resolveTo([{
      id: 'd1', nomeCompleto: 'Ana', motivos: ['CPF'], bloqueia: true
    }]);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.form.patchValue({ nomeCompleto: 'Ana' });
    await fixture.componentInstance.save();
    expect(pessoas.duplicidades).toHaveBeenCalled();
    expect(pessoas.criar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.dialogOpen).toBeTrue();
  });

  it('com item não bloqueante, "Salvar mesmo assim" chama criar', async () => {
    const fixture = montar(null);
    pessoas.duplicidades = jasmine.createSpy().and.resolveTo([{
      id: 'd1', nomeCompleto: 'Ana S', motivos: ['NOME'], bloqueia: false
    }]);
    pessoas.criar.and.resolveTo({ id: 'p1' } as Pessoa);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.form.patchValue({ nomeCompleto: 'Ana' });
    await fixture.componentInstance.save();
    expect(pessoas.duplicidades).toHaveBeenCalled();
    expect(pessoas.criar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.dialogOpen).toBeTrue();

    await fixture.componentInstance.confirmarSave();
    expect(pessoas.criar).toHaveBeenCalled();
    expect(fixture.componentInstance.dialogOpen).toBeFalse();
  });

  it('salva com o responsável escolhido pelo campo com busca', async () => {
    const fixture = montar(null);
    pessoas.listar.and.resolveTo([{ id: 'm1', nomeCompleto: 'Maria Souza', sequencial: 12, papeis: ['RESPONSAVEL'] } as unknown as Pessoa]);
    pessoas.duplicidades = jasmine.createSpy().and.resolveTo([]);
    pessoas.criar.and.resolveTo({ id: 'p1' } as Pessoa);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.form.patchValue({ nomeCompleto: 'Ana' });
    fixture.componentInstance.addRelacao('responsaveis');
    fixture.componentInstance.responsaveis.at(0).patchValue({ parentesco: 'Mãe' });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('[data-relacao="responsaveis"] [data-select-busca]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (document.body.querySelector('[data-opcao="m1"]') as HTMLElement).click();
    fixture.detectChanges();

    await fixture.componentInstance.save();
    const corpo = pessoas.criar.calls.mostRecent().args[0] as { responsaveis: { pessoaId?: string }[] };
    expect(corpo.responsaveis[0].pessoaId).toBe('m1');
  });
});
