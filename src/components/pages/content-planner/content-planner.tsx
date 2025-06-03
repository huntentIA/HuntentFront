import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Eye,
  Video,
  Info,
} from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Post,
  PostQueryParams,
  SortConfig,
} from './interfaces/content-planner'
import PostModal from '../../shared/post-modal/postModal'
import postService from '../../../services/post.service'
import businessAccountService from '../../../services/business-account.service'
import BussinessService from '../../../services/business.service'
import { getBusinessAccountsByIdResponse } from '../../../services/interfaces/business-account-service'
import CustomMultiSelect from '../../shared/multiselect/multiselect'
import { tooltipDescriptions } from '../../../utils/toolDescriptions'
import { BusinessPostDataCreate } from '../../../services/interfaces/business-post-service'
import businessPostService from '../../../services/business-post.service'

interface UserData {
  id: string
  // Otros campos de usuario
}

interface ContentPlannerProps {
  isDarkMode: boolean
}

export const ContentPlanner: React.FC<ContentPlannerProps> = ({
  isDarkMode,
}) => {
  // Obtener datos de navegación (si proviene de user-account)
  const location = useLocation()
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // States for filters and configuration
  const [mediaType, setMediaType] = useState<string>('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'creatorAccount',
    direction: 'desc',
  })

  // States for data and pagination
  const [posts, setPosts] = useState<Post[]>([])
  const [businessId, setBusinessId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postsPerPage] = useState<number>(10)
  const [accountIds, setAccountIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [loadingPrevPage, setLoadingPrevPage] = useState<boolean>(false)
  const [loadingNextPage, setLoadingNextPage] = useState<boolean>(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([])
 /*  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  }) */

  /* const [confirmedDateRange, setConfirmedDateRange] = useState({
    startDate: '',
    endDate: '',
  }) */

  //const [showApplyButton, setShowApplyButton] = useState(false)
  const [refreshingPosts, setRefreshingPosts] = useState<{ [key: string]: boolean }>({})

  const columnNames = {
    contentFormat: 'Formato del Contenido',
    creatorAccount: 'Creador',
    likes: 'Me gusta',
    comments: 'Comentarios',
    totalInteractions: 'Interacciones Totales',
    postEngagement: 'Post Engagement',
    outliers: 'Outliers',
    publicationDate: 'Fecha de Publicación',
  }

  // Cargar los accountIds al inicio
  useEffect(() => {
    const fetchAccountIds = async () => {
      try {
        const ids = await getAccountIds()
        if (ids && ids.length > 0) {
          setAccountIds(ids)
          setInitialLoadComplete(true)
        }
      } catch (error) {
        console.error('Error fetching account IDs:', error)
        toast.error('Error obteniendo las cuentas de usuario')
        setInitialLoadComplete(true)
      }
    }

    fetchAccountIds()
  }, [])

  // Function to get account IDs
  const getAccountIds = async (): Promise<string[]> => {
    try {
      const userDataString = localStorage.getItem('userData')
      if (!userDataString) {
        console.error('User data not found in localStorage')
        return []
      }

      const user: UserData = JSON.parse(userDataString)
      const userId = user.id

      const businessResponse =
        await BussinessService.getBusinessIdByUserId(userId)

      if (!businessResponse || businessResponse.length === 0) {
        console.error('No business found for user')
        return []
      }

      const businessId = businessResponse[0].id
      setBusinessId(businessId)
      const data: getBusinessAccountsByIdResponse =
        await businessAccountService.getAccountByBusinessId(businessId)

      if (!data || !data.accounts) {
        return []
      }

      setBusinessAccounts(data.accounts)

      return data.accounts
        .map((account) => account.id)
        .filter((id): id is string => id !== undefined && id !== null)
    } catch (err) {
      console.error('Error fetching accounts:', err)
      return []
    }
  }

  // Efecto para manejar la selección de cuenta desde user-account
  // Se ejecuta después de la carga inicial
  useEffect(() => {
    if (initialLoadComplete && location.state && location.state.selectedCreator) {
      setSelectedUsers([location.state.selectedCreator])
    }
  }, [location.state, initialLoadComplete])

  // Efecto para cargar publicaciones cuando cambien los filtros
  useEffect(() => {
    if (accountIds.length > 0 && initialLoadComplete) {
      // verificamos que exista en la lista de cuentas
      if (location.state?.selectedCreator && businessAccounts.length > 0) {
        const creatorExists = businessAccounts.some(
          account => account.accountName === location.state.selectedCreator
        )
        
        // Si el creador no existe en las cuentas disponibles, limpiamos el filtro
        if (!creatorExists) {
          setSelectedUsers([])
          
          // Y actualizamos el estado de navegación
          const newState = { ...location.state }
          delete newState.selectedCreator
          window.history.replaceState(newState, '')
        }
      }
      
      setCurrentPage(1)
      loadPosts(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mediaType,
    selectedUsers,
    sortConfig,
    accountIds,
    initialLoadComplete,
  ])

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      if (newPage > currentPage) {
        setLoadingNextPage(true);
      } else {
        setLoadingPrevPage(true);
      }
      loadPosts(newPage);
    }
  }

  const buildQueryParams = (page = currentPage) => {
    const params: PostQueryParams = {
      limit: postsPerPage.toString(),
      page_number: page.toString(),
      account_ids: accountIds,
      sort_by: sortConfig.key,
      sort_order: sortConfig.direction,
    }

    if (page > 1 && nextPageToken && page > currentPage) {
      params.page_token = nextPageToken
      params.prev_token = currentToken ?? undefined
    } else if (page < currentPage && prevPageToken) {
      params.prev_token = prevPageToken
      params.is_prev_page = true
    }

    if (mediaType) params.content_format = mediaType
    
    // Asegurarnos de aplicar el filtro de usuarios seleccionados
    // incluyendo el que viene por navegación si está presente
    const effectiveSelectedUsers = selectedUsers.length > 0 
      ? selectedUsers 
      : (location.state?.selectedCreator ? [location.state.selectedCreator] : [])
    
    if (effectiveSelectedUsers.length > 0) {
      params.creator_accounts = effectiveSelectedUsers
    }

    return params
  }

  const loadPosts = async (page: number = currentPage) => {
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      // Obtener posts que ya están aprobados o rechazados para este negocio
      const processedPostsResponse = await businessPostService.getBusinessPost({
        businessId: businessId,
        sort_by: 'creatorAccount',
        sort_order: 'desc',
        status: ['APPROVED', 'REJECTED'],
      });

      // Crear lista de IDs de posts que ya fueron procesados
      const processedPostIds = processedPostsResponse?.items?.map(item => item.id) || [];

      const params = buildQueryParams(page)
      const response = await postService.getPosts(params)

      if (!response.items) {
        throw new Error('No items returned from API')
      }

      // Filtrar posts para no mostrar los que ya están aprobados o rechazados
      const filteredPosts = response.items.filter(post => 
        !processedPostIds.includes(post.id)
      );

      setPosts(filteredPosts)
      
      // Si todos los posts fueron filtrados pero había posts originalmente,
      // mostrar un mensaje informativo
      if (filteredPosts.length === 0 && response.items.length > 0) {
        toast.info('Todas las publicaciones ya han sido procesadas (aprobadas o rechazadas).')
      }
      
      setTotalItems(response.total_items || 0)
      setTotalPages(response.total_pages || 1)
      setCurrentPage(response.page_number || 1)

      setNextPageToken(response.next_page_token)
      setPrevPageToken(response.prev_page_token)
      setCurrentToken(response.current_token)
    } catch (error) {
      console.error('Error loading posts:', error)
      setError('Error loading posts. Please try again.')
      toast.error('Error cargando publicaciones')
      setPosts([])
      setTotalItems(0)
    } finally {
      setLoading(false)
      setLoadingPrevPage(false)
      setLoadingNextPage(false)
    }
  }

  // Función para manejar la aprobación o rechazo de un post
  const handleApproval = async (postId: string, status: string, publicationDate: Date) => {
    setLoading(true)
    try {
      const currentPost = posts.find(post => post.id === postId)
      const newStatus = status === 'approved' ? 'APPROVED' : 'REJECTED'
      const businessPostData: BusinessPostDataCreate = {
        postId: postId,
        businessId: businessId,
        publicationDate: publicationDate,
        status: newStatus,
        contentFormat: currentPost?.contentFormat || '',
      }

      const success = await businessPostService.createBusinessPost(businessPostData)
      if (success) {
        toast.success(
          `El post ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'}.`
        )
        await loadPosts(currentPage)
      } else {
        toast.error(
          `No se pudo ${status === 'approved' ? 'aprobar' : 'rechazar'} el post.`
        )
      }
    } catch (error) {
      console.error(
        `Error al ${status === 'approved' ? 'aprobar' : 'rechazar'} el post:`,
        error
      )
      toast.error(
        `Error al ${status === 'approved' ? 'aprobar' : 'rechazar'} el post.`
      )
    } finally {
      setLoading(false)
    }
  }

  // Modal handling functions
  const openPostModal = (post: Post) => {
    setSelectedPost(post)
  }

  const closePostModal = () => {
    setSelectedPost(null)
  }

  // Filter change handlers
  const handleMediaTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMediaType(e.target.value)
  }

  const handleUserChange = (event: {
    target: { options: { value: string; selected: boolean }[]; value: string[] }
  }) => {
    const options = event.target.options
    const selectedValues: string[] = []

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value)
      }
    }

    // Si estamos recibiendo un arreglo vacío y hay un creador seleccionado en la navegación,
    // preservamos ese creador
    if (selectedValues.length === 0 && location.state?.selectedCreator) {
      setSelectedUsers([location.state.selectedCreator])
    } else {
      setSelectedUsers(selectedValues)
      
      // Si el usuario está cambiando manualmente el filtro, actualizamos el estado de navegación
      // para mantener consistencia si se recarga la página
      if (location.state?.selectedCreator && !selectedValues.includes(location.state.selectedCreator)) {
        // Crear un nuevo objeto de estado sin el selectedCreator
        const newState = { ...location.state }
        delete newState.selectedCreator
        // Reemplazar el estado actual de navegación
        window.history.replaceState(newState, '')
      }
    }
  }

 /*  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    setDateRange(prev => ({
      ...prev,
      [name]: value
    }))

    const newDateRange = {
      ...dateRange,
      [name]: value
    } 
    
    setShowApplyButton(!!newDateRange.startDate && !!newDateRange.endDate)
  } */

/*   const applyDateFilter = () => {
    if (dateRange.startDate && dateRange.endDate) {
      if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
        toast.warning('La fecha inicial no puede ser posterior a la fecha final')
        return
      }
      
      setConfirmedDateRange(dateRange)
      setShowApplyButton(false)
      toast.success('Filtro de fechas aplicado')
    } else {
      toast.warning('Por favor ingrese ambas fechas para filtrar')
    }
  } */

/*   const clearDateFilter = () => {
    const emptyDates = {
      startDate: '',
      endDate: ''
    }
    setDateRange(emptyDates)
    setConfirmedDateRange(emptyDates)
    setShowApplyButton(false)
    toast.info('Filtro de fechas eliminado')
  } */

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Function to get sort icon
  const getSortIcon = (columnName: string) => {
    if (sortConfig.key === columnName) {
      return sortConfig.direction === 'asc' ? (
        <ChevronUp size={14} className={`${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
      ) : (
        <ChevronDown size={14} className={`${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
      )
    }
    // Mostrar un icono gris más claro cuando la columna no está ordenada
    return <ChevronDown size={14} className={`opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />;
  }
  const getFormattedTooltip = (column: string) => {
    const tooltip =
      tooltipDescriptions[column as keyof typeof tooltipDescriptions]

    if (typeof tooltip === 'object' && tooltip.main) {
      return (
        <div>
          <p>{tooltip.main}</p>
          <p className="mt-1 italic text-gray-500 dark:text-gray-400">
            {tooltip.example}
          </p>
        </div>
      )
    }

    return <p>{tooltip as string}</p>
  }

  const handleRefreshPost = async (post: Post) => {
    // Prevenir múltiples refrescos simultáneos del mismo post
    if (refreshingPosts[post.id]) {
      toast.info('Ya se está actualizando esta publicación')
      return
    }

    setRefreshingPosts(prev => ({ ...prev, [post.id]: true }))
    
    try {
      // Obtener datos actualizados del post
      const updatedPostData = await postService.getPost(post.creatorAccount, post.publication_id)
      
      if (!updatedPostData) {
        throw new Error('No se pudieron obtener los datos actualizados')
      }

      // Validar que los datos necesarios estén presentes
      if (!updatedPostData.media_type || !updatedPostData.creation_date_and_time) {
        throw new Error('Datos incompletos en la respuesta')
      }

      const updatedPost: UpdatePost = {
        id: post.id,
        owner_account: post.creatorAccount,
        publication_id: post.publication_id,
        description: updatedPostData.description || '',
        media_type: updatedPostData.media_type,
        instagram_media_type: updatedPostData.media_type,
        creation_date_and_time: updatedPostData.creation_date_and_time,
        comments_count: updatedPostData.comments_count || 0,
        likes_count: updatedPostData.likes_count || 0,
        interactions_count: updatedPostData.interactions_count || 0,
        permalink: updatedPostData.permalink || '',
        hash_tags: updatedPostData.hash_tags || [],
        media_url: updatedPostData.media_url || ''
      }

      // Actualizar el post en la base de datos
      const updateSuccess = await postService.updatePost(updatedPost)
      
      if (!updateSuccess) {
        throw new Error('Error al guardar los datos actualizados')
      }

      toast.success('Publicación actualizada correctamente')
      
      // Recargar la lista de posts
      await loadPosts(currentPage)
    } catch (error) {
      console.error('Error al actualizar la publicación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al actualizar la publicación: ${errorMessage}`)
    } finally {
      // Limpiar el estado de refresco
      setRefreshingPosts(prev => ({ ...prev, [post.id]: false }))
    }
  }

  // Agregar el event listener para el botón de refrescar
  useEffect(() => {
    const handleRefreshPostEvent = (event: CustomEvent) => {
      const postId = event.detail
      const postToRefresh = posts.find(p => p.id === postId)
      if (postToRefresh) {
        handleRefreshPost(postToRefresh)
      }
    }

    document.addEventListener('refreshPost', handleRefreshPostEvent as EventListener)
    return () => {
      document.removeEventListener('refreshPost', handleRefreshPostEvent as EventListener)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts])

  /* Componente de refresco temporalmente deshabilitado
  const RefreshButton = ({ postId, isRefreshing }: { postId: string; isRefreshing: boolean }) => {
    const handleClick = () => {
      document.dispatchEvent(new CustomEvent('refreshPost', { detail: postId }))
    }

    return (
      <div className="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
        <button 
          className={`p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors ${
            isRefreshing ? 'opacity-75 cursor-not-allowed' : ''
          }`}
          onClick={handleClick}
          disabled={isRefreshing}
          title={isRefreshing ? 'Actualizando...' : 'Actualizar publicación'}
        >
          <svg 
            className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} 
            viewBox="0 0 24 24"
          >
            <path 
              fill="currentColor" 
              d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
            />
          </svg>
        </button>
      </div>
    )
  } */

  if (loading && posts.length === 0) {
    return <div>Cargando...</div>
  }

  if (error && posts.length === 0) {
    return <div>Error: {error}</div>
  }

  return (
    <div
    className={`p-4 md:p-6 ${
      isDarkMode
        ? 'bg-gray-900 text-gray-100'
        : 'bg-gradient-to-br from-orange-50 via-white to-orange-50 text-gray-900'
    } h-auto w-full min-h-screen`}
    >
      <h1 className="mb-8 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-center text-4xl font-bold text-transparent">
        Cazador de Contenido
      </h1>

      {/* Total de publicaciones */}
      <div className={`mb-6 flex justify-start w-60 inline-block rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      } px-4 py-2 shadow-sm`}>
        <p className={`text-md font-medium ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Total publicaciones: <span className="font-bold text-orange-500">{totalItems}</span>
        </p>
      </div>

      {/* Filtros - Sección completa rediseñada */}
      <div className="mb-6 flex flex-wrap items-start gap-4">
        {/* Filtro por tipo de publicación */}
        <div className="w-64">
          <select
            value={mediaType}
            onChange={handleMediaTypeChange}
            className={`w-full rounded-md p-2 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            } border focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-orange-200'}`}
          >
            <option value="" className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''}>Todos los tipos de publicación</option>
            <option value="IMAGE" className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''}>Imagen</option>
            <option value="VIDEO" className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''}>Video</option>
            <option value="CAROUSEL_ALBUM" className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''}>Carrusel</option>
          </select>
        </div>

        {/* Filtro por usuario */}
        <div className="w-64">
          <CustomMultiSelect
            selectedUsers={selectedUsers}
            handleUserChange={handleUserChange}
            businessAccounts={businessAccounts}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Fecha inicial */}
        {/* <div className="w-64">
          <div className="relative">
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              placeholder="dd/mm/aaaa"
              className={`w-full rounded-md p-2 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              } border focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-orange-200'}`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div> */}

        {/* Fecha final */}
        {/* <div className="w-64">
          <div className="relative">
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              placeholder="dd/mm/aaaa"
              className={`w-full rounded-md p-2 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400'
              } border focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-gray-600' : 'focus:ring-orange-200'}`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div> */}
        
        {/* Botones para aplicar/limpiar filtro */}
        {/* <div className="flex items-center space-x-2">
          {showApplyButton && (
            <button
              onClick={applyDateFilter}
              className={`rounded-md px-4 py-2 text-sm ${
                isDarkMode
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              } transition-colors`}
            >
              Aplicar filtro
            </button>
          )}
          {(confirmedDateRange.startDate || confirmedDateRange.endDate) && (
            <button
              onClick={clearDateFilter}
              className={`rounded-md px-4 py-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              } transition-colors`}
            >
              Limpiar
            </button>
          )}
        </div> */}
      </div>

      {/* Mensaje de filtro activo */}
      {/* {confirmedDateRange.startDate && confirmedDateRange.endDate && (
        <div className={`mb-4 text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
          Filtro de fechas activo: {new Date(confirmedDateRange.startDate).toLocaleDateString()} - {new Date(confirmedDateRange.endDate).toLocaleDateString()}
        </div>
      )} */}

      <div className="overflow-x-auto">
        <table
          className={`min-w-full ${
            isDarkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-900'
          } rounded-lg shadow-md`}
        >
          <thead className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider">
                <div
                  className={`rounded-md p-2 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}
                >
                  Vista Previa
                </div>
              </th>
              {[
                'contentFormat',
                'creatorAccount',
                'likes',
                'comments',
                'totalInteractions',
                'postEngagement',
                'outliers',
                'publicationDate',
              ].map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-medium tracking-wider"
                >
                  <div
                    className={`rounded-md p-2 ${
                      isDarkMode
                        ? 'bg-gray-800 text-gray-300'
                        : 'bg-white text-gray-700'
                    } group relative flex items-center justify-between`}
                  >
                    <div className="flex items-center">
                      <span>
                        {columnNames[column as keyof typeof columnNames]}
                      </span>
                      <div className="group relative ml-2">
                        <Info className="h-4 w-4 cursor-help text-gray-500 hover:text-gray-300 dark:text-gray-400 dark:hover:text-gray-300" />
                        <div className="invisible absolute left-0 top-full z-10 mt-2 w-72 -translate-x-1/2 transform rounded-md bg-white text-left text-xs opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:bg-gray-800">
                          <div className="rounded-md border border-gray-200 bg-white p-3 text-gray-700 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-8 border-x-transparent border-b-white dark:border-b-gray-800"></div>
                            {getFormattedTooltip(column)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => requestSort(column)}
                      className={`ml-2 p-1 rounded-full hover:bg-opacity-20 ${
                        isDarkMode 
                          ? 'bg-gray-800/40 border border-gray-700 hover:bg-gray-700/80 text-gray-300 hover:text-gray-100' 
                          : 'hover:bg-orange-500 text-gray-700'
                      } transition-colors`}
                    >
                      {getSortIcon(column)}
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider">
                <div
                  className={`rounded-md p-2 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}
                >
                  Acciones
                </div>
              </th>
            </tr>
          </thead>
          <tbody
            className={`${
              isDarkMode
                ? 'divide-y divide-gray-700 bg-gray-900'
                : 'divide-y divide-gray-200'
            }`}
          >
            {posts && posts.length > 0 ? (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className={`${
                    isDarkMode ? 'hover:bg-gray-800 border-gray-700'  : 'hover:bg-gray-50'
                  } border-b`}
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.contentFormat === 'IMAGE' && (
                      <div className="relative h-16 w-16">
                        <img
                          src={post.mediaURL || 'https://via.placeholder.com/150'}
                          alt="Content preview"
                          className="h-16 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            const element = e.target as HTMLElement
                            element.style.display = 'none'
                            const container = element.parentElement
                            if (container) {
                              /* Código del botón de refresco temporalmente deshabilitado
                              const refreshButton = document.createElement('div')
                              refreshButton.innerHTML = ReactDOMServer.renderToString(
                                <RefreshButton postId={post.id} isRefreshing={refreshingPosts[post.id]} />
                              )
                              container.appendChild(refreshButton)
                              */
                              // Mostrar un placeholder simple en lugar del botón de refresco
                              container.innerHTML = `
                                <div class="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                                  <span class="text-gray-500">Sin imagen</span>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                    )}
                    {post.contentFormat === 'VIDEO' && (
                      <div className="relative h-16 w-16">
                        <video
                          src={post.mediaURL}
                          className="h-16 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                          preload="metadata"
                          muted
                          onLoadedMetadata={(e) => {
                            (e.target as HTMLVideoElement).currentTime = 0
                          }}
                          onError={(e) => {
                            const element = e.target as HTMLElement
                            element.style.display = 'none'
                            const container = element.parentElement
                            if (container) {
                              /* Código del botón de refresco temporalmente deshabilitado
                              const refreshButton = document.createElement('div')
                              refreshButton.innerHTML = ReactDOMServer.renderToString(
                                <RefreshButton postId={post.id} isRefreshing={refreshingPosts[post.id]} />
                              )
                              container.appendChild(refreshButton)
                              */
                              // Mostrar un placeholder simple en lugar del botón de refresco
                              container.innerHTML = `
                                <div class="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                                  <span class="text-gray-500">Sin video</span>
                                </div>
                              `
                            }
                          }}
                        />
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <Video className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                    {post.contentFormat === 'CAROUSEL_ALBUM' && (
                      <div className="relative h-16 w-16">
                        <img
                          src={post.mediaURL || 'https://via.placeholder.com/150'}
                          alt="First image of carrousel"
                          className="h-16 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            const element = e.target as HTMLElement
                            element.style.display = 'none'
                            const container = element.parentElement
                            if (container) {
                              /* Código del botón de refresco temporalmente deshabilitado
                              const refreshButton = document.createElement('div')
                              refreshButton.innerHTML = ReactDOMServer.renderToString(
                                <RefreshButton postId={post.id} isRefreshing={refreshingPosts[post.id]} />
                              )
                              container.appendChild(refreshButton)
                              */
                              // Mostrar un placeholder simple en lugar del botón de refresco
                              container.innerHTML = `
                                <div class="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                                  <span class="text-gray-500">Sin imagen</span>
                                </div>
                              `
                            }
                          }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.contentFormat}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.creatorAccount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {(post.likes ? post.likes.toLocaleString() : 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {(post.comments ? post.comments.toLocaleString() : 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {(post.totalInteractions ? post.totalInteractions.toLocaleString() : 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.postEngagement
                      ? `${(post.postEngagement * 100).toFixed(2)}%`
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.outliers
                      ? `${parseFloat(post.outliers).toFixed(2)}X`
                      : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.publicationDate ? new Date(post.publicationDate).toLocaleDateString() : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openPostModal(post)}
                        className={`rounded-md p-2 ${
                          isDarkMode
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-gray-500 hover:bg-gray-600'
                        } text-white`}
                      >
                        <Eye size={16} />
                      </button>
                      {post.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApproval(post.id, 'approved', new Date(post.publicationDate))}
                          className={`rounded-md p-2 ${
                            isDarkMode
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                          /* Comentado temporalmente la deshabilitación del botón para videos sin transcripción
                          disabled={post.contentFormat === 'VIDEO' && !post.videoTranscript}
                          */
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {post.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleApproval(post.id, 'rejected', new Date(post.publicationDate))}
                          className={`rounded-md p-2 ${
                            isDarkMode
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-red-500 hover:bg-red-600'
                          } text-white`}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className={`px-4 py-4 text-center ${
                    isDarkMode 
                      ? 'text-gray-400 bg-gray-900' 
                      : 'text-gray-500 bg-white'
                  }`}>
                  No hay publicaciones que coincidan con los filtros
                  seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reemplazar 'Load More' por paginación */}
      <div className="mt-6 flex items-center justify-center">
        <div
          className={`flex items-center gap-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!prevPageToken || currentPage <= 1 || loadingPrevPage}
            className={`rounded-md px-4 py-2 ${
              isDarkMode
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
            } border flex items-center justify-center min-w-[100px]`}
          >
            {loadingPrevPage ? (
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Cargando</span>
              </div>
            ) : (
              'Anterior'
            )}
          </button>

          <span>
            Página {currentPage} de {totalPages > 0 ? totalPages : '?'}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!nextPageToken || currentPage >= totalPages || loadingNextPage}
            className={`rounded-md px-4 py-2 ${
              isDarkMode
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
            } border flex items-center justify-center min-w-[100px]`}
          >
            {loadingNextPage ? (
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Cargando</span>
              </div>
            ) : (
              'Siguiente'
            )}
          </button>
        </div>
      </div>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          businessId={businessId}
          closeModal={closePostModal}
          isOpen={true}
        />
      )}

      <ToastContainer />
    </div>
  )
}

export default ContentPlanner
