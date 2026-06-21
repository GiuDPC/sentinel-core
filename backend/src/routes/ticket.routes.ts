import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { createTicketSchema, updateStatusSchema, resolveTicketSchema, confirmTicketSchema } from '../schemas/ticket.schema.js';
import { assignTechnicianSchema } from '../schemas/assignment.schema.js';
import commentRoutes from './comment.routes.js';

const router = Router();

// Todas las rutas de tickets requieren autenticación
router.use(authMiddleware);

// POST /api/tickets — Admin y Solicitante pueden crear
router.post(
  '/',
  roleGuard('ADMIN', 'REQUESTER'),
  validate(createTicketSchema),
  ticketController.create
);

// GET /api/tickets — Solo Admin puede ver todos los tickets
router.get('/', roleGuard('ADMIN'), ticketController.findAll);

// Rutas estáticas ANTES que rutas con :id
// GET /api/tickets/technicians/workload — Ver carga de técnicos (Admin)
router.get(
  '/technicians/workload',
  roleGuard('ADMIN'),
  ticketController.getTechniciansWorkload
);

// GET /api/tickets/my-tickets — Tickets propios del solicitante
router.get(
  '/my-tickets',
  roleGuard('REQUESTER'),
  ticketController.findMyTickets
);

// GET /api/tickets/assigned — Tickets asignados al técnico
router.get(
  '/assigned',
  roleGuard('TECHNICIAN'),
  ticketController.findAssigned
);

// GET /api/tickets/:id — Detalle de un ticket
router.get('/:id', ticketController.findById);

// PATCH /api/tickets/:id/status — Admin y Técnico cambian estado
router.patch(
  '/:id/status',
  roleGuard('ADMIN', 'TECHNICIAN'),
  validate(updateStatusSchema),
  ticketController.updateStatus
);

// POST /api/tickets/:id/assign — Asignar técnico (Admin)
router.post(
  '/:id/assign',
  roleGuard('ADMIN'),
  validate(assignTechnicianSchema),
  ticketController.assignTechnician
);

// POST /api/tickets/:id/reassign — Reasignar técnico (Admin)
router.post(
  '/:id/reassign',
  roleGuard('ADMIN'),
  validate(assignTechnicianSchema),
  ticketController.reassignTechnician
);

// POST /api/tickets/:id/resolve — Técnico envía formulario de cierre
router.post(
  '/:id/resolve',
  roleGuard('TECHNICIAN'),
  validate(resolveTicketSchema),
  ticketController.resolveWithNote
);

// POST /api/tickets/:id/confirm — Solicitante confirma o reabre
router.post(
  '/:id/confirm',
  roleGuard('REQUESTER'),
  validate(confirmTicketSchema),
  ticketController.confirmTicket
);

// GET /api/tickets/:id/closure-report — Descargar Acta de Resolución (PDF)
router.get(
  '/:id/closure-report',
  ticketController.getClosureReport
);

// Montar sub-rutas de comentarios
router.use('/:ticketId/comments', commentRoutes);

export default router;
