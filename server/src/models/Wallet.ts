import { Schema, model, Document, Types } from "mongoose";

export interface IWallet extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  bankName?: string;
  accountNumber?: string;
  initialBalance: number;
  currentBalance: number;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
  },
  {
    timestamps: true,
  }
);

// Index phục vụ lấy danh sách ví theo user
walletSchema.index({ userId: 1, createdAt: -1 });

export const Wallet = model<IWallet>("Wallet", walletSchema);