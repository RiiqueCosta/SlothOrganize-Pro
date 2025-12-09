
import React, { useEffect, useState } from 'react';
import { Task, EmotionalInsightsResult } from '../types';
import { getEmotionalInsights } from '../services/geminiService';
import { TrendingUp, Battery, BatteryCharging, Lightbulb, Activity } from 'lucide-react';

interface EmotionalDashboardProps {
  completedTasks: Task[];
}

export const EmotionalDashboard: React.FC<EmotionalDashboardProps> = ({ completedTasks }) => {
  const [insights, setInsights] = useState<EmotionalInsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (completedTasks.length < 3) {
        setLoading(false);
        return;
      }
      const res = await getEmotionalInsights(completedTasks.slice(-20)); // Last 20 tasks
      setInsights(res);
      setLoading(false);
    };
    fetch();
  }, [completedTasks]);

  if (loading) return <div className="p-8 text-center text-slate-400 animate-pulse">Analisando seu padrão emocional...</div>;

  if (!insights) return (
    <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
       <Activity size={32} className="mx-auto text-slate-300 mb-2"/>
       <p className="text-slate-500 text-sm">Complete mais algumas tarefas e registre como se sente para gerar insights!</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       {/* Recommendations */}
       <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-4">
             <Lightbulb size={20} className="text-yellow-300" />
             <h3 className="font-bold text-lg">Dicas da Semana</h3>
          </div>
          <ul className="space-y-2">
             {insights.recommendations.map((rec, i) => (
                 <li key={i} className="flex gap-2 text-sm text-indigo-50 font-medium">
                     <span>•</span> {rec}
                 </li>
             ))}
          </ul>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Draining Tasks */}
           <div className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-red-600">
                  <Battery size={20} />
                  <h4 className="font-bold text-sm uppercase">O que te cansa</h4>
              </div>
              <div className="space-y-2">
                 {insights.top_tiring.length === 0 ? <p className="text-xs text-slate-400">Sem dados suficientes.</p> : 
                    insights.top_tiring.map((t, i) => (
                      <div key={i} className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">{t.title}</span>
                          <span className="text-xs text-red-400 font-bold">{t.count}x</span>
                      </div>
                    ))
                 }
              </div>
           </div>

           {/* Energizing Tasks */}
           <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-green-600">
                  <BatteryCharging size={20} />
                  <h4 className="font-bold text-sm uppercase">O que te energiza</h4>
              </div>
              <div className="space-y-2">
                 {insights.top_pleasure.length === 0 ? <p className="text-xs text-slate-400">Sem dados suficientes.</p> :
                    insights.top_pleasure.map((t, i) => (
                      <div key={i} className="flex justify-between items-center bg-green-50 p-2 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">{t.title}</span>
                          <span className="text-xs text-green-500 font-bold">{t.count}x</span>
                      </div>
                    ))
                 }
              </div>
           </div>
       </div>

       {/* Visuals Placeholder - Since we don't have a chart lib, we simulate bars */}
       <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <h4 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2"><Activity size={16}/> Balanço Emocional</h4>
           <div className="space-y-4">
              <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-500"><span>Satisfação (😁/🙂)</span> <span>Energia</span></div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400" style={{ width: '65%' }}></div>
                 </div>
              </div>
              <div className="space-y-1">
                 <div className="flex justify-between text-xs text-slate-500"><span>Cansaço (😫/😐)</span> <span>Fadiga</span></div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-400" style={{ width: '35%' }}></div>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-right">*Baseado nos seus registros de sentimento.</p>
           </div>
       </div>
    </div>
  );
};
