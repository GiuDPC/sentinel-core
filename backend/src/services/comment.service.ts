import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { notificationService } from './notification.service.js';
import { sanitizeString } from '../utils/sanitize.js';

async function create(data: {
  ticketId: string;
  userId: string;
  userRole: string;
  content: string;
  isInternal: boolean;
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: data.ticketId },
    include: { assignments: true },
  });
  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

  // H2: Verificar acceso al ticket según rol
  if (data.userRole === 'REQUESTER' && ticket.creatorId !== data.userId) {
    throw new AppError(403, 'Solo podés comentar en tus propios tickets');
  }
  if (data.userRole === 'TECHNICIAN') {
    const isAssigned = ticket.assignments.some((a) => a.technicianId === data.userId);
    if (!isAssigned) {
      throw new AppError(403, 'Solo podés comentar en tickets asignados a vos');
    }
  }

  // H2: REQUESTER nunca puede crear comentarios internos — forzar a false
  const isInternal = data.userRole === 'REQUESTER' ? false : (data.isInternal ?? false);

  const comment = await prisma.comment.create({
    data: {
      ticketId: data.ticketId,
      userId: data.userId,
      content: sanitizeString(data.content),
      isInternal,
    },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // Notificaciones: reutilizar ticketInfo ya cargado
  if (data.userId === ticket.creatorId) {
    for (const assignment of ticket.assignments) {
      await notificationService.createNotification({
        userId: assignment.technicianId,
        title: 'Nuevo Comentario de Locatario',
        message: `El locatario ha comentado en el ticket #${ticket.ticketCode}`,
        type: 'COMMENT',
        link: `/technician/ticket/${data.ticketId}`
      });
    }
  } else if (!isInternal) {
    await notificationService.createNotification({
      userId: ticket.creatorId,
      title: 'Nuevo Comentario Técnico',
      message: `Hay una nueva respuesta en tu ticket #${ticket.ticketCode}`,
      type: 'COMMENT',
      link: `/requester/my-tickets?ticketId=${data.ticketId}`
    });
  }

  return comment;
}

async function findByTicketId(ticketId: string, userRole: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

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
