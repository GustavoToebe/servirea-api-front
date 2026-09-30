/**
 * Cores das folhas de PDF e imagem: seguem a cor principal que a pessoa escolheu em Ajustes, como os cabeçalhos das
 * tabelas (`--brand-navy` no topo, `--brand` nas colunas). O html2canvas não entende `color-mix`, então os tons
 * claros saem calculados aqui, em hexadecimal.
 */
export interface CoresFolha {
  /** Faixa do topo (a mesma dos cabeçalhos de tabela do sistema). */
  navy: string;
  /** Cor principal. */
  brand: string;
  /** Meio do degradê do cabeçalho: entre a faixa escura e a cor principal. */
  meio: string;
  /** Divisória fina sobre a cor principal. */
  linha: string;
  /** A cor principal clareada: 0 = ela mesma, 1 = branco. */
  tom(clareza: number): string;
}

const ROXO = { brand: '#673DE6', navy: '#2F1C6A' };
const HEX = /^#[0-9a-f]{6}$/i;

function canais(hex: string): [number, number, number] {
  return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}

/** `quantoDeB` de 0 a 1: 0 devolve `a`, 1 devolve `b`. */
export function misturar(a: string, b: string, quantoDeB: number): string {
  const [ra, rb] = [canais(a), canais(b)];
  return '#' + ra.map((v, i) => Math.round(v + (rb[i] - v) * quantoDeB).toString(16).padStart(2, '0')).join('');
}

export function coresDaFolha(): CoresFolha {
  const lido = (nome: string, padrao: string) => {
    const valor = document.documentElement.style.getPropertyValue(nome).trim();
    return HEX.test(valor) ? valor : padrao;
  };
  const brand = lido('--brand', ROXO.brand);
  const navy = lido('--brand-navy', ROXO.navy);
  return {
    navy,
    brand,
    meio: misturar(navy, brand, 0.35),
    linha: misturar(brand, '#ffffff', 0.3),
    tom: clareza => misturar(brand, '#ffffff', clareza)
  };
}
