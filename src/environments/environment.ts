/** turnstileSiteKey: chave de site do Cloudflare Turnstile. A chave secreta fica apenas na Edge Function (TURNSTILE_SECRET_KEY). */
export const environment = {
  production: false,
  supabaseUrl: 'https://qcybebkhwhrudbwoweip.supabase.co',
  supabaseAnonKey: 'sb_publishable_AHHQ4S_VM0hDJ5lFJgcrgQ_q-dwLgW0',
  turnstileSiteKey: '0x4AAAAAAE5LAuNTiGgIUjVG',
  apiUrl: 'http://localhost:8080',
};