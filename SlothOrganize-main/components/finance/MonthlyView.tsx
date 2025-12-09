
import React, { useMemo } from 'react';
import { FinancialTransaction, MonthlyAggregation } from '../../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingBag, ArrowUpRight, ArrowDownRight, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonthlyViewProps {
  transactions: FinancialTransaction[];
  aggregation: MonthlyAggregation;
  onEdit: (t: FinancialTransaction) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
};

export const MonthlyView: React.FC<MonthlyViewProps> = ({ transactions, aggregation, onEdit, onDelete }) => {
  
  // Data for Chart (Daily spend/income)
  const chartData = useMemo(() => {
    const daysMap = new Map<number, { day: number, entrada: number, saida: number }>();
    transactions.forEach(t => {
       const day = new Date(t.date).getDate();
       const current = daysMap.get(day) || { day, entrada: 0, saida: 0 };
       if(t.type === 'entrada') current.entrada += t.amount / 100; // convert to float for chart
       else current.saida += t.amount / 100;
       daysMap.set(day, current);
    });
    return Array.from(daysMap.values()).sort((a,b) => a.day - b.day);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
         <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
               <div className="p-1.5 bg-white rounded-full"><TrendingUp size={14}/></div>
               <span className="text-xs font-bold uppercase hidden md:inline">Entradas</span>
            </div>
            <p className="text-sm md:text-lg font-bold text-emerald-800">{formatCurrency(aggregation.income)}</p>
         </div>
         <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
            <div className="flex items-center gap-2 text-red-600 mb-1">
               <div className="p-1.5 bg-white rounded-full"><TrendingDown size={14}/></div>
               <span className="text-xs font-bold uppercase hidden md:inline">Saídas</span>
            </div>
            <p className="text-sm md:text-lg font-bold text-red-800">{formatCurrency(aggregation.expense)}</p>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
               <div className="p-1.5 bg-slate-100 rounded-full"><ShoppingBag size={14}/></div>
               <span className="text-xs font-bold uppercase hidden md:inline">Saldo</span>
            </div>
            <p className={`text-sm md:text-lg font-bold ${aggregation.balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>{formatCurrency(aggregation.balance)}</p>
         </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 h-64 shadow-sm">
         <h4 className="text-xs font-bold text-slate-400 uppercase mb-4">Fluxo Diário</h4>
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
               <XAxis dataKey="day" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
               <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
               />
               <Bar dataKey="entrada" fill="#10b981" radius={[4,4,0,0]} stackId="a" />
               <Bar dataKey="saida" fill="#ef4444" radius={[4,4,0,0]} stackId="a" />
            </BarChart>
         </ResponsiveContainer>
      </div>

      {/* Categories Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Gastos por Categoria</h4>
          <div className="space-y-3">
             {Object.entries(aggregation.byCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([cat, val], i) => (
                 <div key={cat} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                       <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{i+1}</span>
                       <span className="text-slate-700">{cat}</span>
                    </div>
                    <span className="font-medium text-slate-900">{formatCurrency(val)}</span>
                 </div>
             ))}
          </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3 pb-10">
         <h4 className="text-xs font-bold text-slate-400 uppercase px-1">Extrato</h4>
         {transactions.length === 0 ? <p className="text-center text-slate-400 text-sm py-8">Nenhuma transação neste mês.</p> :
            transactions.map(t => (
               <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-full ${t.type === 'entrada' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {t.type === 'entrada' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                     </div>
                     <div>
                        <p className="text-sm font-medium text-slate-800">{t.description}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                           <span>{format(new Date(t.date), "dd 'de' MMM", { locale: ptBR })}</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">{t.category}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`text-sm font-bold ${t.type === 'entrada' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {t.type === 'saida' && '- '}{formatCurrency(t.amount)}
                     </span>
                     <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(t)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded"><Edit2 size={14}/></button>
                        <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                     </div>
                  </div>
               </div>
            ))
         }
      </div>
    </div>
  );
};
