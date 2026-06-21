import { describe, it, expect } from 'vitest'


function validatePhone(phone) {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length !== 11) return false
  const validPrefixes = ['0412', '0414', '0416', '0424', '0426']
  const prefix = cleanPhone.slice(0, 4)
  return validPrefixes.includes(prefix)
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
}

describe('Phone Validation - Venezuelan Format', () => {
  describe('validatePhone', () => {
    it('should accept valid Venezuelan phone numbers (11 digits)', () => {
      expect(validatePhone('0412-123-4567')).toBe(true) // Digitel
      expect(validatePhone('0414-123-4567')).toBe(true) // Movistar
      expect(validatePhone('0424-123-4567')).toBe(true) // Movistar
      expect(validatePhone('0416-123-4567')).toBe(true) // Movilnet
      expect(validatePhone('0426-123-4567')).toBe(true) // Movilnet
    })

    it('should reject phone numbers with less than 11 digits', () => {
      expect(validatePhone('0412-123-456')).toBe(false) // 10 digits
      expect(validatePhone('0412-123-45')).toBe(false)   // 9 digits
      expect(validatePhone('0412')).toBe(false)          // 4 digits
    })

    it('should reject phone numbers with more than 11 digits', () => {
      expect(validatePhone('0412-123-45678')).toBe(false) // 12 digits
    })

    it('should reject invalid prefixes', () => {
      expect(validatePhone('0500-123-4567')).toBe(false) // invalid prefix
      expect(validatePhone('0400-123-4567')).toBe(false) // invalid prefix
    })

    it('should handle empty string', () => {
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('formatPhone', () => {
    it('should format complete phone numbers correctly', () => {
      expect(formatPhone('04121234567')).toBe('0412-123-4567')
      expect(formatPhone('04141234567')).toBe('0414-123-4567')
      expect(formatPhone('04241234567')).toBe('0424-123-4567')
    })

    it('should handle partial input correctly', () => {
      expect(formatPhone('0412')).toBe('0412')
      expect(formatPhone('0412123')).toBe('0412-123')
      expect(formatPhone('0412123456')).toBe('0412-123-456')
    })

    it('should limit to 11 digits', () => {
      expect(formatPhone('0412123456789')).toBe('0412-123-4567')
    })

    it('should strip non-digit characters', () => {
      expect(formatPhone('0412-123-4567')).toBe('0412-123-4567')
      expect(formatPhone('0412abc123def4567')).toBe('0412-123-4567')
    })
  })
})