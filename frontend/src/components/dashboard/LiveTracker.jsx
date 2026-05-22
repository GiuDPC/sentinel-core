import { motion as Motion } from 'framer-motion'

const STATUS_LABELS = {
  OPEN: 'Reportado',
  ASSIGNED: 'Asignado',
  IN_PROGRESS: 'En proceso',
  RESOLVED: 'Resuelto',
  AWAITING_CONFIRMATION: 'Confirmacion',
  CLOSED: 'Cerrado',
}

const STEPS = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION', 'CLOSED']

export default function LiveTracker({ ticketCode, title, currentStatus, technicianName, eta, priority }) {
  const currentIndex = STEPS.indexOf(currentStatus)

  return (
    <div className="w-full">
      {(title || ticketCode) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-blue-950 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                Estado Actual
              </span>
              <h3 className="text-xl font-bold text-slate-900 font-display">
                {title || 'Incidencia en curso'}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              {ticketCode && <span className="font-mono font-bold text-slate-600">#{ticketCode}</span>}
              {ticketCode && priority && <span className="w-1 h-1 rounded-full bg-slate-300" />}
              {priority && <span className="text-slate-600 font-bold uppercase text-[9px]">Prioridad {priority}</span>}
              {eta && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-slate-600 font-semibold">ETA: {eta}</span>
                </>
              )}
            </div>
          </div>

          {technicianName && (
            <div className="flex items-center gap-3 bg-slate-50/50 p-3 px-4 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Técnico Asignado</p>
                <p className="text-sm font-bold text-blue-950">{technicianName}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between relative px-2 pt-2 gap-6 md:gap-0">
        {/* Horizontal background line (desktop) */}
        <div className="absolute top-6 left-10 right-10 h-1 hidden md:block bg-slate-100 rounded-full" />
        
        {/* Horizontal active line (desktop) */}
        <Motion.div
          initial={{ width: 0 }}
          animate={{ width: `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - ${(currentIndex / (STEPS.length - 1)) * 40}px)` }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-6 left-10 h-1 hidden md:block bg-blue-950 rounded-full"
        />

        {/* Vertical background line (mobile) */}
        <div className="absolute top-4 left-[1.625rem] bottom-4 w-1 md:hidden block bg-slate-100 rounded-full" />
        
        {/* Vertical active line (mobile) */}
        <Motion.div
          initial={{ height: 0 }}
          animate={{ height: `calc(${(currentIndex / (STEPS.length - 1)) * 100}% - 8px)` }}
          transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute top-4 left-[1.625rem] w-1 md:hidden block bg-blue-950 rounded-full"
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < currentIndex
          const isCurrent = i === currentIndex
          const isPending = i > currentIndex

          return (
            <div key={step} className="relative flex flex-row md:flex-col items-center gap-4 md:gap-0 z-10 w-full md:w-24 pl-2 md:pl-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-500 ${
                  isCompleted
                    ? 'bg-blue-950 text-white shadow-lg shadow-blue-900/20'
                    : isCurrent
                      ? 'bg-white border-4 border-blue-950 text-blue-950 scale-110 md:scale-125 shadow-xl shadow-blue-900/10'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : isCurrent ? (
                   <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-blue-950 animate-pulse" />
                ) : (
                  <span className="text-xs">{i + 1}</span>
                )}
              </div>
              <div className="flex flex-col items-start md:items-center text-left md:text-center mt-0 md:mt-4">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${
                    isPending ? 'text-slate-300' : isCurrent ? 'text-blue-950 font-black' : 'text-slate-500'
                  }`}
                >
                  {STATUS_LABELS[step]}
                </span>
                {isCurrent && (
                  <span className="text-[9px] text-slate-400 font-medium lowercase md:hidden">
                    en curso
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}