
import React, { useState } from 'react';
import { Task, TimeBoxResult } from '../types';
import { suggestTasksForTime } from '../services/geminiService';
import { Button } from './Button';
import { Timer, ArrowRight, X, Play } from 'lucide-react';

interface TimeBoxSuggesterProps {
  tasks: Task[];
  onClose: () => void;
  onStartFocus: (duration: number) => void;
}

export const TimeBoxSuggester: React.FC<TimeBoxSuggesterProps> = ({ tasks, onClose, onStartFocus }) => {
  const [minutes, setMinutes] = useState(20);
  const [preference, setPreference] = useState<'impacto' | 'rápido' | 'misturado'>('misturado');
  const [result, setResult] = useState<TimeBoxResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSuggest = async () => {
    setIsLoading(true);
    const res = await suggestTasksForTime(minutes, tasks.filter(t => !t.completed), preference);
    setResult(res);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Timer size={18} className="text-primary-600"/> Encaixe Rápido</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6">
          {!result ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Quanto tempo você tem?</label>
                <div className="flex items-center gap-3">
                    <input type="range" min="5" max="120" step="5" value={minutes} onChange={(e) => setMinutes(parseInt(e.target.value))} className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                    <span className="font-bold text-primary-600 w-16 text-right">{minutes} min</span>
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Foco:</label>
                 <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['impacto', 'misturado', 'rápido'] as const).map(p => (
                        <button key={p} onClick={() => setPreference(p)} className={`flex-1 py-2 text-xs font-medium rounded-md capitalize transition-all ${preference === p ? 'bg-white shadow text-primary-700' : 'text-slate-500 hover:text-slate-700'}`}>{p}</button>
                    ))}
                 </div>
              </div>

              <Button onClick={handleSuggest} isLoading={isLoading} className="w-full" icon={<ArrowRight size={18} />}>Ver Sugestões</Button>
            </div>
          ) : (
            <div className="space-y-4">
                <div className="bg-primary-50 p-3 rounded-xl border border-primary-100">
                    <p className="text-primary-800 text-sm italic">"{result.reason}"</p>
                    <p className="text-primary-600 text-xs font-bold mt-2 text-right">Total: {result.total_minutes} min</p>
                </div>

                <div className="space-y-2">
                    {result.selection.map(item => (
                        <div key={item.id} className="bg-white border border-slate-200 p-3 rounded-xl flex justify-between items-center shadow-sm">
                            <span className="text-sm font-medium text-slate-700">{item.title}</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{item.estimated_minutes}m</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 mt-4">
                    <Button variant="secondary" onClick={() => setResult(null)} className="flex-1">Voltar</Button>
                    <Button onClick={() => { onStartFocus(result.total_minutes); onClose(); }} className="flex-1" icon={<Play size={16} />}>Iniciar Foco</Button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
