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
    pessoas = jasmine.createSpyObj<PessoasService>('PessoasService', ['listar', 'buscar', 'criar', 'atualizar']);
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
});
