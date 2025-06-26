import React from 'react'
import { Video, Eye } from 'lucide-react'
import { useCachedMedia } from '../../../hooks/useCachedMedia'

interface CachedThumbnailProps {
  postId: string
  originalUrl: string | undefined
  contentFormat: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  carouselItemsLength?: number
  isDarkMode?: boolean
  className?: string
  alt?: string
  onClick?: () => void
}

const CachedThumbnail: React.FC<CachedThumbnailProps> = ({
  postId,
  originalUrl,
  contentFormat,
  carouselItemsLength,
  className = "",
  alt = "Content preview",
  onClick
}) => {
  const mediaType = contentFormat === 'VIDEO' ? 'video' : 'image'
  const { url, isLoading, hasError, hasPermanentError, manualCache } = useCachedMedia(
    postId,
    originalUrl,
    mediaType,
    { 
      fallbackUrl: 'https://via.placeholder.com/150',
      autoCache: true 
    }
  )

  const handleError = () => {
    // Solo intentar cargar manualmente si no hay error permanente y no está cargando
    if (!isLoading && !hasPermanentError) {
      manualCache()
    }
  }

  const baseClasses = `relative h-16 w-16 group cursor-pointer overflow-hidden ${className}`

  // Mostrar placeholder de error permanente
  if (hasPermanentError) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">Sin imagen</span>
        </div>
      </div>
    )
  }

  if (contentFormat === 'IMAGE') {
    return (
      <div className={baseClasses} onClick={onClick}>
        {isLoading ? (
          <div className="h-16 w-16 bg-gray-300 rounded flex items-center justify-center animate-pulse">
            <span className="text-gray-500 text-xs">Cargando...</span>
          </div>
        ) : (
          <>
            <img
              src={url}
              alt={alt}
              loading="lazy"
              className="h-16 w-16 rounded object-cover transition-all duration-300 hover:scale-110 group-hover:brightness-110"
              onError={handleError}
            />
            {/* Overlay con icono */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
            {/* Indicador de caché */}
            {!hasError && url !== originalUrl && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" title="Imagen cacheada permanentemente" />
            )}
          </>
        )}
      </div>
    )
  }

  if (contentFormat === 'VIDEO') {
    return (
      <div className={baseClasses} onClick={onClick}>
        {isLoading ? (
          <div className="h-16 w-16 bg-gray-300 rounded flex items-center justify-center animate-pulse">
            <span className="text-gray-500 text-xs">Cargando...</span>
          </div>
        ) : (
          <>
            {url && url.startsWith('blob:') ? (
              // Es un thumbnail generado del video
              <img
                src={url}
                alt="Video thumbnail"
                className="h-16 w-16 rounded object-cover transition-all duration-300 hover:scale-105"
                onError={handleError}
              />
            ) : (
              // Video original o URL fallback
              <video
                src={url}
                className="h-16 w-16 rounded object-cover transition-all duration-300 hover:scale-105"
                preload="metadata"
                muted
                loop
                onMouseEnter={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.play().catch(() => {
                    // Ignorar errores de reproducción
                  });
                }}
                onMouseLeave={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.pause();
                  video.currentTime = 0;
                }}
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).currentTime = 1;
                }}
                onError={handleError}
              />
            )}
            
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-10 transition-all duration-300">
              <Video className="h-6 w-6 text-white drop-shadow-lg opacity-90 group-hover:opacity-60" />
            </div>
            
            {/* Indicador de caché */}
            {!hasError && url !== originalUrl && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" title="Video cacheado permanentemente" />
            )}
          </>
        )}
      </div>
    )
  }

  if (contentFormat === 'CAROUSEL_ALBUM') {
    return (
      <div className={baseClasses} onClick={onClick}>
        {isLoading ? (
          <div className="h-16 w-16 bg-gray-300 rounded flex items-center justify-center animate-pulse">
            <span className="text-gray-500 text-xs">Cargando...</span>
          </div>
        ) : (
          <>
            <img
              src={url}
              alt="First image of carousel"
              loading="lazy"
              className="h-16 w-16 rounded object-cover transition-all duration-300 hover:scale-110 group-hover:brightness-110"
              onError={handleError}
            />
            
            {/* Indicador de carrusel */}
            <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded flex items-center">
              <span className="mr-1">📷</span>
              {carouselItemsLength || '1+'}
            </div>
            
            {/* Overlay con icono */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
            
            {/* Indicador de caché */}
            {!hasError && url !== originalUrl && (
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full" title="Imagen cacheada permanentemente" />
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="h-16 w-16 bg-gray-300 rounded flex items-center justify-center">
      <span className="text-gray-500 text-xs">Sin preview</span>
    </div>
  )
}

export default CachedThumbnail 