import React, { useState, useEffect } from 'react'
import {
  AlertCircle,
  X,
  Loader,
  RefreshCw,
  //Search,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BussinessService from '../../../services/business.service'
import businessAccountService from '../../../services/business-account.service'
import { getBusinessAccountsByIdResponse } from '../../../services/interfaces/business-account-service'
import useReferentSearchService from '../../../services/referent-search.service'
import { toast, Toaster } from 'react-hot-toast'
import postService from '../../../services/post.service'
import {
  AccountData as BaseAccountData,
  PublicationBasicData,
} from '../../../services/interfaces/referent-search-service'

// Define interfaces for data structures
interface UserData {
  id: string
}

// Extendemos la interfaz AccountData para incluir industry
interface AccountData extends BaseAccountData {
  industry?: string[]
}

// Componente para secciones colapsables
const CollapsibleSection = ({
  title,
  children,
  isDarkMode,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  isDarkMode: boolean
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border-t ${isDarkMode ? 'border-gray-700/80 bg-transparent' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-center py-3 text-sm font-medium transition-colors ${
          isDarkMode 
            ? `text-gray-300 hover:text-orange-400 ${isOpen ? 'bg-gray-800/40' : 'bg-gray-800/40'}` 
            : `text-gray-700 hover:text-orange-600 ${isOpen ? 'bg-gray-50' : 'bg-gray-50'}`
        }`}
      >
        {title}
        {isOpen ? (
          <ChevronUp className={`ml-2 h-4 w-4 transition-colors ${
            isDarkMode ? 'text-orange-500' : 'text-orange-500'
          }`} />
        ) : (
          <ChevronDown className={`ml-2 h-4 w-4 transition-colors ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        )}
      </button>

      {isOpen && (
        <div className={`transition-all duration-200 ease-in-out ${
          isDarkMode ? 'bg-gray-800/10' : 'bg-gray-50/60'
        }`}>
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * AccountTable component displays a grid of account cards with various metrics
 */
const UserAccount: React.FC<AccountTableProps> = ({ isDarkMode }) => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<getBusinessAccountsByIdResponse>()
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAccountToDelete, setSelectedAccountToDelete] = useState<
    string | null
  >(null)
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [updatingAccount, setUpdatingAccount] = useState<string | null>(null)

  // Import the referent search service
  const {
    fetchUserInstagramProfile,
    updateAccount,
    getAccountByName,
    competitorsData,
  } = useReferentSearchService()

  const fetchAccounts = async (): Promise<void> => {
    try {
      const userDataString = localStorage.getItem('userData')

      if (!userDataString) {
        throw new Error('User data not found in localStorage')
      }

      const user: UserData = JSON.parse(userDataString)
      const userId = user.id

      const businessResponse =
        await BussinessService.getBusinessIdByUserId(userId)

      if (!businessResponse || businessResponse.length === 0) {
        throw new Error('No business found for user')
      }

      const businessId = businessResponse[0].id
      const data: getBusinessAccountsByIdResponse =
        await businessAccountService.getAccountByBusinessId(businessId, true)

      setAccounts(data)
      setLoading(false)
    } catch (err) {
      setError('Error fetching accounts.')
      setLoading(false)
      console.error('Error fetching accounts:', err)
    }
  }

  useEffect(() => {
    fetchAccounts()
    // We're intentionally excluding dependencies here as we only want this to run once
  }, [])

  // Effect to handle competitor data updates
  useEffect(() => {
    const handleCompetitorUpdate = async () => {
      if (competitorsData && competitorsData.length > 0 && updatingAccount) {
        try {
          const competitor = competitorsData[0] // Get the first competitor
          const existingAccount = await getAccountByName(
            competitor.account_name
          )

          if (existingAccount) {
            // Update account data
            const accountData: AccountData = {
              socialNetwork: 'Instagram',
              accountName: competitor.account_name || 'Unknown',
              accountType: 'REFERENCE',
              businessID: accounts?.bussinessId || '',
              account_id: competitor.account_id,
              short_description: competitor.short_description || 'N/A',
              detailed_description: competitor.detailed_description || 'N/A',
              followers_count: competitor.followers_count || 0,
              follows_count: competitor.follows_count || 0,
              media_count: competitor.media_count || 0,
              profile_picture_url:
                competitor.profile_picture_url ||
                'https://via.placeholder.com/48',
              average_interactions_by_publication:
                competitor.average_interactions_by_publication || 0,
              total_account_interactions_last_25_publications:
                competitor.total_account_interactions_last_25_publications || 0,
              average_engagement: competitor.average_engagement || 0,
              publication_basic_data: competitor.publication_basic_data,
            }

            await updateAccount(accountData, existingAccount.id || '')

            if (existingAccount.id && competitor.publication_basic_data) {
              await createPosts(
                existingAccount.id,
                competitor.publication_basic_data
              )
            }
            toast.success('Referente actualizado exitosamente')
            fetchAccounts()
          }
        } catch (error) {
          console.error('Error updating referent:', error)
          toast.error('Error al actualizar el referente')
        } finally {
          setUpdatingAccount(null)
        }
      }
    }

    handleCompetitorUpdate()
  }, [
    competitorsData,
    updatingAccount,
    accounts?.bussinessId,
    getAccountByName,
    updateAccount,
  ])

  const handleDeleteAccount = async (): Promise<void> => {
    if (selectedAccountToDelete) {
      try {
        await businessAccountService.deleteAccountById(selectedAccountToDelete)
        await fetchAccounts()
        setShowConfirmModal(false)
        setSelectedAccountToDelete(null)
      } catch (err) {
        setError('Error deleting account.')
        console.error('Error deleting account:', err)
      }
    }
  }

  const openDeleteConfirmation = (accountId: string): void => {
    setSelectedAccountToDelete(accountId)
    setShowConfirmModal(true)
  }

  // Function to handle account update
  const handleUpdateAccount = async (accountName: string): Promise<void> => {
    try {
      setUpdatingAccount(accountName)
      await fetchUserInstagramProfile(accountName)
    } catch (error) {
      console.error('Error fetching Instagram profile:', error)
      toast.error('Error al actualizar el referente')
      setUpdatingAccount(null)
    }
  }

  // Function to create posts from publication data
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

  // New function to navigate to Content Planner with account filter
  const navigateToContentPlanner = (accountName: string) => {
    navigate('/contentPlanner', { 
      state: { 
        selectedCreator: accountName 
      } 
    })
  }

  if (loading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-900'
            : 'bg-gradient-to-r from-orange-50 to-white'
        }`}
      >
        <div className="space-y-4 text-center">
          <Loader
            className={`mx-auto h-10 w-10 animate-spin ${
              isDarkMode ? 'text-gray-300' : 'text-orange-500'
            }`}
          />
          <p
            className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            Cargando cuentas...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${
          isDarkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-900'
            : 'bg-gradient-to-r from-orange-50 to-white'
        }`}
      >
        <div
          className={`space-y-4 rounded-lg p-8 text-center shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <AlertCircle
            className={`mx-auto h-12 w-12 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`}
          />
          <p
            className={`text-lg font-medium ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`}
          >
            Error: {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${
        isDarkMode
          ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-white'
          : 'bg-gradient-to-r from-orange-50 to-white text-gray-900'
      }`}
    >
      <Toaster position="top-center" />

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className={`w-full max-w-md rounded-lg p-6 shadow-xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className="mb-4 text-xl font-bold">Confirmar Eliminación</h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              ¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-center text-4xl font-bold text-transparent">
            Directorio de Referentes
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-lg bg-orange-100 px-3 py-1 text-orange-600 dark:bg-gray-700 dark:text-orange-400">
                <span className="text-sm font-medium">
                  {accounts?.accounts.length || 0}  referentes 
                </span>
              </div>
              <div className="flex items-center rounded-lg bg-blue-100 px-3 py-1 text-blue-600 dark:bg-gray-700 dark:text-blue-400">
                <span className="text-sm font-medium">
                  {accounts?.accounts.reduce(
                    (acc, account) => acc + (account?.posts_count || 0),
                    0
                  )}{' '}
                  publicaciones rastreadas por huntent
                </span>
              </div>
            </div>

           {/*  <div className="relative ml-auto max-w-md flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario o industria"
                  className={`w-full rounded-lg border py-2 pl-10 pr-4 ${
                    isDarkMode
                      ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-400'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                  }`}
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div> */}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3" style={{ gridAutoRows: "min-content" }}>
          {accounts && accounts.accounts.length > 0 ? (
            accounts.accounts.map((account, index) => (
              <div
                key={index}
                className={`relative rounded-lg shadow-lg ${
                  isDarkMode ? 'bg-gray-800/90 border border-gray-700' : 'bg-white'
                } flex h-auto flex-col transform overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
                style={{ alignSelf: "start" }}
              >
                <button
                  onClick={() =>
                    openDeleteConfirmation(account.businessAccountId || '')
                  }
                  className={`absolute right-2 top-2 z-10 rounded-full p-1 ${isDarkMode ? ' bg-gray-800/40 border border-gray-700 hover:bg-gray-700/80 text-red-400 hover:text-red-300' : 'border border-gray-200 hover:bg-red-100 text-red-500 hover:text-red-700'}`}
                  aria-label="Delete account"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="mr-8 p-4">
                  <div className={`flex items-start justify-between ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    <div className="flex items-start">
                      <img
                        src={account.profile_picture_url}
                        alt={account.short_description || account.accountName}
                        className="mr-3 h-12 w-12 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <div>
                        <h3 
                          className={`text-base font-semibold cursor-pointer hover:text-orange-500 transition-colors ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}
                          onClick={() => navigateToContentPlanner(account.accountName)}
                        >
                          {account.accountName || 'N/A'}
                        </h3>
                        <p
                          className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          @
                          {account.accountName.toLowerCase().replace(/\s/g, '') || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                          {account.industry
                            ?.map((industry) => industry)
                            .join(', ') || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span
                          className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                        >
                          {account.media_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección de Resumen de la cuenta */}
                <CollapsibleSection
                  title="Resumen de la cuenta"
                  isDarkMode={isDarkMode}
                  defaultOpen={index === 0 ? true : false}
                >
                  <div className="px-4 pb-3">
                    {/* Descripción del perfil */}
                    {account.detailed_description && (
                      <p
                        className={`mb-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      >
                        {account.detailed_description || 'N/A'}
                      </p>
                    )}

                    {/* Tags o categorías mejorados */}
                    {account.main_topics && account.main_topics.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {account.main_topics.map((topic, i) => (
                          <div
                            key={i}
                            className={`mb-2 inline-block rounded-lg px-4 py-2 text-xs font-medium ${
                              isDarkMode
                                ? 'border border-blue-800/50 bg-blue-900/20 text-blue-300'
                                : 'border border-blue-100 bg-blue-50 text-blue-800'
                            }`}
                          >
                            {topic || 'N/A'}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Detalles" isDarkMode={isDarkMode}>
                  <div className="px-4 pb-3">
                    {/* Cifras y estadísticas en línea horizontal */}
                    <div className="mb-4 flex items-center gap-4">
                      {/* Engagement */}
                      <div className="flex items-center">
                        <div
                          className={`flex items-center justify-center rounded-full px-3 py-1 ${
                            isDarkMode ? 'bg-gray-700/70' : 'bg-gray-100'
                          }`}
                        >
                          <span
                            className={`text-sm font-semibold ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-700'
                            }`}
                          >
                            {account.average_engagement
                              ? `${(account.average_engagement * 100).toFixed(2)}%`
                              : 'N/A'}
                          </span>
                        </div>
                        <span className={`ml-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Engag.</span>
                      </div>

                      {/* Seguidores */}
                      <div className="flex items-center">
                        <div
                          className={`rounded-full px-3 py-1 ${
                            isDarkMode ? 'bg-gray-700/70' : 'bg-gray-100'
                          }`}
                        >
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            {account.followers_count?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                        <span className={`ml-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Seguid.</span>
                      </div>
                    </div>

                    {/* Información adicional en flex-row */}
                    <div className="flex flex-wrap gap-2">
                      {/* Primera fila */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 ${
                            isDarkMode ? 'text-blue-300' : 'text-blue-600'
                          }`}
                        >
                          <div className="h-2 w-2 rounded-full bg-current"></div>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                              isDarkMode
                                ? 'bg-gray-700/70 text-gray-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {account.language_region? account.language_region.split(',')[1].trim() : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isDarkMode ? 'bg-gray-400' : 'bg-gray-500'
                            }`}
                          ></div>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                              isDarkMode
                                ? 'bg-gray-700/70 text-gray-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {account.language_region? account.language_region.split(',')[0].trim() : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Segunda fila */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1 ${
                            isDarkMode ? 'text-amber-300' : 'text-amber-600'
                          }`}
                        >
                          <div className="h-2 w-2 rounded-full bg-current"></div>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                              isDarkMode
                                ? 'bg-gray-700/70 text-gray-200'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            Tono: {account.brand_tone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <div className={`mt-auto flex border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => navigateToContentPlanner(account.accountName)}
                    className={`flex flex-1 items-center justify-center py-3 transition-colors ${
                      isDarkMode
                        ? 'text-gray-300 bg-gray-800/40 hover:bg-gray-700/70 hover:text-orange-400'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-orange-600'
                    }`}
                  >
                    Ver publicaciones
                  </button>
                  <button
                    onClick={() => handleUpdateAccount(account.accountName)}
                    disabled={updatingAccount === account.accountName}
                    className={`flex flex-1 items-center justify-center py-3 transition-colors ${
                      updatingAccount === account.accountName
                        ? isDarkMode
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-200 text-gray-500'
                        : isDarkMode
                          ? 'bg-orange-600/90 text-white hover:bg-orange-500'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {updatingAccount === account.accountName ? (
                      <>
                        <Loader className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Actualizar
                      </>
                    )}
                  </button>
                </div>

                <div className={`border-t px-6 py-2 text-xs ${isDarkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  Última actualización:{' '}
                  {account.updated_at
                    ? new Date(account.updated_at).toLocaleDateString()
                    : 'N/A'}
                </div>
              </div>
            ))
          ) : (
            <div
              className={`col-span-full rounded-lg p-8 text-center shadow-lg ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-orange-500" />
              <h2 className="mb-2 text-2xl font-bold">
                No se encontraron cuentas
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400">
                No hay cuentas disponibles para mostrar en este momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserAccount
