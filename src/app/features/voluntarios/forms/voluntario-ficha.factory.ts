import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Inscricao, InscricaoDados, InscricaoResponsavel, InscricaoResponsavelPayload } from '../models/inscricao.model';
import { FuncaoEscala, Responsavel, TipoVoluntario, Voluntario } from '../models/voluntario.model';
import { emptyToNull } from '../utils/voluntario.utils';

export interface VoluntarioFichaValue {
  nome_completo: string;
  data_nascimento: string;
  tipo: TipoVoluntario;
  ativo: boolean;
  etapa_catequese: string;
  eucaristia_ano: string;
  crisma_ano: string;
  horario_estudo: string;
  rua: string;
  numero: string;
  bairro: string;
  telefone: string;
  celular: string;
  email: string;
  observacoes: string;
  autoriza_whatsapp: boolean;
  funcoes_habilitadas: FuncaoEscala[];
  responsaveis: Responsavel[];
}

export function nomeCompletoValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value || '').trim().replace(/\s+/g, ' ');
  if (!value) return { required: true };
  if (value.length < 3) return { minlength: { requiredLength: 3, actualLength: value.length } };
  if (value.split(' ').filter(Boolean).length < 2) return { nomeCompleto: true };
  return null;
}

export function responsaveisValidator(control: AbstractControl): ValidationErrors | null {
  const arr = control as FormArray;
  if (!arr.length) return { responsavelObrigatorio: true };
  const principals = arr.controls.filter(group => !!group.get('principal')?.value).length;
  if (principals !== 1) return { principalUnico: true };
  return null;
}

export function createResponsavelGroup(fb: FormBuilder, data?: Partial<Responsavel>, principal = false): FormGroup {
  return fb.group({
    parentesco: [data?.parentesco || '', Validators.required],
    nome: [data?.nome || '', Validators.required],
    telefone: [data?.telefone || ''],
    celular: [data?.celular || ''],
    email: [data?.email || '', Validators.email],
    principal: [data?.principal ?? principal]
  });
}

export function createVoluntarioFichaForm(fb: FormBuilder, options?: { withInitialResponsavel?: boolean }): FormGroup {
  const form = fb.group({
    nome_completo: ['', [Validators.required, nomeCompletoValidator]],
    data_nascimento: [''],
    tipo: ['COROINHA' as TipoVoluntario, Validators.required],
    ativo: [true],
    etapa_catequese: [''],
    eucaristia_ano: [''],
    crisma_ano: [''],
    horario_estudo: [''],
    rua: [''],
    numero: [''],
    bairro: [''],
    telefone: [''],
    celular: [''],
    email: ['', Validators.email],
    observacoes: [''],
    autoriza_whatsapp: [false],
    funcoes_habilitadas: fb.control<FuncaoEscala[]>([]),
    responsaveis: fb.array<FormGroup>([], responsaveisValidator)
  });

  if (options?.withInitialResponsavel !== false) {
    (form.get('responsaveis') as FormArray).push(createResponsavelGroup(fb, undefined, true));
  }

  return form;
}

export function patchVoluntarioFichaForm(
  fb: FormBuilder,
  form: FormGroup,
  data: Partial<Voluntario> | Partial<Inscricao>
): void {
  form.patchValue({
    nome_completo: data.nome_completo || '',
    data_nascimento: data.data_nascimento || '',
    tipo: data.tipo || 'COROINHA',
    ativo: 'ativo' in data ? (data as Voluntario).ativo : true,
    etapa_catequese: data.etapa_catequese || '',
    eucaristia_ano: data.eucaristia_ano || '',
    crisma_ano: data.crisma_ano || '',
    horario_estudo: data.horario_estudo || '',
    rua: data.rua || '',
    numero: data.numero || '',
    bairro: data.bairro || '',
    telefone: data.telefone || '',
    celular: data.celular || '',
    email: data.email || '',
    observacoes: data.observacoes || '',
    autoriza_whatsapp: !!data.autoriza_whatsapp,
    funcoes_habilitadas: data.funcoes_habilitadas || []
  });

  const arr = form.get('responsaveis') as FormArray;
  arr.clear();
  const responsaveis = ('responsaveis' in data ? data.responsaveis : undefined) || [];
  for (const responsavel of responsaveis) {
    arr.push(createResponsavelGroup(fb, responsavel, !!responsavel.principal));
  }
  if (!arr.length) arr.push(createResponsavelGroup(fb, undefined, true));
}

export function fichaValue(form: FormGroup): VoluntarioFichaValue {
  return form.getRawValue() as VoluntarioFichaValue;
}

export function toInscricaoDados(value: VoluntarioFichaValue): InscricaoDados {
  return {
    nome_completo: value.nome_completo.trim().replace(/\s+/g, ' '),
    data_nascimento: emptyToNull(value.data_nascimento),
    tipo: value.tipo,
    etapa_catequese: emptyToNull(value.etapa_catequese),
    eucaristia_ano: emptyToNull(value.eucaristia_ano),
    crisma_ano: emptyToNull(value.crisma_ano),
    rua: emptyToNull(value.rua),
    numero: emptyToNull(value.numero),
    bairro: emptyToNull(value.bairro),
    telefone: emptyToNull(value.telefone),
    celular: emptyToNull(value.celular),
    email: emptyToNull(value.email),
    horario_estudo: emptyToNull(value.horario_estudo),
    observacoes: emptyToNull(value.observacoes),
    autoriza_whatsapp: !!value.autoriza_whatsapp,
    funcoes_habilitadas: value.funcoes_habilitadas || []
  };
}

export function toResponsaveisPayload(value: VoluntarioFichaValue): InscricaoResponsavelPayload[] {
  return (value.responsaveis || []).map(responsavel => ({
    parentesco: (responsavel.parentesco || '').trim(),
    nome: (responsavel.nome || '').trim(),
    telefone: emptyToNull(responsavel.telefone),
    celular: emptyToNull(responsavel.celular),
    email: emptyToNull(responsavel.email),
    principal: !!responsavel.principal
  }));
}

export function toVoluntarioPayload(value: VoluntarioFichaValue): Partial<Voluntario> {
  return {
    ...toInscricaoDados(value),
    ativo: !!value.ativo
  };
}

export function principalDe(responsaveis: InscricaoResponsavel[] | Responsavel[] | undefined): InscricaoResponsavel | Responsavel | null {
  if (!responsaveis?.length) return null;
  return responsaveis.find(item => item.principal) || responsaveis[0];
}
