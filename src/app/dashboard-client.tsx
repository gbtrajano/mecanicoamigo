'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Car, ClipboardList, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/db-utils';
import { STATUS_LABELS } from '@/types';

interface Stats {
  totalClients: number;
  totalVehicles: number;
  activeOS: number;
  completedOSThisMonth: number;
}

interface ServiceOrder {
  id: number;
  osNumber: number;
  status: string;
  vehicle: {
    plate: string;
    model: string;
    client: {
      name: string;
    };
  };
  createdAt: string;
}

interface DashboardData {
  stats: Stats;
  recentOrders: ServiceOrder[];
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [dbSize, setDbSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [dashboardRes, dbInfoRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/db-info'),
        ]);

        const dashboardData = await dashboardRes.json();
        const dbInfo = await dbInfoRes.json();

        setData(dashboardData);
        setDbSize(dbInfo.size);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua oficina</p>
        </div>
        <div className="flex gap-2">
          <Link href="/clients?new=true">
            <Button size="sm" variant="secondary">
              <Plus className="w-4 h-4 mr-1" />
              Novo Cliente
            </Button>
          </Link>
          <Link href="/service-orders?new=true">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova OS
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{data?.stats.totalClients || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Veículos</p>
                <p className="text-2xl font-bold">{data?.stats.totalVehicles || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">OS Ativas</p>
                <p className="text-2xl font-bold">{data?.stats.activeOS || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Concluídas (Mês)</p>
                <p className="text-2xl font-bold">{data?.stats.completedOSThisMonth || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Info */}
      <Card className="border-dashed">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Car className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Armazenamento Local</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(dbSize)} utilizado • Dados armazenados no dispositivo
              </p>
            </div>
          </div>
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              Gerenciar
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Service Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Ordens de Serviço Recentes</CardTitle>
          <Link href="/service-orders">
            <Button variant="ghost" size="sm">
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!data?.recentOrders || data.recentOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma ordem de serviço ainda</p>
              <Link href="/service-orders?new=true">
                <Button variant="outline" size="sm" className="mt-3">
                  Criar primeira OS
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/service-orders?id=${order.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <span className="text-xs font-mono font-bold text-primary">
                        #{order.osNumber}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {order.vehicle.client.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.vehicle.plate} • {order.vehicle.model}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(order.status)}>
                    {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}