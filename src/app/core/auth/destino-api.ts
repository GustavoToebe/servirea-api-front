/** Compara origem e fronteira do caminho antes de anexar credenciais. */
export function caminhoDaApi(destino: string, api: string): string | null {
  try {
    const raiz = new URL(api, window.location.origin);
    const url = new URL(destino, window.location.origin);
    const prefixo = raiz.pathname.replace(/\/+$/, '');
    if (url.origin !== raiz.origin || url.username || url.password) return null;
    if (prefixo && url.pathname !== prefixo && !url.pathname.startsWith(`${prefixo}/`)) return null;
    return url.pathname.slice(prefixo.length) || '/';
  } catch {
    return null;
  }
}
