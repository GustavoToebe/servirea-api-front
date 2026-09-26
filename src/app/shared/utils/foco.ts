/**
 * Leva a tela até o primeiro campo inválido e põe o cursor nele (teste de
 * telas de 26/09/2026: a mensagem ficava lá embaixo e o operador não sabia
 * qual campo faltava). Chame depois de `markAllAsTouched()`: espera um ciclo
 * para o Angular aplicar as classes `ng-invalid ng-touched`.
 *
 * Também aceita um elemento marcado à mão com `data-invalido` (ex.: grupo de
 * checkboxes que não é um form control).
 */
export function focarPrimeiroInvalido(raiz: HTMLElement): void {
  setTimeout(() => {
    const alvo = raiz.querySelector<HTMLElement>(
      '[data-invalido], input.ng-invalid.ng-touched, select.ng-invalid.ng-touched, textarea.ng-invalid.ng-touched');
    if (!alvo) return;
    alvo.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const foco = alvo.matches('input, select, textarea') ? alvo : alvo.querySelector<HTMLElement>('input, select, textarea');
    foco?.focus({ preventScroll: true });
  });
}
