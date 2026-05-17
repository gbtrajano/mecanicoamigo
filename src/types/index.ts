// Types for the Auto Repair Shop Management System

export interface Client {
  id: string;
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
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
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceOrderStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceItem {
  id: number;
  serviceOrderId: number;
  type: 'PART' | 'SERVICE';
  name: string;
  quantity: number;
  unitPrice: number;
  createdAt: Date;
}

export interface ServiceOrder {
  id: number;
  osNumber: number;
  vehicleId: string;
  vehicle?: Vehicle;
  entryDate: Date;
  estimatedDelivery?: Date;
  description?: string;
  diagnostics?: string;
  status: ServiceOrderStatus;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  items?: ServiceItem[];
}

export interface DashboardStats {
  totalClients: number;
  totalVehicles: number;
  activeOS: number;
  completedOSThisMonth: number;
}

// Form types for creating/updating entities
export interface ClientFormData {
  name: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  notes?: string;
}

export interface VehicleFormData {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuelType?: string;
  vin?: string;
  mileage?: number;
}

export interface ServiceOrderFormData {
  vehicleId: string;
  estimatedDelivery?: Date;
  description?: string;
  diagnostics?: string;
  status: ServiceOrderStatus;
  discount: number;
  items: ServiceItemFormData[];
}

export interface ServiceItemFormData {
  type: 'PART' | 'SERVICE';
  name: string;
  quantity: number;
  unitPrice: number;
}

// Status display mapping
export const STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  DRAFT: 'Rascunho',
  IN_PROGRESS: 'Em Andamento',
  WAITING_PARTS: 'Aguardando Peças',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLORS: Record<ServiceOrderStatus, string> = {
  DRAFT: 'status-draft',
  IN_PROGRESS: 'status-in-progress',
  WAITING_PARTS: 'status-waiting',
  COMPLETED: 'status-completed',
  CANCELLED: 'status-cancelled',
};

// Fuel type options
export const FUEL_TYPES = [
  'Gasolina',
  'Etanol',
  'Diesel',
  'Flex',
  'Elétrico',
  'Híbrido',
] as const;

// OS Status workflow transitions
export const STATUS_TRANSITIONS: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  DRAFT: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['WAITING_PARTS', 'COMPLETED', 'CANCELLED'],
  WAITING_PARTS: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: ['DRAFT'],
};