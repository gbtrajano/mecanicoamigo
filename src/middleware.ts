import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

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

  // DEFINE ROUTE ACCESS RULES

  // 1. Completely public routes (no authentication required at all)
  const completelyPublicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password'
  ]

  // 2. Routes that require authentication
  const authRequiredRoutes = [
    '/planos',
    '/aguardando',
    '/dashboard', 
    '/ordens', 
    '/clientes', 
    '/estoque', 
    '/financeiro', 
    '/notas-fiscais', 
    '/relatorios', 
    '/configuracoes', 
    '/servicos',
    '/equipe',
    '/veiculos',
    '/almoxarifado',
    '/orcamentos',
    '/gerenciar-assinatura',
    '/admin'
  ]

  // Check if route is completely public
  const isCompletelyPublicRoute = completelyPublicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith(route + '/')
  )

  // If completely public, allow access
  if (isCompletelyPublicRoute) {
    return response
  }

  // If not public, require authentication
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // User is authenticated
  const isAdminUser = user?.app_metadata?.role === 'admin'
  const path = request.nextUrl.pathname

  // Admin routes: only admins can access
  if (path.startsWith('/admin')) {
    if (!isAdminUser) {
      // Non-admin trying to access admin route
      return NextResponse.redirect(new URL('/planos', request.url))
    }
    // Admin user can access admin routes
    return response
  }

  // FOR ALL OTHER AUTHENTICATED ROUTES
  const isProtectedRoute = authRequiredRoutes.some(route =>
    path.startsWith(route)
  )

  // Don't redirect if user is already on /aguardando or /planos (avoid loops)
  const isAguardandoRoute = path.startsWith('/aguardando')
  const isPlanosRoute = path.startsWith('/planos')

  if (isProtectedRoute && !isAdminUser && !isAguardandoRoute && !isPlanosRoute) {
    // Check subscription status from DB (source of truth — user_metadata JWT is stale after activation)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: presenceData } = await supabaseAdmin
      .from('user_presence')
      .select('subscription_status')
      .eq('user_id', user.id)
      .single()

    const isActive = presenceData?.subscription_status === 'active'

    if (!isActive) {
      // User has not activated yet — redirect to activation screen
      return NextResponse.redirect(new URL('/aguardando', request.url))
    }

    // User is active — allow access to the protected route
    return response
  }

  // If we got here, user is authorized
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}