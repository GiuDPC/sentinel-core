import { Router } from 'express'
import { notificationController } from '../controllers/notification.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authMiddleware)

router.get('/', notificationController.getMyNotifications)
router.patch('/all/read', notificationController.markAllAsRead)
router.patch('/:id/read', notificationController.markAsRead)

export default router
