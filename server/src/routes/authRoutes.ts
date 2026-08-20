import { Router } from "express";
import { googleLogin, getMe } from "../controllers/authController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.post("/google", googleLogin);
router.get("/me", requireAuth, getMe);

export default router;