import { pendingChangesGuard } from './pending-changes.guard';

describe('pendingChangesGuard', () => {
  afterEach(() => {
    (window.confirm as jasmine.Spy | undefined)?.and?.stub?.();
  });

  it('libera a saída sem confirmar quando não há alterações', () => {
    const confirmSpy = spyOn(window, 'confirm');
    const ok = pendingChangesGuard(
      { hasPendingChanges: () => false },
      {} as never,
      {} as never,
      {} as never
    );
    expect(ok).toBeTrue();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('pede confirmação quando há alterações pendentes', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    const ok = pendingChangesGuard(
      { hasPendingChanges: () => true },
      {} as never,
      {} as never,
      {} as never
    );
    expect(ok).toBeFalse();
    expect(window.confirm).toHaveBeenCalled();
  });
});
