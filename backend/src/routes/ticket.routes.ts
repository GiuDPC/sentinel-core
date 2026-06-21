import { Router } from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { createTicketSchema, updateStatusSchema, resolveTicketSchema, confirmTicketSchema } from '../schemas/ticket.schema.js';
import { assignTechnicianSchema } from '../schemas/assignment.schema.js';
import commentRoutes from './comment.routes.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  roleGuard('ADMIN', 'REQUESTER'),
  validate(createTicketSchema),
  ticketController.create
);

router.get('/', roleGuard('ADMIN'), ticketController.findAll);

router.get(
  '/technicians/workload',
  roleGuard('ADMIN'),
  ticketController.getTechniciansWorkload
);

router.get(
  '/my-tickets',
  roleGuard('REQUESTER'),
  ticketController.findMyTickets
);

router.get(
  '/assigned',
  roleGuard('TECHNICIAN'),
  ticketController.findAssigned
);

router.get('/:id', ticketController.findById);

router.patch(
  '/:id/status',
  roleGuard('ADMIN', 'TECHNICIAN'),
  validate(updateStatusSchema),
  ticketController.updateStatus
);

router.post(
  '/:id/assign',
  roleGuard('ADMIN'),
  validate(assignTechnicianSchema),
  ticketController.assignTechnician
);

router.post(
  '/:id/reassign',
  roleGuard('ADMIN'),
  validate(assignTechnicianSchema),
  ticketController.reassignTechnician
);

router.post(
  '/:id/resolve',
  roleGuard('TECHNICIAN'),
  validate(resolveTicketSchema),
  ticketController.resolveWithNote
);

router.post(
  '/:id/confirm',
  roleGuard('REQUESTER'),
  validate(confirmTicketSchema),
  ticketController.confirmTicket
);

// H1: Closure report accesible solo por roles con acceso al ticket (Admin, Technician, Requester del ticket)
router.get(
  '/:id/closure-report',
  roleGuard('ADMIN', 'TECHNICIAN', 'REQUESTER'),
  ticketController.getClosureReport
);

router.use('/:ticketId/comments', commentRoutes);

export default router;
