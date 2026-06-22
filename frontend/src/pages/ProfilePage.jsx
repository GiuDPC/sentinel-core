import { useState } from 'react'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../Contexts/AuthContextObject.js'
import { usersApi } from '../api/users'
import { authApi } from '../api/auth'
import notifications from '../components/ui/Notifications'
import { ROLE_LABELS } from '../constants/roles'

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    storeNumber: user?.role === 'REQUESTER' ? (user?.storeNumber || '') : '',
    storeName: user?.role === 'REQUESTER' ? (user?.storeName || '') : '',
  })
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [errors, setErrors] = useState({})

  const [prevUser, setPrevUser] = useState(user)

  if (user !== prevUser) {
    setPrevUser(user)
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      storeNumber: user?.role === 'REQUESTER' ? (user?.storeNumber || '') : '',
      storeName: user?.role === 'REQUESTER' ? (user?.storeName || '') : '',
    })
  }

  function filterLettersOnly(value) {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
  }

  const handleFirstNameChange = (e) => {
    const filtered = filterLettersOnly(e.target.value)
    setForm(f => ({ ...f, firstName: filtered }))
    setErrors(prev => ({ ...prev, firstName: filtered.length > 0 && filtered.length < 2 ? 'Mínimo 2 letras' : null }))
  }

  const handleLastNameChange = (e) => {
    const filtered = filterLettersOnly(e.target.value)
    setForm(f => ({ ...f, lastName: filtered }))
    setErrors(prev => ({ ...prev, lastName: filtered.length > 0 && filtered.length < 2 ? 'Mínimo 2 letras' : null }))
  }

  const handlePhoneChange = (e) => {
    const phoneRegex = /^04(12|14|16|24|26)-\d{3}-\d{4}$/
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 4 && value.length <= 7) value = `${value.slice(0, 4)}-${value.slice(4)}`
    else if (value.length > 7) value = `${value.slice(0, 4)}-${value.slice(4, 7)}-${value.slice(7, 11)}`
    setForm(f => ({ ...f, phone: value }))
    
    let error = null
    if (value.length > 0 && value.length < 13) error = 'Teléfono incompleto'
    else if (value.length === 13 && !phoneRegex.test(value)) error = 'Formato inválido (04XX-XXX-XXXX)'
    
    setErrors(prev => ({ ...prev, phone: error }))
  }

  const handleCancelEdit = () => {
    setForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      storeNumber: user?.role === 'REQUESTER' ? (user?.storeNumber || '') : '',
      storeName: user?.role === 'REQUESTER' ? (user?.storeName || '') : '',
    })
    setIsEditing(false)
    setErrors({})
  }

  const handleStoreNumberChange = (e) => {
    let value = e.target.value.toUpperCase()
    if (!value.startsWith('L-')) {
      value = 'L-' + value.replace(/\D/g, '')
    } else {
      const rest = value.slice(2).replace(/\D/g, '')
      value = 'L-' + rest
    }
    setForm(f => ({ ...f, storeNumber: value }))
    setErrors(prev => ({ ...prev, storeNumber: !/^L-\d+$/.test(value) ? 'Formato inválido (L-xxx)' : null }))
  }

  async function handleSaveProfile() {
    if (user.role === 'REQUESTER' && !/^L-\d+$/.test(form.storeNumber)) {
      notifications.error('El número de local debe ser L- seguido de números (Ej: L-105)', 'Validación')
      return
    }
    
    setSavingProfile(true)
    try {
      const response = await usersApi.updateProfile(form)
      updateUser(response.user || response)
      setIsEditing(false)
      notifications.success('Perfil actualizado correctamente', 'Guardado')
    } catch (error) {
      notifications.error(error.message || 'Error al guardar', 'Error')
    } finally {
      setSavingProfile(false)
    }
  }
  
  async function handleChangePassword() {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifications.error('Las contraseñas no coinciden', 'Error')
      return
    }
    setSavingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setIsChangingPassword(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswords({ current: false, new: false, confirm: false })
      notifications.success('Contraseña actualizada', 'Seguridad')
    } catch (error) {
      notifications.error(error.message || 'Error al cambiar contraseña', 'Error')
    } finally {
      setSavingPassword(false)
    }
  }

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()

  if (!user) return <div className="p-12 text-center text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Perfil...</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 px-4">
      {/* Header Minimalista */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl font-black text-white shadow-inner">
            {initials}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.firstName} {user.lastName}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200">
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">{user.email}</p>
          </div>

          <div className="flex gap-4 md:border-l border-slate-100 md:pl-8">
            <div className="text-center md:text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Miembro Desde</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{new Date(user.createdAt).toLocaleDateString('es-VE', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-relaxed">
              {user.role === 'TECHNICIAN' ? 'Información Técnica y Personal' : 'Información Personal y del Establecimiento'}
            </h4>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="shrink-0 px-4 py-1.5 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all cursor-pointer shadow-sm">Editar</button>
            ) : (
              <div className="flex gap-3 shrink-0">
                <button onClick={handleCancelEdit} className="px-4 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer">Cancelar</button>
                <button onClick={handleSaveProfile} disabled={savingProfile} className="px-4 py-1.5 bg-emerald-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all cursor-pointer shadow-sm disabled:opacity-50">
                  {savingProfile ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            )}
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
              {isEditing ? (
                <input type="text" value={form.firstName} onChange={handleFirstNameChange} className="w-full px-0 py-1 bg-transparent border-b-2 border-slate-100 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all" />
              ) : (
                <p className="text-sm font-bold text-slate-800 py-1">{user.firstName}</p>
              )}
              {errors.firstName && <p className="text-[9px] text-rose-500 font-bold uppercase">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Apellido</label>
              {isEditing ? (
                <input type="text" value={form.lastName} onChange={handleLastNameChange} className="w-full px-0 py-1 bg-transparent border-b-2 border-slate-100 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all" />
              ) : (
                <p className="text-sm font-bold text-slate-800 py-1">{user.lastName}</p>
              )}
              {errors.lastName && <p className="text-[9px] text-rose-500 font-bold uppercase">{errors.lastName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teléfono de Contacto</label>
              {isEditing ? (
                <input type="tel" value={form.phone} onChange={handlePhoneChange} className="w-full px-0 py-1 bg-transparent border-b-2 border-slate-100 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all" />
              ) : (
                <p className="text-sm font-bold text-slate-800 py-1">{user.phone || 'No registrado'}</p>
              )}
              {errors.phone && <p className="text-[9px] text-rose-500 font-bold uppercase">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Corporativo</label>
              <p className="text-sm font-bold text-slate-400 py-1">{user.email}</p>
            </div>

            {user.role === 'REQUESTER' && (
              <>
                <div className="space-y-2 border-t border-slate-50 pt-4 md:border-t-0 md:pt-0">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre del Local / Establecimiento</label>
                  {isEditing ? (
                    <input type="text" value={form.storeName} onChange={(e) => setForm(f => ({ ...f, storeName: e.target.value }))} className="w-full px-0 py-1 bg-transparent border-b-2 border-slate-100 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all" />
                  ) : (
                    <p className="text-sm font-bold text-slate-800 py-1">{form.storeName || 'No registrado'}</p>
                  )}
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4 md:border-t-0 md:pt-0">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nº de Local</label>
                  {isEditing ? (
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={form.storeNumber} 
                        onChange={handleStoreNumberChange} 
                        onFocus={() => {
                          if (!form.storeNumber) setForm(f => ({ ...f, storeNumber: 'L-' }))
                        }}
                        className="w-full px-0 py-1 bg-transparent border-b-2 border-slate-100 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-900 transition-all" 
                        placeholder="L-105" 
                      />
                      {errors.storeNumber && <p className="text-[9px] text-rose-500 font-bold uppercase">{errors.storeNumber}</p>}
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-slate-800 py-1">{form.storeNumber || 'No registrado'}</p>
                  )}
                </div>
              </>
            )}
            
            {user.role === 'TECHNICIAN' && (
              <>
                <div className="space-y-2 border-t border-slate-50 pt-4 md:border-t-0 md:pt-0">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Departamento Operativo</label>
                  <p className="text-sm font-black text-black py-1 capitalize">
                    {(user.department || 'Servicios Generales').toLowerCase()}
                  </p>
                </div>
                <div className="space-y-2 border-t border-slate-50 pt-4 md:border-t-0 md:pt-0">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base de Operaciones</label>
                  <p className="text-sm font-bold text-black py-1 capitalize">
                    {'Centro de Control de Mantenimiento'.toLowerCase()}
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Seguridad */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-relaxed">Seguridad de Acceso</h4>
            {!isChangingPassword ? (
              <button onClick={() => setIsChangingPassword(true)} className="shrink-0 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 hover:text-indigo-700 transition-all cursor-pointer shadow-sm">Cambiar Contraseña</button>
            ) : (
              <button onClick={() => setIsChangingPassword(false)} className="shrink-0 px-4 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer">Cancelar</button>
            )}
          </div>

          {isChangingPassword ? (
            <div className="p-8 space-y-6 max-w-xl">
              <div className="grid grid-cols-1 gap-4">
                {[
                  { key: 'current', field: 'currentPassword', placeholder: 'Contraseña Actual' },
                  { key: 'new', field: 'newPassword', placeholder: 'Nueva Contraseña' },
                  { key: 'confirm', field: 'confirmPassword', placeholder: 'Confirmar Nueva Contraseña' },
                ].map((item) => (
                  <div key={item.key} className="relative group">
                    <input 
                      type={showPasswords[item.key] ? 'text' : 'password'} 
                      placeholder={item.placeholder}
                      value={passwordForm[item.field]}
                      onChange={(e) => setPasswordForm(p => ({ ...p, [item.field]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(s => ({ ...s, [item.key]: !s[item.key] }))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                    >
                      {showPasswords[item.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleChangePassword} 
                disabled={savingPassword}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} />
                {savingPassword ? 'Procesando...' : 'Actualizar Credenciales'}
              </button>
            </div>
          ) : (
            <div className="p-8">
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Tus datos de acceso están protegidos con encriptación industrial.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}