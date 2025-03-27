/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Edit3, BookOpen, Instagram, Save, Target } from 'lucide-react'
import BussinessService from '../../../../services/business.service'
import { BusinessUpdateData } from '../../../../services/interfaces/business-service'

interface FormData {
  instagram: string
  marca: string
  productos: string
  diferenciadores: string
  audiencia: string
  objetivos: number[]
}

interface CardProps {
  className: string
  children: React.ReactNode
  isDarkMode?: boolean
}

interface KnowledgeBaseViewProps {
  isDarkMode?: boolean
}

// Define objetivos array to match KnowledgeBaseForm
const objetivos = [
  { id: 1, texto: 'Aumentar las ventas', icono: '💰' },
  { id: 2, texto: 'Posicionar la marca', icono: '🎯' },
  { id: 3, texto: 'Educar a los clientes', icono: '📚' },
  { id: 4, texto: 'Convertirme en influenciador', icono: '⭐' },
  { id: 5, texto: 'Generar comunidad', icono: '👥' },
  { id: 6, texto: 'Mostrar productos/servicios', icono: '🛍️' },
]

const Card: React.FC<CardProps> = ({
  className,
  children,
  isDarkMode = false,
}) => {
  return (
    <div
      className={`rounded-lg p-6 ${
        isDarkMode ? 'bg-[#1E2129] text-gray-100' : 'bg-white text-gray-900'
      } ${className}`}
    >
      {children}
    </div>
  )
}

const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  isDarkMode = false,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({
    instagram: '',
    marca: '',
    productos: '',
    diferenciadores: '',
    audiencia: '',
    objetivos: [],
  })
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetchBusinessData()
  }, [])

  const fetchBusinessData = async () => {
    try {
      setLoading(true)
      const userData = localStorage.getItem('userData')

      if (!userData) {
        console.error('No user data found')
        setLoading(false)
        return
      }

      const userId = JSON.parse(userData).id
      const businessData = await BussinessService.getBusinessIdByUserId(userId)

      if (businessData && businessData.length > 0) {
        let parsedObjectives: number[] = []

        if (businessData[0].objective && businessData[0].objective.length > 0) {
          // Properly handle different objective formats
          parsedObjectives = businessData[0].objective
            .map((objective) => {
              try {
                // If objective is a string like '{"N":"3"}', parse it first
                const parsed =
                  typeof objective === 'string'
                    ? JSON.parse(objective)
                    : objective

                // Extract the value from the N property if available
                if (parsed && parsed.N) {
                  return Number(parsed.N)
                } else if (typeof parsed === 'number') {
                  return parsed
                } else if (typeof parsed === 'string') {
                  return Number(parsed)
                }
                return NaN
              } catch (error) {
                // If JSON parsing fails, try to convert directly to number
                return Number(objective)
              }
            })
            .filter((num) => !isNaN(num)) // Filter out any NaN values
        }

        setFormData({
          instagram: businessData[0].instagramAccount || '',
          marca: businessData[0].businessName || '',
          productos: businessData[0].whatTheBusinessSells || '',
          diferenciadores: businessData[0].valueProposition || '',
          audiencia: businessData[0].targetAudience || '',
          objetivos: parsedObjectives,
        })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const actualizarCampo = (
    campo: keyof FormData,
    valor: string | number[]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  const handleSaveChanges = async () => {
    try {
      setLoading(true)
      const userData = localStorage.getItem('userData')

      if (!userData) {
        console.error('No user data found')
        setLoading(false)
        return
      }

      const userId = JSON.parse(userData).id
      const businessData = await BussinessService.getBusinessIdByUserId(userId)

      if (businessData && businessData.length > 0) {
        // Format objectives as objects with N property to match the database structure
        const formattedObjectives = formData.objetivos.map((id) =>
          JSON.stringify({ N: id.toString() })
        )

        const updatedData: BusinessUpdateData = {
          id: businessData[0].id,
          businessName: formData.marca,
          userIDs: businessData[0].userIDs,
          instagramAccount: formData.instagram,
          objective: formattedObjectives, // Use the formatted objectives
          targetAudience: formData.audiencia,
          valueProposition: formData.diferenciadores,
          whatTheBusinessSells: formData.productos,
          productBenefits: businessData[0].productBenefits || '',
        }

        const response = await BussinessService.updateBusiness(updatedData)
        console.log('Business updated successfully:', response)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating business data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function to get the objective text by id

  const getObjetivoTexto = (id: number): string => {
    const objetivo = objetivos.find((obj) => obj.id === id)
    return objetivo ? objetivo.texto : ''
  }

  if (loading) {
    return (
      <div
        className={`flex h-screen items-center justify-center ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}
      >
        <div className="text-center">
          <div
            className={`mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid ${
              isDarkMode
                ? 'border-orange-700 border-r-transparent'
                : 'border-orange-500 border-r-transparent'
            }`}
          ></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Cargando información...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen ${
        isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Contenido Principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    isDarkMode ? 'text-gray-100' : 'text-gray-900'
                  }`}
                >
                  Base de Conocimiento
                </h1>
                <p
                  className={`${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  Información de tu marca y objetivos
                </p>
              </div>
              <button
                onClick={() =>
                  isEditing ? handleSaveChanges() : setIsEditing(true)
                }
                className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-colors hover:bg-opacity-90 ${
                  isDarkMode
                    ? 'bg-orange-700 text-white'
                    : 'bg-orange-500 text-white'
                }`}
                disabled={loading}
              >
                {isEditing ? (
                  <>
                    <Save className="h-5 w-5" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Edit3 className="h-5 w-5" />
                    Editar Información
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              <Card
                className="rounded-lg bg-white p-6 shadow"
                isDarkMode={isDarkMode}
              >
                <div className="mb-4 flex items-center gap-2 text-orange-500">
                  <Instagram className="h-5 w-5" />
                  <h2
                    className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}
                  >
                    Información de la Cuenta
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      className={`mb-1 block text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}
                    >
                      Cuenta de Instagram
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.instagram}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          actualizarCampo('instagram', e.target.value)
                        }
                        className={`w-full rounded-lg px-3 py-2 focus:border-transparent focus:ring-2 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-100 focus:ring-orange-700'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                    ) : (
                      <p
                        className={`${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}
                      >
                        {formData.instagram || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nombre de la Marca
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.marca}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          actualizarCampo('marca', e.target.value)
                        }
                        className={`w-full rounded-lg px-3 py-2 focus:border-transparent focus:ring-2 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-100 focus:ring-orange-700'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                    ) : (
                      <p
                        className={`${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}
                      >
                        {formData.marca || '-'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card
                className="rounded-lg bg-white p-6 shadow"
                isDarkMode={isDarkMode}
              >
                <div className="mb-4 flex items-center gap-2 text-orange-500">
                  <BookOpen className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">
                    Detalles del Negocio
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Productos o Servicios
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.productos}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          actualizarCampo('productos', e.target.value)
                        }
                        className={`w-full rounded-lg px-3 py-2 focus:border-transparent focus:ring-2 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-100 focus:ring-orange-700'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                    ) : (
                      <p
                        className={`${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}
                      >
                        {formData.productos || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Diferenciadores
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.diferenciadores}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          actualizarCampo('diferenciadores', e.target.value)
                        }
                        className={`w-full rounded-lg px-3 py-2 focus:border-transparent focus:ring-2 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-100 focus:ring-orange-700'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                    ) : (
                      <p
                        className={`${
                          isDarkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}
                      >
                        {formData.diferenciadores || '-'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Audiencia Objetivo
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.audiencia}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          actualizarCampo('audiencia', e.target.value)
                        }
                        className={`w-full rounded-lg px-3 py-2 focus:border-transparent focus:ring-2 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-100 focus:ring-orange-700'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      />
                    ) : (
                      <p
                        className={`w-full rounded-lg px-3 py-2 focus:border-transparent focus:ring-2 ${
                          isDarkMode
                            ? 'border-gray-700 bg-gray-800 text-gray-100 focus:ring-orange-700'
                            : 'border-gray-300 focus:ring-orange-500'
                        }`}
                      >
                        {formData.audiencia || '-'}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              <Card
                className="rounded-lg bg-white p-6 shadow"
                isDarkMode={isDarkMode}
              >
                <div className="mb-4 flex items-center gap-2 text-orange-500">
                  <Target className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Objetivos</h2>
                </div>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-4">
                    {objetivos.map((objetivo) => (
                      <button
                        key={objetivo.id}
                        onClick={() => {
                          const updatedObjetivos = formData.objetivos.includes(
                            objetivo.id
                          )
                            ? formData.objetivos.filter(
                                (id) => id !== objetivo.id
                              )
                            : [...formData.objetivos, objetivo.id]
                          actualizarCampo('objetivos', updatedObjetivos)
                        }}
                        className={`flex items-center gap-4 rounded-lg p-4 transition-all ${
                          formData.objetivos.includes(objetivo.id)
                            ? 'border border-orange-500 bg-orange-50'
                            : 'border border-transparent bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className="text-3xl">{objetivo.icono}</div>
                        <div className="text-sm font-medium text-gray-700">
                          {objetivo.texto}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.objetivos && formData.objetivos.length > 0 ? (
                      formData.objetivos.map((objetivoId, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700"
                        >
                          {getObjetivoTexto(objetivoId)}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        No hay objetivos seleccionados
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeBaseView
