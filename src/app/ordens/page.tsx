'use client'

import { useEffect, useState } from 'react'
import { ordemDB, clienteDB, veiculoDB, servicoDB, pecaDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { OrdemServico, Cliente, Veiculo, Servico, Peca } from '@/types'
import { Plus, Search, Filter, Wrench, CheckCircle, Clock, XCircle, ChevronRight, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function OrdensPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [pecas, setPecas] = useState<Peca[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrdem, setEditingOrdem] = useState<OrdemServico | null>(null)
  const [formData, setFormData] = useState({
    clienteId: '', veiculoId: '', status: 'pendente' as OrdemServico['status'],
    observacoes: '', dataPrevisao: '',
    servicos: [] as { servicoId: string; quantidade: number; preco: number }[],
    pecas: [] as { pecaId: string; quantidade: number; preco: number }[]
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [o, c, v, s, p] = await Promise.all([
      ordemDB.getAll(), clienteDB.getAll(), veiculoDB.getAll(),
      servicoDB.getAll(), pecaDB.getAll()
    ])
    setOrdens(o.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setClientes(c); setVeiculos(v); setServicos(s); setPecas(p)
  }

  const filtered = ordens.filter(o => {
    const cliente = clientes.find(c => c.id === o.clienteId)
    const veiculo = veiculos.find(v => v.id === o.veiculoId)
    const matchSearch = !search || 
      cliente?.nome.toLowerCase().includes(search.toLowerCase()) ||
      veiculo?.placa.toLowerCase().includes(search.toLowerCase()) ||
      o.numero.includes(search)
    const matchStatus = filterStatus === 'todos' || o.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const valorServicos = formData.servicos.reduce((s, item) => s + item.preco * item.quantidade, 0)
    const valorPecas = formData.pecas.reduce((s, item) => s + item.preco * item.quantidade, 0)
    const valorTotal = valorServicos + valorPecas

    const ordemData = {
      numero: editingOrdem?.numero || `OS-${Date.now().toString().slice(-6)}`,
      clienteId: formData.clienteId,
      veiculoId: formData.veiculoId,
      status: formData.status,
      servicos: formData.servicos,
      pecas: formData.pecas,
      observacoes: formData.observacoes,
      valorTotal,
      dataEntrada: editingOrdem?.dataEntrada || new Date().toISOString(),
      dataPrevisao: formData.dataPrevisao || undefined,
      dataSaida: formData.status === 'concluida' ? new Date().toISOString() : undefined
    }

    if (editingOrdem) {
      await ordemDB.update({ ...editingOrdem, ...ordemData })
    } else {
      await ordemDB.add(ordemData)
    }

    setModalOpen(false)
    setEditingOrdem(null)
    setFormData({ clienteId: '', veiculoId: '', status: 'pendente', observacoes: '', dataPrevisao: '', servicos: [], pecas: [] })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta ordem?')) {
      await ordemDB.delete(id)
      loadData()
    }
  }

  const addServico = () => {
    setFormData(prev => ({
      ...prev,
      servicos: [...prev.servicos, { servicoId: '', quantidade: 1, preco: 0 }]
    }))
  }

  const addPeca = () => {
    setFormData(prev => ({
      ...prev,
      pecas: [...prev.pecas, { pecaId: '', quantidade: 1, preco: 0 }]
    }))
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4 text-warning" />
      case 'em_andamento': return <Wrench className="w-4 h-4 text-secondary-dark" />
      case 'concluida': return <CheckCircle className="w-4 h-4 text-success" />
      case 'cancelada': return <XCircle className="w-4 h-4 text-danger" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'em_andamento': return 'Em Andamento'
      case 'concluida': return 'Concluída'
      case 'cancelada': return 'Cancelada'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Ordens de Serviço</h1>
          <p className="text-sm text-text-muted mt-1">Gerencie todas as ordens da sua oficina</p>
        </div>
        <button
          onClick={() => { setEditingOrdem(null); setFormData({ clienteId: '', veiculoId: '', status: 'pendente', observacoes: '', dataPrevisao: '', servicos: [], pecas: [] }); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Nova Ordem
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por cliente, placa ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Nº</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Veículo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Entrada</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">
                    Nenhuma ordem encontrada
                  </td>
                </tr>
              ) : (
                filtered.map(ordem => {
                  const cliente = clientes.find(c => c.id === ordem.clienteId)
                  const veiculo = veiculos.find(v => v.id === ordem.veiculoId)
                  return (
                    <tr key={ordem.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{ordem.numero}</td>
                      <td className="px-4 py-3 text-sm text-text">{cliente?.nome || '—'}</td>
                      <td className="px-4 py-3 text-sm text-text">{veiculo ? `${veiculo.placa} - ${veiculo.modelo}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg border border-border">
                          {getStatusIcon(ordem.status)}
                          {getStatusLabel(ordem.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valorTotal)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {format(new Date(ordem.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setEditingOrdem(ordem); setFormData({ ...ordem, dataPrevisao: ordem.dataPrevisao || '' }); setModalOpen(true) }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ordem.id)}
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOrdem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Cliente *</label>
              <select
                value={formData.clienteId}
                onChange={(e) => setFormData({ ...formData, clienteId: e.target.value, veiculoId: '' })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Selecione...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Veículo *</label>
              <select
                value={formData.veiculoId}
                onChange={(e) => setFormData({ ...formData, veiculoId: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Selecione...</option>
                {veiculos.filter(v => v.clienteId === formData.clienteId).map(v => (
                  <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as OrdemServico['status'] })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Previsão de Entrega</label>
              <input
                type="date"
                value={formData.dataPrevisao}
                onChange={(e) => setFormData({ ...formData, dataPrevisao: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Serviços */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">Serviços</label>
              <button type="button" onClick={addServico} className="text-xs text-primary hover:text-primary-dark font-medium">
                + Adicionar Serviço
              </button>
            </div>
            {formData.servicos.map((s, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={s.servicoId}
                  onChange={(e) => {
                    const servico = servicos.find(sv => sv.id === e.target.value)
                    const newServicos = [...formData.servicos]
                    newServicos[i] = { ...s, servicoId: e.target.value, preco: servico?.preco || 0 }
                    setFormData({ ...formData, servicos: newServicos })
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-sm"
                >
                  <option value="">Selecione...</option>
                  {servicos.map(sv => <option key={sv.id} value={sv.id}>{sv.nome} - R$ {sv.preco.toFixed(2)}</option>)}
                </select>
                <input
                  type="number"
                  value={s.quantidade}
                  onChange={(e) => {
                    const newServicos = [...formData.servicos]
                    newServicos[i] = { ...s, quantidade: Number(e.target.value) }
                    setFormData({ ...formData, servicos: newServicos })
                  }}
                  min={1}
                  className="w-20 px-3 py-2 rounded-lg border border-border bg-bg text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, servicos: formData.servicos.filter((_, idx) => idx !== i) })}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Peças */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text">Peças</label>
              <button type="button" onClick={addPeca} className="text-xs text-primary hover:text-primary-dark font-medium">
                + Adicionar Peça
              </button>
            </div>
            {formData.pecas.map((p, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select
                  value={p.pecaId}
                  onChange={(e) => {
                    const peca = pecas.find(pc => pc.id === e.target.value)
                    const newPecas = [...formData.pecas]
                    newPecas[i] = { ...p, pecaId: e.target.value, preco: peca?.precoVenda || 0 }
                    setFormData({ ...formData, pecas: newPecas })
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-bg text-sm"
                >
                  <option value="">Selecione...</option>
                  {pecas.map(pc => <option key={pc.id} value={pc.id}>{pc.nome} - R$ {pc.precoVenda.toFixed(2)}</option>)}
                </select>
                <input
                  type="number"
                  value={p.quantidade}
                  onChange={(e) => {
                    const newPecas = [...formData.pecas]
                    newPecas[i] = { ...p, quantidade: Number(e.target.value) }
                    setFormData({ ...formData, pecas: newPecas })
                  }}
                  min={1}
                  className="w-20 px-3 py-2 rounded-lg border border-border bg-bg text-sm"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pecas: formData.pecas.filter((_, idx) => idx !== i) })}
                  className="p-2 text-danger hover:bg-danger/10 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Observações</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors"
            >
              {editingOrdem ? 'Salvar' : 'Criar Ordem'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
