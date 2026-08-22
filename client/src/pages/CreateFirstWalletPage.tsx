import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createWalletApi } from "../api/wallet";
import { Wallet, AlertCircle, ArrowLeft, Building2 } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

const todayStr = () => new Date().toISOString().slice(0, 10);

const POPULAR_BANKS = [
  { value: "", label: "-- Không chọn / Ví tiền mặt --" },
  { value: "Vietcombank", label: "Vietcombank (VCB)" },
  { value: "Techcombank", label: "Techcombank (TCB)" },
  { value: "MB Bank", label: "MB Bank (Quân Đội)" },
  { value: "VietinBank", label: "VietinBank (CTG)" },
  { value: "BIDV", label: "BIDV (Đầu tư & Phát triển)" },
  { value: "ACB", label: "ACB (Á Châu)" },
  { value: "VPBank", label: "VPBank (Việt Nam Thịnh Vượng)" },
  { value: "TPBank", label: "TPBank (Tiên Phong)" },
  { value: "Sacombank", label: "Sacombank (Sài Gòn Thương Tín)" },
  { value: "VIB", label: "VIB (Quốc Tế)" },
  { value: "HDBank", label: "HDBank (Phát triển TP.HCM)" },
  { value: "SHB", label: "SHB (Sài Gòn - Hà Nội)" },
  { value: "MSB", label: "MSB (Hàng Hải)" },
  { value: "OCB", label: "OCB (Phương Đông)" },
  { value: "Agribank", label: "Agribank (Nông nghiệp)" },
  { value: "MoMo", label: "Ví điện tử MoMo" },
  { value: "ZaloPay", label: "Ví điện tử ZaloPay" },
  { value: "Viettel Money", label: "Viettel Money" },
  { value: "Khác", label: "Ngân hàng / Ví khác..." },
];

export default function CreateFirstWalletPage() {
  const { showSuccess } = useNotification();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [customBankName, setCustomBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [startDate, setStartDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBankChange = (bankValue: string) => {
    setSelectedBank(bankValue);
    // Nếu tên ví đang trống và chọn ngân hàng, gợi ý tên ví
    if (!name.trim() && bankValue && bankValue !== "Khác") {
      setName(bankValue);
    }
  };

  const resolvedBankName = selectedBank === "Khác" ? customBankName.trim() : selectedBank.trim();

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
        bankName: resolvedBankName || undefined,
        accountNumber: accountNumber.trim() || undefined,
        initialBalance: parsedBalance,
        startDate,
      });
      showSuccess("Đã tạo ví mới thành công.");
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Tạo ví thất bại, vui lòng thử lại.");
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
      padding: "24px 16px",
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

        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-main)", marginBottom: 4 }}>
          Thêm Ví / Tài Khoản Mới
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Quản lý số dư và phân bổ dòng tiền theo từng tài khoản ngân hàng hoặc tiền mặt.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          
          {/* Tên ví */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
              Tên ví *
            </label>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Ví tiền mặt, VCB chính, Techcombank..."
              required
            />
          </div>

          {/* Ngân hàng (Select Dropdown) + Số tài khoản */}
          <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>Ngân hàng</span>
              </label>
              <select
                className="form-control"
                value={selectedBank}
                onChange={(e) => handleBankChange(e.target.value)}
              >
                {POPULAR_BANKS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
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

          {/* Nếu chọn Ngân hàng khác -> hiện ô nhập tên */}
          {selectedBank === "Khác" && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Nhập tên ngân hàng / tổ chức tài chính
              </label>
              <input
                className="form-control"
                value={customBankName}
                onChange={(e) => setCustomBankName(e.target.value)}
                placeholder="VD: Shinhan Bank, HSBC, ..."
                required
              />
            </div>
          )}

          {/* Số dư ban đầu */}
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

          {/* Ngày bắt đầu */}
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

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{ flex: 1, padding: "11px 0", textAlign: "center" }}
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ flex: 2, padding: "11px 0", fontSize: 14 }}
            >
              {submitting ? "Đang tạo..." : "Xác Nhận Tạo Ví"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
