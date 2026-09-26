import {
  cepValido, cnpjValido, cpfValido, emailValido, formatarCep, formatarCnpj, formatarCpf, formatarRg,
  formatarTelefone, normalizarSexo, rgValido, telefoneValido, ufValida
} from './formatos';

describe('formatos', () => {
  it('CPF: máscara enquanto digita e dígitos verificadores', () => {
    expect(formatarCpf('529')).toBe('529');
    expect(formatarCpf('5299822')).toBe('529.982.2');
    expect(formatarCpf('52998224725999')).toBe('529.982.247-25');
    expect(cpfValido('529.982.247-25')).toBeTrue();
    expect(cpfValido('529.982.247-24')).toBeFalse();
    expect(cpfValido('101175')).toBeFalse();
    expect(cpfValido('111.111.111-11')).toBeFalse();
  });

  it('CNPJ numérico e alfanumérico', () => {
    expect(formatarCnpj('11222333000181')).toBe('11.222.333/0001-81');
    expect(formatarCnpj('12abc34501de35')).toBe('12.ABC.345/01DE-35');
    expect(cnpjValido('11.222.333/0001-81')).toBeTrue();
    expect(cnpjValido('12.ABC.345/01DE-35')).toBeTrue();
    expect(cnpjValido('12.ABC.345/01DE-36')).toBeFalse();
    expect(cnpjValido('00.000.000/0000-00')).toBeFalse();
  });

  it('RG: máscara com 9 caracteres e X só no fim', () => {
    expect(formatarRg('12345678x')).toBe('12.345.678-X');
    expect(formatarRg('1234567')).toBe('1234567');
    expect(rgValido('12.345.678-X')).toBeTrue();
    expect(rgValido('1234')).toBeFalse();
    expect(rgValido('12X45678')).toBeFalse();
  });

  it('CEP, UF e e-mail', () => {
    expect(formatarCep('85800000')).toBe('85800-000');
    expect(cepValido('85800-000')).toBeTrue();
    expect(cepValido('8580')).toBeFalse();
    expect(ufValida('pr')).toBeTrue();
    expect(ufValida('XX')).toBeFalse();
    expect(emailValido('ana@paroquia.org.br')).toBeTrue();
    expect(emailValido('ana@paroquia')).toBeFalse();
  });

  it('telefone: fixo, celular e +55', () => {
    expect(formatarTelefone('4')).toBe('(4');
    expect(formatarTelefone('45999')).toBe('(45) 999');
    expect(formatarTelefone('4532221111')).toBe('(45) 3222-1111');
    expect(formatarTelefone('45999998888')).toBe('(45) 99999-8888');
    expect(formatarTelefone('+55 45 99999-8888')).toBe('(45) 99999-8888');
    expect(telefoneValido('(45) 99999-8888')).toBeTrue();
    expect(telefoneValido('(45) 3222-1111')).toBeTrue();
    expect(telefoneValido('(45) 89999-8888')).toBeFalse();
    expect(telefoneValido('99999-8888')).toBeFalse();
  });

  it('sexo antigo vira uma das três opções', () => {
    expect(normalizarSexo('M')).toBe('Masculino');
    expect(normalizarSexo('feminino')).toBe('Feminino');
    expect(normalizarSexo('Outro')).toBe('Outro');
    expect(normalizarSexo('x')).toBe('');
  });
});
