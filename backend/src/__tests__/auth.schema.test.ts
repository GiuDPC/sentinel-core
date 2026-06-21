import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, registerPublicSchema } from '../schemas/auth.schema.js'

describe('Auth Schema Validation', () => {
  describe('registerSchema (Admin)', () => {
    it('should accept valid Venezuelan phone numbers', () => {
      const validPhones = [
        '0412-123-4567', // Digitel
        '0414-123-4567', // Movistar
        '0424-123-4567', // Movistar
        '0416-123-4567', // Movilnet
        '0426-123-4567', // Movilnet
      ]

      validPhones.forEach(phone => {
        const result = registerSchema.safeParse({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@test.com',
          password: 'password123',
          confirmPassword: 'password123',
          phone,
        })
        expect(result.success, `Phone ${phone} should be valid`).toBe(true)
      })
    })

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '0412-123-456',    // incompleto
        '0412-12345678',   // sin guiones
        '0412-123-45678',  // 12 dígitos
        '0500-123-4567',   // prefijo inválido
        '0412-abc-defg',   // letras
        '',                // vacío
      ]

      invalidPhones.forEach(phone => {
        const result = registerSchema.safeParse({
          firstName: 'Juan',
          lastName: 'Pérez',
          email: 'juan@test.com',
          password: 'password123',
          confirmPassword: 'password123',
          phone,
        })
        expect(result.success, `Phone "${phone}" should be invalid`).toBe(false)
      })
    })

    it('should require all fields', () => {
      const result = registerSchema.safeParse({})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })

    it('should validate password match', () => {
      const result = registerSchema.safeParse({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@test.com',
        password: 'password123',
        confirmPassword: 'different123',
        phone: '0412-123-4567',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('registerPublicSchema (Locatario)', () => {
    it('should accept registration without phone (optional)', () => {
      const result = registerPublicSchema.safeParse({
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@test.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should accept registration with empty phone string', () => {
      const result = registerPublicSchema.safeParse({
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept registration with valid phone', () => {
      const result = registerPublicSchema.safeParse({
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '0412-123-4567',
      })
      expect(result.success).toBe(true)
    })

    it('should reject registration with invalid phone format', () => {
      const result = registerPublicSchema.safeParse({
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        phone: '1234567890',
      })
      expect(result.success).toBe(false)
    })

    it('should not accept roleId (public registration = REQUESTER only)', () => {
      const result = registerPublicSchema.safeParse({
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        roleId: 1,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('roleId')
      }
    })
  })

  describe('loginSchema', () => {
    it('should validate correct credentials', () => {
      const result = loginSchema.safeParse({
        email: 'juan@test.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = loginSchema.safeParse({
        email: 'juan@test.com',
        password: '123',
      })
      expect(result.success).toBe(false)
    })
  })
})