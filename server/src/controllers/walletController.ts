import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import {
  createWallet,
  listWallets,
  getWalletOrThrow,
  updateWallet,
  deleteWallet,
  getTotalBalance,
} from "../services/walletService";
import { AppError } from "../middlewares/errorHandler";

function getUserId(req: Request): Types.ObjectId {
  if (!req.auth) throw new AppError("Chưa xác thực", 401);
  return new Types.ObjectId(req.auth.userId);
}

const createWalletSchema = z.object({
  name: z.string().min(1, "Tên ví không được để trống"),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  initialBalance: z.number().min(0, "Số dư ban đầu không được âm"),
  startDate: z.coerce.date(),
});

// createWalletHandler - Tạo ví
export async function createWalletHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const input = createWalletSchema.parse(req.body);
    const wallet = await createWallet(userId, input);
    res.status(201).json({ wallet });
  } catch (err) {
    next(err);
  }
}

// listWalletsHandler - Lấy danh sách ví
export async function listWalletsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const [wallets, totalBalance] = await Promise.all([
      listWallets(userId),
      getTotalBalance(userId),
    ]);
    res.json({ wallets, totalBalance });
  } catch (err) {
    next(err);
  }
}

// getWalletHandler - Lấy thông tin ví
export async function getWalletHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const wallet = await getWalletOrThrow(userId, req.params.id);
    res.json({ wallet });
  } catch (err) {
    next(err);
  }
}

// updateWalletSchema - Cập nhật ví
const updateWalletSchema = z.object({
  name: z.string().min(1).optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
});

// updateWalletHandler - Cập nhật ví
export async function updateWalletHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const input = updateWalletSchema.parse(req.body);
    const wallet = await updateWallet(userId, req.params.id, input);
    res.json({ wallet });
  } catch (err) {
    next(err);
  }
}

// deleteWalletHandler - Xóa ví
export async function deleteWalletHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    await deleteWallet(userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
