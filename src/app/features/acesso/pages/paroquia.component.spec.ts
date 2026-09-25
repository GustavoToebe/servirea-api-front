import { montarRequisicao } from './paroquia.component';

describe('montarRequisicao (tela Paróquia)', () => {
  const base = { nome: ' São José ', razaoSocial: '', cnpj: ' 12.345.678/0001-90 ', diocese: '  ', emails: [], telefones: [] };

  it('apara os campos e manda nulo no que está vazio, inclusive a diocese', () => {
    const corpo = montarRequisicao(base);
    expect(corpo.nome).toBe('São José');
    expect(corpo.razaoSocial).toBeNull();
    expect(corpo.cnpj).toBe('12.345.678/0001-90');
    expect(corpo.diocese).toBeNull();
  });

  it('descarta contato vazio e marca o primeiro como principal quando nenhum foi marcado', () => {
    const corpo = montarRequisicao({
      ...base,
      diocese: 'Diocese de Cascavel',
      emails: [
        { tipo: 'Secretaria', email: '  ', principal: true },
        { tipo: 'Padre', email: 'padre@paroquia.org', principal: false },
        { tipo: '', email: 'secretaria@paroquia.org', principal: false }
      ],
      telefones: [{ tipo: 'Fixo', numero: '4533330000', principal: true }]
    });
    expect(corpo.diocese).toBe('Diocese de Cascavel');
    expect(corpo.emails.map(e => e.email)).toEqual(['padre@paroquia.org', 'secretaria@paroquia.org']);
    expect(corpo.emails.filter(e => e.principal).length).toBe(1);
    expect(corpo.emails[0].principal).toBeTrue();
    expect(corpo.emails[1].tipo).toBe('E-mail');
    expect(corpo.telefones).toEqual([{ tipo: 'Fixo', numero: '4533330000', principal: true }]);
  });
});
