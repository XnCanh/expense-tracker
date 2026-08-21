import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { loginWithIdToken, requiresWalletSetup } = useAuth();
  const navigate = useNavigate();

  async function handleSuccess(cred: CredentialResponse) {
    if (!cred.credential) return;
    try {
      await loginWithIdToken(cred.credential);
      navigate(requiresWalletSetup ? "/wallets/new" : "/", { replace: true });
    } catch (err) {
      console.error("Đăng nhập thất bại:", err);
      alert("Đăng nhập thất bại, vui lòng thử lại.");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 80, gap: 16 }}>
      <h1>Quản lý Chi tiêu</h1>
      <p>Đăng nhập bằng tài khoản Google để bắt đầu</p>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => alert("Không thể đăng nhập bằng Google")}
      />
    </div>
  );
}
