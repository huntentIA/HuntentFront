import React from 'react'

// Definimos la interfaz para las props
interface CustomerStatsCardProps {
  customerData?: {
    average_engagement: number
    total_account_interactions_last_25_publications?: number
  }
  isDarkMode: boolean
}

/**
 * Componente que muestra las estadísticas del cliente en una tarjeta
 * @param customerData - Datos del cliente
 * @param isDarkMode - Indica si el tema oscuro está activado
 */
export const CustomerStatsCard: React.FC<CustomerStatsCardProps> = ({
  customerData,
  isDarkMode,
}) => {
  // Verificación temprana para retornar null en lugar de false
  if (!customerData) {
    return null // En React se debe retornar null en lugar de false para no renderizar nada
  }

  return (
    <div
      className={`rounded-lg p-4 shadow-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
    >
      <h2 className="mb-4 text-xl font-bold">Estadísticas del Cliente</h2>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Engagement Promedio:</span>
          <span>{(customerData.average_engagement * 100).toFixed(2)}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Interacciones Promedio (últimas 25 publicaciones):
          </span>
          <span>
            {customerData.total_account_interactions_last_25_publications?.toLocaleString() ||
              0}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CustomerStatsCard
