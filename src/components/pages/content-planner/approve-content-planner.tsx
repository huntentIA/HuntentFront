import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Video,
  Info,
  Download,
  BarChart2,
} from 'lucide-react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Post,
  SortConfig,
  PostBusinessQueryParams,
} from './interfaces/approve-content-planner'
import PostAprovedModal from '../../shared/post-modal/postAprovedModal'
import businessPostService from '../../../services/business-post.service'
import { ContentAnalysisData } from '../../../services/interfaces/business-post-service'
import businessAccountService from '../../../services/business-account.service'
import BussinessService from '../../../services/business.service'
import { getBusinessAccountsByIdResponse } from '../../../services/interfaces/business-account-service'
import CustomMultiSelect from '../../shared/multiselect/multiselect'
import { tooltipDescriptions } from '../../../utils/toolDescriptions'
import { BusinessesAccountResponse } from '../../../services/interfaces/business-service'
interface UserData {
  id: string
  // Otros campos de usuario
}

interface ContentPlannerProps {
  isDarkMode: boolean
}

export const ApproveContentPlanner: React.FC<ContentPlannerProps> = ({
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
  const [business, setBusiness] = useState<BusinessesAccountResponse | null>(null)
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
  // Nuevos estados para almacenar opciones de filtro basadas en datos reales
  const [availableCreators, setAvailableCreators] = useState<{ id: string, accountName: string }[]>([])
  const [analysisLoading, setAnalysisLoading] = useState<{[key: string]: boolean}>({})

  const columnNames = {
    contentFormat: 'Formato',
    creatorAccount: 'Autor',
    publicationDate: 'Fecha y hora',
    topics: 'Temas',
    objective: 'Objetivo',
    description: 'Descripción',
    transcript: 'Transcripción',
    scriptAdaptation: 'Adaptación del guión',
    likes: 'Me gusta',
    comments: 'Comentarios',
    totalInteractions: 'Interacciones Totales',
    postEngagement: 'Engagement',
    outliers: 'Outliers',
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
      setBusiness(businessResponse)
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

  useEffect(() => {
    if (accountIds.length > 0 && businessId && initialLoadComplete) {
      // Verificamos que exista en la lista de cuentas
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
    businessId,
    initialLoadComplete
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
    const params: PostBusinessQueryParams = {
      limit: postsPerPage.toString(),
      page_number: page.toString(),
      businessId: businessId,
      status: 'APPROVED',
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
    
    if (effectiveSelectedUsers.length > 0 && !effectiveSelectedUsers.includes('')) {
      // Buscar los IDs de cuenta correspondientes a los nombres de cuenta seleccionados
      const accountIdsToFilter: string[] = [];
      
      effectiveSelectedUsers.forEach(selectedUser => {
        // Intentar encontrar la cuenta por nombre o por ID
        const matchingAccount = availableCreators.find(
          acc => acc.accountName === selectedUser || acc.id === selectedUser
        );
        
        if (matchingAccount && matchingAccount.id) {
          accountIdsToFilter.push(matchingAccount.id);
        } else {
          // Si no se encuentra una coincidencia exacta, usar el valor seleccionado directamente
          accountIdsToFilter.push(selectedUser);
        }
      });
      
      if (accountIdsToFilter.length > 0) {
        params.account_ids = accountIdsToFilter;
      }
    }

    return params
  }

  const loadPosts = async (page: number = currentPage) => {
    if (loading || !businessId) return

    try {
      setLoading(true)
      setError(null)

      const params = buildQueryParams(page)
      const response = await businessPostService.getBusinessPost(params)
      console.log(response)

      if (!response.items) {
        throw new Error('No items returned from API')
      }

      // Convertimos los elementos BusinessPostData a tipo Post
      const transformedPosts = response.items.map(item => {
        // Suponemos que el objeto de respuesta de BusinessPost tiene información relacionada
        // que podemos mapear a los campos de Post
        return {
          id: item.postId || '',
          accountID: item.accountId || '', 
          status: item.status || 'APPROVED',
          mediaURL: item.mediaURL || '', 
          publicationDate: item.publicationDate ? new Date(item.publicationDate).toISOString() : '',
          publicationTime: item.publicationDate ? new Date(item.publicationDate).toTimeString() : '',
          likes: item.likes || 0, 
          comments: item.comments || 0, 
          shares: item.shares || 0, 
          saves: item.saves || 0, 
          totalInteractions: item.totalInteractions || 0, 
          postEngagement: item.postEngagement || 0, 
          hashtags: item.hashtags || [], 
          postURL: item.postURL || '', 
          contentFormat: item.contentFormat || 'IMAGE', 
          creatorAccount: item.creatorAccount || '', 
          description: item.description || '', 
          outliers: item.outliers || '', 
          carousel_items: item.carousel_items || [],
          businessPostId: item.businessPostId || '',
          content_adapter: item.content_adapter || '',
          content_objectives: item.content_objectives || [],
          content_topics: item.content_topics || [],
          downloadable_type: item.downloadable_type || false,
          global_content_analysis: item.global_content_analysis || '',
          hook: item.hook || '',
          narrative_structure: item.narrative_structure || '',
          pain_or_desire: item.pain_or_desire || '',
          video_transcription: item.video_transcription || '',
          businessPostStatus: item.businessPostStatus || '',
          call_to_action: item.call_to_action || '',
          brand_tone_business: business?.[0]?.brandTone || '',
          target_audience_business: business?.[0]?.targetAudience || '',
        } as Post;
      });

      setPosts(transformedPosts);
      setTotalItems(response.total_items || 0)
      setTotalPages(response.total_pages || 1)
      setCurrentPage(response.page_number || 1)

      setNextPageToken(response.next_page_token)
      setPrevPageToken(response.prev_page_token)
      setCurrentToken(response.current_token)

      // Extraer los creadores disponibles de los posts
      const creators = transformedPosts.reduce((acc: { id: string, accountName: string }[], post) => {
        if (post.accountID && post.creatorAccount && !acc.some(c => c.id === post.accountID)) {
          acc.push({ id: post.accountID, accountName: post.creatorAccount });
        }
        return acc;
      }, []);
      
      if (creators.length > 0) {
        setAvailableCreators(prevCreators => {
          const combinedCreators = [...prevCreators];
          creators.forEach(creator => {
            if (!combinedCreators.some(c => c.id === creator.id)) {
              combinedCreators.push(creator);
            }
          });
          return combinedCreators;
        });
      }

      // Extraer los tipos de contenido disponibles
      
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

  const handleGenerateExcel = async () => {
    try {
      setLoading(true)
      const blob = await businessPostService.generateExcelReport(businessId)
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(blob)
      
      // Crear elemento de enlace temporal
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-posts-${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Simular clic y limpiar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Reporte Excel generado exitosamente')
    } catch (error) {
      console.error('Error al generar el reporte Excel:', error)
      toast.error('Error al generar el reporte Excel')
    } finally {
      setLoading(false)
    }
  }

  // Modificamos la lógica para llenar el componente de filtrado con nombres de cuenta
  const getBusinessAccountsForMultiselect = () => {
    if (availableCreators.length > 0) {
      // Transformar la estructura para que el multiselect existente pueda usarla
      return availableCreators.map(creator => ({
        id: creator.id,
        accountName: creator.accountName || creator.id
      }));
    } else {
      return businessAccounts.map(account => ({
        id: account.id || account.accountName,
        accountName: account.accountName || account.id
      }));
    }
  };

  const handleContentAnalysis = async (post: Post) => {
    try {
      setAnalysisLoading(prev => ({ ...prev, [post.id]: true }))
      
      // Intentamos obtener la información de la cuenta asociada
      let accountInfo = null;
      try {
        if (post.accountID && businessId) {
          console.log('entra')
          const accountData = await businessAccountService.getAccountByBusinessIdAndAccountId(
            businessId,
            post.accountID
          );
          console.log(accountData.accounts[0])
          if (accountData && accountData.accounts && accountData.accounts.length > 0) {
            accountInfo = accountData.accounts[0];
          }
        }
      } catch (error) {
        console.error('Error al obtener información de la cuenta:', error);
      }
      
      // Preparamos los datos para el análisis
      const analysisData: ContentAnalysisData = {
        brand_tone: accountInfo?.brand_tone || "",
        target_audience: accountInfo?.target_audience?.join(', ') || "",
        outliers: post.outliers ? Number(post.outliers) : null,
        brand_tone_business: business?.[0]?.brandTone || "",
        objective: business?.[0]?.objective?.join(', ') || "",
        contentFormat: post.contentFormat || "IMAGE",
        likes: post.likes || 0,
        comments: post.comments || 0,
        total_interactions: post.totalInteractions || 0,
        description: post.description || ""
      }

      if(post.contentFormat === "VIDEO"){
        analysisData.video_transcription = post.videoTranscript || ""
      }else {
        analysisData.target_audience_business = business?.[0]?.targetAudience || ""
      }
      
      // Llamamos al servicio de análisis
      await businessPostService.contentAnalysis(post.businessPostId || '', analysisData)
      
      // Refrescamos la tabla para ver los cambios
      toast.success('Análisis de contenido completado correctamente')
      await loadPosts(currentPage)
    } catch (error) {
      console.error('Error al analizar el contenido:', error)
      toast.error('Error al analizar el contenido. Por favor, inténtelo de nuevo.')
    } finally {
      setAnalysisLoading(prev => ({ ...prev, [post.id]: false }))
    }
  }

  if (loading && posts.length === 0) {
    return <div>Cargando...</div>
  }

  if (error && posts.length === 0) {
    return <div>Error: {error}</div>
  }

  return (
    <div
      className={`min-h-screen p-4 md:p-6 ${
        isDarkMode
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-r from-orange-50 to-white text-gray-900'
      }`}
    >
      <h1 className="mb-8 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-center text-4xl font-bold text-transparent">
        Publicaciones Aprobadas
      </h1>

      {/* Total de publicaciones */}
      <div
        className={`mb-6 inline-block flex w-60 justify-start rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
        } px-4 py-2 shadow-sm`}
      >
        <p
          className={`text-md font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Total publicaciones:{' '}
          <span className="font-bold text-orange-500">{totalItems}</span>
        </p>
      </div>

      {/* Filtros - Sección completa rediseñada */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-start gap-4">
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
              businessAccounts={getBusinessAccountsForMultiselect()}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        <button
          onClick={handleGenerateExcel}
          disabled={loading || accountIds.length === 0}
          className={`flex items-center gap-2 rounded-md px-4 py-2 ${
            isDarkMode
              ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700'
              : 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300'
          } text-white transition-colors`}
        >
          <Download size={20} />
          {loading ? 'Generando...' : 'Generar Excel'}
        </button>
      </div>

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
                  Previsualización
                </div>
              </th>
              {[
                'publicationDate',
                'contentFormat',
                'creatorAccount',
                'topics',
                'objective',
                'description',
                'transcript',
                'scriptAdaptation',
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
                      className={`ml-2 rounded-full p-1 hover:bg-opacity-20 ${
                        isDarkMode
                          ? 'border border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/80 hover:text-gray-100'
                          : 'text-gray-700 hover:bg-orange-500'
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
                  key={`post-${post.id || post.businessPostId || Math.random().toString()}`}
                  className={`${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-800'
                      : 'hover:bg-gray-50'
                  } border-b`}
                >
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.contentFormat === 'IMAGE' && (
                      <img
                        src={post.mediaURL || 'https://via.placeholder.com/150'}
                        alt="Content preview"
                        className="h-16 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                      />
                    )}
                    {post.contentFormat === 'VIDEO' && (
                      <div className="relative h-16 w-16">
                        <video
                          src={post.mediaURL}
                          className="h-16 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                          preload="metadata"
                          muted
                          onLoadedMetadata={(e) => {
                            // Intentamos mover el cursor al primer frame
                            ;(e.target as HTMLVideoElement).currentTime = 0
                          }}
                          onError={(e) => {
                            // Si hay error al cargar el video, mostramos un fallback
                            const fallbackContainer = (
                              e.target as HTMLVideoElement
                            ).parentElement
                            if (fallbackContainer) {
                              fallbackContainer.innerHTML = `
                                <div class="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                                  <svg class="w-6 h-6 text-gray-600" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                                    <path fill="currentColor" d="M10 8v8l6-4z"/>
                                  </svg>
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
                      <img
                        src={post.mediaURL || 'https://via.placeholder.com/150'}
                        alt="First image of carrousel"
                        className="h-16 w-16 rounded object-cover transition-transform duration-300 hover:scale-105"
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.publicationDate
                      ? new Date(post.publicationDate).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.contentFormat}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.creatorAccount}
                  </td>
                  <td className="whitespace-normal px-4 py-4">
                    {post.content_topics && post.content_topics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {post.content_topics.map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No aplica</span>
                    )}
                  </td>

                  {/* Celda para content_objectives con badges individuales */}
                  <td className="whitespace-normal px-4 py-4">
                    {post.content_objectives &&
                    post.content_objectives.length > 0 &&
                    Array.isArray(post.content_objectives) ? (
                      <div className="flex flex-wrap gap-2">
                        {post.content_objectives.map((objective, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                          >
                            {objective}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No aplica</span>
                    )}
                  </td>
                  <td className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-4 py-4">
                    {post.description || 'No aplica'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.videoTranscript
                      ? 'Sin transcripción'
                      : 'Sin transcripción'}
                  </td>
                  <td className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap px-4 py-4">
                    {post.scriptAdaptation || 'No aplica'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {post.content_objectives && post.content_objectives.length > 0 && Array.isArray(post.content_objectives) ? (
                        // Si ya tiene objetivo, mostrar botón de visualización
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
                      ) : (
                        // Si no tiene objetivo, mostrar botón de análisis
                        <button
                          onClick={() => handleContentAnalysis(post)}
                          disabled={analysisLoading[post.id]}
                          className={`rounded-md p-2 ${
                            isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } text-white`}
                        >
                          {analysisLoading[post.id] ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                          ) : (
                            <BarChart2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={10}
                  className={`px-4 py-4 text-center ${
                    isDarkMode
                      ? 'bg-gray-900 text-gray-400'
                      : 'bg-white text-gray-500'
                  }`}
                >
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
            } flex min-w-[100px] items-center justify-center border`}
          >
            {loadingPrevPage ? (
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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
            disabled={
              !nextPageToken || currentPage >= totalPages || loadingNextPage
            }
            className={`rounded-md px-4 py-2 ${
              isDarkMode
                ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
            } flex min-w-[100px] items-center justify-center border`}
          >
            {loadingNextPage ? (
              <div className="flex items-center">
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
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
        <PostAprovedModal
          post={selectedPost}
          closeModal={closePostModal}
          isOpen={true}
          isDarkMode={isDarkMode}
        />
      )}

      <ToastContainer />
    </div>
  )
}

export default ApproveContentPlanner
