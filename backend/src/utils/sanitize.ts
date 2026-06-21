/**
 * Utilidad para sanitizar input de usuario y prevenir XSS.
 * Escapa caracteres HTMLproblemáticos.
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
 * Sana un string para prevenir XSS.
 * Convierte caracteres problemáticos en sus entidades HTML equivalents.
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/[&<>"'/]/g, (char) => ESCAPE_MAP[char] || char)
}

/**
 * Sana un objeto recursivamente.
 * Útil para sanitizar todo el body de una request.
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj

  const result: any = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (typeof value === 'string') {
        result[key] = sanitizeString(value)
      } else if (Array.isArray(value)) {
        result[key] = value.map((item: any) =>
          typeof item === 'string' ? sanitizeString(item) : item
        )
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeObject(value)
      } else {
        result[key] = value
      }
    }
  }
  return result
}

/**
 * Campos que deben ser sanitizados en tickets.
 */
export const TICKET_SANITIZE_FIELDS = [
  'title',
  'description',
  'location',
  'resolutionNote',
] as const

/**
 * Sana los campos relevantes de un ticket.
 */
export function sanitizeTicketInput(input: {
  title?: string
  description?: string
  location?: string
  resolutionNote?: string
}) {
  const sanitized: any = { ...input }
  for (const field of TICKET_SANITIZE_FIELDS) {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field])
    }
  }
  return sanitized
}