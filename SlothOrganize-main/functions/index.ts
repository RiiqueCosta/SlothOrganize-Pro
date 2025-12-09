
/**
 * CLOUD FUNCTIONS - AGGREGATION LOGIC
 * Copie este código para sua pasta functions/src/index.ts ao fazer deploy no Firebase.
 */

/*
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Helper para converter timestamp
const toDate = (ts: any) => ts.toDate ? ts.toDate() : new Date(ts);

export const aggregateMonth = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
  
  const { uid, year, month } = data; // month 1-12
  
  // Definir intervalo de tempo (timezone simplificado para UTC, ajuste conforme necessário para America/Sao_Paulo)
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const snapshot = await db.collection(`users/${uid}/finances`)
    .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
    .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
    .get();

  let income = 0;
  let expense = 0;
  const byCategory: Record<string, number> = {};

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const val = d.amount || 0; // centavos
    if (d.type === 'entrada') {
      income += val;
    } else {
      expense += val;
    }
    
    if (d.category) {
      byCategory[d.category] = (byCategory[d.category] || 0) + val;
    }
  });

  return {
    income,
    expense,
    balance: income - expense,
    byCategory,
    transactionsCount: snapshot.size
  };
});

export const aggregateYear = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
  
  const { uid, year } = data;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);

  const snapshot = await db.collection(`users/${uid}/finances`)
    .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
    .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
    .get();

  const monthsData = Array(12).fill(0).map((_, i) => ({
    month: i + 1, income: 0, expense: 0, balance: 0
  }));

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const date = toDate(d.date);
    const mIndex = date.getMonth();
    const val = d.amount || 0;

    if (d.type === 'entrada') {
      monthsData[mIndex].income += val;
    } else {
      monthsData[mIndex].expense += val;
    }
    monthsData[mIndex].balance = monthsData[mIndex].income - monthsData[mIndex].expense;
  });

  const totalIncome = monthsData.reduce((acc, m) => acc + m.income, 0);
  const totalExpense = monthsData.reduce((acc, m) => acc + m.expense, 0);

  // Simple sorting for best/worst (based on balance)
  const sortedByBalance = [...monthsData].sort((a, b) => b.balance - a.balance);

  return {
    months: monthsData,
    totalIncome,
    totalExpense,
    bestMonth: sortedByBalance[0].month,
    worstMonth: sortedByBalance[11].month
  };
});
*/
