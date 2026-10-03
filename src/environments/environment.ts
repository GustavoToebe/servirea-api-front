/** turnstileSiteKey: chave de site do Cloudflare Turnstile. A secreta fica na API Java (TURNSTILE_SECRET_KEY). */
export const environment = {
  production: false,
  turnstileSiteKey: '0x4AAAAAAFAPZFUVYoHyMoN3',
  apiUrl: 'http://localhost:8080',
  /** Slug do tenant no POST /public/{slug}/inscricoes. Seed local: `placeholder` (V020). */
  publicTenantSlug: 'placeholder'
};