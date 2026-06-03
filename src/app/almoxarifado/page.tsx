'use client';

import { useState, useEffect, useCallback } from 'react';
import { ferramentaDB, emprestimoDB, usuarioDB } from '@/lib/local-db';
import type { Ferramenta, EmprestimoFerramenta, Usuario } from '@/types';
import { Box, Plus, Wrench, Search, Users, AlertCircle, ArrowRightLeft, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AlmoxarifadoPage() {
  const [ferramentas, setFerramentas] = useState<Ferramenta[]>([]);
  const [emprestimos, setEmprestimos] = useState<EmprestimoFerramenta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmprestimoModalOpen, setIsEmprestimoModalOpen] = useState(false);
  const [selectedFerramenta, setSelectedFerramenta] = useState<Ferramenta | null>(null);
  
  // Forms state
  const [novoNome, setNovoNome] = useState('');
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  
  const [emprestimoUsuarioId, setEmprestimoUsuarioId] = useState('');
  
  const loadData = useCallback(async () => {
    const [ferrs, emps, users] = await Promise.all([
      ferramentaDB.getAll(),
      emprestimoDB.getAll(),
      usuarioDB.getAll()
    ]);
    setFerramentas(ferrs);
    setEmprestimos(emps);
    setUsuarios(users);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddFerramenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoCodigo) return;
    
    await ferramentaDB.add({
      nome: novoNome,
      codigo: novoCodigo,
      descricao: novaDescricao,
      status: 'disponivel'
    });
    
    setNovoNome('');
    setNovoCodigo('');
    setNovaDescricao('');
    setIsModalOpen(false);
    loadData();
  };

  const openEmprestimoModal = (ferramenta: Ferramenta) => {
    setSelectedFerramenta(ferramenta);
    setEmprestimoUsuarioId('');
    setIsEmprestimoModalOpen(true);
  };

  const handleEmprestar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFerramenta || !emprestimoUsuarioId) return;
    
    await emprestimoDB.add({
      ferramentaId: selectedFerramenta.id,
      usuarioId: emprestimoUsuarioId,
      dataEmprestimo: new Date().toISOString(),
      status: 'ativo'
    });
    
    await ferramentaDB.update({
      ...selectedFerramenta,
      status: 'emprestada'
    });
    
    setIsEmprestimoModalOpen(false);
    loadData();
  };
  
  const handleDevolver = async (ferramenta: Ferramenta) => {
    const ativoEmprestimo = emprestimos.find(e => e.ferramentaId === ferramenta.id && e.status === 'ativo');
    if (ativoEmprestimo) {
      await emprestimoDB.update({
        ...ativoEmprestimo,
        status: 'devolvido',
        dataDevolucao: new Date().toISOString()
      });
      
      await ferramentaDB.update({
        ...ferramenta,
        status: 'disponivel'
      });
      
      loadData();
    }
  };
  
  const getMutuario = (ferramentaId: string) => {
    const ativoEmprestimo = emprestimos.find(e => e.ferramentaId === ferramentaId && e.status === 'ativo');
    if (!ativoEmprestimo) return null;
    
    const usuario = usuarios.find(u => u.id === ativoEmprestimo.usuarioId);
    return usuario ? usuario.nome : 'Desconhecido';
  };

  const disponiveisCount = ferramentas.filter(f => f.status === 'disponivel').length;
  const emprestadasCount = ferramentas.filter(f => f.status === 'emprestada').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Controle de Almoxarifado</h1>
          <p className="text-sm text-text-muted mt-1">Gerencie suas ferramentas e empréstimos para funcionários.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Nova Ferramenta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Box className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Total de Ferramentas</p>
            <p className="text-2xl font-bold text-text">{ferramentas.length}</p>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Disponíveis</p>
            <p className="text-2xl font-bold text-text">{disponiveisCount}</p>
          </div>
        </div>
        
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Emprestadas</p>
            <p className="text-2xl font-bold text-text">{emprestadasCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Inventário de Ferramentas
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar ferramenta..." 
              className="pl-9 pr-4 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-primary text-text transition-colors w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="p-4 font-medium text-text-muted text-sm">Código</th>
                <th className="p-4 font-medium text-text-muted text-sm">Ferramenta</th>
                <th className="p-4 font-medium text-text-muted text-sm">Status</th>
                <th className="p-4 font-medium text-text-muted text-sm">Responsável Atual</th>
                <th className="p-4 font-medium text-text-muted text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ferramentas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-3">
                      <Box className="w-12 h-12 text-border" />
                      <p>Nenhuma ferramenta cadastrada no almoxarifado ainda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ferramentas.map(ferramenta => (
                  <tr key={ferramenta.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-text">{ferramenta.codigo}</td>
                    <td className="p-4 text-sm text-text">
                      <div className="font-medium">{ferramenta.nome}</div>
                      {ferramenta.descricao && <div className="text-xs text-text-muted mt-0.5">{ferramenta.descricao}</div>}
                    </td>
                    <td className="p-4">
                      {ferramenta.status === 'disponivel' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Disponível
                        </span>
                      )}
                      {ferramenta.status === 'emprestada' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                          <Clock className="w-3.5 h-3.5" />
                          Emprestada
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text">
                      {ferramenta.status === 'emprestada' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold uppercase">
                            {getMutuario(ferramenta.id)?.charAt(0)}
                          </div>
                          <span className="font-medium">{getMutuario(ferramenta.id)}</span>
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {ferramenta.status === 'disponivel' && (
                        <button 
                          onClick={() => openEmprestimoModal(ferramenta)}
                          className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" /> Emprestar
                        </button>
                      )}
                      {ferramenta.status === 'emprestada' && (
                        <button 
                          onClick={() => handleDevolver(ferramenta)}
                          className="px-3 py-1.5 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Receber de volta
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Ferramenta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Cadastrar Nova Ferramenta</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddFerramenta} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Código da Ferramenta</label>
                <input
                  required
                  type="text"
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: FUR-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nome</label>
                <input
                  required
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: Furadeira Bosch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Descrição (Opcional)</label>
                <textarea
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2 text-text focus:outline-none focus:border-primary transition-colors resize-none h-24"
                  placeholder="Detalhes sobre a ferramenta..."
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-bg border border-border rounded-lg text-text hover:bg-border transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-md shadow-primary/20"
                >
                  Salvar Ferramenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Emprestar Ferramenta */}
      {isEmprestimoModalOpen && selectedFerramenta && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text flex items-center gap-2">
                 <ArrowRightLeft className="w-5 h-5 text-primary" />
                 Emprestar Ferramenta
              </h2>
              <button onClick={() => setIsEmprestimoModalOpen(false)} className="text-text-muted hover:text-text">
                &times;
              </button>
            </div>
            <form onSubmit={handleEmprestar} className="p-6 space-y-4">
              
              <div className="bg-bg/50 p-4 rounded-lg border border-border flex gap-4 items-center">
                 <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-primary" />
                 </div>
                 <div>
                    <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-0.5">Ferramenta Selecionada</p>
                    <p className="font-bold text-text text-base leading-tight">{selectedFerramenta.nome}</p>
                    <p className="text-xs text-text-muted mt-1">{selectedFerramenta.codigo}</p>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1 flex items-center gap-1.5">
                   <Users className="w-4 h-4 text-primary" />
                   Para qual funcionário?
                </label>
                <select
                  required
                  value={emprestimoUsuarioId}
                  onChange={(e) => setEmprestimoUsuarioId(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Selecione na lista...</option>
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nome} ({u.papel})</option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEmprestimoModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-text hover:bg-border transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!emprestimoUsuarioId}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Empréstimo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
