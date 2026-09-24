import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    component.open = true;
    fixture.detectChanges();
  });

  it('confirma sem motivo quando não é obrigatório', () => {
    const emit = spyOn(component.confirm, 'emit');
    component.onConfirm();
    expect(emit).toHaveBeenCalledWith('');
  });

  it('exige motivo com pelo menos 5 caracteres', () => {
    const emit = spyOn(component.confirm, 'emit');
    component.requireReason = true;
    component.reason = 'não';
    component.onConfirm();
    expect(emit).not.toHaveBeenCalled();
    expect(component.reasonError).toContain('5 caracteres');

    component.reason = '  idade  ';
    component.onConfirm();
    expect(emit).toHaveBeenCalledWith('idade');
  });

  it('fecha ao clicar no fundo', () => {
    const emit = spyOn(component.cancel, 'emit');
    const backdrop = fixture.nativeElement.querySelector('.fixed');
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(emit).toHaveBeenCalled();
  });
});
