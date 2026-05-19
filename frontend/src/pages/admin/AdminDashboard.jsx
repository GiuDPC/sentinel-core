import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { motion as Motion } from 'framer-motion'
import KPICard from '../../components/dashboard/KPICard'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { metricsApi } from '../../api/metrics'
import { ticketsApi } from '../../api/tickets'

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [recentTickets, setRecentTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function loadDashboard() {
    try {
      const [metricsData, ticketsData] = await Promise.all([
        metricsApi.getDashboard(),
        ticketsApi.getAll({ limit: 5 }),
      ])
      setMetrics(metricsData)
      setRecentTickets(ticketsData.data || [])
    } catch (error) {
      console.error('Error cargando dashboard admin:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div>
          <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    )
  }

  const summary = metrics?.summary || {}

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">
          Panel de Administracion
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Vision general del centro comercial
        </p>
      </div>

      {/* KPIs */}
      <Motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <KPICard
            title="Total Tickets"
            value={summary.totalTickets || 0}
            subtitle={`${summary.ticketsThisMonth || 0} este mes`}
            trend={summary.trendPercentage > 0 ? 'up' : summary.trendPercentage < 0 ? 'down' : 'neutral'}
            trendValue={`${Math.abs(summary.trendPercentage) || 0}%`}
            color="blue"
            icon={FileText}
          />
        </Motion.div>
        <Motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <KPICard
            title="Tickets Abiertos"
            value={summary.openTickets || 0}
            color="yellow"
            icon={AlertCircle}
          />
        </Motion.div>
        <Motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <KPICard
            title="Tiempo Vencido"
            value={summary.slaBreached || 0}
            subtitle={`${summary.slaAtRisk || 0} por vencer`}
            color={summary.slaBreached > 0 ? 'red' : 'green'}
            icon={Clock}
          />
        </Motion.div>
        <Motion.div variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } }}>
          <KPICard
            title="Tiempo Promedio"
            value={`${summary.avgResolutionHours || 0}h`}
            subtitle="para resolver"
            color="blue"
            icon={CheckCircle}
          />
        </Motion.div>
      </Motion.div>

      {/* Estadisticas por categoria y estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tickets por Categoria */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Tickets por Categoría</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Distribución por tipo de incidencia</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-bold text-slate-800">{summary.totalTickets || 0}</span>
              <p className="text-[10px] text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-3">
            {(metrics?.ticketsByCategory || []).map((item, i) => {
              const percentage = Math.min((item.count / (summary.totalTickets || 1)) * 100, 100)
              return (
                <Motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.05) }}
                  key={item.category} 
                  className="group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[140px]">{item.category}</span>
                    <span className="text-xs font-bold text-slate-800">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <Motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      className="h-full bg-slate-700 rounded-full group-hover:bg-slate-800"
                    />
                  </div>
                </Motion.div>
              )
            })}
          </div>
        </div>

        {/* Tickets por Estado */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">Tickets por Estado</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Estado actual del sistema</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-slate-800">{summary.totalTickets || 0}</span>
              <p className="text-[10px] text-slate-400">total</p>
            </div>
          </div>
          <div className="space-y-5">
            {(metrics?.ticketsByStatus || []).map((item, i) => {
              const percentage = Math.min((item.count / (summary.totalTickets || 1)) * 100, 100)
              const statusLabels = {
                OPEN: 'Abierto',
                ASSIGNED: 'Asignado',
                IN_PROGRESS: 'En Proceso',
                ON_HOLD: 'En Espera',
                RESOLVED: 'Resuelto',
                CLOSED: 'Cerrado',
              }
              return (
                <Motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.05) }}
                  key={item.status} 
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{statusLabels[item.status] || item.status}</span>
                    <span className="text-xs font-bold text-slate-800">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <Motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      className="h-full bg-slate-700 rounded-full group-hover:bg-slate-800"
                    />
                  </div>
                </Motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <RecentActivity
          tickets={recentTickets}
          onViewAll={() => navigate('/admin/tickets')}
        />
      </div>
    </div>
  )
}
