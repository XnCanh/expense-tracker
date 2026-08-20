import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { User, IUser } from "../models/User";
import { AppError } from "../middlewares/errorHandler";

const googleClient = new OAuth2Client(env.googleClientId);

// Xác thực Google id_token
async function verifyGoogleIdToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new AppError("Google id_token không hợp lệ", 401);
  }
  return payload;
}

// Đăng nhập bằng Google (tự động tạo user nếu chưa có)
export async function loginWithGoogle(idToken: string): Promise<IUser> {
  const payload = await verifyGoogleIdToken(idToken);

  let user = await User.findOne({ googleId: payload.sub });

  if (!user) {
    user = await User.create({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name ?? payload.email!,
      avatarUrl: payload.picture,
    });
  }

  return user;
}