'use client'

import { useEffect, useState } from 'react'
import { veiculoDB, clienteDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { Veiculo, Cliente } from '@/types'
import { Plus, Search, Trash2, Edit, Car, Phone } from 'lucide-react'

export default function VeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null)
  const [formData, setFormData] = useState({
    clienteId: '', placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', km: 0
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [v, c] = await Promise.all([veiculoDB.getAll(), clienteDB.getAll()])
    setVeiculos(v)
    setClientes(c)
  }

  const filtered = veiculos.filter(v => {
    const cliente = clientes.find(c => c.id === v.clienteId)
    return !search || 
      v.placa.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo.toLowerCase().includes(search.toLowerCase()) ||
      v.marca.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.nome.toLowerCase().includes(search.toLowerCase())
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingVeiculo) {
      await veiculoDB.update({ ...editingVeiculo, ...formData })
    } else {
      await veiculoDB.add(formData)
    }
    setModalOpen(false)
    setEditingVeiculo(null)
    setFormData({ clienteId: '', placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', km: 0 })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      await veiculoDB.delete(id)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Veículos</h1>
          <p className="text-sm text-text-muted mt-1">Cadastro e controle de veículos</p>
        </div>
        <button
          onClick={() => { setEditingVeiculo(null); setFormData({ clienteId: '', placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', km: 0 }); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Veículo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input type="text" placeholder="Buscar por placa, modelo, marca ou cliente..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-text-muted">
            Nenhum veículo encontrado
          </div>
        ) : (
          filtered.map(v => {
            const cliente = clientes.find(c => c.id === v.clienteId)
            return (
              <div key={v.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{v.placa}</h3>
                      <p className="text-xs text-text-muted">{v.marca} {v.modelo}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingVeiculo(v); setFormData({ ...v, cor: v.cor ?? '', km: v.km ?? 0 }); setModalOpen(true) }} className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Ano</span>
                    <span className="text-text">{v.ano}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Cor</span>
                    <span className="text-text">{v.cor || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">KM</span>
                    <span className="text-text">{v.km?.toLocaleString() || '—'}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Phone className="w-3 h-3" />
                      <span className="text-xs">{cliente?.nome || 'Sem cliente'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Cliente *</label>
            <select value={formData.clienteId} onChange={e => setFormData({...formData, clienteId: e.target.value})} required
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Placa *</label>
              <input value={formData.placa} onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Ano *</label>
              <input type="number" value={formData.ano} onChange={e => setFormData({...formData, ano: Number(e.target.value)})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Marca *</label>
              <input value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Modelo *</label>
              <input value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Cor</label>
              <input value={formData.cor} onChange={e => setFormData({...formData, cor: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">KM Atual</label>
              <input type="number" value={formData.km} onChange={e => setFormData({...formData, km: Number(e.target.value)})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm">{editingVeiculo ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
