import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface UserPresence {
  user_id: string
  email: string
  online: boolean
  last_seen: string
  subscription_status: string
  subscription_start: string | null
  subscription_end: string | null
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  const supabaseAdmin = getAdminClient()

  try {
    const { data, error } = await supabaseAdmin
      .from('user_presence')
      .select('*')
      .order('last_seen', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = (data || []).map((u: UserPresence) => ({
      id: u.user_id,
      email: u.email,
      online: u.online,
      ultimoAcesso: u.last_seen,
      subscriptionStatus: u.subscription_status,
      subscriptionStart: u.subscription_start,
      subscriptionEnd: u.subscription_end
    }))

    return NextResponse.json({ users })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabaseAdmin = getAdminClient()

  try {
    const body = await request.json() as { userId: string; subscriptionStatus: string }
    const { userId, subscriptionStatus } = body

    if (!userId || !subscriptionStatus) {
      return NextResponse.json({ error: 'userId e subscriptionStatus são obrigatórios' }, { status: 400 })
    }

    const allowed = ['active', 'pending', 'cancelled', 'refunded']
    if (!allowed.includes(subscriptionStatus)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('user_presence')
      .update({ subscription_status: subscriptionStatus })
      .eq('user_id', userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
