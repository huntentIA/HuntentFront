import React, { useEffect, useState } from 'react'
import {
  Search,
  HelpCircle,
  X,
  Instagram,
  MessageCircle,
  Percent,
  Image,
  Loader,
} from 'lucide-react'
import BussinessService from '../../../services/business.service'
import {
  AccountData,
  InstagramAccountResponse,
  PublicationBasicData,
} from '../../../services/interfaces/referent-search-service'
import { toast, Toaster } from 'react-hot-toast'
import useReferentSearchService from '../../../services/referent-search.service'
import businessAccountService from '../../../services/business-account.service'
import postService from '../../../services/post.service'

const SearchInfoModal: React.FC<SearchInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out">
      <div className="w-full max-w-md scale-100 transform rounded-lg bg-white/70 p-6 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-in-out dark:bg-gray-900/70">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cómo buscar referentes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors duration-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>
        <div className="mb-6">
          <p className="mb-4 text-gray-600 dark:text-gray-300">
            Ingresa el nombre de usuario exacto de la cuenta, sin incluir el
            símbolo "@".
          </p>
          <div className="rounded-lg bg-white/70 p-4 shadow-md backdrop-blur-lg dark:bg-gray-700/70">
            <div className="mb-2 flex items-center">
              <Instagram className="mr-2 text-pink-500" size={24} />
              <span className="font-semibold text-gray-900 dark:text-gray-200">
                Ejemplo: Lionel Messi en Instagram
              </span>
            </div>
            <img
              src="https://via.placeholder.com/350x150.png?text=Instagram+Profile+Example"
              alt="Instagram Profile Example"
              className="mb-2 w-full rounded-lg shadow-sm"
            />
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              URL del perfil:
            </p>
            <code className="block rounded bg-gray-200 px-2 py-1 text-center text-sm dark:bg-gray-600">
              <a
                href="https://www.instagram.com/leomessi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-500 hover:underline"
              >
                https://www.instagram.com/leomessi
              </a>
            </code>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Nombre de usuario a ingresar:
            </p>
            <div className="rounded border border-gray-300 bg-white px-3 py-2 text-center font-bold text-blue-500 dark:border-gray-600 dark:bg-gray-800">
              leomessi
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Asegúrate de seleccionar la red social correcta antes de realizar la
          búsqueda.
        </p>
      </div>
    </div>
  )
}

const Tooltip: React.FC<TooltipProps> = ({ children, content }) => {
  return (
    <div className="group relative">
      {children}
      <div className="invisible absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition group-hover:visible group-hover:opacity-100">
        {content}
        <svg
          className="absolute left-0 top-full h-2 w-full text-gray-800"
          viewBox="0 0 255 255"
        >
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div>
  )
}

interface ReferentSearchProps {
  isDarkMode: boolean
}

const ReferentSearch: React.FC<ReferentSearchProps> = ({ isDarkMode }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<string>('instagram')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedReferents, setSelectedReferents] = useState<
    InstagramAccountResponse[]
  >([])
  const [searchResults, setSearchResults] = useState<
    InstagramAccountResponse[]
  >([])
  const [businessId, setBusinessId] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const {
    competitorsData,
    loading,
    error,
    fetchUserInstagramProfile,
    createAccount,
    updateAccount,
    getAccountByName,
  } = useReferentSearchService()

  const getUserData = (): UserData => {
    const userData = localStorage.getItem('userData')
    if (!userData) {
      throw new Error('No user data found')
    }
    return JSON.parse(userData)
  }

  const userId = getUserData().id

  // Fetch business account when component mounts
  useEffect(() => {
    const fetchBusinessAccount = async (): Promise<void> => {
      try {
        const business = await BussinessService.getBusinessIdByUserId(userId)
        if (Array.isArray(business) && business.length) {
          setBusinessId(business[0].id || '')
        }
      } catch (error) {
        console.error('Error fetching business account:', error)
      }
    }

    fetchBusinessAccount()
  }, [userId])

  useEffect(() => {
    if (competitorsData && competitorsData.length > 0) {
      setSearchResults(competitorsData)
    }
  }, [competitorsData])

  const handleSearch = (): void => {
    if (!searchTerm.trim()) return

    if (selectedNetwork === 'instagram') {
      fetchUserInstagramProfile(searchTerm.trim())
    } else {
      toast('Búsqueda para otras redes sociales no implementada')
    }
  }

  // Modifica la función handleToggleReferent para que ahora combine la selección y el guardado
  const handleToggleReferent = async (
    competitor: InstagramAccountResponse
  ): Promise<void> => {
    const isAlreadyReferent = selectedReferents.some(
      (ref) => ref.account_id === competitor.account_id
    )

    if (isAlreadyReferent) {
      // Si ya es referente, solo lo quitamos de la selección
      setSelectedReferents((prev) =>
        prev.filter((item) => item.account_id !== competitor.account_id)
      )
    } else {
      // Si no es referente, lo seleccionamos y luego guardamos
      setSelectedReferents([competitor])

      // Iniciamos el proceso de guardar
      setIsLoading(true)

      try {
        const existingAccount = await getAccountByName(competitor.account_name)

        const accountData: AccountData = {
          socialNetwork: 'Instagram',
          accountName: competitor.account_name || 'Unknown',
          accountType: 'REFERENCE',
          businessID: businessId,
          account_id: competitor.account_id,
          short_description: competitor.short_description || 'N/A',
          detailed_description: competitor.detailed_description || 'N/A',
          followers_count: competitor.followers_count || 0,
          follows_count: competitor.follows_count || 0,
          media_count: competitor.media_count || 0,
          profile_picture_url:
            competitor.profile_picture_url || 'https://via.placeholder.com/48',
          average_interactions_by_publication:
            competitor.average_interactions_by_publication || 0,
          total_account_interactions_last_25_publications:
            competitor.total_account_interactions_last_25_publications || 0,
          average_engagement: competitor.average_engagement || 0,
        }

        let accountId = ''

        if (!existingAccount) {
          const createdAccount = await createAccount(accountData)
          accountId = createdAccount?.id || ''
        } else {
          const updatedAccount = await updateAccount(
            accountData,
            existingAccount.id || ''
          )
          accountId = updatedAccount?.id || existingAccount.id || ''
        }

        // Link account to business if we have both IDs
        if (businessId && accountId) {
          await createBusinessAccount(businessId, accountId)
        }

        // Create publications if they exist
        if (accountId && competitor.publication_basic_data) {
          await createPosts(accountId, competitor.publication_basic_data)
        }

        toast.success('La cuenta referente se ha guardado exitosamente.')

        // Clean up
        setSearchResults((prev) =>
          prev.filter((item) => item.account_id !== competitor.account_id)
        )
        setSelectedReferents([])
      } catch (error) {
        console.error('Error saving referent:', error)
        toast.error('Ocurrió un error al guardar la cuenta')
        // Si hay error, quitamos la selección
        setSelectedReferents((prev) =>
          prev.filter((item) => item.account_id !== competitor.account_id)
        )
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleRemoveFromList = (accountId: string): void => {
    setSearchResults((prev) =>
      prev.filter((item) => item.account_id !== accountId)
    )

    setSelectedReferents((prev) =>
      prev.filter((item) => item.account_id !== accountId)
    )
  }

  const isReferent = (competitor: InstagramAccountResponse): boolean =>
    selectedReferents.some((ref) => ref.account_id === competitor.account_id)

  const createBusinessAccount = async (
    businessId: string,
    accountId: string
  ): Promise<void> => {
    try {
      const existingAccount =
        await businessAccountService.getAccountByBusinessIdAndAccountId(
          businessId,
          accountId
        )

      if (!existingAccount || Object.keys(existingAccount).length === 0) {
        await businessAccountService.createBusinessAccount(
          businessId,
          accountId
        )
      } else {
        console.log('La cuenta ya existe, no es necesario crearla')
      }
    } catch (error) {
      console.error('Error creating business account:', error)
      throw error
    }
  }

  const createPosts = async (
    accountId: string,
    publications: PublicationBasicData[]
  ): Promise<void> => {
    if (!publications || !publications.length) return

    try {
      await postService.createPost(accountId, publications)
    } catch (error) {
      console.error('Error creating posts:', error)
      throw error
    }
  }

  // Render
  // JSX del componente ReferentSearch
  return (
    <div
      className={`p-4 md:p-6 ${
        isDarkMode
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-br from-orange-50 via-white to-orange-50 text-gray-900'
      } min-h-screen`}
    >
      <Toaster position="top-center" />
      <h1 className="mb-8 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-center text-4xl font-bold text-transparent">
        Cazador de Referentes
      </h1>

      {/* Selector de red social */}
      <div className="mx-auto mb-4 max-w-3xl md:mb-6">
        <label className="mb-2 block text-sm font-medium">
          Selecciona la red social:
        </label>
        <select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          className={`w-full rounded-lg border p-2.5 transition-all duration-300 focus:ring-2 focus:ring-orange-400 md:p-3 ${
            isDarkMode
              ? 'border-gray-700 bg-gray-800/80 text-white hover:bg-gray-800'
              : 'border-gray-300 bg-white/80 text-gray-900 hover:bg-white'
          } backdrop-blur-sm`}
        >
          <option value="instagram">Instagram</option>
          {/* Opciones adicionales para el futuro */}
        </select>
      </div>

      {/* Campo de búsqueda */}
      <div className="mx-auto mb-4 max-w-3xl md:mb-6">
        <label className="mb-2 block text-sm font-medium">
          Buscar por nombre de usuario:
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Ej: leomessi (sin @)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ textIndent: '28px' }}
            className={`w-full rounded-lg border p-2.5 transition-all duration-300 focus:ring-2 focus:ring-orange-400 md:p-3 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800/80 text-white hover:bg-gray-800'
                : 'border-gray-300 bg-white/80 text-gray-900 hover:bg-white'
            } backdrop-blur-sm`}
          />
          <Search className="absolute left-3 top-4 text-gray-400" size={20} />
          <button
            onClick={() => setIsModalOpen(true)}
            className={`hover:text-orange-500} absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-300 ${
              isDarkMode
                ? 'border-gray-700 bg-gray-800/80 text-white hover:bg-gray-800'
                : 'border-gray-300 bg-white/80 text-gray-900 hover:bg-white'
            } backdrop-blur-sm`}
            title="Ayuda para búsqueda"
            aria-label="Ayuda para búsqueda"
          >
            <HelpCircle size={20} />
          </button>
        </div>
        <button
          onClick={handleSearch}
          className="mt-4 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2.5 font-medium text-white transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-lg md:px-6 md:py-3"
        >
          Buscar <Search className="ml-2" size={18} />
        </button>
      </div>

      {/* Estado de carga y resultados */}
      <div className="mx-auto space-y-4">
        {loading && (
          <div className="flex items-center justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-orange-500"></div>
            <p className="ml-4 text-base font-semibold md:text-lg">
              Cargando perfil...
            </p>
          </div>
        )}

        {error && <p className="text-center text-red-500">Error: {error}</p>}

        {/* Lista de resultados */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            {searchResults.map((competitor, index) => (
              <div
                key={`${competitor.account_id}-${index}`}
                className={`hover:scale-102 relative transform rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl md:p-6 ${
                  isDarkMode
                    ? 'bg-gray-800/90 hover:bg-gray-800'
                    : 'bg-white/90 hover:bg-white'
                } backdrop-blur-lg`}
              >
                {/* Botón para eliminar de la lista */}
                <button
                  onClick={() => handleRemoveFromList(competitor.account_id)}
                  className="absolute right-2 top-2 rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Eliminar de la lista"
                  aria-label="Eliminar de la lista"
                >
                  <X size={20} className="text-gray-500 hover:text-red-500" />
                </button>

                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <div className="mt-4 flex items-start space-x-4">
                    <img
                      src={
                        competitor.profile_picture_url ||
                        'https://via.placeholder.com/48'
                      }
                      alt={
                        competitor.short_description ||
                        competitor.account_name ||
                        'Nombre de usuario'
                      }
                      className="h-14 w-14 rounded-full object-cover md:h-16 md:w-16"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-semibold">
                          {competitor.short_description ||
                            competitor.account_name ||
                            'Nombre de usuario'}
                        </h3>
                        <Tooltip content="Engagement">
                          <span className="flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                            <Percent className="mr-1 h-4 w-4" />
                            {competitor.average_engagement
                              ? `${(
                                  competitor.average_engagement * 100
                                ).toFixed(2)}%`
                              : 'N/A'}
                          </span>
                        </Tooltip>
                        <Tooltip content="Interacciones promedio">
                          <span className="flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                            <MessageCircle className="mr-1 h-4 w-4" />
                            {competitor.average_interactions_by_publication
                              ? competitor.average_interactions_by_publication.toLocaleString()
                              : 'N/A'}
                          </span>
                        </Tooltip>
                        <Tooltip content="Total de publicaciones">
                          <span className="flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                            <Image className="mr-1 h-4 w-4" />
                            {competitor.media_count
                              ? competitor.media_count.toLocaleString()
                              : 'N/A'}
                          </span>
                        </Tooltip>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{competitor.account_name || 'username'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <span className="text-gray-500 dark:text-gray-400">
                      Seguidores:{' '}
                      {competitor.followers_count
                        ? competitor.followers_count.toLocaleString()
                        : 'No disponible'}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleReferent(competitor)}
                        disabled={isLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                          isReferent(competitor)
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {isLoading && isReferent(competitor) ? (
                          <>
                            <Loader className="mr-2 animate-spin" size={16} />{' '}
                            Guardando...
                          </>
                        ) : isReferent(competitor) ? (
                          'Eliminar Referente'
                        ) : (
                          'Agregar Referente'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modal de ayuda */}
      <SearchInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default ReferentSearch
