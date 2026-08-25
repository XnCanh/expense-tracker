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

// Interface cho input cập nhật giao dịch (Không cho phép đổi ví)
export interface UpdateTransactionInput {
  type?: TransactionType;
  amount?: number;
  categoryId?: string;
  date?: Date;
  note?: string;
}

/*
 Thuật toán Đồng bộ Dòng thời gian Ví (Timeline Recalculation)
 Quét toàn bộ giao dịch của ví theo trình tự thời gian tăng dần { date: 1, createdAt: 1, _id: 1 }
 Bắt đầu từ initialBalance:
 1. Tính toán lại chính xác balanceAfter cho từng giao dịch.
 2. Đảm bảo số dư không bao giờ bị âm tại bất kỳ mốc thời gian nào (Timeline Non-Negative Invariant).
 3. Cập nhật số dư cuối cùng cho Wallet.currentBalance.
 */
export async function recalculateWalletTimeline(
  userId: Types.ObjectId,
  walletId: Types.ObjectId,
  session: mongoose.ClientSession
): Promise<number> {
  const wallet = await Wallet.findOne({ _id: walletId, userId }).session(session);
  if (!wallet) {
    throw new AppError("Không tìm thấy ví", 404);
  }

  // Lấy toàn bộ giao dịch của ví này, sắp xếp tăng dần theo dòng thời gian thực tế
  const transactions = await Transaction.find({ walletId, userId })
    .sort({ date: 1, createdAt: 1, _id: 1 })
    .session(session);

  let running = wallet.initialBalance;
  const bulkOps = [];

  for (const tx of transactions) {
    running += tx.type === "income" ? tx.amount : -tx.amount;

    // Kiểm tra chống chi âm tại từng mốc thời gian trong quá khứ và hiện tại
    if (running < 0) {
      const dateStr = new Date(tx.date).toLocaleDateString("vi-VN");
      throw new AppError(
        `Không thể thực hiện vì vào ngày ${dateStr}, số dư ví sẽ bị âm (${running.toLocaleString("vi-VN")} ₫)`,
        400
      );
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: tx._id },
        update: { $set: { balanceAfter: running } },
      },
    });
  }

  if (bulkOps.length > 0) {
    await Transaction.bulkWrite(bulkOps, { session });
  }

  // Cập nhật số dư hiện tại cuối cùng của Ví
  wallet.currentBalance = running;
  await wallet.save({ session });

  return running;
}

// Tạo giao dịch mới (Tính toán lại timeline và chống chi âm)
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
      const wallet = await Wallet.findOne({ _id: input.walletId, userId }).session(session);
      if (!wallet) {
        throw new AppError("Không tìm thấy ví", 404);
      }

      // Tạo transaction document mới
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
            balanceAfter: 0, // Sẽ được đồng bộ chính xác ngay sau đây
          },
        ],
        { session }
      );

      // Đồng bộ toàn bộ dòng thời gian của ví và kiểm tra tính toàn vẹn số dư
      await recalculateWalletTimeline(userId, wallet._id, session);

      // Lấy lại transaction đã được cập nhật balanceAfter chuẩn
      const updated = await Transaction.findById(tx._id).session(session);
      created = updated || tx;
    });

    return created;
  } finally {
    await session.endSession();
  }
}

// Cập nhật giao dịch đã có (Sửa số tiền, loại Thu/Chi, Ngày tháng, Danh mục, Ghi chú)
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

      // Cập nhật thông tin giao dịch
      tx.type = newType;
      tx.amount = newAmount;
      tx.categoryId = new Types.ObjectId(newCategoryId);
      tx.date = newDate;
      tx.note = newNote;
      await tx.save({ session });

      // Tính toán lại toàn bộ dòng thời gian của ví từ quá khứ đến hiện tại
      await recalculateWalletTimeline(userId, tx.walletId, session);

      // Lấy lại transaction sau khi đã đồng bộ balanceAfter theo vị trí thời gian mới
      const reloaded = await Transaction.findById(tx._id)
        .populate("categoryId", "name type")
        .populate("walletId", "name bankName")
        .session(session);

      updatedTx = reloaded || tx;
    });

    return updatedTx;
  } finally {
    await session.endSession();
  }
}

// Xóa giao dịch (Tự động đồng bộ lại dòng thời gian và số dư ví)
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

      const walletId = tx.walletId;

      // Xóa giao dịch
      await Transaction.deleteOne({ _id: transactionId, userId }).session(session);

      // Đồng bộ lại toàn bộ dòng thời gian của ví sau khi xóa giao dịch này
      await recalculateWalletTimeline(userId, walletId, session);
    });

    return { success: true, message: "Đã xóa giao dịch và đồng bộ lại số dư thành công" };
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
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name type")
      .populate("walletId", "name bankName"),
    Transaction.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
