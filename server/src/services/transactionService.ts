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

// Interface cho input cập nhật giao dịch
export interface UpdateTransactionInput {
  walletId?: string;
  type?: TransactionType;
  amount?: number;
  categoryId?: string;
  date?: Date;
  note?: string;
}

// Tạo giao dịch mới (cập nhật số dư nguyên tử trong ACID Transaction)
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

// Cập nhật giao dịch đã có (Sửa số tiền, loại Thu/Chi, Ngày tháng, Danh mục, Ví)
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

      const targetWalletId = input.walletId ? input.walletId : tx.walletId.toString();
      if (!Types.ObjectId.isValid(targetWalletId)) {
        throw new AppError("ID ví không hợp lệ", 400);
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

      const isSameWallet = targetWalletId === tx.walletId.toString();

      if (isSameWallet) {
        // Cùng 1 ví: Tính độ chênh lệch số dư ròng
        // Hiệu ứng cũ đối với ví: Income = +oldAmount, Expense = -oldAmount
        const oldEffect = tx.type === "income" ? tx.amount : -tx.amount;
        // Hiệu ứng mới: Income = +newAmount, Expense = -newAmount
        const newEffect = newType === "income" ? newAmount : -newAmount;
        const netDelta = newEffect - oldEffect;

        const filter: Record<string, unknown> = { _id: tx.walletId, userId };
        if (netDelta < 0) {
          // Trừ thêm tiền -> Phải đảm bảo số dư đủ bù
          filter.currentBalance = { $gte: Math.abs(netDelta) };
        }

        const wallet = await Wallet.findOneAndUpdate(
          filter,
          { $inc: { currentBalance: netDelta } },
          { new: true, session }
        );

        if (!wallet) {
          throw new AppError("Số dư trong ví không đủ để cập nhật giao dịch này (nguy cơ chi âm)", 400);
        }

        tx.type = newType;
        tx.amount = newAmount;
        tx.categoryId = new Types.ObjectId(newCategoryId);
        tx.date = newDate;
        tx.note = newNote;
        tx.balanceAfter = wallet.currentBalance;
        await tx.save({ session });

        updatedTx = tx;
      } else {
        // Đổi sang ví khác:
        // 1. Hoàn tác ảnh hưởng trên ví cũ
        const oldRefund = tx.type === "income" ? -tx.amount : tx.amount;
        const oldWalletFilter: Record<string, unknown> = { _id: tx.walletId, userId };
        if (oldRefund < 0) {
          oldWalletFilter.currentBalance = { $gte: Math.abs(oldRefund) };
        }
        const oldWallet = await Wallet.findOneAndUpdate(
          oldWalletFilter,
          { $inc: { currentBalance: oldRefund } },
          { new: true, session }
        );
        if (!oldWallet) {
          throw new AppError("Không thể chuyển ví vì số dư ví cũ sẽ bị âm sau khi hoàn tác", 400);
        }

        // 2. Áp dụng ảnh hưởng lên ví mới
        const newDelta = newType === "income" ? newAmount : -newAmount;
        const newWalletFilter: Record<string, unknown> = { _id: targetWalletId, userId };
        if (newType === "expense") {
          newWalletFilter.currentBalance = { $gte: newAmount };
        }
        const newWallet = await Wallet.findOneAndUpdate(
          newWalletFilter,
          { $inc: { currentBalance: newDelta } },
          { new: true, session }
        );
        if (!newWallet) {
          throw new AppError("Số dư ở ví mới không đủ để nhận khoản chi này", 400);
        }

        tx.walletId = new Types.ObjectId(targetWalletId);
        tx.type = newType;
        tx.amount = newAmount;
        tx.categoryId = new Types.ObjectId(newCategoryId);
        tx.date = newDate;
        tx.note = newNote;
        tx.balanceAfter = newWallet.currentBalance;
        await tx.save({ session });

        updatedTx = tx;
      }
    });

    return updatedTx;
  } finally {
    await session.endSession();
  }
}

// Xóa giao dịch (Hoàn tác số dư ví tương ứng)
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

      // Hoàn tác số dư ví:
      // Nếu là Thu -> Trừ lại số tiền (Cần kiểm tra currentBalance >= amount để không bị âm)
      // Nếu là Chi -> Cộng lại số tiền
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

    return { success: true, message: "Đã xóa giao dịch thành công" };
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
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name type")
      .populate("walletId", "name bankName"),
    Transaction.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}
