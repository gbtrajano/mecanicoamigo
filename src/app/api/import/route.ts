import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.db')) {
      return NextResponse.json(
        { error: 'Invalid file type. Expected .db file' },
        { status: 400 }
      );
    }

    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate SQLite header
    const header = buffer.slice(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      return NextResponse.json(
        { error: 'Invalid SQLite database file' },
        { status: 400 }
      );
    }

    // Create backup of current database
    const backupPath = path.join(process.cwd(), 'prisma', 'dev.db.backup');
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, backupPath);
    }

    // Write the new database file
    fs.writeFileSync(DB_PATH, buffer);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error importing database:', error);

    // Try to restore backup
    const backupPath = path.join(process.cwd(), 'prisma', 'dev.db.backup');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, DB_PATH);
    }

    return NextResponse.json(
      { error: 'Failed to import database' },
      { status: 500 }
    );
  }
}