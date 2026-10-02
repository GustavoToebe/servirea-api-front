import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OnboardingApiService } from './onboarding-api.service';
import { environment } from '../../../environments/environment';
describe('OnboardingApiService',()=>{
 let api:OnboardingApiService;let http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});api=TestBed.inject(OnboardingApiService);http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('consulta o estado da sessão sem tenant informado pelo cliente',()=>{api.consultar().subscribe();const r=http.expectOne(environment.apiUrl+'/onboarding');expect(r.request.method).toBe('GET');expect(r.request.params.keys()).toEqual([]);r.flush({});});
 it('envia ação e versão sem identificador de paróquia',()=>{api.alterar('CONVITE','PULAR',7).subscribe();const r=http.expectOne(environment.apiUrl+'/onboarding/etapas/CONVITE');expect(r.request.method).toBe('PUT');expect(r.request.body).toEqual({acao:'PULAR',versao:7});r.flush({});});
});
