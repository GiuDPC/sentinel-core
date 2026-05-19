import { prisma } from '../config/prisma.js';
import { TICKET_STATUS } from '../config/constants.js';
import type { Prisma } from '../../generated/prisma/index.js';

type TransactionClient = Prisma.TransactionClient;

async function getDashboard() {
  const now = new Date();

  // ── Contadores generales (optimizado: 1 query groupBy en vez de 7 counts)
  const statusCounts = await prisma.ticket.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const countByStatus = (status: string) =>
    statusCounts.find((s) => s.status === status)?._count.id ?? 0;

  const totalTickets = statusCounts.reduce((sum, s) => sum + s._count.id, 0);
  const openTickets = countByStatus(TICKET_STATUS.OPEN);
  const assignedTickets = countByStatus(TICKET_STATUS.ASSIGNED);
  const inProgressTickets = countByStatus(TICKET_STATUS.IN_PROGRESS);
  const onHoldTickets = countByStatus(TICKET_STATUS.ON_HOLD);
  const resolvedTickets = countByStatus(TICKET_STATUS.RESOLVED);
  const closedTickets = countByStatus(TICKET_STATUS.CLOSED);

  // ── SLA vencidos tickets activos pasados de fecha
  const slaBreached = await prisma.ticket.count({
    where: {
      status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
      dueDate: { lt: now },
    },
  });

  // ── Tickets por categoría 
  const ticketsByCategory = await prisma.ticket.groupBy({
    by: ['categoryId'],
    _count: { id: true },
  });

  // Traer nombres de categorías
  const categories = await prisma.category.findMany({
    where: { id: { in: ticketsByCategory.map((t) => t.categoryId) } },
  });

  const ticketsByCategoryNamed = ticketsByCategory.map((item) => ({
    category: categories.find((c) => c.id === item.categoryId)?.name || 'Desconocida',
    count: item._count.id,
  }));

  // ── Tickets por prioridad
  const ticketsByPriority = await prisma.ticket.groupBy({
    by: ['priority'],
    _count: { id: true },
  });

  const ticketsByPriorityFormatted = ticketsByPriority.map((item) => ({
    priority: item.priority,
    count: item._count.id,
  }));

  // ── Tickets por estado 
  const ticketsByStatus = [
    { status: TICKET_STATUS.OPEN, count: openTickets },
    { status: TICKET_STATUS.ASSIGNED, count: assignedTickets },
    { status: TICKET_STATUS.IN_PROGRESS, count: inProgressTickets },
    { status: TICKET_STATUS.ON_HOLD, count: onHoldTickets },
    { status: TICKET_STATUS.RESOLVED, count: resolvedTickets },
    { status: TICKET_STATUS.CLOSED, count: closedTickets },
  ];

  // ── Promedio de resolución horas (Optimizado con SQL nativo)
  const result = await prisma.$queryRaw<[{ avg: number }]>`
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 0) as avg
    FROM tickets
    WHERE status IN ('RESOLVED', 'CLOSED')
  `;
  const avgResolutionHours = Math.round(Number(result[0]?.avg || 0) * 10) / 10;

  // ── Tickets creados este mes
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const ticketsThisMonth = await prisma.ticket.count({
    where: { createdAt: { gte: startOfMonth } },
  });

  // ── Tickets creados el mes anterior (para tendencias)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const ticketsLastMonth = await prisma.ticket.count({
    where: {
      createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
    },
  });

  // Calcular tendencia: % vs mes anterior
  const trendPercentage = ticketsLastMonth > 0
    ? Math.round(((ticketsThisMonth - ticketsLastMonth) / ticketsLastMonth) * 100)
    : 0;

  // ── Tickets con SLA próximo a vencer (< 2 horas) ──
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const slaAtRisk = await prisma.ticket.count({
    where: {
      status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
      dueDate: { gt: now, lt: twoHoursFromNow },
    },
  });

  return {
    summary: {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      slaBreached,
      slaAtRisk,
      avgResolutionHours,
      ticketsThisMonth,
      ticketsLastMonth,
      trendPercentage,
    },
    ticketsByCategory: ticketsByCategoryNamed,
    ticketsByPriority: ticketsByPriorityFormatted,
    ticketsByStatus,
  };
}

/**
 * Obtiene los tickets con SLA vencido (para alertas).
 */
async function getSlaBreachedTickets() {
  return prisma.ticket.findMany({
    where: {
      status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
      dueDate: { lt: new Date() },
    },
    include: {
      category: true,
      creator: { select: { id: true, firstName: true, lastName: true } },
      assignments: {
        include: {
          technician: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { dueDate: 'asc' }, // Los más vencidos primero
  });
}

/**
 * Métricas específicas del solicitante.
 */
async function getRequesterMetrics(userId: string) {
  const now = new Date();

  const [total, open, inProgress, resolved, slaBreached, slaAtRisk] = await Promise.all([
    prisma.ticket.count({ where: { creatorId: userId } }),
    prisma.ticket.count({ where: { creatorId: userId, status: TICKET_STATUS.OPEN } }),
    prisma.ticket.count({ where: { creatorId: userId, status: TICKET_STATUS.IN_PROGRESS } }),
    prisma.ticket.count({ where: { creatorId: userId, status: { in: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] } } }),
    prisma.ticket.count({
      where: {
        creatorId: userId,
        status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
        dueDate: { lt: now },
      },
    }),
    prisma.ticket.count({
      where: {
        creatorId: userId,
        status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
        dueDate: { gt: now, lt: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // Promedio de resolución de tickets del solicitante (Optimizado con SQL nativo)
  const reqResult = await prisma.$queryRaw<[{ avg: number }]>`
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 0) as avg
    FROM tickets
    WHERE status IN ('RESOLVED', 'CLOSED') AND creator_id = ${userId}
  `;
  const avgResolutionHours = Math.round(Number(reqResult[0]?.avg || 0) * 10) / 10;

  const slaCompliance = total > 0
    ? Math.round(((total - slaBreached) / total) * 100)
    : 100;

  return {
    totalTickets: total,
    openTickets: open,
    inProgressTickets: inProgress,
    resolvedTickets: resolved,
    slaBreached,
    slaAtRisk,
    slaCompliance,
    avgResolutionHours,
  };
}

/**
 * Métricas específicas del técnico.
 * Optimizado: usa JOINs directos con condiciones en vez de N+1 (fetch IDs → count con IN).
 */
async function getTechnicianMetrics(userId: string) {
  const now = new Date();

  const baseWhere = {
    assignments: { some: { technicianId: userId } },
  };

  const [totalAssigned, inProgress, resolved, slaBreached, slaAtRisk] = await Promise.all([
    prisma.ticket.count({ where: baseWhere }),
    prisma.ticket.count({ where: { ...baseWhere, status: TICKET_STATUS.IN_PROGRESS } }),
    prisma.ticket.count({ where: { ...baseWhere, status: { in: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] } } }),
    prisma.ticket.count({
      where: {
        ...baseWhere,
        status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
        dueDate: { lt: now },
      },
    }),
    prisma.ticket.count({
      where: {
        ...baseWhere,
        status: { notIn: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
        dueDate: { gt: now, lt: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
      },
    }),
  ]);

  // Promedio de resolución (Optimizado con SQL nativo)
  const techResult = await prisma.$queryRaw<[{ avg: number }]>`
    SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600), 0) as avg
    FROM tickets t
    INNER JOIN assignments a ON t.id = a.ticket_id
    WHERE t.status IN ('RESOLVED', 'CLOSED') AND a.technician_id = ${userId}
  `;
  const avgResolutionHours = Math.round(Number(techResult[0]?.avg || 0) * 10) / 10;

  return {
    totalAssigned,
    inProgress,
    resolved,
    slaBreached,
    slaAtRisk,
    avgResolutionHours,
  };
}

export const metricsService = { getDashboard, getSlaBreachedTickets, getRequesterMetrics, getTechnicianMetrics };
