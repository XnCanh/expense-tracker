import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { listCategoriesHandler, createCategoryHandler } from "../controllers/categoryController";

const router = Router();

router.use(requireAuth);

router.get("/", listCategoriesHandler);
router.post("/", createCategoryHandler);

export default router;