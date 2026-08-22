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

// Tải file xuất (Excel/PDF) dạng Stream (O(1) RAM)
export async function downloadStatementFile(
  format: "excel" | "pdf",
  params: WalletStatementParams
): Promise<void> {
  const token = localStorage.getItem("access_token");
  const query = new URLSearchParams();
  query.set("walletId", params.walletId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const url = `${baseUrl}/reports/statement/export/${format}?${query.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Xuất file thất bại");
  }

  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = format === "excel" ? `sao-ke-${Date.now()}.xlsx` : `sao-ke-${Date.now()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}
