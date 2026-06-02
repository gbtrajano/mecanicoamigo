'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Wrench, Clock, CheckCircle, LogOut, Mail } from 'lucide-react'

export default function AguardandoPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
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
        <div className="bg-surface rounded-xl border border-border p-8 text-center shadow-lg mb-4">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8 text-warning" />
          </div>

          <h2 className="text-xl font-bold text-text mb-2">Aguardando Liberação</h2>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            Seu cadastro foi realizado com sucesso! Seu acesso será liberado após a confirmação do seu pagamento.
          </p>

          {user && (
            <div className="bg-bg rounded-lg px-4 py-3 border border-border mb-6 text-left">
              <p className="text-xs text-text-muted mb-1">Conta cadastrada</p>
              <p className="text-sm font-medium text-text">{user.email}</p>
            </div>
          )}

          {/* Passos */}
          <div className="space-y-3 text-left mb-6">
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
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-text">Aguardando confirmação</p>
                <p className="text-xs text-text-muted">O administrador irá ativar seu acesso em breve</p>
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

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3 mb-6">
            <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted text-left">
              Após confirmar seu pagamento no Mercado Livre, entre em contato com o suporte para agilizar a ativação. Normalmente o acesso é liberado em até <strong className="text-text">1 hora</strong>.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-border text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/5 transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>

        <p className="text-center text-xs text-text-muted">
          Se o problema persistir, recarregue a página após a confirmação.
        </p>
      </div>
    </div>
  )
}
