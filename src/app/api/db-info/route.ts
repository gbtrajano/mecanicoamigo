import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

export async function GET() {
  try {
    let size = 0;
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      size = stats.size;
    }
    return NextResponse.json({ size });
  } catch (error) {
    console.error('Error getting database info:', error);
    return NextResponse.json({ size: 0 }, { status: 500 });
  }
}