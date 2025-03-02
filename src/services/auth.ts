import api from './api';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
}

export async function authenticateUser(username: string, password: string): Promise<User> {
  try {
    console.log('Enviando requisição de login:', { username });
    
    const response = await api.post('/auth/login', { username, password });
    
    console.log('Resposta da requisição de login:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Authentication failed');
    }
    
    // Armazenar o token recebido do servidor
    const token = response.data.data.token;
    if (token) {
      // Configurar o token para futuras requisições
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return response.data.data.user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Invalid credentials');
  }
}

export async function validateToken(token: string): Promise<{ user: User; newToken: string }> {
  try {
    // Configurar o token para a requisição
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Fazer requisição para validar o token
    const response = await api.post('/auth/validate-token');
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Token validation failed');
    }
    
    // Atualizar o token para futuras requisições
    const newToken = response.data.data.token;
    if (newToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    
    return {
      user: response.data.data.user,
      newToken
    };
  } catch (error) {
    console.error('Token validation error:', error);
    // Remover o token inválido dos headers
    delete api.defaults.headers.common['Authorization'];
    throw new Error('Invalid or expired session');
  }
}