'use client'

import { useEffect, useState } from 'react'
import { notaFiscalDB, ordemDB, clienteDB } from '@/lib/local-db'
import Modal from '@/components/Modal'
import type { NotaFiscal, OrdemServico, Cliente } from '@/types'
import { Plus, Search, Receipt, Trash2, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function NotasFiscaisPage() {
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [ordens, setOrdens] = useState<OrdemServico[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null)
  const [formData, setFormData] = useState<{
    numero: string
    tipo: 'NF-e' | 'NFC-e' | 'NFS-e'
    ordemId: string
    clienteId: string
    valor: number
    status: 'emitida' | 'cancelada'
    chaveAcesso: string
  }>({
    numero: '',
    tipo: 'NF-e',
    ordemId: '',
    clienteId: '',
    valor: 0,
    status: 'emitida',
    chaveAcesso: ''
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const [n, o, c] = await Promise.all([notaFiscalDB.getAll(), ordemDB.getAll(), clienteDB.getAll()])
    setNotas(n.sort((a, b) => new Date(b.dataEmissao).getTime() - new Date(a.dataEmissao).getTime()))
    setOrdens(o)
    setClientes(c)
  }

  const filtered = notas.filter(n => {
    const cliente = clientes.find(c => c.id === n.clienteId)
    return !search || n.numero.includes(search) || (cliente?.nome.toLowerCase().includes(search.toLowerCase()) ?? false)
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ordemSelecionada = ordens.find(o => o.id === formData.ordemId)
    const data = {
      ...formData,
      valor: ordemSelecionada?.valorTotal || formData.valor,
      dataEmissao: editingNota?.dataEmissao || new Date().toISOString()
    }
    if (editingNota) {
      await notaFiscalDB.update({ ...editingNota, ...data })
    } else {
      await notaFiscalDB.add(data)
    }
    setModalOpen(false)
    setEditingNota(null)
    setFormData({ numero: '', tipo: 'NF-e', ordemId: '', clienteId: '', valor: 0, status: 'emitida', chaveAcesso: '' })
    loadData()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      await notaFiscalDB.delete(id)
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Notas Fiscais</h1>
          <p className="text-sm text-text-muted mt-1">Emissão de NF-e, NFC-e e NFS-e</p>
        </div>
        <button
          onClick={() => {
            setEditingNota(null)
            setFormData({ numero: '', tipo: 'NF-e', ordemId: '', clienteId: '', valor: 0, status: 'emitida', chaveAcesso: '' })
            setModalOpen(true)
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Emitir Nota
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Nº</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Emissão</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">
                    Nenhuma nota fiscal encontrada
                  </td>
                </tr>
              ) : (
                filtered.map(n => {
                  const cliente = clientes.find(c => c.id === n.clienteId)
                  return (
                    <tr key={n.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{n.numero}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Receipt className="w-3 h-3" />
                          {n.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text">{cliente?.nome || '—'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n.valor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-muted">
                        {format(new Date(n.dataEmissao), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          n.status === 'emitida' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {n.status === 'emitida' ? 'Emitida' : 'Cancelada'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingNota(n)
                              setFormData({
                                numero: n.numero,
                                tipo: n.tipo,
                                ordemId: n.ordemId,
                                clienteId: n.clienteId,
                                valor: n.valor,
                                status: n.status,
                                chaveAcesso: n.chaveAcesso || ''
                              })
                              setModalOpen(true)
                            }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingNota ? 'Editar Nota Fiscal' : 'Emitir Nota Fiscal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Número *</label>
              <input
                value={formData.numero}
                onChange={e => setFormData({ ...formData, numero: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Tipo *</label>
              <select
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value as 'NF-e' | 'NFC-e' | 'NFS-e' })}
                required
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="NF-e">NF-e (Nota Fiscal Eletrônica)</option>
                <option value="NFC-e">NFC-e (Cupom Fiscal)</option>
                <option value="NFS-e">NFS-e (Nota de Serviço)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Ordem de Serviço *</label>
            <select
              value={formData.ordemId}
              onChange={e => {
                const ordemSelecionada = ordens.find(o => o.id === e.target.value)
                setFormData({
                  ...formData,
                  ordemId: e.target.value,
                  clienteId: ordemSelecionada?.clienteId || '',
                  valor: ordemSelecionada?.valorTotal || 0
                })
              }}
              required
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Selecione...</option>
              {ordens.map(o => {
                const cliente = clientes.find(c => c.id === o.clienteId)
                return (
                  <option key={o.id} value={o.id}>
                    {o.numero} - {cliente?.nome || 'Sem cliente'} (R$ {o.valorTotal.toFixed(2)})
                  </option>
                )
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              value={formData.valor}
              onChange={e => setFormData({ ...formData, valor: Number(e.target.value) })}
              readOnly
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg/50 text-sm text-text-muted"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">Chave de Acesso</label>
            <input
              value={formData.chaveAcesso}
              onChange={e => setFormData({ ...formData, chaveAcesso: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-text hover:bg-bg text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm"
            >
              {editingNota ? 'Salvar' : 'Emitir'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
