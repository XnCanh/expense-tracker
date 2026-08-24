import { CategoryType } from "./category";

export interface Transaction {
  _id: string;
  walletId: { _id: string; name: string; bankName?: string } | string;
  type: CategoryType;
  amount: number;
  categoryId: { _id: string; name: string; type: CategoryType } | string;
  date: string;
  note?: string;
  balanceAfter?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTransactionPayload {
  walletId: string;
  type: CategoryType;
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
}

export interface UpdateTransactionPayload {
  walletId?: string;
  type?: CategoryType;
  amount?: number;
  categoryId?: string;
  date?: string;
  note?: string;
}

export interface ListTransactionsResult {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
