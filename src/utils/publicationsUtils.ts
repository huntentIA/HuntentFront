// Utility functions for publications

// Get color for objective
export function getObjetivoColor(objetivo: string) {
    switch (objetivo.toLowerCase()) {
      case 'crecimiento':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'conexión':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'conversión':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }
  
  // Get color for status
  export function getEstadoColor(estado: string) {
    switch (estado.toLowerCase()) {
      case 'aprobado':
        return 'bg-green-500 hover:bg-green-600';
      case 'pendiente':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'rechazado':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  }