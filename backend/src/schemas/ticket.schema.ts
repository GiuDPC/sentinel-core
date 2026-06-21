import { z } from 'zod';

export const createTicketSchema = z.object({
    title: z.string().min(5, 'El titulo debe tener minimo 5 caracteres'),
    description: z.string().min(10, 'Describi el problema con al menos 10 caracteres'),
    location: z.string().min(3, 'Indica la ubicacion del problema'),
    categoryId: z.number().int().positive('Categoria invalida'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'OPEN', 'ASSIGNED', 'IN_PROGRESS',
    'ON_HOLD', 'RESOLVED', 'AWAITING_CONFIRMATION', 'CLOSED',
  ]),
});

export const resolveTicketSchema = z.object({
  resolutionNote: z.string().min(10, 'La nota de resolución debe tener al menos 10 caracteres'),
  timeSpentMinutes: z.number().int().min(1, 'El tiempo debe ser al menos 1 minuto').optional(),
  materialsUsed: z.string().max(500, 'Máximo 500 caracteres').optional(),
});

export const confirmTicketSchema = z.object({
  confirmed: z.boolean(),
  comment: z.string().optional(),
});