import { Request, Response } from 'express'
import { notificationService } from '../services/notification.service.js'

export class NotificationController {
  async getMyNotifications(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ message: 'No autorizado' })

      const notifications = await notificationService.getUserNotifications(userId)
      const unreadCount = await notificationService.getUnreadCount(userId)

      res.json({ notifications, unreadCount })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user?.id
      if (!id) return res.status(400).json({ message: 'ID requerido' })
      if (!userId) return res.status(401).json({ message: 'No autorizado' })
      
      // C2: ownership verificado en el service
      await notificationService.markAsRead(id as string, userId)
      res.json({ message: 'Notificación leída' })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }

  async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ message: 'No autorizado' })

      await notificationService.markAllAsRead(userId)
      res.json({ message: 'Todas las notificaciones marcadas como leídas' })
    } catch (error: any) {
      res.status(500).json({ message: error.message })
    }
  }
}

export const notificationController = new NotificationController()
