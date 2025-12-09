
import React, { useState, useEffect } from 'react';
import { Task, CoachResult } from '../types';
import { getCoachingAdvice } from '../services/geminiService';
import { Button } from './Button';
import { MessageCircle, X, Send, LifeBuoy } from 'lucide-react';

interface CoachModalProps {
  task: Task;
  onClose: () => void;
}

export const CoachModal: React.FC<CoachModalProps> = ({ task, onClose }) => {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);

  const handleAsk = async () => {
    setIsLoading(true);
    const res = await getCoachingAdvice(task.title, task.description || "", note);
    setResult(res);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
          <div className="flex items-center gap-3">
             <div className="bg-white p-2 rounded-full shadow-sm">
                 <LifeBuoy size={20} className="text-indigo-500" />
             </div>
             <div>
                 <h2 className="font-bold text-slate-800 text-sm">Coach Sloth</h2>
                 <p className="text-[10px] text-slate-500">Ajuda para começar "{task.title}"</p>
             </div>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
           {!result ? (
             <div className="flex flex-col h-full justify-center items-center text-center p-6 opacity-70">
                <LifeBuoy size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 text-sm">Descreva brevemente o que está te travando (ex: "não sei por onde começar" ou "estou com medo de errar").</p>
             </div>
           ) : (
             <div className="space-y-4">
                {result.conversation.map((msg, idx) => (
                    <div key={idx} className={`animate-in slide-in-from-bottom-2 duration-500 delay-${idx*100}`}>
                        {msg.role === 'coach' && (
                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700 text-sm max-w-[90%]">
                                {msg.text}
                            </div>
                        )}
                        {msg.role === 'suggestions' && msg.items && (
                            <div className="bg-indigo-50 p-3 rounded-2xl shadow-sm border border-indigo-100 mt-2">
                                <p className="text-xs font-bold text-indigo-700 mb-2 uppercase">Sugestões Rápidas:</p>
                                <ul className="space-y-2">
                                    {msg.items.map((it, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-indigo-900 bg-white/50 p-2 rounded">
                                            <span className="text-indigo-500">•</span> {it.title}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {msg.role === 'plan10min' && msg.steps && (
                             <div className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm mt-2">
                                <p className="text-sm font-bold text-slate-800 mb-3">🚀 Plano de 10 Minutos</p>
                                <div className="space-y-3 relative">
                                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                                    {msg.steps.map((step, i) => (
                                        <div key={i} className="flex gap-3 relative">
                                            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow flex-shrink-0 z-10"></div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-400 block mb-0.5">{step.minute} min</span>
                                                <p className="text-sm text-slate-700">{step.action}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                ))}
                <div className="text-center pt-4">
                    <p className="text-xs text-slate-400 italic">{result.summary}</p>
                </div>
             </div>
           )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
           {!result && (
               <div className="flex gap-2">
                   <input 
                      type="text" 
                      value={note} 
                      onChange={(e) => setNote(e.target.value)} 
                      placeholder="Estou travado porque..." 
                      className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                   />
                   <Button onClick={handleAsk} disabled={!note} isLoading={isLoading} className="rounded-xl w-12 flex justify-center px-0"><Send size={18} /></Button>
               </div>
           )}
           {result && (
               <Button onClick={onClose} className="w-full">Vamos lá!</Button>
           )}
        </div>
      </div>
    </div>
  );
};
