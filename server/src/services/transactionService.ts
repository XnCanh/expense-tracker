import mongoose, { Types } from "mongoose";
import { Transaction, ITransaction, TransactionType } from "../models/Transaction";
import { Wallet } from "../models/Wallet";
import { AppError } from "../middlewares/errorHandler";
import { getValidCategoryOrThrow } from "./categoryService";

// Interface cho input tạo giao dịch
export interface CreateTransactionInput {
  walletId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: Date;
  note?: string;
}

// Tạo giao dịch mới (bao gồm cập nhật số dư ví và lưu giao dịch)
export async function createTransaction(
  userId: Types.ObjectId,
  input: CreateTransactionInput
): Promise<ITransaction> {
  if (!Types.ObjectId.isValid(input.walletId)) {
    throw new AppError("ID ví không hợp lệ", 400);
  }
  if (input.amount <= 0) {
    throw new AppError("Số tiền phải lớn hơn 0", 400);
  }

  // Validate danh mục khớp loại giao dịch (income/expense) trước khi mở transaction
  await getValidCategoryOrThrow(userId, input.categoryId, input.type);

  const session = await mongoose.startSession();
  try {
    let created!: ITransaction;

    await session.withTransaction(async () => {
      const delta = input.type === "income" ? input.amount : -input.amount;

      // Điều kiện $gte đảm bảo không bao giờ chi vượt số dư, kể cả khi có
      // nhiều request chạy đồng thời (kiểm tra và cập nhật xảy ra atomic ở tầng DB).
      const filter: Record<string, unknown> = { _id: input.walletId, userId };
      if (input.type === "expense") {
        filter.currentBalance = { $gte: input.amount };
      }

      const wallet = await Wallet.findOneAndUpdate(
        filter,
        { $inc: { currentBalance: delta } },
        { new: true, session }
      );

      if (!wallet) {
        // Không tìm thấy ví HOẶC không đủ số dư (2 nguyên nhân gộp vào 1 filter ở trên)
        const exists = await Wallet.exists({ _id: input.walletId, userId }).session(session);
        if (!exists) throw new AppError("Không tìm thấy ví", 404);
        throw new AppError("Số dư trong ví không đủ để thực hiện giao dịch chi này", 400);
      }

      const [tx] = await Transaction.create(
        [
          {
            userId,
            walletId: wallet._id,
            type: input.type,
            amount: input.amount,
            categoryId: input.categoryId,
            date: input.date,
            note: input.note,
            balanceAfter: wallet.currentBalance,
          },
        ],
        { session }
      );

      created = tx;
    });

    return created;
  } finally {
    await session.endSession();
  }
}

// Interface cho input tìm kiếm và lọc giao dịch
export interface ListTransactionsQuery {
  walletId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

// Lấy danh sách giao dịch (có phân trang)
export async function listTransactions(userId: Types.ObjectId, query: ListTransactionsQuery) {
  const filter: Record<string, unknown> = { userId };
  if (query.walletId) {
    if (!Types.ObjectId.isValid(query.walletId)) throw new AppError("ID ví không hợp lệ", 400);
    filter.walletId = query.walletId;
  }
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) (filter.date as Record<string, Date>).$gte = query.from;
    if (query.to) (filter.date as Record<string, Date>).$lte = query.to;
  }

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, _id: -1 }) // mới nhất -> cũ nhất
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name type"),
    Transaction.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}