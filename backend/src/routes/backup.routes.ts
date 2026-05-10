import { Router } from 'express';
import { listBackups, createBackup, downloadBackup, restoreBackup, deleteBackup } from '../controllers/backup.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);
router.use(roleGuard('ADMIN'));

router.get('/', listBackups);
router.post('/', createBackup);
router.get('/:filename/download', downloadBackup);
router.post('/:filename/restore', restoreBackup);
router.delete('/:filename', deleteBackup);

export default router;
