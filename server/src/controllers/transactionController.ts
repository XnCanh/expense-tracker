import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { createTransaction, listTransactions } from "../services/transactionService";
import { AppError } from "../middlewares/errorHandler";

function getUserId(req: Request): Types.ObjectId {
  if (!req.auth) throw new AppError("Chưa xác thực", 401);
  return new Types.ObjectId(req.auth.userId);
}

// createTransactionSchema - Tạo giao dịch
const createTransactionSchema = z.object({
  walletId: z.string().min(1),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  categoryId: z.string().min(1),
  date: z.coerce.date(),
  note: z.string().optional(),
});

// createTransactionHandler - Tạo giao dịch
export async function createTransactionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const input = createTransactionSchema.parse(req.body);
    const transaction = await createTransaction(userId, input);
    res.status(201).json({ transaction });
  } catch (err) {
    next(err);
  }
}

// listTransactionsHandler - Lấy danh sách giao dịch
const listQuerySchema = z.object({
  walletId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

// listTransactionsHandler - Lấy danh sách giao dịch
export async function listTransactionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const query = listQuerySchema.parse(req.query);
    const result = await listTransactions(userId, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
