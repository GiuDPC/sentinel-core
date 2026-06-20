import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleGuard } from '../middlewares/role.middleware.js';
import { loginSchema, registerSchema, registerPublicSchema, changePasswordSchema } from '../schemas/auth.schema.js';

const router = Router();

// Rate limiter específico para login — previene brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login, intentá en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { error: 'Demasiados registros desde esta IP, por favor intentá en 1 hora' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/login — Público (con rate limit estricto)
router.post('/login', loginLimiter, validate(loginSchema), authController.login);

// POST /api/auth/register — Solo Admin (crea cualquier rol)
router.post(
  '/register',
  authMiddleware,
  roleGuard('ADMIN'),
  validate(registerSchema),
  authController.register
);

// POST /api/auth/register-public — Público (solo crea REQUESTER, phone opcional)
router.post(
  '/register-public',
  registerLimiter,
  validate(registerPublicSchema),
  authController.registerPublic
);

// POST /api/auth/logout — Autenticado
router.post('/logout', authMiddleware, authController.logout);

// GET /api/auth/me — Obtener usuario actual
router.get('/me', authMiddleware, authController.me);

// POST /api/auth/change-password — Cambiar contraseña (cualquier usuario autenticado)
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  authController.changePassword
);

export default router;
