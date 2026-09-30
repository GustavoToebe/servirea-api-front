import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AccessTokenResponse } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemApi } from '../../../core/api/api-error';

@Component({
  selector: 'app-suporte',
  template: `
    <div class="flex min-h-screen items-center justify-center bg-app p-6">
      <div class="card max-w-md p-6 text-center">
        <h1 class="text-xl font-black">Acesso de suporte</h1>
        <p class="mt-2 text-sm text-slate-500">{{ mensagem }}</p>
      </div>
    </div>
  `
})
export class SuporteComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  mensagem = 'Validando o código…';

  ngOnInit(): void {
    const codigo = this.route.snapshot.queryParamMap.get('codigo');
    if (!codigo) {
      this.mensagem = 'Falta o código de suporte.';
      return;
    }
    this.http.post<AccessTokenResponse>(`${environment.apiUrl}/auth/suporte/trocar`, { codigo }).subscribe({
      next: async resposta => {
        this.auth.entrar(resposta.accessToken, resposta.tenantAtual);
        await this.router.navigate(['/dashboard']);
      },
      error: erro => this.mensagem = mensagemApi(erro, 'Código inválido ou expirado.')
    });
  }
}
