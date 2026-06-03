'use client';

import { useEffect, useState, useCallback } from 'react';
import { ordemDB, usuarioDB } from '@/lib/local-db';
import type { OrdemServico, Usuario } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Wrench, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MinhasOrdensPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!authUser?.email) {
      setLoading(false);
      return;
    }

    const [usuarios, ordensList] = await Promise.all([
      usuarioDB.getAll(),
      ordemDB.getAll()
    ]);

    const localUsuario = usuarios.find(u => u.email === authUser.email);
    
    if (localUsuario) {
      setUsuario(localUsuario);
      const usuarioOrdens = ordensList.filter(
        ordem => ordem.responsavelId === localUsuario.id
      ).sort((a, b) => new Date(b.dataEntrada).getTime() - new Date(a.dataEntrada).getTime());
  
      setOrdens(usuarioOrdens);
    }
    setLoading(false);
  }, [authUser]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

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

  if (!usuario) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <p className="text-text-muted">Nenhum usuário encontrado. Por favor, cadastre funcionários primeiro.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Minhas Ordens de Serviço</h1>
          <p className="text-sm text-text-muted mt-1">
            Ordens atribuídas a <span className="font-medium">{usuario.nome}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <span className="text-sm text-text">{usuario.nome}</span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text">Ordens Atribuídas</h2>
        </div>
        <div className="px-4 py-4">
          {ordens.length === 0 ? (
            <p className="text-text-muted text-center py-8">
              Nenhuma ordem atribuída a você no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {ordens.map(ordem => (
                <div key={ordem.id} className="border border-border rounded-lg p-4 hover:bg-bg/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <h2 className="font-semibold text-text">{ordem.numero}</h2>
                      <p className="text-sm text-text-muted">
                        Cliente: {ordem.clienteId ? 'Carregando...' : '—'} {/*
                          We could fetch client name, but for simplicity we'll show ID or fetch in loadData
                        */}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-bg border border-border`}>
                        {getStatusIcon(ordem.status)}
                        {getStatusLabel(ordem.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-muted">Veículo ID:</p>
                      <p className="font-medium text-text">{ordem.veiculoId}</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Data de Entrada:</p>
                      <p className="font-medium text-text">
                        {format(new Date(ordem.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    {ordem.dataPrevisao && (
                      <div>
                        <p className="text-text-muted">Previsão:</p>
                        <p className="font-medium text-text">
                          {format(new Date(ordem.dataPrevisao), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                    {ordem.dataSaida && (
                      <div>
                        <p className="text-text-muted">Saída:</p>
                        <p className="font-medium text-text">
                          {format(new Date(ordem.dataSaida), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {ordem.observacoes && (
                    <div className="mt-3">
                      <p className="font-medium text-text mb-1">Observações:</p>
                      <p className="text-text-muted">{ordem.observacoes}</p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Valor Total:</span>
                      <span className="font-medium text-text">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valorTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}