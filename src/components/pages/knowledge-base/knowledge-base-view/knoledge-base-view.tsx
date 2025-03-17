import React, { useState } from 'react';
import {
  Edit3,
  BookOpen,
  Instagram,
  Save,
  Target
} from 'lucide-react';
import BussinessService from '../../../../services/business.service';

interface FormData {
  instagram: string;
  marca: string;
  productos: string;
  diferenciadores: string;
  audiencia: string;
  objetivos: string[];
}

interface CardProps {
  className: string;
  children: React.ReactNode;
}

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
    instagram: '@mitienda',
    marca: 'Tienda Creativa',
    productos: 'Vendemos productos artesanales hechos a mano, incluyendo joyería, accesorios y decoración para el hogar. Cada pieza es única y está hecha con materiales sostenibles.',
    diferenciadores: 'Nuestros productos son 100% artesanales y personalizables. Trabajamos con artesanos locales y utilizamos materiales eco-friendly en todos nuestros productos.',
    audiencia: 'Mujeres entre 25-45 años, con poder adquisitivo medio-alto, interesadas en decoración, sostenibilidad y productos únicos. Valoran la calidad y la historia detrás de cada producto.',
    objetivos: ['Aumentar las ventas', 'Posicionar la marca', 'Generar comunidad']
  });


  const user = localStorage.getItem('userData')
  const business =  BussinessService.getBusinessIdByUserId(user ? JSON.parse(user).id : '' );
  if (business) {
    console.log(business);
  }

  const actualizarCampo = (campo: keyof FormData, valor: string | string[]): void => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

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
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
              <Card className="p-6">
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
                      <p className="text-gray-900">{formData.instagram}</p>
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
                      <p className="text-gray-900">{formData.marca}</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
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
                      <p className="text-gray-900">{formData.productos}</p>
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
                      <p className="text-gray-900">{formData.diferenciadores}</p>
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
                      <p className="text-gray-900">{formData.audiencia}</p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 text-orange-500 mb-4">
                  <Target className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">Objetivos</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.objetivos.map((objetivo, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {objetivo}
                    </span>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseView;