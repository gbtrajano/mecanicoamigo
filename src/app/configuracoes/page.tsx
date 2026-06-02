'use client'

import { useState } from 'react'
import { exportarDados, importarDados } from '@/lib/local-db'
import { Download, Upload, Database, Settings, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ConfiguracoesPage() {
  const [nomeOficina, setNomeOficina] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [endereco, setEndereco] = useState('')
  const [telefone, setTelefone] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [tipoMensagem, setTipoMensagem] = useState<'success' | 'error'>('success')

  const handleExportar = async () => {
    try {
      const dados = await exportarDados()
      const blob = new Blob([dados], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-oficina-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMensagem('Backup exportado com sucesso!')
      setTipoMensagem('success')
    } catch {
      setMensagem('Erro ao exportar backup')
      setTipoMensagem('error')
    }
    setTimeout(() => setMensagem(''), 3000)
  }

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      await importarDados(text)
      setMensagem('Dados importados com sucesso!')
      setTipoMensagem('success')
    } catch {
      setMensagem('Erro ao importar dados. Verifique o arquivo.')
      setTipoMensagem('error')
    }
    setTimeout(() => setMensagem(''), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Configurações</h1>
        <p className="text-sm text-text-muted mt-1">Personalize e gerencie seus dados</p>
      </div>

      {mensagem && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${tipoMensagem === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
          {tipoMensagem === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <p className="text-sm font-medium">{mensagem}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dados da Oficina */}
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-text">Dados da Oficina</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Nome da Oficina</label>
              <input value={nomeOficina} onChange={e => setNomeOficina(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">CNPJ</label>
              <input value={cnpj} onChange={e => setCnpj(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Endereço</label>
              <input value={endereco} onChange={e => setEndereco(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Telefone</label>
              <input value={telefone} onChange={e => setTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <button className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg transition-colors text-sm font-medium">
              Salvar Configurações
            </button>
          </div>
        </div>

        {/* Backup e Dados */}
        <div className="bg-surface rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-secondary-dark" />
            <h3 className="font-semibold text-text">Backup e Dados</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-bg rounded-lg">
              <p className="text-sm font-medium text-text mb-1">Exportar Dados</p>
              <p className="text-xs text-text-muted mb-3">Faça backup de todos os seus dados em formato JSON</p>
              <button onClick={handleExportar}
                className="flex items-center gap-2 bg-success hover:bg-success/80 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Exportar Backup
              </button>
            </div>
            <div className="p-4 bg-bg rounded-lg">
              <p className="text-sm font-medium text-text mb-1">Importar Dados</p>
              <p className="text-xs text-text-muted mb-3">Restaure seus dados a partir de um arquivo de backup</p>
              <label className="flex items-center gap-2 bg-secondary hover:bg-secondary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer inline-flex">
                <Upload className="w-4 h-4" />
                Importar Backup
                <input type="file" accept=".json" onChange={handleImportar} className="hidden" />
              </label>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text">Atenção</p>
                  <p className="text-xs text-text-muted">Seus dados são armazenados localmente no navegador. Faça backups regularmente para não perder informações.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
