import { FinancialTransaction, MonthlyAggregation, YearlyAggregation } from '../types';

export const financeService = {
  
  // Adicionar Transação
  async addTransaction(uid: string, transaction: Omit<FinancialTransaction, 'id'>): Promise<void> {
    const newTx = { ...transaction, id: crypto.randomUUID() };
    try {
      await fetch(`/api/finance/${uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTx),
      });
    } catch (e) {
      console.error("Add transaction error", e);
    }
  },

  // Atualizar Transação
  async updateTransaction(uid: string, txId: string, updates: Partial<FinancialTransaction>): Promise<void> {
    try {
      // In this simple API, we just re-POST the whole object. 
      // First get it, then update, then POST.
      const txs = await this.getTransactionsByMonth(uid, new Date().getFullYear(), new Date().getMonth() + 1);
      const tx = txs.find(t => t.id === txId);
      if (tx) {
        await fetch(`/api/finance/${uid}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...tx, ...updates }),
        });
      }
    } catch (e) {
      console.error("Update transaction error", e);
    }
  },

  // Deletar Transação
  async deleteTransaction(uid: string, txId: string): Promise<void> {
    try {
      await fetch(`/api/finance/${uid}/${txId}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.error("Delete transaction error", e);
    }
  },

  // Buscar Transações por Mês
  async getTransactionsByMonth(uid: string, year: number, month: number): Promise<FinancialTransaction[]> {
    try {
      const response = await fetch(`/api/finance/${uid}`);
      const allTxs: FinancialTransaction[] = await response.json();
      
      const start = new Date(year, month - 1, 1).getTime();
      const end = new Date(year, month, 0, 23, 59, 59).getTime();
      
      return allTxs.filter(t => t.date >= start && t.date <= end).sort((a,b) => b.date - a.date);
    } catch (e) {
      console.error("Get transactions error", e);
      return [];
    }
  },

  // Agregar Mês
  async aggregateMonth(uid: string, year: number, month: number): Promise<MonthlyAggregation> {
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
    try {
      const response = await fetch(`/api/finance/${uid}`);
      const allTxs: FinancialTransaction[] = await response.json();
      
      const start = new Date(year, 0, 1).getTime();
      const end = new Date(year, 11, 31).getTime();
      const yearTxs = allTxs.filter(t => t.date >= start && t.date <= end);

      const monthsData = Array(12).fill(0).map((_, i) => ({ month: i + 1, income: 0, expense: 0, balance: 0 }));
      
      yearTxs.forEach(t => {
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
          bestMonth: sorted[0]?.month || 1,
          worstMonth: sorted[11]?.month || 12
      };
    } catch (e) {
      console.error("Aggregate year error", e);
      return { months: [], totalIncome: 0, totalExpense: 0, bestMonth: 1, worstMonth: 12 };
    }
  },

  // Helper: Seed Data for testing
  async seedData(uid: string) {
    const categories = ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Trabalho', 'Educação'];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
        const isExpense = Math.random() > 0.3;
        const date = new Date(now.getFullYear(), now.getMonth() - Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1);
        await this.addTransaction(uid, {
            type: isExpense ? 'saida' : 'entrada',
            amount: Math.floor(Math.random() * (isExpense ? 5000 : 20000)) + 1000,
            currency: 'BRL',
            description: isExpense ? `Gasto ${i}` : `Recebimento ${i}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            date: date.getTime(),
            createdAt: Date.now()
        });
    }
    window.location.reload();
  }
};
