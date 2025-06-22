/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import BussinessService from '../services/business.service';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  // Estado de autenticación
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  businessId: string;
  businessName: string;
  
  // Funciones
  login: (userData: User) => Promise<void>;
  logout: () => void;
  updateBusinessInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [businessId, setBusinessId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');

  // Inicializar desde localStorage al cargar
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const storedAuthStatus = localStorage.getItem('isAuthenticated');
      const userDataString = localStorage.getItem('userData');
      
      if (storedAuthStatus === 'true' && userDataString) {
        const userData = JSON.parse(userDataString) as User;
        setUser(userData);
        setIsAuthenticated(true);
        
        // Obtener información del negocio
        await fetchBusinessInfo(userData.id);
      }
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      // Si hay error, limpiar todo
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessInfo = async (userId: string) => {
    try {
      const businessResponse = await BussinessService.getBusinessIdByUserId(userId);
      if (businessResponse && businessResponse.length > 0) {
        setBusinessId(businessResponse[0].id);
        setBusinessName(businessResponse[0].businessName);
      }
    } catch (error) {
      console.error('Error obteniendo información del negocio:', error);
    }
  };

  const login = async (userData: User) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      
      // Guardar en localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Obtener información del negocio
      await fetchBusinessInfo(userData.id);
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setBusinessId('');
    setBusinessName('');
    
    // Limpiar localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('businessData');
    localStorage.removeItem('userData');
    localStorage.removeItem('hasSeenTutorial');
  };

  const updateBusinessInfo = async () => {
    if (user) {
      await fetchBusinessInfo(user.id);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    loading,
    user,
    businessId,
    businessName,
    login,
    logout,
    updateBusinessInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 