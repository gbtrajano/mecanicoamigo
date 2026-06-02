import { createClient } from '@supabase/supabase-js'

// Este arquivo deve ser usado APENAS em API Routes ou Server Components
// NUNCA importe este arquivo em componentes client-side ('use client')

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin não pode ser usado no browser. Use apenas em API Routes.')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
