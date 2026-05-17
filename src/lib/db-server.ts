import prisma from './prisma';

// Dashboard statistics
export async function getDashboardStats(): Promise<{
  totalClients: number;
  totalVehicles: number;
  activeOS: number;
  completedOSThisMonth: number;
}> {
  const [totalClients, totalVehicles, activeOS, completedOSThisMonth] =
    await Promise.all([
      prisma.client.count(),
      prisma.vehicle.count(),
      prisma.serviceOrder.count({
        where: {
          status: { in: ['DRAFT', 'IN_PROGRESS', 'WAITING_PARTS'] },
        },
      }),
      prisma.serviceOrder.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

  return {
    totalClients,
    totalVehicles,
    activeOS,
    completedOSThisMonth,
  };
}

// Client operations
export async function getAllClients() {
  return prisma.client.findMany({
    orderBy: { name: 'asc' },
    include: { vehicles: true },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: { vehicles: true },
  });
}

export async function createClient(data: {
  name: string;
  phone?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  notes?: string;
}) {
  return prisma.client.create({ data });
}

export async function updateClient(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    cpfCnpj?: string;
    address?: string;
    notes?: string;
  }
) {
  return prisma.client.update({ where: { id }, data });
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
}

export async function searchClients(query: string) {
  return prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
        { cpfCnpj: { contains: query } },
      ],
    },
    orderBy: { name: 'asc' },
    include: { vehicles: true },
  });
}

// Vehicle operations
export async function getAllVehicles() {
  return prisma.vehicle.findMany({
    orderBy: [{ plate: 'asc' }],
    include: { client: true },
  });
}

export async function getVehicleById(id: string) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { client: true },
  });
}

export async function createVehicle(data: {
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  fuelType?: string;
  vin?: string;
  mileage?: number;
}) {
  return prisma.vehicle.create({ data });
}

export async function updateVehicle(
  id: string,
  data: {
    clientId?: string;
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    fuelType?: string;
    vin?: string;
    mileage?: number;
  }
) {
  return prisma.vehicle.update({ where: { id }, data });
}

export async function deleteVehicle(id: string) {
  await prisma.vehicle.delete({ where: { id } });
}

export async function searchVehicles(query: string) {
  return prisma.vehicle.findMany({
    where: {
      OR: [
        { plate: { contains: query } },
        { brand: { contains: query } },
        { model: { contains: query } },
        { vin: { contains: query } },
        { client: { name: { contains: query } } },
      ],
    },
    orderBy: { plate: 'asc' },
    include: { client: true },
  });
}

export async function getVehiclesByClient(clientId: string) {
  return prisma.vehicle.findMany({
    where: { clientId },
    orderBy: { plate: 'asc' },
  });
}

// Service Order operations
export async function getAllServiceOrders() {
  return prisma.serviceOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vehicle: { include: { client: true } },
      items: true,
    },
  });
}

export async function getServiceOrderById(id: number) {
  return prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { client: true } },
      items: true,
    },
  });
}

export async function createServiceOrder(data: {
  name?: string;
  vehicleId: string;
  estimatedDelivery?: Date;
  description?: string;
  diagnostics?: string;
  status?: string;
  discount?: number;
  items?: {
    type: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }[];
}) {
  const { items, ...orderData } = data;

  // Get next osNumber
  const nextNumber = await getNextOsNumber();

  return prisma.serviceOrder.create({
    data: {
      ...orderData,
      osNumber: nextNumber,
      items: items
        ? {
            create: items,
          }
        : undefined,
    },
    include: {
      vehicle: { include: { client: true } },
      items: true,
    },
  });
}

export async function updateServiceOrder(
  id: number,
  data: {
    name?: string;
    vehicleId?: string;
    estimatedDelivery?: Date;
    description?: string;
    diagnostics?: string;
    status?: string;
    discount?: number;
    items?: {
      type: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }[];
  }
) {
  const { items, ...orderData } = data;

  if (items) {
    await prisma.serviceItem.deleteMany({ where: { serviceOrderId: id } });
  }

  return prisma.serviceOrder.update({
    where: { id },
    data: {
      ...orderData,
      items: items
        ? {
            create: items,
          }
        : undefined,
    },
    include: {
      vehicle: { include: { client: true } },
      items: true,
    },
  });
}

export async function deleteServiceOrder(id: number) {
  await prisma.serviceOrder.delete({ where: { id } });
}

export async function getRecentServiceOrders(limit: number = 10) {
  return prisma.serviceOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      vehicle: { include: { client: true } },
      items: true,
    },
  });
}

export async function getServiceOrdersByVehicle(vehicleId: string) {
  return prisma.serviceOrder.findMany({
    where: { vehicleId },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
}

export async function getNextOsNumber(): Promise<number> {
  const lastOrder = await prisma.serviceOrder.findFirst({
    orderBy: { osNumber: 'desc' },
    select: { osNumber: true },
  });

  return (lastOrder?.osNumber || 0) + 1;
}

// Inventory operations
export async function getAllInventoryItems() {
  return prisma.inventoryItem.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
}

export async function searchInventoryItems(query: string) {
  return prisma.inventoryItem.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { brand: { contains: query } },
        { partNumber: { contains: query } },
        { category: { contains: query } },
      ],
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
}

export async function createInventoryItem(data: {
  name: string;
  category: string;
  brand?: string;
  partNumber?: string;
  quantity?: number;
  minQuantity?: number;
  unitPrice?: number;
  location?: string;
  notes?: string;
}) {
  return prisma.inventoryItem.create({ data });
}

export async function updateInventoryItem(
  id: string,
  data: {
    name?: string;
    category?: string;
    brand?: string;
    partNumber?: string;
    quantity?: number;
    minQuantity?: number;
    unitPrice?: number;
    location?: string;
    notes?: string;
  }
) {
  return prisma.inventoryItem.update({ where: { id }, data });
}

export async function deleteInventoryItem(id: string) {
  await prisma.inventoryItem.delete({ where: { id } });
}

export async function getLowStockItems() {
  return prisma.inventoryItem.findMany({
    where: {
      quantity: { lte: prisma.inventoryItem.fields.minQuantity },
    },
    orderBy: { quantity: 'asc' },
  });
}