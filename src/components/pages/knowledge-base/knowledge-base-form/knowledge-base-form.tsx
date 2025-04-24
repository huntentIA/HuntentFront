import React, { JSX, useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Instagram } from 'lucide-react';
import registerService from '../../../../services/register.service'; // Asumiendo la misma ubicación que en el componente RegisterPage

// Interfaces
interface Objetivo {
  id: number;
  texto: string;
  icono: string;
}

interface FormData {
  instagramAccount: string;
  businessName: string;
  whatTheBusinessSells: string;
  valueProposition: string;
  targetAudience: string;
  brandTone: string;
  allowControversialTopics: boolean;
  objective: number[];
}

interface BusinessKnowledgeRequest {
  instagramAccount: string;
  businessName: string;
  whatTheBusinessSells: string;
  valueProposition: string;
  targetAudience: string;
  brandTone: string;
  allowControversialTopics: boolean;
  objective: number[];
  userIDs: string[];
}

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const objetivos: Objetivo[] = [
  { id: 1, texto: "Aumentar las ventas", icono: "💰" },
  { id: 2, texto: "Posicionar la marca", icono: "🎯" },
  { id: 3, texto: "Educar a los clientes", icono: "📚" },
  { id: 4, texto: "Convertirme en influenciador", icono: "⭐" },
  { id: 5, texto: "Generar comunidad", icono: "👥" },
  { id: 6, texto: "Mostrar productos/servicios", icono: "🛍️" }
];

const tonos = [
  { id: "Inspirador", descripcion: "Emocional, motivador, busca elevar y conectar." },
  { id: "Académico", descripcion: "Preciso, estructurado, orientado a datos o teoría." },
  { id: "Casual/Amigable", descripcion: "Cercano, relajado, como hablar con un amigo." },
  { id: "Corporativo", descripcion: "Formal, técnico, enfocado en profesionalismo." },
  { id: "Controversial", descripcion: "Provocador, desafía lo establecido, rompe creencias." },
  { id: "Divertido/Entretenido", descripcion: "Alegre, usa humor o recursos virales." },
  { id: "Directo y Práctico", descripcion: "Claro, sin rodeos, con consejos aplicables." },
  { id: "Vulnerable/Auténtico", descripcion: "Humano, muestra errores, emociones o reflexiones personales." },
  { id: "Ambicioso/Competitivo", descripcion: "Se enfoca en éxito, metas, rendimiento o liderazgo." },
  { id: "Espiritual/Reflexivo", descripcion: "Tono profundo, conectado con propósito, valores o conciencia." }
];

const KnowledgeBaseForm: React.FC = () => {
  const [paso, setPaso] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>({
    instagramAccount: '',
    businessName: '',
    whatTheBusinessSells: '',
    valueProposition: '',
    targetAudience: '',
    brandTone: '',
    allowControversialTopics: false,
    objective: []
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const totalPasos: number = 8;

  const actualizarFormData = (campo: keyof FormData, valor: string | number[] | boolean): void => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
    // Limpiar mensaje de error cuando el usuario comienza a escribir
    setError('');
  };

  const toggleObjetivo = (id: number): void => {
    setFormData(prev => {
      const objetivosActuales = prev.objective.includes(id)
        ? prev.objective.filter(obj => obj !== id) 
        : [...prev.objective, id];                 
      return { ...prev, objective: objetivosActuales };
    });
    setError('');
  };

  const validarPasoActual = (): boolean => {
    switch (paso) {
      case 1:
        if (!formData.instagramAccount.trim()) {
          setError('Por favor, ingresa tu cuenta de Instagram');
          return false;
        }
        break;
      case 2:
        if (!formData.businessName.trim()) {
          setError('Por favor, ingresa el nombre de tu marca');
          return false;
        }
        break;
      case 3:
        if (!formData.whatTheBusinessSells.trim()) {
          setError('Por favor, describe tus productos o servicios');
          return false;
        }
        break;
      case 4:
        if (!formData.valueProposition.trim()) {
          setError('Por favor, ingresa qué hace única a tu marca');
          return false;
        }
        break;
      case 5:
        if (!formData.targetAudience.trim()) {
          setError('Por favor, describe tu audiencia');
          return false;
        }
        break;
      case 6:
        if (!formData.brandTone) {
          setError('Por favor, selecciona un tono de marca');
          return false;
        }
        break;
      case 7:
        // No hay validación para allowControversialTopics ya que es un toggle
        // y siempre tiene un valor (true o false)
        break;
      case 8:
        if (formData.objective.length === 0) {
          setError('Por favor, selecciona al menos un objetivo');
          return false;
        }
        break;
    }
    return true;
  };

  const siguientePaso = (): void => {
    if (validarPasoActual()) {
      if (paso === totalPasos) {
        guardarInformacion();
      } else {
        setPaso(p => Math.min(p + 1, totalPasos));
      }
    }
  };

  const pasoAnterior = (): void => setPaso(p => Math.max(p - 1, 1));

  const guardarInformacion = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      // Obtenemos el ID del usuario actual (esto depende de cómo manejas la autenticación)
      // Ejemplo: podría venir del localStorage, contexto de autenticación, etc.
      const userId = localStorage.getItem('userData') || '';
      const id = userId ? JSON.parse(userId).id : '';
      
      if (!userId) {
        throw new Error('No se pudo identificar al usuario');
      }
      
      // Preparar los datos para enviar al servicio
      const businessKnowledgeData: BusinessKnowledgeRequest = {
        ...formData,
        userIDs: [id],
      };
      
      // Llamar al servicio para guardar la información
      // Asumiendo que hay un método similar al businessRegister pero para knowledge base
      await registerService.businessRegister(businessKnowledgeData);
      
      setSuccess(true);
      // Podrías redirigir al usuario o mostrar un mensaje de éxito
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Error al guardar la información');
      } else {
        setError('Error al guardar la información');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPregunta = (): JSX.Element | null => {
    switch (paso) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Instagram className="w-5 h-5" />
              <h3 className="font-semibold">Cuenta de Instagram</h3>
            </div>
            <input
              type="text"
              value={formData.instagramAccount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => actualizarFormData('instagramAccount', e.target.value)}
              placeholder="@tucuenta"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿Cuál es el nombre de tu marca?</h3>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => actualizarFormData('businessName', e.target.value)}
              placeholder="Tu marca"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿Qué productos o servicios ofreces?</h3>
            <textarea
              value={formData.whatTheBusinessSells}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actualizarFormData('whatTheBusinessSells', e.target.value)}
              placeholder="Describe tus productos o servicios principales"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32 resize-none"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿Qué hace única a tu marca frente a la competencia?</h3>
            <textarea
              value={formData.valueProposition}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actualizarFormData('valueProposition', e.target.value)}
              placeholder="Cuéntanos qué te diferencia de los demás"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32 resize-none"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿A quién le hablas a través de tu cuenta en Instagram?</h3>
            <textarea
              value={formData.targetAudience}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actualizarFormData('targetAudience', e.target.value)}
              placeholder="Describe tu audiencia ideal con el mayor detalle posible"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32 resize-none"
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿Cuál es el tono de comunicación de tu marca?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tonos.map(tono => (
                <button
                  key={tono.id}
                  onClick={() => actualizarFormData('brandTone', tono.id)}
                  className={`p-4 rounded-lg border transition-all text-left ${
                    formData.brandTone === tono.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="font-medium mb-1">{tono.id}</div>
                  <div className="text-sm text-gray-600">{tono.descripcion}</div>
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿Tu marca aborda temas polémicos o controversiales?</h3>
            <p className="text-gray-600 mb-6">Esto nos ayudará a entender mejor qué tipo de contenido es apropiado para tu audiencia.</p>
            
            <div className="flex items-center justify-center space-x-10">
              <button
                onClick={() => actualizarFormData('allowControversialTopics', true)}
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                  formData.allowControversialTopics
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-2">✅</div>
                <div className="font-medium">Sí</div>
                <div className="text-sm text-gray-600 text-center mt-1">Mi marca aborda temas polémicos</div>
              </button>
              
              <button
                onClick={() => actualizarFormData('allowControversialTopics', false)}
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                  !formData.allowControversialTopics
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="text-2xl mb-2">❌</div>
                <div className="font-medium">No</div>
                <div className="text-sm text-gray-600 text-center mt-1">Mi marca evita temas polémicos</div>
              </button>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">¿Qué quieres lograr con la publicación de contenido?</h3>
            <div className="grid grid-cols-2 gap-3">
              {objetivos.map(objetivo => (
                <button
                  key={objetivo.id}
                  onClick={() => toggleObjetivo(objetivo.id)}
                  className={`p-4 rounded-lg border transition-all ${
                    formData.objective.includes(objetivo.id)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{objetivo.icono}</div>
                  <div className="text-sm font-medium">{objetivo.texto}</div>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Mostrar mensaje de éxito si se guardó correctamente
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
        <Card className="max-w-2xl mx-auto bg-white p-6 shadow-lg">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Información guardada!</h2>
            <p className="text-gray-600">Tu base de conocimiento ha sido creada correctamente.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Iniciar Sesión
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
      <Card className="max-w-2xl mx-auto bg-white p-6 shadow-lg">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h2>
          <p className="text-gray-600">Ayúdanos a conocer mejor tu marca</p>
        </div>

        {/* Barra de progreso */}
        <div className="mb-8">
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-2 bg-orange-500 rounded-full transition-all"
              style={{ width: `${(paso / totalPasos) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-500 text-right">
            {paso} de {totalPasos}
          </div>
        </div>

        {/* Contenido del formulario */}
        <div className="mb-8">
          {renderPregunta()}
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-between">
          <button
            onClick={pasoAnterior}
            disabled={paso === 1 || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              paso === 1 || loading
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          <button
            onClick={siguientePaso}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2 ${
              loading ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'
            } text-white rounded-lg transition-colors`}
          >
            {loading ? (
              <>
                Guardando...
                <span className="ml-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </>
            ) : paso === totalPasos ? (
              <>
                Guardar
                <CheckCircle className="w-5 h-5" />
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default KnowledgeBaseForm;