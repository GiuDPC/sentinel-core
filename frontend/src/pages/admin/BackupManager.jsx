import { useState, useEffect } from 'react'
import { motion as Motion } from 'framer-motion'
import { Database, Plus, Calendar, Filter, CloudDownload, Trash2, Info, AlertTriangle } from 'lucide-react'
import { backupsApi } from '../../api/backups'
import notifications from '../../components/ui/Notifications'

export default function BackupManager() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  // Modal de Restaurar
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [confirmText, setConfirmText] = useState('')
  const [isRestoring, setIsRestoring] = useState(false)

  // Filtros de fecha
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedFilter, setAppliedFilter] = useState({ from: '', to: '' })

  const loadBackups = async () => {
    try {
      setLoading(true)
      const data = await backupsApi.getAll()
      setBackups(data)
    } catch {
      notifications.error('No se pudieron cargar los backups', 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBackups()
  }, [])

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      await backupsApi.createBackup()
      notifications.success('Backup generado correctamente', 'Éxito')
      loadBackups()
    } catch (error) {
      notifications.error(error.message, 'Error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDownload = async (filename) => {
    try {
      notifications.info(`Descargando ${filename}...`, 'Descarga iniciada')
      await backupsApi.downloadBackup(filename)
    } catch (error) {
      notifications.error(error.message, 'Error al descargar')
    }
  }

  const handleDelete = async (filename) => {
    if (!window.confirm(`¿Estás seguro de eliminar el backup ${filename}?`)) return
    try {
      await backupsApi.deleteBackup(filename)
      notifications.success('Backup eliminado', 'Éxito')
      loadBackups()
    } catch (error) {
      notifications.error(error.message, 'Error')
    }
  }

  const openRestoreModal = (filename) => {
    setSelectedBackup(filename)
    setConfirmText('')
    setShowRestoreModal(true)
  }

  const executeRestore = async () => {
    if (confirmText !== 'RESTAURAR') {
      notifications.error('Debes escribir RESTAURAR para confirmar.', 'Error')
      return
    }

    setIsRestoring(true)
    try {
      await backupsApi.restoreBackup(selectedBackup)
      notifications.success('Base de datos restaurada con éxito.', 'Restauración Completada')
      setShowRestoreModal(false)
      setTimeout(() => window.location.reload(), 2000)
    } catch (error) {
      notifications.error(error.message, 'Error Crítico')
    } finally {
      setIsRestoring(false)
    }
  }

  // Filtrado local basado en el filtro aplicado (no en tiempo real)
  const filteredBackups = backups.filter(b => {
    if (!appliedFilter.from && !appliedFilter.to) return true
    const bDate = new Date(b.createdAt)
    const from = appliedFilter.from ? new Date(appliedFilter.from) : new Date('2000-01-01')
    const to = appliedFilter.to ? new Date(appliedFilter.to) : new Date('2100-01-01')
    to.setHours(23, 59, 59)
    return bDate >= from && bDate <= to
  })

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        
        {/* Header (Igual a la imagen) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-700 text-white rounded-xl flex items-center justify-center shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">RESPALDO DE INFORMACIÓN</h2>
              <p className="text-xs text-slate-500 mt-0.5">Seguridad y copias del sistema</p>
            </div>
          </div>
          
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 bg-sky-700 hover:bg-sky-800 text-white px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-70 text-sm shadow-sm"
          >
            {isCreating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Crear Backup
          </button>
        </div>

        {/* Filtros de Fecha */}
        <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600 font-medium">Rango de fechas:</span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 text-slate-600"
            />
            <span className="text-slate-300">—</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 text-slate-600"
            />
          </div>
          <div className="flex gap-2 ml-auto md:ml-0">
            <button 
              onClick={() => {
                setDateFrom('')
                setDateTo('')
                setAppliedFilter({ from: '', to: '' })
              }} 
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              title="Resetear filtros"
            >
              Resetear
            </button>
            <button 
              onClick={() => setAppliedFilter({ from: dateFrom, to: dateTo })} 
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Filter className="w-3.5 h-3.5" /> Filtrar
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-4 font-bold">Archivo</th>
                <th className="py-4 font-bold">Tamaño</th>
                <th className="py-4 font-bold">Fecha creación</th>
                <th className="py-4 font-bold text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">Cargando backups...</td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">No hay backups disponibles</td>
                </tr>
              ) : (
                filteredBackups.map((backup) => (
                  <tr key={backup.filename} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 text-slate-600 font-mono text-xs">{backup.filename}</td>
                    <td className="py-4 text-slate-500">{formatSize(backup.sizeBytes)}</td>
                    <td className="py-4 text-slate-500">{formatDate(backup.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-3 pr-2">
                        <button 
                          onClick={() => handleDownload(backup.filename)}
                          title="Descargar Backup"
                          className="text-sky-600 hover:text-sky-800 transition-colors"
                        >
                          <CloudDownload className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => openRestoreModal(backup.filename)}
                          title="Restaurar este backup"
                          className="text-emerald-600 hover:text-emerald-800 transition-colors"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(backup.filename)}
                          title="Eliminar Backup"
                          className="text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Aviso inferior */}
        <div className="mt-8 bg-sky-50/50 border border-sky-100 rounded-xl p-4 flex gap-3 text-sky-800">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">AVISO DE SEGURIDAD</h4>
            <p className="text-xs mt-1 text-sky-700/80">
              Se recomienda realizar respaldos periódicos antes de actualizaciones masivas. 
              Los backups se almacenan en el servidor y pueden descargarse a su equipo.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Restauración Crítica */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Restauración Crítica</h3>
              <p className="text-sm text-center text-slate-600 mb-6">
                Vas a reemplazar toda la base de datos actual con el archivo <br/>
                <strong className="text-xs font-mono bg-slate-100 px-1">{selectedBackup}</strong>.
                <strong className="block mt-2 text-rose-600">Esta acción es irreversible.</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold tracking-wide text-slate-500 uppercase mb-2 text-center">
                    Escribe RESTAURAR para confirmar
                  </label>
                  <input 
                    type="text" 
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="RESTAURAR"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-center"
                  />
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowRestoreModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executeRestore}
                    disabled={confirmText !== 'RESTAURAR' || isRestoring}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold rounded-xl transition-colors shadow-sm flex justify-center items-center gap-2"
                  >
                    {isRestoring ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Ejecutar'}
                  </button>
                </div>
              </div>
            </div>
          </Motion.div>
        </div>
      )}
    </div>
  )
}
