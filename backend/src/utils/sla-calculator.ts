export function calculateDueDate(createdAt: Date, slaHours: number): Date {
    const dueDate = new Date(createdAt.getTime());
    dueDate.setHours(dueDate.getHours() + slaHours);
    return dueDate;
}

export function isSlaBreached(dueDate: Date | null): boolean {
    if (!dueDate) return false;
    return new Date() > dueDate;
}