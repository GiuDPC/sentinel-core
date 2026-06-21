import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { isValidTransition } from '../utils/state-machine.js';
import { auditService } from './audit.service.js';

/**
 * Obtiene técnicos ordenados por carga de trabajo (menor a mayor).
 * El primero de la lista es el sugerido (Least Connections).
 */
async function getTechniciansByWorkload(department?: string) {
  const whereClause: any = {
    role: { name: 'TECHNICIAN' },
    isActive: true,
  };
  if (department) {
    whereClause.department = department;
  }

  const technicians = await prisma.user.findMany({
    where: whereClause,
    include: {
      assignments: {
        where: {
          ticket: {
            status: { notIn: ['RESOLVED', 'CLOSED'] },
          },
        },
      },
    },
  });

  const sorted = technicians
    .map((tech) => ({
      id: tech.id,
      firstName: tech.firstName,
      lastName: tech.lastName,
      email: tech.email,
      department: tech.department,
      phone: tech.phone,
      activeTickets: tech.assignments.length,
    }))
    .sort((a, b) => a.activeTickets - b.activeTickets);

  return {
    technicians: sorted,
    suggested: sorted.length > 0 ? sorted[0].id : null,
  };
}

/**
 * Asigna un técnico a un ticket.
 * Si el ticket está en OPEN, lo pasa a ASSIGNED automáticamente.
 */
async function assignTechnician(
  ticketId: string,
  technicianId: string,
  assignedBy: string
) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new AppError(404, 'Ticket no encontrado');

    const technician = await tx.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    });
    if (!technician || !technician.isActive) {
      throw new AppError(404, 'Técnico no encontrado');
    }
    if (technician.role.name !== 'TECHNICIAN') {
      throw new AppError(400, 'El usuario seleccionado no es un técnico');
    }

    const existingAssignment = await tx.assignment.findUnique({
      where: {
        ticketId_technicianId: { ticketId, technicianId },
      },
    });
    if (existingAssignment) {
      throw new AppError(409, 'Este técnico ya está asignado a este ticket');
    }

    await tx.assignment.create({
      data: { ticketId, technicianId },
    });

    if (ticket.status === 'OPEN' && isValidTransition('OPEN', 'ASSIGNED')) {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'ASSIGNED' },
      });

      await auditService.logAction(
        ticketId,
        assignedBy,
        'STATUS_CHANGE',
        'OPEN',
        'ASSIGNED',
        tx
      );
    }

    await auditService.logAction(
      ticketId,
      assignedBy,
      'ASSIGNMENT',
      null,
      `${technician.firstName} ${technician.lastName}`,
      tx
    );

    return tx.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignments: {
          include: {
            technician: { select: { id: true, firstName: true, lastName: true, department: true } },
          },
        },
      },
    });
  });
}

/**
 * Reasigna un ticket a un nuevo técnico.
 * Remueve todas las asignaciones anteriores y crea una nueva.
 * Mantiene el estado actual del ticket (no lo resetea).
 */
async function reassignTechnician(
  ticketId: string,
  newTechnicianId: string,
  reassignedBy: string
) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { id: ticketId },
      include: { assignments: { include: { technician: true } } },
    });
    if (!ticket) throw new AppError(404, 'Ticket no encontrado');

    if (ticket.status === 'CLOSED') {
      throw new AppError(422, 'No se puede reasignar un ticket cerrado');
    }

    const technician = await tx.user.findUnique({
      where: { id: newTechnicianId },
      include: { role: true },
    });
    if (!technician || !technician.isActive) {
      throw new AppError(404, 'Técnico no encontrado');
    }
    if (technician.role.name !== 'TECHNICIAN') {
      throw new AppError(400, 'El usuario seleccionado no es un técnico');
    }

    const previousTech = ticket.assignments[0]?.technician;
    const previousTechName = previousTech ? `${previousTech.firstName} ${previousTech.lastName}` : null;

    await tx.assignment.deleteMany({
      where: { ticketId },
    });

    await tx.assignment.create({
      data: { ticketId, technicianId: newTechnicianId },
    });

    if (ticket.status === 'OPEN') {
      await tx.ticket.update({
        where: { id: ticketId },
        data: { status: 'ASSIGNED' },
      });
      await auditService.logAction(ticketId, reassignedBy, 'STATUS_CHANGE', 'OPEN', 'ASSIGNED', tx);
    }

    await auditService.logAction(
      ticketId,
      reassignedBy,
      'REASSIGNMENT',
      previousTechName,
      `${technician.firstName} ${technician.lastName}`,
      tx
    );

    return tx.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignments: {
          include: {
            technician: { select: { id: true, firstName: true, lastName: true, department: true } },
          },
        },
      },
    });
  });
}

export const assignmentService = { getTechniciansByWorkload, assignTechnician, reassignTechnician };
