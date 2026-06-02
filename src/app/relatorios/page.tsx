'use client'

import { useEffect, useState } from 'react'
import { ordemDB, transacaoDB, clienteDB } from '@/lib/local-db'
import type { OrdemServico, Transacao, Cliente } from '@/types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#E63946', '#4FC3F7', '#22C55E', '#F59E0B', '#8B5CF6']

export default function RelatoriosPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [periodo, setPeriodo] = useState(6)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [o, t, c] = await Promise.all([ordemDB.getAll(), transacaoDB.getAll(), clienteDB.getAll()])
    setOrdens(o); setTransacoes(t); setClientes(c)
  }

  const meses = eachMonthOfInterval({ start: subMonths(new Date(), periodo - 1), end: new Date() })

  const faturamentoPorMes = meses.map(m => {
    const inicio = startOfMonth(m).toISOString()
    const fim = endOfMonth(m).toISOString()
    const valor = transacoes
      .filter(t => t.tipo === 'receita' && t.data >= inicio && t.data <= fim)
      .reduce((s, t) => s + t.valor, 0)
    return { name: format(m, 'MMM', { locale: ptBR }), valor }
  })

  const ordensPorStatus = [
    { name: 'Pendente', value: ordens.filter(o => o.status === 'pendente').length },
    { name: 'Em Andamento', value: ordens.filter(o => o.status === 'em_andamento').length },
    { name: 'Concluída', value: ordens.filter(o => o.status === 'concluida').length },
    { name: 'Cancelada', value: ordens.filter(o => o.status === 'cancelada').length },
  ].filter(d => d.value > 0)

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Relatórios</h1>
          <p className="text-sm text-text-muted mt-1">Análise e estatísticas do seu negócio</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodo} onChange={e => setPeriodo(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value={3}>Últimos 3 meses</option>
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Último ano</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Total Receitas</p>
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Total Despesas</p>
            <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-danger rotate-180" />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Saldo</p>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(saldo)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Faturamento por Mês</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={faturamentoPorMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="valor" fill="#E63946" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-secondary-dark" />
            <h3 className="font-semibold text-text">Status das Ordens</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={ordensPorStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {ordensPorStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {ordensPorStatus.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-text-muted">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-xl p-5 border border-border">
        <h3 className="font-semibold text-text mb-4">Resumo do Período</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-bg rounded-lg">
            <p className="text-xs text-text-muted mb-1">Total de Ordens</p>
            <p className="text-xl font-bold text-text">{ordens.length}</p>
          </div>
          <div className="p-4 bg-bg rounded-lg">
            <p className="text-xs text-text-muted mb-1">Faturamento Total</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalReceitas)}</p>
          </div>
          <div className="p-4 bg-bg rounded-lg">
            <p className="text-xs text-text-muted mb-1">Despesas Totais</p>
            <p className="text-xl font-bold text-danger">{formatCurrency(totalDespesas)}</p>
          </div>
          <div className="p-4 bg-bg rounded-lg">
            <p className="text-xs text-text-muted mb-1">Total de Clientes</p>
            <p className="text-xl font-bold text-text">{clientes.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
