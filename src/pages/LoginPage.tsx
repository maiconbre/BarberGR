import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth} from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!formData.username || !formData.password) {
        setError('Por favor, preencha todos os campos');
        return;
      }

      const result = await login(formData.username, formData.password, formData.rememberMe);
      
      if (result && result.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('username ou senha incorretos');
      }
    } catch (err: any) {
      console.error('Erro durante o login:', err);
      setError(err.message || 'Ocorreu um erro ao tentar fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D121E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            GR Barber
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Faça login para acessar o painel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                username
              </label>
              <input
                id="username"
                name="username"
                type="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] rounded-t-md focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] rounded-b-md focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-[#F0B35B] focus:ring-[#F0B35B] border-gray-700 rounded bg-[#0D121E]"
                checked={formData.rememberMe}
                onChange={(e) =>
                  setFormData({ ...formData, rememberMe: e.target.checked })
                }
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Lembrar-me
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Entrar'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full text-center text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm"
            >
              Não tem uma conta? Cadastre-se
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;