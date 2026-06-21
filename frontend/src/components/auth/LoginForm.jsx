import { useState } from 'react'
import { LogIn } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export default function LoginForm({ onSubmit, onSwitchToRegister, loading }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingrese un correo electrónico válido'
    }
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit?.({
      email: formData.email,
      password: formData.password,
    })
  }

  function handleSwitch(e) {
    e?.preventDefault()
    onSwitchToRegister?.()
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <Input
        type="email"
        name="email"
        label="Correo electrónico"
        placeholder="tucorreo@ejemplo.com"
        value={formData.email}
        onChange={(value) => handleChange('email', value)}
        error={errors.email}
      />

      <Input
        type="password"
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        value={formData.password}
        onChange={(value) => handleChange('password', value)}
        error={errors.password}
      />



      <Button type="submit" loading={loading} className="mt-3 flex items-center justify-center gap-2">
        <LogIn size={20} className="stroke-white" />
        <span>Iniciar Sesión</span>
      </Button>

      <div className="text-center font-body text-sm text-gray-500 mt-2">
        ¿No tienes una cuenta?{' '}
        <button 
          type="button"
          onClick={handleSwitch}
          className="text-[#001c53] font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-[#003091]/20 rounded"
        >
          Regístrate
        </button>
      </div>
    </form>
  )
}