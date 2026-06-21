import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', categoryController.findAll);

router.get('/:id', categoryController.findById);

router.post(
  '/',
  roleGuard('ADMIN'),
  validate(createCategorySchema),
  categoryController.create
);

router.patch(
  '/:id',
  roleGuard('ADMIN'),
  validate(updateCategorySchema),
  categoryController.update
);

router.delete(
  '/:id',
  roleGuard('ADMIN'),
  categoryController.softDelete
);

export default router;
