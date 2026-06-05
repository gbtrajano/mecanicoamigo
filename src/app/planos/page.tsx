"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PlanosPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract session_id from query params on mount
  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("session_id");
    if (id) {
      setSessionId(id);
    }
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }
      const data = await res.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("No URL returned from checkout session");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl mb-4">
            Planos de Assinatura
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Acesso completo ao Mecânico Amigo por apenas R$ 29,99/mês. Gerencie sua oficina com eficiência e profissionalismo.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          {/* Header with Icon */}
          <div className="flex items-center space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 10c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0-8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Plano Mensal
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Acesso ilimitado a todas as funcionalidades
              </p>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-6 text-center">
            <div className="inline-block bg-blue-50 px-4 py-2 rounded-full text-sm font-medium text-blue-600 mb-4">
              Mais Popular
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-2">
              R$ <span className="text-4xl">29,99</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              / mês
            </p>
          </div>

          {/* Features */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                O que você receberá:
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gestão Completa de Ordens</p>
                  <p className="text-sm text-gray-500">Crie, acompanhe e finalize ordens de serviço com controle total</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 10c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Controle de Estoque e Peças</p>
                  <p className="text-sm text-gray-500">Gerencie seu inventário, controle estoque mínimo e receba alertas de reposição</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m2 0a2 2 0 100-4 2 2 0 000 4zm-9 4a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Relatórios Financeiros</p>
                  <p className="text-sm text-gray-500">Visualize faturamento, despesas e lucros com gráficos intuitivos</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-1.105-.895-2-2-2h-1.417A5.988 5.988 0 009 14c-1.03.018-2.042.12-3 0-1.03-.118-2.042-.12-3 0A5.988 5.988 0 003.417 12H3c-1.105 0-2 .895-2 2v2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Gestão de Clientes e Veículos</p>
                  <p className="text-sm text-gray-500">Mantenha histórico completo de clientes, veículos e serviços realizados</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-green-100 rounded-full">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Suporte Prioritário</p>
                  <p className="text-sm text-gray-500">Atendimento dedicado e atualizações exclusivas para assinantes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="p-6 pt-0">
            {!sessionId ? (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className={`w-full flex items-center justify-center space-x-3 py-4 px-6 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 
                ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                text-white`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h18M3 3v18M3 21h18"></path>
                    </svg>
                    <span>Assinar Agora - R$ 29,99/mês</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-xl font-semibold text-green-800">Assinatura criada com sucesso!</h3>
                </div>
                <p className="text-gray-600">
                  Você será redirecionado automaticamente para o painel em alguns segundos.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 hover:text-white"
                >
                  Ir para o Painel
                </Link>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-6 pt-4 pb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-red-50 rounded-full">
                  <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-sm text-red-600">{error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            <strong>Garantia de satisfação:</strong> Cancelamento a qualquer momento, sem multa.
          </p>
          <p className="mt-2">
            Dúvidas? Fale conosco pelo <a href="#" className="text-indigo-600 hover:underline">suporte@mecanicoamigo.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}