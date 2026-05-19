import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { Department } from '../../generated/prisma/index.js';

async function findAll() {
    return prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    });
}

async function findById(id: number) {
    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category || !category.isActive) {
        throw new AppError(404, 'Categoria no encontrada');
    }

    return category;
}

async function create(data: { name: string; department: string; slaHours: number }) {
    const existing = await prisma.category.findUnique({
        where: { name: data.name },
    });
    if (existing) {
        throw new AppError(409, 'La categoria ya existe');
    }

    return prisma.category.create({
        data: {
            name: data.name,
            department: data.department as Department,
            slaHours: data.slaHours,
        },
    });
}

async function update(id: number, data: { name?: string; department?: string; slaHours?: number; isActive?: boolean }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw new AppError(404, 'Categoria no encontrada');
    }

    return prisma.category.update({
        where: { id },
        data: {
            name: data.name ?? category.name,
            department: data.department ? data.department as Department : category.department,
            slaHours: data.slaHours ?? category.slaHours,
            isActive: data.isActive ?? category.isActive,
        },
    });
}

async function softDelete(id: number) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
        throw new AppError(404, 'Categoria no encontrada');
    }

    await prisma.category.update({
        where: { id },
        data: { isActive: false },
    });

    return { message: 'Categoria desactivada' };
}

export const categoryService = { findAll, findById, create, update, softDelete };