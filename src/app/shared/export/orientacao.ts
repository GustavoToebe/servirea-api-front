/** Orientação de todo arquivo gerado pelo sistema (PDF e imagem). */
export type Orientacao = 'PAISAGEM' | 'RETRATO';

export const ORIENTACOES: { valor: Orientacao; rotulo: string }[] = [
  { valor: 'PAISAGEM', rotulo: 'Paisagem' },
  { valor: 'RETRATO', rotulo: 'Retrato' }
];

const PREFIXO = 'sv_orientacao_';

/** A escolha da pessoa, por tipo de documento. Sem armazenamento (janela privada), vale o padrão. */
export function lerOrientacao(chave: string, padrao: Orientacao): Orientacao {
  try {
    const valor = localStorage.getItem(PREFIXO + chave);
    return valor === 'PAISAGEM' || valor === 'RETRATO' ? valor : padrao;
  } catch {
    return padrao;
  }
}

export function salvarOrientacao(chave: string, valor: Orientacao): void {
  try {
    localStorage.setItem(PREFIXO + chave, valor);
  } catch {
    // Só uma conveniência: sem armazenamento, a escolha vale até fechar a tela.
  }
}
