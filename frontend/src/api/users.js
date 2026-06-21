import { apiClient } from './client'

export const usersApi = {
  async getAll() {
    const data = await apiClient.get('/users')
    return data.users || data.data || data || []
  },

  getById(id) {
    return apiClient.get(`/users/${id}`)
  },

  update(id, data) {
    return apiClient.patch(`/users/${id}`, data)
  },

  deactivate(id) {
    return apiClient.delete(`/users/${id}`)
  },

  updateProfile(data) {
    return apiClient.patch('/users/profile', data)
  },
}
