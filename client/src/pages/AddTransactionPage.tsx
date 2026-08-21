import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { listWalletsApi } from "../api/wallet";
import { listCategoriesApi } from "../api/category";
import { createTransactionApi } from "../api/transaction";
import { Wallet } from "../types/wallet";
import { Category, CategoryType } from "../types/category";

const todayStr = () => new Date().toISOString().slice(0, 10);
function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function AddTransactionPage() {
  const navigate = useNavigate();

  const [type, setType] = useState<CategoryType>("expense");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listWalletsApi().then((res) => {
      setWallets(res.wallets);
      if (res.wallets.length > 0) setWalletId(res.wallets[0]._id);
    });
  }, []);

  useEffect(() => {
    setCategoryId("");
    listCategoriesApi(type).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0]._id);
    });
  }, [type]);

  const selectedWallet = wallets.find((w) => w._id === walletId);
  const parsedAmount = Number(amount) || 0;
  const isOverdraft = type === "expense" && selectedWallet && parsedAmount > selectedWallet.currentBalance;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!walletId) return setError("Vui lòng chọn ví thực hiện");
    if (!categoryId) return setError("Vui lòng chọn danh mục");
    if (parsedAmount <= 0) return setError("Số tiền phải lớn hơn 0");
    if (isOverdraft) return setError("Số dư trong ví không đủ để chi tiêu!");

    setSubmitting(true);
    try {
      await createTransactionApi({
        walletId,
        type,
        amount: parsedAmount,
        categoryId,
        date,
        note: note.trim() || undefined,
      });
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Ghi chép giao dịch thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <Navbar />

      <main style={{ maxWidth: 520, margin: "28px auto", padding: "0 16px" }}>
        <div className="bento-card">
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Ghi Chép Giao Dịch</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>Tự động kiểm tra số dư và bảo vệ chống chi âm ACID.</p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 6,
            padding: 4,
            background: "rgba(15, 18, 29, 0.8)",
            borderRadius: 12,
            marginBottom: 20,
            border: "1px solid rgba(255, 255, 255, 0.06)"
          }}>
            <button
              type="button"
              onClick={() => setType("expense")}
              style={{
                padding: "9px 0",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: type === "expense" ? "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)" : "transparent",
                color: type === "expense" ? "#fff" : "#94a3b8",
                boxShadow: type === "expense" ? "0 4px 15px rgba(244, 63, 94, 0.3)" : "none"
              }}
            >
              💸 Khoản Chi
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              style={{
                padding: "9px 0",
                borderRadius: 8,
                border: "none",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: type === "income" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "transparent",
                color: type === "income" ? "#fff" : "#94a3b8",
                boxShadow: type === "income" ? "0 4px 15px rgba(16, 185, 129, 0.3)" : "none"
              }}
            >
              💰 Khoản Thu
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                Số tiền (VNĐ) *
              </label>
              <input
                type="number"
                min={0}
                className="form-control font-mono"
                style={{ fontSize: 18, fontWeight: 700 }}
                placeholder="VD: 50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Ví thanh toán *</label>
                {selectedWallet && (
                  <span className="font-mono" style={{ fontSize: 11, color: isOverdraft ? "#f43f5e" : "#38bdf8" }}>
                    Khả dụng: {formatVnd(selectedWallet.currentBalance)}
                  </span>
                )}
              </div>
              <select className="form-control" value={walletId} onChange={(e) => setWalletId(e.target.value)} required>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({formatVnd(w.currentBalance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                Danh mục *
              </label>
              <select className="form-control" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                  Ngày thực hiện *
                </label>
                <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 4 }}>
                  Ghi chú
                </label>
                <input className="form-control" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tùy chọn..." />
              </div>
            </div>

            {error && (
              <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", fontSize: 12 }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !!isOverdraft}
              className={`btn ${type === "expense" ? "btn-danger" : "btn-success"}`}
              style={{ width: "100%", padding: "12px 0", fontSize: 14, marginTop: 4 }}
            >
              {submitting ? "Đang xử lý..." : isOverdraft ? "Số dư không đủ" : "Lưu Giao Dịch"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
