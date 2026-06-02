'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import { getDashboardStats } from '@/lib/local-db'
import type { DashboardStats } from '@/types'
import {
  Wrench, CheckCircle, DollarSign, TrendingUp,
  AlertTriangle, Users
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const data = await getDashboardStats()
    setStats(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="bg-surface rounded-xl p-5 h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-muted text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ordens Pendentes"
          value={stats.ordensPendentes}
          icon={Wrench}
          color="warning"
          change={`${stats.ordensPendentes} em andamento`}
          changeType="neutral"
        />
        <StatCard
          title="Concluídas no Mês"
          value={stats.ordensConcluidasMes}
          icon={CheckCircle}
          color="success"
          change="+12% vs mês anterior"
          changeType="positive"
        />
        <StatCard
          title="Faturamento"
          value={formatCurrency(stats.faturamentoMes)}
          icon={DollarSign}
          color="primary"
          change="+8% vs mês anterior"
          changeType="positive"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(stats.lucroMes)}
          icon={TrendingUp}
          color={stats.lucroMes >= 0 ? 'success' : 'danger'}
          change={`${formatCurrency(stats.despesasMes)} em despesas`}
          changeType="neutral"
        />
      </div>

      {/* Alertas e Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alertas */}
        <div className="lg:col-span-2 bg-surface rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-text mb-4">Alertas</h3>
          <div className="space-y-3">
            {stats.pecasBaixoEstoque > 0 && (
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text">{stats.pecasBaixoEstoque} peças com estoque baixo</p>
                  <p className="text-xs text-text-muted">Verifique o estoque para reabastecer</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
              <Users className="w-5 h-5 text-secondary-dark flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-text">{stats.clientesNovosMes} clientes novos este mês</p>
                <p className="text-xs text-text-muted">Continue oferecendo um bom atendimento</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ações Rápidas - links corrigidos para páginas existentes */}
        <div className="bg-surface rounded-xl p-5 card-shadow border border-border">
          <h3 className="font-semibold text-text mb-4">Ações Rápidas</h3>
          <div className="space-y-2">
            <a href="/ordens" className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
              <Wrench className="w-4 h-4" />
              Nova Ordem de Serviço
            </a>
            <a href="/clientes" className="flex items-center gap-3 p-3 rounded-lg bg-bg text-text hover:bg-primary/5 transition-colors text-sm font-medium">
              <Users className="w-4 h-4" />
              Cadastrar Cliente
            </a>
            <a href="/estoque" className="flex items-center gap-3 p-3 rounded-lg bg-bg text-text hover:bg-primary/5 transition-colors text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              Adicionar Peça
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
