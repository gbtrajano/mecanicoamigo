import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    const { data, error } = await supabaseAdmin
      .from('user_presence')
      .select('*')
      .order('last_seen', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = (data || []).map((u: any) => ({
      id: u.user_id,
      email: u.email,
      online: u.online,
      ultimoAcesso: u.last_seen,
      subscriptionStatus: u.subscription_status,
      subscriptionStart: u.subscription_start,
      subscriptionEnd: u.subscription_end
    }))

    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
