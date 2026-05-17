import { NextResponse } from 'next/server';
import { getDashboardStats, getRecentServiceOrders } from '@/lib/db-server';

export async function GET() {
  try {
    const [stats, recentOrders] = await Promise.all([
      getDashboardStats(),
      getRecentServiceOrders(5),
    ]);

    return NextResponse.json({
      stats,
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}