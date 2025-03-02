import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import Calendar from './Calendar';
import { format } from 'date-fns';

// Interface para as props do componente
interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose }) => {
  // Estado para controlar as etapas do agendamento (1: formulário, 2: confirmação)
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  // Estado para armazenar os dados do formulário (incluindo os checkboxes "barba" e "sobrancelha")
  const [formData, setFormData] = useState({
    name: '',
    barber: '',
    barberId: '',
    date: '',
    time: '',
    service: '',
    barba: false,
    sobrancelha: false,
  });

  // Mapeamento de preços (valores em R$)
  const priceMapping: { [key: string]: number } = {
    "Corte Tradicional": 45,
    "Tesoura": 60,
    "Navalha": 70,
    "Reflexo": 80,
    "Nevou": 90,
    "barba": 25,
    "sobrancelha": 10,
  };

  // Função que calcula o valor total do serviço (serviço + extras, se selecionados)
  const getServicePrice = () => {
    let total = 0;
    if (formData.service && priceMapping[formData.service]) {
      total += priceMapping[formData.service];
    }
    if (formData.barba) {
      total += priceMapping["barba"];
    }
    if (formData.sobrancelha) {
      total += priceMapping["sobrancelha"];
    }
    return `R$ ${total.toFixed(2)}`;
  };

  // Dados estáticos com a propriedade "pix" adicionada
  const barbers = [
    { id: '01', name: 'Maicon', whatsapp: '21997764645', pix: '21997761646' },
    { id: '02', name: 'Brendon', whatsapp: '2199774658', pix: '21554875965' }
  ];
  const services = ['Corte Tradicional', 'Tesoura', 'Navalha', 'Reflexo', 'Nevou'];

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.date) {
      setError('Por favor, selecione uma data e horário');
      return;
    }
    if (!formData.barber) {
      setError('Por favor, selecione um barbeiro');
      return;
    }
    if (!formData.service) {
      setError('Por favor, selecione um serviço');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const formattedDate = formData.date;

      const appointmentData = {
        clientName: formData.name,
        serviceName: formData.service + (formData.barba ? ', Barba' : '') + (formData.sobrancelha ? ', Sobrancelha' : ''),
        date: formattedDate,
        time: formData.time,
        barberId: formData.barber === 'Maicon' ? '01' : '02',
        barberName: formData.barber,
        price: parseFloat(getServicePrice().replace('R$ ', ''))
      };

      const response = await fetch('http://localhost:3000/api/appointments/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao criar agendamento');
      }

      // Update local storage
      const storedAppointments = localStorage.getItem('appointments') || '[]';
      const appointments = JSON.parse(storedAppointments);
      appointments.push({
        id: result.data.id.toString(),
        client_name: appointmentData.clientName,
        service_name: appointmentData.serviceName,
        date: appointmentData.date,
        time: appointmentData.time,
        status: 'pending',
        barber_id: appointmentData.barberId,
        barber_name: appointmentData.barberName,
        price: appointmentData.price
      });
      localStorage.setItem('appointments', JSON.stringify(appointments));

      // Trigger storage event for dashboard update
      window.dispatchEvent(new Event('storage'));

      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setStep(2);
      }, 1500);

    } catch (err) {
      console.error('Error saving appointment:', err);
      setError('Erro ao salvar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter o WhatsApp do barbeiro selecionado
  const getBarberWhatsApp = () => {
    const barber = barbers.find(b => b.name === formData.barber);
    return barber?.whatsapp || '';
  };

  // Função para obter o código PIX do barbeiro selecionado
  const getBarberPix = () => {
    const barber = barbers.find(b => b.name === formData.barber);
    return barber?.pix || '';
  };

  // Função que monta a mensagem com os dados do agendamento para o WhatsApp, incluindo os extras e o valor do serviço
  const getWhatsappMessage = () => {
    const formattedDate = formData.date
      ? format(new Date(formData.date), 'dd/MM/yyyy')
      : format(new Date(), 'dd/MM/yyyy');

    const extras = [];
    if (formData.barba) extras.push("Barba");
    if (formData.sobrancelha) extras.push("Sobrancelha");
    const extrasMessage = extras.length ? `Extras: ${extras.join(', ')}\n` : '';

    const message = `Olá, segue meu agendamento:
Nome: ${formData.name}
Barbeiro: ${formData.barber}
Serviço: ${formData.service}
${extrasMessage}Valor: ${getServicePrice()}
Data: ${formattedDate}
Horário: ${formData.time}
  
Aguardo a confirmação.`;
    return encodeURIComponent(message);
  };

  // Função para copiar o PIX para a área de transferência
  const handleCopyPix = () => {
    const pix = getBarberPix();
    navigator.clipboard.writeText(pix).then(() => {
      alert("PIX copiado!");
    }).catch(err => {
      console.error("Erro ao copiar PIX:", err);
    });
  };

  // Não renderiza nada se o modal estiver fechado
  if (!isOpen) return null;

  // Calcula os extras para o resumo do agendamento
  const extrasText: string[] = [];
  if (formData.barba) extrasText.push("Barba");
  if (formData.sobrancelha) extrasText.push("Sobrancelha");

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="relative bg-[#1A1F2E] rounded-lg w-[95%] sm:w-[90%] sm:max-w-md max-h-[95vh] sm:max-h-[85vh] overflow-auto shadow-2xl transform transition-all duration-500 ease-out hover:shadow-[#F0B35B]/10">
        <button
          onClick={onClose}
          className="absolute top-1 right-1 sm:top-2 sm:right-2 text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-full"
        >
          <X size={18} className="transform hover:rotate-90 transition-transform duration-300" />
        </button>
        <div className="p-4 sm:p-6">
          <div className=" mb-6">

          </div>

          {showSuccessMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 rounded-lg">
              <div className="bg-green-500 text-white px-6 py-3 rounded-full font-semibold animate-bounce">
                Agendamento realizado com sucesso!
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div className="group">
                <label className="block text-sm font-medium mb-1.5 text-gray-300 group-hover:text-[#F0B35B] transition-colors">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-[#0D121E] rounded-lg focus:ring-2 focus:ring-[#F0B35B] outline-none transition-all duration-300 border border-transparent hover:border-[#F0B35B]/30 text-sm placeholder-gray-500"
                  value={formData.name}
                  placeholder="Digite seu nome completo"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-0.5">Barbeiro</label>
                <select
                  required
                  className="w-full px-3 py-1.5 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors text-sm"
                  value={formData.barberId}
                  onChange={(e) => {
                    const selectedBarber = barbers.find(b => b.id === e.target.value);
                    setFormData({
                      ...formData,
                      barberId: e.target.value,
                      barber: selectedBarber?.name || ''
                    });
                  }}
                >
                  <option value="">Selecione um barbeiro</option>
                  {barbers.map((barber) => (
                    <option key={barber.id} value={barber.id}>
                      {barber.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-0.5">Serviço</label>
                <select
                  required
                  className="w-full px-3 py-1.5 bg-[#0D121E] rounded-md focus:ring-2 focus:ring-[#F0B35B] outline-none transition-colors text-sm"
                  value={formData.service}
                  onChange={(e) =>
                    setFormData({ ...formData, service: e.target.value })
                  }
                >
                  <option value="">Selecione um serviço</option>
                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="barba"
                    value="barba"
                    checked={formData.barba}
                    onChange={(e) =>
                      setFormData({ ...formData, barba: e.target.checked })
                    }
                    className="mr-1"
                  />
                  <label htmlFor="barba" className="text-xs sm:text-sm">Barba</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sobrancelha"
                    value="sobrancelha"
                    checked={formData.sobrancelha}
                    onChange={(e) =>
                      setFormData({ ...formData, sobrancelha: e.target.checked })
                    }
                    className="mr-1"
                  />
                  <label htmlFor="sobrancelha" className="text-xs sm:text-sm">Sobrancelha</label>
                </div>
              </div>

              <Calendar
                selectedBarber={formData.barber}
                onTimeSelect={(date, time) => {
                  setFormData({
                    ...formData,
                    date: format(date, 'yyyy-MM-dd'),
                    time: time
                  });
                }}
              />

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-[#F0B35B] text-black py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-[1.02] hover:bg-[#F0B35B]/90 active:scale-[0.98] ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </span>
                ) : 'Confirmar Agendamento'}
              </button>
            </form>
          ) : (
            <div className="text-center transform transition-all duration-500 animate-fadeIn">
              <div className="bg-[#0D121E] p-2 sm:p-4 rounded-lg mb-3 sm:mb-4 shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-40 bg-white p-2 rounded-lg flex flex-col items-center justify-center">
                    {formData.barber ? (
                      <>
                        <img
                          src={`/qr-codes/${formData.barber.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.svg`}
                          alt={`QR Code de ${formData.barber}`}
                          className="w-32 h-32 object-contain hover:scale-105 transition-transform duration-200"
                        />
                        <div className="mt-1 flex items-center text-xs">
                          <span className="text-gray-700 font-bold">
                            {getBarberPix()}
                          </span>
                          <button
                            onClick={handleCopyPix}
                            className="ml-2 text-xs bg-green-400 px-1.5 py-0.5 rounded hover:shadow-md transition-shadow"
                          >
                            Copiar
                          </button>
                        </div>
                      </>
                    ) : (
                      <span>Sem QR</span>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm sm:text-base font-medium">
                      Pague antecipado e garanta a sua vaga.
                    </p>
                    <p className="text-gray-300 mt-2 text-sm sm:text-base">
                      Valor <strong>{getServicePrice()}</strong>
                    </p>
                  </div>
                </div>

                <a
                  href={`https://wa.me/${getBarberWhatsApp()}?text=${getWhatsappMessage()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-transform hover:scale-105 mb-3 text-sm"
                >
                  <MessageCircle size={16} />
                  Confirmar vaga
                </a>

                <div className="text-left space-y-1 bg-[#1A1F2E] p-3 rounded-lg text-xs sm:text-sm">
                  <p><strong>Nome:</strong> {formData.name}</p>
                  <p><strong>Barbeiro:</strong> {formData.barber}</p>
                  <p><strong>Serviço:</strong> {formData.service}</p>
                  <p><strong>Extras:</strong> {extrasText.length ? extrasText.join(", ") : "Nenhum"}</p>
                  <p><strong>Valor:</strong> {getServicePrice()}</p>
                  <p>
                    <strong>Data:</strong>{' '}
                    {formData.date
                      ? format(new Date(formData.date.replace(/-/g, '/')), 'dd/MM/yyyy')
                      : format(new Date(), 'dd/MM/yyyy')}
                  </p>
                  <p><strong>Horário:</strong> {formData.time}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-[#F0B35B] text-black py-2 rounded-md font-semibold hover:bg-[#F0B35B]/80 transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
