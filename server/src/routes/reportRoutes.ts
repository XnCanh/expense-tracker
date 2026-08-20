import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import {
  getWalletStatementHandler,
  exportStatementExcelHandler,
  exportStatementPdfHandler,
} from "../controllers/reportController";

const router = Router();

router.use(requireAuth);

router.get("/statement", getWalletStatementHandler);
router.get("/statement/export/excel", exportStatementExcelHandler);
router.get("/statement/export/pdf", exportStatementPdfHandler);

export default router;