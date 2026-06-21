import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';  
import { createTicketSchema, updateStatusSchema } from '../schemas/ticket.schema.js';
import { createCommentSchema } from '../schemas/comment.schema.js';
import { assignTechnicianSchema } from '../schemas/assignment.schema.js';
import { updateUserSchema } from '../schemas/user.schema.js';

const registry = new OpenAPIRegistry();

// Autenticación por Cookie
const cookieAuth = registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'token',
});


// -------------------------------------------------------------
// SCHEMAS
// -------------------------------------------------------------
registry.register('LoginInput', loginSchema);
registry.register('RegisterInput', registerSchema);
registry.register('CreateTicketInput', createTicketSchema);
registry.register('UpdateTicketStatusInput', updateStatusSchema);
registry.register('CreateCommentInput', createCommentSchema);
registry.register('AssignTicketInput', assignTechnicianSchema);
registry.register('UpdateRoleInput', updateUserSchema);

const errorResponse = {
  description: 'Error',
  content: {
    'application/json': {
      schema: z.object({ error: z.string() })
    }
  }
};

const messageResponse = {
  description: 'Éxito',
  content: {
    'application/json': {
      schema: z.object({ message: z.string() })
    }
  }
};

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Iniciar sesión',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: loginSchema } } },
  },
  responses: {
    200: {
      description: 'Login exitoso y cookie de sesión establecida. \n\n**IMPORTANTE**: Swagger guardará la cookie automáticamente para probar los demás endpoints protegidos.',
      content: {
        'application/json': {
          schema: z.object({
            user: z.object({ id: z.number(), email: z.string(), role: z.string() })
          })
        }
      }
    },
    400: errorResponse,
    401: errorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/register-public',
  summary: 'Registro público de ciudadano',
  tags: ['Auth'],
  request: {
    body: { content: { 'application/json': { schema: registerSchema } } },
  },
  responses: {
    201: messageResponse,
    400: errorResponse
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/register-staff',
  summary: 'Registro de personal (Solo Admin)',
  tags: ['Auth'],
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: registerSchema } } },
  },
  responses: {
    201: messageResponse,
    400: errorResponse,
    401: errorResponse,
    403: errorResponse
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/logout',
  summary: 'Cerrar sesión',
  tags: ['Auth'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: messageResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  summary: 'Obtener usuario autenticado',
  tags: ['Auth'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Usuario actual',
      content: {
        'application/json': {
          schema: z.object({ id: z.number(), email: z.string(), role: z.string() })
        }
      }
    },
    401: errorResponse,
  },
});

// -------------------------------------------------------------
// CATEGORY ROUTES
// -------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/categories',
  summary: 'Obtener todas las categorías',
  tags: ['Categorías'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Lista de categorías' },
    401: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/categories/{id}',
  summary: 'Obtener categoría por ID',
  tags: ['Categorías'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: { description: 'Categoría' },
    404: errorResponse,
  },
});

// -------------------------------------------------------------
// TICKET ROUTES
// -------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/tickets',
  summary: 'Obtener lista de tickets (paginado)',
  tags: ['Tickets'],
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      status: z.string().optional(),
      categoryId: z.string().optional(),
    }),
  },
  responses: {
    200: { description: 'Lista de tickets paginada' },
    401: errorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/tickets',
  summary: 'Crear un nuevo ticket',
  tags: ['Tickets'],
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { 'application/json': { schema: createTicketSchema } } },
  },
  responses: {
    201: { description: 'Ticket creado' },
    400: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/tickets/{id}',
  summary: 'Obtener ticket por ID con relaciones',
  tags: ['Tickets'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: { description: 'Detalle del ticket' },
    404: errorResponse,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/tickets/{id}/status',
  summary: 'Actualizar estado del ticket (Moderador/Admin)',
  tags: ['Tickets'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateStatusSchema } } },
  },
  responses: {
    200: { description: 'Estado actualizado' },
    400: errorResponse,
    403: errorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/tickets/{id}/assign',
  summary: 'Asignar ticket a un moderador (Admin)',
  tags: ['Tickets'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: assignTechnicianSchema } } },
  },
  responses: {
    200: { description: 'Ticket asignado' },
    403: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/tickets/{id}/closure-report',
  summary: 'Descargar acta de resolución técnica (PDF)',
  tags: ['Tickets'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: { 
      description: 'Documento PDF generado exitosamente',
      content: { 'application/pdf': { schema: z.string() } }
    },
    400: errorResponse,
    403: errorResponse,
    404: errorResponse,
  },
});

// -------------------------------------------------------------
// COMMENT ROUTES
// -------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/tickets/{ticketId}/comments',
  summary: 'Obtener comentarios de un ticket',
  tags: ['Comentarios'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ ticketId: z.string() })
  },
  responses: {
    200: { description: 'Comentarios' },
    404: errorResponse,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/tickets/{ticketId}/comments',
  summary: 'Agregar comentario a un ticket',
  tags: ['Comentarios'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ ticketId: z.string() }),
    body: { content: { 'application/json': { schema: createCommentSchema } } },
  },
  responses: {
    201: { description: 'Comentario creado' },
    404: errorResponse,
  },
});

// -------------------------------------------------------------
// USER ROUTES
// -------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/users',
  summary: 'Listar usuarios (Admin)',
  tags: ['Usuarios'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Usuarios' },
    403: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  summary: 'Obtener usuario (Admin)',
  tags: ['Usuarios'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: 'Detalle usuario' },
    404: errorResponse,
    403: errorResponse,
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/users/{id}/role',
  summary: 'Actualizar rol de usuario (Admin)',
  tags: ['Usuarios'],
  security: [{ cookieAuth: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: { content: { 'application/json': { schema: updateUserSchema } } },
  },
  responses: {
    200: messageResponse,
    403: errorResponse,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/users/{id}',
  summary: 'Desactivar usuario (Admin)',
  tags: ['Usuarios'],
  security: [{ cookieAuth: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: messageResponse,
    403: errorResponse,
  },
});

// -------------------------------------------------------------
// METRICS ROUTES
// -------------------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/metrics/dashboard',
  summary: 'Métricas principales (Admin)',
  tags: ['Métricas'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Métricas' },
    403: errorResponse,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/metrics/sla-breached',
  summary: 'Tickets que violan el SLA (Admin)',
  tags: ['Métricas'],
  security: [{ cookieAuth: [] }],
  responses: {
    200: { description: 'Tickets SLA' },
    403: errorResponse,
  },
});

export function generateOpenApiConfig() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Sentinel-Core API',
      description: 'API Documentada autogenerada con Zod para Sentinel-Core.',
    },
  });
}
