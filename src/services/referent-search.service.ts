import { useState, useCallback } from 'react'
import httpClient from './api/httpClient'
import {
  AccountData,
  InstagramAccountResponse,
} from './interfaces/referent-search-service'

const accessToken = import.meta.env.VITE_APP_INSTAGRAM_ACCESS_TOKEN

const useReferentSearchService = () => {
  const [competitorsData, setCompetitorsData] = useState<
    InstagramAccountResponse[]
  >([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserInstagramProfile = useCallback(
    async (instagramAccountName: string): Promise<void> => {
      if (loading) return
      setLoading(true)
      setError(null)

      if (!accessToken) {
        setError(
          'La aplicación no tiene un token de acceso a la API de Instagram.'
        )
        setLoading(false)
        return
      }

      try {
        const response = await httpClient.get<InstagramAccountResponse>(
          '/meta/account',
          {
            params: {
              instagram_account: instagramAccountName,
              token: accessToken,
            },
          }
        )

        if (response.data && response.data.account_id) {
          setCompetitorsData([response.data])
        } else {
          throw new Error(
            'No se encontraron datos del perfil de Instagram en la respuesta.'
          )
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Error al obtener los datos de Instagram.')
        } else {
          setError('Ocurrió un error desconocido al obtener los datos.')
        }
        console.error('Error fetching Instagram user data:', err)
      } finally {
        setLoading(false)
      }
    },
    [loading]
  )

  const getAccountByName = async (
    accountName: string
  ): Promise<AccountData> => {
    try {
      const response = await httpClient.get<AccountData>(
        `/api/accounts?accountName=${accountName}`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener la cuenta:', error)
      throw error
    }
  }

  const createAccount = async (
    accountData: AccountData
  ): Promise<AccountData> => {
    try {
      const response = await httpClient.post<AccountData>(
        '/api/accounts',
        accountData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al crear la cuenta:', error)
      throw error
    }
  }

  const updateAccount = async (
    data: AccountData,
    accountId: string
  ): Promise<AccountData> => {
    try {
      const response = await httpClient.put<AccountData>(
        `/api/accounts/${accountId}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data
    } catch (error) {
      console.error('Error al actualizar la cuenta:', error)
      throw error
    }
  }

  return {
    competitorsData,
    loading,
    error,
    fetchUserInstagramProfile,
    createAccount,
    updateAccount,
    getAccountByName,
  }
}

export default useReferentSearchService
