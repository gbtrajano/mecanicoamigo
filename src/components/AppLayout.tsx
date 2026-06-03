'use client'

import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Páginas que renderizam sem Sidebar/Header (layout limpo)
  const standalonePages = ['/', '/login', '/aguardando']
  const isStandalone = standalonePages.includes(pathname)

  useEffect(() => {
    // /aguardando requer usuário, então não é totalmente "public" no sentido de redirecionar p/ login se não houver usuário,
    // mas o middleware já cuida do redirecionamento de login para rotas protegidas.
    // Aqui garantimos que se não for standalone e não tiver usuário, vai pro login.
    if (!loading && !user && !isStandalone) {
      router.push('/login')
    }
  }, [user, loading, isStandalone, router])

  if (loading && !isStandalone) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isStandalone) {
    return <>{children}</>
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-bg flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
