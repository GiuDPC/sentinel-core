import { useState, useEffect, useCallback } from 'react'
import { auditApi } from '../../api/audit'
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import AuditDetailModal from '../../components/dashboard/AuditDetailModal'

const ACTION_LABELS = {
  TICKET_CREATED: { label: 'Ticket Creado', color: 'bg-blue-50 text-blue-700' },
  STATUS_CHANGE: { label: 'Cambio de Estado', color: 'bg-amber-50 text-amber-700' },
  ASSIGNMENT: { label: 'Asignación', color: 'bg-purple-50 text-purple-700' },
  REASSIGNMENT: { label: 'Reasignación', color: 'bg-purple-50 text-purple-700' },
  RESOLUTION_NOTE: { label: 'Nota de Resolución', color: 'bg-emerald-50 text-emerald-700' },
  TICKET_CONFIRMED: { label: 'Confirmado', color: 'bg-green-50 text-green-700' },
  TICKET_REOPENED: { label: 'Reabierto', color: 'bg-rose-50 text-rose-700' },
}

const ACTION_OPTIONS = [
  { value: 'TICKET_CREATED', label: 'Ticket Creado' },
  { value: 'STATUS_CHANGE', label: 'Cambio de Estado' },
  { value: 'ASSIGNMENT', label: 'Asignación' },
  { value: 'REASSIGNMENT', label: 'Reasignación' },
  { value: 'RESOLUTION_NOTE', label: 'Nota de Resolución' },
  { value: 'TICKET_CONFIRMED', label: 'Confirmado' },
  { value: 'TICKET_REOPENED', label: 'Reabierto' },
]

const formatValue = (value) => {
  if (!value || value === '-') return '-'
  
  // Format long UUIDs (only if it matches UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(value)) {
    return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
  }
  
  const labels = {
    OPEN: 'Abierto',
    ASSIGNED: 'Asignado',
    IN_PROGRESS: 'En Proceso',
    ON_HOLD: 'En Espera',
    AWAITING_CONFIRMATION: 'Por Confirmar',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
    LOW: 'Baja',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    CRITICAL: 'Crítica'
  }
  return labels[value] || value
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', action: '' })
  const [openFilter, setOpenFilter] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 8 })
  const [selectedLog, setSelectedLog] = useState(null)
  const [showLogDetail, setShowLogDetail] = useState(false)

  // DEFINIR loadLogs ANTES del useEffect
  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await auditApi.getAll({
        page: pagination.page,
        limit: 8,
        action: filters.action || undefined,
      })
      setLogs(data.data || [])
      if (data.pagination) setPagination(p => ({ ...p, totalPages: data.pagination.totalPages || 1 }))
    } catch (err) {
      console.error('Error cargando audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filters.action])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs()
  }, [loadLogs])

  // Resetear página cuando cambian los filtros
  const handleSearchChange = (value) => {
    setFilters(f => ({ ...f, search: value }))
    setPagination(p => ({ ...p, page: 1 }))
  }

  const handleActionFilter = (value) => {
    setFilters(f => ({ ...f, action: value }))
    setPagination(p => ({ ...p, page: 1 }))
  }

  const resetFilters = () => {
    setFilters({ search: '', action: '' })
    setPagination(p => ({ ...p, page: 1 }))
  }

  // Filtrar localmente por búsqueda
  const filteredLogs = logs.filter(log => {
    if (!filters.search) return true
    const searchLower = filters.search.toLowerCase()
    return (
      log.ticket?.ticketCode?.toLowerCase().includes(searchLower) ||
      log.ticket?.title?.toLowerCase().includes(searchLower) ||
      `${log.user?.firstName} ${log.user?.lastName}`.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Auditoría</h2>
        <p className="text-sm text-slate-500 mt-1">
          Registro detallado de todas las acciones del sistema
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
              placeholder="Buscar por ticket o usuario..." 
              className="h-9 w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          {/* Filtro de Acción */}
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setOpenFilter(openFilter === 'action' ? null : 'action')}
                className='inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              >
                <Filter className='mr-2 h-4 w-4' />
                Acción
                {filters.action && (
                  <>
                    <div className='mx-2 h-4 w-px bg-slate-200' />
                    <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                      {ACTION_OPTIONS.find(o => o.value === filters.action)?.label || filters.action}
                    </span>
                  </>
                )}
              </button>
              {openFilter === 'action' && (
                <div className='absolute left-0 mt-2 z-50 w-48 p-2 border border-slate-200 rounded-md shadow-lg bg-white overflow-hidden'>
                  <div className='flex flex-col gap-1'>
                    {ACTION_OPTIONS.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => { handleActionFilter(opt.value); setOpenFilter(null) }}
                        className='flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-slate-50 cursor-pointer text-xs text-slate-700'
                      >
                        <div className={`mr-2 h-2 w-2 rounded-full ${filters.action === opt.value ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        <span>{opt.label}</span>
                      </div>
                    ))}
                    <div className='border-t border-slate-100 p-1'>
                      <button
                        onClick={() => { handleActionFilter(''); setOpenFilter(null) }}
                        className='w-full py-1.5 text-xs text-center hover:bg-slate-50 rounded-sm text-slate-500'
                      >
                        Limpiar filtro
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {(filters.action || filters.search) && (
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

      {/* Tabla - Estilo Locatario */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Auditoría...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Sin resultados</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              No se encontraron registros de auditoría.
            </p>
            {(filters.action || filters.search) && (
              <button onClick={resetFilters} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ticket</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Usuario</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acción</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Anterior</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Nuevo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={log.id} onClick={() => { setSelectedLog(log); setShowLogDetail(true) }} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString('es-VE', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100">
                          {log.ticket?.ticketCode || '—'}
                        </span>
                        {log.ticket?.title && (
                          <p className="text-[10px] text-slate-500 truncate max-w-32 mt-1">{log.ticket.title}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {log.user?.firstName} {log.user?.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${actionConfig.color}`}>
                          {actionConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                        {formatValue(log.oldValue)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-700 font-semibold max-w-xs truncate">
                        {formatValue(log.newValue)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Página {pagination.page} de {pagination.totalPages}
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
                    disabled={pagination.page >= pagination.totalPages}
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

      {/* Modal de Detalle de Auditoría */}
      <AuditDetailModal
        show={showLogDetail}
        onClose={() => setShowLogDetail(false)}
        log={selectedLog}
      />
    </div>
  )
}