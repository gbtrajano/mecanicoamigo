import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  error?: string;
}

// Export database - reads the current .db file and returns it for download
export async function exportDatabase(): Promise<ExportResult> {
  try {
    // Check if file exists
    if (!fs.existsSync(DB_PATH)) {
      return { success: false, error: 'Database file not found' };
    }

    // Read the database file
    const dbBuffer = fs.readFileSync(DB_PATH);

    // Create a Blob for download
    const blob = new Blob([dbBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const date = new Date().toISOString().split('T')[0];
    const fileName = `mechanic_backup_${date}.db`;

    // Return data for the API response
    return {
      success: true,
      filePath: DB_PATH,
      fileName,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export database',
    };
  }
}

// Import database - validates and replaces the database file
export async function importDatabase(file: File): Promise<ImportResult> {
  try {
    // Validate file type
    if (!file.name.endsWith('.db')) {
      return { success: false, error: 'Invalid file type. Expected .db file' };
    }

    // Validate file size (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: 'File too large. Maximum size is 100MB' };
    }

    // Read the uploaded file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate SQLite header (first 16 bytes should be "SQLite format 3")
    const header = buffer.slice(0, 16).toString('utf8');
    if (!header.startsWith('SQLite format 3')) {
      return { success: false, error: 'Invalid SQLite database file' };
    }

    // Create backup of current database if it exists
    const backupPath = path.join(process.cwd(), 'prisma', 'dev.db.backup');
    if (fs.existsSync(DB_PATH)) {
      fs.copyFileSync(DB_PATH, backupPath);
    }

    // Write the new database file
    fs.writeFileSync(DB_PATH, buffer);

    return { success: true };
  } catch (error) {
    // If import fails, try to restore backup
    const backupPath = path.join(process.cwd(), 'prisma', 'dev.db.backup');
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, DB_PATH);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import database',
    };
  }
}

// Get database file path
export function getDatabaseFilePath(): string {
  return DB_PATH;
}

// Check database file size
export function getDatabaseFileSize(): number {
  try {
    if (fs.existsSync(DB_PATH)) {
      const stats = fs.statSync(DB_PATH);
      return stats.size;
    }
    return 0;
  } catch {
    return 0;
  }
}