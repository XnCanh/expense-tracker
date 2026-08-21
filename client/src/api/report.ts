import axiosClient from "./axiosClient";
import { Transaction } from "../types/transaction";

export interface WalletStatementParams {
  walletId: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface WalletStatementResult {
  wallet: { id: string; name: string };
  from: string | null;
  to: string | null;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactions: {
    items: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getWalletStatementApi(params: WalletStatementParams): Promise<WalletStatementResult> {
  const { data } = await axiosClient.get<WalletStatementResult>("/reports/statement", { params });
  return data;
}

// Tải file xuất (Excel/PDF). Dùng fetch + Authorization header
export async function downloadStatementFile(
  format: "excel" | "pdf",
  params: WalletStatementParams
): Promise<void> {
  const token = localStorage.getItem("access_token");
  const query = new URLSearchParams();
  query.set("walletId", params.walletId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);

  const baseUrl = import.meta.env.VITE_API_URL;
  const res = await fetch(`${baseUrl}/reports/statement/export/${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error("Xuất file thất bại");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = format === "excel" ? "sao-ke.xlsx" : "sao-ke.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
