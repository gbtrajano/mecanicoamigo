'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Wrench, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [nome, setNome] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, user } = useAuth()
  const router = useRouter()

  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem!')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres!')
        setLoading(false)
        return
      }
    }

    if (isLogin) {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password, { nome });
      if (error) {
        setError(error.message);
      } else {
        setError('');
        // Login automático após cadastro (sem confirmação de email)
        const { error: loginError } = await signIn(email, password);
        if (!loginError) {
          router.push('/dashboard');
        } else {
          // Login falhou (possivelmente devido à necessidade de confirmação de email)
          setError('Cadastro realizado com sucesso! Por favor, verifique seu email para confirmar a conta antes de fazer login.');
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Mecânico<span className="text-primary">Amigo</span></h1>
          <p className="text-text-muted text-sm mt-2">Sistema para gestão de oficinas mecânicas</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-xl card-shadow-lg border border-border p-6">
          <h2 className="text-lg font-semibold text-text mb-1">
            {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            {isLogin ? 'Entre com suas credenciais para acessar' : 'Preencha os dados para começar'}
          </p>

          {error && (
            <div className="p-3 rounded-lg text-sm mb-4 bg-danger/10 text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nome da Oficina</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={!isLogin}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Ex: Oficina do João"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-text mb-1">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                    minLength={6}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            {isLogin ? (
              <>
                Não tem conta?{' '}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword('') }}
                  className="text-sm text-primary hover:text-primary-dark font-medium hover:underline"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>
                Já tem conta?{' '}
                <button
                  onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword('') }}
                  className="text-sm text-primary hover:text-primary-dark font-medium hover:underline"
                >
                  Entre
                </button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-xs text-text-muted mt-6">
          Seus dados são armazenados localmente no seu navegador. 
          <br />A autenticação é usada apenas para controle de acesso.
        </p>
      </div>
    </div>
  )
}
