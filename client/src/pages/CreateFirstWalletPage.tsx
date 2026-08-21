import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWalletApi } from "../api/wallet";
import { Wallet, AlertCircle } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function CreateFirstWalletPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [startDate, setStartDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedBalance = Number(initialBalance);
    if (!name.trim()) return setError("Vui lòng nhập tên ví");
    if (Number.isNaN(parsedBalance) || parsedBalance < 0) return setError("Số dư ban đầu không hợp lệ");

    setSubmitting(true);
    try {
      await createWalletApi({
        name: name.trim(),
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        initialBalance: parsedBalance,
        startDate,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError("Tạo ví thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    }}>
      <div className="bento-card" style={{ maxWidth: 460, width: "100%", padding: 28 }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          marginBottom: 14
        }}>
          <Wallet size={22} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>Khởi Tạo Ví Đầu Tiên</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Bạn cần có ít nhất 1 ví tài khoản để bắt đầu theo dõi thu chi.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Tên ví *
            </label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Ví tiền mặt, MB Bank..."
              required
            />
          </div>

          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Ngân hàng (Tùy chọn)
              </label>
              <input
                className="form-control"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank"
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Số tài khoản
              </label>
              <input
                className="form-control font-mono"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="VD: 1028394829"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Số dư ban đầu (VNĐ) *
            </label>
            <input
              type="number"
              min={0}
              className="form-control font-mono"
              style={{ fontSize: 16, fontWeight: 700 }}
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Ngày bắt đầu tính toán *
            </label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--danger-bg)", border: "1px solid var(--danger)", color: "var(--danger-text)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: "100%", padding: "12px 0", fontSize: 14, marginTop: 6 }}>
            {submitting ? "Đang khởi tạo..." : "Xác Nhận Tạo Ví"}
          </button>
        </form>
      </div>
    </div>
  );
}
