import httpClient from './api/httpClient'
import {
  LoginRequest,
  LoginResponse,
} from '../components/pages/auth/interfaces/auth'
import { setItem } from '../utils/storage'

const authService = {
  // Iniciar sesión
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const { data } = await httpClient.post<LoginResponse>(
        '/api/login',
        credentials
      )

      // Guarda el usuario en localStorage
      setItem('userData', data)

      return data
    } catch (error) {
      console.error('Error en el login:', error)
      throw error
    }
  },  

  googleLogin: async (token: string): Promise<LoginResponse> => {
    try {
      const { data } = await httpClient.post<LoginResponse>(
        '/api/login/google',
        { token }
      )

      // Guarda el usuario en localStorage
      setItem('userData', data)

      return data
    } catch (error) {
      console.error('Error en el login con Google:', error)
      throw error
    }
  },
}

export default authService
