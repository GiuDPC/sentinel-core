import AnimatedModal from '../ui/AnimatedModal'
import { Clock, User, FileText, ArrowRight, Tag, Hash } from 'lucide-react'

const ACTION_LABELS = {
  TICKET_CREATED: { label: 'Ticket Creado', color: 'bg-blue-50 text-blue-700' },
  STATUS_CHANGE: { label: 'Cambio de Estado', color: 'bg-amber-50 text-amber-700' },
  ASSIGNMENT: { label: 'Asignación', color: 'bg-purple-50 text-purple-700' },
  REASSIGNMENT: { label: 'Reasignación', color: 'bg-purple-50 text-purple-700' },
  RESOLUTION_NOTE: { label: 'Nota de Resolución', color: 'bg-emerald-50 text-emerald-700' },
  TICKET_CONFIRMED: { label: 'Confirmado', color: 'bg-green-50 text-green-700' },
  TICKET_REOPENED: { label: 'Reabierto', color: 'bg-rose-50 text-rose-700' },
}

const ACTION_DESCRIPTIONS = {
  TICKET_CREATED: 'Se registró un nuevo ticket en el sistema.',
  STATUS_CHANGE: 'Se modificó el estado del ticket.',
  ASSIGNMENT: 'Se asignó un técnico al ticket.',
  REASSIGNMENT: 'Se reasignó el ticket a un nuevo técnico.',
  RESOLUTION_NOTE: 'El técnico añadió una nota de resolución al ticket.',
  TICKET_CONFIRMED: 'El solicitante confirmó que la resolución fue satisfactoria.',
  TICKET_REOPENED: 'El solicitante reabrió el ticket por una solución insatisfactoria.',
}

const VALUE_LABELS = {
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
  CRITICAL: 'Crítica',
}

function formatValue(value) {
  if (!value || value === '-') return null
  
  // Format long UUIDs
  if (value.length > 30 && value.includes('-')) {
    return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
  }
  
  return VALUE_LABELS[value] || value
}

function getStatusColor(value) {
  const colors = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    ON_HOLD: 'bg-slate-100 text-slate-600 border-slate-300',
    AWAITING_CONFIRMATION: 'bg-orange-50 text-orange-700 border-orange-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-500 border-slate-300',
  }
  return colors[value] || 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function AuditDetailModal({ show, onClose, log }) {
  if (!log) return null

  const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-600' }

  const createdDate = new Date(log.createdAt).toLocaleDateString('es-VE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const createdTime = new Date(log.createdAt).toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const oldFormatted = formatValue(log.oldValue)
  const newFormatted = formatValue(log.newValue)

  return (
    <AnimatedModal show={show} onClose={onClose} className="w-full max-w-2xl mx-4">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            {log.ticket?.ticketCode && (
              <span className="px-2 py-0.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest rounded">
                #{log.ticket.ticketCode}
              </span>
            )}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${actionConfig.color}`}>
              {actionConfig.label}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">
            Detalle de Registro de Auditoría
          </h3>
          <p className="text-sm text-slate-400 mt-1 capitalize">
            {createdDate} — {createdTime}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto">
          {/* Metadata grid */}
          <div className="grid grid-cols-3 border-b border-slate-100">
            {/* Ticket */}
            <div className="px-5 py-4 border-r border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ticket</p>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {log.ticket?.ticketCode || '—'}
              </p>
              {log.ticket?.title && (
                <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={log.ticket.title}>
                  {log.ticket.title}
                </p>
              )}
            </div>
            {/* User */}
            <div className="px-5 py-4 border-r border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ejecutado Por</p>
              </div>
              <p className="text-xs font-bold text-slate-900">
                {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
              </p>
              {log.user?.email && (
                <p className="text-[10px] text-slate-500 mt-0.5">{log.user.email}</p>
              )}
            </div>
            {/* Timestamp */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fecha y Hora</p>
              </div>
              <p className="text-xs font-bold text-slate-900 capitalize">{createdDate}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{createdTime}</p>
            </div>
          </div>

          {/* Action Type */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Acción</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${actionConfig.color}`}>
                {actionConfig.label}
              </span>
              <p className="text-xs text-slate-500">
                {ACTION_DESCRIPTIONS[log.action] || 'Acción registrada en el sistema.'}
              </p>
            </div>
          </div>

          {/* Value Comparison */}
          {(log.oldValue || log.newValue) && (
            <div className="px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambio Registrado</h4>
              </div>

              <div className="flex items-center gap-4">
                {/* Old value */}
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valor Anterior</p>
                  {oldFormatted ? (
                    <div className={`px-4 py-3 rounded-xl border text-sm font-bold text-center ${getStatusColor(log.oldValue)}`}>
                      {oldFormatted}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-300 text-center italic">
                      Sin valor previo
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* New value */}
                <div className="flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Valor Nuevo</p>
                  {newFormatted ? (
                    <div className={`px-4 py-3 rounded-xl border text-sm font-bold text-center ${getStatusColor(log.newValue)}`}>
                      {newFormatted}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl border border-dashed border-slate-200 text-sm text-slate-300 text-center italic">
                      Sin valor
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit ID */}
          <div className="px-6 py-4 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Hash className="w-3.5 h-3.5 text-slate-300" />
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                ID de Registro: <span className="font-mono text-slate-400">{log.id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </AnimatedModal>
  )
}
