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
  activation_key?: string | null
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

    const users = (data || []).map((u: UserPresence) => {
      // Consider user online if last_seen is within the last 2 minutes AND online flag is true
      const lastSeen = new Date(u.last_seen);
      const now = new Date();
      const minutesDiff = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      const isOnline = u.online && minutesDiff < 2;
      
      return ({
        id: u.user_id,
        email: u.email,
        online: isOnline,
        ultimoAcesso: u.last_seen,
        subscriptionStatus: u.subscription_status,
        subscriptionStart: u.subscription_start,
        subscriptionEnd: u.subscription_end,
        activationKey: u.activation_key
      })
    })

    return NextResponse.json({ users })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabaseAdmin = getAdminClient()

  try {
    const body = await request.json()
    const { userId, subscriptionStatus, password } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    // If password is provided, update the user's password via auth admin
    if (password !== undefined && password !== null) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
      }

      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Senha atualizada' })
    }

    // Otherwise, update subscription status
    if (subscriptionStatus === undefined) {
      return NextResponse.json({ error: 'subscriptionStatus ou password é obrigatório' }, { status: 400 })
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