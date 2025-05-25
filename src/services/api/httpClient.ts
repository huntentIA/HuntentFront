import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_HUNTENT_URL

if (!apiUrl) {
  throw new Error('API_URL is not defined')
}

const httpClient = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para manejar errores globales
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default httpClient
