import { Request, Response, NextFunction } from 'express';
import { backupService } from '../services/backup.service.js';

export async function listBackups(req: Request, res: Response, next: NextFunction) {
  try {
    const backups = await backupService.listBackups();
    res.json(backups);
  } catch (error) {
    next(error);
  }
}

export async function createBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const backup = await backupService.createBackup();
    res.status(201).json({ message: 'Backup creado exitosamente', backup });
  } catch (error) {
    next(error);
  }
}

export async function downloadBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const filename = req.params.filename as string;
    const filePath = backupService.getBackupFilePath(filename);
    res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
}

export async function restoreBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const filename = req.params.filename as string;
    await backupService.restoreBackup(filename);
    res.json({ message: 'Base de datos restaurada correctamente.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteBackup(req: Request, res: Response, next: NextFunction) {
  try {
    const filename = req.params.filename as string;
    await backupService.deleteBackup(filename);
    res.json({ message: 'Backup eliminado correctamente.' });
  } catch (error) {
    next(error);
  }
}
