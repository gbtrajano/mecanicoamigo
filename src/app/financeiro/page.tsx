'use client'

import { useEffect, useState } from 'react'
import { transacaoDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { Transacao } from '@/types'
import { Plus, Search, TrendingUp, TrendingDown, DollarSign, Trash2, Edit, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null)
  const [formData, setFormData] = useState({
    tipo: 'receita' as 'receita' | 'despesa',
    categoria: '', descricao: '', valor: 0, data: format(new Date(), 'yyyy-MM-dd'),
    formaPagamento: '', status: 'pago' as 'pendente' | 'pago' | 'atrasado'
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const t = await transacaoDB.getAll()
    setTransacoes(t.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()))
  }

  const filtered = transacoes.filter(t => {
    const matchSearch = !search || t.descricao.toLowerCase().includes(search.toLowerCase()) || t.categoria.toLowerCase().includes(search.toLowerCase())
    const matchTipo = filterTipo === 'todos' || t.tipo === filterTipo
    return matchSearch && matchTipo
  })

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0)
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0)
  const saldo = totalReceitas - totalDespesas

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTransacao) {
      await transacaoDB.update({ ...editingTransacao, ...formData })
    } else {
      await transacaoDB.add(formData)
    }
    setModalOpen(false)
    setEditingTransacao(null)
    setFormData({ tipo: 'receita', categoria: '', descricao: '', valor: 0, data: format(new Date(), 'yyyy-MM-dd'), formaPagamento: '', status: 'pago' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await transacaoDB.delete(id)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Financeiro</h1>
          <p className="text-sm text-text-muted mt-1">Controle de receitas e despesas</p>
        </div>
        <button
          onClick={() => { setEditingTransacao(null); setFormData({ tipo: 'receita', categoria: '', descricao: '', valor: 0, data: format(new Date(), 'yyyy-MM-dd'), formaPagamento: '', status: 'pago' }); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Transação
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Total Receitas</p>
            <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold text-success">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceitas)}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Total Despesas</p>
            <div className="w-8 h-8 bg-danger/10 rounded-lg flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-danger" />
            </div>
          </div>
          <p className="text-2xl font-bold text-danger">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalDespesas)}</p>
        </div>
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-text-muted">Saldo</p>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-success' : 'text-danger'}`}>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(saldo)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Buscar transações..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="todos">Todos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">Nenhuma transação encontrada</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-muted">{format(new Date(t.data), 'dd/MM/yyyy', { locale: ptBR })}</td>
                    <td className="px-4 py-3 text-sm text-text">{t.descricao}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{t.categoria}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        t.tipo === 'receita' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                      }`}>
                        {t.tipo === 'receita' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {t.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${t.tipo === 'receita' ? 'text-success' : 'text-danger'}`}>
                      {t.tipo === 'receita' ? '+' : '-'}{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        t.status === 'pago' ? 'bg-success/10 text-success' :
                        t.status === 'pendente' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                      }`}>
                        {t.status === 'pago' ? 'Pago' : t.status === 'pendente' ? 'Pendente' : 'Atrasado'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingTransacao(t); setFormData({ ...t }); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingTransacao ? 'Editar Transação' : 'Nova Transação'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Tipo *</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as 'receita' | 'despesa'})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Data *</label>
              <input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Descrição *</label>
            <input value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} required
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Categoria *</label>
              <input value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Valor *</label>
              <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: Number(e.target.value)})} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Forma de Pagamento</label>
              <select value={formData.formaPagamento} onChange={e => setFormData({...formData, formaPagamento: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Selecione...</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'pendente' | 'pago' | 'atrasado'})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm">{editingTransacao ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
