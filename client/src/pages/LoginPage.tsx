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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      background: "radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)"
    }}>
      <div className="bento-card" style={{ maxWidth: 460, width: "100%", padding: 36, textAlign: "center" }}>
        
        {/* Brand Icon */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          margin: "0 auto 20px",
          boxShadow: "0 0 30px rgba(99, 102, 241, 0.5)"
        }}>
          ⚡
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8 }}>
          EXPENSE<span style={{ color: "#818cf8" }}>.AI</span>
        </h1>
        <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 28 }}>
          Nền tảng quản lý tài chính thông minh, bảo vệ chống chi âm ACID và sao kê trực quan.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <GoogleLogin
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            onSuccess={handleSuccess}
            onError={() => alert("Không thể đăng nhập bằng Google")}
          />
        </div>

        <div style={{
          paddingTop: 20,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          textAlign: "left"
        }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            🔒 <strong style={{ color: "#94a3b8" }}>Bảo mật JWT</strong>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            ⚡ <strong style={{ color: "#94a3b8" }}>ACID Safe</strong>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            📊 <strong style={{ color: "#94a3b8" }}>Xuất Excel/PDF</strong>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            💳 <strong style={{ color: "#94a3b8" }}>Đa ví tài khoản</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
