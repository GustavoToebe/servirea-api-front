import { withSupabase } from 'npm:@supabase/server@^1'

// Função auxiliar para capturar o IP real do cliente
function ips(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(/\s*,\s*/)
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req) => {
    // 1. Recebe o token enviado pelo seu frontend
    const { token } = await req.json()
    const clientIps = ips(req) || ['']
    const ip = clientIps[0]

    // 2. Prepara os dados para perguntar ao Cloudflare se o token é válido
    let formData = new FormData()
    formData.append('secret', Deno.env.get('TURNSTILE_SECRET_KEY') ?? '')
    formData.append('response', token)
    formData.append('remoteip', ip)

    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
    
    // 3. Dispara a validação no servidor da Cloudflare
    const result = await fetch(url, {
      body: formData,
      method: 'POST',
    })

    const outcome = await result.json()
    
    // 4. Retorna a resposta para o frontend
    if (outcome.success) {
      return Response.json({ success: true })
    }
    
    // Retorna erro caso seja um robô ou o token seja inválido
    return Response.json({ success: false }, { status: 400 })
  }),
}