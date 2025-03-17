// src/services/transcribe.ts

import httpClient from './api/httpClient'

interface TranscribeService {
  transcribe: (postId: string, mediaUrl: string) => Promise<unknown>
}

const transcribeService: TranscribeService = {
  transcribe: async (postId: string, mediaUrl: string): Promise<unknown> => {
    try {
      const response = await httpClient.post('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          mediaUrl,
        }),
      })
      return response.data
    } catch (error) {
      console.error('Error al transcribir la publicación:', error)
      throw error
    }
  },
}

export default transcribeService
