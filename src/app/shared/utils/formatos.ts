/**
 * Máscaras e validações de documentos e contatos (26/09/2026). São as mesmas
 * regras de `web/Formatos.java` da API, que é quem decide: aqui elas só
 * avisam antes de enviar e deixam o campo no formato em que vai ser gravado.
 * As funções `formatar*` aceitam texto pela metade (máscara enquanto digita).
 */

export const SEXOS = ['Masculino', 'Feminino', 'Outro'] as const;

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export type Mascara = 'cpf' | 'cnpj' | 'rg' | 'cep' | 'telefone';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function somenteDigitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '');
}

/** Encaixa os caracteres nos grupos, parando onde o texto acaba. */
function encaixar(caracteres: string, grupos: [number, string][]): string {
  let saida = '';
  let pos = 0;
  for (const [tamanho, separador] of grupos) {
    if (pos >= caracteres.length) break;
    if (pos > 0) saida += separador;
    saida += caracteres.slice(pos, pos + tamanho);
    pos += tamanho;
  }
  return saida;
}

export function formatarCpf(valor: string | null | undefined): string {
  return encaixar(somenteDigitos(valor).slice(0, 11), [[3, ''], [3, '.'], [3, '.'], [2, '-']]);
}

/** CNPJ numérico ou alfanumérico (Receita Federal, julho de 2026). */
export function formatarCnpj(valor: string | null | undefined): string {
  const c = (valor ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14);
  return encaixar(c, [[2, ''], [3, '.'], [3, '.'], [4, '/'], [2, '-']]);
}

/** RG não tem padrão nacional: só a máscara mais comum, com 9 caracteres. */
export function formatarRg(valor: string | null | undefined): string {
  const r = (valor ?? '').toUpperCase().replace(/[^0-9X]/g, '').slice(0, 14);
  return r.length === 9 ? encaixar(r, [[2, ''], [3, '.'], [3, '.'], [1, '-']]) : r;
}

export function formatarCep(valor: string | null | undefined): string {
  return encaixar(somenteDigitos(valor).slice(0, 8), [[5, ''], [3, '-']]);
}

export function formatarTelefone(valor: string | null | undefined): string {
  let d = somenteDigitos(valor);
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  d = d.slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  const corpo = d.slice(2);
  const meio = d.length === 11 ? 5 : 4;
  return corpo.length <= meio
    ? `(${d.slice(0, 2)}) ${corpo}`
    : `(${d.slice(0, 2)}) ${corpo.slice(0, meio)}-${corpo.slice(meio)}`;
}

export function formatar(mascara: Mascara, valor: string | null | undefined): string {
  switch (mascara) {
    case 'cpf': return formatarCpf(valor);
    case 'cnpj': return formatarCnpj(valor);
    case 'rg': return formatarRg(valor);
    case 'cep': return formatarCep(valor);
    case 'telefone': return formatarTelefone(valor);
  }
}

function todosIguais(s: string): boolean {
  return [...s].every(c => c === s[0]);
}

export function cpfValido(valor: string | null | undefined): boolean {
  const d = somenteDigitos(valor);
  if (d.length !== 11 || todosIguais(d)) return false;
  const dv = (tamanho: number) => {
    let soma = 0;
    for (let i = 0; i < tamanho; i++) soma += Number(d[i]) * (tamanho + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function cnpjValido(valor: string | null | undefined): boolean {
  const c = (valor ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c) || todosIguais(c)) return false;
  const dv = (tamanho: number) => {
    let soma = 0;
    let peso = tamanho - 7;
    for (let i = 0; i < tamanho; i++) {
      soma += (c.charCodeAt(i) - 48) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(12) === Number(c[12]) && dv(13) === Number(c[13]);
}

export function rgValido(valor: string | null | undefined): boolean {
  const r = (valor ?? '').toUpperCase().replace(/[^0-9X]/g, '');
  const x = r.indexOf('X');
  return r.length >= 5 && r.length <= 14 && (x < 0 || x === r.length - 1);
}

export function cepValido(valor: string | null | undefined): boolean {
  return somenteDigitos(valor).length === 8;
}

/** Fixo com DDD (10 dígitos) ou celular (11, começando por 9). */
export function telefoneValido(valor: string | null | undefined): boolean {
  let d = somenteDigitos(valor);
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  if (d.length < 10 || d[0] === '0' || d[1] === '0') return false;
  return d.length === 10 ? d[2] >= '2' && d[2] <= '8' : d.length === 11 && d[2] === '9';
}

export function emailValido(valor: string | null | undefined): boolean {
  return EMAIL.test((valor ?? '').trim());
}

export function ufValida(valor: string | null | undefined): boolean {
  return UFS.includes((valor ?? '').trim().toUpperCase());
}

/** Valor antigo (M, f, "masculino") vira uma das três opções; o que não bate fica vazio. */
export function normalizarSexo(valor: string | null | undefined): string {
  const v = (valor ?? '').trim().toLowerCase();
  if (v === 'm' || v === 'masculino') return 'Masculino';
  if (v === 'f' || v === 'feminino') return 'Feminino';
  if (v === 'o' || v === 'outro') return 'Outro';
  return '';
}
