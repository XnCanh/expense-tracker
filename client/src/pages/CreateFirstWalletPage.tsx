import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWalletApi } from "../api/wallet";

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
    if (!name.trim()) {
      setError("Vui lòng nhập tên ví");
      return;
    }
    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setError("Số dư ban đầu không hợp lệ");
      return;
    }

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
      console.error(err);
      setError("Tạo ví thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24 }}>
      <h1>Tạo Ví đầu tiên</h1>
      <p>Bạn cần có ít nhất một ví để bắt đầu ghi chép thu/chi.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Tên ví *
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví Tiền mặt, Tài khoản Vietcombank..."
            required
          />
        </label>

        <label>
          Tên ngân hàng (tuỳ chọn)
          <input value={bankName} onChange={(e) => setBankName(e.target.value)} />
        </label>

        <label>
          Số tài khoản (tuỳ chọn)
          <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
        </label>

        <label>
          Số dư ban đầu *
          <input
            type="number"
            min={0}
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            required
          />
        </label>

        <label>
          Ngày bắt đầu tính toán *
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang tạo..." : "Tạo ví"}
        </button>
      </form>
    </div>
  );
}
