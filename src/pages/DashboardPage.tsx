import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { FaChartLine, FaMoneyBillWave, FaChevronDown, FaCalendarAlt, FaUser } from 'react-icons/fa';
import AppointmentCardNew from '../components/AppointmentCardNew';

interface Appointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed';
  barberId: string;
  barberName: string;
  price: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ChartData {
  date: string;
  pending: number;
  completed: number;
  fullDate: string;
}

const DashboardPage: React.FC = () => {
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const appointmentsPerPage = 10;

  // Função centralizada para carregar os agendamentos, memoizada para evitar recriações desnecessárias
  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3000/api/appointments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      
      const result = await response.json();
      
      if (result.success) {
        const formattedAppointments = result.data
          .map((app: any) => ({
            ...app,
            service: app.serviceName || app.service
          }))
          .sort((a: Appointment, b: Appointment) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA.getTime() - dateB.getTime();
          });
        setAppointments(formattedAppointments);
      } else {
        setError('Falha ao carregar agendamentos');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Erro ao carregar agendamentos. Por favor, tente novamente.');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega os agendamentos ao montar o componente e configura o polling a cada 30 segundos
  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

  // Calcula os dados semanais para o gráfico
  const calculateWeeklyData = useCallback(() => {
    const appointmentsByDate = appointments.reduce((acc, app) => {
      if (!acc[app.date]) {
        acc[app.date] = { pending: 0, completed: 0 };
      }
      if (app.status === 'pending') {
        acc[app.date].pending++;
      } else if (app.status === 'completed') {
        acc[app.date].completed++;
      }
      return acc;
    }, {} as { [key: string]: { pending: number; completed: number } });

    const sortedDates = Object.keys(appointmentsByDate).sort();
    const data = sortedDates.map(date => {
      const dayDate = new Date(date + 'T12:00:00-03:00');
      const fullDate = dayDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric'
      }).replace('.', '').replace('-feira', '');
      
      return {
        date: String(dayDate.getDate()),
        fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
        pending: appointmentsByDate[date].pending,
        completed: appointmentsByDate[date].completed
      };
    });
    setWeeklyData(data);
  }, [appointments]);

  useEffect(() => {
    if (appointments?.length > 0) {
      calculateWeeklyData();
    } else {
      setWeeklyData([]);
    }
  }, [appointments, calculateWeeklyData]);

  // Atualiza localmente o estado dos agendamentos após ações (delete, toggle status)
  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'delete') {
        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors'
        });
        if (response.ok) {
          setAppointments(prev => prev.filter(app => app.id !== appointmentId));
        }
      } else {
        const newStatus = action === 'complete' ? 'completed' : (currentStatus === 'completed' ? 'pending' : 'completed');
        const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
          setAppointments(prev =>
            prev.map(app =>
              app.id === appointmentId ? { ...app, status: newStatus } : app
            )
          );
        }
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  // Estatísticas
  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const pendingAppointments = appointments.filter(app => app.status === 'pending').length;
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;
  const pendingRevenue = appointments.filter(app => app.status === 'pending').reduce((sum, app) => sum + app.price, 0);
  const completedRevenue = appointments.filter(app => app.status === 'completed').reduce((sum, app) => sum + app.price, 0);

  const calculateStats = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const receitaHoje = appointments.filter(app => app.date === hoje).reduce((sum, app) => sum + app.price, 0);
    const ticketMedio = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
    const taxaConclusao = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    return { receitaHoje, ticketMedio, taxaConclusao };
  };

  const { receitaHoje, ticketMedio, taxaConclusao } = calculateStats();
  // Função para filtrar agendamentos por semana
  const filterAppointmentsByWeek = useCallback((apps: Appointment[]) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    switch (selectedWeek) {
      case 'current':
        return apps.filter(app => {
          const appDate = new Date(app.date);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return appDate >= startOfWeek && appDate <= endOfWeek;
        });
      case 'next':
        const nextWeekStart = new Date(startOfWeek);
        nextWeekStart.setDate(startOfWeek.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        return apps.filter(app => {
          const appDate = new Date(app.date);
          return appDate >= nextWeekStart && appDate <= nextWeekEnd;
        });
      case 'all':
      default:
        return apps;
    }
  }, [selectedWeek]);

  // Filtragem combinada (status e semana)
  const filteredAppointments = React.useMemo(() => {
    const statusFiltered = showCompleted ? appointments : appointments.filter(app => app.status !== 'completed');
    return filterAppointmentsByWeek(statusFiltered);
  }, [appointments, showCompleted, filterAppointmentsByWeek]);

  // Paginação
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D121E] pt-16 flex items-center justify-center">
        <div className="text-white text-xl">Carregando dados...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0D121E] pt-16 flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">{error}</div>
        <button 
          onClick={loadAppointments}
          className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
            <div className="hidden sm:flex items-center gap-2 text-gray-400 text-sm">
              <span>•</span>
              <span>Bem-vindo</span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-all duration-300"
          >
            <span className="hidden sm:inline">Sair</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L8.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Receita Total</p>
                <h3 className="text-2xl font-bold text-[#F0B35B] mb-2">
                  R$ {totalRevenue.toFixed(2)}
                </h3>
                <p className="text-xs text-green-400">
                  <span className="inline-block mr-1">↑</span>
                  Hoje: R$ {receitaHoje.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-[#F0B35B]/10 rounded-full">
                <FaMoneyBillWave className="text-[#F0B35B] text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Pendente</span>
                <span>Concluído</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-[#F0B35B] h-2.5 rounded-full"
                  style={{ width: `${taxaConclusao}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">R$ {pendingRevenue.toFixed(2)}</span>
                <span className="text-gray-400">R$ {completedRevenue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Agendamentos</p>
                <h3 className="text-2xl font-bold text-[#F0B35B] mb-2">
                  {totalAppointments}
                </h3>
                <p className="text-xs text-green-400">
                  <span className="inline-block mr-1">↑</span>
                  Ticket Médio: R$ {ticketMedio.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-[#F0B35B]/10 rounded-full">
                <FaChartLine className="text-[#F0B35B] text-xl" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Pendentes</span>
                <span>Concluídos</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-[#F0B35B] h-2.5 rounded-full"
                  style={{ width: `${taxaConclusao}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">{pendingAppointments}</span>
                <span className="text-gray-400">{completedAppointments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendário Diário */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaCalendarAlt className="text-[#F0B35B]" />
              Agendamentos do Dia
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedWeek('current')}
                className={`px-3 py-1 rounded-md text-sm ${selectedWeek === 'current' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
              >
                Semana Atual
              </button>
              <button
                onClick={() => setSelectedWeek('next')}
                className={`px-3 py-1 rounded-md text-sm ${selectedWeek === 'next' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
              >
                Próxima Semana
              </button>
              <button
                onClick={() => setSelectedWeek('all')}
                className={`px-3 py-1 rounded-md text-sm ${selectedWeek === 'all' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
              >
                Todas
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-12 gap-2 bg-[#1A1F2E] p-4 rounded-lg">
            {Array.from({ length: 24 }, (_, i) => 
              `${String(i).padStart(2, '0')}:00`
            ).map(time => {
              const appointment = appointments
                .find(app => 
                  app.date === new Date().toISOString().split('T')[0] && 
                  app.time === time
                );
              
              return (
                <div
                  key={time}
                  className={`col-span-12 grid grid-cols-12 gap-2 p-2 rounded-lg ${appointment ? (appointment.status === 'completed' ? 'bg-green-500/10' : 'bg-[#1A1F2E]/50') : 'bg-[#1A1F2E]/20'}`}
                >
                  <div className="col-span-2 flex items-center">
                    <span className="text-[#F0B35B] font-medium">{time}</span>
                  </div>
                  {appointment ? (
                    <>
                      <div className="col-span-3">
                        <h3 className="text-white font-medium">{appointment.clientName}</h3>
                      </div>
                      <div className="col-span-3">
                        <p className="text-gray-400 text-sm">{appointment.service}</p>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <FaUser className="text-xs" /> {appointment.barberName}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="text-[#F0B35B] text-sm">R$ {appointment.price.toFixed(2)}</span>
                        <div className={`px-2 py-1 rounded-full text-xs ${appointment.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {appointment.status === 'completed' ? 'Concluído' : 'Pendente'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-10 flex items-center">
                      <span className="text-gray-500 text-sm">Horário Disponível</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

        {/* Seção do Gráfico */}
        <motion.div
          className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg overflow-hidden mb-6"
          animate={{ height: isChartExpanded ? 'auto' : '80px' }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-[#1F2737] transition-colors"
            onClick={() => setIsChartExpanded(!isChartExpanded)}
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FaChartLine className="text-[#F0B35B]" />
              Agendamentos por Data
            </h2>
            <motion.div
              animate={{ rotate: isChartExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaChevronDown className="text-gray-400 text-xl" />
            </motion.div>
          </div>
          <AnimatePresence>
            {isChartExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-2 sm:p-4"
              >
                <div className="h-[300px] sm:h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weeklyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke="#333" 
                        vertical={false}
                        horizontalPoints={[0, 30, 60, 90]}
                      />
                      <XAxis 
                        dataKey="date" 
                        stroke="#fff"
                        tick={{ fontSize: 10, fill: '#fff' }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                        height={30}
                      />
                      <YAxis 
                        stroke="#fff"
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: '#fff' }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                        width={30}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        contentStyle={{ 
                          backgroundColor: '#252B3B',
                          border: '1px solid #F0B35B',
                          borderRadius: '4px',
                          padding: '8px',
                          fontSize: '12px',
                          color: '#fff',
                          maxWidth: '200px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        labelStyle={{ 
                          color: '#F0B35B', 
                          fontWeight: 'bold',
                          marginBottom: '4px',
                          fontSize: '11px'
                        }}
                        formatter={(value: any, name: string) => [
                          value,
                          name === 'pending' ? 'Pendente' : 'Concluído'
                        ]}
                        labelFormatter={(label: string, payload: any[]) => {
                          const date = payload?.[0]?.payload?.fullDate || label;
                          return date.length > 20 ? date.substring(0, 20) + '...' : date;
                        }}
                        wrapperStyle={{ zIndex: 1000, maxWidth: '90vw' }}
                      />
                      <Legend 
                        formatter={(value) => value === 'pending' ? 'Pendente' : 'Concluído'}
                        wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                        height={30}
                      />
                      <Bar 
                        dataKey="pending" 
                        fill="#FFD700"
                        name="pending"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                      />
                      <Bar 
                        dataKey="completed" 
                        fill="#4CAF50"
                        name="completed"
                        radius={[2, 2, 0, 0]}
                        maxBarSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Seção de Agendamentos */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-xs text-gray-400">Agendamentos</h2>
            <span className="text-xs text-gray-400">({filteredAppointments.length} total)</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCompleted(!showCompleted)}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300"
          >
            {showCompleted ? 'Ocultar Finalizados' : 'Mostrar Finalizados'}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentAppointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnimatePresence mode="wait">
                <AppointmentCardNew
                  key={appointment.id}
                  appointment={appointment}
                  onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                  onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                />
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Paginação */}
        {filteredAppointments.length > appointmentsPerPage && (
          <div className="mt-6 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded-md text-sm ${currentPage === number ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
              >
                {number}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
