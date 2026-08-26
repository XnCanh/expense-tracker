import { Schema, model, Document, Types } from "mongoose";

export type TransactionType = "income" | "expense";

export interface ITransaction extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  walletId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  categoryId: Types.ObjectId;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Số tiền không được âm"],
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Index tối ưu cho truy vấn Sao kê & Xuất báo cáo (giảm dần)
transactionSchema.index({ userId: 1, walletId: 1, date: -1, createdAt: -1, _id: -1 });

// Compound Index tối ưu cho quét dòng thời gian (tăng dần)
transactionSchema.index({ userId: 1, walletId: 1, date: 1, createdAt: 1, _id: 1 });

// Compound Index tối ưu cho xem lịch sử toàn bộ giao dịch người dùng
transactionSchema.index({ userId: 1, date: -1, _id: -1 });

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
