import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { PRIORITY_LABELS, PRIORITY_COLORS, AUDIT_ACTION_LABELS } from '../../constants/ticket'
import StatusBadge from '../../components/dashboard/StatusBadge'
import PriorityBadge from '../../components/dashboard/PriorityBadge'
import AnimatedModal from '../../components/ui/AnimatedModal'
import notifications from '../../components/ui/Notifications'
import CommentSection from '../../components/dashboard/CommentSection'
import TicketTimeline from '../../components/dashboard/TicketTimeline'
import { Search, Filter, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function TicketList() {
  const [tickets, setTickets] = useState([])
  const [searchParams] = useSearchParams()
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [filters, setFilters] = useState(() => ({ 
    status: '', 
    priority: '', 
    search: searchParams.get('search') || '' 
  }))
  const [openFilter, setOpenFilter] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    title: true,
    status: true,
    priority: true,
    requester: true,
    technician: true,
    location: true,
    sla: true,
    actions: true
  })
  const [loading, setLoading] = useState(true)

  // Modal de asignacion/reasignacion inteligente
  const [assignModal, setAssignModal] = useState(false)
  const [assignTicketId, setAssignTicketId] = useState(null)
  const [isReassign, setIsReassign] = useState(false)
  const [technicians, setTechnicians] = useState([])
  const [suggested, setSuggested] = useState(null)
  const [loadingTechs, setLoadingTechs] = useState(false)

  // Panel detalle de ticket
  const [detailModal, setDetailModal] = useState(false)
  const [detailTicket, setDetailTicket] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Debounced search — single ref to avoid double fetch
  const searchTimerRef = useRef(null)
  const isInitialMount = useRef(true)
  const loadTicketsRef = useRef(null)

  // DEFINIR loadTickets ANTES de los useEffects
  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.getAll({
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
        page: pagination.page,
        limit: 8,
      })
      setTickets(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.priority, filters.search, pagination.page])

  // Leer search de URL al cambiar
  useEffect(() => {
    const urlSearch = searchParams.get('search')
    if (urlSearch !== null && urlSearch !== filters.search) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFilters(f => ({ ...f, search: urlSearch }))
      setPagination(p => ({ ...p, page: 1 }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Carga inicial explícita al montar
  useEffect(() => {
    loadTicketsRef.current = loadTickets
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTickets()
    isInitialMount.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Solo se dispara por cambios en filtros de select (no search, no mount)
  useEffect(() => {
    if (isInitialMount.current) return
    loadTickets()
  }, [filters.status, filters.priority, pagination.page, loadTickets])

  // Debounce search 400ms — separado de los otros filtros
  useEffect(() => {
    if (isInitialMount.current) return
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      loadTickets()
    }, 400)
    return () => clearTimeout(searchTimerRef.current)
  }, [filters.search, loadTickets])

  // Abrir modal automáticamente si viene ticketId en la URL
  useEffect(() => {
    const ticketId = searchParams.get('ticketId')
    if (ticketId) {
      // Usamos el ticketId directamente para abrir el modal, 
      // la función openDetailModal ya se encarga de buscar el detalle por ID
      openDetailModal(ticketId)
    }
  }, [searchParams])

  async function openAssignModal(ticketId, reassign = false) {
    setAssignTicketId(ticketId)
    setIsReassign(reassign)
    setAssignModal(true)
    setLoadingTechs(true)
    try {
      const data = await ticketsApi.getTechniciansWorkload()
      setTechnicians(data.technicians || [])
      setSuggested(data.suggested)
    } catch {
      notifications.error('Error cargando tecnicos', 'Error')
    } finally {
      setLoadingTechs(false)
    }
  }

  async function handleAssign(techId) {
    try {
      if (isReassign) {
        await ticketsApi.reassignTechnician(assignTicketId, techId)
        notifications.success('Tecnico reasignado correctamente', 'Reasignacion exitosa')
      } else {
        await ticketsApi.assignTechnician(assignTicketId, techId)
        notifications.success('Tecnico asignado correctamente', 'Asignacion exitosa')
      }
      setAssignModal(false)
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  async function openDetailModal(ticketId) {
    setDetailModal(true)
    setLoadingDetail(true)
    try {
      const data = await ticketsApi.getById(ticketId)
      setDetailTicket(data.ticket || data)
    } catch {
      notifications.error('Error cargando detalle', 'Error')
      setDetailModal(false)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSearchChange = useCallback((e) => {
    setFilters(f => ({ ...f, search: e.target.value }))
    setPagination(p => ({ ...p, page: 1 }))
  }, [])

  // Determina si un ticket puede ser reasignado (tiene asignación y no está cerrado)
  function canReassign(ticket) {
    return ticket.assignments?.length > 0 && ticket.status !== 'CLOSED'
  }

return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Todos los Tickets</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión completa de incidencias del centro comercial
          </p>
        </div>
      </div>

      {/* Filtros - Estilo Locatario/Técnico */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          {/* Buscador */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              value={filters.search}
              onChange={handleSearchChange}
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
                {filters.status && (
                  <>
                    <div className='mx-2 h-4 w-px bg-slate-200' />
                    <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                      {filters.status}
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
                      {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'AWAITING_CONFIRMATION', 'RESOLVED', 'CLOSED'].map((val) => {
                        const labels = {
                          OPEN: 'Abierto',
                          ASSIGNED: 'Asignado',
                          IN_PROGRESS: 'En Proceso',
                          ON_HOLD: 'En Espera',
                          AWAITING_CONFIRMATION: 'Por Confirmar',
                          RESOLVED: 'Resuelto',
                          CLOSED: 'Cerrado'
                        };
                        return (
                          <div
                            key={val}
                            onClick={() => { setFilters(f => ({ ...f, status: val })); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
                            className='relative flex items-center rounded-sm px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-slate-700'
                          >
                            <div className={`mr-2 h-2 w-2 rounded-full ${filters.status === val ? 'bg-blue-600' : 'bg-slate-200'}`} />
                            <span>{labels[val] || val}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className='border-t border-slate-100 p-1'>
                      <button
                        onClick={() => { setFilters(f => ({ ...f, status: '' })); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
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
                {filters.priority && (
                  <>
                    <div className='mx-2 h-4 w-px bg-slate-200' />
                    <span className='rounded-sm bg-slate-100 px-1 text-[10px] font-normal text-blue-950 uppercase'>
                      {filters.priority}
                    </span>
                  </>
                )}
              </button>
              {openFilter === 'priority' && (
                <div className="absolute left-0 mt-2 z-50 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in duration-200">
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setFilters(f => ({ ...f, priority: val })); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
                      className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className={`mr-2 w-2 h-2 rounded-full ${filters.priority === val ? 'bg-orange-500' : 'bg-slate-200'}`} />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-slate-100 mt-1 p-1">
                    <button onClick={() => { setFilters(f => ({ ...f, priority: '' })); setOpenFilter(null) }} className="w-full py-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600">Limpiar</button>
                  </div>
                </div>
              )}
            </div>

            {(filters.status || filters.priority || filters.search) && (
              <button 
                onClick={() => { setFilters({ status: '', priority: '', search: '' }); setPagination(p => ({ ...p, page: 1 })) }}
                className="h-9 px-3 text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center transition-colors"
              >
                Resetear <X className="ml-1 h-3.5 w-3.5" />
              </button>
            )}

          </div>

          {/* Opciones de vista - Alineado a la derecha */}
          <div className='ml-auto relative'>
            <button 
              onClick={() => setOpenFilter(openFilter === 'view' ? null : 'view')}
              className='h-8 px-3 border border-slate-200 rounded-md flex items-center gap-2 text-xs font-medium hover:bg-slate-50 text-slate-600 transition-all shadow-sm'
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>
              Ver
            </button>

            {openFilter === 'view' && (
              <div className='absolute right-0 mt-2 z-50 w-48 p-2 border border-slate-200 rounded-md shadow-lg bg-white overflow-hidden'>
                <p className='px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 mb-1'>Columnas visibles</p>
                <div className='flex flex-col gap-1'>
                  {Object.entries({
                    code: 'Código',
                    title: 'Título',
                    status: 'Estado',
                    priority: 'Prioridad',
                    requester: 'Solicitante',
                    technician: 'Técnico',
                    location: 'Ubicación',
                    sla: 'SLA',
                    actions: 'Acciones'
                  }).map(([key, label]) => (
                    <div 
                      key={key}
                      onClick={() => setVisibleColumns(prev => Object.assign({}, prev, { [key]: !prev[key] }))}
                      className='flex items-center rounded-sm px-2 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-slate-700'
                    >
                      <div className={`mr-2 h-2 w-2 rounded-full ${visibleColumns[key] ? 'bg-blue-600' : 'bg-slate-200'}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla - Estilo Técnico */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Sin resultados</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              No se encontraron tickets con los filtros aplicados.
            </p>
            {(filters.status || filters.priority || filters.search) && (
              <button onClick={() => { setFilters({ status: '', priority: '', search: '' }); setPagination(p => ({ ...p, page: 1 })) }} className="mt-6 text-sm font-bold text-blue-600 hover:text-blue-700">Limpiar filtros</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {visibleColumns.code && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Código</th>}
                  {visibleColumns.title && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Título</th>}
                  {visibleColumns.status && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>}
                  {visibleColumns.priority && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Prioridad</th>}
                  {visibleColumns.requester && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Solicitante</th>}
                  {visibleColumns.technician && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Técnico</th>}
                  {visibleColumns.location && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</th>}
                  {visibleColumns.sla && <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">SLA</th>}
                  {visibleColumns.actions && <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => {
                  const isSlaBreached = ticket.dueDate && new Date(ticket.dueDate) < new Date() && !['RESOLVED', 'CLOSED'].includes(ticket.status);
                  const isSlaAtRisk = ticket.dueDate && !isSlaBreached && new Date(ticket.dueDate) < new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
                  return (
                  <tr 
                    key={ticket.id} 
                    onClick={() => openDetailModal(ticket.id)}
                    className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                  >
                    {visibleColumns.code && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-[11px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100 group-hover:bg-indigo-100 transition-colors shadow-sm">
                          {ticket.ticketCode}
                        </span>
                      </td>
                    )}
                    {visibleColumns.title && (
                      <td className="px-6 py-4">
                        <span
                          className="text-xs font-bold text-slate-800 line-clamp-1 text-left"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4"><StatusBadge status={ticket.status} size="sm" /></td>
                    )}
                    {visibleColumns.priority && (
                      <td className="px-6 py-4">
                        <PriorityBadge priority={ticket.priority} size="sm" />
                      </td>
                    )}
                    {visibleColumns.requester && (
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {ticket.creator?.firstName} {ticket.creator?.lastName}
                      </td>
                    )}
                    {visibleColumns.technician && (
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {ticket.assignments?.[0]?.technician
                          ? `${ticket.assignments[0].technician.firstName} ${ticket.assignments[0].technician.lastName}`
                          : '—'}
                      </td>
                    )}
                    {visibleColumns.location && (
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-32 truncate" title={ticket.location}>
                        {ticket.location || '—'}
                      </td>
                    )}
                    {visibleColumns.sla && (
                      <td className="px-6 py-4">
                        {ticket.dueDate && !['RESOLVED', 'CLOSED'].includes(ticket.status) ? (
                          <span className={`flex items-center gap-1 text-xs ${isSlaBreached ? 'text-rose-600 font-semibold' : isSlaAtRisk ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                            {isSlaBreached && (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                              </svg>
                            )}
                            {new Date(ticket.dueDate).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : '—'}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {ticket.status === 'OPEN' && (
                            <button
                              onClick={() => openAssignModal(ticket.id, false)}
                              className="h-8 px-4 text-[10px] font-bold bg-blue-950 text-white rounded-lg hover:bg-slate-800 transition-all shadow-sm min-w-[80px]"
                            >
                              Asignar
                            </button>
                          )}
                          {canReassign(ticket) && (
                            <button
                              onClick={() => openAssignModal(ticket.id, true)}
                              className="h-8 px-4 text-[10px] font-bold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all cursor-pointer min-w-[80px]"
                            >
                              Reasignar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Estilo Técnico */}
        {!loading && tickets.length > 0 && pagination.totalPages > 1 && (
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

      {/* Modal Asignacion/Reasignacion Inteligente */}
      <AnimatedModal show={assignModal} onClose={() => setAssignModal(false)}>
        <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(15,23,42,0.15)] w-full max-w-xl mx-4 overflow-hidden border border-slate-200">
          <div className="px-7 py-5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{isReassign ? 'Cambiar' : 'Asignar'}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{isReassign ? 'Reasignar Técnico' : 'Asignar Técnico'}</h3>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase text-white tracking-[0.25em]">
                INTELIGENTE
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">
              Selecciona el técnico recomendado con menor carga de trabajo para este ticket.
            </p>
          </div>

          <div className="p-7 max-h-[400px] overflow-y-auto bg-white">
            {loadingTechs ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Analizando cargas de trabajo...</p>
              </div>
            ) : technicians.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8 font-medium">No hay técnicos disponibles en este momento.</p>
            ) : (
              <div className="space-y-3">
                {technicians.map((tech) => (
                  <button
                    key={tech.id}
                    onClick={() => handleAssign(tech.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${
                      tech.id === suggested
                        ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${tech.id === suggested ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {tech.firstName?.[0]}{tech.lastName?.[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {tech.firstName} {tech.lastName}
                          {tech.id === suggested && (
                            <span className="px-2 py-0.5 text-[9px] bg-blue-100 text-blue-700 rounded-full font-bold uppercase tracking-widest">
                              Recomendado
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{tech.department || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          {tech.activeTickets} tickets activos
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              tech.activeTickets > 5 ? 'bg-rose-500' : tech.activeTickets > 3 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min((tech.activeTickets / 8) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-7 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
            <button
              onClick={() => setAssignModal(false)}
              className="px-6 py-2.5 text-sm font-bold uppercase tracking-[0.18em] text-slate-700 bg-white border border-slate-200 rounded-3xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </AnimatedModal>

      {/* Modal Detalle de Ticket (Admin) */}
      <AnimatedModal show={detailModal} onClose={() => setDetailModal(false)}>
        <div className="bg-white rounded-[32px] shadow-[0_25px_60px_rgba(15,23,42,0.15)] w-[600px] mx-4 overflow-hidden border border-slate-200" style={{ maxHeight: '600px' }}>
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando detalles...</p>
            </div>
          ) : detailTicket ? (
            <>
              <div className="bg-slate-900 px-6 py-5 sticky top-0 z-10 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest rounded">
                      #{detailTicket.ticketCode}
                    </span>
                    <StatusBadge status={detailTicket.status} size="sm" />
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {detailTicket.title}
                  </h3>
                </div>
                <button
                  onClick={() => setDetailModal(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 bg-white/5 rounded-full hover:bg-white/10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto w-full" style={{ maxHeight: '480px' }}>
                {/* Metadata Grid */}
                <div className="grid grid-cols-4 border-b border-slate-100 bg-white">
                  <div className="px-4 py-3 border-r border-b border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Solicitante</p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {detailTicket.creator?.firstName} {detailTicket.creator?.lastName}
                    </p>
                  </div>
                  <div className="px-4 py-3 border-r border-b border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Categoría</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{detailTicket.category?.name || 'General'}</p>
                  </div>
                  <div className="px-4 py-3 border-r border-b border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ubicación</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{detailTicket.location}</p>
                  </div>
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Prioridad</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      detailTicket.priority === 'LOW' ? 'bg-slate-100 text-slate-600' :
                      detailTicket.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                      detailTicket.priority === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                      detailTicket.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {PRIORITY_LABELS[detailTicket.priority] || detailTicket.priority}
                    </span>
                  </div>
                  <div className="px-4 py-3 border-r border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Técnico</p>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {detailTicket.assignments?.[0]?.technician
                        ? `${detailTicket.assignments[0].technician.firstName} ${detailTicket.assignments[0].technician.lastName}`
                        : '—'}
                    </p>
                  </div>
                  <div className="px-4 py-3 border-r border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Creado</p>
                    <p className="text-xs font-bold text-slate-900">
                      {new Date(detailTicket.createdAt).toLocaleDateString('es-VE')}
                    </p>
                  </div>
                  {detailTicket.dueDate ? (
                    <div className="px-4 py-3 border-r border-slate-100 col-span-2 bg-slate-50/50">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">SLA Vencimiento</p>
                      <p className={`text-xs font-bold ${new Date(detailTicket.dueDate) < new Date() ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {new Date(detailTicket.dueDate).toLocaleString('es-VE')}
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 py-3 col-span-2 border-slate-100 bg-slate-50/30" />
                  )}
                </div>

                {/* Descripcion */}
                <div className="px-6 py-5 border-b border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción del Incidente</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {detailTicket.description || 'No se proporcionó una descripción detallada.'}
                  </p>
                </div>

                {/* Nota de resolucion */}
                {detailTicket.resolutionNote && (
                  <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50/30">
                    <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Reporte de Resolución Técnica
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed border-l-2 border-emerald-300 pl-4">
                      {detailTicket.resolutionNote}
                    </p>
                  </div>
                )}

                {/* Historial — Timeline Visual */}
                {detailTicket.auditLogs?.length > 0 && (
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/20">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Historial de Actividad
                    </h4>
                    <TicketTimeline auditLogs={detailTicket.auditLogs} />
                  </div>
                )}

                {/* Comentarios */}
                <div className="px-6 py-5 bg-white">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Conversación y Seguimiento
                  </h4>
                  <CommentSection 
                    key={`admin-comments-${detailTicket.id}`}
                    ticketId={detailTicket.id} 
                    userRole="ADMIN" 
                    initialComments={detailTicket?.comments || []} 
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </AnimatedModal>
    </div>
  );
}