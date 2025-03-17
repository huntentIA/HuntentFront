/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, EyeOff, Eye } from 'lucide-react'
import Testimonials from '../../shared/testimonials/testimonials'
import { RegisterRequest } from './interfaces/register'
import registerService from '../../../services/register.service'
import authService from '../../../services/auth.service'
import logo from '../../../assets/huntent-logo.webp'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'

// Interfaces
interface RegisterPageProps {
  isDarkMode: boolean
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
}

interface ToastProps {
  message: string
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => (
  <div className="font-roboto fixed bottom-5 right-5 rounded-lg bg-red-500 p-3 text-white shadow-lg transition-opacity duration-300">
    {message}
    <button onClick={onClose} className="ml-2 font-bold text-white">
      X
    </button>
  </div>
)

const Input: React.FC<InputProps> = ({ icon, ...props }) => (
  <div className="relative">
    <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
      {icon}
    </span>
    <input
      {...props}
      className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700"
    />
  </div>
)

const RegisterPage: React.FC<RegisterPageProps> = ({ isDarkMode}) => {
  const [formData, setFormData] = useState<RegisterRequest>({
    name: '',
    email: '',
    businessName: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError('')
    setShowToast(false)

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setShowToast(true)
      return
    }

    try {
      const response = await registerService.register(formData)
      if (response && response.id) {
        localStorage.setItem('authProvider', 'local')
        localStorage.setItem('userData', JSON.stringify(response))
        navigate('/knowledgeBaseForm')
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error en el registro')
      } else {
        setError('Error en el registro')
      }
      setShowToast(true)
    }
  }

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error('No se recibió credencial')
      }

      // Llamar al servicio de autenticación con Google
      const user = await authService.googleLogin(credentialResponse.credential)
      console.log('Google login successful:', user)

      localStorage.setItem('authProvider', 'google')
      localStorage.setItem('userData', JSON.stringify(user))
      navigate('/knowledgeBaseForm')
    } catch (error) {
      console.error('Error al iniciar sesión con Google:', error)
      setError('Error al iniciar sesión con Google')
      setShowToast(true)
    }
  }

  const handleCloseToast = (): void => {
    setShowToast(false)
  }

  return (
    <div
      className={`font-roboto flex min-h-screen flex-col lg:flex-row ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Lado izquierdo - Formulario */}
      <div className="flex w-full items-center justify-center bg-white p-4 md:p-8 lg:w-1/2 dark:bg-gray-800">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <img src={logo} alt="Logo" className="mb-4 h-8 w-auto" />
            <h1 className="font-telegraf text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
              Registrarse
            </h1>
            <p className="text-sm text-gray-600 md:text-base dark:text-gray-400">
              Comienza tu prueba gratuita de 7 días.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre*
              </label>
              <Input
                icon={<User className="h-5 w-5" />}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ingresa tu nombre"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Correo electrónico*
              </label>
              <Input
                icon={<Mail className="h-5 w-5" />}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ingresa tu correo electrónico"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contraseña*
              </label>
              <div className="relative">
                <Input
                  icon={<Lock className="h-5 w-5" />}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Crea una contraseña"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar Contraseña*
              </label>
              <div className="relative">
                <Input
                  icon={<Lock className="h-5 w-5" />}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirma tu contraseña"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-orange-500 py-2 text-white transition-colors hover:bg-orange-600"
            >
              Crear cuenta
            </button>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setError('Error al iniciar sesión con Google')
                  setShowToast(true)
                }}
                useOneTap
                theme={isDarkMode ? 'filled_black' : 'outline'}
                text="signup_with"
                locale="es"
                shape="rectangular"
                width="100%"
              />
            </div>
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/" className="text-orange-500 hover:text-orange-600">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Lado derecho - Testimonios */}
      <div className="w-full overflow-hidden bg-orange-50 p-4 md:p-8 lg:w-1/2 dark:bg-gray-900">
        <div className="h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-lg">
            <h2 className="font-telegraf sticky top-0 mb-6 bg-orange-50 py-2 text-xl font-bold text-gray-900 md:mb-8 md:text-2xl dark:bg-gray-900 dark:text-white">
              Lo que dicen nuestros usuarios
            </h2>
            <div className="space-y-4 pb-4 md:space-y-6">
              <Testimonials />
            </div>
          </div>
        </div>
      </div>
      {showToast && <Toast message={error || ''} onClose={handleCloseToast} />}
    </div>
  )
}

export default RegisterPage