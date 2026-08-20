import { Schema, model, Document, Types } from "mongoose";

export type CategoryType = "income" | "expense";

export interface ICategory extends Document {
  _id: Types.ObjectId;
  userId?: Types.ObjectId; // undefined => danh mục mặc định của hệ thống dùng chung
  name: string;
  type: CategoryType;
  isDefault: boolean;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index phục vụ tìm danh mục theo user và loại Thu/Chi
categorySchema.index({ userId: 1, type: 1 });

export const Category = model<ICategory>("Category", categorySchema);