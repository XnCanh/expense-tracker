import { Category, CategoryType } from "../models/Category";

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

/**
 * Tự động tạo các danh mục mặc định dùng chung khi server khởi động
 */
export async function ensureDefaultCategories(): Promise<void> {
  for (const c of DEFAULT_CATEGORIES) {
    await Category.updateOne(
      { userId: { $exists: false }, name: c.name, type: c.type },
      { $setOnInsert: { ...c, isDefault: true } },
      { upsert: true }
    );
  }
  console.log("[db] Da khoi tao danh muc mac dinh thanh cong!");
}
