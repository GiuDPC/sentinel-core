import AnimatedModal from '../ui/AnimatedModal'
import { ROLE_LABELS, ROLE_COLORS } from '../../constants/roles'
import { Mail, Phone, Shield, Calendar, Store, Building2, Hash, Clock, Ticket, Wrench } from 'lucide-react'

const DEPARTMENT_LABELS = {
  MANTENIMIENTO_ELECTRICO: 'Mantenimiento Eléctrico',
  PLOMERIA: 'Plomería',
  SEGURIDAD: 'Seguridad',
  INFRAESTRUCTURA: 'Infraestructura',
  REDES_Y_TELECOMUNICACIONES: 'Redes y Telecomunicaciones',
  ADMINISTRACION: 'Administración',
  OTROS: 'Otros',
}

export default function UserDetailModal({ show, onClose, user }) {
  if (!user) return null

  const roleName = user.role?.name || user.role
  const roleLabel = ROLE_LABELS[roleName] || roleName
  const roleColor = ROLE_COLORS[roleName] || 'bg-gray-100 text-gray-600'

  const formatDate = (date) => {
    if (!date) return 'No disponible'
    return new Date(date).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateTime = (date) => {
    if (!date) return 'No disponible'
    return new Date(date).toLocaleString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const ticketCount = user._count?.tickets ?? 0
  const assignmentCount = user._count?.assignments ?? 0

  return (
    <AnimatedModal show={show} onClose={onClose} className="w-full max-w-2xl mx-4">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
        {/* Header — dark style matching ticket detail */}
        <div className="bg-slate-900 px-6 py-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center text-xl font-bold text-white">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-white leading-tight truncate">
                  {user.firstName} {user.lastName}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
              <p className="text-sm text-slate-400 truncate">{user.email}</p>
            </div>
            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              user.isActive
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {user.isActive ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto">
          {/* Stats bar */}
          <div className="grid grid-cols-4 border-b border-slate-100">
            <div className="px-4 py-3 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Estado</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {user.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="px-4 py-3 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tickets Creados</p>
              <p className="text-lg font-bold text-slate-900">{ticketCount}</p>
            </div>
            <div className="px-4 py-3 text-center border-r border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Asignaciones</p>
              <p className="text-lg font-bold text-slate-900">{assignmentCount}</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Rol</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Contact info */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5" />
              Información de Contacto
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                <p className="text-xs font-bold text-slate-900 break-all">{user.email}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Teléfono</p>
                </div>
                <p className="text-xs font-bold text-slate-900">{user.phone || 'No registrado'}</p>
              </div>
            </div>
          </div>

          {/* Role & Department */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Rol y Departamento
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rol en el Sistema</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleColor}`}>
                  {roleLabel}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Departamento</p>
                </div>
                <p className="text-xs font-bold text-slate-900">
                  {user.department ? (DEPARTMENT_LABELS[user.department] || user.department) : 'No aplica'}
                </p>
              </div>
            </div>
          </div>

          {/* Store info — only for REQUESTER */}
          {(user.storeNumber || user.storeName || roleName === 'REQUESTER') && (
            <div className="px-6 py-5 border-b border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Store className="w-3.5 h-3.5" />
                Información del Local
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Número de Local</p>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{user.storeNumber || 'No registrado'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre del Local</p>
                  <p className="text-xs font-bold text-slate-900">{user.storeName || 'No registrado'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Activity summary */}
          <div className="px-6 py-5 border-b border-slate-100">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Ticket className="w-3.5 h-3.5" />
              Actividad en el Sistema
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                <Ticket className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-blue-700">{ticketCount}</p>
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Tickets Creados</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                <Wrench className="w-4 h-4 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-purple-700">{assignmentCount}</p>
                <p className="text-[9px] font-bold text-purple-500 uppercase tracking-widest">Asignaciones</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-700 mt-1">{formatDate(user.createdAt)}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Registro</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="px-6 py-4 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-300" />
                <div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Registrado</p>
                  <p className="text-[10px] font-bold text-slate-500">{formatDateTime(user.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                <div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Última Actualización</p>
                  <p className="text-[10px] font-bold text-slate-500">{formatDateTime(user.updatedAt)}</p>
                </div>
              </div>
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
