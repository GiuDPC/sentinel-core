import { prisma } from '../config/prisma.js'

export class NotificationService {
  /**
   * Crea una notificación para un usuario específico
   */
  async createNotification(data: {
    userId: string
    title: string
    message: string
    type: 'TICKET_STATUS' | 'COMMENT' | 'ASSIGNMENT' | 'SYSTEM'
    link?: string
  }) {
    try {
      return await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link,
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }
  }

  /**
   * Obtiene las notificaciones de un usuario
   */
  async getUserNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  }

  /**
   * Cuenta las notificaciones no leídas
   */
  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    })
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId: string, userId: string) {
    // C2: Ownership check — solo el dueño puede marcar su notificación como leída
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) return null; // No existe o no pertenece al usuario — silencioso
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    })
  }

  /**
   * Notifica a los administradores
   */
  async notifyAdmins(data: { title: string; message: string; type: 'TICKET_STATUS' | 'COMMENT' | 'ASSIGNMENT' | 'SYSTEM'; link?: string }) {
    const admins = await prisma.user.findMany({
      where: { role: { name: 'ADMIN' } }
    })

    await Promise.all(
      admins.map((admin) =>
        this.createNotification({
          ...data,
          userId: admin.id,
        })
      )
    )
  }
  /**
   * M5: Limpieza de notificaciones antiguas (> 30 días y leídas).
   * Llamar al arrancar el servidor y/o con un cron.
   */
  async cleanOldNotifications(): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoff },
      },
    });
    return result.count;
  }
}

export const notificationService = new NotificationService()
