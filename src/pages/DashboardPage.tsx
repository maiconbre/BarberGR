import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaChartLine, FaChevronDown, FaMoneyBillWave } from 'react-icons/fa';
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
  const [selectedWeek, setSelectedWeek] = useState<string>('today');
  const [showTotalRevenue, setShowTotalRevenue] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(false);
      setError(null);

      const response = await fetch('https://barber-backend-spm8.onrender.com/api/appointments', {
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

        const currentAppointmentsStr = JSON.stringify(appointments);
        const newAppointmentsStr = JSON.stringify(formattedAppointments);

        if (currentAppointmentsStr !== newAppointmentsStr) {
          setAppointments(formattedAppointments);
        }
      } else {
        setError('Falha ao carregar agendamentos');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Erro ao carregar agendamentos. Por favor, tente novamente.');
      setAppointments([]);
    }
  }, [appointments]);

  useEffect(() => {
    loadAppointments();
    const interval = setInterval(loadAppointments, 120000);
    return () => clearInterval(interval);
  }, [loadAppointments]);

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

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;
    try {
      if (action === 'delete') {
        const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments/${appointmentId}`, {
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
        const response = await fetch(`https://barber-backend-spm8.onrender.com/api/appointments/${appointmentId}`, {
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

  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce((sum, app) => sum + app.price, 0);
  const completedAppointments = appointments.filter(app => app.status === 'completed').length;

  const calculateStats = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const receitaHoje = appointments.filter(app => app.date === hoje).reduce((sum, app) => sum + app.price, 0);
    const ticketMedio = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;
    const taxaConclusao = totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
    return { receitaHoje, ticketMedio, taxaConclusao };
  };

  const { receitaHoje, ticketMedio, taxaConclusao } = calculateStats();

  const filterAppointmentsByWeek = useCallback((apps: Appointment[]) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    switch (selectedWeek) {
      case 'today':
        return apps.filter(app => app.date === todayStr);
      case 'tomorrow':
        return apps.filter(app => app.date === tomorrowStr);
      default:
        return apps;
    }
  }, [selectedWeek]);

  const filteredAppointments = React.useMemo(() => {
    const statusFiltered = showCompleted ? appointments : appointments.filter(app => app.status !== 'completed');
    return filterAppointmentsByWeek(statusFiltered);
  }, [appointments, showCompleted, filterAppointmentsByWeek]);

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

      <main className="max-w-7xl mx-auto py-6 px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
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

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <div className="bg-[#1F2737] p-4 rounded-lg w-full">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <FaChartLine className="text-[#F0B35B]" />
                        Visão Geral
                      </h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <motion.div 
                        className="flex-1 bg-[#252B3B] p-4 rounded-lg cursor-pointer"
                        onClick={() => setShowTotalRevenue(!showTotalRevenue)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <AnimatePresence mode="wait">
                          {showTotalRevenue ? (
                            <motion.div
                              key="total"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Receita Total</p>
                                <FaMoneyBillWave className="text-[#F0B35B] text-lg" />
                              </div>
                              <h4 className="text-2xl font-bold text-[#F0B35B]">
                                R$ {totalRevenue.toFixed(2)}
                              </h4>
                              <div className="flex items-center text-xs text-green-400 mt-1">
                                <span className="inline-block mr-1">↑</span>
                                <span>+{((receitaHoje / totalRevenue) * 100).toFixed(1)}% hoje</span>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="today"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-gray-400 text-sm">Receita Hoje</p>
                                <FaMoneyBillWave className="text-[#F0B35B] text-lg" />
                              </div>
                              <h4 className="text-2xl font-bold text-[#F0B35B]">
                                R$ {receitaHoje.toFixed(2)}
                              </h4>
                              <div className="flex items-center text-xs text-green-400 mt-1">
                                <span className="inline-block mr-1">↑</span>
                                <span>{appointments.filter(app => app.date === new Date().toISOString().split('T')[0]).length} clientes</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1F2737] p-4 rounded-lg">
                <h4 className="text-white font-medium mb-3">Performance</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Meta Mensal</span>
                      <span className="text-[#F0B35B]">{((totalRevenue / 10000) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((totalRevenue / 10000) * 100, 100)}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-[#F0B35B] to-[#FFD700] rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Taxa de Conclusão</span>
                      <span className="text-green-400">{taxaConclusao.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${taxaConclusao}%` }}
                        transition={{ duration: 1 }}
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1F2737] p-4 rounded-lg">
              <h4 className="text-white font-medium mb-4">Indicadores</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-[#252B3B] rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Ticket Médio</p>
                  <h5 className="text-2xl font-bold text-[#F0B35B]">
                    R$ {ticketMedio.toFixed(2)}
                  </h5>
                </div>
                <div className="text-center p-4 bg-[#252B3B] rounded-lg">
                  <p className="text-gray-400 text-sm mb-2">Total de Clientes</p>
                  <h5 className="text-2xl font-bold text-[#F0B35B]">
                    {totalAppointments}
                  </h5>
                  <p className="text-xs text-green-400 mt-1">
                    {completedAppointments} concluídos
                  </p>
                </div>
              </div>

              {/* Seção do Gráfico */}
              <motion.div
                className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl shadow-lg overflow-hidden mt-4"
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

              {/* Filtros e Lista de Agendamentos */}
              <div className="mt-6">
                <div className="mb-6 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedWeek('today')}
                      className={`px-4 py-2 rounded-md transition-all ${selectedWeek === 'today' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setSelectedWeek('tomorrow')}
                      className={`px-4 py-2 rounded-md transition-all ${selectedWeek === 'tomorrow' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
                    >
                      Amanhã
                    </button>
                    <button
                      onClick={() => setSelectedWeek('all')}
                      className={`px-4 py-2 rounded-md transition-all ${selectedWeek === 'all' ? 'bg-[#F0B35B] text-black' : 'bg-[#1A1F2E] text-white hover:bg-[#252B3B]'}`}
                    >
                      Todos
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredAppointments
                    .filter(app => showCompleted || app.status !== 'completed')
                    .map(appointment => (
                      <AppointmentCardNew
                        key={appointment.id}
                        appointment={appointment}
                        onDelete={() => handleAppointmentAction(appointment.id, 'delete')}
                        onToggleStatus={() => handleAppointmentAction(appointment.id, 'toggle', appointment.status)}
                      />
                    ))}
                  {filteredAppointments.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                      Nenhum agendamento encontrado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;