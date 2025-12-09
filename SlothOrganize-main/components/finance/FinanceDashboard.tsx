
import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { MonthlyView } from './MonthlyView';
import { AnnualSummary } from './AnnualSummary';
import { TransactionForm } from './TransactionForm';
import { financeService } from '../../services/financeService';
import { FinancialTransaction, MonthlyAggregation, YearlyAggregation } from '../../types';
import { ChevronLeft, ChevronRight, Plus, Download, BarChart2, Calendar } from 'lucide-react';
import { User } from '../../types';

interface FinanceDashboardProps {
  user: User;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ user }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [monthlyAgg, setMonthlyAgg] = useState<MonthlyAggregation | null>(null);
  const [yearlyAgg, setYearlyAgg] = useState<YearlyAggregation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<FinancialTransaction | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Load Data
  useEffect(() => {
    loadData();
  }, [currentDate, viewMode, user.id]);

  const loadData = async () => {
    setIsLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    if (viewMode === 'monthly') {
      const [txs, agg] = await Promise.all([
        financeService.getTransactionsByMonth(user.id, year, month),
        financeService.aggregateMonth(user.id, year, month)
      ]);
      setTransactions(txs);
      setMonthlyAgg(agg);
    } else {
      const agg = await financeService.aggregateYear(user.id, year);
      setYearlyAgg(agg);
    }
    setIsLoading(false);
  };

  const handleSave = async (data: any) => {
    if (editingTx) {
      await financeService.updateTransaction(user.id, editingTx.id, data);
    } else {
      await financeService.addTransaction(user.id, data);
    }
    setIsModalOpen(false);
    setEditingTx(undefined);
    loadData(); // Refresh
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await financeService.deleteTransaction(user.id, id);
      loadData();
    }
  };

  const changeDate = (offset: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() + offset);
    else newDate.setFullYear(newDate.getFullYear() + offset);
    setCurrentDate(newDate);
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Seed data shortcut for demo
  const handleSeed = () => financeService.seedData(user.id);

  return (
    <div className="pb-20">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
           <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
              <button onClick={() => setViewMode('monthly')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'monthly' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>Mensal</button>
              <button onClick={() => setViewMode('yearly')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'yearly' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}>Anual</button>
           </div>
           
           <div className="flex items-center gap-2">
              <button onClick={() => changeDate(-1)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"><ChevronLeft size={20}/></button>
              <span className="text-sm font-bold text-slate-800 min-w-[100px] text-center">
                 {viewMode === 'monthly' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : currentDate.getFullYear()}
              </span>
              <button onClick={() => changeDate(1)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"><ChevronRight size={20}/></button>
           </div>
        </div>

        <div className="flex gap-2">
            {/* Demo Seed Button */}
            {transactions.length === 0 && viewMode === 'monthly' && (
                <button onClick={handleSeed} className="hidden md:block text-xs text-indigo-400 hover:underline">Gerar Dados Teste</button>
            )}
            <Button size="sm" onClick={() => { setEditingTx(undefined); setIsModalOpen(true); }} icon={<Plus size={16}/>}>
               <span className="hidden md:inline">Nova Transação</span>
            </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400"><div className="animate-spin mr-2 w-5 h-5 border-2 border-slate-300 border-t-primary-500 rounded-full"></div> Carregando...</div>
      ) : (
        <>
          {viewMode === 'monthly' && monthlyAgg && (
            <MonthlyView 
              transactions={transactions} 
              aggregation={monthlyAgg} 
              onEdit={(t) => { setEditingTx(t); setIsModalOpen(true); }} 
              onDelete={handleDelete} 
            />
          )}
          {viewMode === 'yearly' && yearlyAgg && (
            <AnnualSummary data={yearlyAgg} />
          )}
        </>
      )}

      {isModalOpen && (
        <TransactionForm 
          initialData={editingTx} 
          onSave={handleSave} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
};
