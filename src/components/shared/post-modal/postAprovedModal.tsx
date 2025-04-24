import React, { useEffect, useState } from 'react'
import { X, ChevronDown, ChevronUp, Edit, Sparkles, Check } from 'lucide-react'
import { toast } from 'react-toastify'
import transcribeService from '../../../services/transcribe.service'
import businessPostService from '../../../services/business-post.service'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import { Post } from '../../pages/content-planner/interfaces/content-planner'
import postService from '../../../services/post.service'

// Definición de tipos
export type PostStatus = 'APPROVED'

interface PostAprovedModalProps {
  post: Post | null
  closeModal: () => void
  isOpen: boolean
  isDarkMode?: boolean
}

const PostAprovedModal: React.FC<PostAprovedModalProps> = ({
  post,
  closeModal,
  isOpen,
}) => {
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false)
  const [captionExpanded, setCaptionExpanded] = useState<boolean>(true)
  const [transcriptionExpanded, setTranscriptionExpanded] =
    useState<boolean>(false)
  const [analysisExpanded, setAnalysisExpanded] = useState<boolean>(false)
  const [contentAnalysisExpanded, setContentAnalysisExpanded] = useState<boolean>(false)
  
  // Estados para la edición
  const [isEditingAdaptation, setIsEditingAdaptation] = useState<boolean>(false)
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false)
  const [adaptationText, setAdaptationText] = useState<string>('')
  const [captionText, setCaptionText] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [currentPost, setCurrentPost] = useState<Post | null>(post)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeModal])

  useEffect(() => {
    // Inicializar los campos de texto con los datos del post
    if (post) {
      setCurrentPost(post)
      setAdaptationText(post.content_adapter || '')
      setCaptionText(post.caption || '')
    }
  }, [post])

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

  const reloadPost = async () => {
    if (!currentPost || !currentPost.id) return

    try {
      // Obtener datos actualizados del post
      const updatedPost = await postService.getPostById(currentPost.id)
      
      // Actualizar el estado con los nuevos datos
      setCurrentPost(updatedPost)
      
      // Actualizar los campos de texto con la información actualizada
      setAdaptationText(updatedPost.content_adapter || '')
      setCaptionText(updatedPost.caption || '')
    } catch (error) {
      console.error('Error al recargar la información del post:', error)
      toast.error('No se pudo actualizar la información del post')
    }
  }

  const handleTranscribe = async (): Promise<void> => {
    if (!currentPost || !currentPost.mediaURL || typeof currentPost.mediaURL !== 'string') return

    try {
      setIsTranscribing(true)
      toast.info(
        'Iniciando transcripción. Este proceso puede tomar varios minutos...'
      )

      await transcribeService.transcribe(currentPost.id, currentPost.mediaURL)

      toast.success('La transcripción ha sido iniciada exitosamente')
      
      // Recargar la información del post después de la transcripción
      await reloadPost()
    } catch (error) {
      toast.error('Error al iniciar la transcripción')
      console.error('Error en transcripción:', error)
    } finally {
      setIsTranscribing(false)
    }
  }

  // Manejadores para guardar ediciones
  const handleSaveAdaptation = async () => {
    if (!currentPost || !currentPost.businessPostId) {
      toast.error('No se pudo identificar el post')
      return
    }
    
    try {
      setIsProcessing(true)
      
      await businessPostService.updateContentAdapter(currentPost.businessPostId, {
        description: currentPost.description || '',
        brand_tone_business: currentPost.brand_tone_business || '',
        target_audience_business: currentPost.target_audience_business || '', 
        objective: currentPost.content_objectives || [],
        contentFormat: currentPost.contentFormat || '',
        content_topics: currentPost.content_topics || [],
        pain_or_desire: [currentPost.pain_or_desire || { pain: '', desire: '' }],
        content_adapter: adaptationText,
        use_ai: false
      })
      
      setIsEditingAdaptation(false)
      toast.success('Adaptación guardada correctamente')
      
      // Recargar la información del post
      await reloadPost()
    } catch (error) {
      toast.error('Error al guardar la adaptación')
      console.error('Error al guardar la adaptación:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateAIAdaptation = async () => {
    if (!currentPost || !currentPost.businessPostId) {
      toast.error('No se pudo identificar el post')
      return
    }
    
    try {
      setIsProcessing(true)
      toast.info('Generando adaptación con IA...')
      
      await businessPostService.updateContentAdapter(currentPost.businessPostId, {
        description: currentPost.description || '',
        brand_tone_business: currentPost.brand_tone_business || '',
        target_audience_business: currentPost.target_audience_business || '',
        objective: currentPost.content_objectives || [],
        contentFormat: currentPost.contentFormat || '',
        content_topics: currentPost.content_topics || [],
        pain_or_desire: [currentPost.pain_or_desire || { pain: '', desire: '' }],
        use_ai: true
      })
      
      toast.success('Adaptación con IA generada correctamente')
      
      // Recargar la información del post
      await reloadPost()
    } catch (error) {
      toast.error('Error al generar la adaptación con IA')
      console.error('Error al generar adaptación con IA:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSaveCaption = async () => {
    if (!currentPost || !currentPost.businessPostId) {
      toast.error('No se pudo identificar el post')
      return
    }
    
    try {
      setIsProcessing(true)
      
      // Aquí implementaríamos la lógica para guardar el caption
      // Por ahora solo indicamos éxito
      setIsEditingCaption(false)
      toast.success('Caption optimizado guardado correctamente')
      
      // Recargar la información del post
      await reloadPost()
    } catch (error) {
      toast.error('Error al guardar el caption')
      console.error('Error al guardar el caption:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGenerateAICaption = async () => {
    if (!currentPost || !currentPost.businessPostId) {
      toast.error('No se pudo identificar el post')
      return
    }
    
    try {
      setIsProcessing(true)
      toast.info('Generando caption con IA...')
      
      // Aquí implementaríamos la lógica para generar el caption con IA
      // Por ahora solo indicamos éxito
      toast.success('Caption generado con IA correctamente')
      
      // Recargar la información del post
      await reloadPost()
    } catch (error) {
      toast.error('Error al generar el caption con IA')
      console.error('Error al generar caption con IA:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditAdaptation = () => {
    setIsEditingAdaptation(true);
    // El focus automático ocurrirá al renderizar sin necesidad de useEffect
  };

  if (!currentPost || !isOpen) return null
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
    videoTranscript,
    status,
    carousel_items,
    global_content_analysis,
    hook,
    pain_or_desire,
    narrative_structure,
    call_to_action,
    downloadable_type,
    content_adapter,
    content_objectives,
  } = currentPost

  // Valor fijo para engagement de demostración
  const engagement = 4.8

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

    if (
      contentFormat === 'CAROUSEL_ALBUM' &&
      currentPost.carousel_items &&
      Array.isArray(currentPost.carousel_items) &&
      currentPost.carousel_items.length > 0
    ) {
      return (
        <Slider {...carouselSettings} className="mb-4">
          {Array.from({ length: currentPost.carousel_items.length }).map(
            (_, index) => {
              const item = currentPost.carousel_items?.[index] as unknown as {
                media_url: string
              }
              if (!item || !item.media_url) return null

              return (
                <div key={index} className="outline-none">
                  <img
                    src={item.media_url}
                    alt={`Slide ${index + 1}`}
                    className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
                  />
                </div>
              )
            }
          )}
        </Slider>
      )
    }

    if (contentFormat === 'VIDEO') {
      return (
        <>
          <video
            controls
            className={`w-full rounded-lg bg-gray-100 ${
              typeof mediaURL === 'string' && mediaURL.includes('reel')
                ? 'aspect-[9/16]'
                : 'aspect-square'
            } object-cover`}
          >
            <source
              src={typeof mediaURL === 'string' ? mediaURL : ''}
              type="video/mp4"
            />
            Tu navegador no soporta el elemento de video.
          </video>
        </>
      )
    }

    if (contentFormat === 'IMAGE') {
      return (
        <img
          src={
            typeof mediaURL === 'string'
              ? mediaURL
              : Array.isArray(mediaURL)
                ? mediaURL[0]
                : ''
          }
          alt={caption || 'Imagen del post'}
          className="aspect-square w-full rounded-lg bg-gray-100 object-cover"
        />
      )
    }

    return <div className="aspect-square w-full rounded-lg bg-gray-100" />
  }

  // Componente para secciones colapsables
  const CollapsibleSection = ({
    title,
    expanded,
    setExpanded,
    children,
    icon,
  }: {
    title: string
    expanded: boolean
    setExpanded: (value: boolean) => void
    children: React.ReactNode
    icon?: React.ReactNode
  }) => (
    <div className="mb-4 overflow-hidden rounded-md border border-gray-200">
      <div
        className="flex cursor-pointer items-center justify-between bg-white p-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-medium">{title}</h3>
        </div>
        <button className="rounded-full p-1">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-gray-200 bg-white p-4">{children}</div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="{fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeModal}
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          className="w-full max-w-5xl rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center">
              <h2 className="text-xl font-medium">Detalle de contenido</h2>
              <span className="ml-2 rounded-full bg-gray-800 px-2 py-1 text-xs text-white">
                {contentFormat}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className="rounded-full bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600">
                {status === 'APPROVED' ? 'Aprobado' : 'Aprobar'}
              </button>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4 text-xs text-gray-500">
            Vista detallada del contenido seleccionado
          </div>

          {/* Content - Two Column Layout */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 pb-4">

            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              {/* Título del contenido */}
              <h1 className="mb-4 text-lg font-semibold">
                  {hook}
              </h1>
            </div>

            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              {content_objectives?.map((objective, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800"
                >
                  <span className="mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    Ⓘ
                  </span>
                  {objective}
                </span>
              ))}
            </div>

            {/* Author info */}
            <div className="mb-6 flex items-center">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-800">
                👤
              </div>
              <div>
                <div className="font-medium">
                  @{creatorAccount || ''}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(publicationDate) || ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Left Column - Media content */}
              <div>
                {/* Stats */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {typeof likes === 'number'
                        ? likes.toLocaleString()
                        : ' no aplica'}
                    </div>
                    <div className="text-xs text-gray-500">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {typeof comments === 'number'
                        ? comments.toLocaleString()
                        : ' no aplica'}
                    </div>
                    <div className="text-xs text-gray-500">Comentarios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">{`${engagement}%`}</div>
                    <div className="text-xs text-gray-500">Engagement</div>
                  </div>
                </div>

                {/* Media */}
                <div className="mb-6">{renderMedia()}</div>

                {/* Instagram Link */}
                {postURL && (
                  <div className="mb-6 mt-4">
                    <a
                      href={postURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-500 p-2 text-white transition-opacity hover:opacity-90"
                    >
                      <span className="mr-1">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M9 3H15C17.2091 3 19 4.79086 19 7V17C19 19.2091 17.2091 21 15 21H9C6.79086 21 5 19.2091 5 17V7C5 4.79086 6.79086 3 9 3Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="12" cy="17" r="1" fill="currentColor" />
                        </svg>
                      </span>
                      Ver en Instagram
                    </a>
                    {/* Notas */}
                    <div className="mb-4 mt-6">
                      <h3 className="mb-2 text-sm font-medium">Notas</h3>
                      <textarea
                        className="w-full rounded-md border border-gray-300 p-3"
                        rows={3}
                        placeholder="Añadir notas sobre este contenido..."
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details and collapsible sections */}
              <div>
                {/* Secciones colapsables */}
                <CollapsibleSection
                  title="Caption Original"
                  expanded={captionExpanded}
                  setExpanded={setCaptionExpanded}
                >
                  <p>
                    {description ||
                      'No aplica'}
                  </p>
                </CollapsibleSection>

                {contentFormat === 'VIDEO' && (
                  <CollapsibleSection
                    title="Transcripción"
                    expanded={transcriptionExpanded}
                    setExpanded={setTranscriptionExpanded}
                    icon={<span className="text-gray-600">📝</span>}
                  >
                    {videoTranscript ? (
                      <p>{videoTranscript}</p>
                    ) : (
                      <div className="space-y-2">
                        {isTranscribing ? (
                          <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
                            Transcribiendo el video... Este proceso puede tomar
                            varios minutos.
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
                  </CollapsibleSection>
                )}

                <CollapsibleSection
                  title="Análisis del Contenido"
                  expanded={contentAnalysisExpanded}
                  setExpanded={setContentAnalysisExpanded}
                  icon={<span className="text-gray-600">📊</span>}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium">Hook</h4>
                        <p className="text-sm text-gray-600">{hook}</p>
                      </div>
                      <div>
                        <h4 className="font-medium">Call to Action</h4>
                        <p className="text-sm text-gray-600">{call_to_action || 'No aplica'}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium">Descargable</h4>
                      <p className="text-sm text-gray-600">{downloadable_type ? 'Sí - Plantilla para organizar contenido semanal' : 'No aplica'}</p>
                    </div>

                    <div>
                      <h4 className="font-medium">Estructura Narrativa</h4>
                      <p className="text-sm text-gray-600">{narrative_structure}</p>
                    </div>

                    <div>
                      <h4 className="font-medium">Dolor/Deseo Abordado</h4>
                      {pain_or_desire.desire && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Deseo:</span> {pain_or_desire.desire}
                        </p>
                      )}
                      {pain_or_desire.pain && pain_or_desire.pain !== "No hay información suficiente para determinarlo" && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Dolor:</span> {pain_or_desire.pain}
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-medium">Análisis del Contenido</h4>
                      <p className="text-sm text-gray-600">{global_content_analysis}</p>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection
                  title="Adaptación del contenido"
                  expanded={analysisExpanded}
                  setExpanded={setAnalysisExpanded}
                  icon={<span className="text-gray-600">📊</span>}
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Adaptación</h4>
                      <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                        {isEditingAdaptation ? (
                          <textarea
                            className="w-full p-2 border rounded-md"
                            value={adaptationText}
                            onChange={(e) => setAdaptationText(e.target.value)}
                            rows={4}
                            autoFocus
                            onFocus={(e) => {
                              // Asegurar que el cursor se posicione al final
                              const val = e.target.value;
                              e.target.value = '';
                              e.target.value = val;
                            }}
                          />
                        ) : (
                          <div className="text-sm">
                            {content_adapter || 'No hay adaptación disponible'}
                          </div>
                        )}
                        <div className="flex space-x-2 ml-2">
                          {isEditingAdaptation ? (
                            <button 
                              onClick={handleSaveAdaptation}
                              className="rounded border border-green-300 p-1 text-green-600 hover:text-green-900 bg-green-50"
                              disabled={isProcessing}
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={handleEditAdaptation}
                              className="rounded border border-gray-300 p-1 text-gray-600 hover:text-gray-900"
                              disabled={isProcessing}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button 
                            onClick={handleGenerateAIAdaptation}
                            className="rounded border border-gray-300 p-1 text-gray-600 hover:text-gray-900"
                            disabled={isProcessing}
                          >
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Caption Optimizado
                      </h4>
                      <div className="flex items-center justify-between rounded-md bg-gray-50 p-3">
                        {isEditingCaption ? (
                          <textarea
                            className="w-full p-2 border rounded-md"
                            value={captionText}
                            onChange={(e) => setCaptionText(e.target.value)}
                            rows={4}
                            autoFocus
                            onFocus={(e) => {
                              // Asegurar que el cursor se posicione al final
                              const val = e.target.value;
                              e.target.value = '';
                              e.target.value = val;
                            }}
                          />
                        ) : (
                          <div className="text-sm">
                            {captionText || 'No hay caption optimizado disponible'}
                          </div>
                        )}
                        <div className="flex space-x-2 ml-2">
                          {isEditingCaption ? (
                            <button 
                              onClick={handleSaveCaption}
                              className="rounded border border-green-300 p-1 text-green-600 hover:text-green-900 bg-green-50"
                              disabled={isProcessing}
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => setIsEditingCaption(true)}
                              className="rounded border border-gray-300 p-1 text-gray-600 hover:text-gray-900"
                              disabled={isProcessing}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          <button 
                            onClick={handleGenerateAICaption}
                            className="rounded border border-gray-300 p-1 text-gray-600 hover:text-gray-900"
                            disabled={isProcessing}
                          >
                            <Sparkles size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="mb-2 text-sm font-medium">Afinidad</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="mb-1 flex justify-between">
                            <span className="text-xs">Público</span>
                            <span className="text-xs font-medium">85%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-orange-500"
                              style={{ width: '85%' }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between">
                            <span className="text-xs">Temas</span>
                            <span className="text-xs font-medium">92%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-orange-500"
                              style={{ width: '92%' }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between">
                            <span className="text-xs">Tono de marca</span>
                            <span className="text-xs font-medium">78%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-200">
                            <div
                              className="h-1.5 rounded-full bg-orange-500"
                              style={{ width: '78%' }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between border-t pt-4"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostAprovedModal
