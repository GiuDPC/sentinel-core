import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { notificationService } from './notification.service.js';
import { sanitizeString } from '../utils/sanitize.js';

async function create(data: {
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
}) {
  // Verificar que el ticket existe
  const ticket = await prisma.ticket.findUnique({
    where: { id: data.ticketId },
  });
  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

  const comment = await prisma.comment.create({
    data: {
      ticketId: data.ticketId,
      userId: data.userId,
      content: sanitizeString(data.content),
      isInternal: data.isInternal,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Notificaciones post-comentario
  const ticketInfo = await prisma.ticket.findUnique({
    where: { id: data.ticketId },
    include: { assignments: true }
  });

  if (ticketInfo) {
    // 1. Si el locatario comenta, avisar al técnico
    if (data.userId === ticketInfo.creatorId) {
      for (const assignment of ticketInfo.assignments) {
        await notificationService.createNotification({
          userId: assignment.technicianId,
          title: 'Nuevo Comentario de Locatario',
          message: `El locatario ha comentado en el ticket #${ticketInfo.ticketCode}`,
          type: 'COMMENT',
          link: `/technician/ticket/${data.ticketId}`
        });
      }
    } 
    // 2. Si es un técnico/admin y el comentario NO es interno, avisar al locatario
    else if (!data.isInternal) {
      await notificationService.createNotification({
        userId: ticketInfo.creatorId,
        title: 'Nuevo Comentario Técnico',
        message: `Hay una nueva respuesta en tu ticket #${ticketInfo.ticketCode}`,
        type: 'COMMENT',
        link: `/requester/my-tickets?ticketId=${data.ticketId}`
      });
    }
  }

  return comment;
}

async function findByTicketId(ticketId: string, userRole: string) {
  // Verificar que el ticket existe
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

  // Los solicitantes NO ven comentarios internos
  const where: any = { ticketId };
  if (userRole === 'REQUESTER') {
    where.isInternal = false;
  }

  return prisma.comment.findMany({
    where,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export const commentService = { create, findByTicketId };
