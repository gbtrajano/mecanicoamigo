import { NextRequest, NextResponse } from 'next/server';
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  getVehiclesByClient,
} from '@/lib/db-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const clientId = searchParams.get('clientId');

    let vehicles;
    if (clientId) {
      vehicles = await getVehiclesByClient(clientId);
    } else if (query) {
      vehicles = await searchVehicles(query);
    } else {
      vehicles = await getAllVehicles();
    }

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const vehicle = await createVehicle({
      clientId: body.clientId,
      plate: body.plate,
      brand: body.brand,
      model: body.model,
      year: body.year,
      color: body.color,
      fuelType: body.fuelType,
      vin: body.vin,
      mileage: body.mileage,
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const vehicle = await updateVehicle(id, data);
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle' },
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
        { error: 'Vehicle ID is required' },
        { status: 400 }
      );
    }

    await deleteVehicle(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle' },
      { status: 500 }
    );
  }
}