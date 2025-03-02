import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    whatsapp: '',
    pix: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
  
    try {
      // Form validation
      if (!formData.name.trim() || !formData.username.trim() || !formData.password || !formData.whatsapp.trim() || !formData.pix.trim()) {
        setError('Por favor, preencha todos os campos corretamente');
        return;
      }
  
      if (formData.name.trim().length < 3) {
        setError('O nome deve ter pelo menos 3 caracteres');
        return;
      }
  
      const usernameRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!usernameRegex.test(formData.username.trim())) {
        setError('Por favor, insira um username válido');
        return;
      }
  
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
  
      const whatsappRegex = /^\d{10,14}$/;
      const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
      if (!whatsappRegex.test(cleanWhatsapp)) {
        setError('O número do WhatsApp deve conter entre 10 e 14 dígitos');
        return;
      }
  
      if (formData.pix.trim().length < 3) {
        setError('Por favor, insira uma chave PIX válida');
        return;
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful registration
      localStorage.setItem('mockUser', JSON.stringify({
        id: 'mock-' + Date.now(),
        ...formData,
        whatsapp: cleanWhatsapp
      }));

      // Redirect to login page
      navigate('/login');
    } catch (err) {
      console.error('Error during registration:', err);
      setError('Erro inesperado ao criar conta. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D121E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#1A1F2E] p-8 rounded-lg shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Cadastro de Barbeiro
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Crie sua conta para começar
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
              <label htmlFor="name" className="sr-only">Nome</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="username" className="sr-only">username</label>
              <input
                id="username"
                name="username"
                type="username"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="whatsapp" className="sr-only">WhatsApp</label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="WhatsApp (ex: 5521999999999)"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="pix" className="sr-only">PIX</label>
              <input
                id="pix"
                name="pix"
                type="text"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-[#0D121E] focus:outline-none focus:ring-[#F0B35B] focus:border-[#F0B35B] focus:z-10 sm:text-sm"
                placeholder="Chave PIX"
                value={formData.pix}
                onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-[#F0B35B] hover:bg-[#F0B35B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F0B35B] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                'Criar conta'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#F0B35B] hover:text-[#F0B35B]/80 text-sm"
            >
              Já tem uma conta? Faça login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;