import axiosClient from "./axiosClient";
import { Transaction, CreateTransactionPayload, ListTransactionsResult } from "../types/transaction";

export async function createTransactionApi(payload: CreateTransactionPayload): Promise<Transaction> {
  const { data } = await axiosClient.post<{ transaction: Transaction }>("/transactions", payload);
  return data.transaction;
}

export interface ListTransactionsParams {
  walletId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function listTransactionsApi(params: ListTransactionsParams = {}): Promise<ListTransactionsResult> {
  const { data } = await axiosClient.get<ListTransactionsResult>("/transactions", { params });
  return data;
}
