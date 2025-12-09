
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Priority, FilterType, ViewType, User, Transaction, VoiceCommandResult } from './types';
import { generateSubtasksDetailed } from './services/geminiService';
import { authService } from './services/authService';
import { TaskItem } from './components/TaskItem';
import { StatsCard } from './components/StatsCard';
import { CalendarView } from './components/CalendarView';
import { FocusTimer } from './components/FocusTimer';
import { FinanceDashboard } from './components/finance/FinanceDashboard'; // Updated Import
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { Button } from './components/Button';
import { MoodPrioritizer } from './components/MoodPrioritizer';
import { TimeBoxSuggester } from './components/TimeBoxSuggester';
import { CoachModal } from './components/CoachModal';
import { EmotionalDashboard } from './components/EmotionalDashboard';
import { VoiceInput } from './components/VoiceInput';
import { Plus, ListFilter, Calendar, LayoutList, History, Timer, CalendarClock, Settings, X, Flag, LogOut, Wallet, Clock, Sparkles, BarChart2 } from 'lucide-react';

const SlothIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 6h20" className="opacity-70" /><path d="M7 6v4a3 3 0 0 0 3 3" /><path d="M17 6v4a3 3 0 0 1-3 3" /><path d="M10 13h4" /><path d="M12 21a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" /><path d="M10 16h.01" /><path d="M14 16h.01" /><path d="M11 18c.5.5 1.5.5 2 0" />
  </svg>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  // Legacy transactions state removed in favor of FinanceDashboard internal state
  
  // New Task Inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(''); 
  const [newTaskTime, setNewTaskTime] = useState(''); 
  const [newTaskDuration, setNewTaskDuration] = useState(''); // Treated as Estimated Minutes
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>(Priority.Medium);
  
  const [filter, setFilter] = useState<FilterType>('active');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('tasks');
  
  // AI Modals State
  const [showMoodPrioritizer, setShowMoodPrioritizer] = useState(false);
  const [showTimeBox, setShowTimeBox] = useState(false);
  const [coachTask, setCoachTask] = useState<Task | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => { document.title = "SlothOrganize"; }, []);

  useEffect(() => {
    const checkSession = async () => {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) setUser(currentUser);
      setIsLoading(false);
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userKey = `taskflow_data_${user.id}`;
    const saved = localStorage.getItem(userKey);
    
    if (saved) { try { setTasks(JSON.parse(saved)); } catch { setTasks([]); } } else { setTasks([]); }

    const settingsKey = `sloth_settings_${user.id}`;
    const savedSettings = localStorage.getItem(settingsKey);
    if (savedSettings) {
      try { const s = JSON.parse(savedSettings); setSoundEnabled(s.soundEnabled ?? true); setNotificationsEnabled(s.notificationsEnabled ?? false); } catch {}
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`taskflow_data_${user.id}`, JSON.stringify(tasks));
    localStorage.setItem(`sloth_settings_${user.id}`, JSON.stringify({ soundEnabled, notificationsEnabled }));
  }, [tasks, soundEnabled, notificationsEnabled, user]);

  const handleLogout = () => { if (window.confirm("Sair?")) { authService.logout(); setUser(null); setTasks([]); setActiveView('tasks'); } };

  const addTask = (e?: React.FormEvent, customDate?: Date, titleOverride?: string) => {
    if (e) e.preventDefault();
    const titleToUse = titleOverride || newTaskTitle;
    if (!titleToUse.trim()) return;

    let finalDueDate = Date.now();
    if (customDate) finalDueDate = customDate.getTime();
    else if (newTaskDate) {
       const parts = newTaskDate.split('-');
       finalDueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0).getTime();
    }

    const newTask: Task = {
      id: crypto.randomUUID(), 
      title: titleToUse.trim(), 
      priority: newTaskPriority, 
      completed: false, 
      createdAt: Date.now(), 
      dueDate: finalDueDate, 
      dueTime: newTaskTime || undefined, 
      estimatedMinutes: newTaskDuration ? parseInt(newTaskDuration) : undefined, 
      difficulty: 3, // Default difficulty
      subtasks: []
    };

    setTasks(prev => [newTask, ...prev]);
    if (!titleOverride) { setNewTaskTitle(''); setNewTaskDate(''); setNewTaskTime(''); setNewTaskDuration(''); setNewTaskPriority(Priority.Medium); }
  };

  const handleVoiceTask = (voiceResult: VoiceCommandResult) => {
    let finalDueDate = undefined;
    if (voiceResult.data) {
       const parts = voiceResult.data.split('-');
       finalDueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0).getTime();
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: voiceResult.titulo,
      description: voiceResult.descricao,
      priority: voiceResult.prioridade as Priority,
      completed: false,
      createdAt: Date.now(),
      dueDate: finalDueDate,
      dueTime: voiceResult.hora || undefined,
      category: voiceResult.categoria || undefined,
      difficulty: 3,
      subtasks: voiceResult.subtarefas?.map(st => ({
        id: crypto.randomUUID(),
        title: st,
        completed: false
      })) || []
    };

    setTasks(prev => [newTask, ...prev]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  
  const toggleTask = (id: string, feeling?: '😫' | '😐' | '🙂' | '😁') => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined, feeling: !t.completed ? feeling : undefined } : t));
  const snoozeTask = (id: string) => setTasks(prev => prev.map(t => { if (t.id !== id) return t; const d = t.dueDate ? new Date(t.dueDate) : new Date(); d.setDate(d.getDate()+1); return { ...t, dueDate: d.getTime() }; }));
  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const toggleSubtask = (tid: string, sid: string) => setTasks(prev => prev.map(t => t.id !== tid ? t : { ...t, subtasks: t.subtasks.map(s => s.id === sid ? { ...s, completed: !s.completed } : s) }));
  const addSubtask = (tid: string, title: string) => setTasks(prev => prev.map(t => t.id !== tid ? t : { ...t, subtasks: [...t.subtasks, { id: crypto.randomUUID(), title, completed: false }] }));
  const deleteSubtask = (tid: string, sid: string) => setTasks(prev => prev.map(t => t.id !== tid ? t : { ...t, subtasks: t.subtasks.filter(s => s.id !== sid) }));
  
  const handleEnhanceTask = async (task: Task) => { 
    setLoadingAI(task.id); 
    const res = await generateSubtasksDetailed(task.title, task.description || ""); 
    if(res) { 
        setTasks(prev => prev.map(t => t.id === task.id ? { 
            ...t, 
            description: res.notes ? `${t.description || ''} \nDica: ${res.notes}` : t.description,
            subtasks: [...t.subtasks, ...res.subtasks.map(st => ({ id: crypto.randomUUID(), title: st.title, estimatedMinutes: st.estimated_minutes, difficulty: st.difficulty, completed: false }))] 
        } : t)); 
    } 
    setLoadingAI(null); 
  };

  const handleApplyPrioritization = (orderedIds: string[]) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      setTasks(prev => {
          const sorted = [...prev].sort((a, b) => {
              const rankA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
              const rankB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
              return rankA - rankB;
          });
          return sorted;
      });
  };

  const handleToggleNotifications = () => { if (!notificationsEnabled && Notification.permission !== 'granted') { Notification.requestPermission().then(p => setNotificationsEnabled(p === 'granted')); } else { setNotificationsEnabled(!notificationsEnabled); } };
  const handleClearCompleted = () => setTasks(prev => prev.filter(t => !t.completed));
  const handleResetAll = () => { setTasks([]); };
  const cycleNewTaskPriority = () => setNewTaskPriority(p => p===Priority.Low?Priority.Medium:p===Priority.Medium?Priority.High:Priority.Low);
  const priorityFlagColors = { [Priority.High]: 'text-red-500 fill-red-500', [Priority.Medium]: 'text-amber-500 fill-amber-500', [Priority.Low]: 'text-blue-500 fill-blue-500' };

  const filteredTasks = tasks.filter(task => { 
      if(activeView !== 'tasks') return true; 
      if (selectedCategory && task.category !== selectedCategory) return false; 
      if (filter === 'active') return !task.completed && (!task.dueDate || task.dueDate <= new Date().setHours(23,59,59,999)); 
      if (filter === 'scheduled') return !task.completed && task.dueDate && task.dueDate > new Date().setHours(23,59,59,999); 
      if (filter === 'completed') return task.completed; 
      return true; 
  });
  
  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><SlothIcon size={24} /></div>;
  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 md:pb-10">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30"><SlothIcon size={24} /></div>
            <div><h1 className="text-xl font-bold text-slate-900">SlothOrganize</h1><p className="text-[10px] font-medium text-primary-600 uppercase">Olá, {user.name.split(' ')[0]}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMoodPrioritizer(true)} className="p-2 text-indigo-500 bg-indigo-50 rounded-lg hover:bg-indigo-100" title="Priorizar com IA"><Sparkles size={20} /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400"><Settings size={20} /></button>
            <button onClick={handleLogout} className="p-2 text-slate-400"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {activeView === 'tasks' && (
          <div className="animate-in slide-in-from-left-4 duration-300 space-y-6">
            <div className="flex gap-2 mb-2">
                 <StatsCard tasks={tasks} />
                 <button onClick={() => setShowTimeBox(true)} className="hidden md:flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-600 hover:bg-slate-50 w-24">
                    <Timer size={24} className="text-primary-500 mb-1" />
                    <span className="text-[10px] font-bold text-center leading-tight">Encaixe Rápido</span>
                 </button>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-lg shadow-primary-500/5 border border-primary-100 relative">
              <form onSubmit={addTask} className="flex flex-col gap-3">
                <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="O que vamos fazer hoje?" className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 outline-none text-lg font-medium" />
                <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-3 mt-1 gap-2">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <button type="button" onClick={cycleNewTaskPriority} className="p-2 rounded-lg hover:bg-slate-50"><Flag size={20} className={priorityFlagColors[newTaskPriority]} /></button>
                        <div className="relative">
                            <button type="button" className={`p-2 rounded-lg flex items-center gap-2 ${newTaskDate ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`} onClick={() => (document.getElementById('main-date-input') as HTMLInputElement).showPicker()}><CalendarClock size={20} /></button>
                            <input id="main-date-input" type="date" value={newTaskDate} onChange={(e) => setNewTaskDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </div>
                        <div className="flex items-center bg-slate-50 rounded-lg px-2 py-1 gap-1"><Clock size={14} className="text-slate-400" /><input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="bg-transparent text-xs outline-none w-16" /></div>
                        <input type="number" placeholder="Min" value={newTaskDuration} onChange={(e) => setNewTaskDuration(e.target.value)} className="w-12 text-xs px-2 py-1.5 bg-slate-50 rounded-lg outline-none" title="Estimativa em minutos" />
                    </div>
                    <Button type="submit" className="rounded-xl px-6" disabled={!newTaskTitle.trim()} icon={<Plus size={18} />}>Adicionar</Button>
                </div>
              </form>
            </div>

            <button onClick={() => setShowTimeBox(true)} className="md:hidden w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm">
                <Timer size={16} className="text-primary-500" /> Tenho um tempinho livre...
            </button>

            <div className="space-y-3">
                <div className="flex items-center gap-1 bg-slate-200/50 p-1 rounded-xl whitespace-nowrap w-full overflow-x-auto">
                    {(['all', 'active', 'scheduled', 'completed'] as FilterType[]).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${filter === f ? 'bg-white shadow-sm' : 'text-slate-500'}`}>{f === 'all' ? 'Todas' : f === 'active' ? 'Hoje' : f === 'scheduled' ? 'Futuro' : 'Feitas'}</button>
                    ))}
                </div>
                <div className="space-y-3 pb-8">
                    {filteredTasks.map(task => (
                        <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={toggleTask} 
                            onDelete={deleteTask} 
                            onUpdate={updateTask} 
                            onToggleSubtask={toggleSubtask} 
                            onAddSubtask={addSubtask} 
                            onDeleteSubtask={deleteSubtask} 
                            onEnhance={handleEnhanceTask} 
                            onSnooze={snoozeTask} 
                            onOpenCoach={setCoachTask}
                            isEnhancing={loadingAI === task.id} 
                        />
                    ))}
                    {filteredTasks.length === 0 && <div className="text-center py-10 text-slate-400 text-sm">Nenhuma tarefa encontrada. Aproveite o descanso! 🦥</div>}
                </div>
            </div>
          </div>
        )}

        {/* Updated Finance View */}
        {activeView === 'finance' && <FinanceDashboard user={user} />}
        
        {activeView === 'calendar' && <CalendarView tasks={tasks} onAddTask={(title, date) => addTask(undefined, date, title)} />}
        {activeView === 'focus' && <FocusTimer soundEnabled={soundEnabled} notificationsEnabled={notificationsEnabled} />}
        {activeView === 'insights' && <EmotionalDashboard completedTasks={tasks.filter(t => t.completed)} />}
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} notificationsEnabled={notificationsEnabled} soundEnabled={soundEnabled} onToggleNotifications={handleToggleNotifications} onToggleSound={() => setSoundEnabled(!soundEnabled)} onClearCompleted={handleClearCompleted} onResetAll={handleResetAll} />
      
      {showMoodPrioritizer && <MoodPrioritizer tasks={tasks} onApplyPrioritization={handleApplyPrioritization} onClose={() => setShowMoodPrioritizer(false)} />}
      {showTimeBox && <TimeBoxSuggester tasks={tasks} onClose={() => setShowTimeBox(false)} onStartFocus={(duration) => { setActiveView('focus'); }} />}
      {coachTask && <CoachModal task={coachTask} onClose={() => setCoachTask(null)} />}

      {/* Voice Input Floating Button */}
      {activeView === 'tasks' && <VoiceInput onTaskCreated={handleVoiceTask} />}

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 md:hidden safe-area-pb">
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
          <button onClick={() => setActiveView('tasks')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'tasks' ? 'text-primary-600' : 'text-slate-400'}`}><LayoutList size={20} /><span className="text-[10px]">Tarefas</span></button>
          <button onClick={() => setActiveView('finance')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'finance' ? 'text-primary-600' : 'text-slate-400'}`}><Wallet size={20} /><span className="text-[10px]">Gastos</span></button>
          <button onClick={() => setActiveView('focus')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'focus' ? 'text-primary-600' : 'text-slate-400'}`}><Timer size={20} /><span className="text-[10px]">Foco</span></button>
          <button onClick={() => setActiveView('insights')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'insights' ? 'text-primary-600' : 'text-slate-400'}`}><BarChart2 size={20} /><span className="text-[10px]">Insights</span></button>
          <button onClick={() => setActiveView('calendar')} className={`flex flex-col items-center justify-center gap-1 ${activeView === 'calendar' ? 'text-primary-600' : 'text-slate-400'}`}><History size={20} /><span className="text-[10px]">Hist.</span></button>
        </div>
      </nav>
      
      <div className="hidden md:block fixed bottom-8 right-8 z-30">
        <div className="bg-white rounded-full shadow-xl border border-slate-100 p-1 flex flex-col gap-1">
           <button onClick={() => setActiveView('tasks')} className={`p-3 rounded-full ${activeView === 'tasks' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutList size={20} /></button>
           <button onClick={() => setActiveView('finance')} className={`p-3 rounded-full ${activeView === 'finance' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Wallet size={20} /></button>
           <button onClick={() => setActiveView('focus')} className={`p-3 rounded-full ${activeView === 'focus' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><Timer size={20} /></button>
           <button onClick={() => setActiveView('insights')} className={`p-3 rounded-full ${activeView === 'insights' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><BarChart2 size={20} /></button>
           <button onClick={() => setActiveView('calendar')} className={`p-3 rounded-full ${activeView === 'calendar' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-50'}`}><History size={20} /></button>
        </div>
      </div>
    </div>
  );
};
export default App;
