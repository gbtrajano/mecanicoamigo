import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies() as unknown as { delete: (name: string) => void };
  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}