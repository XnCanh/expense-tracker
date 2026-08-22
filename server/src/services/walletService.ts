import { Types } from "mongoose";
import { Wallet, IWallet } from "../models/Wallet";
import { Transaction } from "../models/Transaction";
import { AppError } from "../middlewares/errorHandler";

// Kiểm tra xem user có ví hay chưa
export async function userHasWallet(userId: Types.ObjectId): Promise<boolean> {
  const count = await Wallet.countDocuments({ userId });
  return count > 0;
}

// Interface cho input tạo ví
export interface CreateWalletInput {
  name: string;
  bankName?: string;
  accountNumber?: string;
  initialBalance: number;
  startDate: Date;
}

// Tạo ví mới cho user
export async function createWallet(userId: Types.ObjectId, input: CreateWalletInput): Promise<IWallet> {
  return Wallet.create({
    userId,
    name: input.name,
    bankName: input.bankName,
    accountNumber: input.accountNumber,
    initialBalance: input.initialBalance,
    currentBalance: input.initialBalance, // ban đầu số dư hiện tại = số dư đầu
    startDate: input.startDate,
  });
}

// Lấy danh sách ví của user, sắp xếp theo thời gian tạo mới nhất
export async function listWallets(userId: Types.ObjectId): Promise<IWallet[]> {
  return Wallet.find({ userId }).sort({ createdAt: -1 });
}

// Lấy thông tin một ví cụ thể, có kiểm tra quyền sở hữu
export async function getWalletOrThrow(userId: Types.ObjectId, walletId: string): Promise<IWallet> {
  if (!Types.ObjectId.isValid(walletId)) {
    throw new AppError("ID ví không hợp lệ", 400);
  }
  // Điều kiện userId đảm bảo không xem được ví của người khác
  const wallet = await Wallet.findOne({ _id: walletId, userId });
  if (!wallet) throw new AppError("Không tìm thấy ví", 404);
  return wallet;
}

// Interface cho input cập nhật ví
export interface UpdateWalletInput {
  name?: string;
  bankName?: string;
  accountNumber?: string;
}

// Cập nhật thông tin ví (tên, ngân hàng, số tài khoản)
// Lưu ý: không cho sửa initialBalance/currentBalance/startDate qua API update thông thường
export async function updateWallet(
  userId: Types.ObjectId,
  walletId: string,
  input: UpdateWalletInput
): Promise<IWallet> {
  const wallet = await getWalletOrThrow(userId, walletId);
  if (input.name !== undefined) wallet.name = input.name;
  if (input.bankName !== undefined) wallet.bankName = input.bankName;
  if (input.accountNumber !== undefined) wallet.accountNumber = input.accountNumber;
  await wallet.save();
  return wallet;
}

// Xóa ví (chỉ cho phép ví không có giao dịch)
export async function deleteWallet(userId: Types.ObjectId, walletId: string): Promise<void> {
  const wallet = await getWalletOrThrow(userId, walletId);
  const session = await Wallet.startSession();
  try {
    session.startTransaction();
    // Xóa tất cả các giao dịch liên quan đến ví này
    await Transaction.deleteMany({ walletId: wallet._id, userId }, { session });
    // Xóa ví
    await wallet.deleteOne({ session });
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

// Lấy tổng số dư của tất cả các ví thuộc user
export async function getTotalBalance(userId: Types.ObjectId): Promise<number> {
  const result = await Wallet.aggregate<{ _id: null; total: number }>([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: "$currentBalance" } } },
  ]);
  return result[0]?.total ?? 0;
}
