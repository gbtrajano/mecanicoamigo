'use client'

import { useEffect, useState } from 'react'
import { clienteDB, veiculoDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { Cliente, Veiculo } from '@/types'
import { Plus, Search, Trash2, Edit, Car, Phone, Mail, MapPin } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', cpf: '', endereco: '' })
  const [veiculoModal, setVeiculoModal] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<string | null>(null)
  const [veiculoForm, setVeiculoForm] = useState({ placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', km: 0 })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [c, v] = await Promise.all([clienteDB.getAll(), veiculoDB.getAll()])
    setClientes(c)
    setVeiculos(v)
  }

  const filtered = clientes.filter(c =>
    !search || c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search) || (c.cpf && c.cpf.includes(search))
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCliente) {
      await clienteDB.update({ ...editingCliente, ...formData })
    } else {
      await clienteDB.add(formData)
    }
    setModalOpen(false)
    setEditingCliente(null)
    setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza? Todos os veículos deste cliente serão excluídos.')) {
      await clienteDB.delete(id)
      const veiculosCliente = veiculos.filter(v => v.clienteId === id)
      for (const v of veiculosCliente) await veiculoDB.delete(v.id)
      loadData()
    }
  }

  const handleAddVeiculo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCliente) return
    await veiculoDB.add({ ...veiculoForm, clienteId: selectedCliente })
    setVeiculoModal(false)
    setVeiculoForm({ placa: '', marca: '', modelo: '', ano: new Date().getFullYear(), cor: '', km: 0 })
    setSelectedCliente(null)
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Clientes</h1>
          <p className="text-sm text-text-muted mt-1">Cadastro de clientes e veículos</p>
        </div>
        <button
          onClick={() => { setEditingCliente(null); setFormData({ nome: '', email: '', telefone: '', cpf: '', endereco: '' }); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-text-muted">
            Nenhum cliente encontrado
          </div>
        ) : (
          filtered.map(cliente => {
            const veiculosCliente = veiculos.filter(v => v.clienteId === cliente.id)
            return (
              <div key={cliente.id} className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text">{cliente.nome}</h3>
                    {cliente.cpf && <p className="text-xs text-text-muted">CPF: {cliente.cpf}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingCliente(cliente); setFormData({ nome: cliente.nome, email: cliente.email || '', telefone: cliente.telefone, cpf: cliente.cpf || '', endereco: cliente.endereco || '' }); setModalOpen(true) }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cliente.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {cliente.telefone && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Phone className="w-4 h-4" />
                      {cliente.telefone}
                    </div>
                  )}
                  {cliente.email && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Mail className="w-4 h-4" />
                      {cliente.email}
                    </div>
                  )}
                  {cliente.endereco && (
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <MapPin className="w-4 h-4" />
                      {cliente.endereco}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-text-muted">Veículos ({veiculosCliente.length})</span>
                    <button
                      onClick={() => { setSelectedCliente(cliente.id); setVeiculoModal(true) }}
                      className="text-xs text-primary hover:text-primary-dark font-medium"
                    >
                      + Adicionar
                    </button>
                  </div>
                  <div className="space-y-1">
                    {veiculosCliente.map(v => (
                      <div key={v.id} className="flex items-center gap-2 text-sm text-text">
                        <Car className="w-4 h-4 text-text-muted" />
                        <span>{v.placa}</span>
                        <span className="text-text-muted">-</span>
                        <span className="text-text-muted">{v.marca} {v.modelo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Cliente */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCliente ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">Nome *</label>
            <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Telefone *</label>
              <input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">CPF</label>
              <input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Email</label>
            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Endereço</label>
            <input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm">{editingCliente ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal Veículo */}
      <Modal isOpen={veiculoModal} onClose={() => setVeiculoModal(false)} title="Adicionar Veículo">
        <form onSubmit={handleAddVeiculo} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Placa *</label>
              <input value={veiculoForm.placa} onChange={e => setVeiculoForm({...veiculoForm, placa: e.target.value.toUpperCase()})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Ano *</label>
              <input type="number" value={veiculoForm.ano} onChange={e => setVeiculoForm({...veiculoForm, ano: Number(e.target.value)})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Marca *</label>
              <input value={veiculoForm.marca} onChange={e => setVeiculoForm({...veiculoForm, marca: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Modelo *</label>
              <input value={veiculoForm.modelo} onChange={e => setVeiculoForm({...veiculoForm, modelo: e.target.value})} required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Cor</label>
              <input value={veiculoForm.cor} onChange={e => setVeiculoForm({...veiculoForm, cor: e.target.value})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">KM Atual</label>
              <input type="number" value={veiculoForm.km} onChange={e => setVeiculoForm({...veiculoForm, km: Number(e.target.value)})}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setVeiculoModal(false)} className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm">Adicionar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
