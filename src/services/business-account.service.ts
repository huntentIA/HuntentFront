import httpClient from './api/httpClient'
import {
  DeleteBussinessAccountResponse,
  getBusinessAccountsByIdResponse,
} from './interfaces/business-account-service'
import { BusinessesAccountResponse } from './interfaces/business-service'

const businessAccountService = {
  createBusinessAccount: async (
    businessId: string,
    accountId: string
  ): Promise<BusinessesAccountResponse> => {
    try {
      const response = await httpClient.post<BusinessesAccountResponse>(
        `/api/business_account`,
        { businessId, accountId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al crear la cuenta de negocios', error)
      throw new Error('Error desconocido al crear la cuenta de negocios')
    }
  },

  getAccountByBusinessId: async (
    businessId: string
  ): Promise<getBusinessAccountsByIdResponse> => {
    try {
      const response = await httpClient.get<getBusinessAccountsByIdResponse>(
        `/api/business_account`,
        {
          params: {
            businessId,
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener la cuenta de negocios', error)
      throw new Error('Error desconocido al obtener la cuenta de negocios')
    }
  },

  getAccountByBusinessIdAndAccountId: async (
    businessId: string,
    accountId: string
  ): Promise<getBusinessAccountsByIdResponse> => {
    try {
      const response = await httpClient.get<getBusinessAccountsByIdResponse>(
        `/api/business_account`,
        {
          params: {
            businessId,
            accountId,
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener la cuenta de negocios', error)
      throw error // Propagar errores reales para que sean manejados apropiadamente
    }
  },

  deleteAccountById: async (
    accountId: string
  ): Promise<DeleteBussinessAccountResponse> => {
    try {
      const response = await httpClient.delete<DeleteBussinessAccountResponse>(
        `/api/business_account/${accountId}`
      )
      console.log(response.data)
      return response.data
    } catch (error) {
      console.error('Error al eliminar la cuenta de negocios', error)
      throw new Error('Error desconocido al eliminar la cuenta de negocios')
    }
  },
}

export default businessAccountService
