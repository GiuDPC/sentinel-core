import { Outlet, useLocation } from 'react-router-dom'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import { SidebarProvider } from '../../Contexts/SidebarContext.jsx'

export default function MainLayout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-0 lg:ml-64 lg:py-2 lg:pr-2 lg:pl-0">
          <div className="relative flex flex-1 flex-col bg-white lg:rounded-xl shadow-sm lg:border lg:border-slate-200 overflow-hidden">
            <Header />
            {/* El contenedor principal debe ser relativo para manejar el enrutamiento absoluto interno */}
            <main className="flex-1 overflow-y-auto bg-slate-50/30 relative">
              <AnimatePresence mode="wait">
                <Motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-0 p-3 sm:p-4 h-full custom-scrollbar"
                >
                  <Outlet />
                </Motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}