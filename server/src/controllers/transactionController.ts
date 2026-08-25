import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { createTransaction, listTransactions, updateTransaction, deleteTransaction } from "../services/transactionService";
import { AppError } from "../middlewares/errorHandler";

function getUserId(req: Request): Types.ObjectId {
  if (!req.auth) throw new AppError("Chưa xác thực", 401);
  return new Types.ObjectId(req.auth.userId);
}

// createTransactionSchema - Tạo giao dịch
const createTransactionSchema = z.object({
  walletId: z.string().min(1, "Vui lòng chọn ví"),
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  date: z.coerce.date(),
  note: z.string().optional(),
});

// updateTransactionSchema - Cập nhật giao dịch (Không cho phép đổi ví)
const updateTransactionSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  amount: z.number().positive("Số tiền phải lớn hơn 0").optional(),
  categoryId: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
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

// updateTransactionHandler - Cập nhật giao dịch
export async function updateTransactionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const input = updateTransactionSchema.parse(req.body);
    const transaction = await updateTransaction(userId, id, input);
    res.json({ transaction, message: "Đã cập nhật giao dịch thành công" });
  } catch (err) {
    next(err);
  }
}

// deleteTransactionHandler - Xóa giao dịch
export async function deleteTransactionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await deleteTransaction(userId, id);
    res.json(result);
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
