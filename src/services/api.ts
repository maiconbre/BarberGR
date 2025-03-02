import axios from 'axios';

// Define the base URL for API requests
const API_URL =  'http://localhost:3000/api';

console.log('API URL configurada:', API_URL);

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar o token de autenticação em todas as requisições
api.interceptors.request.use(
  (config) => {
    console.log('Enviando requisição para:', config.url, 'com dados:', config.data);
    
    // Adicionar o token de autenticação em todas as requisições
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log('Resposta recebida de:', response.config.url, 'status:', response.status);
    return response;
  },
  (error) => {
    // Não logar erros para rotas de validação de token
    if (!error.config?.url?.includes('/auth/validate')) {
      console.error('Erro na requisição:', error.config?.url, 'status:', error.response?.status);
      console.error('Detalhes do erro:', error.response?.data);
    }
    return Promise.reject(error);
  }
);

export default api;
