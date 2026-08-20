import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loginWithGoogle } from "../services/authService";
import { userHasWallet } from "../services/walletService";
import { signAccessToken } from "../utils/jwt";
import { User } from "../models/User";
import { AppError } from "../middlewares/errorHandler";

const googleLoginSchema = z.object({
  idToken: z.string().min(10, "idToken không hợp lệ"),
});

// googleLogin - Đăng nhập bằng Google
export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = googleLoginSchema.parse(req.body);

    const user = await loginWithGoogle(idToken);
    const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
    const hasWallet = await userHasWallet(user._id);

    res.json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      // Client dùng cờ này để điều hướng bắt buộc sang màn "Tạo ví đầu tiên"
      // nếu đây là lần đăng nhập đầu tiên (đáp ứng yêu cầu "Khởi tạo Ví đầu tiên")
      requiresWalletSetup: !hasWallet,
    });
  } catch (err) {
    next(err);
  }
}

// getMe - Lấy thông tin người dùng hiện tại
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw new AppError("Chưa xác thực", 401);

    const user = await User.findById(req.auth.userId);
    if (!user) throw new AppError("Không tìm thấy người dùng", 404);

    const hasWallet = await userHasWallet(user._id);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      requiresWalletSetup: !hasWallet,
    });
  } catch (err) {
    next(err);
  }
}
