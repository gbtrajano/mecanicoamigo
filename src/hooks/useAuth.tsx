'use client'

import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UsuarioOnline } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
  usuariosOnline: UsuarioOnline[]
  refreshUsers: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [usuariosOnline, setUsuariosOnline] = useState<UsuarioOnline[]>([])
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setIsAdmin(session?.user?.app_metadata?.role === 'admin' || false)
      setLoading(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setIsAdmin(session?.user?.app_metadata?.role === 'admin' || false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Atualizar status online
  useEffect(() => {
    if (!user) return

    const updateOnline = async () => {
      await supabase.from('user_presence').upsert({
        user_id: user.id,
        email: user.email,
        online: true,
        last_seen: new Date().toISOString()
      }, { onConflict: 'user_id' })
    }

    updateOnline()
    const interval = setInterval(updateOnline, 30000)

    const handleBeforeUnload = () => {
      supabase.from('user_presence').update({ online: false }).eq('user_id', user.id)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user])

  // Buscar usuários online via API route (não via admin client no browser)
  const refreshUsers = async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsuariosOnline(data.users || [])
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    })
    return { error }
  }

  const signOut = async () => {
    if (user) {
      await supabase.from('user_presence').update({ online: false }).eq('user_id', user.id)
    }
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin, usuariosOnline, refreshUsers }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
