import httpClient from './api/httpClient'

// Interfaces recomendadas (deberías crear estas interfaces)
interface TranscribeRequest {
  id: string;
  url: string;
}

interface TranscribeResponse {
  // Ajusta según la respuesta real de tu API
  id?: string;
  status?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result?: any;
  // otros campos que devuelva tu API
}

const TranscribeService = {
  transcribe: async (
    id: string, 
    url: string
  ): Promise<TranscribeResponse> => {
    try {
      const body: TranscribeRequest = { id, url };
      const { data } = await httpClient.post<TranscribeResponse>(
        `/transcribe/process`,
        body
      );
      return data;
    } catch (error) {
      console.error('Error en la transcripción:', error);
      throw error;
    }
  }
}

export default TranscribeService;