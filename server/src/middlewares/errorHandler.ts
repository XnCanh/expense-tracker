import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Dữ liệu gửi lên không hợp lệ",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  console.error("[unhandled error]", err);
  return res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau" });
}
