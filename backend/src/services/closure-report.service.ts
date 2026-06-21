import pdfmake from 'pdfmake';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces.js';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { isSlaBreached } from '../utils/sla-calculator.js';
import { TICKET_STATUS } from '../config/constants.js';

const fonts = {
  Roboto: {
    normal: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Regular.ttf',
    bold: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Medium.ttf',
    italics: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-Italic.ttf',
    bolditalics: 'node_modules/pdfmake/build/fonts/Roboto/Roboto-MediumItalic.ttf',
  },
};

pdfmake.setFonts(fonts);

const COLORS = {
  primary: '#001B52',
  success: '#059669',
  danger: '#DC2626',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
};

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('es-VE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMinutes(minutes: number | null): string {
  if (!minutes) return '— (no registrado)';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

function calculateMTTR(createdAt: Date, resolvedAt: Date | null): string {
  if (!resolvedAt) return '— (en curso)';
  const diff = new Date(resolvedAt).getTime() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Abierto',
  IN_PROGRESS: 'En Progreso',
  AWAITING_CONFIRMATION: 'Por Confirmar',
  RESOLVED: 'Resuelto',
  CLOSED: 'Cerrado',
  CANCELLED: 'Cancelado',
};

async function generateClosureReport(ticketId: string): Promise<Buffer> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true, storeNumber: true, storeName: true },
      },
      assignments: {
        include: {
          technician: {
            select: { id: true, firstName: true, lastName: true, department: true },
          },
        },
      },
    },
  });

  if (!ticket) throw new AppError(404, 'Ticket no encontrado');

  const validStatuses = [TICKET_STATUS.RESOLVED, TICKET_STATUS.AWAITING_CONFIRMATION, TICKET_STATUS.CLOSED];
  if (!validStatuses.includes(ticket.status as typeof validStatuses[number])) {
    throw new AppError(422, 'El acta de resolución solo está disponible para tickets resueltos o cerrados');
  }

  const technician = ticket.assignments[0]?.technician;
  const techName = technician ? `${technician.firstName} ${technician.lastName}` : 'No asignado';
  const slaBreached = isSlaBreached(ticket.dueDate);
  const slaStatus = slaBreached ? 'VENCIDO' : 'CUMPLIDO';
  const slaColor = slaBreached ? COLORS.danger : COLORS.success;
  const mttr = calculateMTTR(ticket.createdAt, ticket.resolvedAt);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'LETTER',
    pageMargins: [40, 60, 40, 60],

    header: {
      columns: [
        {
          text: 'ACTA DE RESOLUCIÓN TÉCNICA',
          style: 'headerTitle',
          margin: [40, 20, 0, 0],
        },
        {
          text: `#${ticket.ticketCode}`,
          style: 'headerCode',
          alignment: 'right',
          margin: [0, 20, 40, 0],
        },
      ],
    },

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: `Generado automáticamente por SentinelCore — ${formatDate(new Date())}`,
          style: 'footerText',
          margin: [40, 0, 0, 0],
        },
        {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'right',
          style: 'footerText',
          margin: [0, 0, 40, 0],
        },
      ],
    }),

    content: [
      {
        canvas: [{ type: 'rect', x: 0, y: 0, w: 535, h: 4, color: COLORS.primary }],
        margin: [0, 0, 0, 15] as [number, number, number, number],
      } as Content,
      {
        text: 'SentinelCore — Sistema de Gestión Operativa',
        style: 'subtitle',
        margin: [0, 0, 0, 5] as [number, number, number, number],
      },
      {
        text: 'Centro Comercial Sambil Paraguaná',
        style: 'institutionName',
        margin: [0, 0, 0, 20] as [number, number, number, number],
      },

      { text: 'DATOS DEL SOLICITANTE', style: 'sectionHeader', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Nombre', style: 'tableLabel' },
              { text: 'Local', style: 'tableLabel' },
              { text: 'Tienda', style: 'tableLabel' },
              { text: 'Email', style: 'tableLabel' },
            ],
            [
              { text: `${ticket.creator.firstName} ${ticket.creator.lastName}`, style: 'tableValue' },
              { text: ticket.creator.storeNumber || '—', style: 'tableValue' },
              { text: ticket.creator.storeName || '—', style: 'tableValue' },
              { text: ticket.creator.email, style: 'tableValue' },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          fillColor: (rowIndex: number) => rowIndex === 0 ? COLORS.bg : null,
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 18] as [number, number, number, number],
      },

      { text: 'DETALLE DE LA INCIDENCIA', style: 'sectionHeader', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Categoría', style: 'tableLabel' },
              { text: 'Prioridad', style: 'tableLabel' },
              { text: 'Ubicación', style: 'tableLabel' },
              { text: 'Estado', style: 'tableLabel' },
            ],
            [
              { text: ticket.category?.name || 'General', style: 'tableValue' },
              { text: PRIORITY_LABELS[ticket.priority] || ticket.priority, style: 'tableValue' },
              { text: ticket.location, style: 'tableValue' },
              { text: STATUS_LABELS[ticket.status] || ticket.status, style: 'tableValue' },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          fillColor: (rowIndex: number) => rowIndex === 0 ? COLORS.bg : null,
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      {
        text: [
          { text: 'Descripción: ', bold: true },
          ticket.description,
        ],
        style: 'bodyText',
        margin: [0, 0, 0, 18] as [number, number, number, number],
      },

      { text: 'MÉTRICAS DE ACUERDO DE NIVEL DE SERVICIO (ANS)', style: 'sectionHeader', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          widths: ['25%', '25%', '25%', '25%'],
          body: [
            [
              { text: 'Fecha Apertura', style: 'tableLabel' },
              { text: 'Fecha Resolución', style: 'tableLabel' },
              { text: 'MTTR', style: 'tableLabel' },
              { text: 'Cumplimiento ANS', style: 'tableLabel' },
            ],
            [
              { text: formatDate(ticket.createdAt), style: 'tableValue' },
              { text: formatDate(ticket.resolvedAt), style: 'tableValue' },
              { text: mttr, style: 'tableValue', bold: true },
              { text: slaStatus, style: 'tableValue', bold: true, color: slaColor },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          fillColor: (rowIndex: number) => rowIndex === 0 ? COLORS.bg : null,
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      ticket.dueDate ? {
        text: [
          { text: 'Fecha límite SLA: ', bold: true },
          formatDate(ticket.dueDate),
          slaBreached ? ' (excedido)' : ' (dentro del plazo)',
        ],
        style: 'bodyText',
        color: slaBreached ? COLORS.danger : COLORS.muted,
        margin: [0, 0, 0, 18] as [number, number, number, number],
      } as Content : { text: '', margin: [0, 0, 0, 18] as [number, number, number, number] } as Content,

      { text: 'TRAZABILIDAD DEL SERVICIO', style: 'sectionHeader', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'Técnico Asignado', style: 'tableLabel' }, { text: techName, style: 'tableValue' }],
            [{ text: 'Departamento', style: 'tableLabel' }, { text: technician?.department || '—', style: 'tableValue' }],
            [
              { text: 'Nota de Resolución', style: 'tableLabel' },
              { text: ticket.resolutionNote || '— (sin nota)', style: 'tableValue' },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          fillColor: (rowIndex: number) => rowIndex % 2 === 0 ? COLORS.bg : null,
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 18] as [number, number, number, number],
      },

      { text: 'CONSUMO DE RECURSOS OPERATIVOS', style: 'sectionHeader', margin: [0, 0, 0, 8] as [number, number, number, number] },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [
              { text: 'Tiempo Invertido', style: 'tableLabel' },
              { text: formatMinutes(ticket.timeSpentMinutes), style: 'tableValue' },
            ],
            [
              { text: 'Materiales Utilizados', style: 'tableLabel' },
              { text: ticket.materialsUsed || '— (sin materiales registrados)', style: 'tableValue' },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORS.border,
          vLineColor: () => COLORS.border,
          fillColor: (rowIndex: number) => rowIndex % 2 === 0 ? COLORS.bg : null,
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 8,
          paddingRight: () => 8,
        },
        margin: [0, 0, 0, 24] as [number, number, number, number],
      },

      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 535, y2: 0, lineWidth: 0.5, lineColor: COLORS.border }],
        margin: [0, 0, 0, 10] as [number, number, number, number],
      } as Content,
      {
        text: 'Este documento ha sido generado de forma automatizada por el sistema SentinelCore y constituye un comprobante oficial de la gestión operativa realizada.',
        style: 'disclaimer',
        margin: [0, 0, 0, 0] as [number, number, number, number],
      },
    ],

    styles: {
      headerTitle: { fontSize: 10, bold: true, color: COLORS.primary, characterSpacing: 1 },
      headerCode: { fontSize: 10, bold: true, color: COLORS.muted },
      subtitle: { fontSize: 9, color: COLORS.muted },
      institutionName: { fontSize: 14, bold: true, color: COLORS.primary },
      sectionHeader: { fontSize: 9, bold: true, color: COLORS.primary, characterSpacing: 0.5 },
      tableLabel: { fontSize: 8, color: COLORS.muted, bold: true },
      tableValue: { fontSize: 9, color: '#1E293B' },
      bodyText: { fontSize: 9, color: '#334155', lineHeight: 1.4 },
      footerText: { fontSize: 7, color: COLORS.muted },
      disclaimer: { fontSize: 7, color: COLORS.muted, italics: true, alignment: 'center' as const },
    },

    defaultStyle: { font: 'Roboto' },
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = pdfmake.createPdf(docDefinition);
      pdfDoc.getBuffer().then((buffer: Buffer) => resolve(buffer)).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

export const closureReportService = { generateClosureReport };
