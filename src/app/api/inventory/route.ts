import { NextRequest, NextResponse } from 'next/server';
import {
  getAllInventoryItems,
  searchInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/lib/db-server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const lowStock = searchParams.get('lowStock');

    let items;
    if (query) {
      items = await searchInventoryItems(query);
    } else if (lowStock === 'true') {
      const allItems = await getAllInventoryItems();
      items = allItems.filter(item => item.quantity <= item.minQuantity);
    } else {
      items = await getAllInventoryItems();
    }

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const item = await createInventoryItem({
      name: body.name,
      category: body.category,
      brand: body.brand,
      partNumber: body.partNumber,
      quantity: body.quantity || 0,
      minQuantity: body.minQuantity || 0,
      unitPrice: body.unitPrice || 0,
      location: body.location,
      notes: body.notes,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    const item = await updateInventoryItem(id, data);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
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
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await deleteInventoryItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}