import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../Contexts/AuthContext'
import ProtectedRoute from '../components/common/ProtectedRoute'
import MainLayout from '../components/layout/MainLayout'
import LoadingSpinner from '../components/common/LoadingSpinner'

// Auth pages — no lazy (se cargan inmediato)
import LoginPage from '../pages/LoginPage'
import SigninPage from '../pages/SigninPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'

// Lazy loaded — Requester
const RequesterDashboard = lazy(() => import('../pages/requester/RequesterDashboard'))
const MyTickets = lazy(() => import('../pages/requester/MyTickets'))
const CreateTicket = lazy(() => import('../pages/requester/CreateTicket'))

// Lazy loaded — Technician
const TechDashboard = lazy(() => import('../pages/technician/TechDashboard'))
const AssignedTickets = lazy(() => import('../pages/technician/AssignedTickets'))
const TicketDetail = lazy(() => import('../pages/technician/TicketDetail'))

// Lazy loaded — Admin
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const TicketList = lazy(() => import('../pages/admin/TicketList'))
const UserManagement = lazy(() => import('../pages/admin/UserManagement'))
const CategoryManagement = lazy(() => import('../pages/admin/CategoryManagement'))
const Reports = lazy(() => import('../pages/admin/Reports'))
const AuditLogs = lazy(() => import('../pages/admin/AuditLogs'))
const BackupManager = lazy(() => import('../pages/admin/BackupManager'))

// Profile page
const ProfilePage = lazy(() => import('../pages/ProfilePage'))

function LazyPage({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
}

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signin" element={<SigninPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Rutas protegidas — Layout principal */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              {/* ── Requester (Locatario) ── */}
              <Route
                path="/requester/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <LazyPage><RequesterDashboard /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requester/my-tickets"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <LazyPage><MyTickets /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requester/create-ticket"
                element={
                  <ProtectedRoute allowedRoles={['REQUESTER']}>
                    <LazyPage><CreateTicket /></LazyPage>
                  </ProtectedRoute>
                }
              />

              {/* ── Technician ── */}
              <Route
                path="/technician/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                    <LazyPage><TechDashboard /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/technician/assigned"
                element={
                  <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                    <LazyPage><AssignedTickets /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/technician/ticket/:id"
                element={
                  <ProtectedRoute allowedRoles={['TECHNICIAN']}>
                    <LazyPage><TicketDetail /></LazyPage>
                  </ProtectedRoute>
                }
              />

              {/* ── Admin ── */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><AdminDashboard /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tickets"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><TicketList /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/ticket/:id" element={<Navigate to="/admin/tickets" replace />} />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><UserManagement /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><CategoryManagement /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><Reports /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><AuditLogs /></LazyPage>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/backups"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <LazyPage><BackupManager /></LazyPage>
                  </ProtectedRoute>
                }
              />

              {/* ── Profile (todos los roles) ── */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'TECHNICIAN', 'REQUESTER']}>
                    <LazyPage><ProfilePage /></LazyPage>
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}