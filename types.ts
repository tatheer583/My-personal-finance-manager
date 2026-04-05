export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  categoryOrSender: string;
  date: string; // ISO 8601 string
  note?: string;
}

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}