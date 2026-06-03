'use client';

import { useEffect, useState, useCallback } from 'react';
import { ordemDB, usuarioDB } from '@/lib/local-db';
import type { OrdemServico, Usuario } from '@/types';
import { Wrench, Clock, CheckCircle, XCircle, User, LogOut, ArrowRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhasOrdensPage() {
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [todosUsuarios, setTodosUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarOrdens = useCallback(async (usuarioLogado: Usuario) => {
    setLoading(true);
    const ordensList = await ordemDB.getAll();
    const usuarioOrdens = ordensList.filter(
      ordem => ordem.responsavelId === usuarioLogado.id
    ).sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime());

    setOrdens(usuarioOrdens);
    setLoading(false);
  }, []);

  const initData = useCallback(async () => {
    setLoading(true);
    try {
      const usuariosList = await usuarioDB.getAll();
      setTodosUsuarios(usuariosList);

      const savedId = localStorage.getItem('minhas_ordens_usuario_id');
      
      if (savedId) {
        const found = usuariosList.find(u => u.id === savedId);
        if (found) {
          setUsuario(found);
          await carregarOrdens(found);
          return;
        } else {
          localStorage.removeItem('minhas_ordens_usuario_id');
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [carregarOrdens]);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleSelectUsuario = (selecionado: Usuario) => {
    localStorage.setItem('minhas_ordens_usuario_id', selecionado.id);
    setUsuario(selecionado);
    carregarOrdens(selecionado);
  };

  const handleSair = () => {
    localStorage.removeItem('minhas_ordens_usuario_id');
    setUsuario(null);
    setOrdens([]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4 text-warning" />;
      case 'em_andamento': return <Wrench className="w-4 h-4 text-secondary-dark" />;
      case 'concluida': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'cancelada': return <XCircle className="w-4 h-4 text-danger" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_andamento': return 'Em Andamento';
      case 'concluida': return 'Concluída';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // TELA DE SELEÇÃO (QUANDO O SISTEMA NÃO SABE QUEM É O FUNCIONÁRIO)
  if (!usuario) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
           <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-2">Qual funcionário é você?</h1>
        <p className="text-text-muted mb-8 text-center max-w-md">
          Selecione o seu nome abaixo para ver as ordens de serviço atribuídas a você no momento.
        </p>

        {todosUsuarios.length === 0 ? (
          <div className="bg-warning/10 border border-warning/20 rounded-xl p-6 text-center max-w-md w-full">
            <p className="text-warning font-medium">Nenhum funcionário cadastrado.</p>
            <p className="text-sm text-text-muted mt-2">Vá até a aba "Equipe" para cadastrar os mecânicos e funcionários.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
            {todosUsuarios.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelectUsuario(u)}
                className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl hover:border-primary hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                    {u.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-text">{u.nome}</p>
                    <p className="text-xs text-text-muted capitalize">{u.papel}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-border group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TELA NORMAL DE ORDENS DO FUNCIONÁRIO
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Minhas Ordens de Serviço</h1>
          <p className="text-sm text-text-muted mt-1">
            Visualizando as ordens atribuídas a <span className="font-medium">{usuario.nome}</span>
          </p>
        </div>
        <button 
          onClick={handleSair}
          className="flex items-center gap-2 px-4 py-2 bg-bg border border-border rounded-lg text-text hover:bg-danger/10 hover:border-danger/20 hover:text-danger transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Trocar Funcionário
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-bg/50">
          <h2 className="font-semibold text-text">Ordens em andamento</h2>
          <span className="text-xs font-medium text-text-muted bg-surface px-2.5 py-1 rounded-md border border-border">
            Total: {ordens.length}
          </span>
        </div>
        <div className="px-4 py-4">
          {ordens.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <CheckCircle className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-text mb-1">Tudo limpo por aqui!</h3>
              <p className="text-text-muted text-sm max-w-sm mx-auto">
                Você não tem nenhuma ordem de serviço atribuída no momento. Bom trabalho!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ordens.map(ordem => (
                <div key={ordem.id} className="border border-border rounded-xl p-5 bg-bg/30 hover:bg-surface hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="font-bold text-lg text-text flex items-center gap-2">
                        {ordem.numero}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-border shadow-sm`}>
                        {getStatusIcon(ordem.status)}
                        {getStatusLabel(ordem.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50">
                      <p className="text-xs text-text-muted mb-0.5 uppercase tracking-wider font-semibold">Placa/Veículo</p>
                      <p className="font-medium text-text">{ordem.veiculoId || '—'}</p>
                    </div>
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50">
                      <p className="text-xs text-text-muted mb-0.5 uppercase tracking-wider font-semibold">Entrada</p>
                      <p className="font-medium text-text">
                        {format(new Date(ordem.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    
                    {ordem.dataPrevisao && (
                      <div className="bg-surface p-2.5 rounded-lg border border-border/50">
                        <p className="text-xs text-text-muted mb-0.5 uppercase tracking-wider font-semibold">Previsão</p>
                        <p className="font-medium text-text">
                          {format(new Date(ordem.dataPrevisao), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {ordem.observacoes && (
                    <div className="mt-4 p-3 bg-warning/5 border border-warning/10 rounded-lg">
                      <p className="font-semibold text-text text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-warning" /> Observações:
                      </p>
                      <p className="text-sm text-text-muted leading-relaxed">{ordem.observacoes}</p>
                    </div>
                  )}
                  
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}