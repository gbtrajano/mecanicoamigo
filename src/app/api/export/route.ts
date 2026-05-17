import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

export async function GET() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json(
        { error: 'Database file not found' },
        { status: 404 }
      );
    }

    const dbBuffer = fs.readFileSync(DB_PATH);
    const date = new Date().toISOString().split('T')[0];
    const fileName = `mechanic_backup_${date}.db`;

    return new NextResponse(dbBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': dbBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error exporting database:', error);
    return NextResponse.json(
      { error: 'Failed to export database' },
      { status: 500 }
    );
  }
}