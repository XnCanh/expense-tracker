import axiosClient from "./axiosClient";
import { Wallet, CreateWalletPayload } from "../types/wallet";

export async function createWalletApi(payload: CreateWalletPayload): Promise<Wallet> {
  const { data } = await axiosClient.post<{ wallet: Wallet }>("/wallets", payload);
  return data.wallet;
}

export async function listWalletsApi(): Promise<{ wallets: Wallet[]; totalBalance: number }> {
  const { data } = await axiosClient.get<{ wallets: Wallet[]; totalBalance: number }>("/wallets");
  return data;
}

export async function deleteWalletApi(id: string): Promise<void> {
  await axiosClient.delete(`/wallets/${id}`);
}
