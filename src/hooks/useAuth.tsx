'use client'

import { useEffect, useState, createContext, useContext, ReactNode, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, AuthError } from '@supabase/supabase-js'
import type { UsuarioOnline } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: AuthError | null }>
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
  }, [supabase])

  // Atualizar status online
  useEffect(() => {
    if (!user) return

    const updateOnline = async () => {
      // Verifica se o usuário já existe no user_presence
      const { data: existing } = await supabase
        .from('user_presence')
        .select('user_id, subscription_status')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Usuário já existe: atualiza só online/last_seen, preserva subscription_status
        await supabase.from('user_presence').update({
          email: user.email,
          online: true,
          last_seen: new Date().toISOString()
        }).eq('user_id', user.id)
      } else {
        // Novo usuário: cria o registro com subscription_status = 'pending'
        await supabase.from('user_presence').insert({
          user_id: user.id,
          email: user.email,
          online: true,
          last_seen: new Date().toISOString(),
          subscription_status: 'pending'
        })
      }
    }

    updateOnline()
    const interval = setInterval(async () => {
      await supabase.from('user_presence').update({
        online: true,
        last_seen: new Date().toISOString()
      }).eq('user_id', user.id)
    }, 30000)

    const handleBeforeUnload = () => {
      supabase.from('user_presence').update({ online: false }).eq('user_id', user.id)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user, supabase])


  // Buscar usuários online via API route
  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json() as { users: UsuarioOnline[] }
        setUsuariosOnline(data.users || [])
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err)
    }
  }, [isAdmin])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
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
