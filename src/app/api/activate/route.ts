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

// POST /api/activate — valida e aplica a chave de ativação
export async function POST(request: Request) {
  // Obter usuário autenticado a partir dos cookies
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
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const supabaseAdmin = getAdminClient()

  try {
    const body = await request.json() as { key: string }
    const inputKey = (body.key ?? '').trim().toUpperCase()

    if (!inputKey) {
      return NextResponse.json({ error: 'Chave de ativação é obrigatória' }, { status: 400 })
    }

    // Busca a chave no banco
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('activation_keys')
      .select('*')
      .eq('key', inputKey)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: 'Chave de ativação inválida' }, { status: 400 })
    }

    // Valida status
    if (keyData.status === 'used') {
      return NextResponse.json({ error: 'Esta chave já foi utilizada' }, { status: 400 })
    }

    if (keyData.status === 'revoked') {
      return NextResponse.json({ error: 'Esta chave foi revogada' }, { status: 400 })
    }

    // Valida expiração
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Esta chave está expirada' }, { status: 400 })
    }

    // Verifica se este usuário já tem acesso ativo na tabela user_presence (fonte da verdade)
    const { data: presenceData, error: presenceError } = await supabaseAdmin
      .from('user_presence')
      .select('subscription_status')
      .eq('user_id', user.id)
      .single()

    if (presenceError && presenceError.code !== 'PGRST116') {
      // Erro real (não é "não encontrado")
      console.error('[Activate] Erro ao buscar user_presence:', presenceError)
      return NextResponse.json({ error: 'Erro ao verificar conta. Tente novamente.' }, { status: 500 })
    }

    if (presenceData && presenceData.subscription_status === 'active') {
      return NextResponse.json({ error: 'Sua conta já está ativa' }, { status: 400 })
    }

    // Tudo OK — aplica a chave em uma transação lógica
    // 1. Marca a chave como usada (retorna a linha para verificar se realmente atualizou)
    const { data: updatedKey, error: updateKeyError } = await supabaseAdmin
      .from('activation_keys')
      .update({
        status: 'used',
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', keyData.id)
      .eq('status', 'available') // garante que não foi usada em paralelo (race condition)
      .select()
      .single()

    if (updateKeyError || !updatedKey) {
      // Nenhuma linha atualizada = chave foi usada por outra pessoa simultaneamente
      return NextResponse.json({ error: 'Esta chave acabou de ser utilizada por outra pessoa. Tente com uma nova chave.' }, { status: 409 })
    }

    // 2. Ativa o usuário na tabela USER_PRESENCE (fonte da verdade para subscription status)
    const { error: updatePresenceError } = await supabaseAdmin
      .from('user_presence')
      .upsert({
        user_id: user.id,
        email: user.email,
        subscription_status: 'active',
        activation_key: inputKey,
        last_seen: new Date().toISOString()
      }, { onConflict: 'user_id' })

    if (updatePresenceError) {
      // Reverte a chave se falhar (melhor esforço)
      await supabaseAdmin
        .from('activation_keys')
        .update({ status: 'available', used_by: null, used_at: null })
        .eq('id', keyData.id)

      return NextResponse.json({ error: 'Erro ao ativar conta. Tente novamente.' }, { status: 500 })
    }

    // 3. Também atualiza a tabela USERS para compatibilidade (se existir)
    try {
      await supabaseAdmin
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          subscription_status: 'active'
        }, { onConflict: 'id' })
    } catch (usersError) {
      // Não crítico se a tabela users não existir ou tiver problemas
      console.warn('[Activate] Falha ao atualizar tabela users (pode não existir):', usersError)
    }

    return NextResponse.json({ success: true, message: 'Conta ativada com sucesso!' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}