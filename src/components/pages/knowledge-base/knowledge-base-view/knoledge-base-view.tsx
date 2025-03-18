/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  Edit3,
  BookOpen,
  Instagram,
  Save,
  Target
} from 'lucide-react';
import BussinessService from '../../../../services/business.service';
import { BusinessUpdateData } from '../../../../services/interfaces/business-service';


interface FormData {
  instagram: string;
  marca: string;
  productos: string;
  diferenciadores: string;
  audiencia: string;
  objetivos: number[];
}

interface CardProps {
  className: string;
  children: React.ReactNode;
}

// Define objetivos array to match KnowledgeBaseForm
const objetivos = [
  { id: 1, texto: "Aumentar las ventas", icono: "💰" },
  { id: 2, texto: "Posicionar la marca", icono: "🎯" },
  { id: 3, texto: "Educar a los clientes", icono: "📚" },
  { id: 4, texto: "Convertirme en influenciador", icono: "⭐" },
  { id: 5, texto: "Generar comunidad", icono: "👥" },
  { id: 6, texto: "Mostrar productos/servicios", icono: "🛍️" }
];

const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const KnowledgeBaseView: React.FC = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    instagram: '',
    marca: '',
    productos: '',
    diferenciadores: '',
    audiencia: '',
    objetivos: []
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('userData');
      
      if (!userData) {
        console.error('No user data found');
        setLoading(false);
        return;
      }
      
      const userId = JSON.parse(userData).id;
      const businessData = await BussinessService.getBusinessIdByUserId(userId);
      
      if (businessData && businessData.length > 0) {
        let parsedObjectives: number[] = [];
        
        if (businessData[0].objective && businessData[0].objective.length > 0) {
          // Properly handle different objective formats
          parsedObjectives = businessData[0].objective.map(objective => {
            try {
              // If objective is a string like '{"N":"3"}', parse it first
              const parsed = typeof objective === 'string' 
                ? JSON.parse(objective) 
                : objective;
              
              // Extract the value from the N property if available
              if (parsed && parsed.N) {
                return Number(parsed.N);
              } else if (typeof parsed === 'number') {
                return parsed;
              } else if (typeof parsed === 'string') {
                return Number(parsed);
              }
              return NaN;
            } catch (error) {
              // If JSON parsing fails, try to convert directly to number
              return Number(objective);
            }
          }).filter(num => !isNaN(num)); // Filter out any NaN values
        }
        
        setFormData({
          instagram: businessData[0].instagramAccount || '',
          marca: businessData[0].businessName || '',
          productos: businessData[0].whatTheBusinessSells || '',
          diferenciadores: businessData[0].valueProposition || '',
          audiencia: businessData[0].targetAudience || '',
          objetivos: parsedObjectives,
        });
      }
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCampo = (campo: keyof FormData, valor: string | number[]): void => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem('userData');
      
      if (!userData) {
        console.error('No user data found');
        setLoading(false);
        return;
      }
      
      const userId = JSON.parse(userData).id;
      const businessData = await BussinessService.getBusinessIdByUserId(userId);
      
      if (businessData && businessData.length > 0) {
        // Format objectives as objects with N property to match the database structure
        const formattedObjectives = formData.objetivos.map(id => 
          JSON.stringify({ N: id.toString() })
        );
        
        const updatedData: BusinessUpdateData = {
          id: businessData[0].id,
          businessName: formData.marca,
          userIDs: businessData[0].userIDs,
          instagramAccount: formData.instagram,
          objective: formattedObjectives, // Use the formatted objectives
          targetAudience: formData.audiencia,
          valueProposition: formData.diferenciadores,
          whatTheBusinessSells: formData.productos,
          productBenefits: businessData[0].productBenefits || '',
        };
        
        const response = await BussinessService.updateBusiness(updatedData);
        console.log('Business updated successfully:', response);
        setIsEditing(false);
      } 
    } catch (error) {
      console.error('Error updating business data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Function to get the objective text by id

  const getObjetivoTexto = (id: number): string => {
    const objetivo = objetivos.find(obj => obj.id === id);
    return objetivo ? objetivo.texto : '';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Contenido Principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Base de Conocimiento</h1>
                <p className="text-gray-600">Información de tu marca y objetivos</p>
              </div>
              <button
                onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                disabled={loading}
              >
                {isEditing ? (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5" />
                    Editar Información
                  </>
                )}
              </button>
            </div>

            <div className="space-y-6">
              <Card className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <Instagram className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Información de la Cuenta</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuenta de Instagram
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.instagram}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => actualizarCampo('instagram', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.instagram || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de la Marca
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.marca}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => actualizarCampo('marca', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.marca || '-'}</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <BookOpen className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Detalles del Negocio</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Productos o Servicios
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.productos}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actualizarCampo('productos', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.productos || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Diferenciadores
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.diferenciadores}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actualizarCampo('diferenciadores', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.diferenciadores || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audiencia Objetivo
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.audiencia}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => actualizarCampo('audiencia', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-32"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.audiencia || '-'}</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <Target className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Objetivos</h2>
                </div>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-3">
                    {objetivos.map(objetivo => (
                      <button
                        key={objetivo.id}
                        onClick={() => {
                          const updatedObjetivos = formData.objetivos.includes(objetivo.id)
                            ? formData.objetivos.filter(id => id !== objetivo.id)
                            : [...formData.objetivos, objetivo.id];
                          actualizarCampo('objetivos', updatedObjetivos);
                        }}
                        className={`p-4 rounded-lg border transition-all ${
                          formData.objetivos.includes(objetivo.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{objetivo.icono}</div>
                        <div className="text-sm font-medium">{objetivo.texto}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.objetivos && formData.objetivos.length > 0 ? (
                      formData.objetivos.map((objetivoId, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                        >
                          {getObjetivoTexto(objetivoId)}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">No hay objetivos seleccionados</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseView;