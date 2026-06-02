'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Shield, Users, Clock, Circle, XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import type { UsuarioOnline } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AdminPage() {
  const { user, isAdmin, usuariosOnline, refreshUsers, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, loading, router])

  useEffect(() => {
    if (isAdmin) {
      refreshUsers()
      const interval = setInterval(refreshUsers, 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin])

  if (loading || !isAdmin) return null

  const onlineCount = usuariosOnline.filter(u => u.online).length
  const totalCount = usuariosOnline.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Painel Administrativo</h1>
        <p className="text-sm text-text-muted mt-1">Controle de acesso e usuários</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Usuários Online</p>
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <Circle className="w-4 h-4 text-success fill-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{onlineCount}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Total de Usuários</p>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">{totalCount}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Inativos</p>
            <div className="w-8 h-8 bg-text-muted/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-text-muted" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text-muted">{totalCount - onlineCount}</p>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text">Usuários Cadastrados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Último Acesso</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Assinatura</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Válida até</th>
              </tr>
            </thead>
            <tbody>
              {usuariosOnline.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-sm">
                    Nenhum usuário encontrado. Configure a tabela user_presence no Supabase.
                  </td>
                </tr>
              ) : (
                usuariosOnline.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-3 text-sm text-text">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        u.online ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
                      }`}>
                        <Circle className={`w-2 h-2 ${u.online ? 'fill-success' : 'fill-text-muted'}`} />
                        {u.online ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted">
                      {format(new Date(u.ultimoAcesso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        u.subscriptionStatus === 'active' ? 'bg-success/10 text-success' :
                        u.subscriptionStatus === 'cancelled' ? 'bg-danger/10 text-danger' :
                        'bg-warning/10 text-warning'
                      }`}>
                        {u.subscriptionStatus === 'active' ? 'Ativa' :
                         u.subscriptionStatus === 'cancelled' ? 'Cancelada' :
                         u.subscriptionStatus === 'refunded' ? 'Reembolsada' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-text-muted">
                      {u.subscriptionEnd ? format(new Date(u.subscriptionEnd), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-secondary-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-text">Controle de Acesso</p>
            <p className="text-xs text-text-muted mt-1">
              Monitore quem está online, verifique status de assinatura e identifique usuários que solicitaram reembolso. 
              Configure a tabela <code className="bg-bg px-1 py-0.5 rounded text-xs">user_presence</code> no Supabase para habilitar o rastreamento completo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
