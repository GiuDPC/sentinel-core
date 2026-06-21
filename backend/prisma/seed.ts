import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Limpiando datos existentes...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.role.deleteMany();

  console.log('Sembrando datos para Centro Comercial...');

  // Roles
  const [adminRole, techRole, reqRole] = await Promise.all([
    prisma.role.create({ data: { name: 'ADMIN', description: 'Administrador del centro comercial' } }),
    prisma.role.create({ data: { name: 'TECHNICIAN', description: 'Tecnico de mantenimiento' } }),
    prisma.role.create({ data: { name: 'REQUESTER', description: 'Locatario del centro comercial' } }),
  ]);

  // Categorias
  const cats = await Promise.all([
    prisma.category.create({ data: { name: 'Corte Electrico', department: 'MANTENIMIENTO_ELECTRICO', slaHours: 4 } }),
    prisma.category.create({ data: { name: 'Fuga de Agua', department: 'PLOMERIA', slaHours: 6 } }),
    prisma.category.create({ data: { name: 'Falla de Red / Internet', department: 'REDES_Y_TELECOMUNICACIONES', slaHours: 8 } }),
    prisma.category.create({ data: { name: 'Infraestructura Fisica', department: 'INFRAESTRUCTURA', slaHours: 24 } }),
    prisma.category.create({ data: { name: 'Incendio / Emergencia', department: 'SEGURIDAD', slaHours: 1 } }),
    prisma.category.create({ data: { name: 'Sistema de Seguridad', department: 'SEGURIDAD', slaHours: 2 } }),
    prisma.category.create({ data: { name: 'Aire Acondicionado', department: 'OTROS', slaHours: 12 } }),
    prisma.category.create({ data: { name: 'Limpieza General', department: 'OTROS', slaHours: 4 } }),
  ]);

  // Usuarios — passwords documentadas
  const pw = await argon2.hash('SentinelAdmin2026!');
  const tpw = await argon2.hash('Tecnico2026!');
  const rpw = await argon2.hash('Locatario2026!');

  const admin = await prisma.user.create({
    data: { firstName: 'Giuseppe', lastName: 'Admin', email: 'admin@sentinel.local', passwordHash: pw, roleId: adminRole.id, department: 'ADMINISTRACION' },
  });
  const admin2 = await prisma.user.create({
    data: { firstName: 'Director', lastName: 'Operaciones', email: 'director@sentinel.local', passwordHash: pw, roleId: adminRole.id, department: 'ADMINISTRACION' },
  });
  const profAdmin = await prisma.user.create({
    data: { firstName: 'Profesor', lastName: 'Evaluador (Admin)', email: 'profesor.admin@sentinel.local', passwordHash: pw, roleId: adminRole.id, department: 'ADMINISTRACION' },
  });

  const techs = await Promise.all([
    prisma.user.create({ data: { firstName: 'Carlos', lastName: 'Perez', email: 'carlos.perez@sentinel.local', passwordHash: tpw, roleId: techRole.id, department: 'MANTENIMIENTO_ELECTRICO', phone: '0412-1234567' } }),
    prisma.user.create({ data: { firstName: 'Maria', lastName: 'Lopez', email: 'maria.lopez@sentinel.local', passwordHash: tpw, roleId: techRole.id, department: 'PLOMERIA', phone: '0414-7654321' } }),
    prisma.user.create({ data: { firstName: 'Pedro', lastName: 'Ramirez', email: 'pedro.ramirez@sentinel.local', passwordHash: tpw, roleId: techRole.id, department: 'REDES_Y_TELECOMUNICACIONES', phone: '0424-9876543' } }),
    prisma.user.create({ data: { firstName: 'Luis', lastName: 'Fernandez', email: 'luis.fernandez@sentinel.local', passwordHash: tpw, roleId: techRole.id, department: 'INFRAESTRUCTURA', phone: '0416-5551234' } }),
    prisma.user.create({ data: { firstName: 'Andrea', lastName: 'Gutierrez', email: 'andrea.gutierrez@sentinel.local', passwordHash: tpw, roleId: techRole.id, department: 'OTROS', phone: '0426-3334567' } }),
  ]);

  const locs = await Promise.all([
    prisma.user.create({ data: { firstName: 'Profesor', lastName: 'Prueba (Locatario)', email: 'profesor.locatario@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'UNEFA-01', storeName: 'Laboratorio de Evaluacion UNEFA' } }),
    prisma.user.create({ data: { firstName: 'Juan', lastName: 'Garcia', email: 'juan.garcia@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-105', storeName: 'Tienda JG Fashion' } }),
    prisma.user.create({ data: { firstName: 'Ana', lastName: 'Martinez', email: 'ana.martinez@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-210', storeName: 'Cafe Martinez' } }),
    prisma.user.create({ data: { firstName: 'Roberto', lastName: 'Diaz', email: 'roberto.diaz@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-302', storeName: 'Electronica Diaz' } }),
    prisma.user.create({ data: { firstName: 'Carmen', lastName: 'Hernandez', email: 'carmen.hernandez@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-118', storeName: 'Pasteleria Dulce Carmen' } }),
    prisma.user.create({ data: { firstName: 'Sofia', lastName: 'Morales', email: 'sofia.morales@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-450', storeName: 'Boutique Sofia' } }),
    prisma.user.create({ data: { firstName: 'Diego', lastName: 'Torres', email: 'diego.torres@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-515', storeName: 'Sports Zone' } }),
    prisma.user.create({ data: { firstName: 'Valentina', lastName: 'Rivas', email: 'valentina.rivas@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-330', storeName: 'Optica Rivas' } }),
    prisma.user.create({ data: { firstName: 'Miguel', lastName: 'Castillo', email: 'miguel.castillo@sentinel.local', passwordHash: rpw, roleId: reqRole.id, storeNumber: 'L-401', storeName: 'Tech Hub' } }),
  ]);

  // Helpers de tiempo
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

  let num = 1;
  const code = () => `TK-${String(num++).padStart(4, '0')}`;

  // 35 tickets variados
  const defs: any[] = [
    // OPEN (6)
    { title: 'Apagon parcial en local L-105', desc: 'Se fue la luz en la mitad del local', loc: 'Local L-105, Nivel 1', cat: 0, pri: 'HIGH', status: 'OPEN', cr: 0, days: 0, slah: 4 },
    { title: 'Filtracion de agua en techo', desc: 'Goteo constante desde el techo', loc: 'Local L-210, Nivel 2', cat: 1, pri: 'MEDIUM', status: 'OPEN', cr: 1, days: 0, slah: 6 },
    { title: 'Internet lento en food court', desc: 'Velocidad por debajo de 5mbps', loc: 'Food Court, Nivel 3', cat: 2, pri: 'LOW', status: 'OPEN', cr: 2, days: 1, slah: 2 },
    { title: 'Puerta de emergencia trabada', desc: 'No abre correctamente', loc: 'Pasillo B, Nivel 1', cat: 3, pri: 'CRITICAL', status: 'OPEN', cr: 3, days: 0, slah: 22 },
    { title: 'Aire acondicionado hace ruido', desc: 'Ruido metalico al encender', loc: 'Local L-450, Nivel 4', cat: 6, pri: 'MEDIUM', status: 'OPEN', cr: 5, days: 0, slah: 12 },
    { title: 'Cable expuesto en vitrina', desc: 'Cables sin proteccion cerca del mostrador', loc: 'Local L-220, Nivel 2', cat: 0, pri: 'HIGH', status: 'OPEN', cr: 4, days: 0, slah: 1 },
    // ASSIGNED (4)
    { title: 'Corto circuito en vitrina', desc: 'Chispas al conectar vitrina refrigerada', loc: 'Local L-302, Nivel 3', cat: 0, pri: 'CRITICAL', status: 'ASSIGNED', cr: 0, tech: 0, days: 1, slah: 1 },
    { title: 'Tuberia rota en bano publico', desc: 'Fuga en bano de hombres nivel 2', loc: 'Bano Publico, Nivel 2', cat: 1, pri: 'HIGH', status: 'ASSIGNED', cr: 4, tech: 1, days: 1, slah: 3 },
    { title: 'Router principal sin senal', desc: 'No emite senal wifi', loc: 'Cuarto telecom, Nivel 1', cat: 2, pri: 'HIGH', status: 'ASSIGNED', cr: 2, tech: 2, days: 0, slah: 3 },
    { title: 'Goteo persistente en lavamanos', desc: 'Grifo no cierra completamente', loc: 'Bano Mujeres, Nivel 3', cat: 1, pri: 'LOW', status: 'ASSIGNED', cr: 5, tech: 1, days: 1, slah: 5 },
    // IN_PROGRESS (5)
    { title: 'Aire acondicionado no enfria', desc: 'Sistema central no baja de 28 grados', loc: 'Local L-401, Nivel 4', cat: 6, pri: 'MEDIUM', status: 'IN_PROGRESS', cr: 1, tech: 4, days: 2, slah: 10 },
    { title: 'Luz intermitente en pasillo A', desc: 'Las luces parpadean constantemente', loc: 'Pasillo A, Nivel 1', cat: 0, pri: 'MEDIUM', status: 'IN_PROGRESS', cr: 3, tech: 0, days: 2, slah: 1 },
    { title: 'Camara de seguridad offline', desc: 'Camara 14 no transmite imagen', loc: 'Estacionamiento, Sotano 1', cat: 5, pri: 'HIGH', status: 'IN_PROGRESS', cr: 6, tech: 2, days: 1, slah: 1 },
    { title: 'Fuga de agua en cocina', desc: 'Fuga debajo del fregadero', loc: 'Local C-08, Food Court', cat: 1, pri: 'MEDIUM', status: 'IN_PROGRESS', cr: 2, tech: 1, days: 1, slah: 4 },
    { title: 'UPS agotado en servidores', desc: 'Bateria no dura mas de 10 min', loc: 'Cuarto Servidores, Sotano 1', cat: 2, pri: 'HIGH', status: 'IN_PROGRESS', cr: 7, tech: 2, days: 1, slah: 6 },
    // AWAITING_CONFIRMATION (3)
    { title: 'Toma corriente quemada', desc: 'Toma de la pared sur dejo de funcionar', loc: 'Local L-118, Nivel 1', cat: 0, pri: 'HIGH', status: 'AWAITING_CONFIRMATION', cr: 0, tech: 0, days: 3, slah: -12, note: 'Diagnostico: cortocircuito por sobrecarga. Se reemplazo la toma y se verifico el cableado completo.' },
    { title: 'Inundacion en sotano', desc: 'Acumulacion de agua en la rampa', loc: 'Rampa, Sotano 2', cat: 1, pri: 'CRITICAL', status: 'AWAITING_CONFIRMATION', cr: 4, tech: 1, days: 5, slah: -24, note: 'Se reparo la tuberia principal y se instalo bomba de achique. Area completamente seca.' },
    { title: 'Switch de red danado', desc: 'Switch del piso 3 no responde', loc: 'Rack de red, Nivel 3', cat: 2, pri: 'MEDIUM', status: 'AWAITING_CONFIRMATION', cr: 1, tech: 2, days: 4, slah: -8, note: 'Se reemplazo el switch por uno nuevo modelo TP-Link TL-SG1024. Red estable.' },
    // RESOLVED (4)
    { title: 'Alarma contra incendios falsa', desc: 'Se activa sin razon en nivel 2', loc: 'Nivel 2, Zona Este', cat: 4, pri: 'CRITICAL', status: 'RESOLVED', cr: 3, tech: 0, days: 3, slah: -48 },
    { title: 'Baldosa rota en entrada', desc: 'Baldosa suelta, riesgo de caida', loc: 'Entrada Principal', cat: 3, pri: 'HIGH', status: 'RESOLVED', cr: 6, tech: 3, days: 10, slah: -72 },
    { title: 'Wifi caido en nivel 4', desc: 'Ningun dispositivo se conecta', loc: 'Nivel 4 completo', cat: 2, pri: 'HIGH', status: 'RESOLVED', cr: 2, tech: 2, days: 6, slah: -48 },
    { title: 'Vidrio roto en baranda', desc: 'Vidrio agrietado en baranda nivel 4', loc: 'Baranda, Nivel 4', cat: 3, pri: 'HIGH', status: 'RESOLVED', cr: 7, tech: 3, days: 3, slah: -24 },
    // CLOSED (7)
    { title: 'Falla electrica general', desc: 'Apagon total en nivel 3', loc: 'Nivel 3 completo', cat: 0, pri: 'CRITICAL', status: 'CLOSED', cr: 0, tech: 0, days: 15, slah: -168 },
    { title: 'Fuga de gas en cocina', desc: 'Olor a gas detectado', loc: 'Local C-03, Food Court', cat: 4, pri: 'CRITICAL', status: 'CLOSED', cr: 1, tech: 1, days: 12, slah: -120 },
    { title: 'Ascensor fuera de servicio', desc: 'Ascensor 2 atascado', loc: 'Ascensor 2', cat: 3, pri: 'CRITICAL', status: 'CLOSED', cr: 4, tech: 3, days: 20, slah: -240 },
    { title: 'Pintura desprendida', desc: 'Pintura del pasillo C cayendo', loc: 'Pasillo C, Nivel 2', cat: 3, pri: 'LOW', status: 'CLOSED', cr: 3, tech: 1, days: 25, slah: -360 },
    { title: 'Sensor de humo descalibrado', desc: 'Se activa con vapor de plancha', loc: 'Local L-515, Nivel 5', cat: 5, pri: 'MEDIUM', status: 'CLOSED', cr: 6, tech: 2, days: 8, slah: -48 },
    { title: 'Derrame de agua en pasillo', desc: 'Piso resbaloso por fuga menor', loc: 'Pasillo D, Nivel 1', cat: 7, pri: 'MEDIUM', status: 'CLOSED', cr: 5, tech: 1, days: 14, slah: -120 },
    { title: 'Extintor vencido', desc: 'Extintor del local sin vigencia', loc: 'Local L-330, Nivel 3', cat: 4, pri: 'HIGH', status: 'CLOSED', cr: 7, tech: 0, days: 18, slah: -144 },
  ];

  console.log(`Creando ${defs.length} tickets...`);

  for (const t of defs) {
    const created = daysAgo(t.days);
    const due = new Date(created.getTime() + t.slah * 3600000);

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode: code(), title: t.title, description: t.desc, location: t.loc,
        categoryId: cats[t.cat].id, priority: t.pri, status: t.status,
        creatorId: locs[t.cr].id, dueDate: due, createdAt: created,
        ...(t.note ? { resolutionNote: t.note, resolvedAt: hoursAgo(t.days * 24 - 12) } : {}),
      },
    });

    await prisma.auditLog.create({ data: { ticketId: ticket.id, userId: locs[t.cr].id, action: 'TICKET_CREATED', createdAt: created } });

    if (t.tech !== undefined) {
      await prisma.assignment.create({ data: { ticketId: ticket.id, technicianId: techs[t.tech].id, assignedAt: new Date(created.getTime() + 1800000) } });
      await prisma.auditLog.create({ data: { ticketId: ticket.id, userId: admin.id, action: 'STATUS_CHANGE', oldValue: 'OPEN', newValue: 'ASSIGNED', createdAt: new Date(created.getTime() + 1800000) } });
    }
    if (['IN_PROGRESS','AWAITING_CONFIRMATION','RESOLVED','CLOSED'].includes(t.status) && t.tech !== undefined) {
      await prisma.auditLog.create({ data: { ticketId: ticket.id, userId: techs[t.tech].id, action: 'STATUS_CHANGE', oldValue: 'ASSIGNED', newValue: 'IN_PROGRESS', createdAt: new Date(created.getTime() + 3600000) } });
    }
    if (['AWAITING_CONFIRMATION','RESOLVED','CLOSED'].includes(t.status) && t.tech !== undefined) {
      await prisma.auditLog.create({ data: { ticketId: ticket.id, userId: techs[t.tech].id, action: 'STATUS_CHANGE', oldValue: 'IN_PROGRESS', newValue: 'AWAITING_CONFIRMATION', createdAt: new Date(due.getTime() - 1800000) } });
    }
    if (['CLOSED'].includes(t.status)) {
      await prisma.auditLog.create({ data: { ticketId: ticket.id, userId: locs[t.cr].id, action: 'STATUS_CHANGE', oldValue: 'AWAITING_CONFIRMATION', newValue: 'CLOSED', createdAt: new Date(due.getTime() + 3600000) } });
    }

    // Comentarios para tickets en progreso o superiores
    if (['IN_PROGRESS','AWAITING_CONFIRMATION','RESOLVED','CLOSED'].includes(t.status) && t.tech !== undefined) {
      await prisma.comment.create({ data: { ticketId: ticket.id, userId: techs[t.tech].id, content: 'Revisando el problema, me dirijo a la ubicacion.', isInternal: false, createdAt: new Date(created.getTime() + 5400000) } });
    }
  }

  console.log(`\n=== SEED COMPLETADO ===`);
  console.log(`Roles: 3 | Categorias: ${cats.length} | Admins: 3 | Tecnicos: ${techs.length} | Locatarios: ${locs.length}`);
  console.log(`Tickets: ${defs.length} (6 OPEN, 4 ASSIGNED, 5 IN_PROGRESS, 3 AWAITING, 4 RESOLVED, 7 CLOSED)`);
  console.log(`\nCredenciales de Acceso para el Jurado Evaluador (UNEFA):`);
  console.log(`  👨‍💻 Admin:      profesor.admin@sentinel.local      / SentinelAdmin2026!`);
  console.log(`  🏬 Locatario:  profesor.locatario@sentinel.local  / Locatario2026!`);
  console.log(`\nCredenciales de Prueba Extra:`);
  console.log(`  🛠️ Tecnico:    carlos.perez@sentinel.local        / Tecnico2026!`);
  console.log(`  👨‍💼 Admin Ppal: admin@sentinel.local               / SentinelAdmin2026!`);
}

main()
  .catch((e) => { console.error('Error:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
