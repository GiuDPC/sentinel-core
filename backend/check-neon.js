import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_CI0jNxOvPmR2@ep-muddy-glitter-ai0sb955.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

async function main() {
  const users = await prisma.user.count();
  const tickets = await prisma.ticket.count();
  console.log(`Users: ${users}`);
  console.log(`Tickets: ${tickets}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
