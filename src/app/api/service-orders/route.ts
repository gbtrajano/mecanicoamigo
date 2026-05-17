import { NextRequest, NextResponse } from 'next/server';
import {
  getAllServiceOrders,
  getServiceOrderById,
  createServiceOrder,
  updateServiceOrder,
  deleteServiceOrder,
  getRecentServiceOrders,
  getNextOsNumber,
} from '@/lib/db-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const recent = searchParams.get('recent');
    const nextOsNumber = searchParams.get('nextOsNumber');
    const vehicleId = searchParams.get('vehicleId');

    if (id) {
      const serviceOrder = await getServiceOrderById(parseInt(id));
      if (!serviceOrder) {
        return NextResponse.json(
          { error: 'Service order not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(serviceOrder);
    }

    if (recent) {
      const orders = await getRecentServiceOrders(parseInt(recent) || 10);
      return NextResponse.json(orders);
    }

    if (nextOsNumber) {
      const nextNum = await getNextOsNumber();
      return NextResponse.json({ nextOsNumber: nextNum });
    }

    if (vehicleId) {
      const orders = await getAllServiceOrders();
      return NextResponse.json(orders.filter(o => o.vehicleId === vehicleId));
    }

    const orders = await getAllServiceOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching service orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const serviceOrder = await createServiceOrder({
      name: body.name || undefined,
      vehicleId: body.vehicleId,
      estimatedDelivery: body.estimatedDelivery,
      description: body.description,
      diagnostics: body.diagnostics,
      status: body.status || 'DRAFT',
      discount: body.discount || 0,
      items: body.items,
    });

    return NextResponse.json(serviceOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating service order:', error);
    return NextResponse.json(
      { error: 'Failed to create service order' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const serviceOrder = await updateServiceOrder(id, data);
    return NextResponse.json(serviceOrder);
  } catch (error) {
    console.error('Error updating service order:', error);
    return NextResponse.json(
      { error: 'Failed to update service order' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Service order ID is required' },
        { status: 400 }
      );
    }

    await deleteServiceOrder(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting service order:', error);
    return NextResponse.json(
      { error: 'Failed to delete service order' },
      { status: 500 }
    );
  }
}