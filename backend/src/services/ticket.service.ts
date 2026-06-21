import { prisma } from '../config/prisma.js';
import { calculateDueDate } from '../utils/sla-calculator.js';
import { generateTicketCode } from '../utils/ticket-code.js';
import { AppError } from '../utils/app-error.js';
import { auditService } from './audit.service.js';
import { isValidTransition } from '../utils/state-machine.js';
import { sanitizeTicketInput } from '../utils/sanitize.js';
import { notificationService } from './notification.service.js';
import { TICKET_STATUS, AUDIT_ACTIONS, ROLES } from '../config/constants.js';
import type { Prisma } from '@prisma/client';
import { TicketStatus, TicketPriority, Department } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;


async function autoAssign(
  ticketId: string,
  categoryDepartment: string | null,
  creatorId: string,
  tx: TransactionClient
) {
  // Construir where clause dinámicamente
  const whereClause: Prisma.UserWhereInput = {
    role: { name: ROLES.TECHNICIAN },
    isActive: true,
  };
  if (categoryDepartment) {
    whereClause.department = categoryDepartment as Department;
  }

  const technicians = await tx.user.findMany({
    where: whereClause,
    include: {
      assignments: {
        where: {
          ticket: {
            status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
          },
        },
      },
    },
  });

  if (technicians.length === 0) return null;

  // Ordenar por menor carga de trabajo (least connections)
  const sorted = technicians
    .map((tech) => ({
      id: tech.id,
      firstName: tech.firstName,
      lastName: tech.lastName,
      activeTickets: tech.assignments.length,
    }))
    .sort((a, b) => a.activeTickets - b.activeTickets);

  const bestTech = sorted[0];
  const bestTechId = bestTech.id;
  const bestTechName = `${bestTech.firstName} ${bestTech.lastName}`;

  // Crear asignación
  await tx.assignment.create({
    data: { ticketId, technicianId: bestTechId },
  });

  // Cambiar a ASSIGNED
  await tx.ticket.update({
    where: { id: ticketId },
    data: { status: TICKET_STATUS.ASSIGNED },
  });

  // Audit logs
  await auditService.logAction(ticketId, creatorId, AUDIT_ACTIONS.STATUS_CHANGE, TICKET_STATUS.OPEN, TICKET_STATUS.ASSIGNED, tx);
  await auditService.logAction(ticketId, creatorId, AUDIT_ACTIONS.ASSIGNMENT, null, bestTechName, tx);

  // Notificar al técnico
  const ticketInfo = await tx.ticket.findUnique({ where: { id: ticketId } });
  if (ticketInfo) {
    await notificationService.createNotification({
      userId: bestTechId,
      title: 'Nuevo Ticket Asignado',
      message: `Se te ha asignado el ticket #${ticketInfo.ticketCode}: ${ticketInfo.title}`,
      type: 'ASSIGNMENT',
      link: `/technician/ticket/${ticketId}`
    });
  }

  return bestTechId;
}

async function create(data: {
  title: string;
  description: string;
  location: string;
  categoryId: number;
  priority: string;
  creatorId: string;
}) {
  // Sanitizar input para prevenir XSS
  const sanitized = sanitizeTicketInput(data);
  
  // Validar que priority sea un valor válido
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const priority = validPriorities.includes(sanitized.priority) ? sanitized.priority : 'MEDIUM';
  
  return prisma.$transaction(async (tx) => {
    const category = await tx.category.findUnique({
      where: { id: sanitized.categoryId },
    });
    if (!category || !category.isActive) {
      throw new AppError(404, 'Categoría no encontrada');
    }

    const ticketCode = await generateTicketCode(tx);
    const now = new Date();
    const dueDate = calculateDueDate(now, category.slaHours);

    const ticket = await tx.ticket.create({
      data: {
        ticketCode,
        title: sanitized.title,
        description: sanitized.description,
        location: sanitized.location,
        categoryId: sanitized.categoryId,
        priority: priority,
        creatorId: sanitized.creatorId,
        dueDate,
      },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        ticketId: ticket.id,
        userId: data.creatorId,
        action: AUDIT_ACTIONS.TICKET_CREATED,
        oldValue: null,
        newValue: null,
      },
    });

    // Auto-asignación inteligente basada en departamento de la categoría
    const assignedTechId = await autoAssign(
      ticket.id,
      category.department,
      sanitized.creatorId,
      tx
    );

    // Re-fetch con la asignación incluida
    const finalTicket = await tx.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          include: {
            technician: {
              select: { id: true, firstName: true, lastName: true, department: true },
            },
          },
        },
      },
    });
    if (!finalTicket) throw new AppError(500, 'Error al recuperar el ticket creado');


    // Notificar a los administradores del nuevo ticket
    await notificationService.notifyAdmins({
      title: 'Nuevo Ticket Creado',
      message: `El locatario ${finalTicket.creator.firstName} ha creado el ticket #${finalTicket.ticketCode}`,
      type: 'TICKET_STATUS',
      link: `/admin/tickets?search=${finalTicket.ticketCode}`
    });

    // Notificar al creador que su ticket ha sido creado (opcional, pero útil para feedback)
    await notificationService.createNotification({
      userId: finalTicket.creatorId,
      title: 'Ticket Creado con Éxito',
      message: `Tu ticket #${finalTicket.ticketCode} ha sido registrado correctamente.`,
      type: 'TICKET_STATUS',
      link: `/requester/my-tickets?ticketId=${finalTicket.id}`
    });

    return { ...finalTicket, autoAssigned: !!assignedTechId };
  });
}

async function findAll(filters: {
  status?: string;
  priority?: string;
  categoryId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {};
  if (filters.status) where.status = filters.status as TicketStatus;
  if (filters.priority) where.priority = filters.priority as TicketPriority;
  if (filters.categoryId) where.categoryId = filters.categoryId;

  // Búsqueda "Super Power" por texto en múltiples campos y relaciones
  if (filters.search) {
    const searchTerms = filters.search.trim().split(/\s+/);
    where.AND = searchTerms.map(term => ({
      OR: [
        { ticketCode: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        { 
          creator: {
            OR: [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ]
          }
        },
        {
          assignments: {
            some: {
              technician: {
                OR: [
                  { firstName: { contains: term, mode: 'insensitive' } },
                  { lastName: { contains: term, mode: 'insensitive' } },
                ]
              }
            }
          }
        }
      ]
    }));
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignments: {
          include: {
            technician: {
              select: { id: true, firstName: true, lastName: true, department: true },
            },
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function findById(id: string, userRole?: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      category: true,
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignments: {
        include: {
          technician: {
            select: { id: true, firstName: true, lastName: true, department: true },
          },
        },
      },
      comments: {
        where: userRole === ROLES.REQUESTER ? { isInternal: false } : {},
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      auditLogs: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

  return ticket;
}

/**
 * Cambio de estado genérico.
 * Si el usuario es TECHNICIAN, verifica que el ticket esté asignado a él.
 */
async function updateStatus(
  ticketId: string,
  newStatus: string,
  userId: string,
  userRole: string
) {
  // Validar que el status sea un valor válido del enum
  const validStatuses = Object.values(TICKET_STATUS);
  if (!validStatuses.includes(newStatus as TicketStatus)) {
    throw new AppError(400, 'Estado inválido');
  }

  if (newStatus === TICKET_STATUS.RESOLVED) {
    throw new AppError(400, 'Para resolver un ticket, debés usar el endpoint específico de resolución con nota');
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignments: true },
  });
  if (!ticket) {
    throw new AppError(404, 'Ticket no encontrado');
  }

  // Verificar ownership para técnicos
  if (userRole === ROLES.TECHNICIAN) {
    const isAssigned = ticket.assignments.some((a) => a.technicianId === userId);
    if (!isAssigned) {
      throw new AppError(403, 'Solo podés cambiar el estado de tickets asignados a vos');
    }
  }

  if (!isValidTransition(ticket.status, newStatus)) {
    throw new AppError(
      422,
      `Transición inválida: no se puede cambiar de ${ticket.status} a ${newStatus}`
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus as Prisma.EnumTicketStatusFieldUpdateOperationsInput['set'] },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    await auditService.logAction(
      ticketId,
      userId,
      AUDIT_ACTIONS.STATUS_CHANGE,
      ticket.status,
      newStatus,
      tx
    );

    // Notificar al creador del cambio de estado
    await notificationService.createNotification({
      userId: ticket.creatorId,
      title: 'Actualización de Ticket',
      message: `Tu ticket #${ticket.ticketCode} ahora está en estado: ${newStatus}`,
      type: 'TICKET_STATUS',
      link: `/requester/my-tickets?ticketId=${ticket.id}`
    });

    return updated;
  });
}

/**
 * Técnico resuelve con nota obligatoria.
 * IN_PROGRESS → AWAITING_CONFIRMATION (el técnico debe estar asignado).
 */
async function resolveWithNote(
  ticketId: string,
  data: { resolutionNote: string; timeSpentMinutes?: number; materialsUsed?: string },
  userId: string
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignments: true },
  });
  if (!ticket) throw new AppError(404, 'Ticket no encontrado');

  // Verificar que el técnico está asignado a este ticket
  const isAssigned = ticket.assignments.some((a) => a.technicianId === userId);
  if (!isAssigned) {
    throw new AppError(403, 'Solo podés resolver tickets asignados a vos');
  }

  if (!isValidTransition(ticket.status, TICKET_STATUS.RESOLVED)) {
    throw new AppError(422, `No se puede resolver un ticket en estado ${ticket.status}`);
  }

  if (!data.resolutionNote || data.resolutionNote.trim().length < 10) {
    throw new AppError(400, 'La nota de resolución debe tener al menos 10 caracteres');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: ticketId },
      data: {
        status: TICKET_STATUS.AWAITING_CONFIRMATION,
        resolutionNote: data.resolutionNote.trim(),
        resolvedAt: new Date(),
        timeSpentMinutes: data.timeSpentMinutes ?? null,
        materialsUsed: data.materialsUsed?.trim() || null,
      },
      include: {
        category: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    await auditService.logAction(ticketId, userId, AUDIT_ACTIONS.STATUS_CHANGE, ticket.status, TICKET_STATUS.AWAITING_CONFIRMATION, tx);
    await auditService.logAction(ticketId, userId, AUDIT_ACTIONS.RESOLUTION_NOTE, null, data.resolutionNote.trim(), tx);

    // Notificar al creador que debe confirmar
    await notificationService.createNotification({
      userId: ticket.creatorId,
      title: 'Ticket Resuelto',
      message: `El técnico ha resuelto tu ticket #${ticket.ticketCode}. Por favor, verificá y confirmá la solución.`,
      type: 'TICKET_STATUS',
      link: `/requester/my-tickets?ticketId=${updated.id}`
    });

    return updated;
  });
}

/**
 * Solicitante confirma o reabre el ticket.
 * AWAITING_CONFIRMATION → CLOSED (confirma) o AWAITING_CONFIRMATION → IN_PROGRESS (reabre)
 * Rating/estrellas eliminado — solo confirmación y comentario opcional.
 */
async function confirmTicket(
  ticketId: string,
  data: { confirmed: boolean; comment?: string },
  userId: string
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new AppError(404, 'Ticket no encontrado');

  if (ticket.status !== TICKET_STATUS.AWAITING_CONFIRMATION) {
    throw new AppError(422, 'El ticket no está esperando confirmación');
  }

  if (ticket.creatorId !== userId) {
    throw new AppError(403, 'Solo el creador del ticket puede confirmar');
  }

  return prisma.$transaction(async (tx) => {
    if (data.confirmed) {
      // Confirmar → CLOSED (sin rating)
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TICKET_STATUS.CLOSED,
        },
        include: {
          category: true,
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await auditService.logAction(ticketId, userId, AUDIT_ACTIONS.STATUS_CHANGE, TICKET_STATUS.AWAITING_CONFIRMATION, TICKET_STATUS.CLOSED, tx);
      await auditService.logAction(ticketId, userId, AUDIT_ACTIONS.TICKET_CONFIRMED, null, 'Confirmado por el solicitante', tx);

      // Notificar al técnico que el ticket fue confirmado/cerrado
      const assignment = await tx.assignment.findFirst({ where: { ticketId } });
      if (assignment) {
        await notificationService.createNotification({
          userId: assignment.technicianId,
          title: 'Ticket Confirmado',
          message: `El locatario ha confirmado la resolución del ticket #${ticket.ticketCode}.`,
          type: 'TICKET_STATUS',
          link: `/technician/ticket/${ticketId}`
        });
      }

      return updated;
    } else {
      // Reabrir → IN_PROGRESS
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TICKET_STATUS.IN_PROGRESS,
          resolvedAt: null,
          resolutionNote: null,
        },
        include: {
          category: true,
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      await auditService.logAction(ticketId, userId, AUDIT_ACTIONS.STATUS_CHANGE, TICKET_STATUS.AWAITING_CONFIRMATION, TICKET_STATUS.IN_PROGRESS, tx);
      await auditService.logAction(ticketId, userId, AUDIT_ACTIONS.TICKET_REOPENED, null, data.comment || 'Falla persiste', tx);

      // Notificar al técnico de la reapertura
      const assignment = await tx.assignment.findFirst({ where: { ticketId } });
      if (assignment) {
        await notificationService.createNotification({
          userId: assignment.technicianId,
          title: 'Ticket Reabierto',
          message: `El locatario ha reabierto el ticket #${ticket.ticketCode}. Revisá los comentarios.`,
          type: 'TICKET_STATUS',
          link: `/technician/ticket/${ticketId}`
        });
      }

      return updated;
    }
  });
}

/**
 * Tickets creados por un solicitante específico.
 */
async function findByCreator(creatorId: string, filters: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = { creatorId };
  if (filters.status) where.status = filters.status as TicketStatus;
  if (filters.priority) where.priority = filters.priority as TicketPriority;

  if (filters.search) {
    const searchTerms = filters.search.trim().split(/\s+/);
    where.AND = searchTerms.map(term => ({
      OR: [
        { ticketCode: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        {
          assignments: {
            some: {
              technician: {
                OR: [
                  { firstName: { contains: term, mode: 'insensitive' } },
                  { lastName: { contains: term, mode: 'insensitive' } },
                ]
              }
            }
          }
        }
      ]
    }));
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        assignments: {
          include: {
            technician: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Tickets asignados a un técnico específico.
 */
async function findAssigned(technicianId: string, filters: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.TicketWhereInput = {
    assignments: { some: { technicianId } },
  };
  if (filters.status) where.status = filters.status as TicketStatus;
  if (filters.priority) where.priority = filters.priority as TicketPriority;

  if (filters.search) {
    const searchTerms = filters.search.trim().split(/\s+/);
    where.AND = searchTerms.map(term => ({
      OR: [
        { ticketCode: { contains: term, mode: 'insensitive' } },
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { location: { contains: term, mode: 'insensitive' } },
        { 
          creator: {
            OR: [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ]
          }
        }
      ]
    }));
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      skip,
      take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      category: true,
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignments: {
        include: {
          technician: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export const ticketService = {
  create, findAll, findById, updateStatus,
  findByCreator, findAssigned,
  resolveWithNote, confirmTicket,
};
