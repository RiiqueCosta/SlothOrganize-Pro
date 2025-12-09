
import React from 'react';
import { YearlyAggregation } from '../../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, AlertTriangle } from 'lucide-react';

interface AnnualSummaryProps {
  data: YearlyAggregation;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(cents / 100);
};

export const AnnualSummary: React.FC<AnnualSummaryProps> = ({ data }) => {
  const chartData = data.months.map(m => ({
    name: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m.month-1],
    income: m.income / 100,
    expense: m.expense / 100
  }));

  const monthName = (idx: number) => ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][idx-1];

  return (
    <div className="space-y-6 animate-in fade-in">
       {/* Highlights */}
       <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
             <Trophy size={64} className="absolute -right-4 -bottom-4 text-white/10" />
             <p className="text-indigo-100 text-xs font-bold uppercase mb-1">Melhor Mês (Saldo)</p>
             <h3 className="text-xl font-bold">{monthName(data.bestMonth)}</h3>
          </div>
          <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm relative overflow-hidden">
             <AlertTriangle size={64} className="absolute -right-4 -bottom-4 text-orange-500/10" />
             <p className="text-slate-400 text-xs font-bold uppercase mb-1">Mês Mais "Caro"</p>
             <h3 className="text-xl font-bold text-slate-700">{monthName(data.worstMonth)}</h3>
          </div>
       </div>

       <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Balanço Anual</h4>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                   <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false} />
                   <Tooltip />
                   <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                   <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center text-sm">
          <div className="text-center flex-1 border-r border-slate-200">
             <p className="text-xs text-slate-400 font-bold uppercase">Total Recebido</p>
             <p className="text-emerald-600 font-bold text-base">{formatCurrency(data.totalIncome)}</p>
          </div>
          <div className="text-center flex-1">
             <p className="text-xs text-slate-400 font-bold uppercase">Total Gasto</p>
             <p className="text-red-600 font-bold text-base">{formatCurrency(data.totalExpense)}</p>
          </div>
       </div>
    </div>
  );
};
