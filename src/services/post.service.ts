import { PublicationBasicData } from './interfaces/referent-search-service'
import httpClient from './api/httpClient'
import { Post } from '../components/pages/content-planner/interfaces/content-planner'

// Interfaces para tipado

interface ApiResponse {
  success: boolean
  message: string
  data: {
    [key: string]: unknown
  }
}

interface PostQueryParams {
  account_id?: string
  account_ids?: string | string[]
  account_name?: string
  limit?: string
  page_number?: string
  page_token?: string
  prev_token?: string
  is_prev_page?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  min_date?: string 
  max_date?: string 
  status?: string
  content_format?: string
  creator_account?: string
  creator_accounts?: string[] 
  publication_date_start?: string 
  publication_date_end?: string
}

interface GetPostResponse {
  items: Post[]
  count: number
  total_items: number 
  next_page_token: string | null 
  prev_page_token: string | null 
  current_token: string 
  total_pages: number
  page_number: number 
  items_per_page: number 
  has_more: boolean 
}

const accessToken = import.meta.env.VITE_APP_INSTAGRAM_ACCESS_TOKEN

const postService = {
  /**
   * Crea una nueva publicación
   * @param accountId ID de la cuenta
   * @param publication Datos de la publicación
   */
  createPost: async (
    accountId: string,
    publication: PublicationBasicData[]
  ): Promise<ApiResponse> => {
    try {
      const { data } = await httpClient.post<ApiResponse>(
        `/api/posts?account_id=${accountId}`,
        publication,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return data
    } catch (error) {
      console.error('Error al crear la publicación:', error)
      throw error
    }
  },

  /**
   * Obtiene las publicaciones por nombre de cuenta
   * @param account_name Nombre de la cuenta
   */
  getPostsByAccountName: async (
    account_name: string
  ): Promise<GetPostResponse> => {
    try {
      const { data } = await httpClient.get<GetPostResponse>(
        `/api/posts?account_name=${encodeURIComponent(account_name)}`
      )
      return data
    } catch (error) {
      console.error('Error al obtener las publicaciones por nombre:', error)
      throw error
    }
  },

  /**
   * Obtiene publicaciones con filtros avanzados
   * @param params Parámetros de consulta
   */
  getPosts: async (params: PostQueryParams = {}): Promise<GetPostResponse> => {
    try {
      // Construir query params
      const queryParams = new URLSearchParams()
  
      if (params.account_id) queryParams.append('account_id', params.account_id)
  
      if (params.account_ids) {
        const accountIds = Array.isArray(params.account_ids)
          ? params.account_ids.join(',')
          : params.account_ids
        queryParams.append('account_ids', accountIds)
      }

      if (params.creator_accounts && params.creator_accounts.length > 0) {
        const creatorsAccounts = Array.isArray(params.creator_accounts)
          ? params.creator_accounts.join(',')
          : params.creator_accounts
        queryParams.append('creator_accounts', creatorsAccounts)
      }
  
      if (params.account_name)
        queryParams.append('account_name', params.account_name)
  
      if (params.limit) queryParams.append('limit', params.limit.toString())
  
      if (params.page_number)
        queryParams.append('page_number', params.page_number.toString())
  
      if (params.page_token) queryParams.append('page_token', params.page_token)
  
      if (params.prev_token) queryParams.append('prev_token', params.prev_token)
  
      if (params.is_prev_page)
        queryParams.append('is_prev_page', params.is_prev_page.toString())
  
      if (params.sort_by) queryParams.append('sort_by', params.sort_by)
  
      if (params.sort_order) queryParams.append('sort_order', params.sort_order)
  
      if (params.min_date) queryParams.append('min_date', params.min_date)
      if (params.max_date) queryParams.append('max_date', params.max_date)
      
      if (params.min_date) 
        queryParams.append('min_date', params.min_date)

      if (params.publication_date_end) 
        queryParams.append('publication_date_end', params.publication_date_end)
  
      if (params.status) queryParams.append('status', params.status)
  
      if (params.content_format)
        queryParams.append('content_format', params.content_format)
  
      if (params.creator_account)
        queryParams.append('creator_account', params.creator_account)
        
      const url = `/api/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      const { data } = await httpClient.get<GetPostResponse>(url)
      return data
    } catch (error) {
      console.error('Error al obtener las publicaciones con filtros:', error)
      throw error
    }
  },

  /**
   * Avanza a la siguiente página de resultados
   * @param currentResponse La respuesta actual de getPosts
   * @param additionalParams Parámetros adicionales opcionales
   */
  getNextPage: async (
    currentResponse: GetPostResponse,
    additionalParams: Omit<
      PostQueryParams,
      'page_token' | 'prev_token' | 'is_prev_page'
    > = {}
  ): Promise<GetPostResponse> => {
    if (!currentResponse.next_page_token) {
      throw new Error('No hay más páginas disponibles')
    }

    return postService.getPosts({
      ...additionalParams,
      page_token: currentResponse.next_page_token,
      prev_token: currentResponse.current_token, // Guardamos el token actual como prev_token
    })
  },

  /**
   * Retrocede a la página anterior de resultados
   * @param currentResponse La respuesta actual de getPosts
   * @param additionalParams Parámetros adicionales opcionales
   */
  getPreviousPage: async (
    currentResponse: GetPostResponse,
    additionalParams: Omit<
      PostQueryParams,
      'page_token' | 'prev_token' | 'is_prev_page'
    > = {}
  ): Promise<GetPostResponse> => {
    if (!currentResponse.prev_page_token) {
      throw new Error('No hay página anterior disponible')
    }

    return postService.getPosts({
      ...additionalParams,
      prev_token: currentResponse.prev_page_token,
      is_prev_page: true, // Indicamos que estamos navegando hacia atrás
    })
  },

  /**
   * Obtiene una publicación por su ID
   * @param id ID de la publicación
   */
  getPostById: async (id: string): Promise<Post> => {
    try {
      const { data } = await httpClient.get<Post>(`/api/posts/${id}`)
      return data
    } catch (error) {
      console.error(`Error al obtener la publicación con ID ${id}:`, error)
      throw error
    }
  },

  /**
   * Actualiza el estado de una publicación
   * @param postId ID de la publicación
   * @param newStatus Nuevo estado
   * @param postData Datos adicionales para actualizar (opcional)
   */
  updatePostStatus: async (
    postId: string,
    newStatus: string,
    postData?: Partial<Post>
  ): Promise<Post> => {
    try {
      const { data } = await httpClient.put<Post>(`/api/posts/${postId}`, {
        status: newStatus,
        ...postData,
      })
      return data
    } catch (error) {
      console.error(`Error al actualizar el estado del post ${postId}:`, error)
      throw error
    }
  },

  /**
   * Genera un reporte Excel de las publicaciones
   * @param accountIds IDs de las cuentas
   * @returns Blob con el contenido del archivo Excel
   */
  generateExcelReport: async (accountIds: string[]): Promise<Blob> => {
    try {
      const accountIdsString = accountIds.join(',')
      const { data } = await httpClient.get(`/api/posts?report=excel&account_ids=${accountIdsString}`, {
        responseType: 'blob'
      })
      return data as Blob
    } catch (error) {
      console.error('Error al generar el reporte Excel:', error)
      throw error
    }
  },

  updatePost: async (updatePost: UpdatePost): Promise<Post> => {
    try {
      const { data } = await httpClient.put<Post>(`/api/posts?specific=true`, updatePost)
      return data
    } catch (error) {
      console.error(`Error al actualizar la publicación ${updatePost.publication_id}:`, error)
      throw error
    }
  },

  getPost: async (postId: string, creatorAccount: string): Promise<UpdatePost> => {
    try {
      const { data } = await httpClient.get<UpdatePost>(`/meta/specific-post?publication_id=${postId}&instagram_account=${creatorAccount}&token=${accessToken}`)
      return data
    } catch (error) {
      console.error(`Error al obtener la publicación ${postId}:`, error)
      throw error
    }
  }
}

export default postService
