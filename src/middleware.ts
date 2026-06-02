import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const protectedRoutes = ['/dashboard', '/ordens', '/clientes', '/estoque', '/financeiro', '/notas-fiscais', '/relatorios', '/configuracoes', '/servicos', '/admin', '/aguardando']
  const isProtected = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Redireciona para login se não autenticado
  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verifica assinatura para rotas protegidas (exceto /admin e /aguardando)
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isAguardandoRoute = request.nextUrl.pathname.startsWith('/aguardando')

  if (user && isProtected && !isAdminRoute && !isAguardandoRoute) {
    const { data: presence } = await supabase
      .from('user_presence')
      .select('subscription_status')
      .eq('user_id', user.id)
      .single()

    // null/undefined = usuário existente antes do sistema → trata como ativo
    const status = presence?.subscription_status ?? 'active'

    if (status !== 'active') {
      return NextResponse.redirect(new URL('/aguardando', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
