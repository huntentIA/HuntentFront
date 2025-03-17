import {
  RegisterRequest,
  RegisterResponse,
  BusinessRegisterRequest,
  BusinessRegisterResponse,
} from '../components/pages/register/interfaces/register'
import httpClient from './api/httpClient'

const registerService = {
  // Registrar usuario
  register: async (formData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const { data } = await httpClient.post<RegisterResponse>(
        '/api/users',
        formData
      )
      return data
    } catch (error) {
      console.error('Error en el registro:', error)
      throw error
    }
  },

  // Registrar negocio
  businessRegister: async (
    formData: BusinessRegisterRequest
  ): Promise<BusinessRegisterResponse> => {
    try {
      const { data } = await httpClient.post<BusinessRegisterResponse>(
        '/api/businesses',
        formData
      )
      return data
    } catch (error) {
      console.error('Error en el registro del negocio:', error)
      throw error
    }
  },
}

export default registerService
