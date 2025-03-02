import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; user: User }>;
  logout: () => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const logout = useCallback((): void => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      throw new Error('Não foi possível realizar o logout. Tente novamente.');
    }
  }, []);

  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('https://barber-backend-spm8.onrender.com/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Erro na validação do token:', error);
      throw new Error('Erro ao validar sua sessão. Por favor, faça login novamente.');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      validateToken(token).then(isValid => {
        if (!isValid) {
          logout();
        }
      }).catch(() => {
        logout();
      });
    }
  }, [logout, validateToken]);

  const login = useCallback(async (username: string, password: string, rememberMe: boolean): Promise<{ success: boolean; user: User }> => {
    try {
      const response = await fetch('https://barber-backend-spm8.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Erro ao fazer login');
      }

      if (data.success && data.data.token) {
        const { token, user } = data.data;
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem('token', token);
        storage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      }
      throw new Error('Credenciais inválidas. Verifique seu username e senha.');
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error(error instanceof Error ? error.message : 'Não foi possível realizar o login. Tente novamente.');
    }
  }, []);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
    }),
    [isAuthenticated, user, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };