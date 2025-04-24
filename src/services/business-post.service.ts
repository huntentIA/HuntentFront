import httpClient from './api/httpClient'
import { BusinessPostQueryParams, BusinessPostResponse, GetPostResponse, BusinessPostDataCreate, UpdateContentAdapter, ApiResponse, ContentAnalysisData } from './interfaces/business-post-service'

const BusinessPostService = {
    createBusinessPost: async (businessPostData: BusinessPostDataCreate): Promise<BusinessPostResponse> => {
        try {
            const { data} = await httpClient.post<BusinessPostResponse>('/api/business_post', businessPostData)
            return data
        } catch (error) {
            console.error('Error al crear la publicación del negocio:', error)
            throw error
        }
    },

    getBusinessPost: async (params: BusinessPostQueryParams = {}): Promise<GetPostResponse> => {
        try {
            const queryParams = new URLSearchParams()

            if (params.businessId) queryParams.append('businessId', params.businessId)

            if (params.limit) queryParams.append('limit', params.limit)

            if (params.page_number) queryParams.append('page_number', params.page_number)

            if (params.page_token) queryParams.append('page_token', params.page_token)

            if (params.prev_token) queryParams.append('prev_token', params.prev_token)

            if (params.is_prev_page) queryParams.append('is_prev_page', params.is_prev_page.toString())

            if (params.sort_by) queryParams.append('sort_by', params.sort_by)

            if (params.sort_order) queryParams.append('sort_order', params.sort_order)

            if (params.min_date) queryParams.append('min_date', params.min_date)

            if (params.max_date) queryParams.append('max_date', params.max_date)

            if (params.content_format) queryParams.append('content_format', params.content_format)

            if (params.creator_account) queryParams.append('creator_account', params.creator_account)

            if (params.creator_accounts) queryParams.append('creator_accounts', params.creator_accounts.join(','))

            if (params.publication_date_start) queryParams.append('publication_date_start', params.publication_date_start)

            if (params.publication_date_end) queryParams.append('publication_date_end', params.publication_date_end)

            const url = `/api/business_post${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

            const { data } = await httpClient.get<GetPostResponse>(url)

            return data
        } catch (error) {
            console.error('Error al obtener las publicaciones del negocio:', error)
            throw error
        }
    },
    updateContentAdapter: async (businessPostId: string, data: UpdateContentAdapter) : Promise<ApiResponse> => {
        try {
            const response = await httpClient.put<ApiResponse>(`/api/business_post/${businessPostId}/content_adapter?method=content_adapter`, data)
            return response.data
        } catch (error) {
            console.error('Error al actualizar el adaptador de contenido:', error)
            throw error
        }
    },
    contentAnalysis: async (businessPostId: string, data: ContentAnalysisData) : Promise<ApiResponse> => {
        try {
            const response = await httpClient.put<ApiResponse>(`/api/business_post/${businessPostId}/content_analysis?method=content_analysis`, data)
            return response.data
        } catch (error) {
            console.error('Error al analizar el contenido:', error)
            throw error
        }
    },
    generateExcelReport: async (businessId: string): Promise<Blob> => {
        try {
          const { data } = await httpClient.get(`/api/business_post?report=excel&businessId=${businessId}`, {
            responseType: 'blob'
          })
          return data as Blob
        } catch (error) {
          console.error('Error al generar el reporte Excel:', error)
          throw error
        }
      },
}

export default BusinessPostService
