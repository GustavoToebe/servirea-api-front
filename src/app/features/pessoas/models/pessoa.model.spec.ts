import { ageFromDate, contatoPrincipalEmail, contatoPrincipalTelefone, initials, Pessoa } from './pessoa.model';

function pessoa(parcial: Partial<Pessoa> = {}): Pessoa {
  return {
    id: '1',
    papeis: ['VOLUNTARIO'],
    nomeCompleto: 'Maria Silva',
    dataNascimento: '2010-01-01',
    sexo: null,
    cpf: null,
    rg: null,
    emails: [],
    telefones: [],
    responsaveis: [],
    dependentes: [],
    cep: null,
    cidade: null,
    uf: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    observacoes: null,
    voluntario: null,
    ...parcial
  };
}

describe('helpers de pessoa', () => {
  it('iniciais pegam as duas primeiras palavras', () => {
    expect(initials('João Pedro da Silva')).toBe('JP');
    expect(initials('Ana')).toBe('A');
  });

  it('calcula a idade a partir da data de nascimento', () => {
    const hoje = new Date();
    const nascimento = `${hoje.getFullYear() - 15}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
    const idade = ageFromDate(nascimento);
    expect(idade === 14 || idade === 15).toBeTrue();
    expect(ageFromDate(null)).toBeNull();
  });

  it('escolhe o e-mail e o telefone principais', () => {
    const p = pessoa({
      emails: [
        { tipo: 'PESSOAL', email: 'outro@x.com', principal: false },
        { tipo: 'PESSOAL', email: 'mae@x.com', principal: true }
      ],
      telefones: [
        { tipo: 'CELULAR', numero: '11999990000', principal: true },
        { tipo: 'FIXO', numero: '1133334444', principal: false }
      ]
    });
    expect(contatoPrincipalEmail(p)).toBe('mae@x.com');
    expect(contatoPrincipalTelefone(p)).toBe('11999990000');
  });

  it('cai no primeiro contato quando nenhum é principal', () => {
    const p = pessoa({
      emails: [{ tipo: 'PESSOAL', email: 'unico@x.com', principal: false }],
      telefones: [{ tipo: 'CELULAR', numero: '11000000000', principal: false }]
    });
    expect(contatoPrincipalEmail(p)).toBe('unico@x.com');
    expect(contatoPrincipalTelefone(p)).toBe('11000000000');
  });
});
