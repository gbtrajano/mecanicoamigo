'use client';

import { useState, useEffect, useCallback } from 'react';
import { usuarioDB } from '@/lib/local-db';
import type { Usuario } from '@/types';
import { Users, Plus, Trash2, Shield, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function EquipePage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [papel, setPapel] = useState<'funcionario' | 'admin'>('funcionario');

  const loadData = useCallback(async () => {
    try {
      const data = await usuarioDB.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    await usuarioDB.add({
      nome,
      email: email || undefined,
      telefone: telefone || undefined,
      papel
    });

    setNome('');
    setEmail('');
    setTelefone('');
    setPapel('funcionario');
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este funcionário? As ordens de serviço atribuídas a ele ficarão sem responsável.')) {
      await usuarioDB.delete(id);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Equipe</h1>
          <p className="text-sm text-text-muted mt-1">Gerencie os funcionários da sua oficina.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all transform hover:scale-105 shadow-sm shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Novo Funcionário
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg/50">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Funcionários Cadastrados
          </h2>
          <span className="text-xs text-text-muted bg-surface px-2 py-1 rounded-md border border-border">
            Total: {usuarios.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg/50 border-b border-border">
                <th className="p-4 font-medium text-text-muted text-sm">Nome</th>
                <th className="p-4 font-medium text-text-muted text-sm">Contato</th>
                <th className="p-4 font-medium text-text-muted text-sm">Papel</th>
                <th className="p-4 font-medium text-text-muted text-sm">Data de Cadastro</th>
                <th className="p-4 font-medium text-text-muted text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-border" />
                      <p>Nenhum funcionário cadastrado no sistema.</p>
                      <button 
                        onClick={() => setIsModalOpen(true)}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        Cadastre seu primeiro funcionário
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                usuarios.map(usuario => (
                  <tr key={usuario.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                          {usuario.nome.charAt(0)}
                        </div>
                        <span className="font-medium text-text">{usuario.nome}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {usuario.telefone && <div className="text-text">{usuario.telefone}</div>}
                      {usuario.email && <div>{usuario.email}</div>}
                      {!usuario.telefone && !usuario.email && <span>—</span>}
                    </td>
                    <td className="p-4">
                      {usuario.papel === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary-dark border border-secondary/20">
                          <Shield className="w-3 h-3" />
                          Administrador
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          <User className="w-3 h-3" />
                          Funcionário
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {format(new Date(usuario.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(usuario.id)}
                        className="p-2 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-lg transition-all"
                        title="Remover funcionário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar Funcionário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-md rounded-2xl border border-border shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Cadastrar Funcionário</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text transition-colors">
                &times;
              </button>
            </div>
            <form onSubmit={handleAddUsuario} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nome Completo <span className="text-danger">*</span></label>
                <input
                  required
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors"
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors"
                    placeholder="(11) 90000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors"
                    placeholder="joao@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1">Papel</label>
                <select
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as 'funcionario' | 'admin')}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                  <option value="funcionario">Mecânico / Funcionário</option>
                  <option value="admin">Administrador / Gerente</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-bg border border-border rounded-lg text-text hover:bg-border transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!nome}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors font-medium shadow-md shadow-primary/20 disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
