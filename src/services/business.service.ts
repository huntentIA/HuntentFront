import httpClient from './api/httpClient'
import { BusinessesAccountResponse, BusinessUpdateData, BusinessUpdateResponse } from './interfaces/business-service'

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
      console.log(data)
      return data ? data : null
    } catch (error) {
      console.error('Error al obtener el negocio:', error)
      throw error
    }
  },
  updateBusiness: async (
    businessData: BusinessUpdateData
  ): Promise<BusinessUpdateResponse> => {
    try {
      const { data } = await httpClient.put<BusinessUpdateResponse>(
        `/api/businesses/${businessData.id}`,
        businessData
      );
      return data;
    } catch (error) {
      console.error('Error al actualizar el negocio:', error);
      throw error;
    }
  },
}

export default BussinessService
