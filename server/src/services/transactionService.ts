import mongoose, { Types } from "mongoose";
import { Transaction, ITransaction, TransactionType } from "../models/Transaction";
import { Wallet } from "../models/Wallet";
import { AppError } from "../middlewares/errorHandler";
import { getValidCategoryOrThrow } from "./categoryService";
import { buildDateFilter } from "../utils/dateRange";

// Interface cho input tạo giao dịch
export interface CreateTransactionInput {
  walletId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: Date;
  note?: string;
}

// Interface cho input cập nhật giao dịch
export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  categoryId?: string;
  date?: Date;
  note?: string;
}

/**
 * TẠO GIAO DỊCH MỚI - Độ phức tạp O(1) Ghi
 * 1. Cập nhật số dư Wallet.currentBalance bằng toán tử $inc nguyên tử
 * 2. Ghi 1 document Transaction mới
 */
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

  // Validate danh mục khớp loại giao dịch (income/expense)
  await getValidCategoryOrThrow(userId, input.categoryId, input.type);

  const session = await mongoose.startSession();
  try {
    let created!: ITransaction;

    await session.withTransaction(async () => {
      const delta = input.type === "income" ? input.amount : -input.amount;

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

/**
 * CẬP NHẬT GIAO DỊCH - Độ phức tạp O(1) Ghi Thuần Túy
 * Không cascade update hay quét timeline.
 * 1. Tính toán chênh lệch số dư ròng: Delta = NewEffect - OldEffect
 * 2. Cập nhật số dư Wallet.currentBalance bằng toán tử $inc nguyên tử (O(1))
 * 3. Cập nhật đúng 1 document Transaction được chỉ định (O(1))
 */
export async function updateTransaction(
  userId: Types.ObjectId,
  transactionId: string,
  input: UpdateTransactionInput
): Promise<ITransaction> {
  if (!Types.ObjectId.isValid(transactionId)) {
    throw new AppError("ID giao dịch không hợp lệ", 400);
  }

  const session = await mongoose.startSession();
  try {
    let updatedTx!: ITransaction;

    await session.withTransaction(async () => {
      const tx = await Transaction.findOne({ _id: transactionId, userId }).session(session);
      if (!tx) {
        throw new AppError("Không tìm thấy giao dịch", 404);
      }

      const newType = input.type ?? tx.type;
      const newAmount = input.amount !== undefined ? input.amount : tx.amount;
      const newCategoryId = input.categoryId ?? tx.categoryId.toString();
      const newDate = input.date ?? tx.date;
      const newNote = input.note !== undefined ? input.note : tx.note;

      if (newAmount <= 0) {
        throw new AppError("Số tiền phải lớn hơn 0", 400);
      }

      // Kiểm tra danh mục hợp lệ với loại mới
      await getValidCategoryOrThrow(userId, newCategoryId, newType);

      // Tính toán chênh lệch số dư ròng: Delta = NewEffect - OldEffect
      const oldEffect = tx.type === "income" ? tx.amount : -tx.amount;
      const newEffect = newType === "income" ? newAmount : -newAmount;
      const netDelta = newEffect - oldEffect;

      // Cập nhật số dư ví nguyên tử O(1)
      const walletFilter: Record<string, unknown> = { _id: tx.walletId, userId };
      if (netDelta < 0) {
        walletFilter.currentBalance = { $gte: Math.abs(netDelta) };
      }

      const wallet = await Wallet.findOneAndUpdate(
        walletFilter,
        { $inc: { currentBalance: netDelta } },
        { new: true, session }
      );

      if (!wallet) {
        throw new AppError("Số dư trong ví không đủ để cập nhật giao dịch này (nguy cơ chi âm)", 400);
      }

      // Cập nhật đúng 1 document giao dịch duy nhất O(1)
      tx.type = newType;
      tx.amount = newAmount;
      tx.categoryId = new Types.ObjectId(newCategoryId);
      tx.date = newDate;
      tx.note = newNote;
      await tx.save({ session });

      const populated = await Transaction.findById(tx._id)
        .populate("categoryId", "name type")
        .populate("walletId", "name bankName")
        .session(session);

      updatedTx = populated || tx;
    });

    return updatedTx;
  } finally {
    await session.endSession();
  }
}

/**
 * XÓA GIAO DỊCH - Độ phức tạp O(1) Ghi
 * 1. Hoàn tác số dư trên ví tương ứng O(1)
 * 2. Xóa 1 document Transaction O(1)
 */
export async function deleteTransaction(
  userId: Types.ObjectId,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  if (!Types.ObjectId.isValid(transactionId)) {
    throw new AppError("ID giao dịch không hợp lệ", 400);
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const tx = await Transaction.findOne({ _id: transactionId, userId }).session(session);
      if (!tx) {
        throw new AppError("Không tìm thấy giao dịch", 404);
      }

      const delta = tx.type === "income" ? -tx.amount : tx.amount;
      const filter: Record<string, unknown> = { _id: tx.walletId, userId };
      if (tx.type === "income") {
        filter.currentBalance = { $gte: tx.amount };
      }

      const wallet = await Wallet.findOneAndUpdate(
        filter,
        { $inc: { currentBalance: delta } },
        { new: true, session }
      );

      if (!wallet) {
        throw new AppError("Không thể xóa khoản thu này vì số dư ví hiện tại không đủ để hoàn tác (sẽ bị âm tiền)", 400);
      }

      await Transaction.deleteOne({ _id: transactionId, userId }).session(session);
    });

    return { success: true, message: "Đã xóa giao dịch và hoàn tác số dư thành công" };
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
  const dateFilter = buildDateFilter(query.from, query.to);
  if (dateFilter) {
    filter.date = dateFilter;
  }

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 && query.limit <= 100 ? query.limit : 20;

  const [items, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name type")
      .populate("walletId", "name bankName"),
    Transaction.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
