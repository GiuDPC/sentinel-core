// Calcula la fecha límite según el SLA. Ejemplo: createdAt = 10 Abr 08:00, slaHours = 4, resultado = 10 Abr 12:00
export function calculateDueDate(createdAt: Date, slaHours: number): Date {
    const dueDate = new Date(createdAt.getTime());
    dueDate.setHours(dueDate.getHours() + slaHours);
    return dueDate;
}

// Verifica si un ticket superó su fecha límite de SLA
export function isSlaBreached(dueDate: Date | null): boolean {
    if (!dueDate) return false;
    return new Date() > dueDate;
}