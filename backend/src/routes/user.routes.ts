import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { updateUserSchema, updateProfileSchema } from '../schemas/user.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', roleGuard('ADMIN'), userController.findAll);

router.patch(
  '/profile',
  validate(updateProfileSchema),
  userController.updateProfile
);

router.get('/:id', roleGuard('ADMIN'), userController.findById);

router.patch(
  '/:id',
  roleGuard('ADMIN'),
  validate(updateUserSchema),
  userController.update
);

router.delete('/:id', roleGuard('ADMIN'), userController.softDelete);

export default router;