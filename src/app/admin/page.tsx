'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  Shield, Users, Circle, XCircle, CheckCircle, Clock, Ban, RefreshCw,
  Key, Plus, Copy, Check, Trash2, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { UsuarioOnline, ActivationKey } from '@/types'
import Modal from '@/components/Modal'

type FilterStatus = 'todos' | 'active' | 'pending' | 'cancelled' | 'refunded'

export default function AdminPage() {
  const { isAdmin, usuariosOnline, refreshUsers, loading } = useAuth()
  const router = useRouter()
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState<UsuarioOnline[]>([])
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // — Chaves de ativação
  const [keys, setKeys] = useState<ActivationKey[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [keysOpen, setKeysOpen] = useState(true)
  const [genQuantity, setGenQuantity] = useState(1)
  const [genNote, setGenNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [keyFilter, setKeyFilter] = useState<'all' | 'available' | 'used' | 'revoked'>('all')

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/dashboard')
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

  // Carrega as chaves
  const fetchKeys = useCallback(async () => {
    setKeysLoading(true)
    try {
      const res = await fetch('/api/admin/keys')
      if (res.ok) {
        const data = await res.json() as { keys: ActivationKey[] }
        setKeys(data.keys || [])
      }
    } catch (err) {
      console.error('Erro ao buscar chaves:', err)
    } finally {
      setKeysLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) fetchKeys()
  }, [isAdmin, fetchKeys])

  const updateSubscription = useCallback(async (userId: string, subscriptionStatus: UsuarioOnline['subscriptionStatus']) => {
    setUpdatingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionStatus })
      })
      if (res.ok) {
        setLocalUsers(prev => prev.map(u =>
          u.id === userId ? ({ ...u, subscriptionStatus } as UsuarioOnline) : u
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
    if (newPassword !== confirmPassword) { setResetError('As senhas não coincidem!'); return }
    if (newPassword.length < 6) { setResetError('A senha deve ter pelo menos 6 caracteres!'); return }
    setResetLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: resettingId, password: newPassword })
      })
      if (res.ok) {
        setResettingId(null); setNewPassword(''); setConfirmPassword('')
        setResetError('Senha redefinida com sucesso!')
      } else {
        const data = await res.json() as { error?: string }
        setResetError(data.error || 'Erro ao redefinir senha')
      }
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setResetLoading(false)
    }
  }, [resettingId, newPassword, confirmPassword])

  // Gerar chave(s)
  const handleGenerateKeys = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: genQuantity, note: genNote || undefined }),
      })
      if (res.ok) {
        await fetchKeys()
        setGenNote('')
        setGenQuantity(1)
      }
    } catch (err) {
      console.error('Erro ao gerar chaves:', err)
    } finally {
      setGenerating(false)
    }
  }

  // Copiar chave
  const handleCopy = async (key: ActivationKey) => {
    await navigator.clipboard.writeText(key.key)
    setCopiedId(key.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Revogar chave
  const handleRevoke = async (keyId: string) => {
    setRevokingId(keyId)
    try {
      const res = await fetch('/api/admin/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId }),
      })
      if (res.ok) {
        setKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k))
      }
    } catch (err) {
      console.error('Erro ao revogar:', err)
    } finally {
      setRevokingId(null)
    }
  }

  if (loading || !isAdmin) return null

  const filtered = filterStatus === 'todos'
    ? localUsers
    : localUsers.filter(u => (u.subscriptionStatus ?? 'pending') === filterStatus);

  const counts = {
    active: localUsers.filter(u => u.subscriptionStatus === 'active').length,
    pending: localUsers.filter(u => !u.subscriptionStatus || u.subscriptionStatus === 'pending').length,
    cancelled: localUsers.filter(u => u.subscriptionStatus === 'cancelled' || u.subscriptionStatus === 'refunded').length,
    online: localUsers.filter(u => u.online).length,
  }

  const keyCounts = {
    available: keys.filter(k => k.status === 'available').length,
    used: keys.filter(k => k.status === 'used').length,
    revoked: keys.filter(k => k.status === 'revoked').length,
  }

  const filteredKeys = keyFilter === 'all' ? keys : keys.filter(k => k.status === keyFilter)


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

  const getKeyStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success"><CheckCircle className="w-3 h-3" />Disponível</span>
      case 'used':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"><Key className="w-3 h-3" />Usada</span>
      case 'revoked':
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger"><Ban className="w-3 h-3" />Revogada</span>
      default:
        return null
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

      {/* Stats Usuários */}
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

      {/* ===== SEÇÃO CHAVES DE ATIVAÇÃO ===== */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        {/* Header colapsável */}
        <button
          onClick={() => setKeysOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 border-b border-border hover:bg-bg/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-text">Chaves de Ativação</p>
              <p className="text-xs text-text-muted">
                {keyCounts.available} disponível{keyCounts.available !== 1 ? 'is' : ''} · {keyCounts.used} usada{keyCounts.used !== 1 ? 's' : ''} · {keyCounts.revoked} revogada{keyCounts.revoked !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {keysOpen ? <ChevronUp className="w-5 h-5 text-text-muted" /> : <ChevronDown className="w-5 h-5 text-text-muted" />}
        </button>

        {keysOpen && (
          <div className="p-6 space-y-5">
            {/* Gerador de chaves */}
            <div className="bg-bg rounded-xl border border-border p-5">
              <p className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Gerar Novas Chaves
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">Quantidade</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={genQuantity}
                    onChange={e => setGenQuantity(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-24 px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-xs text-text-muted mb-1.5">Nota interna (opcional)</label>
                  <input
                    type="text"
                    value={genNote}
                    onChange={e => setGenNote(e.target.value)}
                    placeholder="Ex: Cliente João, Lote Junho..."
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text placeholder:text-text-muted/50"
                  />
                </div>
                <button
                  id="generate-keys-btn"
                  onClick={handleGenerateKeys}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  Gerar {genQuantity > 1 ? `${genQuantity} Chaves` : 'Chave'}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-3">
                ⏱ Validade de <strong>7 dias</strong> após a geração. Formato: <code className="bg-surface px-1.5 py-0.5 rounded text-primary font-mono">MECA-XXXX-XXXX-XXXX</code>
              </p>
            </div>

            {/* Filtro de status */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'available', 'used', 'revoked'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setKeyFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    keyFilter === f ? 'bg-primary text-white' : 'bg-bg border border-border text-text-muted hover:text-text'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'available' ? `Disponíveis (${keyCounts.available})` : f === 'used' ? `Usadas (${keyCounts.used})` : `Revogadas (${keyCounts.revoked})`}
                </button>
              ))}
            </div>

            {/* Lista de chaves */}
            {keysLoading ? (
              <div className="flex items-center justify-center py-8 text-text-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Carregando chaves...
              </div>
            ) : filteredKeys.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm">
                {keys.length === 0 ? 'Nenhuma chave gerada ainda. Crie a primeira acima.' : 'Nenhuma chave com esse filtro.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredKeys.map(k => {
                  const isExpired = k.expires_at ? new Date(k.expires_at) < new Date() : false
                  const isCopied = copiedId === k.id
                  const isRevoking = revokingId === k.id

                  return (
                    <div
                      key={k.id}
                      className={`flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                        k.status === 'available' && !isExpired
                          ? 'border-border bg-bg hover:border-primary/20'
                          : 'border-border/50 bg-bg/50 opacity-70'
                      }`}
                    >
                      {/* Chave */}
                      <code className="font-mono text-sm font-semibold text-text tracking-wider flex-1 min-w-[180px]">
                        {k.key}
                      </code>

                      {/* Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {getKeyStatusBadge(k.status)}
                        {isExpired && k.status === 'available' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                            <Clock className="w-3 h-3" />Expirada
                          </span>
                        )}
                      </div>

                      {/* Meta info */}
                      <div className="text-xs text-text-muted min-w-[120px]">
                        {k.status === 'used' && k.used_by_email ? (
                          <span title={k.used_at ?? ''}>
                            👤 {k.used_by_email}
                            {k.used_at && <> · {format(new Date(k.used_at), 'dd/MM HH:mm', { locale: ptBR })}</>}
                          </span>
                        ) : k.expires_at ? (
                          <span>Expira: {format(new Date(k.expires_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                        ) : null}
                        {k.note && <div className="text-text-muted/70 italic">{k.note}</div>}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-1 ml-auto">
                        {k.status === 'available' && (
                          <button
                            onClick={() => handleCopy(k)}
                            title="Copiar chave"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-primary/10 text-text-muted hover:text-primary transition-colors text-xs"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                            {isCopied ? 'Copiada!' : 'Copiar'}
                          </button>
                        )}
                        {k.status === 'available' && (
                          <button
                            onClick={() => handleRevoke(k.id)}
                            disabled={isRevoking}
                            title="Revogar chave"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-danger/10 text-text-muted hover:text-danger transition-colors text-xs disabled:opacity-50"
                          >
                            {isRevoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            Revogar
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros usuários */}
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
                  const usedKey = u.activationKey

                  return (
                    <tr key={u.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                      <td className="px-6 py-3">
                        <p className="text-sm text-text font-medium">{u.email}</p>
                        {usedKey && (
                          <p className="flex items-center gap-1 mt-0.5 text-xs text-text-muted font-mono">
                            <Key className="w-3 h-3 text-primary flex-shrink-0" />
                            {usedKey}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${u.online ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'}`}>
                          <Circle className={`w-2 h-2 ${u.online ? 'fill-success' : 'fill-text-muted'}`} />
                          {u.online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-text-muted">
                        {format(new Date(u.ultimoAcesso.endsWith('Z') ? u.ultimoAcesso : `${u.ultimoAcesso}Z`), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-3">{getStatusBadge(u.subscriptionStatus)}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive && (
                            <button
                              onClick={() => updateSubscription(u.id, 'cancelled')}
                              disabled={isUpdating}
                              title="Revogar acesso"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-xs font-medium disabled:opacity-50"
                            >
                              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                              Revogar
                            </button>
                          )}
                          <button
                            onClick={() => { setResettingId(u.id); setNewPassword(''); setConfirmPassword(''); setResetError('') }}
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
              Gere chaves de ativação acima e envie ao cliente. Cada chave ativa <strong>um único usuário</strong> e expira em <strong>7 dias</strong>.
              O usuário insere a chave na tela de espera e o acesso é liberado automaticamente.
              Na tabela de usuários você pode ver qual chave foi usada e revogar acessos quando necessário.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Reset Password */}
      <Modal
        isOpen={!!resettingId}
        onClose={() => { setResettingId(null); setNewPassword(''); setConfirmPassword(''); setResetError('') }}
        title="Redefinir Senha"
        size="md"
      >
        {resetError && (
          <div className="p-3 rounded-lg text-sm mb-4 bg-danger/10 text-danger">{resetError}</div>
        )}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required minLength={6}
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
              required minLength={6}
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