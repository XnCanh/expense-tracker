import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import {
  createWalletHandler,
  listWalletsHandler,
  getWalletHandler,
  updateWalletHandler,
  deleteWalletHandler,
} from "../controllers/walletController";

const router = Router();

router.use(requireAuth);

router.post("/", createWalletHandler);
router.get("/", listWalletsHandler);
router.get("/:id", getWalletHandler);
router.patch("/:id", updateWalletHandler);
router.delete("/:id", deleteWalletHandler);

export default router;