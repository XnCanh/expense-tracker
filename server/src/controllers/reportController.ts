import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import {
  getWalletStatement,
  exportWalletStatementExcel,
  exportWalletStatementPdf,
} from "../services/reportService";
import { AppError } from "../middlewares/errorHandler";

function getUserId(req: Request): Types.ObjectId {
  if (!req.auth) throw new AppError("Chưa xác thực", 401);
  return new Types.ObjectId(req.auth.userId);
}

// getWalletStatementHandler - Lấy sao kê ví
const statementQuerySchema = z.object({
  walletId: z.string().min(1, "Vui lòng chọn ví"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

// getWalletStatementHandler - Lấy sao kê ví
export async function getWalletStatementHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const query = statementQuerySchema.parse(req.query);
    const result = await getWalletStatement(userId, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// exportStatementExcelHandler - Xuất báo cáo ví ra file Excel
const exportQuerySchema = z.object({
  walletId: z.string().min(1, "Vui lòng chọn ví"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// exportStatementExcelHandler - Xuất báo cáo ví ra file Excel
export async function exportStatementExcelHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const query = exportQuerySchema.parse(req.query);
    await exportWalletStatementExcel(res, userId, query);
  } catch (err) {
    next(err);
  }
}

// exportStatementPdfHandler - Xuất báo cáo ví ra file PDF
export async function exportStatementPdfHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const query = exportQuerySchema.parse(req.query);
    await exportWalletStatementPdf(res, userId, query);
  } catch (err) {
    next(err);
  }
}
