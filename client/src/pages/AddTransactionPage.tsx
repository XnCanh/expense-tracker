import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listWalletsApi } from "../api/wallet";
import { listCategoriesApi } from "../api/category";
import { createTransactionApi } from "../api/transaction";
import { Wallet } from "../types/wallet";
import { Category, CategoryType } from "../types/category";

const todayStr = () => new Date().toISOString().slice(0, 10);

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

  // Nạp danh sách ví 1 lần
  useEffect(() => {
    listWalletsApi().then((res) => {
      setWallets(res.wallets);
      if (res.wallets.length > 0) setWalletId(res.wallets[0]._id);
    });
  }, []);

  // Nạp lại danh mục mỗi khi đổi loại Thu/Chi
  useEffect(() => {
    setCategoryId("");
    listCategoriesApi(type).then((cats) => {
      setCategories(cats);
      if (cats.length > 0) setCategoryId(cats[0]._id);
    });
  }, [type]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!walletId) return setError("Vui lòng chọn ví");
    if (!categoryId) return setError("Vui lòng chọn danh mục");
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return setError("Số tiền không hợp lệ");

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
      // Lỗi phổ biến nhất: "Số dư trong ví không đủ" từ server
      setError(err?.response?.data?.message ?? "Thêm giao dịch thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24 }}>
      <h1>Thêm giao dịch</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setType("expense")}
          style={{ fontWeight: type === "expense" ? 700 : 400 }}
        >
          Chi
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          style={{ fontWeight: type === "income" ? 700 : 400 }}
        >
          Thu
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>
          Số tiền *
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label>
          Ví *
          <select value={walletId} onChange={(e) => setWalletId(e.target.value)} required>
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Danh mục *
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ngày *
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>

        <label>
          Ghi chú
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuỳ chọn" />
        </label>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Lưu giao dịch"}
        </button>
      </form>
    </div>
  );
}
