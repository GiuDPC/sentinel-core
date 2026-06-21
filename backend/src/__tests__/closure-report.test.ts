import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config/prisma.js', () => ({
  prisma: {
    ticket: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('pdfmake', () => {
  return {
    default: {
      setFonts: vi.fn(),
      createPdf: vi.fn().mockReturnValue({
        getBuffer: () => Promise.resolve(Buffer.from('%PDF-1.4-mock-content')),
      }),
    },
  };
});

import { closureReportService } from '../services/closure-report.service.js';
import { prisma } from '../config/prisma.js';

const mockTicket = {
  id: 'test-uuid-1234',
  ticketCode: 'TKT-0042',
  title: 'Aire acondicionado no enfría',
  description: 'El local 15 reporta que el aire no enfría desde ayer.',
  location: 'Local 15 - Planta Baja',
  status: 'CLOSED',
  priority: 'HIGH',
  dueDate: new Date('2026-06-22T12:00:00Z'),
  resolutionNote: 'Se reemplazó el compresor del aire acondicionado.',
  resolvedAt: new Date('2026-06-21T10:00:00Z'),
  timeSpentMinutes: 180,
  materialsUsed: '1 compresor, 2 kg gas R410A',
  createdAt: new Date('2026-06-20T08:00:00Z'),
  updatedAt: new Date('2026-06-21T10:00:00Z'),
  category: { id: 1, name: 'Mantenimiento Eléctrico', department: 'MANTENIMIENTO_ELECTRICO', slaHours: 24 },
  creator: {
    id: 'creator-uuid',
    firstName: 'María',
    lastName: 'González',
    email: 'maria@tienda.com',
    storeNumber: 'L-15',
    storeName: 'Tienda Fashion',
  },
  assignments: [
    {
      technician: {
        id: 'tech-uuid',
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        department: 'MANTENIMIENTO_ELECTRICO',
      },
    },
  ],
};

describe('closureReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a PDF buffer for a resolved ticket', async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(mockTicket as never);

    const buffer = await closureReportService.generateClosureReport('test-uuid-1234');

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(prisma.ticket.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-uuid-1234' },
      include: expect.objectContaining({
        category: true,
        creator: expect.any(Object),
        assignments: expect.any(Object),
      }),
    });
  });

  it('throws 404 when ticket does not exist', async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue(null);

    await expect(
      closureReportService.generateClosureReport('nonexistent')
    ).rejects.toThrow('Ticket no encontrado');
  });

  it('throws 422 when ticket is not resolved/closed', async () => {
    vi.mocked(prisma.ticket.findUnique).mockResolvedValue({
      ...mockTicket,
      status: 'IN_PROGRESS',
    } as never);

    await expect(
      closureReportService.generateClosureReport('test-uuid-1234')
    ).rejects.toThrow('solo está disponible para tickets resueltos o cerrados');
  });
});
