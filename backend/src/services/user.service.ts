import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { Department } from '../../generated/prisma/index.js';

async function findAll() {
  const users = await prisma.user.findMany({
    include: {
      role: true,
      _count: { select: { tickets: true, assignments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users.map(({ passwordHash, ...user }) => user);
}

async function findById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function update(id: string, data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: Department;
  roleId?: number;
  isActive?: boolean;
  storeNumber?: string;
  storeName?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new AppError(409, 'El email ya está en uso');
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...data,
      department: data.department ?? undefined,
    },
    include: { role: true },
  });

  const { passwordHash, ...safeUser } = updated;
  return safeUser;
}

async function softDelete(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'Usuario desactivado' };
}


async function updateProfile(id: string, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeNumber?: string;
  storeName?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName ?? user.firstName,
      lastName: data.lastName ?? user.lastName,
      phone: data.phone ?? user.phone,
      storeNumber: data.storeNumber ?? user.storeNumber,
      storeName: data.storeName ?? user.storeName,
    },
    include: { role: true },
  });

  return {
    id: updated.id,
    firstName: updated.firstName,
    lastName: updated.lastName,
    email: updated.email,
    role: updated.role.name,
    department: updated.department,
    phone: updated.phone,
    storeNumber: updated.storeNumber,
    storeName: updated.storeName,
    createdAt: updated.createdAt,
  };
}

export const userService = { findAll, findById, update, softDelete, updateProfile };
