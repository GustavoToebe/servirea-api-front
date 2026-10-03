/**
 * Ajudas de tipo sobre `contrato-api.gerado.ts` (gerado do contrato do back; não edite aquele arquivo).
 * Só existem em tempo de compilação: um tipo escrito à mão que se afastar do DTO do back deixa de compilar nos testes.
 */
export type { ContratoRotas, CorpoApi, RespostaApi, RotaApi } from './contrato-api.gerado';

/** Resolve para `true` se o tipo manual não tiver nenhum campo que o DTO gerado desconheça (renomeado ou removido no back). */
export type SemCamposInventados<Manual, Gerado> =
  Exclude<keyof Manual, keyof Gerado> extends never ? true : { campoInexistenteNoContrato: Exclude<keyof Manual, keyof Gerado> };

/** Resolve para `true` se o corpo montado à mão puder ser enviado no lugar do DTO gerado (direção do pedido). */
export type EnviavelComo<Manual, Gerado> = Manual extends Gerado ? true : { naoCompativelComOContrato: Gerado };

/** Falha na compilação se o argumento não for `true`. Uso: `type _ = Exigir<SemCamposInventados<A, B>>;` */
export type Exigir<_Condicao extends true> = never;
