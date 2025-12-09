
import { db, functions } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FinancialTransaction, MonthlyAggregation, YearlyAggregation } from '../types';

const COLLECTION_KEY = 'finances';

// Fallback Local Storage Helper
const getLocalData = (uid: string): FinancialTransaction[] => {
  try {
    const data = localStorage.getItem(`sloth_finance_v2_${uid}`);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveLocalData = (uid: string, data: FinancialTransaction[]) => {
  localStorage.setItem(`sloth_finance_v2_${uid}`, JSON.stringify(data));
};

export const financeService = {
  
  // Adicionar Transação
  async addTransaction(uid: string, transaction: Omit<FinancialTransaction, 'id'>): Promise<void> {
    if (db) {
      try {
        await addDoc(collection(db, `users/${uid}/${COLLECTION_KEY}`), transaction);
        return;
      } catch (e) { console.warn("Firestore write failed, using local", e); }
    }
    // Local Fallback
    const current = getLocalData(uid);
    const newTx = { ...transaction, id: crypto.randomUUID() };
    saveLocalData(uid, [...current, newTx]);
  },

  // Atualizar Transação
  async updateTransaction(uid: string, txId: string, updates: Partial<FinancialTransaction>): Promise<void> {
    if (db) {
        try {
            const ref = doc(db, `users/${uid}/${COLLECTION_KEY}`, txId);
            await updateDoc(ref, updates);
            return;
        } catch (e) { console.warn("Firestore update failed", e); }
    }
    const current = getLocalData(uid);
    saveLocalData(uid, current.map(t => t.id === txId ? { ...t, ...updates } : t));
  },

  // Deletar Transação
  async deleteTransaction(uid: string, txId: string): Promise<void> {
    if (db) {
      try {
        await deleteDoc(doc(db, `users/${uid}/${COLLECTION_KEY}`, txId));
        return;
      } catch(e) { console.warn("Firestore delete failed", e); }
    }
    const current = getLocalData(uid);
    saveLocalData(uid, current.filter(t => t.id !== txId));
  },

  // Buscar Transações por Mês
  async getTransactionsByMonth(uid: string, year: number, month: number): Promise<FinancialTransaction[]> {
    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 0, 23, 59, 59).getTime();

    if (db) {
      try {
        const q = query(
          collection(db, `users/${uid}/${COLLECTION_KEY}`),
          where('date', '>=', start),
          where('date', '<=', end)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FinancialTransaction));
      } catch (e) { console.warn("Firestore read failed, using local", e); }
    }

    // Local Fallback
    const current = getLocalData(uid);
    return current.filter(t => t.date >= start && t.date <= end).sort((a,b) => b.date - a.date);
  },

  // Agregar Mês (Tenta Cloud Function, fallback local)
  async aggregateMonth(uid: string, year: number, month: number): Promise<MonthlyAggregation> {
    if (functions) {
      try {
        const fn = httpsCallable(functions, 'aggregateMonth');
        const result = await fn({ uid, year, month });
        return result.data as MonthlyAggregation;
      } catch (e) { console.warn("Function call failed, calculating locally"); }
    }

    // Local Calculation
    const txs = await this.getTransactionsByMonth(uid, year, month);
    const agg: MonthlyAggregation = {
      income: 0,
      expense: 0,
      balance: 0,
      byCategory: {},
      transactionsCount: txs.length
    };

    txs.forEach(t => {
      const val = t.amount;
      if (t.type === 'entrada') {
        agg.income += val;
      } else {
        agg.expense += val;
      }
      if (t.category) {
        agg.byCategory[t.category] = (agg.byCategory[t.category] || 0) + val;
      }
    });
    agg.balance = agg.income - agg.expense;
    return agg;
  },

  // Agregar Ano
  async aggregateYear(uid: string, year: number): Promise<YearlyAggregation> {
    // Local implementation for demo speed
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year, 11, 31).getTime();
    
    let allTxs: FinancialTransaction[] = [];
    if(db) {
         try {
            const q = query(
                collection(db, `users/${uid}/${COLLECTION_KEY}`),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const snap = await getDocs(q);
            allTxs = snap.docs.map(d => ({id:d.id, ...d.data()} as FinancialTransaction));
         } catch (e) { allTxs = getLocalData(uid).filter(t => t.date >= start && t.date <= end); }
    } else {
        allTxs = getLocalData(uid).filter(t => t.date >= start && t.date <= end);
    }

    const monthsData = Array(12).fill(0).map((_, i) => ({ month: i + 1, income: 0, expense: 0, balance: 0 }));
    
    allTxs.forEach(t => {
        const d = new Date(t.date);
        const idx = d.getMonth();
        if(t.type === 'entrada') monthsData[idx].income += t.amount;
        else monthsData[idx].expense += t.amount;
        monthsData[idx].balance = monthsData[idx].income - monthsData[idx].expense;
    });

    const totalIncome = monthsData.reduce((acc, m) => acc + m.income, 0);
    const totalExpense = monthsData.reduce((acc, m) => acc + m.expense, 0);
    const sorted = [...monthsData].sort((a,b) => b.balance - a.balance);

    return {
        months: monthsData,
        totalIncome,
        totalExpense,
        bestMonth: sorted[0].month,
        worstMonth: sorted[11].month
    };
  },

  // Helper: Seed Data for testing
  seedData(uid: string) {
    if (getLocalData(uid).length > 0) return;
    
    const categories = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Trabalho', 'Educação'];
    const now = new Date();
    const dummy: FinancialTransaction[] = [];

    for (let i = 0; i < 50; i++) {
        const isExpense = Math.random() > 0.3;
        const date = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
        dummy.push({
            id: crypto.randomUUID(),
            type: isExpense ? 'saida' : 'entrada',
            amount: Math.floor(Math.random() * (isExpense ? 5000 : 20000)) + 1000, // 10.00 to 200.00 or 50.00
            currency: 'BRL',
            description: isExpense ? `Gasto ${i}` : `Recebimento ${i}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            date: date.getTime(),
            createdAt: Date.now()
        });
    }
    saveLocalData(uid, dummy);
    window.location.reload();
  }
};
