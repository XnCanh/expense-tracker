import { Types } from "mongoose";
import { Category, CategoryType, ICategory } from "../models/Category";
import { AppError } from "../middlewares/errorHandler";

const DEFAULT_CATEGORIES: { name: string; type: CategoryType }[] = [
  { name: "Lương", type: "income" },
  { name: "Thưởng", type: "income" },
  { name: "Thu nhập khác", type: "income" },
  { name: "Ăn uống", type: "expense" },
  { name: "Đi lại", type: "expense" },
  { name: "Mua sắm", type: "expense" },
  { name: "Hóa đơn & Tiện ích", type: "expense" },
  { name: "Giải trí", type: "expense" },
  { name: "Sức khỏe", type: "expense" },
  { name: "Chi tiêu khác", type: "expense" },
];

// Tự động tạo các danh mục mặc định dùng chung khi server khởi động
export async function ensureDefaultCategories(): Promise<void> {
  for (const c of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { userId: { $exists: false }, name: c.name, type: c.type },
      { $setOnInsert: { ...c, isDefault: true } },
      { upsert: true }
    );
  }
}

// Lấy danh sách các danh mục (bao gồm danh mục chung và danh mục riêng của user)
export async function listCategories(userId: Types.ObjectId, type?: CategoryType): Promise<ICategory[]> {
  const filter: Record<string, unknown> = {
    $or: [{ userId }, { userId: { $exists: false } }],
  };
  if (type) filter.type = type;
  return Category.find(filter).sort({ isDefault: -1, name: 1 });
}

// Interface cho input tạo danh mục
export interface CreateCategoryInput {
  name: string;
  type: CategoryType;
}

// Tạo danh mục mới cho user
export async function createCategory(userId: Types.ObjectId, input: CreateCategoryInput): Promise<ICategory> {
  return Category.create({ userId, name: input.name, type: input.type, isDefault: false });
}

// Kiểm tra và trả về danh mục nếu hợp lệ
export async function getValidCategoryOrThrow(
  userId: Types.ObjectId,
  categoryId: string,
  expectedType: CategoryType
): Promise<ICategory> {
  if (!Types.ObjectId.isValid(categoryId)) {
    throw new AppError("ID danh mục không hợp lệ", 400);
  }
  const category = await Category.findOne({
    _id: categoryId,
    $or: [{ userId }, { userId: { $exists: false } }],
  });
  if (!category) throw new AppError("Không tìm thấy danh mục", 404);
  if (category.type !== expectedType) {
    throw new AppError(`Danh mục "${category.name}" không thuộc loại ${expectedType}`, 400);
  }
  return category;
}