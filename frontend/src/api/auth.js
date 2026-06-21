import { apiClient } from './client'

/**
 * API de autenticacion basada en cookies httpOnly.
 * El backend setea la cookie al hacer login — el frontend no maneja tokens.
 */
export const authApi = {
  async login({ email, password }) {
    const data = await apiClient.post('/auth/login', { email, password })
    return data
  },

  async register({ firstName, lastName, email, password, phone, storeNumber, storeName }) {
    const data = await apiClient.post('/auth/register-public', {
      firstName,
      lastName,
      email,
      password,
      confirmPassword: password,
      phone: phone || undefined,
      storeNumber: storeNumber || undefined,
      storeName: storeName || undefined,
    })
    return data
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
    }
  },

  async getCurrentUser() {
    const data = await apiClient.get('/auth/me')
    return data
  },

  async changePassword({ currentPassword, newPassword }) {
    const data = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    })
    return data
  },
}