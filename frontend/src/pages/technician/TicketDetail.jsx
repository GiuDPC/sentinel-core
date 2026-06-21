import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../../api/tickets'
import StatusBadge from '../../components/dashboard/StatusBadge'
import LiveTracker from '../../components/dashboard/LiveTracker'
import notifications from '../../components/ui/Notifications'
import CommentSection from '../../components/dashboard/CommentSection'
import TicketTimeline from '../../components/dashboard/TicketTimeline'
import { PRIORITY_LABELS } from '../../constants/ticket'
import { 
  Clock, 
  MapPin, 
  Tag, 
  User, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  ClipboardList, 
  MessageSquare,
  History,
  ArrowLeft,
  FileDown
} from 'lucide-react'

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showResolveForm, setShowResolveForm] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [timeHours, setTimeHours] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')
  const [materialsUsed, setMaterialsUsed] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadTicket = useCallback(async () => {
    setLoading(true)
    try {
      const data = await ticketsApi.getById(id)
      setTicket(data.ticket || data)
    } catch (error) {
      console.error('Error cargando ticket:', error)
      notifications.error('No se pudo cargar el ticket', 'Error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTicket()
    const params = new URLSearchParams(window.location.search)
    if (params.get('action') === 'resolve') {
      setShowResolveForm(true)
    }
  }, [loadTicket])

  async function handleStatusChange(newStatus) {
    try {
      await ticketsApi.updateStatus(id, newStatus)
      notifications.success('Estado actualizado', 'Operación exitosa')
      loadTicket()
    } catch (error) {
      notifications.error(error.message || 'Error al cambiar estado', 'Error')
    }
  }

  async function handleResolve() {
    if (resolutionNote.trim().length < 10) {
      notifications.error('La nota debe tener al menos 10 caracteres', 'Formulario incompleto')
      return
    }
    setSubmitting(true)
    const totalMinutes = (parseInt(timeHours || '0') * 60) + parseInt(timeMinutes || '0')
    try {
      await ticketsApi.resolveWithNote(id, {
        resolutionNote,
        timeSpentMinutes: totalMinutes > 0 ? totalMinutes : undefined,
        materialsUsed: materialsUsed.trim() || undefined,
      })
      notifications.success('Ticket enviado para confirmación del solicitante', 'Resuelto')
      setShowResolveForm(false)
      setResolutionNote('')
      setTimeHours('')
      setTimeMinutes('')
      setMaterialsUsed('')
      loadTicket()
    } catch (error) {
      notifications.error(error.message || 'Error al resolver', 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDownloadReport() {
    setDownloading(true)
    try {
      const blob = await ticketsApi.getClosureReport(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `acta-resolucion-${ticket?.ticketCode || id.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      notifications.success('Acta descargada correctamente', 'Descarga')
    } catch (error) {
      notifications.error(error.message || 'Error al descargar', 'Error')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 font-medium">Ticket no encontrado</p>
        <button
          onClick={() => navigate('/technician/assigned')}
          className="mt-4 text-blue-600 font-bold hover:underline cursor-pointer"
        >
          Volver a tickets asignados
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-slate-900 p-8 rounded-2xl shadow-[0_25px_60px_rgba(15,23,42,0.15)] border border-slate-800">
        <div className="space-y-6 flex-1">
          <button
            onClick={() => navigate('/technician/assigned')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Volver a tickets
          </button>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-widest rounded shadow-sm">
                #{ticket.ticketCode}
              </span>
              <StatusBadge status={ticket.status} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white font-display leading-tight">
              {ticket.title}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {ticket.status === 'ASSIGNED' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="px-6 py-3 bg-white text-slate-900 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Iniciar Trabajo
            </button>
          )}
          {ticket.status === 'IN_PROGRESS' && !showResolveForm && (
            <>
              <button
                onClick={() => setShowResolveForm(true)}
                className="px-6 py-3 bg-blue-600 text-white border border-blue-500 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 active:scale-95 cursor-pointer"
              >
                Resolver Ticket
              </button>
              <button
                onClick={() => handleStatusChange('ON_HOLD')}
                className="px-6 py-3 bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
              >
                Pausar
              </button>
            </>
          )}
          {ticket.status === 'ON_HOLD' && (
            <button
              onClick={() => handleStatusChange('IN_PROGRESS')}
              className="px-6 py-3 bg-white text-slate-900 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Reanudar
            </button>
          )}
        </div>
      </div>      {/* Formulario de Cierre Tecnico (Suavizado) */}
      {showResolveForm && (
        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 animate-in slide-in-from-top-4 duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900">
            <CheckCircle2 size={120} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-slate-900 font-display mb-2 flex items-center gap-2">
              Reporte de Resolución Técnica
            </h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xl">
              Describe detalladamente el diagnóstico realizado y la solución aplicada. El solicitante recibirá esta nota para confirmar el cierre.
            </p>
            
            <textarea
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="Ej: Se detectó falla en el módulo de alimentación por sobrecalentamiento. Se procedió al reemplazo del componente y se verificaron los niveles de tensión..."
              rows={5}
              className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none mb-4 shadow-sm"
            />

            {/* Time tracking & materials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Tiempo Invertido (opcional)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="999"
                      value={timeHours}
                      onChange={(e) => setTimeHours(e.target.value)}
                      placeholder="0"
                      className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-xs text-slate-400 font-bold">hrs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      placeholder="0"
                      className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-xs text-slate-400 font-bold">min</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                  Materiales Utilizados (opcional)
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  maxLength={500}
                  placeholder="Ej: 2 bombillos LED, 3m cable UTP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${resolutionNote.trim().length < 10 ? 'text-rose-500' : 'text-slate-400'}`}>
                Caracteres: {resolutionNote.length}/10 mínimo
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => { setShowResolveForm(false); setResolutionNote(''); setTimeHours(''); setTimeMinutes(''); setMaterialsUsed('') }}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-slate-600 sm:text-slate-400 bg-slate-100 sm:bg-transparent rounded-xl sm:rounded-none uppercase tracking-widest hover:text-slate-600 hover:bg-slate-200 sm:hover:bg-transparent transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResolve}
                  disabled={submitting || resolutionNote.trim().length < 10}
                  className="w-full sm:w-auto px-8 py-2.5 bg-blue-950 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  {submitting ? 'Enviando...' : 'Finalizar Tarea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download closure report for resolved/closed tickets */}
      {(ticket.status === 'AWAITING_CONFIRMATION' || ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Acta de Resolución Técnica disponible
            </h4>
            <p className="text-xs text-emerald-700 mt-1">Documento formal con métricas ANS, trazabilidad y consumo de recursos.</p>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="px-6 py-2.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-800 disabled:opacity-50 transition-all active:scale-95 shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <FileDown size={14} />
            {downloading ? 'Descargando...' : 'Descargar PDF'}
          </button>
        </div>
      )}

      <div className="py-8 px-4 bg-white rounded-2xl border border-slate-100/50 shadow-sm">
        <LiveTracker currentStatus={ticket.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Detalles Tecnicos - Columna Principal */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm h-full">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <ClipboardList size={16} className="text-blue-600" /> 
              Información General del Incidente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Tag size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{ticket.category?.name || 'General'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{ticket.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reportado por</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{ticket.creator?.firstName} {ticket.creator?.lastName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0 border border-slate-100">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Reporte</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{new Date(ticket.createdAt).toLocaleString('es-VE')}</p>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-slate-50">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Descripción del Incidente</h4>
              <div className="text-sm text-slate-600 leading-relaxed bg-slate-50/30 p-6 rounded-2xl border border-slate-100 select-text">
                {ticket.description}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Columna Lateral */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Clock size={16} className="text-blue-600" /> 
              Tiempos & SLA
            </h3>
            
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Prioridad de Atención</p>
                <div className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                  ticket.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-100 shadow-sm shadow-rose-100/50' :
                  ticket.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border border-orange-100 shadow-sm shadow-orange-100/50' :
                  'bg-slate-50 text-slate-600 border border-slate-100'
                }`}>
                  {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                </div>
              </div>

              {ticket.dueDate && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Vencimiento SLA</p>
                  <div className={`text-sm font-mono font-bold flex flex-wrap gap-2 items-center ${new Date(ticket.dueDate) < new Date() ? 'text-rose-600' : 'text-blue-900'}`}>
                    {new Date(ticket.dueDate).toLocaleString('es-VE')}
                    {new Date(ticket.dueDate) < new Date() && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[8px] font-black uppercase rounded-lg border border-rose-200">Excedido</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recordatorio Tecnico Suave */}
          <div className="bg-blue-50/50 rounded-2xl p-8 border border-blue-100 relative overflow-hidden group">
             <div className="absolute -bottom-4 -right-4 opacity-10 text-blue-900 group-hover:scale-110 transition-transform duration-500">
               <AlertCircle size={100} />
             </div>
             <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
               Recomendación Técnica
             </h4>
             <p className="text-xs text-blue-700/80 leading-relaxed relative z-10 font-medium">
               Documentá detalladamente el diagnóstico y la solución. Si cambiaste repuestos, incluí los códigos de parte para el control de inventario.
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comentarios */}
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MessageSquare size={14} className="text-blue-600" /> Comentarios
          </h3>
          <CommentSection 
            key={`comments-${id}`}
            ticketId={id} 
            userRole="TECHNICIAN" 
            initialComments={ticket?.comments || []} 
          />
        </div>

        {/* Historial — Timeline Visual */}
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <History size={14} className="text-blue-600" /> Línea de Tiempo
          </h3>
          <TicketTimeline auditLogs={ticket.auditLogs || []} />
        </div>
      </div>
    </div>
  )
}
