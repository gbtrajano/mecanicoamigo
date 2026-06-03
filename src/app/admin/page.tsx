'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Shield, Users, Circle, XCircle, CheckCircle, Clock, Ban, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UsuarioOnline } from '@/types'
import Modal from '@/components/Modal'

type FilterStatus = 'todos' | 'active' | 'pending' | 'cancelled' | 'refunded'

export default function AdminPage() {
  const { isAdmin, usuariosOnline, refreshUsers, loading } = useAuth()
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState<UsuarioOnline[]>([])
  // Reset password modal state
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard')
    }
  }, [isAdmin, loading, router])

  useEffect(() => {
    if (isAdmin) {
      refreshUsers()
      const interval = setInterval(() => refreshUsers(), 30000)
      return () => clearInterval(interval)
    }
  }, [isAdmin, refreshUsers])

  useEffect(() => {
    setLocalUsers(usuariosOnline)
  }, [usuariosOnline])

  const updateSubscription = useCallback(async (userId: string, subscriptionStatus: string) => {
    setUpdatingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionStatus })
      })
      if (res.ok) {
        setLocalUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, subscriptionStatus } : u
        ))
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err)
    } finally {
      setUpdatingId(null)
    }
  }, [])

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError('')
    if (!resettingId) return
    if (newPassword !== confirmPassword) {
      setResetError('As senhas não coincidem!')
      return
    }
    if (newPassword.length < 6) {
      setResetError('A senha deve ter pelo menos 6 caracteres!')
      return
    }
    setResetLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resettingId, password: newPassword })
      })
      if (res.ok) {
        setResettingId(null)
        setNewPassword('')
        setConfirmPassword('')
        setResetError('Senha redefinida com sucesso!')
        // Optionally close modal after success
      } else {
        const data = await res.json()
        setResetError(data.error || 'Erro ao redefinir senha')
      }
    } catch (err) {
      // Since we don't know the type, we can check if it's an Error
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado';
      setResetError(errorMessage);
    } finally {
      setResetLoading(false)
    }
  }, [resettingId, newPassword, confirmPassword])

  if (loading || !isAdmin) return null

  const filtered = filterStatus === 'todos'
    ? localUsers
    : localUsers.filter(u => (u.subscriptionStatus ?? 'pending') === filterStatus)

  const counts = {
    active: localUsers.filter(u => u.subscriptionStatus === 'active').length,
    pending: localUsers.filter(u => !u.subscriptionStatus || u.subscriptionStatus === 'pending').length,
    cancelled: localUsers.filter(u => u.subscriptionStatus === 'cancelled' || u.subscriptionStatus === 'refunded').length,
    online: localUsers.filter(u => u.online).length,
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success"><CheckCircle className="w-3 h-3" />Ativa</span>
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger"><Ban className="w-3 h-3" />Cancelada</span>
      case 'refunded':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger"><Ban className="w-3 h-3" />Reembolsada</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning"><Clock className="w-3 h-3" />Pendente</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Painel Administrativo</h1>
          <p className="text-sm text-text-muted mt-1">Controle de acesso e usuários</p>
        </div>
        <button
          onClick={() => refreshUsers()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-text-muted hover:text-text hover:bg-bg transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Online agora</p>
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <Circle className="w-4 h-4 text-success fill-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{counts.online}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Ativos</p>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-text">{counts.active}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Aguardando</p>
            <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold text-warning">{counts.pending}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Bloqueados</p>
            <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-danger" />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{counts.cancelled}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['todos', 'active', 'pending', 'cancelled'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === f
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-muted hover:text-text'
              }`}
          >
            {f === 'todos' ? 'Todos' : f === 'active' ? 'Ativos' : f === 'pending' ? 'Aguardando' : 'Bloqueados'}
            {f !== 'todos' && (
              <span className="ml-1.5 opacity-70">
                ({f === 'active' ? counts.active : f === 'pending' ? counts.pending : f === 'cancelled' ? counts.cancelled : 0})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-text">Usuários Cadastrados</h3>
          <span className="text-xs text-text-muted">{filtered.length} usuário{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Online</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Último Acesso</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Assinatura</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-text-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted text-sm">
                    {localUsers.length === 0
                      ? 'Nenhum usuário encontrado. Configure a tabela user_presence no Supabase.'
                      : 'Nenhum usuário com esse filtro.'}
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isUpdating = updatingId === u.id
                  const isResetting = resettingId === u.id
                  const status = u.subscriptionStatus ?? 'pending'
                  const isActive = status === 'active'

                  return (
                    <tr key={u.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                      <td className="px-6 py-3 text-sm text-text font-medium">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${u.online ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
                          }`}>
                          <Circle className={`w-2 h-2 ${u.online ? 'fill-success' : 'fill-text-muted'}`} />
                          {u.online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-text-muted">
                        {format(new Date(u.ultimoAcesso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-3">
                        {getStatusBadge(u.subscriptionStatus)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isActive ? (
                            <button
                              onClick={() => updateSubscription(u.id, 'active')}
                              disabled={isUpdating}
                              title="Ativar acesso"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Ativar
                            </button>
                          ) : (
                            <button
                              onClick={() => updateSubscription(u.id, 'cancelled')}
                              disabled={isUpdating}
                              title="Revogar acesso"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                              Revogar
                            </button>
                          )}
                          {/* Reset Password Button */}
                          <button
                            onClick={() => {
                              setResettingId(u.id)
                              setNewPassword('')
                              setConfirmPassword('')
                              setResetError('')
                            }}
                            disabled={isResetting || isUpdating}
                            title="Redefinir senha"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium disabled:opacity-50"
                          >
                            Redefinir Senha
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
            <p className="text-sm font-medium text-text">Como funciona o controle de acesso</p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Novos usuários ficam com status <strong className="text-warning">Aguardando</strong> até você ativar manualmente.
              Confirme o pagamento no Mercado Livre e clique em <strong className="text-success">Ativar</strong>.
              Para reembolsos, clique em <strong className="text-danger">Revogar</strong> — o usuário verá a tela de aguardando ao tentar acessar.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resettingId}
        onClose={() => {
          setResettingId(null)
          setNewPassword('')
          setConfirmPassword('')
          setResetError('')
        }}
        title="Redefinir Senha"
        size="md"
      >
        {resetError && (
          <div className="p-3 rounded-lg text-sm mb-4 bg-danger/10 text-danger">
            {resetError}
          </div>
        )}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={resetLoading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resetLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            Redefinir Senha
          </button>
        </form>
      </Modal>
    </div>
  )
}