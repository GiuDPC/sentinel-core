import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../Contexts/AuthContextObject.js'
import { useSidebar } from '../../Contexts/SidebarContext.jsx'
import { useNotificationStore } from '../../store/useNotificationStore.js'
import { Bell, Search, Menu } from 'lucide-react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

const NotificationBell = () => {
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotificationStore()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative">
      <Motion.button
        whileTap={{ scale: 0.85, rotate: -10 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative mr-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        title="Notificaciones"
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        )}
      </Motion.button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-50 overflow-hidden origin-top-right"
          >
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/80">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Notificaciones</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-slate-400 font-medium">No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id)
                      if (n.link) navigate(n.link)
                      setIsOpen(false)
                    }}
                    className={`px-5 py-4 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="flex justify-between gap-2 mb-1">
                      <p className={`text-[11px] font-bold ${!n.isRead ? 'text-blue-900' : 'text-slate-700'}`}>{n.title}</p>
                      {!n.isRead && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 mt-1 shadow-[0_0_8px_rgba(37,99,235,0.5)]"></span>}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed mb-2">{n.message}</p>
                    <p className="text-[9px] text-slate-400 font-medium">{new Date(n.createdAt).toLocaleString('es-VE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                  </div>
                ))
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Header() {
  const { user } = useAuth()
  const { toggle } = useSidebar()
  const { startPolling, stopPolling } = useNotificationStore()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const greeting = getGreeting()

  useEffect(() => {
    if (user) {
      startPolling()
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [user, startPolling, stopPolling])

  function handleSearch(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = encodeURIComponent(searchQuery.trim())
      const role = user?.role
      if (role === 'ADMIN') {
        navigate(`/admin/tickets?search=${query}`)
      } else if (role === 'TECHNICIAN') {
        navigate(`/technician/assigned?search=${query}`)
      } else {
        navigate(`/requester/my-tickets?search=${query}`)
      }
      setSearchQuery('')
    }
  }

  function handleUserClick() {
    navigate('/profile')
  }

  return (
    <header className="h-14 flex shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/50 backdrop-blur-md border-b border-slate-100 z-10 sticky top-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — only on mobile */}
        <button
          onClick={toggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base sm:text-xl font-bold text-slate-900 font-display tracking-tight truncate">
          {greeting}, {user?.firstName}!  
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="relative group hidden sm:block">
          <input
            type="text"
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-40 md:w-56 h-9 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-all shadow-sm"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
        </div>

        <NotificationBell />

        <Motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleUserClick}
          className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black tracking-widest shadow-md cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-200 transition-colors"
          title="Mi Perfil"
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Motion.button>
      </div>
    </header>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}