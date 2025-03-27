import React, { useState, useEffect } from 'react'
import {
  Percent,
  MessageCircle,
  Image,
  Users,
  AlertCircle,
  X,
  Loader,
  RefreshCw,
} from 'lucide-react'
import BussinessService from '../../../services/business.service'
import businessAccountService from '../../../services/business-account.service'
import { getBusinessAccountsByIdResponse } from '../../../services/interfaces/business-account-service'
import useReferentSearchService from '../../../services/referent-search.service'
import { toast, Toaster } from 'react-hot-toast'
import postService from '../../../services/post.service'
import {
  AccountData,
  PublicationBasicData,
} from '../../../services/interfaces/referent-search-service'

// Define interfaces for data structures
interface UserData {
  id: string
}

/**
 * AccountTable component displays a grid of account cards with various metrics
 */
const UserAccount: React.FC<AccountTableProps> = ({ isDarkMode }) => {
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
        await businessAccountService.getAccountByBusinessId(businessId)

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

  /**
   * Tooltip component for displaying additional information on hover
   */
  const Tooltip: React.FC<TooltipProps> = ({ children, content, isDarkMode }) => (
    <div className="group relative">
      {children}
      <div className={`
        invisible absolute bottom-full left-1/2 z-10 mb-1 
        -translate-x-1/2 transform whitespace-nowrap rounded 
        ${isDarkMode 
          ? 'bg-gray-700 text-white' 
          : 'bg-gray-800 text-white'
        } px-2 py-1 text-xs opacity-0 transition group-hover:visible group-hover:opacity-100`}
      >
        {content}
      </div>
    </div>
  )

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
        <h1 className="mb-8 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-center text-4xl font-bold text-transparent">
          Directorio de referentes
        </h1>
  
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {accounts && accounts.accounts.length > 0 ? (
            accounts.accounts.map((account, index) => (
              <div
                key={index}
                className={`relative rounded-lg p-6 shadow-lg ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                } transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
              >
                <button
                  onClick={() =>
                    openDeleteConfirmation(account.businessAccountId || '')
                  }
                  className="absolute right-2 top-2 rounded-full p-1 hover:bg-red-100 dark:hover:bg-gray-700"
                  aria-label="Delete account"
                >
                  <X className="h-6 w-6 text-red-500 hover:text-red-700" />
                </button>
  
                {/* Contenido principal de la card */}
                <div className="flex flex-col">
                  {/* Sección superior: foto y datos */}
                  <div className="flex flex-col gap-4 md:flex-row">
                    <img
                      src={account.profile_picture_url}
                      alt={account.short_description || account.accountName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
  
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {account.accountName || account.accountName}
                        </h3>
  
                        <div className="flex flex-wrap gap-2">
                          <Tooltip content="Engagement" isDarkMode={isDarkMode}>
                            <span className="flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              <Percent className="mr-1 h-4 w-4" />
                              {account.average_engagement
                                ? `${(account.average_engagement * 100).toFixed(
                                    2
                                  )}%`
                                : 'N/A'}
                            </span>
                          </Tooltip>
  
                          <Tooltip content="Interacciones" isDarkMode={isDarkMode}>
                            <span className="flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                              <MessageCircle className="mr-1 h-4 w-4" />
                              {account.average_interactions_by_publication?.toLocaleString() ||
                                'N/A'}
                            </span>
                          </Tooltip>
  
                          <Tooltip content="Publicaciones" isDarkMode={isDarkMode}>
                            <span className="flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                              <Image className="mr-1 h-4 w-4" />
                              {account.media_count?.toLocaleString() || 'N/A'}
                            </span>
                          </Tooltip>
                        </div>
                      </div>
  
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <Users className="h-5 w-5" />
                        <span>
                          {account.followers_count?.toLocaleString() ||
                            'No disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
  
                  {/* Sección inferior: fecha y botón */}
                  <div className="mt-4 grid grid-cols-12 items-end">
                    {/* Fecha - alineada con la foto (ocupa las primeras columnas) */}
                    <div className="col-span-4 text-left text-sm text-gray-500 dark:text-gray-400">
                      {account.updated_at && (
                        <>
                          Última actualización:
                          <br />
                          {new Date(account.updated_at).toLocaleDateString()}
                        </>
                      )}
                    </div>
  
                    {/* Espacio para mantener la alineación */}
                    <div className="col-span-2"></div>
  
                    {/* Botón alineado a la derecha */}
                    <div className="col-span-6 flex justify-end">
                      <button
                        onClick={() => handleUpdateAccount(account.accountName)}
                        disabled={updatingAccount === account.accountName}
                        className={`flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 ${
                          updatingAccount === account.accountName
                            ? 'bg-gray-400 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:shadow-md'
                        }`}
                      >
                        {updatingAccount === account.accountName ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Actualizar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
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
