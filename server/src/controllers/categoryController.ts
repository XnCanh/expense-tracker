import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { listCategories, createCategory } from "../services/categoryService";
import { AppError } from "../middlewares/errorHandler";

// listCategoriesHandler - Lấy danh sách danh mục
function getUserId(req: Request): Types.ObjectId {
  if (!req.auth) throw new AppError("Chưa xác thực", 401);
  return new Types.ObjectId(req.auth.userId);
}

const typeQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
});

// listCategoriesHandler - Lấy danh sách danh mục
export async function listCategoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const { type } = typeQuerySchema.parse(req.query);
    const categories = await listCategories(userId, type);
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(["income", "expense"]),
});

// createCategoryHandler - Tạo danh mục
export async function createCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const input = createCategorySchema.parse(req.body);
    const category = await createCategory(userId, input);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}
