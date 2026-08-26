/**
 * Chuẩn hóa khoảng thời gian tìm kiếm / lọc dữ liệu (startOfDay & endOfDay)
 * Dùng chung đồng bộ cho toàn bộ controller và service
 */
export function buildDateFilter(from?: Date | string, to?: Date | string): Record<string, Date> | undefined {
  if (!from && !to) return undefined;
  const dateFilter: Record<string, Date> = {};
  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    dateFilter.$gte = start;
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    dateFilter.$lte = end;
  }
  return dateFilter;
}

/**
 * Định dạng ngày theo chuẩn Việt Nam DD/MM/YYYY
 */
export function formatDateVn(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng tiền tệ VNĐ
 */
export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}
