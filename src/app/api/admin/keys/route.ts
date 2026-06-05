import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getRequestingUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Gera uma chave no formato MECA-XXXX-XXXX-XXXX */
function generateKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sem I, O, 0, 1 para evitar confusão
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `MECA-${segment(4)}-${segment(4)}-${segment(4)}`
}

// GET /api/admin/keys — lista todas as chaves
export async function GET() {
  const user = await getRequestingUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const supabaseAdmin = getAdminClient()

  try {
    const { data, error } = await supabaseAdmin
      .from('activation_keys')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Busca os emails dos usuários que usaram as chaves
    const usedByIds = (data || [])
      .filter(k => k.used_by)
      .map(k => k.used_by as string)

    const emailMap: Record<string, string> = {}
    if (usedByIds.length > 0) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      users.forEach(u => {
        if (usedByIds.includes(u.id)) emailMap[u.id] = u.email ?? ''
      })
    }

    const keys = (data || []).map(k => ({
      ...k,
      used_by_email: k.used_by ? (emailMap[k.used_by] ?? null) : null,
    }))

    return NextResponse.json({ keys })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/admin/keys — gera nova(s) chave(s)
export async function POST(request: Request) {
  const user = await getRequestingUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const supabaseAdmin = getAdminClient()

  try {
    const body = await request.json() as { quantity?: number; note?: string }
    const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 50) // entre 1 e 50

    // Validade de 7 dias
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const keysToInsert = Array.from({ length: quantity }, () => ({
      key: generateKey(),
      status: 'available',
      expires_at: expiresAt.toISOString(),
      note: body.note ?? null,
    }))

    const { data, error } = await supabaseAdmin
      .from('activation_keys')
      .insert(keysToInsert)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ keys: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/admin/keys — revoga uma chave
export async function DELETE(request: Request) {
  const user = await getRequestingUser()
  if (!user || user.app_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const supabaseAdmin = getAdminClient()

  try {
    const body = await request.json() as { keyId: string }
    if (!body.keyId) {
      return NextResponse.json({ error: 'keyId é obrigatório' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('activation_keys')
      .update({ status: 'revoked' })
      .eq('id', body.keyId)
      .eq('status', 'available') // só revoga chaves disponíveis

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
