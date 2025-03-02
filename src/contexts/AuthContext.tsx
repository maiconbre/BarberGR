import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser, validateToken } from '../services/auth'

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Tempo de expiração do token em milissegundos (30 minutos)
const SESSION_EXPIRY = 30 * 60 * 1000;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se a sessão ainda é válida
  const checkSessionValidity = () => {
    const expiryTime = localStorage.getItem('sessionExpiry') || sessionStorage.getItem('sessionExpiry');
    if (!expiryTime) return false;

    const currentTime = new Date().getTime();
    return currentTime < parseInt(expiryTime);
  };

  // Atualizar o tempo de expiração da sessão
  const updateSessionExpiry = (storage: Storage, token: string) => {
    const expiryTime = new Date().getTime() + SESSION_EXPIRY;
    storage.setItem('sessionExpiry', expiryTime.toString());
    storage.setItem('authToken', token);
  };

  useEffect(() => {
    const validateSession = async () => {
      setIsLoading(true);
      try {
        // Verificar se existe um token
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (!token || !checkSessionValidity()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Validar o token no servidor
        const { user, newToken } = await validateToken(token);
        
        // Determinar qual storage está sendo usado
        const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
        
        // Atualizar o token e o tempo de expiração
        updateSessionExpiry(storage, newToken);
        
        // Armazenar os dados do usuário
        storage.setItem('user', JSON.stringify(user));
        
        // Se for um barbeiro, armazenar o ID
        if (user.role === 'barber') {
          storage.setItem('currentBarberId', user.id.toString());
        }
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Erro na validação da sessão:', error);
        // Limpar dados da sessão inválida
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
    
    // Configurar um intervalo para validar o token periodicamente
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        validateSession();
      }
    }, SESSION_EXPIRY / 2); // Validar na metade do tempo de expiração
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const user = await authenticateUser(username, password);
      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Obter o token da resposta (configurado no serviço de autenticação)
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Armazenar dados do usuário
      storage.setItem('user', JSON.stringify(user));
      
      // Atualizar tempo de expiração
      if (token) {
        updateSessionExpiry(storage, token);
      }

      // Se for um barbeiro, armazenar o ID
      if (user.role === 'barber') {
        storage.setItem('currentBarberId', user.id.toString());
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentBarberId');
    localStorage.removeItem('user');
    localStorage.removeItem('sessionExpiry');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentBarberId');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('sessionExpiry');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F0B35B]"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};