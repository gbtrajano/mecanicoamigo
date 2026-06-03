'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Wrench, Clock, CheckCircle, LogOut, Key, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function AguardandoPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  /** Formata a chave enquanto o usuário digita: MECA-XXXX-XXXX-XXXX */
  const handleKeyInput = (value: string) => {
    // Remove tudo que não é alfanumérico e converte para maiúsculo
    const clean = value.replace(/[^A-Z0-9a-z]/g, '').toUpperCase()

    // Adiciona o prefixo MECA automaticamente se ainda não tiver
    let formatted = clean

    // Insere hífens nas posições corretas: 4-4-4-4
    const parts: string[] = []
    for (let i = 0; i < formatted.length && parts.length < 4; i += 4) {
      parts.push(formatted.slice(i, i + 4))
    }
    formatted = parts.join('-')

    setKey(formatted)
    setError('')
  }

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!key || key.length < 19) {
      setError('Por favor, insira a chave de ativação completa.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const data = await res.json() as { error?: string; success?: boolean }

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Chave inválida. Verifique e tente novamente.')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">
            Mecânico<span className="text-primary">Amigo</span>
          </h1>
        </div>

        {/* Card Principal */}
        <div className="bg-surface rounded-xl border border-border p-8 shadow-lg mb-4">

          {success ? (
            /* Estado de sucesso */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Acesso Liberado!</h2>
              <p className="text-text-muted text-sm">
                Sua chave foi validada com sucesso. Redirecionando para o sistema...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-warning" />
                </div>
                <h2 className="text-xl font-bold text-text mb-1">Aguardando Ativação</h2>
                <p className="text-text-muted text-sm">
                  Insira a chave de ativação fornecida pelo administrador para liberar seu acesso.
                </p>
              </div>

              {user && (
                <div className="bg-bg rounded-lg px-4 py-3 border border-border mb-5 text-left">
                  <p className="text-xs text-text-muted mb-0.5">Conta cadastrada</p>
                  <p className="text-sm font-medium text-text">{user.email}</p>
                </div>
              )}

              {/* Formulário de chave */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2 flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    Chave de Ativação
                  </label>
                  <input
                    id="activation-key-input"
                    type="text"
                    value={key}
                    onChange={(e) => handleKeyInput(e.target.value)}
                    placeholder="MECA-XXXX-XXXX-XXXX"
                    maxLength={19}
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full px-4 py-3 rounded-lg border ${
                      error ? 'border-danger bg-danger/5' : 'border-border bg-bg'
                    } text-text text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:font-sans placeholder:tracking-normal placeholder:text-text-muted/50`}
                    style={{ letterSpacing: key ? '0.15em' : undefined }}
                  />
                  {error && (
                    <div className="flex items-center gap-2 mt-2 text-danger text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                <button
                  id="activate-btn"
                  type="submit"
                  disabled={loading || key.length < 19}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Ativar Acesso
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Passos */}
              <div className="mt-6 pt-5 border-t border-border space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Conta criada</p>
                    <p className="text-xs text-text-muted">Seu email foi cadastrado no sistema</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Key className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Insira sua chave</p>
                    <p className="text-xs text-text-muted">Recebida pelo administrador do sistema</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Wrench className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">Acesso ao sistema</p>
                    <p className="text-xs text-text-muted">Você poderá usar todas as funcionalidades</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!success && (
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full mt-5 px-4 py-2.5 rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          )}
        </div>

        <p className="text-center text-xs text-text-muted">
          Não tem uma chave? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
