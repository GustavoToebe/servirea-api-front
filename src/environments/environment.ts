/** turnstileSiteKey: chave de site do Cloudflare Turnstile. A secreta fica na API Java (TURNSTILE_SECRET_KEY). */
export const environment = {
  production: false,
  supabaseUrl: 'https://qcybebkhwhrudbwoweip.supabase.co',
  supabaseAnonKey: 'sb_publishable_AHHQ4S_VM0hDJ5lFJgcrgQ_q-dwLgW0',
  turnstileSiteKey: '0x4AAAAAAE5LAuNTiGgIUjVG',
  apiUrl: 'http://localhost:8080',
  /** Slug do tenant no POST /public/{slug}/inscricoes. Seed local: `placeholder` (V020). */
  publicTenantSlug: 'placeholder'
};