import { Types } from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Response } from "express";
import { Transaction, ITransaction } from "../models/Transaction";
import { getWalletOrThrow } from "./walletService";
import { IWallet } from "../models/Wallet";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

function formatDateVn(date: Date): string {
  return date.toLocaleDateString("vi-VN");
}

// Tính số dư đầu kỳ
async function computeOpeningBalance(
  userId: Types.ObjectId,
  wallet: IWallet,
  from?: Date
): Promise<number> {
  if (!from) return wallet.initialBalance;
  const lastBefore = await Transaction.findOne({
    userId,
    walletId: wallet._id,
    date: { $lt: from },
  })
    .sort({ date: -1, _id: -1 })
    .select("balanceAfter");
  return lastBefore ? lastBefore.balanceAfter : wallet.initialBalance;
}

// Xây dựng bộ lọc theo khoảng thời gian
function buildRangeFilter(
  userId: Types.ObjectId,
  walletId: Types.ObjectId,
  from?: Date,
  to?: Date
): Record<string, unknown> {
  const filter: Record<string, unknown> = { userId, walletId };
  if (from || to) {
    filter.date = {};
    if (from) (filter.date as Record<string, Date>).$gte = from;
    if (to) (filter.date as Record<string, Date>).$lte = to;
  }
  return filter;
}

// Interface cho truy vấn sao kê ví
export interface WalletStatementQuery {
  walletId: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

// Interface cho kết quả truy vấn sao kê ví
export interface WalletStatementResult {
  wallet: { id: string; name: string };
  from: Date | null;
  to: Date | null;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  transactions: {
    items: unknown[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Lấy sao kê ví (bao gồm số dư đầu kỳ, tổng thu/chi trong kỳ và chi tiết giao dịch có phân trang)
export async function getWalletStatement(
  userId: Types.ObjectId,
  query: WalletStatementQuery
): Promise<WalletStatementResult> {
  const wallet = await getWalletOrThrow(userId, query.walletId);

  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  // Tổng thu / tổng chi trong kỳ (aggregation, không load hết document)
  const totals = await Transaction.aggregate<{ _id: "income" | "expense"; total: number }>([
    { $match: rangeFilter },
    { $group: { _id: "$type", total: { $sum: "$amount" } } },
  ]);
  const totalIncome = totals.find((t) => t._id === "income")?.total ?? 0;
  const totalExpense = totals.find((t) => t._id === "expense")?.total ?? 0;
  const closingBalance = openingBalance + totalIncome - totalExpense;

  // Danh sách chi tiết từng giao dịch trong kỳ (theo thứ tự thời gian, có phân trang)
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 && query.limit <= 200 ? query.limit : 50;

  const [items, total] = await Promise.all([
    Transaction.find(rangeFilter)
      .sort({ date: 1, _id: 1 })
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

// Interface cho input xuất báo cáo
export interface ExportStatementQuery {
  walletId: string;
  from?: Date;
  to?: Date;
}

// Export sao kê ra file Excel
export async function exportWalletStatementExcel(
  res: Response,
  userId: Types.ObjectId,
  query: ExportStatementQuery
): Promise<void> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.xlsx"; filename*=UTF-8''sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.xlsx`
  );

  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const sheet = workbook.addWorksheet("Sao ke");

  sheet.columns = [
    { header: "Ngày", key: "date", width: 14 },
    { header: "Loại", key: "type", width: 10 },
    { header: "Danh mục", key: "category", width: 20 },
    { header: "Số tiền", key: "amount", width: 16 },
    { header: "Số dư sau", key: "balanceAfter", width: 16 },
    { header: "Ghi chú", key: "note", width: 30 },
  ];

  sheet
    .addRow({ date: `Ví: ${wallet.name}`, type: "", category: "", amount: "", balanceAfter: "", note: "" })
    .commit();
  sheet
    .addRow({ date: "Số dư đầu kỳ", type: "", category: "", amount: openingBalance, balanceAfter: "", note: "" })
    .commit();
  sheet.addRow({}).commit(); // dòng trống ngăn cách phần tổng hợp và bảng chi tiết

  let totalIncome = 0;
  let totalExpense = 0;

  // Cursor: đọc từng document một, không load cả mảng lớn vào bộ nhớ
  const cursor = Transaction.find(rangeFilter)
    .sort({ date: 1, _id: 1 })
    .populate("categoryId", "name")
    .cursor();

  for await (const doc of cursor) {
    const tx = doc as ITransaction & { categoryId: { name?: string } };
    if (tx.type === "income") totalIncome += tx.amount;
    else totalExpense += tx.amount;

    sheet
      .addRow({
        date: formatDateVn(tx.date),
        type: tx.type === "income" ? "Thu" : "Chi",
        category: tx.categoryId?.name ?? "",
        amount: tx.type === "income" ? tx.amount : -tx.amount,
        balanceAfter: tx.balanceAfter,
        note: tx.note ?? "",
      })
      .commit();
  }

  sheet.addRow({}).commit();
  sheet
    .addRow({ date: "Tổng thu", type: "", category: "", amount: totalIncome, balanceAfter: "", note: "" })
    .commit();
  sheet
    .addRow({ date: "Tổng chi", type: "", category: "", amount: -totalExpense, balanceAfter: "", note: "" })
    .commit();
  sheet
    .addRow({
      date: "Số dư cuối kỳ",
      type: "",
      category: "",
      amount: openingBalance + totalIncome - totalExpense,
      balanceAfter: "",
      note: "",
    })
    .commit();

  await sheet.commit();
  await workbook.commit();
}

// Export sao kê ra file PDF
export async function exportWalletStatementPdf(
  res: Response,
  userId: Types.ObjectId,
  query: ExportStatementQuery
): Promise<void> {
  const wallet = await getWalletOrThrow(userId, query.walletId);
  const openingBalance = await computeOpeningBalance(userId, wallet, query.from);
  const rangeFilter = buildRangeFilter(userId, wallet._id, query.from, query.to);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.pdf"; filename*=UTF-8''sao-ke-${encodeURIComponent(wallet.name.replace(/\s+/g, "-"))}.pdf`
  );

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(16).text(`Sao kê - ${wallet.name}`, { align: "left" });
  doc.fontSize(10).fillColor("#555").text(
    `Từ ngày: ${query.from ? formatDateVn(query.from) : "Từ đầu"}   Đến ngày: ${
      query.to ? formatDateVn(query.to) : "Hiện tại"
    }`
  );
  doc.moveDown();
  doc.fillColor("#000").fontSize(11).text(`Số dư đầu kỳ: ${formatVnd(openingBalance)}`);
  doc.moveDown();

  const columnX = { date: 40, type: 110, category: 160, amount: 300, balance: 400, note: 470 };
  const pageBottom = doc.page.height - doc.page.margins.bottom;

  function drawHeader() {
    doc.fontSize(10).fillColor("#000");
    doc.text("Ngày", columnX.date, doc.y, { continued: false, width: 60 });
    doc.text("Loại", columnX.type, doc.y - 12, { width: 40 });
    doc.text("Danh mục", columnX.category, doc.y - 12, { width: 130 });
    doc.text("Số tiền", columnX.amount, doc.y - 12, { width: 90, align: "right" });
    doc.text("Ghi chú", columnX.note, doc.y - 12, { width: 90 });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#ccc").stroke();
    doc.moveDown(0.3);
  }

  drawHeader();

  let totalIncome = 0;
  let totalExpense = 0;

  const cursor = Transaction.find(rangeFilter)
    .sort({ date: 1, _id: 1 })
    .populate("categoryId", "name")
    .cursor();

  for await (const doc2 of cursor) {
    const tx = doc2 as ITransaction & { categoryId: { name?: string } };
    if (tx.type === "income") totalIncome += tx.amount;
    else totalExpense += tx.amount;

    // Ngắt trang chủ động trước khi vẽ dòng mới nếu sắp chạm lề dưới
    if (doc.y > pageBottom - 20) {
      doc.addPage();
      drawHeader();
    }

    const rowY = doc.y;
    doc.fontSize(9).fillColor("#000");
    doc.text(formatDateVn(tx.date), columnX.date, rowY, { width: 60 });
    doc.text(tx.type === "income" ? "Thu" : "Chi", columnX.type, rowY, { width: 40 });
    doc.text(tx.categoryId?.name ?? "", columnX.category, rowY, { width: 130 });
    doc.fillColor(tx.type === "income" ? "#16a34a" : "#dc2626");
    doc.text(
      `${tx.type === "income" ? "+" : "-"}${formatVnd(tx.amount)}`,
      columnX.amount,
      rowY,
      { width: 90, align: "right" }
    );
    doc.fillColor("#000");
    doc.text(tx.note ?? "", columnX.note, rowY, { width: 90 });
    doc.moveDown(0.6);
  }

  if (doc.y > pageBottom - 60) doc.addPage();
  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#000").stroke();
  doc.moveDown(0.5);
  doc.fontSize(11);
  doc.fillColor("#16a34a").text(`Tổng thu: +${formatVnd(totalIncome)}`);
  doc.fillColor("#dc2626").text(`Tổng chi: -${formatVnd(totalExpense)}`);
  doc.fillColor("#000").text(`Số dư cuối kỳ: ${formatVnd(openingBalance + totalIncome - totalExpense)}`);

  doc.end();
}