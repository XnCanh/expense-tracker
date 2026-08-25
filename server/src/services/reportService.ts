import { Response } from "express";
import { Types } from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import { Transaction, ITransaction } from "../models/Transaction";
import { IWallet } from "../models/Wallet";
import { getWalletOrThrow } from "./walletService";

// Hàm hỗ trợ định dạng ngày tháng chuẩn Việt Nam (DD/MM/YYYY)
function formatDateVn(date: Date | string): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Hàm hỗ trợ định dạng tiền tệ VNĐ
function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

// Tính toán chính xác số dư đầu kỳ theo thời gian
async function computeOpeningBalance(
  userId: Types.ObjectId,
  wallet: IWallet,
  from?: Date
): Promise<number> {
  if (!from || from <= wallet.startDate) {
    return wallet.initialBalance;
  }

  const prevTotals = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    {
      $match: {
        userId,
        walletId: wallet._id,
        date: { $gte: wallet.startDate, $lt: from },
      },
    },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);

  const prevIncome = prevTotals.find((t) => t._id === "income")?.total ?? 0;
  const prevExpense = prevTotals.find((t) => t._id === "expense")?.total ?? 0;
  return wallet.initialBalance + prevIncome - prevExpense;
}

// Xây dựng bộ lọc khoảng thời gian truy vấn
function buildRangeFilter(
  userId: Types.ObjectId,
  walletId: Types.ObjectId,
  from?: Date,
  to?: Date
) {
  const dateFilter: Record<string, unknown> = {};
  if (from) dateFilter.$gte = from;
  if (to) {
    const endOfDay = new Date(to);
    endOfDay.setHours(23, 59, 59, 999);
    dateFilter.$lte = endOfDay;
  }
  return {
    userId,
    walletId,
    ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
  };
}

export interface StatementQuery {
  walletId: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface StatementResult {
  wallet: { id: string; name: string };
  from: Date | null;
  to: Date | null;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactions: {
    items: ITransaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Lấy dữ liệu sao kê chi tiết dạng JSON (Sắp xếp từ MỚI NHẤT đến CŨ NHẤT)
export async function getWalletStatement(
  userId: Types.ObjectId,
  query: StatementQuery
): Promise<StatementResult> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  const totals = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    { $match: rangeFilter },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const totalIncome = totals.find((t) => t._id === "income")?.total ?? 0;
  const totalExpense = totals.find((t) => t._id === "expense")?.total ?? 0;
  const closingBalance = openingBalance + totalIncome - totalExpense;

  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 && query.limit <= 200 ? query.limit : 50;

  const [items, total] = await Promise.all([
    Transaction.find(rangeFilter)
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("categoryId", "name type"),
    Transaction.countDocuments(rangeFilter),
  ]);

  return {
    wallet: { id: wallet._id.toString(), name: wallet.name },
    from: query.from ?? null,
    to: query.to ?? null,
    openingBalance,
    totalIncome,
    totalExpense,
    closingBalance,
    transactions: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

export interface ExportStatementQuery {
  walletId: string;
  from?: Date;
  to?: Date;
}

// Xuất báo cáo sao kê ra file Excel (Kiến trúc Stream, tiêu thụ RAM tối thiểu O(1))
export async function exportWalletStatementExcel(
  res: Response,
  userId: Types.ObjectId,
  query: ExportStatementQuery
): Promise<void> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

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

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet("Sao Kê Chi Tiết");

  // Thiết lập độ rộng cột chuẩn
  sheet.columns = [
    { key: "stt", width: 8 },
    { key: "date", width: 16 },
    { key: "type", width: 12 },
    { key: "category", width: 25 },
    { key: "amount", width: 20 },
    { key: "balanceAfter", width: 22 },
    { key: "note", width: 35 },
  ];

  // Tiêu đề báo cáo
  sheet.addRow(["BÁO CÁO SAO KÊ TÀI CHÍNH"]).commit();
  sheet.addRow([`Ví tài khoản: ${wallet.name}${wallet.bankName ? " (" + wallet.bankName + ")" : ""} | STK: ${wallet.accountNumber || "Tiền mặt"}`]).commit();
  sheet.addRow([`Kỳ sao kê: Từ ngày ${fromDateStr} đến ngày ${toDateStr} | Ngày xuất: ${formatDateVn(new Date())}`]).commit();
  sheet.addRow([]).commit();

  // Khối tổng quan số dư
  sheet.addRow(["TỔNG QUAN TÀI CHÍNH KỲ NÀY"]).commit();
  sheet.addRow(["Số dư đầu kỳ", "Tổng Thu (+)", "Tổng Chi (-)", "Số dư cuối kỳ"]).commit();

  let totalIncome = 0;
  let totalExpense = 0;

  // Stream đếm giao dịch trước (Sắp xếp mới nhất đến cũ nhất)
  const cursor = Transaction.find(rangeFilter)
    .sort({ date: 1, createdAt: 1, _id: 1 })
    .populate("categoryId", "name")
    .cursor();

  const transactionsData: Array<{
    stt: number;
    date: string;
    type: string;
    category: string;
    amount: number;
    balanceAfter: number;
    note: string;
  }> = [];

  let count = 1;
  let running = openingBalance;
  for await (const doc of cursor) {
    const tx = doc as ITransaction & { categoryId: { name?: string } };
    if (tx.type === "income") {
      totalIncome += tx.amount;
      running += tx.amount;
    } else {
      totalExpense += tx.amount;
      running -= tx.amount;
    }

    transactionsData.push({
      stt: count++,
      date: formatDateVn(tx.date),
      type: tx.type === "income" ? "Thu" : "Chi",
      category: tx.categoryId?.name ?? "Khác",
      amount: tx.type === "income" ? tx.amount : -tx.amount,
      balanceAfter: running,
      note: tx.note ?? "",
    });
  }

  // Sắp xếp mới nhất trước khi ghi sheet
  transactionsData.reverse();
  transactionsData.forEach((row, i) => { row.stt = i + 1; });

  const closingBalance = openingBalance + totalIncome - totalExpense;
  sheet.addRow([openingBalance, totalIncome, -totalExpense, closingBalance]).commit();
  sheet.addRow([]).commit();

  // Bảng chi tiết giao dịch
  sheet.addRow(["CHI TIẾT CÁC GIAO DỊCH PHÁT SINH"]).commit();
  sheet.addRow(["STT", "Ngày", "Loại", "Danh mục", "Số tiền (VNĐ)", "Số dư sau GD (VNĐ)", "Ghi chú"]).commit();

  for (const row of transactionsData) {
    sheet.addRow([
      row.stt,
      row.date,
      row.type,
      row.category,
      row.amount,
      row.balanceAfter,
      row.note,
    ]).commit();
  }

  sheet.addRow([]).commit();
  sheet.addRow(["", "", "", "TỔNG KẾT", totalIncome - totalExpense, closingBalance, `Tổng số: ${transactionsData.length} giao dịch`]).commit();

  await sheet.commit();
  await workbook.commit();
}

// Xuất báo cáo sao kê ra file PDF (Hỗ trợ 100% Font Unicode Tiếng Việt, căn lề chuẩn A4)
export async function exportWalletStatementPdf(
  res: Response,
  userId: Types.ObjectId,
  query: ExportStatementQuery
): Promise<void> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  const fromDateStr = formatDateVn(query.from ? query.from : wallet.startDate);
  const toDateStr = formatDateVn(query.to ? query.to : new Date());

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.pdf"; filename*=UTF-8''sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.pdf`
  );

  const doc = new PDFDocument({ margin: 36, size: "A4" });
  doc.pipe(res);

  // Đăng ký Font Unicode Tiếng Việt
  const fontRegular = path.resolve(__dirname, "../assets/fonts/Arial.ttf");
  const fontBold = path.resolve(__dirname, "../assets/fonts/Arial-Bold.ttf");

  if (fs.existsSync(fontRegular)) {
    doc.registerFont("VN", fontRegular);
    doc.font("VN");
  }
  if (fs.existsSync(fontBold)) {
    doc.registerFont("VN-Bold", fontBold);
  }

  const useBold = fs.existsSync(fontBold) ? "VN-Bold" : "Helvetica-Bold";
  const useRegular = fs.existsSync(fontRegular) ? "VN" : "Helvetica";

  // Tiêu đề chính
  doc.font(useBold).fontSize(18).fillColor("#1877f2").text("BÁO CÁO SAO KÊ TÀI CHÍNH", { align: "left" });
  doc.font(useRegular).fontSize(10).fillColor("#555").text(
    `Ví: ${wallet.name}${wallet.bankName ? " (" + wallet.bankName + ")" : ""} | STK: ${wallet.accountNumber || "Tiền mặt"} | Kỳ sao kê: Từ ngày ${fromDateStr} đến ngày ${toDateStr}`
  );
  doc.moveDown(0.8);

  // Tọa độ các cột chuẩn (Tổng chiều rộng trang A4 trừ lề = 523pt)
  // STT: 36..61, Ngày: 65..130, Loại: 135..165, Danh mục: 170..280, Số tiền: 285..370, Số dư: 375..460, Ghi chú: 465..559
  const col = {
    stt: { x: 36, w: 25 },
    date: { x: 65, w: 65 },
    type: { x: 135, w: 30 },
    cat: { x: 170, w: 110 },
    amt: { x: 285, w: 85 },
    bal: { x: 375, w: 85 },
    note: { x: 465, w: 94 }
  };
  const pageBottom = doc.page.height - doc.page.margins.bottom;

  function drawSummaryBox(inc: number, exp: number, closeBal: number) {
    doc.font(useBold).fontSize(11).fillColor("#000").text("TỔNG QUAN TÀI CHÍNH KỲ NÀY");
    doc.font(useRegular).fontSize(10).fillColor("#333");
    doc.text(`• Số dư đầu kỳ: ${formatVnd(openingBalance)}`);
    doc.text(`• Tổng Thu: +${formatVnd(inc)}`);
    doc.text(`• Tổng Chi: -${formatVnd(exp)}`);
    doc.text(`• Số dư cuối kỳ: ${formatVnd(closeBal)}`);
    doc.moveDown(0.8);
  }

  function drawTableHeader() {
    doc.font(useBold).fontSize(9).fillColor("#000");
    const y = doc.y;
    doc.text("STT", col.stt.x, y, { width: col.stt.w, align: "center" });
    doc.text("Ngày", col.date.x, y, { width: col.date.w, align: "center" });
    doc.text("Loại", col.type.x, y, { width: col.type.w, align: "center" });
    doc.text("Danh mục", col.cat.x, y, { width: col.cat.w, align: "left" });
    doc.text("Số tiền", col.amt.x, y, { width: col.amt.w, align: "right" });
    doc.text("Số dư sau", col.bal.x, y, { width: col.bal.w, align: "right" });
    doc.text("Ghi chú", col.note.x, y, { width: col.note.w, align: "left" });
    doc.moveDown(0.4);
    doc.moveTo(36, doc.y).lineTo(559, doc.y).strokeColor("#cbd5e1").stroke();
    doc.moveDown(0.4);
  }

  let totalIncome = 0;
  let totalExpense = 0;

  // Stream đếm giao dịch (Sắp xếp mới nhất đến cũ nhất)
  const cursor = Transaction.find(rangeFilter)
    .sort({ date: 1, createdAt: 1, _id: 1 })
    .populate("categoryId", "name")
    .cursor();

  const rows: Array<{
    stt: number;
    date: string;
    type: string;
    category: string;
    amount: number;
    balanceAfter: number;
    note: string;
  }> = [];

  let idx = 1;
  let runningPdf = openingBalance;
  for await (const doc2 of cursor) {
    const tx = doc2 as ITransaction & { categoryId: { name?: string } };
    if (tx.type === "income") {
      totalIncome += tx.amount;
      runningPdf += tx.amount;
    } else {
      totalExpense += tx.amount;
      runningPdf -= tx.amount;
    }

    rows.push({
      stt: idx++,
      date: formatDateVn(tx.date),
      type: tx.type === "income" ? "Thu" : "Chi",
      category: tx.categoryId?.name ?? "Khác",
      amount: tx.type === "income" ? tx.amount : -tx.amount,
      balanceAfter: runningPdf,
      note: tx.note ?? "",
    });
  }

  // Sắp xếp mới nhất trước khi render bảng PDF
  rows.reverse();
  rows.forEach((r, i) => { r.stt = i + 1; });

  const closing = openingBalance + totalIncome - totalExpense;
  drawSummaryBox(totalIncome, totalExpense, closing);

  doc.font(useBold).fontSize(11).fillColor("#000").text(`CHI TIẾT GIAO DỊCH (${rows.length} phát sinh - Mới nhất đến cũ nhất)`);
  doc.moveDown(0.4);
  drawTableHeader();

  for (const row of rows) {
    if (doc.y > pageBottom - 24) {
      doc.addPage();
      drawTableHeader();
    }

    const rowY = doc.y;
    doc.font(useRegular).fontSize(9).fillColor("#333");
    doc.text(String(row.stt), col.stt.x, rowY, { width: col.stt.w, align: "center" });
    doc.text(row.date, col.date.x, rowY, { width: col.date.w, align: "center" });
    doc.text(row.type, col.type.x, rowY, { width: col.type.w, align: "center" });
    doc.text(row.category, col.cat.x, rowY, { width: col.cat.w, align: "left" });

    doc.fillColor(row.amount >= 0 ? "#16a34a" : "#dc2626");
    doc.text(
      `${row.amount >= 0 ? "+" : ""}${formatVnd(row.amount)}`,
      col.amt.x,
      rowY,
      { width: col.amt.w, align: "right" }
    );

    doc.fillColor("#333");
    doc.text(formatVnd(row.balanceAfter), col.bal.x, rowY, { width: col.bal.w, align: "right" });
    doc.text(row.note, col.note.x, rowY, { width: col.note.w, align: "left" });
    
    doc.y = rowY + 16; // Tự động dời dòng tiếp theo cách 16pt, không bao giờ bị đè chữ
  }

  doc.end();
}
