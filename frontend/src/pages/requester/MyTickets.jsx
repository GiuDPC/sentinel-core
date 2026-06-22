import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import { STATUS_OPTIONS, PRIORITY_LABELS, PRIORITY_COLORS } from '../../constants/ticket'
import StatusBadge from '../../components/dashboard/StatusBadge'
import PriorityBadge from '../../components/dashboard/PriorityBadge'
import AnimatedModal from '../../components/ui/AnimatedModal'
import notifications from '../../components/ui/Notifications'
import CommentSection from '../../components/dashboard/CommentSection'
import { Filter, SlidersHorizontal } from 'lucide-react'

export default function MyTickets() {
  const [searchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState(() => searchParams.get('search') || '')
  const [openFilter, setOpenFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    title: true,
    category: true,
    status: true,
    priority: true,
    technician: true,
    date: true,
    actions: true
  })

  const [showConfirm, setShowConfirm] = useState(false)
  const [showReopen, setShowReopen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [confirmComment, setConfirmComment] = useState('')
  const [reopenComment, setReopenComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.getMyTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        search: searchFilter || undefined,
        page: pagination.page,
      })
      setTickets(data.data || [])
      if (data.pagination) setPagination(data.pagination)
    } catch (error) {
      console.error('Error cargando tickets:', error)
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

  useEffect(() => {
    const ticketId = searchParams.get('ticketId')
    if (ticketId) {
      const timer = setTimeout(() => {
        openDetailsModal(ticketId)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  async function openDetailsModal(ticketOrId) {
    const id = typeof ticketOrId === 'object' ? ticketOrId.id : ticketOrId
    
    if (typeof ticketOrId === 'object') {
      setSelectedTicket(ticketOrId)
    }
    
    setShowDetails(true)
    setLoadingDetail(true)
    
    try {
      const data = await ticketsApi.getById(id)
      setSelectedTicket(data.ticket || data)
    } catch (error) {
      console.error('Error cargando detalle:', error)
      notifications.error('No se pudo cargar el detalle completo', 'Error')
    } finally {
      setLoadingDetail(false)
    }
  }

  function openConfirmModal(e, ticket) {
    e.stopPropagation()
    setSelectedTicket(ticket)
    setConfirmComment('')
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await ticketsApi.confirmTicket(selectedTicket.id, {
        confirmed: true,
        comment: confirmComment || undefined,
      })
      notifications.success('Ticket cerrado exitosamente', 'Confirmación exitosa')
      setShowConfirm(false)
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  function openReopenModal(e, ticket) {
    e.stopPropagation()
    setSelectedTicket(ticket)
    setReopenComment('')
    setShowReopen(true)
  }

  async function handleReopenConfirm() {
    setSubmitting(true)
    try {
      await ticketsApi.confirmTicket(selectedTicket.id, {
        confirmed: false,
        comment: reopenComment || 'Reabierto por el solicitante',
      })
      notifications.success('Ticket reabierto para atención', 'Reabierto')
      setShowReopen(false)
      loadTickets()
    } catch (error) {
      notifications.error(error.message, 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">Mis Tickets</h2>
            <p className="text-sm text-slate-500 mt-1">
              Gestiona y monitorea el estado de tus reportes de incidencia.
            </p>
          </div>
        </div>

        <div className='flex items-center justify-between'>
          <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
            {/* Input de búsqueda */}
            <div className='relative h-8 w-37.5 lg:w-62.5'>
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                value={searchFilter}
                onChange={(e) => { setSearchFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
                placeholder='Buscar por código o título...' 
                className='h-8 w-full bg-white border border-slate-200 rounded-md pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm' 
              />
            </div>

            {/* Contenedor de botones de filtro */}
            <div className='flex gap-x-2'>
              {/* Filtro de Estado */}
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

              {/* Filtro de Prioridad */}
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
                    {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((prio) => (
                      <button
                        key={prio}
                        onClick={() => { setPriorityFilter(prio); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }}
                        className="w-full flex items-center px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className={`mr-2 w-2 h-2 rounded-full ${priorityFilter === prio ? 'bg-orange-500' : 'bg-slate-200'}`} />
                        {PRIORITY_LABELS[prio] || prio}
                      </button>
                    ))}
                    <div className="border-t border-slate-100 mt-1 p-1">
                      <button onClick={() => { setPriorityFilter(''); setOpenFilter(null); setPagination(p => ({ ...p, page: 1 })) }} className="w-full py-1.5 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600">Limpiar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botón de reset */}
            {(statusFilter || priorityFilter || searchFilter) && (
              <button 
                onClick={() => { setStatusFilter(''); setPriorityFilter(''); setSearchFilter(''); setPagination(p => ({ ...p, page: 1 })) }}
                className='h-8 px-2 lg:px-3 flex items-center text-xs font-medium hover:bg-slate-100 rounded-md text-slate-600'
              >
                Reset
                <svg className='ms-2 h-4 w-4' fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          {/* Opciones de vista */}
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
                <p className='px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1'>Columnas visibles</p>
                <div className='flex flex-col gap-1'>
                  {Object.entries({
                    code: 'Código',
                    title: 'Título',
                    category: 'Categoría',
                    status: 'Estado',
                    priority: 'Prioridad',
                    technician: 'Técnico',
                    date: 'Fecha',
                    actions: 'Acciones'
                  }).map(([key, label]) => (
                    <div 
                      key={key}
                      onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}
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

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">No se encontraron resultados</p>
            <p className="text-xs text-slate-500 mt-1">Prueba ajustando los filtros o creando un nuevo ticket.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  {visibleColumns.code && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Código</th>}
                  {visibleColumns.title && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Título</th>}
                  {visibleColumns.category && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>}
                  {visibleColumns.status && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>}
                  {visibleColumns.priority && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Prioridad</th>}
                  {visibleColumns.technician && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Técnico</th>}
                  {visibleColumns.date && <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha</th>}
                  {visibleColumns.actions && <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                <tr 
                  key={ticket.id} 
                  onClick={() => openDetailsModal(ticket)}
                  className="hover:bg-slate-50/80 transition-all group cursor-pointer border-b border-slate-100 last:border-0"
                >
                    {visibleColumns.code && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold text-indigo-950 bg-indigo-50/50 px-2 py-1 rounded-md border border-indigo-100 shadow-xs">
                          {ticket.ticketCode}
                        </span>
                      </td>
                    )}
                    {visibleColumns.title && (
                      <td className="px-4 py-3  text-xs font-bold text-slate-800 max-w-[200px] truncate" title={ticket.title}>
                        {ticket.title}
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="px-4 py-3">
                        <span className="text-slate-900 text-xs font-bold">
                          {ticket.category?.name || 'General'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>
                    )}
                    {visibleColumns.priority && (
                      <td className="px-4 py-3">
                        <PriorityBadge priority={ticket.priority} size="sm" />
                      </td>
                    )}
                    {visibleColumns.technician && (
                      <td className="px-4 py-3 text-slate-500 text-xs font-medium">
                        {ticket.assignments?.[0]?.technician
                          ? `${ticket.assignments[0].technician.firstName} ${ticket.assignments[0].technician.lastName}`
                          : <span className="text-slate-300 italic">No asignado</span>}
                      </td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-4 py-3 text-slate-400 text-[11px] font-medium">
                        {new Date(ticket.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-4 py-3 text-right">
                        {ticket.status === 'AWAITING_CONFIRMATION' && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={(e) => openConfirmModal(e, ticket)}
                              className="h-7 px-3 text-[10px] bg-slate-900 text-white rounded-md shadow-sm transition-all hover:bg-slate-600 font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={(e) => openReopenModal(e, ticket)}
                              className="h-7 px-3 text-[10px] border border-slate-200 text-slate-900 bg-white rounded-md shadow-xs hover:bg-slate-100 transition-all font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Reabrir
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación Estilo DataTable */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="h-8 px-3 text-xs font-bold border border-slate-200 rounded-md disabled:opacity-50 hover:bg-white hover:border-slate-300 transition-all text-slate-600 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Anterior
            </button>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="h-8 px-3 text-xs font-bold border border-slate-200 rounded-md disabled:opacity-50 hover:bg-white hover:border-slate-300 transition-all text-slate-600 flex items-center gap-1"
            >
              Siguiente
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalles del Ticket */}
      <AnimatedModal
        show={showDetails}
        onClose={() => setShowDetails(false)}
      >
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 w-[calc(100vw-2rem)] md:w-full max-w-2xl mx-auto flex flex-col" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest rounded">
                #{selectedTicket?.ticketCode}
              </span>
              <StatusBadge status={selectedTicket?.status} size="sm" />
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {selectedTicket?.title}
            </h3>
          </div>

          {/* Contenido */}
          <div className="max-h-[65vh] overflow-y-auto min-h-[300px] relative">
            {loadingDetail ? (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando detalles...</p>
              </div>
            ) : null}
            
            {/* Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-100">
              <div className="px-4 py-3 border-r border-b sm:border-b-0 border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Categoría</p>
                <p className="text-xs font-bold text-slate-900">{selectedTicket?.category?.name || 'General'}</p>
              </div>
              <div className="px-4 py-3 sm:border-r border-b sm:border-b-0 border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Prioridad</p>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  selectedTicket?.priority === 'LOW' ? 'bg-slate-100 text-slate-600' :
                  selectedTicket?.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                  selectedTicket?.priority === 'HIGH' ? 'bg-orange-50 text-orange-700' :
                  selectedTicket?.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {{ LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica' }[selectedTicket?.priority] || selectedTicket?.priority}
                </span>
              </div>
              <div className="px-4 py-3 border-r border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Creado</p>
                <p className="text-xs font-bold text-slate-900">
                  {selectedTicket && new Date(selectedTicket.createdAt).toLocaleDateString('es-VE')}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Técnico</p>
                <p className="text-xs font-bold text-slate-900">
                  {selectedTicket?.assignments?.[0]
                    ? `${selectedTicket.assignments[0].technician.firstName} ${selectedTicket.assignments[0].technician.lastName}`
                    : '—'}
                </p>
              </div>
            </div>

            {/* Descripción */}
            <div className="px-6 py-5 border-b border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Descripción del Incidente</h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedTicket?.description || 'No se proporcionó una descripción detallada para este ticket.'}
              </p>
            </div>

            {/* Reporte de Resolución */}
            {(selectedTicket?.status === 'RESOLVED' || selectedTicket?.status === 'CLOSED' || selectedTicket?.status === 'AWAITING_CONFIRMATION') ? (
              <div className="px-6 py-5 border-b border-slate-100 bg-emerald-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Reporte de Resolución Técnica
                  </h4>
                  {selectedTicket.resolvedAt && (
                    <span className="text-[10px] font-medium text-emerald-600">
                      {new Date(selectedTicket.resolvedAt).toLocaleDateString('es-VE')}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed border-l-2 border-emerald-300 pl-4 mb-4">
                  {selectedTicket?.resolutionNote || selectedTicket?.resolutionComment || 'El personal técnico ha verificado y corregido la incidencia reportada.'}
                </p>

                {/* Resource consumption info */}
                {(selectedTicket?.timeSpentMinutes || selectedTicket?.materialsUsed) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {selectedTicket.timeSpentMinutes && (
                      <div className="bg-white/60 rounded-lg px-3 py-2 border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Tiempo invertido</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">
                          {Math.floor(selectedTicket.timeSpentMinutes / 60)}h {selectedTicket.timeSpentMinutes % 60}min
                        </p>
                      </div>
                    )}
                    {selectedTicket.materialsUsed && (
                      <div className="bg-white/60 rounded-lg px-3 py-2 border border-emerald-100">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Materiales</p>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedTicket.materialsUsed}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Download closure report */}
                <button
                  onClick={async () => {
                    try {
                      const blob = await ticketsApi.getClosureReport(selectedTicket.id)
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `acta-resolucion-${selectedTicket.ticketCode}.pdf`
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                      URL.revokeObjectURL(url)
                      notifications.success('Acta descargada', 'Descarga')
                    } catch (err) {
                      notifications.error(err.message || 'Error al descargar', 'Error')
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-800 transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Descargar Acta de Resolución (PDF)
                </button>
              </div>
            ) : (
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  El reporte de resolución se generará cuando el técnico solucione el ticket.
                </p>
              </div>
            )}

            {/* Comentarios */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/20">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                Conversación con el equipo técnico
              </h4>
              <CommentSection 
                key={`req-comments-${selectedTicket?.id}`}
                ticketId={selectedTicket?.id} 
                userRole="REQUESTER" 
                initialComments={selectedTicket?.comments || []} 
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex justify-end">
            <button
              onClick={() => setShowDetails(false)}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal show={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] md:w-full max-w-xl mx-auto overflow-hidden border border-slate-200 flex flex-col" style={{ maxHeight: '90vh' }}>
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest rounded">
                #{selectedTicket?.ticketCode}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">Confirmar Resolución</h3>
            <p className="text-xs text-slate-400 mt-2">
              Confirma que el problema ha sido solucionado satisfactoriamente.
            </p>
          </div>

          {selectedTicket?.resolutionNote && (
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-900 mb-1">Nota del técnico:</p>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedTicket.resolutionNote}</p>
            </div>
          )}

          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Comentario (opcional)</label>
              <textarea
                value={confirmComment}
                onChange={(e) => setConfirmComment(e.target.value)}
                placeholder="¿Algún comentario adicional sobre la atención recibida?"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Procesando...' : 'Confirmar y Cerrar'}
            </button>
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal show={showReopen} onClose={() => setShowReopen(false)}>
        <div className="bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] md:w-full max-w-xl mx-auto overflow-hidden border border-slate-200 flex flex-col" style={{ maxHeight: '90vh' }}>
          <div className="bg-slate-900 px-6 py-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest rounded">
                #{selectedTicket?.ticketCode}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white leading-tight">Reabrir Ticket</h3>
            <p className="text-xs text-slate-400 mt-2">
              El comentario se enviará al equipo técnico y quedará registrado en el historial del ticket.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-900 mb-2">Escribe tu motivo</label>
              <textarea
                value={reopenComment}
                onChange={(e) => setReopenComment(e.target.value)}
                placeholder="Describe qué no quedó bien resuelto..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </div>

            <div className="rounded-2xl bg-slate-900/5 p-4 text-sm leading-relaxed text-slate-600">
              <p className="font-semibold text-slate-900 mb-1">Consejo</p>
              <p className="text-xs">Explica brevemente qué parte de la solución no resolvió tu problema para acelerar la atención.</p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={() => setShowReopen(false)}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
            >
              Volver
            </button>
            <button
              onClick={handleReopenConfirm}
              disabled={submitting || reopenComment.trim().length < 10}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Procesando...' : 'Enviar Reapertura'}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </div>
  )
}
