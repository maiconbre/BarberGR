import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

interface CalendarProps {
  selectedBarber: string;
  onTimeSelect?: (date: Date, time: string) => void;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  barberId: string;
  barberName: string;
}

interface BookedSlot {
  time: string;
  isBooked: boolean;
}

const timeSlots = [
  '09:00', '10:00', '11:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00'
];

const Calendar: React.FC<CalendarProps> = ({ selectedBarber, onTimeSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointmentsCache, setAppointmentsCache] = useState<Appointment[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dias disponíveis (15 dias a partir de hoje) computados uma única vez
  const availableDates = useMemo(() => {
    const today = new Date();
    const brasiliaOffset = -3 * 60; // UTC-3 em minutos
    const localOffset = today.getTimezoneOffset();
    const offsetDiff = localOffset + brasiliaOffset;
    today.setMinutes(today.getMinutes() + offsetDiff);
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 15 }, (_, i) => {
      const date = addDays(today, i);
      date.setHours(0, 0, 0, 0);
      return date;
    });
  }, []);

  // Função para ajustar a data para o horário de Brasília
  const adjustToBrasilia = useCallback((date: Date) => {
    const adjusted = new Date(date);
    const brasiliaOffset = -3 * 60;
    const localOffset = adjusted.getTimezoneOffset();
    const offsetDiff = localOffset + brasiliaOffset;
    adjusted.setMinutes(adjusted.getMinutes() + offsetDiff);
    return adjusted;
  }, []);

  // Função única para buscar todos os agendamentos e atualizar o cache
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://barber-backend-spm8.onrender.com/api/appointments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      if (!jsonData.success) {
        throw new Error('Erro na resposta da API');
      }
      setAppointmentsCache(jsonData.data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      setError('Não foi possível carregar os horários. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dispara a busca quando o barbeiro for selecionado e atualiza a cada 30 segundos
  useEffect(() => {
    if (selectedBarber) {
      fetchAppointments();
      const interval = setInterval(fetchAppointments, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedBarber, fetchAppointments]);

  // Computa os horários reservados (bookedSlots) com base na data, barbeiro e cache
  const computedBookedSlots = useMemo(() => {
    if (selectedDate && selectedBarber) {
      const dateInBrasilia = adjustToBrasilia(selectedDate);
      const formattedDate = format(dateInBrasilia, 'yyyy-MM-dd');
      const barberId = selectedBarber === 'Maicon' ? '01' : '02';
      const filteredAppointments = appointmentsCache.filter(
        appointment =>
          appointment.date === formattedDate && appointment.barberId === barberId
      );
      return timeSlots.map(time => ({
        time,
        isBooked: filteredAppointments.some(appointment => appointment.time === time)
      }));
    }
    return [];
  }, [selectedDate, selectedBarber, appointmentsCache, adjustToBrasilia]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  }, []);

  const handleTimeClick = useCallback((time: string, isBooked: boolean) => {
    if (isBooked || !selectedDate) return;
    setSelectedTime(time);
    if (onTimeSelect) {
      onTimeSelect(selectedDate, time);
    }
  }, [selectedDate, onTimeSelect]);

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2">
          {availableDates.map(date => (
            <button
              type="button"
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg min-w-[80px]
                transition-all duration-200 transform hover:scale-105
                ${selectedDate && isSameDay(date, selectedDate)
                  ? 'bg-[#F0B35B] text-black'
                  : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}
              `}
            >
              <span className="text-xs opacity-75">
                {format(date, 'EEE', { locale: ptBR })}
              </span>
              <span className="text-lg font-bold">
                {format(date, 'd')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[#F0B35B]" />
            </div>
          ) : error ? (
            <div className="col-span-full text-center text-red-500 py-4">
              {error}
            </div>
          ) : (
            timeSlots.map(time => {
              const slot = computedBookedSlots.find(slot => slot.time === time);
              const isBooked = slot ? slot.isBooked : false;
              const isSelected = selectedTime === time;
              return (
                <button
                  type="button"
                  key={time}
                  onClick={() => handleTimeClick(time, isBooked)}
                  disabled={isBooked}
                  className={`
                    py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200
                    ${isBooked
                      ? 'bg-red-500/20 text-red-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-[#F0B35B] text-black transform scale-105'
                        : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B] hover:scale-105'}
                  `}
                >
                  {time}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
