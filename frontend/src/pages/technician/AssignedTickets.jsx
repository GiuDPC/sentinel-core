import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'
import PriorityBadge from '../../components/dashboard/PriorityBadge'
import notifications from '../../components/ui/Notifications'
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X, Ticket } from 'lucide-react'

const STATUS_OPTIONS = [
  { label: 'Asignados', value: 'ASSIGNED' },
  { label: 'En Proceso', value: 'IN_PROGRESS' },
  { label: 'En Espera', value: 'ON_HOLD' },
  { label: 'Resueltos', value: 'RESOLVED' },
]

const PRIORITY_LABELS = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export default function AssignedTickets() {
  const [searchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState(() => searchParams.get('search') || '')
  const [openFilter, setOpenFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.getAssigned({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
        page: pagination.page,
      })
      setTickets(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando tickets:', error)
      notifications.error('No se pudieron cargar los tickets')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, priorityFilter, searchFilter, pagination.page])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTickets()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadTickets])

  async function handleStatusChange(e, ticketId, newStatus) {
    e.stopPropagation()
    try {
      await ticketsApi.updateStatus(ticketId, newStatus)
      notifications.success(`Estado actualizado a ${newStatus}`)
      loadTickets()
    } catch (error) {
      notifications.error(error.message)
    }
  }

  const resetFilters = () => {
    setStatusFilter('')
    setPriorityFilter('')
    setSearchFilter('')
    setPagination(p => ({ ...p, page: 1 }))
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Mis Asignaciones</h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona tu cola de trabajo y actualiza el progreso de tus tickets.
            </p>
          </div>
        </div>

        {/* Toolbar Section */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-2">
            {/* Buscador */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                value={searchFilter}
                onChange={(e) => { setSearchFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                placeholder="Buscar por código o título..." 
                className="h-9 w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Filtros Dropdown Style */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                  className='inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                >
                  <Filter className='mr-2 h-4 w-4' />
                  Estado
                  {statusFilter && (
                    <>
                      <div className='mx-2 h-4 w-px bg-slate-200' />
                      <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                        {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || statusFilter}
                      </span>
                    </>
                  )}
                </button>
                {openFilter === 'status' && (
                  <div className='absolute left-0 mt-2 z-50 w-52 p-0 border border-slate-200 rounded-md shadow-lg bg-white overflow-hidden'>
                    <div className='flex flex-col'>
                      <div className='flex items-center border-b border-slate-100 px-3'>
                        <input
                          placeholder='Filtrar estado...'
                          className='h-9 w-full bg-transparent py-3 text-xs outline-none'
                          autoFocus
                        />
                      </div>
                      <div className='max-h-[300px] overflow-y-auto p-1'>
                        {STATUS_OPTIONS.map((opt) => (
                          <div
                            key={opt.value}
                            onClick={() => { setStatusFilter(opt.value); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
                            className='relative flex items-center rounded-sm px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-slate-700'
                          >
                            <div className={`mr-2 h-2 w-2 rounded-full ${statusFilter === opt.value ? 'bg-blue-600' : 'bg-slate-200'}`} />
                            <span>{opt.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className='border-t border-slate-100 p-1'>
                        <button
                          onClick={() => { setStatusFilter(''); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
                          className='w-full py-1.5 text-xs text-center hover:bg-slate-50 rounded-sm text-slate-500'
                        >
                          Limpiar filtro
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpenFilter(openFilter === 'priority' ? null : 'priority')}
                  className='inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                >
                  <SlidersHorizontal className='mr-2 h-4 w-4' />
                  Prioridad
                  {priorityFilter && (
                    <>
                      <div className='mx-2 h-4 w-px bg-slate-200' />
                      <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                        {PRIORITY_LABELS[priorityFilter] || priorityFilter}
                      </span>
                    </>
                  )}
                </button>
                {openFilter === 'priority' && (
                  <div className="absolute left-0 mt-2 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in duration-200">
                    {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => { setPriorityFilter(val); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
                        className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className={`mr-2 w-2 h-2 rounded-full ${priorityFilter === val ? 'bg-orange-500' : 'bg-slate-200'}`} />
                        {label}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 p-1">
                      <button onClick={() => { setPriorityFilter(''); setOpenFilter(null) }} className="w-full py-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600">Limpiar</button>
                    </div>
                  </div>
                )}
              </div>

              {(statusFilter || priorityFilter || searchFilter) && (
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
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Tareas...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ticket className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Sin tareas pendientes</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              No se encontraron tickets con los filtros aplicados o no tienes asignaciones actuales.
            </p>
            {(statusFilter || priorityFilter || searchFilter) && (
              <button onClick={resetFilters} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Incidencia</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Prioridad</th>
                  <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => navigate(`/technician/ticket/${ticket.id}`)}
                    className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-mono text-[11px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100 group-hover:bg-indigo-100 transition-colors shadow-sm">
                        {ticket.ticketCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{ticket.title}</p>
                      <p className="text-[10px] text-black mt-0.5 capitalize">
                        {(ticket.category?.name || 'General').toLowerCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[11px] font-medium text-slate-600">{ticket.location || 'Oficina Central'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {ticket.status === 'ASSIGNED' && (
                          <button
                            onClick={(e) => handleStatusChange(e, ticket.id, 'IN_PROGRESS')}
                            className="h-8 px-3 text-[10px] bg-blue-950 text-white rounded-lg font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                          >
                            Iniciar
                          </button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/technician/ticket/${ticket.id}?action=resolve`);
                            }}
                            className="h-8 px-3 text-[10px] bg-slate-900 text-white rounded-lg font-bold uppercase tracking-widest hover:bg-slate-700 transition-all shadow-sm active:scale-95"
                          >
                            Resolver
                          </button>
                        )}
                        <button className="h-8 w-8 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {!loading && tickets.length > 0 && (
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
      </div>
    </div>
  )
}
