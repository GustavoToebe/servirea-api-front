import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { cepValido, cnpjValido, cpfValido, emailValido, rgValido, telefoneValido, ufValida } from './formatos';

/** Campo vazio passa (use `Validators.required` junto quando for obrigatório). */
function regra(nome: string, valido: (v: string) => boolean): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = String(control.value ?? '').trim();
    return !v || valido(v) ? null : { [nome]: true };
  };
}

export const Validar = {
  cpf: regra('cpf', cpfValido),
  cnpj: regra('cnpj', cnpjValido),
  rg: regra('rg', rgValido),
  cep: regra('cep', cepValido),
  telefone: regra('telefone', telefoneValido),
  email: regra('email', emailValido),
  uf: regra('uf', ufValida)
};

const MENSAGENS: Record<string, string> = {
  cpf: 'CPF inválido.',
  cnpj: 'CNPJ inválido.',
  rg: 'RG inválido (5 a 14 números; X só no fim).',
  cep: 'CEP deve ter 8 números.',
  telefone: 'Telefone inválido. Informe o DDD e o número.',
  email: 'E-mail inválido.',
  uf: 'UF inválida.',
  required: 'Campo obrigatório.'
};

/** Mensagem do primeiro erro do campo, depois que o usuário mexeu nele. */
export function erroDoCampo(control: AbstractControl | null | undefined): string | null {
  if (!control || !control.errors || !(control.touched || control.dirty)) return null;
  const chave = Object.keys(control.errors)[0];
  return MENSAGENS[chave] ?? 'Valor inválido.';
}
