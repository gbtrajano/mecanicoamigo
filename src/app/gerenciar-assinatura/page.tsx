'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function GerenciarAssinaturaPage() {
  const { isAdmin, subscriptionStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancelSubscription = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      setMessage('Assinatura cancelada com sucesso. Você terá acesso até o final do período pago.');
      // Optionally refetch subscription status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Admins should not see this page (they are exempt)
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <p className="text-red-600">Administradores não possuem assinatura ativa.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Voltar ao painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Gerenciar Assinatura</h1>
        <div className="bg-white rounded-xl shadow-md p-6">
          <p className="mb-4">
            Seu plano atual: <span className="font-bold">{subscriptionStatus === 'active' ? 'Ativo (R$ 29,99/mês)' : subscriptionStatus}</span>
          </p>
          {subscriptionStatus === 'active' || subscriptionStatus === 'past_due' || subscriptionStatus === 'trialing' ? (
            <>
              <p className="mb-6">
                Você pode atualizar seu método de pagamento, baixar faturas ou cancelar sua assinatura a qualquer momento.
              </p>
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Cancelando...' : 'Cancelar Assinatura'}
              </button>
            </>
          ) : (
            <p className="text-gray-500">Nenhuma assinatura ativa encontrada.</p>
          )}
          {message && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
              {error}
            </div>
          )}
          <div className="mt-6">
            <Link href="/" className="text-blue-600 hover:underline">
              Voltar ao painel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}