import axiosClient from "./axiosClient";
import {
  Transaction,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  ListTransactionsResult,
} from "../types/transaction";

export async function createTransactionApi(payload: CreateTransactionPayload): Promise<Transaction> {
  const { data } = await axiosClient.post<{ transaction: Transaction }>("/transactions", payload);
  return data.transaction;
}

export async function updateTransactionApi(
  id: string,
  payload: UpdateTransactionPayload
): Promise<Transaction> {
  const { data } = await axiosClient.put<{ transaction: Transaction; message: string }>(
    `/transactions/${id}`,
    payload
  );
  return data.transaction;
}

export async function deleteTransactionApi(id: string): Promise<{ success: boolean; message: string }> {
  const { data } = await axiosClient.delete<{ success: boolean; message: string }>(`/transactions/${id}`);
  return data;
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
