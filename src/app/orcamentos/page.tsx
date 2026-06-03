'use client';

import { useEffect, useState } from 'react';
import { servicoDB, pecaDB } from '@/lib/local-db';
import type { Servico, Peca } from '@/types';
import { Plus, Check, Copy, Mail, Trash2 } from 'lucide-react';

export default function OrcamentosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null);
  const [selectedPecas, setSelectedPecas] = useState<Array<{ peca: Peca; quantidade: number }>>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, p] = await Promise.all([servicoDB.getAll(), pecaDB.getAll()]);
    setServicos(s);
    setPecas(p);
    setLoading(false);
  };

  const handleServicoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const servico = servicos.find(s => s.id === id) || null;
    setSelectedServico(servico);
    generateMessage();
  };

  const togglePeca = (peca: Peca) => {
    setSelectedPecas(prev => {
      const existing = prev.find(item => item.peca.id === peca.id);
      if (existing) {
        // remove
        return prev.filter(item => item.peca.id !== peca.id);
      } else {
        // add with quantity 1
        return [...prev, { peca, quantidade: 1 }];
      }
    });
    generateMessage();
  };

  const updateQuantity = (pecaId: string, quantidade: number) => {
    setSelectedPecas(prev => {
      return prev.map(item => 
        item.peca.id === pecaId ? { ...item, quantidade } : item
      );
    });
    generateMessage();
  };

  const generateMessage = () => {
    if (!selectedServico) {
      setMessage('Selecione um serviço para gerar o orçamento.');
      return;
    }

    let total = selectedServico.preco;
    const pecasText = selectedPecas.map(item => {
      const subtotal = item.peca.precoVenda * item.quantidade;
      total += subtotal;
      return `- ${item.peca.nome} x${item.quantidade} = R$ ${subtotal.toFixed(2)}`;
    }).join('\n');

    const msg = `Olá! Segue orçamento:\n\nServiço: ${selectedServico.nome} - R$ ${selectedServico.preco.toFixed(2)}\n\nPeças:\n${pecasText || 'Nenhuma peça selecionada'}\n\nTotal: R$ ${total.toFixed(2)}\n\nEste orçamento é válido por 7 dias.`;
    setMessage(msg);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message).then(() => {
      alert('Mensagem copiada para área de transferência!');
    });
  };

  const handleWhatsApp = () => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <div className="flex h-[70vh] items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Orçamentos</h1>
        <p className="text-sm text-text-muted mt-1">Crie orçamentos para enviar pelo WhatsApp</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Serviços selection */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text">Serviço</h2>
          </div>
          <div className="px-4 py-4">
            <select
              value={selectedServico?.id || ''}
              onChange={handleServicoChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Selecione um serviço...</option>
              {servicos.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nome} - R$ {s.preco.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Peças selection */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text">Peças</h2>
          </div>
          <div className="px-4 py-4">
            {pecas.length === 0 ? (
              <p className="text-text-muted text-center py-4">Nenhuma peça cadastrada</p>
            ) : (
              <div className="space-y-2">
                {pecas.map(peca => {
                  const selectedItem = selectedPecas.find(item => item.peca.id === peca.id);
                  const isSelected = !!selectedItem;
                  return (
                    <div key={peca.id} className="flex items-center justify-between p-2 rounded-lg border border-bg hover:bg-bg/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 flex-shrink-0">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Plus className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text">{peca.nome}</p>
                          <p className="text-xs text-text-muted">{peca.descricao || ''}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {isSelected && (
                            <>
                              <button
                                onClick={() => {
                                  const novaQtd = Math.max(1, (selectedItem?.quantidade || 1) - 1);
                                  updateQuantity(peca.id, novaQtd);
                                }}
                                className="p-1 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary"
                              >
                                <Trash2 className="w-3 h-3" /> {/* using minus? we'll use Trash2 for now, but ideally a minus */}
                              </button>
                              <span className="px-2">{selectedItem?.quantidade}</span>
                              <button
                                onClick={() => updateQuantity(peca.id, (selectedItem?.quantidade || 1) + 1)}
                                className="p-1 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-medium text-text">
                          R$ {peca.precoVenda.toFixed(2)}
                        </div>
                      </div>
                      {!isSelected && (
                        <button
                          onClick={() => togglePeca(peca)}
                          className="px-3 py-1 rounded-lg border border-primary text-primary text-xs hover:bg-primary/10"
                        >
                          Selecionar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message preview and actions */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text">Pré-visualização da Mensagem</h2>
        </div>
        <div className="px-4 py-4">
          {message ? (
            <>
              <div className="bg-bg p-3 rounded-lg font-mono text-sm text-text whitespace-pre-wrap">
                {message}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-text hover:bg-bg"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copiar
                </button>
                <button
                  onClick={handleWhatsApp}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white"
                >
                  <Mail className="w-4 h-4 mr-2" /> Enviar WhatsApp
                </button>
              </div>
            </>
          ) : (
            <p className="text-text-muted text-center py-4">Selecione um serviço para gerar a mensagem</p>
          )}
        </div>
      </div>
    </div>
  );
}