import type { DistribuicaoDtos_Aplicada, DistribuicaoDtos_Previa } from '../../../../core/api/contrato-api.gerado';
import type { CorpoApi, EnviavelComo, Exigir, RespostaApi, SemCamposInventados } from '../../../../core/api/contrato-api';
import type {
  ConflitoDistribuicao, EscolhaDistribuicao, PreviaDistribuicao, RegrasDistribuicao, SugestaoDistribuicao,
} from './distribuicao-api.service';

type Previa = RespostaApi<'POST /escalas/{id}/distribuicao/previa'>;
type Aplicada = RespostaApi<'POST /escalas/{id}/distribuicao/aplicacao'>;
type CorpoPrevia = CorpoApi<'POST /escalas/{id}/distribuicao/previa'>;
type CorpoAplicacao = CorpoApi<'POST /escalas/{id}/distribuicao/aplicacao'>;

// Cada linha abaixo deixa de compilar se o back renomear ou remover um campo que o front usa (T17).
export type VerificacoesDeContrato = [
  Exigir<SemCamposInventados<PreviaDistribuicao, Previa>>,
  Exigir<SemCamposInventados<SugestaoDistribuicao, NonNullable<DistribuicaoDtos_Previa['sugestoes']>[number]>>,
  Exigir<SemCamposInventados<ConflitoDistribuicao, NonNullable<DistribuicaoDtos_Previa['conflitos']>[number]>>,
  Exigir<SemCamposInventados<{ escalaId: string; versao: number; aplicadas: number }, Aplicada>>,
  Exigir<EnviavelComo<{ regras: RegrasDistribuicao }, CorpoPrevia>>,
  Exigir<EnviavelComo<{ versao: number; regras: RegrasDistribuicao; escolhas: EscolhaDistribuicao[] }, CorpoAplicacao>>,
];

describe('contrato da distribuição', () => {
  it('os tipos do front acompanham os DTOs gerados do back', () => {
    const aplicada: DistribuicaoDtos_Aplicada = { aplicadas: 1, versao: 2, escalaId: 'e1' };
    expect(aplicada.aplicadas).toBe(1);
  });
});
