'use client';

import { useAuth } from '@/hooks/useAuth';
import { Bell, User, Search, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { user, isAdmin, subscriptionStatus } = useAuth();

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar ordens, clientes, peças..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-bg transition-colors">
          <Bell className="w-5 h-5 text-text-muted" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 flex flex-col items-end">
            <p className="text-sm font-medium text-text">{user?.email?.split('@')[0] || 'Usuário'}</p>
            <p className="text-xs text-text-muted">{user?.email}</p>
            {/* Subscription status and action for non-admin users */}
            {!isAdmin && (
              <div className="mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-medium">
                  {subscriptionStatus === 'active' ? (
                    <span className="bg-green-100 text-green-800">Ativo</span>
                  ) : subscriptionStatus === 'pending' ? (
                    <span className="bg-yellow-100 text-yellow-800">Pendente</span>
                  ) : subscriptionStatus === 'canceled' || subscriptionStatus === 'past_due' ? (
                    <span className="bg-red-100 text-red-800">Vencido</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800">Desconhecido</span>
                  )}
                </span>
                {subscriptionStatus !== 'active' && (
                  <Link
                    href="/planos"
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Assinar
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}