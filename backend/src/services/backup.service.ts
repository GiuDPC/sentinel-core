import { prisma } from '../config/prisma.js';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { AppError } from '../utils/app-error.js';

const execAsync = util.promisify(exec);
const RAW_DB_URL = process.env.DATABASE_URL || '';
// pg_dump y psql no soportan el parámetro '?schema=public' de Prisma, hay que sacarlo
const DB_URL = RAW_DB_URL.split('?')[0];

const BACKUPS_DIR = path.resolve(process.cwd(), 'backups');

// Asegurar que el directorio existe
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

export interface BackupMetadata {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

async function listBackups(): Promise<BackupMetadata[]> {
  const files = fs.readdirSync(BACKUPS_DIR);
  const sqlFiles = files.filter(f => f.endsWith('.sql'));
  
  const backups = sqlFiles.map(filename => {
    const filePath = path.resolve(BACKUPS_DIR, filename);
    const stats = fs.statSync(filePath);
    return {
      filename,
      sizeBytes: stats.size,
      createdAt: stats.birthtime.toISOString(), // o mtime
    };
  });

  // Ordenar los más nuevos primero
  return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function createBackup(): Promise<BackupMetadata> {
  if (!DB_URL) {
    throw new AppError(500, 'Falta la variable de entorno DATABASE_URL');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup_${timestamp}.sql`;
  const backupPath = path.resolve(BACKUPS_DIR, backupFileName);

  const command = `pg_dump "${DB_URL}" -f "${backupPath}" --clean --no-owner`;

  try {
    await execAsync(command);
    const stats = fs.statSync(backupPath);
    return {
      filename: backupFileName,
      sizeBytes: stats.size,
      createdAt: stats.birthtime.toISOString()
    };
  } catch (error: any) {
    console.error("Error real al ejecutar pg_dump:", error.stderr || error.message || error);
    throw new AppError(500, `Error al generar el respaldo: ${error.stderr || error.message}`);
  }
}

async function restoreBackup(filename: string): Promise<void> {
  const filePath = path.resolve(BACKUPS_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    throw new AppError(404, 'El archivo de backup no existe en el servidor.');
  }
  if (!DB_URL) {
    throw new AppError(500, 'Falta la variable de entorno DATABASE_URL');
  }

  await prisma.$disconnect();

  const command = `psql "${DB_URL}" -f "${filePath}"`;

  try {
    await execAsync(command);
  } catch (error: any) {
    console.error("Error real al ejecutar psql:", error.stderr || error.message || error);
    await prisma.$connect();
    throw new AppError(500, `Error al restaurar la base de datos: ${error.stderr || error.message}`);
  }

  await prisma.$connect();
}

async function deleteBackup(filename: string): Promise<void> {
  const filePath = path.resolve(BACKUPS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  } else {
    throw new AppError(404, 'El archivo no existe.');
  }
}

function getBackupFilePath(filename: string): string {
  const filePath = path.resolve(BACKUPS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new AppError(404, 'El archivo no existe.');
  }
  return filePath;
}

export const backupService = {
  listBackups,
  createBackup,
  restoreBackup,
  deleteBackup,
  getBackupFilePath,
};
