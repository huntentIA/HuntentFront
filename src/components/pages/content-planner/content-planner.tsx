import React, { useState, useEffect, useRef } from 'react'
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
  ApprovalStatus,
} from './interfaces/content-planner'
import PostModal from '../../shared/post-modal/postModal'
import postService from '../../../services/post.service'
import businessAccountService from '../../../services/business-account.service'
import BussinessService from '../../../services/business.service'
import { getBusinessAccountsByIdResponse } from '../../../services/interfaces/business-account-service'
import CustomMultiSelect from '../../shared/multiselect/multiselect'
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
  // States for filters and configuration
  const [mediaType, setMediaType] = useState<string>('')
  const [approvalStatus, setApprovalStatus] =
    useState<ApprovalStatus>('PENDING')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'creatorAccount',
    direction: 'desc',
  })

  // States for data and pagination
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [postsPerPage] = useState<number>(10)
  const [accountIds, setAccountIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [prevPageToken, setPrevPageToken] = useState<string | null>(null)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const [confirmedDateRange, setConfirmedDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const dateChangeTimerRef = useRef<NodeJS.Timeout | null>(null)

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

  const tooltipDescriptions = {
    contentFormat: 'Tipo de publicación (video, carrusel, imagen)',
    creatorAccount: 'Cuenta de Instagram que publicó el contenido',
    likes: 'Total de likes de la publicación',
    comments: 'Cantidad de comentarios recibidos',
    totalInteractions: 'Suma de likes y comentarios',
    postEngagement: {
      main: 'Porcentaje de interacción según los seguidores.',
      example:
        'Ejemplo: Si un creador tiene 10.000 seguidores y una publicación recibe 1.000 interacciones, el engagement es del 10%',
    },
    outliers: {
      main: 'Mide si la publicación supera el rendimiento promedio del creador.',
      example:
        'Ejemplo: Si el promedio es 1.000 interacciones y una publicación logra 2.000, es un outlier de 2X.',
    },
  }

  // Cargar los accountIds al inicio
  useEffect(() => {
    const fetchAccountIds = async () => {
      try {
        const ids = await getAccountIds()
        if (ids && ids.length > 0) {
          setAccountIds(ids)
        }
      } catch (error) {
        console.error('Error fetching account IDs:', error)
        toast.error('Error obteniendo las cuentas de usuario')
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

  useEffect(() => {
    if (accountIds.length > 0) {
      setCurrentPage(1)
      loadPosts(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mediaType,
    approvalStatus,
    selectedUsers,
    confirmedDateRange,
    dateRange,
    sortConfig,
    accountIds,
  ])

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      loadPosts(newPage)
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
    if (selectedUsers.length > 0) params.creator_accounts = selectedUsers

    if (confirmedDateRange.startDate) params.min_date = confirmedDateRange.startDate
    if (confirmedDateRange.endDate) params.max_date = confirmedDateRange.endDate

    if (approvalStatus !== 'PENDING') params.status = approvalStatus

    return params
  }

  const loadPosts = async (page: number = currentPage) => {
    if (loading) return

    try {
      setLoading(true)
      setError(null)

      const params = buildQueryParams(page)
      const response = await postService.getPosts(params)

      if (!response.items) {
        throw new Error('No items returned from API')
      }

      setPosts(response.items)

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
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (postId: string, status: string) => {
    setLoading(true)
    try {
      const newStatus = status === 'approved' ? 'APPROVED' : 'REJECTED'

      const success = await postService.updatePostStatus(postId, newStatus)

      if (success) {
        toast.success(
          `El post ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'}.`
        )
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

  const handleApprovalStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setApprovalStatus(e.target.value as ApprovalStatus)
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

    setSelectedUsers(selectedValues)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    const newDateRange = {
      ...dateRange,
      [name]: value,
    };

    setDateRange(newDateRange);
    
    if (dateChangeTimerRef.current) {
      clearTimeout(dateChangeTimerRef.current)
    }

    dateChangeTimerRef.current = setTimeout(() => {
      if (newDateRange.startDate && newDateRange.endDate) {
        setConfirmedDateRange(newDateRange);
      } 
      else if (!newDateRange.startDate && !newDateRange.endDate) {
        setConfirmedDateRange({
          startDate: '',
          endDate: ''
        });
      }
      else if ((name === 'startDate' && value === '' && !dateRange.endDate) ||
               (name === 'endDate' && value === '' && !dateRange.startDate)) {
        setConfirmedDateRange({
          startDate: '',
          endDate: ''
        });
      }
    }, 500);
  }

  /* const applyDateFilter = () => {
    if (dateRange.startDate && dateRange.endDate) {
      setConfirmedDateRange(dateRange)
    } else if (!dateRange.startDate && !dateRange.endDate) {
      setConfirmedDateRange({
        startDate: '',
        endDate: '',
      })
    } else {
      toast.warning('Por favor ingrese ambas fechas para filtrar')
    }
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
        <ChevronUp size={14} />
      ) : (
        <ChevronDown size={14} />
      )
    }
    return null
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
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-br from-orange-50 via-white to-orange-50 text-gray-900'
      } min-h-screen`}
    >
      <h1 className="mb-8 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-center text-4xl font-bold text-transparent">
        Planificador de Contenido
      </h1>

      {/* Mostrar solo un CustomerStatsCard para el perfil seleccionado */}
      {/* Filtros - Sección modificada */}
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
            } border`}
          >
            <option value="">Todos los tipos de publicación</option>
            <option value="IMAGE">Imagen</option>
            <option value="VIDEO">Video</option>
            <option value="CAROUSEL_ALBUM">Carrusel</option>
          </select>
        </div>

        {/* Filtro por estado de aprobación */}
        <div className="w-64">
          <select
            value={approvalStatus}
            onChange={handleApprovalStatusChange}
            className={`w-full rounded-md p-2 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            } border`}
          >
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobados</option>
            <option value="REJECTED">Rechazados</option>
          </select>
        </div>

        {/* Filtro por usuario - Multiselect mejorado */}
        <div className="w-64">
          <CustomMultiSelect
            selectedUsers={selectedUsers}
            handleUserChange={handleUserChange}
            businessAccounts={businessAccounts}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Filtro de rango de fechas - Alineado */}
       {/*  <div className="w-64">
          <div className="flex h-[38px] gap-2">
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className={`w-full rounded-l-md p-2 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              } border`}
              placeholder="Desde"
            />
          </div>
          {dateRange.endDate && !dateRange.startDate ? (
            <p className={`text-xs italic ${isDarkMode ? 'text-orange-300' : 'text-orange-500'}`}>
              Seleccione fecha inicial para aplicar filtro
            </p>
          ) : null}
        </div>
        <div className="w-64">
        <div className="flex h-[38px] gap-2">
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className={`w-full rounded-l-md p-2 ${
                isDarkMode
                  ? 'border-gray-700 bg-gray-800 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              } border`}
              placeholder="Hasta"
            />
          </div>
          {dateRange.startDate && !dateRange.endDate ? (
            <p className={`text-xs italic ${isDarkMode ? 'text-orange-300' : 'text-orange-500'}`}>
              Seleccione fecha final para aplicar filtro
            </p>
          ) : null}
        </div> */}
      </div>
      <div className="overflow-x-auto">
        <table
          className={`min-w-full ${
            isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'
          } rounded-lg shadow-md`}
        >
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider">
                Preview
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
                  <div className="relative inline-flex items-center">
                    <button
                      onClick={() => requestSort(column)}
                      className="flex items-center"
                    >
                      {columnNames[column as keyof typeof columnNames]}{' '}
                      {getSortIcon(column)}
                    </button>
                    <div className="group relative ml-1">
                      <Info className="h-4 w-4 cursor-help text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300" />
                      <div className="invisible absolute left-0 top-full z-10 mt-2 w-72 -translate-x-1/2 transform rounded-md bg-white text-left text-xs opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100 dark:bg-gray-800">
                        <div className="rounded-md border border-gray-200 bg-white p-3 text-gray-700 shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                          <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-x-4 border-b-8 border-x-transparent border-b-white dark:border-b-gray-800"></div>
                          {getFormattedTooltip(column)}
                        </div>
                      </div>
                    </div>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody
            className={`${
              isDarkMode
                ? 'divide-y divide-gray-700'
                : 'divide-y divide-gray-200'
            }`}
          >
            {posts?.length > 0 ? (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className={`${
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
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
                    {post.contentFormat}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.creatorAccount}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.likes.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.comments.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {post.totalInteractions.toLocaleString()}
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
                  {new Date(post.publicationDate).toLocaleDateString()}
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
                          onClick={() => handleApproval(post.id, 'approved')}
                          className={`rounded-md p-2 ${
                            isDarkMode
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-green-500 hover:bg-green-600'
                          } text-white`}
                        >
                          <Check size={16} />
                        </button>
                      )}
                      {post.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleApproval(post.id, 'rejected')}
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
                <td colSpan={9} className="px-4 py-4 text-center text-gray-500">
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
          className={`flex items-center gap-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!prevPageToken || currentPage <= 1}
            className={`rounded-md px-4 py-2 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
            } border`}
          >
            Anterior
          </button>

          <span>
            Página {currentPage} de {totalPages > 0 ? totalPages : '?'}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!nextPageToken || currentPage >= totalPages}
            className={`rounded-md px-4 py-2 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400'
            } border`}
          >
            Siguiente
          </button>
        </div>
      </div>
      {selectedPost && (
        <PostModal
          post={selectedPost}
          closeModal={closePostModal}
          isOpen={true}
        />
      )}

      <ToastContainer />
    </div>
  )
}

export default ContentPlanner
