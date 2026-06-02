'use client'

import { useEffect, useState } from 'react'
import { pecaDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { Peca } from '@/types'
import { Plus, Search, AlertTriangle, Trash2, Edit, Package, ArrowUpDown } from 'lucide-react'

export default function EstoquePage() {
  const [pecas, setPecas] = useState<Peca[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPeca, setEditingPeca] = useState<Peca | null>(null)
  const [formData, setFormData] = useState({
    codigo: '', nome: '', descricao: '', quantidade: 0, precoCusto: 0, precoVenda: 0,
    minimo: 5, fornecedor: '', categoria: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const p = await pecaDB.getAll()
    setPecas(p)
  }

  const filtered = pecas.filter(p =>
    !search || p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.codigo.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingPeca) {
      await pecaDB.update({ ...editingPeca, ...formData })
    } else {
      await pecaDB.add(formData)
    }
    setModalOpen(false)
    setEditingPeca(null)
    setFormData({ codigo: '', nome: '', descricao: '', quantidade: 0, precoCusto: 0, precoVenda: 0, minimo: 5, fornecedor: '', categoria: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta peça?')) {
      await pecaDB.delete(id)
      loadData()
    }
  }

  const baixoEstoque = pecas.filter(p => p.quantidade <= p.minimo)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Estoque</h1>
          <p className="text-sm text-text-muted mt-1">Controle de peças e inventário</p>
        </div>
        <button
          onClick={() => { setEditingPeca(null); setFormData({ codigo: '', nome: '', descricao: '', quantidade: 0, precoCusto: 0, precoVenda: 0, minimo: 5, fornecedor: '', categoria: '' }); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Peça
        </button>
      </div>

      {/* Alertas */}
      {baixoEstoque.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-text">{baixoEstoque.length} peças com estoque baixo</p>
            <p className="text-xs text-text-muted">Verifique e reabasteça o estoque o quanto antes</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por código ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Código</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Qtd</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Mínimo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Preço Custo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Preço Venda</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">Nenhuma peça encontrada</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className={`border-b border-border hover:bg-bg/50 transition-colors ${p.quantidade <= p.minimo ? 'bg-warning/5' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-text">{p.codigo}</td>
                    <td className="px-4 py-3 text-sm text-text">
                      <div>{p.nome}</div>
                      {p.categoria && <div className="text-xs text-text-muted">{p.categoria}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        p.quantidade <= p.minimo ? 'bg-warning/20 text-warning' : 'bg-success/10 text-success'
                      }`}>
                        {p.quantidade <= p.minimo && <AlertTriangle className="w-3 h-3" />}
                        {p.quantidade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-muted">{p.minimo}</td>
                    <td className="px-4 py-3 text-sm text-text">R$ {p.precoCusto.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text">R$ {p.precoVenda.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingPeca(p); setFormData({ ...p }); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingPeca ? 'Editar Peça' : 'Nova Peça'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Código *</label>
              <input value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Nome *</label>
              <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Descrição</label>
            <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Quantidade *</label>
              <input type="number" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Estoque Mínimo</label>
              <input type="number" value={formData.minimo} onChange={e => setFormData({...formData, minimo: Number(e.target.value)})} min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Preço Custo *</label>
              <input type="number" step="0.01" value={formData.precoCusto} onChange={e => setFormData({...formData, precoCusto: Number(e.target.value)})} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Preço Venda *</label>
              <input type="number" step="0.01" value={formData.precoVenda} onChange={e => setFormData({...formData, precoVenda: Number(e.target.value)})} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Fornecedor</label>
              <input value={formData.fornecedor} onChange={e => setFormData({...formData, fornecedor: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Categoria</label>
              <input value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm">{editingPeca ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
