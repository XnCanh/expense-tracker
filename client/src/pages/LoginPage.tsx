import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { BookOpen, Lock, ShieldCheck, FileSpreadsheet, CreditCard, Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const { loginWithIdToken, requiresWalletSetup } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative"
    }}>
      <button
        onClick={toggleTheme}
        className="btn btn-secondary"
        style={{ position: "absolute", top: 20, right: 20, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        <span>{theme === "dark" ? "Giao diện Sáng" : "Giao diện Tối"}</span>
      </button>

      <div className="bento-card" style={{ maxWidth: 440, width: "100%", padding: 32, textAlign: "center" }}>
        
        {/* Open Book Logo Badge */}
        <div style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          margin: "0 auto 16px",
          boxShadow: "0 4px 12px rgba(24, 119, 242, 0.3)"
        }}>
          <BookOpen size={28} />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--primary)", marginBottom: 4 }}>
          ExpenseBook
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24, lineHeight: 1.5 }}>
          Sổ tay quản lý thu chi cá nhân 
          <br />
          Hiện đại, trực quan và bảo mật.
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <GoogleLogin
            theme={theme === "dark" ? "filled_black" : "outline"}
            shape="pill"
            size="large"
            text="continue_with"
            onSuccess={handleSuccess}
            onError={() => alert("Không thể đăng nhập bằng Google")}
          />
        </div>

        <div style={{
          paddingTop: 16,
          borderTop: "1px solid var(--border-subtle)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          textAlign: "left"
        }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={14} color="var(--primary)" />
            <span><strong>Bảo mật tài khoản</strong></span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} color="var(--success)" />
            <span><strong>Chống chi tiêu âm</strong></span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <FileSpreadsheet size={14} color="var(--primary)" />
            <span><strong>Sao kê Excel & PDF</strong></span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <CreditCard size={14} color="var(--primary)" />
            <span><strong>Quản lý nhiều Ví</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
