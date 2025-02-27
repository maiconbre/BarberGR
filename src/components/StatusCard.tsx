import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatusCardProps {
  pendingAppointments: number;
  completedAppointments: number;
  pendingRevenue: number;
  completedRevenue: number;
}

const StatusCard: React.FC<StatusCardProps> = ({
  pendingAppointments,
  completedAppointments,
  pendingRevenue,
  completedRevenue
}) => {
  return (
    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-4">Status dos Agendamentos</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-yellow-500 text-xs">Pendente</p>
              <p className="text-2xl font-bold text-yellow-500">{pendingAppointments || 'Sem dados'}</p>
              <p className="text-sm text-yellow-500">{pendingRevenue ? `R$ ${pendingRevenue.toFixed(2)}` : 'Sem receita'}</p>
            </div>
            <div>
              <p className="text-green-500 text-xs">Concluídos</p>
              <p className="text-2xl font-bold text-green-500">{completedAppointments || 'Sem dados'}</p>
              <p className="text-sm text-green-500">{completedRevenue ? `R$ ${completedRevenue.toFixed(2)}` : 'Sem receita'}</p>
            </div>
          </div>
        </div>
        <div className="w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Aguardando', value: pendingAppointments, color: '#FFD700' },
                  { name: 'Concluídos', value: completedAppointments, color: '#4CAF50' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={5}
                dataKey="value"
                activeShape={false}
                isAnimationActive={false}
              >
                {[
                  { name: 'Aguardando', value: pendingAppointments, color: '#FFD700' },
                  { name: 'Concluídos', value: completedAppointments, color: '#4CAF50' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatusCard;