
import React, { useState } from 'react';
import { Task, PrioritizedTaskResult } from '../types';
import { prioritizeByMood } from '../services/geminiService';
import { Button } from './Button';
import { Sparkles, ArrowRight, Zap, Coffee, Frown, Smile, X, Check } from 'lucide-react';

interface MoodPrioritizerProps {
  tasks: Task[];
  onApplyPrioritization: (orderedTaskIds: string[]) => void;
  onClose: () => void;
}

export const MoodPrioritizer: React.FC<MoodPrioritizerProps> = ({ tasks, onApplyPrioritization, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(50);
  const [time, setTime] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PrioritizedTaskResult | null>(null);

  const moods = [
    { id: 'produtivo', label: 'Produtivo', icon: <Zap size={20} className="text-yellow-500" /> },
    { id: 'cansado', label: 'Cansado', icon: <Coffee size={20} className="text-amber-700" /> },
    { id: 'ansioso', label: 'Ansioso', icon: <Frown size={20} className="text-purple-500" /> },
    { id: 'sem_foco', label: 'Sem Foco', icon: <Smile size={20} className="text-blue-500" /> },
  ];

  const handleGenerate = async () => {
    if (!mood) return;
    setIsLoading(true);
    const res = await prioritizeByMood(mood, energy, time, tasks.filter(t => !t.completed));
    if (res) {
      setResult(res);
      setStep(2);
    }
    setIsLoading(false);
  };

  const handleConfirm = () => {
    if (result) {
      const orderedIds = result.prioritized_tasks.map(t => t.id);
      onApplyPrioritization(orderedIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-primary-50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles size={18} className="text-primary-600"/> Planejamento Inteligente</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Como você está se sentindo?</label>
                <div className="grid grid-cols-2 gap-3">
                  {moods.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMood(m.id)}
                      className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${mood === m.id ? 'bg-primary-50 border-primary-500 shadow-md transform scale-105' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    >
                      {m.icon}
                      <span className="text-sm font-medium text-slate-700">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nível de Energia: {energy}%</label>
                <input type="range" min="0" max="100" value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600" />
                <div className="flex justify-between text-xs text-slate-400 mt-1"><span>Baixa</span><span>Alta</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tempo disponível (min)</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[15, 30, 60, 120].map(t => (
                    <button key={t} onClick={() => setTime(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${time === t ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t} min</button>
                  ))}
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={!mood} isLoading={isLoading} className="w-full mt-4" icon={<ArrowRight size={18} />}>Gerar Plano</Button>
            </div>
          ) : (
            <div className="space-y-4">
               {result?.summary && <div className="bg-indigo-50 p-3 rounded-xl text-indigo-800 text-sm italic">"{result.summary}"</div>}
               <div className="space-y-3">
                 {result?.prioritized_tasks.map((pt, idx) => {
                   const original = tasks.find(t => t.id === pt.id);
                   if(!original) return null;
                   return (
                     <div key={pt.id} className="border border-slate-100 rounded-xl p-3 bg-white shadow-sm flex flex-col gap-2">
                       <div className="flex items-start justify-between">
                         <div className="flex items-center gap-2">
                           <span className="bg-slate-100 text-slate-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{idx + 1}</span>
                           <span className="font-medium text-slate-800">{original.title}</span>
                         </div>
                         <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${pt.action === 'start_now' ? 'bg-green-100 text-green-700' : pt.action === 'delegate' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>{pt.action === 'start_now' ? 'Fazer Agora' : pt.action === 'delegate' ? 'Delegar' : 'Adiar'}</span>
                       </div>
                       <p className="text-xs text-slate-500 pl-8">{pt.reason}</p>
                       {pt.suggested_subtasks && pt.suggested_subtasks.length > 0 && (
                         <div className="pl-8 mt-1 space-y-1">
                           {pt.suggested_subtasks.map((st, i) => (
                             <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-1.5 rounded"><div className="w-1 h-1 bg-slate-400 rounded-full"></div>{st.title} <span className="text-slate-400 ml-auto">{st.estimated_minutes}m</span></div>
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })}
               </div>
               <div className="flex gap-3 pt-2">
                 <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                 <Button onClick={handleConfirm} className="flex-1" icon={<Check size={18} />}>Aplicar Ordem</Button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
