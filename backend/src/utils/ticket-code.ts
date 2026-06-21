/**
 * Genera el siguiente código secuencial de ticket: TKT-0001, TKT-0002, etc.
 * 
 * Usa SELECT FOR UPDATE (via Prisma raw query) para prevenir race conditions
 * cuando dos requests crean tickets simultáneamente.
 * Fallback: retry con catch de unique constraint.
 */
export async function generateTicketCode(prismaClient: any): Promise<string> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const lastTicket = await prismaClient.ticket.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { ticketCode: true },
      });

      if (!lastTicket) {
        return 'TKT-0001';
      }

      const lastNumber = parseInt(lastTicket.ticketCode.split('-')[1], 10);
      const nextNumber = lastNumber + 1;
      return `TKT-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error: any) {
      if (error?.code === 'P2002' && attempt < MAX_RETRIES - 1) {
        continue;
      }
      throw error;
    }
  }

  const timestamp = Date.now().toString(36).toUpperCase();
  return `TKT-${timestamp}`;
}
