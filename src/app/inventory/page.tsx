'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  partNumber?: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  location?: string;
  notes?: string;
}

const CATEGORIES = [
  'Filtros',
  'Óleos e Lubrificantes',
  'Amortecedores',
  'Faróis',
  'Lanternas',
  'Pastilhas de Freio',
  'Discos de Freio',
  'Baterias',
  'Correias',
  'Rodas e Pneus',
  'Diversos',
];

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    partNumber: '',
    quantity: 0,
    minQuantity: 0,
    unitPrice: 0,
    location: '',
    notes: '',
  });

  useEffect(() => {
    loadItems();
  }, [search, categoryFilter]);

  async function loadItems() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/inventory?${params}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(item?: InventoryItem) {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        brand: item.brand || '',
        partNumber: item.partNumber || '',
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        unitPrice: item.unitPrice,
        location: item.location || '',
        notes: item.notes || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        brand: '',
        partNumber: '',
        quantity: 0,
        minQuantity: 0,
        unitPrice: 0,
        location: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem ? { id: editingItem.id, ...formData } : formData;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setIsModalOpen(false);
      loadItems();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  const categories = [...new Set(items.map(i => i.category))];
  const lowStockItems = items.filter(i => i.quantity <= i.minQuantity);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Estoque</h1>
            <p className="text-muted-foreground">Gerencie peças e materiais</p>
          </div>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-amber-400 font-medium">
                {lowStockItems.length} item(s) com estoque baixo
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, marca ou código..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 rounded-lg border bg-background"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Total de Itens</p>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Estoque Baixo</p>
            <p className="text-2xl font-bold text-amber-500">{lowStockItems.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Categorias</p>
            <p className="text-2xl font-bold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">Valor Total</p>
            <p className="text-2xl font-bold">
              R$ {items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum item no estoque</p>
          <Button variant="outline" className="mt-4" onClick={() => openModal()}>
            Adicionar primeiro item
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card
              key={item.id}
              className={`hover:border-primary/50 transition-colors ${item.quantity <= item.minQuantity ? 'border-amber-500/50' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.quantity <= item.minQuantity && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openModal(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  {item.brand && (
                    <p className="text-muted-foreground">Marca: {item.brand}</p>
                  )}
                  {item.partNumber && (
                    <p className="text-muted-foreground">Código: {item.partNumber}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantidade:</span>
                    <span className={`font-semibold ${item.quantity <= item.minQuantity ? 'text-amber-500' : ''}`}>
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Preço unit.:</span>
                    <span className="font-semibold">R$ {item.unitPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Editar Item' : 'Novo Item'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingItem ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do Item"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Filtro de Óleo"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-background"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Selecione...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <Input
              label="Marca"
              name="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Ex: Bosch, Mobil, etc."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código/Part Number"
              name="partNumber"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              placeholder="Ex: FL-1234"
            />
            <Input
              label="Localização"
              name="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: Prateleira A-3"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Quantidade"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Qtd. Mínima (alerta)"
              name="minQuantity"
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
            />
            <Input
              label="Preço Unit. (R$)"
              name="unitPrice"
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <Textarea
            label="Observações"
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Excluir
            </Button>
          </>
        }
      >
        <p>Tem certeza que deseja excluir este item do estoque?</p>
      </Modal>
    </div>
  );
}