import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContextObject.js'
import { ticketsApi } from '../../api/tickets'
import { categoriesApi } from '../../api/categories'
import notifications from '../../components/ui/Notifications'
import { AlertCircle, Clock, MapPin, Send, X, ChevronDown, Check, Search } from 'lucide-react'

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Bajo', color: 'bg-slate-100 text-slate-600', desc: 'No interfiere operaciones.' },
  { value: 'MEDIUM', label: 'Medio', color: 'bg-blue-50 text-blue-600', desc: 'Afecta productividad parcial.' },
  { value: 'HIGH', label: 'Alto', color: 'bg-orange-50 text-orange-600', desc: 'Riesgo o pérdida significativa.' },
  { value: 'CRITICAL', label: 'Crítico', color: 'bg-rose-50 text-rose-600', desc: 'Cese total de actividades.' },
]

const AREA_SUGGESTIONS = ['Mostrador', 'Depósito', 'Salón Principal', 'Baños', 'Vidriera', 'Probadores', 'Entrada']

export default function CreateTicket() {
  const navigate = useNavigate()
  const locationState = useLocation()
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const categoryRef = useRef(null)
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '', 
    categoryId: '',
    priority: 'MEDIUM',
  })

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await categoriesApi.getAll()
        const list = Array.isArray(data) ? data : (data.data || data.categories || [])
        setCategories(list)
        
        if (locationState.state?.preselectedCategory) {
          const cat = list.find((c) => c.name === locationState.state.preselectedCategory)
          if (cat) {
            setForm((f) => ({ ...f, categoryId: String(cat.id) }))
          }
        }
      } catch (error) {
        console.error('Error cargando categorias:', error)
      }
    }
    
    loadCategories()

    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setIsCategoryOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [locationState.state])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.title || !form.description || !form.location || !form.categoryId) {
      notifications.error('Por favor completa todos los campos obligatorios', 'Validación')
      return
    }

    setLoading(true)
    try {
      await ticketsApi.create({
        ...form,
        location: `${user?.storeNumber || 'S/L'} - ${form.location}`,
        categoryId: parseInt(form.categoryId, 10),
      })
      notifications.success('El reporte ha sido enviado al equipo técnico', 'Éxito')
      navigate('/requester/my-tickets')
    } catch (error) {
      notifications.error(error.message || 'No se pudo procesar el reporte', 'Error')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find((c) => String(c.id) === form.categoryId)
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(categorySearch.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 px-4">
      {/* Header y Navegación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <span>Inicio</span>
            <span className="text-slate-200">/</span>
            <span>Nuevo Reporte</span>
          </nav>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Crear Incidencia</h2>
        </div>
      </div>

      {/* Info del Local - Fija */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <MapPin className="text-indigo-400" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Establecimiento Emisor</p>
            <h3 className="text-lg font-bold">{user?.storeName || 'Nombre del Local'} — {user?.storeNumber || 'L-XXX'}</h3>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación Base</p>
          <p className="text-sm font-medium text-slate-200">{user?.location || 'Planta Principal'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Detalles de la Incidencia</h4>
            </div>
            
            <div className="p-8 space-y-10">
              {/* Asunto */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asunto o Título Corto</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Ej: Falla en iluminación principal"
                  className="w-full px-0 py-2 bg-transparent border-b-2 border-slate-100 text-lg font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                />
              </div>

              {/* Categoría y Área */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Selector de Categoría Estilo Filtro */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categoría del Problema</label>
                  <div className="relative" ref={categoryRef}>
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className="w-full flex items-center justify-between py-2 border-b-2 border-slate-100 text-sm font-bold text-slate-900 hover:border-slate-300 transition-all text-left"
                    >
                      <span className={selectedCategory ? 'text-slate-900' : 'text-slate-400'}>
                        {selectedCategory ? selectedCategory.name : 'Seleccionar categoría...'}
                      </span>
                      <ChevronDown size={16} className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isCategoryOpen && (
                      <div className="absolute top-full left-0 z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                          <Search size={14} className="text-slate-400" />
                          <input
                            autoFocus
                            placeholder="Buscar categoría..."
                            className="w-full py-1 text-xs outline-none bg-transparent"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                          />
                        </div>
                        <div className="max-h-[240px] overflow-y-auto p-1">
                          {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setForm(f => ({ ...f, categoryId: String(cat.id) }))
                                setIsCategoryOpen(false)
                              }}
                              className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left"
                            >
                              {cat.name}
                              {String(cat.id) === form.categoryId && <Check size={14} className="text-indigo-600" />}
                            </button>
                          )) : (
                            <p className="p-4 text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">No hay resultados</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Área o Zona Afectada</label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="¿Dónde está el problema?"
                    className="w-full px-0 py-2 bg-transparent border-b-2 border-slate-100 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all placeholder:text-slate-300"
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {AREA_SUGGESTIONS.map(suggestion => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, location: suggestion }))}
                        className="px-2 py-1 bg-slate-50 text-[9px] font-black text-slate-500 uppercase tracking-tighter border border-slate-100 rounded hover:bg-slate-100 hover:text-slate-700 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Descripción Detallada</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe el problema para que el técnico venga preparado..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Prioridad Integrada - Agrandada */}
              <div className="pt-8 border-t border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nivel de Urgencia</label>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecciona una opción</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: opt.value }))}
                      className={`flex flex-col p-5 rounded-2xl border-2 transition-all text-left space-y-3 cursor-pointer group relative overflow-hidden ${
                        form.priority === opt.value
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]'
                          : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black uppercase tracking-widest ${form.priority === opt.value ? 'text-white' : 'text-slate-900'}`}>
                          {opt.label}
                        </span>
                        {form.priority === opt.value && <Check size={16} className="text-indigo-400" />}
                      </div>
                      <p className={`text-[10px] leading-snug font-medium ${form.priority === opt.value ? 'text-slate-400' : 'text-slate-500'}`}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer de Acciones del Formulario */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => navigate('/requester/dashboard')}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-2"
              >
                <X size={16} /> Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white bg-slate-900 shadow-lg shadow-slate-900/20 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                {loading ? 'Procesando...' : <><Send size={16} /> Enviar Reporte</>}
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {selectedCategory && (
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-md animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} />
                <h3 className="text-[10px] font-black uppercase tracking-widest">SLA de Respuesta</h3>
              </div>
              <p className="text-4xl font-black mb-2">{selectedCategory.slaHours} Horas</p>
              <p className="text-[11px] text-indigo-100 leading-relaxed font-medium">
                Garantizamos una intervención técnica para <span className="font-bold text-white underline decoration-white/30">{selectedCategory.name}</span>.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle size={18} className="text-slate-900" />
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Recomendaciones</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Evita manipular equipos eléctricos sin autorización.',
                'En caso de filtración, despeja el área inmediata.',
                'Sé detallado en la descripción para agilizar el proceso.'
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3 text-xs text-slate-500 font-medium leading-snug">
                  <span className="w-1.5 h-1.5 bg-slate-200 rounded-full mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
