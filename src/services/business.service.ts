import httpClient from './api/httpClient'
import { BusinessesAccountResponse } from './interfaces/business-service'

const BussinessService = {
  getBusinessIdByUserId: async (
    userId: string
  ): Promise<BusinessesAccountResponse | null> => {
    try {
      const { data } = await httpClient.get<BusinessesAccountResponse>(
        `/api/businesses`,
        {
          params: {
            user_id: userId,
          },
        }
      )
      if (!data) {
        return null
      }
      return data ? data : null
    } catch (error) {
      console.error('Error al obtener el negocio:', error)
      throw error
    }
  },
}

export default BussinessService
