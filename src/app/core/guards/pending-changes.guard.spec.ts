import { TestBed } from '@angular/core/testing';
import { DialogoService } from '../../shared/services/dialogo.service';
import { pendingChangesGuard } from './pending-changes.guard';

describe('pendingChangesGuard', () => {
  function executar(pendente: boolean) {
    return TestBed.runInInjectionContext(() => pendingChangesGuard(
      { hasPendingChanges: () => pendente },
      {} as never,
      {} as never,
      {} as never
    ));
  }

  it('libera a saída sem perguntar quando não há alterações', () => {
    const confirmar = spyOn(TestBed.inject(DialogoService), 'confirmar');
    expect(executar(false)).toBeTrue();
    expect(confirmar).not.toHaveBeenCalled();
  });

  it('pergunta no diálogo do Servirea, não no confirm do navegador', async () => {
    const nativo = spyOn(window, 'confirm');
    const dialogo = TestBed.inject(DialogoService);
    const resposta = executar(true) as Promise<boolean>;
    expect(dialogo.aberto()?.confirmar).toBe('Sair sem salvar');
    expect(dialogo.aberto()?.cancelar).toBe('Continuar editando');
    dialogo.responder(false);
    expect(await resposta).toBeFalse();
    expect(nativo).not.toHaveBeenCalled();
  });

  it('sai quando o usuário confirma', async () => {
    const dialogo = TestBed.inject(DialogoService);
    const resposta = executar(true) as Promise<boolean>;
    dialogo.responder(true);
    expect(await resposta).toBeTrue();
  });
});
