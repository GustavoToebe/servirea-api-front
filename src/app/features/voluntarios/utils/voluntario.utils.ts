import { HORARIO_ESTUDO_LABEL, HorarioEstudo, TIPO_VOLUNTARIO_LABEL, TipoVoluntario } from '../models/voluntario.model';

export function tipoLabel(tipo: TipoVoluntario): string {
  return TIPO_VOLUNTARIO_LABEL[tipo] || tipo;
}

export function studyLabel(horario: string | null | undefined): string {
  if (!horario) return '—';
  return HORARIO_ESTUDO_LABEL[horario as HorarioEstudo] || horario;
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
}

export function ageFromDate(date: string | null | undefined): number | null {
  if (!date) return null;
  const birth = new Date(`${date}T12:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatDateBr(date: string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`));
}

export function formatDateTimeBr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '—';
  const date = new Intl.DateTimeFormat('pt-BR').format(value);
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(value);
  return `${date} às ${time}`;
}

export function emptyToNull(value: string | null | undefined): string | null {
  const text = (value ?? '').trim();
  return text === '' ? null : text;
}
