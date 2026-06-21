import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiConfig } from './docs/swagger.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

const app = express();

// H5: trust proxy solo en producción (Render usa proxy reverso)
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// H4: Security headers — protección contra XSS, clickjacking, sniffing, etc.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Necesario para PDFs desde Vercel
  contentSecurityPolicy: false, // El frontend es SPA en Vercel, no aplica CSP aquí
}));

// C1: Swagger/OpenAPI solo disponible en entornos NO productivos
if (env.NODE_ENV !== 'production') {
  const swaggerDocument = generateOpenApiConfig();
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

app.use(compression());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate limiting global — más conservador para Render
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // Reducido de 500: más seguro sin sacrificar UX normal
  message: { error: 'Demasiadas peticiones, intentá en 15 minutos' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
