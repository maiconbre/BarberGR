import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FaChartLine, FaChevronDown } from 'react-icons/fa';
import AppointmentCardNew from '../components/AppointmentCardNew';
import RevenueCard from '../components/RevenueCard';
import StatusCard from '../components/StatusCard';

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

interface WeeklyData {
  date: string;
  pending: number;
  completed: number;
  fullDate: string;
}

const weeklyData: WeeklyData[] = [];

const DashboardPage: React.FC = () => {
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [isChartExpanded, setIsChartExpanded] = useState(true);

  const queryClient = useQueryClient();

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        throw new Error('Não autorizado');
      }

      const response = await fetch('http://localhost:3000/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }

      if (!response.ok) throw new Error('Erro ao carregar agendamentos');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Atualizar as mutations também
  const deleteMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });
      if (!response.ok) throw new Error('Erro ao deletar agendamento');
      return appointmentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, newStatus }: { appointmentId: string; newStatus: string }) => {
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Erro ao atualizar status');
      return { appointmentId, newStatus };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  // Formatação dos agendamentos
  const formattedAppointments = result?.appointments || []
    .map((app: any) => ({
      id: app.id,
      clientName: app.clientName,
      service: app.serviceName || app.service,
      date: app.date,
      time: app.time,
      status: app.status,
      barberId: app.barberId,
      barberName: app.barberName,
      price: app.price ? parseFloat(app.price) : 0  // Usar 0 em vez de null
      // Adicionar log para debug
    }))
    .sort((a: Appointment, b: Appointment) => {
      const dateA = new Date(`${a.date} ${a.time}`);
      const dateB = new Date(`${b.date} ${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
  // Calcular estatísticas
  const totalAppointments = formattedAppointments.length;
  const totalRevenue = formattedAppointments.reduce((sum: number, app: Appointment) => {
    return sum + (app.price || 0);
  }, 0);
  const pendingAppointments = formattedAppointments.filter((app: Appointment) => app.status === 'pending').length;
  const completedAppointments = formattedAppointments.filter((app: Appointment) => app.status === 'completed').length;
  const pendingRevenue = formattedAppointments
    .filter((app: Appointment) => app.status === 'pending')
    .reduce((sum: number, app: Appointment) => {
      return sum + (app.price || 0);
    }, 0);
  const completedRevenue = formattedAppointments
    .filter((app: Appointment) => app.status === 'completed')
    .reduce((sum: number, app: Appointment) => {
      return sum + (app.price || 0);
    }, 0);

  // Adicionar cálculos de estatísticas financeiras
  const calculateStats = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const receitaHoje = formattedAppointments
      .filter((app: Appointment) => app.date === hoje)
      .reduce((sum: number, app: Appointment) => {
        return sum + (app.price || 0);
      }, 0);

    const ticketMedio = totalAppointments > 0
      ? totalRevenue / totalAppointments
      : null;

    const taxaConclusao = totalAppointments > 0
      ? (completedAppointments / totalAppointments) * 100
      : null;

    return { receitaHoje, ticketMedio, taxaConclusao };
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'complete' | 'delete' | 'toggle', currentStatus?: string) => {
    if (!appointmentId) return;

    try {
      if (action === 'delete') {
        await deleteMutation.mutateAsync(appointmentId);
      } else {
        const newStatus = action === 'complete' ? 'completed' :
          (currentStatus === 'completed' ? 'pending' : 'completed');
        await updateStatusMutation.mutateAsync({ appointmentId, newStatus });
      }
    } catch (error) {
      console.error(`Erro na ação ${action}:`, error);
    }
  };

  const { receitaHoje, ticketMedio, taxaConclusao } = calculateStats();

  // Filtrar agendamentos baseado no estado showCompleted
  const filteredAppointments = showCompleted
    ? formattedAppointments
    : formattedAppointments.filter((app: Appointment) => app.status !== 'completed');

  return (
    <div className="min-h-screen bg-[#0D121E] pt-16">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-white">Painel de Controle</h1>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-[#F0B35B] text-black px-4 py-2 rounded-md hover:bg-[#F0B35B]/80 transition-all duration-300 transform hover:scale-105"
          >
            Sair
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueCard
            totalRevenue={totalRevenue}
            receitaHoje={receitaHoje}
            ticketMedio={ticketMedio || 0}
            taxaConclusao={taxaConclusao || 0}
          />
          <StatusCard
            pendingAppointments={pendingAppointments}
            completedAppointments={completedAppointments}
            pendingRevenue={pendingRevenue}
            completedRevenue={completedRevenue}
          />
        </div>

        {/* Chart Section */}
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
                    <LineChart
                      data={weeklyData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 5
                      }}
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
                        cursor={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
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
                        wrapperStyle={{
                          zIndex: 1000,
                          maxWidth: '90vw'
                        }}
                      />
                      <Legend
                        formatter={(value) =>
                          value === 'pending' ? 'Pendente' : 'Concluído'
                        }
                        wrapperStyle={{
                          paddingTop: '10px',
                          fontSize: '11px'
                        }}
                        height={30}
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        stroke="#FFD700"
                        strokeWidth={2}
                        dot={{ fill: '#FFD700', r: 4 }}
                        activeDot={{ r: 6, stroke: '#FFD700', strokeWidth: 2 }}
                        name="pending"
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke="#4CAF50"
                        strokeWidth={2}
                        dot={{ fill: '#4CAF50', r: 4 }}
                        activeDot={{ r: 6, stroke: '#4CAF50', strokeWidth: 2 }}
                        name="completed"
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Appointments Section */}
        <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-white">Agendamentos</h2>
              <span className="text-sm text-gray-400">
                ({filteredAppointments.length} total)
              </span>
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

          {error && (
            <div className="text-red-500 bg-red-500/10 p-4 rounded-lg mb-4">
              {error instanceof Error ? error.message : String(error)}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F0B35B]"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {filteredAppointments.map((appointment: Appointment) => (
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
