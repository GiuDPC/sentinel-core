import type { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service.js';

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const comment = await commentService.create({
      ticketId: String(req.params.ticketId),
      userId: req.user!.id,
      userRole: req.user!.role, // H2: necesario para ownership y bloqueo de isInternal
      content: req.body.content,
      isInternal: req.body.isInternal,
    });
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}

async function findByTicketId(req: Request, res: Response, next: NextFunction) {
  try {
    const comments = await commentService.findByTicketId(
      String(req.params.ticketId),
      req.user!.role
    );
    res.json({ comments });
  } catch (error) {
    next(error);
  }
}

export const commentController = { create, findByTicketId };
