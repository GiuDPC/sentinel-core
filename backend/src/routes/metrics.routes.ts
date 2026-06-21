import { Router } from 'express';
import { metricsController } from '../controllers/metrics.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', roleGuard('ADMIN'), metricsController.getDashboard);

router.get('/sla-breached', roleGuard('ADMIN'), metricsController.getSlaBreached);

router.get('/requester', roleGuard('REQUESTER'), metricsController.getRequesterMetrics);

router.get('/technician', roleGuard('TECHNICIAN'), metricsController.getTechnicianMetrics);

export default router;
