const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const backupsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/backups`, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || 'Error al obtener backups')
    }
    return response.json()
  },

  async createBackup() {
    const response = await fetch(`${API_URL}/backups`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || 'Error al crear el backup')
    }
    return response.json()
  },

  async downloadBackup(filename) {
    const response = await fetch(`${API_URL}/backups/${filename}/download`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || errorData.error || 'Error al descargar el backup')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },

  async restoreBackup(filename) {
    const response = await fetch(`${API_URL}/backups/${filename}/restore`, {
      method: 'POST',
      credentials: 'include',
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Error al restaurar el backup')
    }
    return data
  },

  async deleteBackup(filename) {
    const response = await fetch(`${API_URL}/backups/${filename}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Error al eliminar el backup')
    }
    return data
  }
}
