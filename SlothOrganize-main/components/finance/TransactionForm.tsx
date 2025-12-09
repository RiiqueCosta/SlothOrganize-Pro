
import React, { useState, useEffect } from 'react';
import { FinancialTransaction } from '../../types';
import { Button } from '../Button';
import { X, Check } from 'lucide-react';

interface TransactionFormProps {
  initialData?: FinancialTransaction;
  onSave: (data: Omit<FinancialTransaction, 'id'>) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onSave, onClose }) => {
  const [type, setType] = useState<'entrada' | 'saida'>('saida');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Salário', 'Freelance', 'Investimentos', 'Outros'];

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setDescription(initialData.description);
      setAmountStr((initialData.amount / 100).toFixed(2).replace('.', ','));
      setCategory(initialData.category);
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
    }
  }, [initialData]);

  // Currency Mask Logic
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    value = (parseInt(value) / 100).toFixed(2) + '';
    value = value.replace('.', ',');
    if(value === 'NaN') value = '';
    setAmountStr(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amountStr || !category) return;

    // Convert string "1.234,56" back to cents integer
    const rawAmount = parseInt(amountStr.replace(/\./g, '').replace(',', ''));
    const dateParts = date.split('-');
    const timestamp = new Date(parseInt(dateParts[0]), parseInt(dateParts[1])-1, parseInt(dateParts[2])).getTime();

    onSave({
      type,
      description,
      amount: rawAmount,
      currency: 'BRL',
      category,
      date: timestamp,
      createdAt: initialData ? initialData.createdAt : Date.now()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">{initialData ? 'Editar Transação' : 'Nova Transação'}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button type="button" onClick={() => setType('saida')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'saida' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Saída</button>
             <button type="button" onClick={() => setType('entrada')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'entrada' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Entrada</button>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor</label>
             <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-medium">R$</span>
                <input 
                  type="text" 
                  value={amountStr} 
                  onChange={handleAmountChange} 
                  className={`w-full pl-10 pr-4 py-3 text-xl font-bold rounded-xl outline-none border-2 focus:ring-0 ${type === 'saida' ? 'text-red-600 border-red-100 focus:border-red-500' : 'text-emerald-600 border-emerald-100 focus:border-emerald-500'}`} 
                  placeholder="0,00"
                  autoFocus
                />
             </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Mercado, Aluguel..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
               <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
             </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full py-3 rounded-xl" icon={<Check size={18}/>}>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
