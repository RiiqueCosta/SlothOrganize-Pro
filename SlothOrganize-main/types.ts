
export enum Priority {
  Low = 'Baixa',
  Medium = 'Média',
  High = 'Alta'
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes?: number;
  difficulty?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  dueDate?: number;
  dueTime?: string;
  duration?: number; // Legacy duration (renaming mental model to estimatedMinutes for AI)
  estimatedMinutes?: number; // New field for AI
  difficulty?: number; // 1-5
  subtasks: Subtask[];
  category?: string;
  feeling?: '😫' | '😐' | '🙂' | '😁'; // Emoji feeling on completion
}

export interface User {
  id: string;
  email: string;
  name: string;
}

// --- Finance Types ---

export interface FinancialTransaction {
  id: string;
  type: "entrada" | "saida";
  amount: number; // stored in cents (integer)
  currency: "BRL";
  description: string;
  category: string;
  date: number; // timestamp
  recurring?: {
    interval: "monthly" | "weekly" | "yearly";
    until?: number;
  };
  createdAt: number;
  updatedAt?: number;
}

export interface MonthlyAggregation {
  income: number; // cents
  expense: number; // cents
  balance: number; // cents
  byCategory: { [key: string]: number };
  transactionsCount: number;
}

export interface YearlyAggregation {
  months: {
    month: number;
    income: number;
    expense: number;
    balance: number;
  }[];
  totalIncome: number;
  totalExpense: number;
  bestMonth: number;
  worstMonth: number;
}

// Alias for compatibility with old components until full migration
export type Transaction = {
  id: string;
  description: string;
  amount: number; // float (legacy components use float)
  type: 'income' | 'expense';
  date: number;
  category?: string;
};

// --- AI Response Interfaces ---

export interface PrioritizedTaskResult {
  prioritized_tasks: {
    id: string;
    rank: number;
    reason: string;
    suggested_subtasks?: { title: string; estimated_minutes: number }[];
    action: 'start_now' | 'suggest_later' | 'delegate';
  }[];
  summary: string;
  total_estimated_minutes: number;
}

export interface SubtasksResult {
  subtasks: {
    title: string;
    estimated_minutes: number;
    difficulty: number;
  }[];
  total_estimated_minutes: number;
  notes: string;
}

export interface TimeBoxResult {
  selection: {
    id: string;
    title: string;
    estimated_minutes: number;
  }[];
  total_minutes: number;
  reason: string;
}

export interface CoachResult {
  conversation: {
    role: 'coach' | 'suggestions' | 'plan10min';
    text?: string;
    items?: { title: string }[];
    steps?: { minute: number; action: string }[];
  }[];
  summary: string;
}

export interface EmotionalInsightsResult {
  top_tiring: { title: string; count: number; avg_duration: number }[];
  top_pleasure: { title: string; count: number; avg_duration: number }[];
  recommendations: string[];
  visuals: { type: string; field: string; note: string }[];
}

export interface VoiceCommandResult {
  tipo: 'tarefa' | 'lembrete' | 'evento' | 'projeto';
  titulo: string;
  descricao: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:MM
  local: string;
  categoria: string;
  prioridade: 'Baixa' | 'Média' | 'Alta';
  subtarefas: string[];
  necessitaConfirmacao: boolean;
  perguntaParaUsuario: string;
}

export type FilterType = 'all' | 'active' | 'completed' | 'scheduled';
export type ViewType = 'tasks' | 'calendar' | 'focus' | 'finance' | 'insights';
