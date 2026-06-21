import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { authService } from '../../services/auth.service.js';
import jwt from 'jsonwebtoken';

vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    registerPublic: vi.fn(),
    logout: vi.fn(),
  }
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(() => ({ id: 1, email: 'test@test.com', role: 'REQUESTER' })),
    sign: vi.fn(() => 'fake-token')
  }
}));

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('debe loguear un usuario correctamente y devolver una cookie', async () => {
      const mockUser = { id: 1, email: 'test@test.com', firstName: 'Juan', lastName: 'Perez', role: 'REQUESTER' };
      authService.login.mockResolvedValue({ user: mockUser, token: 'fake-token' });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'password123' })
        .expect(200);

      expect(response.body.user).toEqual(mockUser);
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=fake-token/);
    });

    it('debe fallar la validación si el email no es válido (Zod)', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'no-es-correo', password: 'password123' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.details).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('debe limpiar la cookie de token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', ['token=fake-token'])
        .expect(200);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=;/);
    });
  });
});
