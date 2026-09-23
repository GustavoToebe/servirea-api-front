import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (automáticos),
// TURNSTILE_SECRET_KEY, ALLOWED_ORIGINS (domínio da aplicação, CSV).
// Nunca retornar SUPABASE_SERVICE_ROLE_KEY.

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']);
const TIPOS = new Set(['COROINHA', 'ACOLITO', 'AMBOS']);
const HORARIOS = new Set(['MANHA', 'TARDE', 'NOITE']);
const FUNCOES = new Set(['MISSAL', 'CRUZ', 'CREDENCIA', 'VELA', 'COLETA', 'SINO', 'OUTRO']);
const FORBIDDEN_DADOS = new Set([
  'status', 'ativo', 'voluntario_id', 'aprovado_por', 'rejeitado_por',
  'motivo_rejeicao', 'data_rejeicao', 'data_aprovacao', 'created_at', 'updated_at'
]);

type JsonRecord = Record<string, unknown>;

interface ResponsavelInput {
  parentesco: string;
  nome: string;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  principal: boolean;
}

interface PublicError {
  message: string;
}

Deno.serve(async (req: Request) => {
  const cors = corsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return json({ ok: false, message: 'Método não permitido.' }, 405, cors);
  }

  let uploadedPath: string | null = null;
  let supabase: ReturnType<typeof createServiceClient> | null = null;

  try {
    supabase = createServiceClient();
    const payload = await parseBody(req);
    const token = sanitizeString(payload.turnstileToken, 2048);
    const validCaptcha = await verifyTurnstile(token, req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'));
    if (!validCaptcha) {
      return json({ ok: false, message: 'Falha na verificação de segurança. Atualize a página e tente novamente.' }, 400, cors);
    }

    const dados = validateDados(payload.dados);
    const responsaveis = validateResponsaveis(payload.responsaveis);

    const inscricaoId = crypto.randomUUID();
    dados.id = inscricaoId;

    if (payload.foto) {
      const foto = payload.foto;
      validateFoto(foto.mime, foto.bytes.byteLength);
      const ext = extensionFromMime(foto.mime);
      uploadedPath = `inscricoes/${inscricaoId}/foto.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('voluntarios-fotos')
        .upload(uploadedPath, foto.bytes, { contentType: foto.mime, upsert: true });
      if (uploadError) {
        console.error('upload_error', uploadError.message);
        throw publicError('Não foi possível enviar a foto. Verifique o arquivo e tente novamente.');
      }
      dados.foto_path = uploadedPath;
    }

    const { data, error } = await supabase.rpc('criar_inscricao_publica', {
      p_dados: dados,
      p_responsaveis: responsaveis
    });

    if (error) {
      console.error('rpc_error', error.message);
      if (uploadedPath) {
        await supabase.storage.from('voluntarios-fotos').remove([uploadedPath]);
      }
      throw publicError('Não foi possível enviar a inscrição. Tente novamente.');
    }

    const returnedId = extractId(data) || inscricaoId;
    return json({
      ok: true,
      id: returnedId,
      message: 'Inscrição enviada com sucesso'
    }, 200, cors);
  } catch (err) {
    if (uploadedPath && supabase) {
      try {
        await supabase.storage.from('voluntarios-fotos').remove([uploadedPath]);
      } catch (cleanupError) {
        console.error('cleanup_error', cleanupError);
      }
    }
    const message = err instanceof Error && (err as PublicError).message
      ? (err as PublicError).message
      : 'Não foi possível enviar a inscrição. Tente novamente.';
    const safe = isPublicMessage(message) ? message : 'Não foi possível enviar a inscrição. Tente novamente.';
    return json({ ok: false, message: safe }, 400, cors);
  }
});

function createServiceClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) {
    throw publicError('Serviço indisponível no momento.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = allowedOrigins();
  const requestOrigin = origin || '';
  const resolved = allowed.includes('*')
    ? '*'
    : (allowed.includes(requestOrigin) ? requestOrigin : allowed[0] || 'http://localhost:4200');
  return {
    'Access-Control-Allow-Origin': resolved,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function allowedOrigins(): string[] {
  const extra = (Deno.env.get('ALLOWED_ORIGINS') || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  return [...new Set([
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://sistema.mariatoebesemijoias.com.br',
    'https://app.mariatoebesemijoias.com.br',
    ...extra
  ])];
}

async function parseBody(req: Request): Promise<{
  dados: unknown;
  responsaveis: unknown;
  turnstileToken: string;
  foto: { bytes: Uint8Array; mime: string; name: string } | null;
}> {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const foto = form.get('foto');
    return {
      dados: parseJsonField(form.get('dados')),
      responsaveis: parseJsonField(form.get('responsaveis')),
      turnstileToken: String(form.get('turnstileToken') || ''),
      foto: foto instanceof File ? await fileToFoto(foto) : null
    };
  }

  const body = await req.json() as JsonRecord;
  let foto: { bytes: Uint8Array; mime: string; name: string } | null = null;
  const rawFoto = body['foto'];
  if (rawFoto && typeof rawFoto === 'object') {
    const fotoObj = rawFoto as JsonRecord;
    const base64 = String(fotoObj['base64'] || '');
    const mime = sanitizeString(String(fotoObj['mime'] || ''), 80).toLowerCase();
    if (base64) {
      const binary = Uint8Array.from(atob(base64.includes(',') ? base64.split(',')[1] : base64), c => c.charCodeAt(0));
      foto = { bytes: binary, mime, name: sanitizeString(String(fotoObj['nome'] || 'foto'), 80) };
    }
  }

  return {
    dados: body['dados'],
    responsaveis: body['responsaveis'],
    turnstileToken: String(body['turnstileToken'] || ''),
    foto
  };
}

function parseJsonField(value: FormDataEntryValue | null): unknown {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    return JSON.parse(value);
  } catch {
    throw publicError('Dados da inscrição inválidos.');
  }
}

async function fileToFoto(file: File) {
  const buffer = new Uint8Array(await file.arrayBuffer());
  return {
    bytes: buffer,
    mime: (file.type || '').toLowerCase(),
    name: file.name || 'foto'
  };
}

function validateDados(input: unknown): JsonRecord {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw publicError('Dados da inscrição inválidos.');
  }
  const raw = input as JsonRecord;
  for (const key of Object.keys(raw)) {
    if (FORBIDDEN_DADOS.has(key)) delete raw[key];
  }

  const nome = sanitizeString(raw['nome_completo'], 180);
  if (!isNomeCompleto(nome)) {
    throw publicError('Informe o nome completo.');
  }

  const tipo = sanitizeString(raw['tipo'], 20).toUpperCase();
  if (!TIPOS.has(tipo)) {
    throw publicError('Tipo de voluntário inválido.');
  }

  const horario = sanitizeString(raw['horario_estudo'], 20).toUpperCase();
  if (horario && !HORARIOS.has(horario)) {
    throw publicError('Horário de estudo inválido.');
  }

  const funcoes = Array.isArray(raw['funcoes_habilitadas']) ? raw['funcoes_habilitadas'] : [];
  const funcoesValidas: string[] = [];
  for (const item of funcoes) {
    const funcao = sanitizeString(item, 20).toUpperCase();
    if (!funcao) continue;
    if (!FUNCOES.has(funcao)) throw publicError('Função habilitada inválida.');
    if (!funcoesValidas.includes(funcao)) funcoesValidas.push(funcao);
  }

  const email = sanitizeString(raw['email'], 180).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw publicError('E-mail inválido.');
  }

  return {
    nome_completo: nome,
    data_nascimento: emptyToNull(sanitizeString(raw['data_nascimento'], 32)),
    tipo,
    etapa_catequese: emptyToNull(sanitizeString(raw['etapa_catequese'], 80)),
    eucaristia_ano: emptyToNull(sanitizeString(raw['eucaristia_ano'], 80)),
    crisma_ano: emptyToNull(sanitizeString(raw['crisma_ano'], 80)),
    rua: emptyToNull(sanitizeString(raw['rua'], 180)),
    numero: emptyToNull(sanitizeString(raw['numero'], 30)),
    bairro: emptyToNull(sanitizeString(raw['bairro'], 120)),
    telefone: emptyToNull(sanitizeString(raw['telefone'], 40)),
    celular: emptyToNull(sanitizeString(raw['celular'], 40)),
    email: emptyToNull(email),
    horario_estudo: emptyToNull(horario),
    observacoes: emptyToNull(sanitizeString(raw['observacoes'], 2000)),
    autoriza_whatsapp: Boolean(raw['autoriza_whatsapp']),
    funcoes_habilitadas: funcoesValidas
  };
}

function validateResponsaveis(input: unknown): ResponsavelInput[] {
  if (!Array.isArray(input) || input.length < 1) {
    throw publicError('Informe pelo menos um responsável.');
  }

  const rows = input.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw publicError(`Responsável ${index + 1} inválido.`);
    }
    const raw = item as JsonRecord;
    const parentesco = sanitizeString(raw['parentesco'], 80);
    const nome = sanitizeString(raw['nome'], 180);
    if (!parentesco || !nome) {
      throw publicError('Cada responsável precisa de parentesco e nome.');
    }
    const email = sanitizeString(raw['email'], 180).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw publicError('E-mail de responsável inválido.');
    }
    return {
      parentesco,
      nome,
      telefone: emptyToNull(sanitizeString(raw['telefone'], 40)),
      celular: emptyToNull(sanitizeString(raw['celular'], 40)),
      email: emptyToNull(email),
      principal: Boolean(raw['principal'])
    };
  });

  const principals = rows.filter(row => row.principal).length;
  if (principals !== 1) {
    throw publicError('Defina exatamente um responsável principal.');
  }
  return rows;
}

function validateFoto(mime: string, size: number) {
  if (!ALLOWED_MIME.has(mime)) {
    throw publicError('Envie uma imagem JPG, PNG, WEBP ou HEIC.');
  }
  if (size <= 0 || size > PHOTO_MAX_BYTES) {
    throw publicError('A foto deve ter no máximo 5 MB.');
  }
}

function extensionFromMime(mime: string): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  return 'jpg';
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY') || '';
  if (!secret) {
    console.warn('turnstile_secret_missing');
    return true;
  }
  if (!token) return false;
  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip.split(',')[0].trim());
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body
  });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

function isNomeCompleto(value: string): boolean {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length >= 3 && normalized.split(' ').filter(Boolean).length >= 2;
}

function sanitizeString(value: unknown, max: number): string {
  if (value == null) return '';
  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}

function emptyToNull(value: string): string | null {
  return value ? value : null;
}

function extractId(data: unknown): string | null {
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object' && 'id' in (data as JsonRecord)) {
    const id = (data as JsonRecord)['id'];
    return typeof id === 'string' ? id : null;
  }
  return null;
}

function json(body: Record<string, unknown>, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

function publicError(message: string): Error {
  const error = new Error(message);
  (error as PublicError).message = message;
  return error;
}

function isPublicMessage(message: string): boolean {
  return [
    'Informe o nome completo.',
    'Tipo de voluntário inválido.',
    'Horário de estudo inválido.',
    'Função habilitada inválida.',
    'E-mail inválido.',
    'Informe pelo menos um responsável.',
    'Defina exatamente um responsável principal.',
    'Cada responsável precisa de parentesco e nome.',
    'E-mail de responsável inválido.',
    'Envie uma imagem JPG, PNG, WEBP ou HEIC.',
    'A foto deve ter no máximo 5 MB.',
    'Não foi possível enviar a foto. Verifique o arquivo e tente novamente.',
    'Não foi possível enviar a inscrição. Tente novamente.',
    'Dados da inscrição inválidos.',
    'Falha na verificação de segurança. Atualize a página e tente novamente.',
    'Serviço indisponível no momento.',
    'Método não permitido.'
  ].includes(message) || message.startsWith('Responsável ');
}
