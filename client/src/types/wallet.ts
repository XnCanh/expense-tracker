export interface Wallet {
  _id: string;
  userId: string;
  name: string;
  bankName?: string;
  accountNumber?: string;
  initialBalance: number;
  currentBalance: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletPayload {
  name: string;
  bankName?: string;
  accountNumber?: string;
  initialBalance: number;
  startDate: string;
}
