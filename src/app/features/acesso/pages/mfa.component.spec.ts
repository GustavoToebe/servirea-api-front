import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {provideHttpClientTesting,HttpTestingController} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {MfaComponent} from './mfa.component';
import {environment} from '../../../../environments/environment';
describe('Proteção MFA do perfil',()=>{
 let http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({imports:[MfaComponent],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('guarda preparação apenas no componente e limpa a senha',async()=>{
  const fixture=TestBed.createComponent(MfaComponent),c=fixture.componentInstance;
  c.senha='senha-atual';const promessa=c.acao('preparar');
  http.expectOne(`${environment.apiUrl}/me/mfa/preparar`).flush({segredo:'CHAVELOCAL'});
  await promessa;expect(c.segredo).toBe('CHAVELOCAL');expect(c.senha).toBe('');
  fixture.destroy();expect(c.segredo).toBe('');
 });
 it('exibe recuperação uma vez e elimina o material de configuração',async()=>{
  const c=TestBed.createComponent(MfaComponent).componentInstance;
  c.senha='senha-atual';c.codigo='123456';c.segredo='CHAVELOCAL';
  const promessa=c.acao('ativar');http.expectOne(`${environment.apiUrl}/me/mfa/ativar`).flush({codigos:['codigo-unico']});
  await promessa;expect(c.recuperacao).toEqual(['codigo-unico']);expect(c.segredo).toBe('');expect(c.codigo).toBe('');
  c.ngOnDestroy();expect(c.recuperacao).toEqual([]);
 });
 it('não retém dados sensíveis quando uma preparação chega após destruir',async()=>{
  const c=TestBed.createComponent(MfaComponent).componentInstance;
  c.senha='senha-atual';const promessa=c.acao('preparar');const req=http.expectOne(`${environment.apiUrl}/me/mfa/preparar`);
  c.ngOnDestroy();req.flush({segredo:'CHAVELOCAL'});await promessa;expect(c.segredo).toBe('');
 });
});
