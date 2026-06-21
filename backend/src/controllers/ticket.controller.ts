import type { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service.js';
import { assignmentService } from '../services/assignment.service.js';
import { closureReportService } from '../services/closure-report.service.js';


async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.create({
      ...req.body,
      creatorId: req.user!.id,
    });
    res.status(201).json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function findAll(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.findAll({
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      search: req.query.search as string | undefined,
      categoryId: req.query.categoryId
        ? parseInt(req.query.categoryId as string, 10)
        : undefined,
      page: req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined,
      limit: req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function findById(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.findById(
      String(req.params.id),
      req.user?.role
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.updateStatus(
      String(req.params.id),
      req.body.status,
      req.user!.id,
      req.user!.role
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function assignTechnician(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await assignmentService.assignTechnician(
      String(req.params.id),
      req.body.technicianId,
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function reassignTechnician(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await assignmentService.reassignTechnician(
      String(req.params.id),
      req.body.technicianId,
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function getTechniciansWorkload(req: Request, res: Response, next: NextFunction) {
  try {
    const department = req.query.department as string | undefined;
    const result = await assignmentService.getTechniciansByWorkload(department);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function findMyTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.findByCreator(req.user!.id, {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function findAssigned(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ticketService.findAssigned(req.user!.id, {
      status: req.query.status as string | undefined,
      priority: req.query.priority as string | undefined,
      search: req.query.search as string | undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function resolveWithNote(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.resolveWithNote(
      String(req.params.id),
      {
        resolutionNote: req.body.resolutionNote,
        timeSpentMinutes: req.body.timeSpentMinutes,
        materialsUsed: req.body.materialsUsed,
      },
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function confirmTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const ticket = await ticketService.confirmTicket(
      String(req.params.id),
      {
        confirmed: req.body.confirmed,
        comment: req.body.comment,
      },
      req.user!.id
    );
    res.json({ ticket });
  } catch (error) {
    next(error);
  }
}

async function getClosureReport(req: Request, res: Response, next: NextFunction) {
  try {
    const pdfBuffer = await closureReportService.generateClosureReport(String(req.params.id));
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta-resolucion-${req.params.id.slice(0, 8)}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

export const ticketController = {
  create, findAll, findById, updateStatus,
  assignTechnician, reassignTechnician, getTechniciansWorkload,
  findMyTickets, findAssigned,
  resolveWithNote, confirmTicket, getClosureReport,
};
