import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { createTransactionHandler, listTransactionsHandler } from "../controllers/transactionController";

const router = Router();

router.use(requireAuth);

router.post("/", createTransactionHandler);
router.get("/", listTransactionsHandler);

export default router;
