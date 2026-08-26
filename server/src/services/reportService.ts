import { Response } from "express";
import { Types } from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { Transaction, ITransaction } from "../models/Transaction";
import { IWallet } from "../models/Wallet";
import { getWalletOrThrow } from "./walletService";
import { buildDateFilter, formatDateVn, formatVnd } from "../utils/dateRange";

/**
 * TÍNH TỔNG THU / TỔNG CHI ĐƠN LƯỢT BẰNG TOÁN TỬ $cond TRONG MONGODB AGGREGATION
 */
export async function getTransactionSummary(
  filter: Record<string, unknown>
): Promise<{ totalIncome: number; totalExpense: number }> {
  const [result] = await Transaction.aggregate<{
    totalIncome: number;
    totalExpense: number;
  }>([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalIncome: {
          $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
        },
        totalExpense: {
          $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
        },
      },
    },
  ]);

  return {
    totalIncome: result?.totalIncome ?? 0,
    totalExpense: result?.totalExpense ?? 0,
  };
}

/**
 * Tính toán số dư đầu kỳ (Opening Balance) chuẩn xác theo mốc thời gian
 */
export async function computeOpeningBalance(
  userId: Types.ObjectId,
  wallet: IWallet,
  from?: Date
): Promise<number> {
  if (!from || from <= wallet.startDate) {
    return wallet.initialBalance;
  }

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);

  const prevFilter = {
    userId,
    walletId: wallet._id,
    date: { $gte: wallet.startDate, $lt: start },
  };

  const { totalIncome, totalExpense } = await getTransactionSummary(prevFilter);
  return wallet.initialBalance + totalIncome - totalExpense;
}

// Xây dựng bộ lọc khoảng thời gian theo chuẩn thống nhất
function buildRangeFilter(
  userId: Types.ObjectId,
  walletId: Types.ObjectId,
  from?: Date,
  to?: Date
): Record<string, unknown> {
  const dateFilter = buildDateFilter(from, to);
  return {
    userId,
    walletId,
    ...(dateFilter ? { date: dateFilter } : {}),
  };
}

export interface StatementQuery {
  walletId: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface StatementTransactionItem {
  _id: string;
  type: "income" | "expense";
  amount: number;
  date: Date;
  note?: string;
  categoryId: { _id: string; name: string; type: string };
  balanceAfter: number;
}

export interface StatementResult {
  wallet: {
    _id: string;
    name: string;
    bankName?: string;
    accountNumber?: string;
  };
  period: { from?: Date; to?: Date };
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactions: {
    items: StatementTransactionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * LẤY SAO KÊ TÀI CHÍNH KÈM SỐ DƯ LŨY KẾ ĐỘNG CHO TỪNG GIAO DỊCH (balanceAfter)
 * Tính toán on-the-fly theo phân trang, không cần lưu cứng vào CSDL, không tốn RAM.
 */
export async function getWalletStatement(
  userId: Types.ObjectId,
  query: StatementQuery
): Promise<StatementResult> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  // 1. Tính tổng thu, tổng chi và số dư cuối kỳ trong 1 lượt aggregate
  const { totalIncome, totalExpense } = await getTransactionSummary(rangeFilter);
  const closingBalance = openingBalance + totalIncome - totalExpense;

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 && query.limit <= 200 ? query.limit : 50;
  const skip = (page - 1) * limit;

  // 2. Tính số dư mốc trước trang hiện tại (nếu page > 1) bằng cách quét nhanh skip records
  let pageStartingBalance = closingBalance;
  if (skip > 0) {
    const prevItems = await Transaction.find(rangeFilter)
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .limit(skip)
      .select("type amount");
    for (const item of prevItems) {
      if (item.type === "income") {
        pageStartingBalance -= item.amount;
      } else {
        pageStartingBalance += item.amount;
      }
    }
  }

  // 3. Lấy danh sách giao dịch cho trang hiện tại
  const [docs, total] = await Promise.all([
    Transaction.find(rangeFilter)
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "name type"),
    Transaction.countDocuments(rangeFilter),
  ]);

  let running = pageStartingBalance;
  const items: StatementTransactionItem[] = docs.map((doc) => {
    const tx = doc.toObject();
    const currentBalanceAfter = running;
    if (tx.type === "income") {
      running -= tx.amount;
    } else {
      running += tx.amount;
    }
    return {
      _id: tx._id.toString(),
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      note: tx.note,
      categoryId: tx.categoryId as any,
      balanceAfter: currentBalanceAfter,
    };
  });

  return {
    wallet: {
      _id: wallet._id.toString(),
      name: wallet.name,
      bankName: wallet.bankName,
      accountNumber: wallet.accountNumber,
    },
    period: { from: query.from, to: query.to },
    openingBalance,
    totalIncome,
    totalExpense,
    closingBalance,
    transactions: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export interface ExportStatementQuery {
  walletId: string;
  from?: Date;
  to?: Date;
}

/**
 * XUẤT BÁO CÁO SAO KÊ EXCEL DẠNG TRUE STREAMING $O(1)$ RAM
 * Tính toán balanceAfter lùi từ closingBalance và ghi trực tiếp ra HTTP stream qua WorkbookWriter.
 * Tuyệt đối không giữ mảng dữ liệu trong RAM.
 */
export async function exportWalletStatementExcel(
  res: Response,
  userId: Types.ObjectId,
  query: ExportStatementQuery
): Promise<void> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  // 1. Tính tổng thu, chi và số dư cuối kỳ
  const { totalIncome, totalExpense } = await getTransactionSummary(rangeFilter);
  const closingBalance = openingBalance + totalIncome - totalExpense;

  const fromDateStr = formatDateVn(query.from ? query.from : wallet.startDate);
  const toDateStr = formatDateVn(query.to ? query.to : new Date());

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.xlsx"; filename*=UTF-8''sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.xlsx`
  );

  // Khởi tạo WorkbookWriter True Streaming
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    useSharedStrings: true,
  });

  const worksheet = workbook.addWorksheet("Sao Kê Chi Tiết");

  // Cấu hình độ rộng cột
  worksheet.columns = [
    { header: "", key: "stt", width: 8 },
    { header: "", key: "date", width: 16 },
    { header: "", key: "type", width: 14 },
    { header: "", key: "category", width: 24 },
    { header: "", key: "amount", width: 22 },
    { header: "", key: "balanceAfter", width: 22 },
    { header: "", key: "note", width: 35 },
  ];

  // KHỐI 1: HEADER
  const titleRow = worksheet.addRow(["", "BẢNG SAO KÊ CHI TIẾT TÀI KHOẢN"]);
  titleRow.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF0A58CA" } };
  worksheet.addRow([]);

  worksheet.addRow(["", "Chủ tài khoản:", wallet.name]);
  worksheet.addRow(["", "Ngân hàng:", wallet.bankName ? `${wallet.bankName} - STK: ${wallet.accountNumber || "N/A"}` : "Tiền mặt"]);
  worksheet.addRow(["", "Kỳ sao kê:", `Từ ${fromDateStr} đến ${toDateStr}`]);
  worksheet.addRow([]);

  // KHỐI 2: SUMMARY CARD
  worksheet.addRow(["", "TỔNG HỢP BIẾN ĐỘNG SỐ DƯ KỲ NÀY"]);
  worksheet.addRow(["", "Số dư đầu kỳ:", openingBalance]);
  worksheet.addRow(["", "Tổng tiền thu (+):", totalIncome]);
  worksheet.addRow(["", "Tổng tiền chi (-):", totalExpense]);
  worksheet.addRow(["", "Số dư cuối kỳ:", closingBalance]);
  worksheet.addRow([]);

  // KHỐI 3: TIÊU ĐỀ BẢNG DỮ LIỆU
  const headerRow = worksheet.addRow(["STT", "Ngày GD", "Loại GD", "Danh mục", "Số tiền (VNĐ)", "Số dư sau GD (VNĐ)", "Ghi chú"]);
  headerRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // KHỐI 4: STREAM DỮ LIỆU TỪ CURSOR (O(1) RAM - GHI TRỰC TIẾP RA STREAM)
  const cursor = Transaction.find(rangeFilter)
    .sort({ date: -1, createdAt: -1, _id: -1 })
    .populate("categoryId", "name")
    .cursor();

  let stt = 1;
  let running = closingBalance;

  for await (const doc of cursor) {
    const tx = doc as ITransaction & { categoryId: { name?: string } };
    const isIncome = tx.type === "income";
    const currentBalanceAfter = running;

    if (isIncome) {
      running -= tx.amount;
    } else {
      running += tx.amount;
    }

    const dataRow = worksheet.addRow([
      stt++,
      formatDateVn(tx.date),
      isIncome ? "Thu (+)" : "Chi (-)",
      tx.categoryId?.name ?? "Khác",
      isIncome ? tx.amount : -tx.amount,
      currentBalanceAfter,
      tx.note ?? "",
    ]);

    dataRow.getCell(1).alignment = { horizontal: "center" };
    dataRow.getCell(2).alignment = { horizontal: "center" };
    dataRow.getCell(3).alignment = { horizontal: "center" };
    dataRow.getCell(3).font = { bold: true, color: { argb: isIncome ? "FF16A34A" : "FFDC2626" } };
    dataRow.getCell(5).numFmt = '#,##0 "₫"';
    dataRow.getCell(5).font = { bold: true, color: { argb: isIncome ? "FF16A34A" : "FFDC2626" } };
    dataRow.getCell(6).numFmt = '#,##0 "₫"';
    dataRow.getCell(6).font = { bold: true, color: { argb: "FF334155" } };

    dataRow.commit();
  }

  worksheet.addRow([]);
  worksheet.addRow(["", `Báo cáo được trích xuất tự động vào lúc: ${new Date().toLocaleString("vi-VN")}`]);

  await workbook.commit();
}

/**
 * XUẤT BÁO CÁO SAO KÊ PDF DẠNG TRUE STREAMING UNICODE
 */
export async function exportWalletStatementPdf(
  res: Response,
  userId: Types.ObjectId,
  query: ExportStatementQuery
): Promise<void> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  const { totalIncome, totalExpense } = await getTransactionSummary(rangeFilter);
  const closingBalance = openingBalance + totalIncome - totalExpense;

  const fromDateStr = formatDateVn(query.from ? query.from : wallet.startDate);
  const toDateStr = formatDateVn(query.to ? query.to : new Date());

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.pdf"; filename*=UTF-8''sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.pdf`
  );

  const doc = new PDFDocument({ margin: 36, size: "A4" });
  doc.pipe(res);

  // Đăng ký Font Unicode
  const regularFont = path.join(__dirname, "../assets/fonts/Arial.ttf");
  const boldFont = path.join(__dirname, "../assets/fonts/Arial-Bold.ttf");
  if (fs.existsSync(regularFont) && fs.existsSync(boldFont)) {
    doc.registerFont("Main", regularFont);
    doc.registerFont("Main-Bold", boldFont);
  } else {
    doc.registerFont("Main", "Helvetica");
    doc.registerFont("Main-Bold", "Helvetica-Bold");
  }

  doc.font("Main-Bold").fontSize(18).fillColor("#0a58ca").text("BẢNG SAO KÊ CHI TIẾT TÀI KHOẢN", { align: "center" });
  doc.moveDown(0.5);

  doc.font("Main").fontSize(10).fillColor("#334155");
  doc.text(`Chủ tài khoản: ${wallet.name}`);
  doc.text(`Tài khoản: ${wallet.bankName ? `${wallet.bankName} - STK: ${wallet.accountNumber || "N/A"}` : "Tiền mặt"}`);
  doc.text(`Kỳ sao kê: Từ ${fromDateStr} đến ${toDateStr}`);
  doc.moveDown(0.8);

  // Khối tổng kết
  doc.font("Main-Bold").fontSize(11).fillColor("#0f172a").text("TỔNG HỢP BIẾN ĐỘNG SỐ DƯ");
  doc.font("Main").fontSize(10).fillColor("#334155");
  doc.text(`• Số dư đầu kỳ: ${formatVnd(openingBalance)}`);
  doc.fillColor("#16a34a").text(`• Tổng tiền thu (+): ${formatVnd(totalIncome)}`);
  doc.fillColor("#dc2626").text(`• Tổng tiền chi (-): ${formatVnd(totalExpense)}`);
  doc.font("Main-Bold").fillColor("#0f172a").text(`• Số dư cuối kỳ: ${formatVnd(closingBalance)}`);
  doc.moveDown(1);

  // Tiêu đề bảng
  const startX = 36;
  let currentY = doc.y;

  doc.rect(startX, currentY, 523, 20).fill("#1e293b");
  doc.font("Main-Bold").fontSize(9).fillColor("#ffffff");
  doc.text("STT", startX + 5, currentY + 5, { width: 25, align: "center" });
  doc.text("Ngày GD", startX + 32, currentY + 5, { width: 60, align: "center" });
  doc.text("Loại", startX + 94, currentY + 5, { width: 40, align: "center" });
  doc.text("Danh mục", startX + 136, currentY + 5, { width: 95 });
  doc.text("Số tiền (VNĐ)", startX + 233, currentY + 5, { width: 85, align: "right" });
  doc.text("Số dư sau GD", startX + 320, currentY + 5, { width: 85, align: "right" });
  doc.text("Ghi chú", startX + 410, currentY + 5, { width: 110 });

  currentY += 22;

  const cursor = Transaction.find(rangeFilter)
    .sort({ date: -1, createdAt: -1, _id: -1 })
    .populate("categoryId", "name")
    .cursor();

  let count = 1;
  let runningPdf = closingBalance;

  for await (const doc2 of cursor) {
    const tx = doc2 as ITransaction & { categoryId: { name?: string } };
    const isIncome = tx.type === "income";
    const currentBalanceAfter = runningPdf;

    if (isIncome) {
      runningPdf -= tx.amount;
    } else {
      runningPdf += tx.amount;
    }

    if (currentY > 750) {
      doc.addPage();
      currentY = 36;
    }

    if (count % 2 === 0) {
      doc.rect(startX, currentY - 2, 523, 16).fill("#f8fafc");
    }

    doc.font("Main").fontSize(8).fillColor("#334155");
    doc.text(String(count++), startX + 5, currentY, { width: 25, align: "center" });
    doc.text(formatDateVn(tx.date), startX + 32, currentY, { width: 60, align: "center" });

    doc.font("Main-Bold").fillColor(isIncome ? "#16a34a" : "#dc2626");
    doc.text(isIncome ? "Thu" : "Chi", startX + 94, currentY, { width: 40, align: "center" });

    doc.font("Main").fillColor("#334155");
    doc.text(tx.categoryId?.name ?? "Khác", startX + 136, currentY, { width: 95 });

    doc.font("Main-Bold").fillColor(isIncome ? "#16a34a" : "#dc2626");
    doc.text((isIncome ? "+" : "-") + formatVnd(tx.amount), startX + 233, currentY, { width: 85, align: "right" });

    doc.font("Main").fillColor("#334155");
    doc.text(formatVnd(currentBalanceAfter), startX + 320, currentY, { width: 85, align: "right" });

    doc.font("Main").fillColor("#64748b");
    doc.text(tx.note ?? "", startX + 410, currentY, { width: 110, height: 14, ellipsis: true });

    currentY += 16;
  }

  doc.end();
}
