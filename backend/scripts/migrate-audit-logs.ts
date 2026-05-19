import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('Migrando logs de auditoría antiguos...');

  // Buscar todos los logs de asignación o reasignación que tengan UUIDs
  const logs = await prisma.auditLog.findMany({
    where: {
      action: { in: ['ASSIGNMENT', 'REASSIGNMENT'] },
      OR: [
        { oldValue: { contains: '-' } },
        { newValue: { contains: '-' } }
      ]
    }
  });

  console.log(`Encontrados ${logs.length} logs para actualizar.`);

  for (const log of logs) {
    let newOldValue = log.oldValue;
    let newNewValue = log.newValue;

    // Si oldValue parece un UUID, buscar el usuario
    if (log.oldValue && log.oldValue.length > 30 && log.oldValue.includes('-')) {
      const user = await prisma.user.findUnique({ where: { id: log.oldValue } });
      if (user) {
        newOldValue = `${user.firstName} ${user.lastName}`;
      }
    }

    // Si newValue parece un UUID, buscar el usuario
    if (log.newValue && log.newValue.length > 30 && log.newValue.includes('-')) {
      const user = await prisma.user.findUnique({ where: { id: log.newValue } });
      if (user) {
        newNewValue = `${user.firstName} ${user.lastName}`;
      }
    }

    // Actualizar log si hubo cambios
    if (newOldValue !== log.oldValue || newNewValue !== log.newValue) {
      await prisma.auditLog.update({
        where: { id: log.id },
        data: {
          oldValue: newOldValue,
          newValue: newNewValue
        }
      });
      console.log(`Log ${log.id} actualizado.`);
    }
  }

  console.log('Migración completada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
