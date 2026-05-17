'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Car as CarIcon, User, Edit, Trash2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FUEL_TYPES } from '@/types';

interface Client {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  clientId: string;
  client?: Client;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuelType?: string;
  vin?: string;
  mileage?: number;
}

interface ServiceOrder {
  id: number;
  osNumber: number;
  status: string;
  createdAt: string;
}

function VehiclesContent() {
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<ServiceOrder[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuelType: '',
    vin: '',
    mileage: '',
  });

  useEffect(() => {
    loadVehicles();
    loadClients();
  }, [search]);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  async function loadVehicles() {
    try {
      const url = search ? `/api/vehicles?q=${encodeURIComponent(search)}` : '/api/vehicles';
      const res = await fetch(url);
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  async function loadVehicleHistory(vehicleId: string) {
    try {
      const res = await fetch(`/api/service-orders?vehicleId=${vehicleId}`);
      const data = await res.json();
      setVehicleHistory(data);
    } catch (error) {
      console.error('Error loading vehicle history:', error);
    }
  }

  function openModal(vehicle?: Vehicle) {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        clientId: vehicle.clientId,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color || '',
        fuelType: vehicle.fuelType || '',
        vin: vehicle.vin || '',
        mileage: vehicle.mileage?.toString() || '',
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        clientId: clients[0]?.id || '',
        plate: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        fuelType: '',
        vin: '',
        mileage: '',
      });
    }
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
      };

      const url = editingVehicle ? '/api/vehicles' : '/api/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      const body = editingVehicle ? { id: editingVehicle.id, ...data } : data;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setIsModalOpen(false);
      loadVehicles();
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  }

  function openHistory(vehicle: Vehicle) {
    setHistoryVehicle(vehicle);
    loadVehicleHistory(vehicle.id);
  }

  const fuelOptions = FUEL_TYPES.map((f) => ({ value: f, label: f }));
  const yearOptions = Array.from({ length: 30 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Veículos</h1>
          <p className="text-muted-foreground">Gerencie os veículos dos clientes</p>
        </div>
        <Button onClick={() => openModal()} disabled={clients.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Veículo
        </Button>
      </div>

      {clients.length === 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="p-5">
            <p className="text-sm text-amber-400">
              Adicione um cliente primeiro antes de cadastrar veículos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por placa, modelo ou cliente..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Vehicle List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum veículo encontrado</p>
          {clients.length > 0 && (
            <Button variant="outline" className="mt-4" onClick={() => openModal()}>
              Adicionar primeiro veículo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                      <CarIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-mono">{vehicle.plate}</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openHistory(vehicle)}
                      title="Histórico"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openModal(vehicle)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(vehicle.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{vehicle.client?.name}</span>
                  </div>
                  {vehicle.color && (
                    <Badge variant="outline" className="text-xs">
                      Cor: {vehicle.color}
                    </Badge>
                  )}
                  {vehicle.fuelType && (
                    <Badge variant="outline" className="text-xs">
                      {vehicle.fuelType}
                    </Badge>
                  )}
                  {vehicle.mileage && (
                    <span className="text-xs text-muted-foreground">
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  )}
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
        title={editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingVehicle ? 'Salvar' : 'Criar'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Cliente"
            name="clientId"
            value={formData.clientId}
            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Placa"
              name="plate"
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
              required
              placeholder="ABC-1234"
            />
            <Input
              label="Ano"
              name="year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Marca"
              name="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
              placeholder="Volkswagen"
            />
            <Input
              label="Modelo"
              name="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
              placeholder="Gol"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cor"
              name="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Branco"
            />
            <Select
              label="Combustível"
              name="fuelType"
              value={formData.fuelType}
              onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
              options={[{ value: '', label: 'Selecione...' }, ...fuelOptions]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Chassi (VIN)"
              name="vin"
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
              placeholder="9BWZZZ377VT000001"
            />
            <Input
              label="Quilometragem"
              name="mileage"
              type="number"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              placeholder="50000"
            />
          </div>
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
        <p>
          Tem certeza que deseja excluir este veículo? Esta ação não pode ser
          desfeita e também excluirá todas as ordens de serviço vinculadas.
        </p>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={!!historyVehicle}
        onClose={() => setHistoryVehicle(null)}
        title={`Histórico - ${historyVehicle?.plate}`}
        size="lg"
      >
        {vehicleHistory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma ordem de serviço encontrada para este veículo.
          </p>
        ) : (
          <div className="space-y-3">
            {vehicleHistory.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div>
                  <p className="font-mono font-semibold">OS #{order.osNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge
                  variant={
                    order.status === 'COMPLETED'
                      ? 'success'
                      : order.status === 'IN_PROGRESS'
                      ? 'default'
                      : order.status === 'WAITING_PARTS'
                      ? 'warning'
                      : order.status === 'CANCELLED'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <VehiclesContent />
    </Suspense>
  );
}