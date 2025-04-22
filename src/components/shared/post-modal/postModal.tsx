import React, { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { toast } from 'react-toastify'
import transcribeService from '../../../services/transcribe.service'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { Post } from '../../pages/content-planner/interfaces/content-planner'
import postService from '../../../services/post.service'

// Definición de tipos
export type PostStatus = 'APPROVED' | 'REJECTED' | 'PENDING'

interface PostModalProps {
  post: Post | null
  closeModal: () => void
  isOpen: boolean
}

const PostModal: React.FC<PostModalProps> = ({ post, closeModal, isOpen }) => {
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeModal])

  const formatDate = (dateString?: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const getStatusText = (status?: PostStatus): string => {
    switch (status) {
      case 'APPROVED':
        return 'Aprobado'
      case 'REJECTED':
        return 'Rechazado'
      default:
        return 'Sin estado'
    }
  }

  // In PostModal.tsx
const handleApproval = async (post: Post, status: PostStatus): Promise<void> => {
  if (!post) return

  try {
    const success = await postService.updatePostStatus(post.id, status);
    
    if (success) {
      toast.success(
        `El post ha sido ${status === 'APPROVED' ? 'aprobado' : 'rechazado'}.`
      )
      closeModal()
    } else {
      toast.error(
        `Error al ${status === 'APPROVED' ? 'aprobar' : 'rechazar'} el post.`
      )
    }
  } catch (error) {
    console.error('Error en handleApproval:', error)
    toast.error(
      `Error al ${status === 'APPROVED' ? 'aprobar' : 'rechazar'} el post.`
    )
  }
}

  const handleTranscribe = async (): Promise<void> => {
    if (!post || !post.mediaURL || typeof post.mediaURL !== 'string') return

    try {
      setIsTranscribing(true)
      toast.info(
        'Iniciando transcripción. Este proceso puede tomar varios minutos...'
      )

      await transcribeService.transcribe(post.id, post.mediaURL)

      toast.success('La transcripción ha sido iniciada exitosamente')
    } catch (error) {
      toast.error('Error al iniciar la transcripción')
      console.error('Error en transcripción:', error)
    } finally {
      setIsTranscribing(false)
    }
  }

  if (!post || !isOpen) return null

  const {
    mediaURL,
    caption,
    creatorAccount,
    contentFormat,
    likes,
    comments,
    postURL,
    description,
    publicationDate,
    hashtags,
    topics,
    rights,
    cta,
    status,
    videoTranscript,
    carousel_items,
  } = post

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
  }

  const renderMedia = (): React.ReactNode => {
    if (!mediaURL && !carousel_items) {
      return <div className="aspect-square w-full rounded-lg bg-gray-100" />
    }

    if (contentFormat === 'CAROUSEL_ALBUM' && post.carousel_items && Array.isArray(post.carousel_items) && post.carousel_items.length > 0) {
      return (
        <Slider {...carouselSettings} className="mb-4">
          {Array.from({length: post.carousel_items.length}).map((_, index) => {
            const item = post.carousel_items?.[index] as unknown as {media_url: string};
            if (!item || !item.media_url) return null;
            
            return (
              <div key={index} className="outline-none">
                <img
                  src={item.media_url}
                  alt={`Slide ${index + 1}`}
                  className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
                />
              </div>
            );
          })}
        </Slider>
      )
    }

    if (contentFormat === 'VIDEO') {
      return (
        <>
          <video
            controls
            className={`w-full rounded-lg bg-gray-100 ${typeof mediaURL === 'string' && mediaURL.includes('reel') ? 'aspect-[9/16]' : 'aspect-square'} object-cover`}
          >
            <source
              src={typeof mediaURL === 'string' ? mediaURL : ''}
              type="video/mp4"
            />
            Tu navegador no soporta el elemento de video.
          </video>

          <div className="mt-4 space-y-2">
            <h3 className="text-sm text-gray-600">Transcripción del video</h3>
            {videoTranscript ? (
              <div className="min-h-[100px] rounded-lg bg-gray-100 p-3">
                {videoTranscript}
              </div>
            ) : (
              <div className="space-y-2">
                {isTranscribing ? (
                  <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
                    Transcribiendo el video... Este proceso puede tomar varios
                    minutos.
                  </div>
                ) : (
                  <button
                    onClick={handleTranscribe}
                    className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                    disabled={isTranscribing}
                  >
                    Transcribir video
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )
    }

    if (contentFormat === 'IMAGE') {
      return (
        <img
          src={typeof mediaURL === 'string' ? mediaURL : Array.isArray(mediaURL) ? mediaURL[0] : ''}
          alt={caption || 'Imagen del post'}
          className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
        />
      )
    }

    return <div className="aspect-square w-full rounded-lg bg-gray-100" />
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeModal}
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          className="w-full max-w-2xl rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-xl font-semibold">Detalle de contenido</h2>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">@{creatorAccount}</span>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-purple-500 px-3 py-1 text-sm text-white">
                          {contentFormat || 'Formato'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {renderMedia()}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="mt-1 text-sm font-semibold text-gray-600">
                        Analytics
                      </span>
                    </div>
                  </div>
                  <div className="h-fit rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700">
                    {getStatusText(status as PostStatus)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-gray-100 p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">👥</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">
                          Interacciones
                        </span>
                        <span className="text-sm text-gray-500">
                          {typeof likes === 'number'
                            ? likes.toLocaleString()
                            : '#'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-100 p-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">💬</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-600">
                          Comentarios
                        </span>
                        <span className="text-sm text-gray-500">
                          {typeof comments === 'number'
                            ? comments.toLocaleString()
                            : '#'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm text-gray-600">Descripción</h3>
                  <div className="min-h-[80px] rounded-lg bg-gray-100 p-3">
                    {description || 'No hay descripción.'}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm text-gray-600">Hashtags</h3>
                  <div className="max-h-[120px] min-h-[40px] overflow-y-auto rounded-lg bg-gray-100 p-3">
                    {hashtags || 'No hay hashtags.'}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm text-gray-600">
                    Fecha y hora de publicación
                  </h3>
                  <div className="min-h-[40px] rounded-lg bg-gray-100 p-3">
                    {formatDate(publicationDate) || 'No hay fecha y hora de publicación.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="mb-2 text-sm text-gray-600">Gancho</h3>
                    <div className="min-h-[40px] rounded-lg bg-gray-100 p-3">
                      {rights || 'No hay gancho.'}
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm text-gray-600">CTA</h3>
                    <div className="min-h-[40px] rounded-lg bg-gray-100 p-3">
                      {cta || 'No hay CTA.'}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm text-gray-600">
                    Temas de los que habla
                  </h3>
                  <div className="min-h-[60px] rounded-lg bg-gray-100 p-3">
                    {topics || 'No hay temas.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex items-center justify-between gap-4 border-t p-4">
            {/* Botón de Instagram */}
            {postURL && (
              <a
                href={postURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white transition-opacity hover:opacity-90"
              >
                Ver en Instagram
                <ExternalLink size={16} />
              </a>
            )}

            {/* Botones de aprobación */}
            {status !== 'APPROVED' && (
            <div className="flex gap-4">
              <button
                onClick={() => handleApproval(post,'REJECTED')}
                className="rounded-lg bg-pink-500 px-6 py-2 text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status === 'REJECTED'}
              >
                RECHAZAR
              </button>
              <button
                onClick={() => handleApproval(post, 'APPROVED')}
                className="rounded-lg bg-green-500 px-6 py-2 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={status === 'APPROVED'}
              >
                APROBAR
              </button>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostModal
