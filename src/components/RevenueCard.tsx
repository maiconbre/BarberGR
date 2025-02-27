  //
// Compare this snippet from Footer.tsx:
// import React from 'react';
//
// const Footer = () => {
//   return (
interface RevenueCardProps {
  totalRevenue: number;
  receitaHoje: number;
  ticketMedio: number;
  taxaConclusao: number;
}

const RevenueCard: React.FC<RevenueCardProps> = ({
  totalRevenue,
  receitaHoje,
  ticketMedio,
  taxaConclusao
}) => {
  return (
    <div className="bg-gradient-to-br from-[#1A1F2E] to-[#252B3B] p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-gray-400 text-sm mb-4">Receita Total</p>
          <p className="text-2xl font-bold text-[#F0B35B]">
            {totalRevenue ? `R$ ${totalRevenue.toFixed(2)}` : 'Sem receita'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs">Hoje</p>
              <p className="text-lg font-semibold text-[#F0B35B]">
                {receitaHoje ? `R$ ${receitaHoje.toFixed(2)}` : 'Sem receita'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Ticket Médio</p>
              <p className="text-lg font-semibold text-[#F0B35B]">
                {ticketMedio ? `R$ ${ticketMedio.toFixed(2)}` : 'Sem dados'}
              </p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Taxa de Conclusão</p>
          <p className="text-lg font-semibold text-green-500">
            {taxaConclusao ? `${taxaConclusao.toFixed(1)}%` : 'Sem dados'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueCard;