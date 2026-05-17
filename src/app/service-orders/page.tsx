'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Plus,
  Search,
  ClipboardList,
  Printer,
  Edit,
  Trash2,
  X,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  ServiceOrderStatus,
  STATUS_LABELS,
  STATUS_TRANSITIONS,
  ServiceItemFormData,
} from '@/types';
import { calculateOSTotal } from '@/lib/db-utils';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  client: { name: string };
}

interface ServiceOrder {
  id: number;
  osNumber: number;
  name?: string;
  vehicleId: string;
  vehicle?: Vehicle;
  entryDate: string;
  estimatedDelivery?: string;
  description?: string;
  diagnostics?: string;
  status: ServiceOrderStatus;
  discount: number;
  items?: { id: number; type: string; name: string; quantity: number; unitPrice: number }[];
}

function ServiceOrdersContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<ServiceOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    vehicleId: '',
    estimatedDelivery: '',
    description: '',
    diagnostics: '',
    status: 'DRAFT' as ServiceOrderStatus,
    discount: 0,
    items: [] as ServiceItemFormData[],
  });
  const [nextOsNumber, setNextOsNumber] = useState(1);

  useEffect(() => {
    loadOrders();
    loadVehicles();
    loadNextOsNumber();
  }, [search, statusFilter]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
    }
    const id = searchParams.get('id');
    if (id) {
      loadOrderById(parseInt(id));
    }
  }, [searchParams]);

  async function loadOrders() {
    try {
      const url = '/api/service-orders';
      const res = await fetch(url);
      let data: ServiceOrder[] = await res.json();

      if (statusFilter) {
        data = data.filter((o) => o.status === statusFilter);
      }

      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVehicles() {
    try {
      const res = await fetch('/api/vehicles');
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  }

  async function loadNextOsNumber() {
    try {
      const res = await fetch('/api/service-orders?nextOsNumber=true');
      const data = await res.json();
      setNextOsNumber(data.nextOsNumber);
    } catch (error) {
      console.error('Error loading next OS number:', error);
    }
  }

  async function loadOrderById(id: number) {
    try {
      const res = await fetch(`/api/service-orders?id=${id}`);
      const data = await res.json();
      setViewOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    }
  }

  function openModal(order?: ServiceOrder) {
    if (order) {
      setEditingOrder(order);
      setFormData({
        name: order.name || '',
        vehicleId: order.vehicleId,
        estimatedDelivery: order.estimatedDelivery
          ? new Date(order.estimatedDelivery).toISOString().split('T')[0]
          : '',
        description: order.description || '',
        diagnostics: order.diagnostics || '',
        status: order.status as ServiceOrderStatus,
        discount: order.discount,
        items: order.items?.map((item) => ({
          type: item.type as 'PART' | 'SERVICE',
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      });
    } else {
      setEditingOrder(null);
      setFormData({
        name: '',
        vehicleId: vehicles[0]?.id || '',
        estimatedDelivery: '',
        description: '',
        diagnostics: '',
        status: 'DRAFT',
        discount: 0,
        items: [],
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        estimatedDelivery: formData.estimatedDelivery
          ? new Date(formData.estimatedDelivery)
          : undefined,
      };

      const url = editingOrder ? '/api/service-orders' : '/api/service-orders';
      const method = editingOrder ? 'PUT' : 'POST';
      const body = editingOrder ? { id: editingOrder.id, ...data } : data;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setIsModalOpen(false);
      loadOrders();
      loadNextOsNumber();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/service-orders?id=${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  }

  async function handleStatusChange(orderId: number, newStatus: ServiceOrderStatus) {
    try {
      await fetch('/api/service-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      loadOrders();
      if (viewOrder) {
        loadOrderById(viewOrder.id);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  function addItem() {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { type: 'SERVICE', name: '', quantity: 1, unitPrice: 0 },
      ],
    });
  }

  function updateItem(index: number, field: keyof ServiceItemFormData, value: string | number) {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  }

  function removeItem(index: number) {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'IN_PROGRESS':
        return 'default';
      case 'WAITING_PARTS':
        return 'warning';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.plate} - ${v.client.name}`,
  }));

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie as ordens de serviço</p>
        </div>
        <Button onClick={() => openModal()} disabled={vehicles.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Nova OS
        </Button>
      </div>

      {vehicles.length === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-5">
            <p className="text-sm text-amber-400">
              Adicione um veículo primeiro antes de criar ordens de serviço.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar OS..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'Todos os status' },
            ...statusOptions,
          ]}
          className="w-full md:w-[200px]"
        />
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma ordem de serviço encontrada</p>
          {vehicles.length > 0 && (
            <Button variant="outline" className="mt-4" onClick={() => openModal()}>
              Criar primeira OS
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setViewOrder(order)}
            >
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center flex-col">
                      <span className="text-lg font-mono font-bold text-primary">
                        #{order.osNumber}
                      </span>
                      {order.name && (
                        <span className="text-[8px] text-primary truncate max-w-[50px]" title={order.name}>
                          {order.name}
                        </span>
                      )}
                    </div>
                    <div>
                      {order.name && (
                        <h3 className="font-semibold">{order.name}</h3>
                      )}
                      <h3 className={`font-semibold ${order.name ? 'text-sm text-muted-foreground' : ''}`}>{order.vehicle?.client?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.vehicle?.plate} • {order.vehicle?.model}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Entrada: {new Date(order.entryDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusVariant(order.status)}>
                      {STATUS_LABELS[order.status]}
                    </Badge>
                    {order.items && order.items.length > 0 && (
                      <span className="text-sm font-mono">
                        R$ {calculateOSTotal(order.items as any, order.discount).toFixed(2)}
                      </span>
                    )}
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openModal(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(order.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrder ? `Editar OS #${editingOrder.osNumber}` : `Nova OS #${nextOsNumber}`}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingOrder ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome/Título da OS"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Revisão geral, Troca de óleo, etc."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Veículo"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              options={vehicleOptions}
              required
              disabled={!!editingOrder}
            />
            <Input
              label="Previsão de Entrega"
              name="estimatedDelivery"
              type="date"
              value={formData.estimatedDelivery}
              onChange={(e) =>
                setFormData({ ...formData, estimatedDelivery: e.target.value })
              }
            />
          </div>

          {editingOrder && (
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as ServiceOrderStatus,
                })
              }
              options={statusOptions}
            />
          )}

          <Textarea
            label="Descrição do Problema"
            name="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={2}
          />

          <Textarea
            label="Diagnóstico"
            name="diagnostics"
            value={formData.diagnostics}
            onChange={(e) =>
              setFormData({ ...formData, diagnostics: e.target.value })
            }
            rows={2}
          />

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Itens (Peças/Serviços)</label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusCircle className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row gap-2 p-3 bg-secondary rounded-lg"
              >
                <Select
                  value={item.type}
                  onChange={(e) => updateItem(index, 'type', e.target.value)}
                  options={[
                    { value: 'SERVICE', label: 'Serviço' },
                    { value: 'PART', label: 'Peça' },
                  ]}
                  className="w-full md:w-[100px]"
                />
                <Input
                  placeholder="Descrição"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Qtd"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, 'quantity', parseInt(e.target.value) || 1)
                  }
                  className="w-full md:w-[80px]"
                />
                <Input
                  type="number"
                  placeholder="Preço"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)
                  }
                  className="w-full md:w-[100px]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <MinusCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Input
            label="Desconto (R$)"
            name="discount"
            type="number"
            value={formData.discount}
            onChange={(e) =>
              setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })
            }
          />
        </form>
      </Modal>

      {/* View/Print Modal */}
      <Modal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        title={viewOrder?.name ? `${viewOrder.name} (OS #${viewOrder.osNumber})` : `OS #${viewOrder?.osNumber}`}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setViewOrder(null)}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </>
        }
      >
        {viewOrder && (
          <div className="space-y-6 print:space-y-4">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              {viewOrder.name && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Nome/Título</p>
                  <p className="font-semibold">{viewOrder.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-semibold">{viewOrder.vehicle?.client?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Veículo</p>
                <p className="font-semibold">
                  {viewOrder.vehicle?.plate} - {viewOrder.vehicle?.model}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de Entrada</p>
                <p className="font-semibold">
                  {new Date(viewOrder.entryDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {viewOrder.estimatedDelivery && (
                <div>
                  <p className="text-xs text-muted-foreground">Previsão de Entrega</p>
                  <p className="font-semibold">
                    {new Date(viewOrder.estimatedDelivery).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <p className="text-xs text-muted-foreground">Status:</p>
              <Badge variant={getStatusVariant(viewOrder.status)}>
                {STATUS_LABELS[viewOrder.status]}
              </Badge>
              {viewOrder.status !== 'COMPLETED' && viewOrder.status !== 'CANCELLED' && (
                <div className="flex gap-2">
                  {STATUS_TRANSITIONS[viewOrder.status].map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(viewOrder.id, status)}
                    >
                      {STATUS_LABELS[status]}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Description & Diagnostics */}
            {viewOrder.description && (
              <div>
                <p className="text-xs text-muted-foreground">Descrição do Problema</p>
                <p className="text-sm mt-1">{viewOrder.description}</p>
              </div>
            )}
            {viewOrder.diagnostics && (
              <div>
                <p className="text-xs text-muted-foreground">Diagnóstico</p>
                <p className="text-sm mt-1">{viewOrder.diagnostics}</p>
              </div>
            )}

            {/* Items */}
            {viewOrder.items && viewOrder.items.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Itens</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Tipo</th>
                      <th className="text-left py-2">Descrição</th>
                      <th className="text-center py-2">Qtd</th>
                      <th className="text-right py-2">Preço</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewOrder.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2">
                          <Badge variant="outline">{item.type === 'PART' ? 'Peça' : 'Serviço'}</Badge>
                        </td>
                        <td className="py-2">{item.name}</td>
                        <td className="text-center py-2">{item.quantity}</td>
                        <td className="text-right py-2">
                          R$ {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="text-right py-2">
                          R$ {(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex justify-end">
                  <div className="text-right space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Subtotal: R${' '}
                      {viewOrder.items
                        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                        .toFixed(2)}
                    </p>
                    {viewOrder.discount > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Desconto: -R$ {viewOrder.discount.toFixed(2)}
                      </p>
                    )}
                    <p className="text-lg font-bold">
                      Total: R$ {calculateOSTotal(viewOrder.items as any, viewOrder.discount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
        <p>
          Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode
          ser desfeita.
        </p>
      </Modal>
    </div>
  );
}

export default function ServiceOrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <ServiceOrdersContent />
    </Suspense>
  );
}