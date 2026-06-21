import { useState, useEffect } from 'react'
import { usersApi } from '../../api/users'
import notifications from '../../components/ui/Notifications'
import { Search, Filter, X, ChevronLeft, ChevronRight, Shield } from 'lucide-react'
import { ROLE_LABELS, ROLE_COLORS, ROLE_OPTIONS } from '../../constants/roles'
import UserDetailModal from '../../components/dashboard/UserDetailModal'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', role: '', status: '' })
  const [openFilter, setOpenFilter] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 8 })
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetail, setShowUserDetail] = useState(false)

  // Cargar usuarios
  async function loadUsers() {
    try {
      const data = await usersApi.getAll()
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  // Efecto inicial
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [])

  // Activar/Desactivar usuario
  async function handleToggleActive(userId, isActive) {
    try {
      await usersApi.update(userId, { isActive: !isActive })
      notifications.success(
        isActive ? 'Usuario desactivado' : 'Usuario activado',
        'Operacion exitosa'
      )
      loadUsers()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  // Filtrar usuarios localmente
  const filteredUsers = users.filter(user => {
    const searchLower = filters.search.toLowerCase()
    const matchesSearch = !filters.search || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    const matchesRole = !filters.role || (user.role?.name || user.role) === filters.role
    const matchesStatus = !filters.status || 
      (filters.status === 'active' ? user.isActive : !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  // Calcular paginación
  const totalPages = Math.ceil(filteredUsers.length / pagination.limit)
  const paginatedUsers = filteredUsers.slice(
    (pagination.page - 1) * pagination.limit,
    pagination.page * pagination.limit
  )

  // Resetear filtros
  const resetFilters = () => {
    setFilters({ search: '', role: '', status: '' })
    setPagination(p => ({ ...p, page: 1 }))
  }

  // Handlers
  const handleSearchChange = (value) => {
    setFilters(f => ({ ...f, search: value }))
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleRoleFilter = (value) => {
    setFilters(f => ({ ...f, role: value }))
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleStatusFilter = (value) => {
    setFilters(f => ({ ...f, status: value }))
    setPagination(p => ({ ...p, page: 1 }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Gestión de Usuarios</h2>
        <p className="text-sm text-slate-500 mt-1">
          Administra los usuarios del centro comercial
        </p>
      </div>

      {/* Filtros - Estilo Locatario */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Buscador */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nombre o email..." 
              className="h-9 w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Filtro de Rol */}
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'role' ? null : 'role')}
                className='inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors'
              >
                <Shield className='mr-2 h-3.5 w-3.5 text-slate-500' />
                Rol
                {filters.role && (
                  <>
                    <div className='mx-2 h-4 w-px bg-slate-200' />
                    <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                      {ROLE_OPTIONS.find(o => o.value === filters.role)?.label || filters.role}
                    </span>
                  </>
                )}
              </button>
              {openFilter === 'role' && (
                <div className='absolute left-0 mt-2 z-50 w-48 p-2 border border-slate-200 rounded-md shadow-lg bg-white overflow-hidden'>
                  <div className='flex flex-col gap-1'>
                    {ROLE_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => { handleRoleFilter(opt.value); setOpenFilter(null) }}
                        className='flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-slate-50 cursor-pointer text-xs text-slate-700'
                      >
                        <div className={`mr-2 h-2 w-2 rounded-full ${filters.role === opt.value ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        <span>{opt.label}</span>
                      </div>
                    ))}
                    <div className='border-t border-slate-100 p-1'>
                      <button
                        onClick={() => { handleRoleFilter(''); setOpenFilter(null) }}
                        className='w-full py-1.5 text-xs text-center hover:bg-slate-50 rounded-sm text-slate-500'
                      >
                        Limpiar filtro
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filtro de Estado */}
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                className='inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              >
                <Filter className='mr-2 h-4 w-4' />
                Estado
                {filters.status && (
                  <>
                    <div className='mx-2 h-4 w-px bg-slate-200' />
                    <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                      {STATUS_OPTIONS.find(o => o.value === filters.status)?.label || filters.status}
                    </span>
                  </>
                )}
              </button>
              {openFilter === 'status' && (
                <div className='absolute left-0 mt-2 z-50 w-48 p-2 border border-slate-200 rounded-md shadow-lg bg-white overflow-hidden'>
                  <div className='flex flex-col gap-1'>
                    {STATUS_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => { handleStatusFilter(opt.value); setOpenFilter(null) }}
                        className='flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-slate-50 cursor-pointer text-xs text-slate-700'
                      >
                        <div className={`mr-2 h-2 w-2 rounded-full ${filters.status === opt.value ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        <span>{opt.label}</span>
                      </div>
                    ))}
                    <div className='border-t border-slate-100 p-1'>
                      <button
                        onClick={() => { handleStatusFilter(''); setOpenFilter(null) }}
                        className='w-full py-1.5 text-xs text-center hover:bg-slate-50 rounded-sm text-slate-500'
                      >
                        Limpiar filtro
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(filters.role || filters.status || filters.search) && (
              <button 
                onClick={resetFilters}
                className="h-9 px-3 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center transition-colors"
              >
                Resetear <X className="ml-1 h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Sin resultados</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              No se encontraron usuarios con los filtros aplicados.
            </p>
            {(filters.role || filters.status || filters.search) && (
              <button onClick={resetFilters} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Rol</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => {
                  const roleName = user.role?.name || user.role
                  const roleLabel = ROLE_LABELS[roleName] || roleName
                  const roleColor = ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={user.id} onClick={() => { setSelectedUser(user); setShowUserDetail(true) }} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 text-black flex items-center justify-center text-xs font-semibold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">{user.email}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{user.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                          {roleLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {user.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(user.id, user.isActive) }}
                          className={`h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                            user.isActive
                              ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Página {pagination.page} de {totalPages} ({filteredUsers.length} usuarios)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                    className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Anterior
                  </button>
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= totalPages}
                    className="h-9 px-4 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
                  >
                    Siguiente <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Detalle de Usuario */}
      <UserDetailModal
        show={showUserDetail}
        onClose={() => setShowUserDetail(false)}
        user={selectedUser}
      />
    </div>
  )
}
