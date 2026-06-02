'use client'

import { useEffect, useState } from 'react'
import { servicoDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { Servico } from '@/types'
import { Plus, Search, Trash2, Edit, Clock } from 'lucide-react'

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingServico, setEditingServico] = useState<Servico | null>(null)
  const [formData, setFormData] = useState({
    nome: '', descricao: '', preco: 0, tempoEstimado: 60, categoria: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const s = await servicoDB.getAll()
    setServicos(s)
  }

  const filtered = servicos.filter(s =>
    !search || s.nome.toLowerCase().includes(search.toLowerCase()) ||
    (s.categoria && s.categoria.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingServico) {
      await servicoDB.update({ ...editingServico, ...formData })
    } else {
      await servicoDB.add(formData)
    }
    setModalOpen(false)
    setEditingServico(null)
    setFormData({ nome: '', descricao: '', preco: 0, tempoEstimado: 60, categoria: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      await servicoDB.delete(id)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Serviços</h1>
          <p className="text-sm text-text-muted mt-1">Cadastro de serviços oferecidos</p>
        </div>
        <button
          onClick={() => { setEditingServico(null); setFormData({ nome: '', descricao: '', preco: 0, tempoEstimado: 60, categoria: '' }); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" placeholder="Buscar serviços..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Descrição</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Preço</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Tempo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-text-muted text-sm">Nenhum serviço encontrado</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-text">{s.nome}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{s.descricao || '—'}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">{s.categoria || '—'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text">R$ {s.preco.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {s.tempoEstimado} min
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditingServico(s); setFormData({ ...s }); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingServico ? 'Editar Serviço' : 'Novo Serviço'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Nome *</label>
            <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Descrição</label>
            <textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Preço *</label>
              <input type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: Number(e.target.value)})} required min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Tempo Estimado (min)</label>
              <input type="number" value={formData.tempoEstimado} onChange={e => setFormData({...formData, tempoEstimado: Number(e.target.value)})} min={0}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Categoria</label>
            <input value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm">{editingServico ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
