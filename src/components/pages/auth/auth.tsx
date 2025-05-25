/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react'
import authService from '../../../services/auth.service'
import { LoginRequest, LoginResponse } from './interfaces/auth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Testimonials from '../../shared/testimonials/testimonials'
import { Link, useNavigate } from 'react-router-dom'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import logo from '../../../assets/huntent-logo.webp'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import BussinessService from '../../../services/business.service'

interface LoginPageProps {
  isAuthenticated: boolean
  onLogin: (user: LoginResponse) => void
  isDarkMode: boolean
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

const LoginPage: React.FC<LoginPageProps> = ({
  isAuthenticated,
  onLogin,
  isDarkMode,
}) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [showToast, setShowToast] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setShowToast(false)

    const LoginRequest: LoginRequest = {
      email,
      password,
    }

    try {
      const user = await authService.login(LoginRequest)
      try {
        localStorage.setItem('authProvider', 'local')
        const businesses = await BussinessService.getBusinessIdByUserId(
          user.id.toString()
        )

        if (!businesses || businesses.length === 0) {
          navigate('/knowledgeBaseForm')
        } else {
          onLogin(user)
          navigate('/referentSearch')
        }
      } catch (businessError: any) {
        console.error('Error fetching businesses:', businessError)
      }
    } catch (loginError: any) {
      console.error('Error al iniciar sesión:', loginError)

      if (
        loginError?.response?.data?.message?.includes('Continuar con Google')
      ) {
        setError(
          'Esta cuenta usa Google para iniciar sesión. Por favor, usa el botón "Continuar con Google".'
        )
      } else {
        setError('Usuario o contraseña incorrectos')
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

      try {
        localStorage.setItem('authProvider', 'google')
        const businesses = await BussinessService.getBusinessIdByUserId(
          user.id.toString()
        )

        if (!businesses || businesses.length === 0) {
          navigate('/knowledgeBaseForm')
        } else {
          onLogin(user)
          navigate('/referentSearch')
        }
      } catch (businessError: any) {
        console.error(
          'Google login - Error fetching businesses:',
          businessError
        )
      }
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
    <>
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
                Iniciar Sesión
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico*
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Ingresa tu correo electrónico"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña*
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link
                  to="/"
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-orange-500 py-2 text-white transition-colors hover:bg-orange-600"
              >
                Iniciar Sesión
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
                  text="continue_with"
                  locale="es"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </form>

            <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="text-orange-500 hover:text-orange-600"
              >
                Regístrate
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
      </div>
      {showToast && <Toast message={error || ''} onClose={handleCloseToast} />}
    </>
  )
}

export default LoginPage
