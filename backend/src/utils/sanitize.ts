/**
 * Utilidad para sanitizar input de usuario y prevenir XSS.
 * Escapa caracteres HTML problemáticos.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

/**
 * Sanitiza un string para prevenir XSS.
 * Convierte caracteres problemáticos en sus entidades HTML equivalentes.
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/[&<>"'/]/g, (char) => ESCAPE_MAP[char] || char)
}

/**
 * Sanitiza los campos de texto de un ticket (title, description, location, resolutionNote).
 */
export function sanitizeTicketInput<T extends Record<string, any>>(input: T): T {
  const fields = ['title', 'description', 'location', 'resolutionNote'] as const
  const sanitized = { ...input } as any
  for (const field of fields) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field])
    }
  }
  return sanitized as T
}