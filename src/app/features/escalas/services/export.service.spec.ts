import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EscalaDetalhe } from '../models/escala.model';
import { ExportService, nomeCurto } from './export.service';

describe('nomeCurto', () => {
  it('fica com o primeiro nome e o último sobrenome', () => {
    expect(nomeCurto('Valentina Linzmeyer Zonitta Silvati')).toBe('Valentina Silvati');
    expect(nomeCurto('Henrique Neiverth Luciano')).toBe('Henrique Luciano');
    expect(nomeCurto('Laura Almeida')).toBe('Laura Almeida');
    expect(nomeCurto('Iara')).toBe('Iara');
    expect(nomeCurto('')).toBe('');
  });

  it('Neto, Filho e Júnior levam o sobrenome de antes', () => {
    expect(nomeCurto('João dos Santos de Oliveira Neto')).toBe('João Oliveira Neto');
    expect(nomeCurto('Carlos Filho')).toBe('Carlos Filho');
    expect(nomeCurto('Pedro Souza Júnior')).toBe('Pedro Souza Júnior');
  });
});

/**
 * Exportação real no Chrome (html2canvas + jsPDF 4): o componente usa um
 * ExportService falso, então sem este teste uma troca de versão do jsPDF
 * quebraria o PDF sem nenhum teste vermelho.
 */
describe('ExportService', () => {
  let service: ExportService;
  const escala: EscalaDetalhe = {
    id: 'e1', titulo: 'Outubro', tipo: 'MENSAL', ano: 2026, mes: 10, status: 'FINALIZADA', observacao: null,
    eventos: [{
      data: '2026-10-04', horario: '08:00:00', celebracao: 'Missa',
      vagas: [
        { funcao: 'MISSAL', posicao: 1, voluntario_id: 'v1', voluntario: { id: 'v1', nome_completo: 'Ana <Beatriz>' } },
        { funcao: 'CRUZ', posicao: 1, voluntario_id: 'v2', voluntario: { id: 'v2', nome_completo: 'Pedro' } },
        { funcao: 'COLETA', posicao: 1, voluntario_id: null, voluntario: null }
      ]
    }]
  };

  beforeEach(() => {
    sessionStorage.setItem('sv_tenant_nome', 'Paróquia Santa Maria');
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(ExportService);
  });

  afterEach(() => sessionStorage.clear());

  it('gera um PDF de verdade com o nome certo do arquivo', async () => {
    // O jsPDF 4 monta save() em cada documento; intercepta o download no navegador.
    let arquivo: Blob | null = null;
    let nome = '';
    spyOn(URL, 'createObjectURL').and.callFake((b: Blob | MediaSource) => { arquivo = b as Blob; return 'blob:teste'; });
    spyOn(URL, 'revokeObjectURL');
    const baixar = function (this: HTMLAnchorElement) { nome = this.download; return true; };
    spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').and.callFake(baixar);
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(baixar as unknown as () => void);

    await service.exportPdf(escala);
    await new Promise(pronto => setTimeout(pronto, 50)); // o download sai num setTimeout do jsPDF

    expect(nome).toBe('escala-mensal-2026-10.pdf');
    expect(arquivo).not.toBeNull();
    const conteudo = await (arquivo as unknown as Blob).text();
    expect(conteudo.startsWith('%PDF-')).toBeTrue();
    expect(conteudo).toContain('/Image');
  });

  it('gera o PNG e usa o nome da paróquia da sessão no título, com o texto escapado', async () => {
    let href = '';
    let download = '';
    let titulo = '';
    const appendOriginal = document.body.appendChild.bind(document.body);
    spyOn(document.body, 'appendChild').and.callFake(<T extends Node>(no: T): T => {
      // O html2canvas também anexa o iframe da cópia; guarda só a folha da escala.
      const el = no as unknown as HTMLElement;
      if (!titulo && el.tagName === 'DIV') titulo = el.innerHTML;
      return appendOriginal(no);
    });
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      href = this.href;
      download = this.download;
    });

    await service.exportPng(escala);

    expect(download).toBe('escala-mensal-2026-10.png');
    expect(href.startsWith('data:image/png;base64,')).toBeTrue();
    expect(titulo).toContain('PARÓQUIA SANTA MARIA - ESCALA OUTUBRO');
    expect(titulo).not.toContain('SÃO JOSÉ OPERÁRIO');
    expect(titulo).toContain('Ana &lt;Beatriz&gt;');
    expect(titulo).toContain('04/10/2026');
  });

  it('semanal sai no layout da planilha: uma coluna por vaga e linha entre semanas', async () => {
    let folha = '';
    const appendOriginal = document.body.appendChild.bind(document.body);
    spyOn(document.body, 'appendChild').and.callFake(<T extends Node>(no: T): T => {
      const el = no as unknown as HTMLElement;
      if (!folha && el.tagName === 'DIV') folha = el.innerHTML;
      return appendOriginal(no);
    });
    spyOn(HTMLAnchorElement.prototype, 'click');
    const vaga = (funcao: EscalaDetalhe['eventos'][0]['vagas'][0]['funcao'], posicao: number, nome: string | null) =>
      ({ funcao, posicao, voluntario_id: nome, voluntario: nome ? { id: nome, nome_completo: nome } : null });
    const semanal: EscalaDetalhe = {
      ...escala, tipo: 'SEMANAL', mes: 9,
      eventos: [
        { data: '2026-09-01', horario: '19:00:00', celebracao: 'Missa', vagas: [
          vaga('MISSAL', 1, 'Henrique'), vaga('CRUZ', 1, 'Alice'), vaga('CREDENCIA', 1, 'Daniel'),
          vaga('VELA', 1, 'Isabelly'), vaga('VELA', 2, 'Vinicius'), vaga('SINO', 1, 'Giancarlo'), vaga('SINO', 2, null)
        ] },
        { data: '2026-09-07', horario: '19:00:00', celebracao: 'Missa', vagas: [vaga('MISSAL', 1, 'Nicolly')] }
      ]
    };

    await service.exportPng(semanal);

    const texto = (html: string) => html.replace(/<[^>]+>/g, '|').replace(/\s+/g, ' ');
    expect(folha).toContain('ESCALA SEMANAL');
    expect(folha).toContain('SETEMBRO');
    expect(folha).toContain('Coroinhas Cruz / Credencia');
    expect(folha).not.toContain('OFERTÓRIO');
    expect(folha).not.toContain('underline');
    const linhas = folha.split('<tr>').map(texto);
    const primeira = linhas.findIndex(l => l.includes('01/09/2026'));
    expect(linhas[primeira]).toMatch(/01\/09\/2026.*01\/Terça-feira.*19:00hs.*Henrique.*Alice.*Daniel.*Isabelly.*Vinicius.*Giancarlo/);
    const segunda = linhas.findIndex(l => l.includes('07/09/2026'));
    expect(segunda).toBe(primeira + 2);
    expect(linhas[primeira + 1].replace(/[| ]/g, '')).toBe('');
  });

  it('linha de referência não gera bloco no PNG', async () => {
    let folha = '';
    const appendOriginal = document.body.appendChild.bind(document.body);
    spyOn(document.body, 'appendChild').and.callFake(<T extends Node>(no: T): T => {
      const el = no as unknown as HTMLElement;
      if (!folha && el.tagName === 'DIV') folha = el.innerHTML;
      return appendOriginal(no);
    });
    spyOn(HTMLAnchorElement.prototype, 'click');
    const comReferencia: EscalaDetalhe = {
      ...escala,
      eventos: [...escala.eventos, {
        data: '2026-09-29', horario: '19:00:00', celebracao: 'Missa', referencia: true,
        vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: 'v9', voluntario: { id: 'v9', nome_completo: 'Só Referência' } }]
      }]
    };

    await service.exportPng(comReferencia);

    expect(folha).toContain('Ana &lt;Beatriz&gt;');
    expect(folha).not.toContain('Só Referência');
  });
});
