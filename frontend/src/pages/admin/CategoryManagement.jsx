import { useState, useEffect } from 'react'
import { categoriesApi } from '../../api/categories'

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadCategories() {
    try {
      const data = await categoriesApi.getAll()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories() 
  }, [])

  const deptLabels = {
    MANTENIMIENTO_ELECTRICO: 'Mtto. Eléctrico',
    PLOMERIA: 'Plomería', SEGURIDAD: 'Seguridad',
    INFRAESTRUCTURA: 'Infraestructura',
    REDES_Y_TELECOMUNICACIONES: 'Redes',
    ADMINISTRACION: 'Admin', OTROS: 'Otros',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-text-primary font-display">Categorías</h2>
        <p className="text-sm text-text-secondary mt-1">Categorías de incidencias y SLA</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando Categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-display">Sin categorías</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
              No se encontraron categorías en el sistema.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Departamento</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">SLA</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">{c.name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{deptLabels[c.department] || c.department}</td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600">{c.slaHours}h</span></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {c.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
