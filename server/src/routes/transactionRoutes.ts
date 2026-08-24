import { Router } from "express";
import {
  createTransactionHandler,
  listTransactionsHandler,
  updateTransactionHandler,
  deleteTransactionHandler,
} from "../controllers/transactionController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// Toàn bộ route giao dịch đều yêu cầu xác thực JWT
router.use(requireAuth);

router.post("/", createTransactionHandler);
router.get("/", listTransactionsHandler);
router.put("/:id", updateTransactionHandler);
router.delete("/:id", deleteTransactionHandler);

export default router;
