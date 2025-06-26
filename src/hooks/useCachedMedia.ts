import { useState, useEffect } from 'react'
import mediaCacheService from '../services/media-cache.service'

interface UseCachedMediaOptions {
  fallbackUrl?: string
  autoCache?: boolean
}

export const useCachedMedia = (
  postId: string,
  originalUrl: string | undefined,
  type: 'image' | 'video',
  options: UseCachedMediaOptions = {}
) => {
  const [cachedUrl, setCachedUrl] = useState<string | undefined>(originalUrl || options.fallbackUrl)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [hasPermanentError, setHasPermanentError] = useState(false)

  useEffect(() => {
    if (!originalUrl || hasPermanentError) {
      setCachedUrl(options.fallbackUrl)
      return
    }

    const loadCachedMedia = async () => {
      // Evitar reintentos infinitos - máximo 2 intentos
      if (attemptCount >= 2) {
        setHasPermanentError(true)
        setCachedUrl(options.fallbackUrl || 'https://via.placeholder.com/150')
        return
      }

      try {
        setIsLoading(true)
        setHasError(false)

        // Primero, intentar obtener de caché
        const cached = await mediaCacheService.getCachedMedia(originalUrl)
        
        if (cached) {
          setCachedUrl(cached)
          setIsLoading(false)
          // Reset del contador si se carga exitosamente
          setAttemptCount(0)
          return
        }

        // Si no está en caché y autoCache está habilitado, cachear ahora
        if (options.autoCache !== false) {
          const newCachedUrl = await mediaCacheService.cacheMedia(postId, originalUrl, type)
          setCachedUrl(newCachedUrl)
          // Reset del contador si se carga exitosamente
          setAttemptCount(0)
        } else {
          setCachedUrl(originalUrl)
        }
      } catch (error) {
        console.error('Error al cargar medio cacheado:', error)
        setHasError(true)
        setAttemptCount(prev => prev + 1)
        
        // Si es el segundo intento fallido, marcar como error permanente
        if (attemptCount >= 1) {
          setHasPermanentError(true)
          setCachedUrl(options.fallbackUrl || 'https://via.placeholder.com/150')
        } else {
          setCachedUrl(originalUrl) // Fallback a URL original en primer intento
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCachedMedia()
  }, [postId, originalUrl, type, options.autoCache, options.fallbackUrl, attemptCount, hasPermanentError])

  const manualCache = async () => {
    if (!originalUrl) return
    
    try {
      setIsLoading(true)
      setHasError(false)
      // Resetear estados de error al intentar manual
      setHasPermanentError(false)
      setAttemptCount(0)
      
      const newCachedUrl = await mediaCacheService.cacheMedia(postId, originalUrl, type)
      setCachedUrl(newCachedUrl)
    } catch (error) {
      console.error('Error al cachear manualmente:', error)
      setHasError(true)
      setHasPermanentError(true)
      setCachedUrl(options.fallbackUrl || 'https://via.placeholder.com/150')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    url: cachedUrl,
    isLoading,
    hasError,
    hasPermanentError,
    manualCache
  }
} 