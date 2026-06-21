import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { createCommentSchema } from '../schemas/comment.schema.js';

const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.post('/', validate(createCommentSchema), commentController.create);

router.get('/', commentController.findByTicketId);

export default router;
