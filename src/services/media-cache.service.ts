interface CachedMedia {
  id: string
  originalUrl: string
  blob: Blob
  type: 'image' | 'video'
  cachedAt: number
  postId: string
}

class MediaCacheService {
  private dbName = 'MediaCache'
  private version = 1
  private storeName = 'media'

  // Inicializar la base de datos IndexedDB
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('postId', 'postId', { unique: false })
          store.createIndex('originalUrl', 'originalUrl', { unique: true })
        }
      }
    })
  }

  // Generar thumbnail para video
  private async generateVideoThumbnail(videoBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.onloadedmetadata = () => {
        // Configurar dimensiones del canvas (thumbnail de 300x300)
        canvas.width = 300
        canvas.height = 300
        
        // Posicionar en el segundo 1 del video
        video.currentTime = 1
      }
      
      video.onseeked = () => {
        if (ctx) {
          // Dibujar el frame del video en el canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Convertir a blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('No se pudo generar el thumbnail'))
            }
          }, 'image/jpeg', 0.8)
        }
      }
      
      video.onerror = () => reject(new Error('Error al cargar el video'))
      video.src = URL.createObjectURL(videoBlob)
    })
  }

  // Descargar y cachear un medio
  async cacheMedia(postId: string, originalUrl: string, type: 'image' | 'video'): Promise<string> {
    try {
      // Verificar si ya está cacheado
      const existing = await this.getCachedMedia(originalUrl)
      if (existing) {
        return existing
      }

      // Verificar que la URL sea válida
      if (!originalUrl || !originalUrl.startsWith('http')) {
        throw new Error('URL inválida para cachear')
      }

      // Descargar el archivo original con timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos timeout

      const response = await fetch(originalUrl, {
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.status} ${response.statusText}`)
      }

      // Verificar que el contenido sea el tipo esperado
      const contentType = response.headers.get('content-type')
      if (type === 'image' && !contentType?.startsWith('image/')) {
        throw new Error('El contenido no es una imagen válida')
      }
      if (type === 'video' && !contentType?.startsWith('video/')) {
        throw new Error('El contenido no es un video válido')
      }

      const blob = await response.blob()
      
      // Verificar que el blob no esté vacío
      if (blob.size === 0) {
        throw new Error('El archivo descargado está vacío')
      }

      let finalBlob = blob

      // Si es video, generar thumbnail
      if (type === 'video') {
        try {
          finalBlob = await this.generateVideoThumbnail(blob)
        } catch (error) {
          console.warn('No se pudo generar thumbnail del video:', error)
          throw new Error('No se pudo procesar el video')
        }
      }

      // Guardar en IndexedDB
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const cachedMedia: CachedMedia = {
        id: `${postId}_${Date.now()}`,
        originalUrl,
        blob: finalBlob,
        type,
        cachedAt: Date.now(),
        postId
      }
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(cachedMedia)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      // Retornar la URL del blob cacheado
      return URL.createObjectURL(finalBlob)
      
    } catch (error) {
      console.error('Error al cachear medio:', error)
      // Re-lanzar el error para que el hook pueda manejarlo
      throw error
    }
  }

  // Obtener medio cacheado
  async getCachedMedia(originalUrl: string): Promise<string | null> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('originalUrl')
      
      return new Promise((resolve) => {
        const request = index.get(originalUrl)
        request.onsuccess = () => {
          const result = request.result as CachedMedia
          if (result) {
            resolve(URL.createObjectURL(result.blob))
          } else {
            resolve(null)
          }
        }
        request.onerror = () => resolve(null)
      })
    } catch (error) {
      console.error('Error al obtener medio cacheado:', error)
      return null
    }
  }

  // Limpiar caché viejo (más de 30 días)
  async cleanOldCache(): Promise<void> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      
      const request = store.getAll()
      request.onsuccess = () => {
        const results = request.result as CachedMedia[]
        results.forEach(item => {
          if (item.cachedAt < thirtyDaysAgo) {
            store.delete(item.id)
          }
        })
      }
    } catch (error) {
      console.error('Error al limpiar caché:', error)
    }
  }

  // Obtener estadísticas del caché
  async getCacheStats(): Promise<{ totalItems: number; totalSize: number }> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve) => {
        const request = store.getAll()
        request.onsuccess = () => {
          const results = request.result as CachedMedia[]
          const totalItems = results.length
          const totalSize = results.reduce((sum, item) => sum + item.blob.size, 0)
          resolve({ totalItems, totalSize })
        }
        request.onerror = () => resolve({ totalItems: 0, totalSize: 0 })
      })
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return { totalItems: 0, totalSize: 0 }
    }
  }
}

export default new MediaCacheService() 