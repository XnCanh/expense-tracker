import React, { useState, useEffect } from "react";
import { Transaction } from "../types/transaction";
import { Wallet } from "../types/wallet";
import { Category, CategoryType } from "../types/category";
import { listWalletsApi } from "../api/wallet";
import { listCategoriesApi } from "../api/category";
import { updateTransactionApi } from "../api/transaction";
import { useNotification } from "../contexts/NotificationContext";
import { X, ArrowDownLeft, ArrowUpRight, Save, Check } from "lucide-react";

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTransactionModal({
  isOpen,
  transaction,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const { showSuccess, showError } = useNotification();

  const [type, setType] = useState<CategoryType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Nạp danh sách ví và danh mục
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([listWalletsApi(), listCategoriesApi()])
      .then(([walletsRes, categoriesRes]) => {
        setWallets(walletsRes.wallets);
        setCategories(categoriesRes);
      })
      .catch((err) => {
        showError("Không thể tải danh mục hoặc danh sách ví");
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  // Khởi tạo form theo dữ liệu giao dịch được chọn
  useEffect(() => {
    if (!transaction) return;

    setType(transaction.type);
    setAmount(String(transaction.amount));

    const wId = typeof transaction.walletId === "object" && transaction.walletId !== null
      ? transaction.walletId._id
      : transaction.walletId;
    setWalletId(wId || "");

    const cId = typeof transaction.categoryId === "object" && transaction.categoryId !== null
      ? transaction.categoryId._id
      : transaction.categoryId;
    setCategoryId(cId || "");

    const dateStr = transaction.date ? new Date(transaction.date).toISOString().slice(0, 10) : "";
    setDate(dateStr);

    setNote(transaction.note || "");
  }, [transaction]);

  // Lọc danh mục theo loại Thu/Chi được chọn
  const filteredCategories = categories.filter((c) => c.type === type);

  // Tự động đổi danh mục mặc định khi đổi loại Thu/Chi
  const handleTypeChange = (newType: CategoryType) => {
    setType(newType);
    const validCats = categories.filter((c) => c.type === newType);
    if (validCats.length > 0) {
      setCategoryId(validCats[0]._id);
    } else {
      setCategoryId("");
    }
  };

  if (!isOpen || !transaction) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      showError("Số tiền phải lớn hơn 0");
      return;
    }
    if (!walletId) {
      showError("Vui lòng chọn ví tài khoản");
      return;
    }
    if (!categoryId) {
      showError("Vui lòng chọn danh mục");
      return;
    }
    if (!date) {
      showError("Vui lòng chọn ngày giao dịch");
      return;
    }

    setSubmitting(true);
    try {
      if (!transaction) return;
      await updateTransactionApi(transaction._id, {
        walletId,
        type,
        amount: numAmount,
        categoryId,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
      });

      showSuccess("Đã cập nhật giao dịch thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || "Cập nhật giao dịch thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="bento-card"
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--bg-surface)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
          position: "relative",
          animation: "modalScaleIn 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
            Chỉnh sửa Giao dịch
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              borderRadius: "50%",
              display: "flex",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-muted)" }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Toggle Type: Thu / Chi */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Loại giao dịch *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className="btn"
                  style={{
                    backgroundColor: type === "expense" ? "var(--danger)" : "var(--bg-input)",
                    color: type === "expense" ? "#fff" : "var(--text-main)",
                    border: `1px solid ${type === "expense" ? "var(--danger)" : "var(--border-subtle)"}`,
                    padding: "10px",
                  }}
                >
                  <ArrowUpRight size={16} />
                  <span>Khoản Chi (-)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className="btn"
                  style={{
                    backgroundColor: type === "income" ? "var(--success)" : "var(--bg-input)",
                    color: type === "income" ? "#fff" : "var(--text-main)",
                    border: `1px solid ${type === "income" ? "var(--success)" : "var(--border-subtle)"}`,
                    padding: "10px",
                  }}
                >
                  <ArrowDownLeft size={16} />
                  <span>Khoản Thu (+)</span>
                </button>
              </div>
            </div>

            {/* Số tiền */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Số tiền (VNĐ) *
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                className="form-control font-mono"
                style={{ fontSize: 16, fontWeight: 700 }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 50000"
              />
            </div>

            {/* Danh mục & Ví (2 cột) */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Danh mục *
                </label>
                <select
                  className="form-control"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  {filteredCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Ví tài khoản *
                </label>
                <select
                  className="form-control"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  required
                >
                  {wallets.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} {w.bankName ? `(${w.bankName})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ngày giao dịch */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Ngày giao dịch *
              </label>
              <input
                type="date"
                required
                className="form-control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                Ghi chú (Tùy chọn)
              </label>
              <input
                type="text"
                className="form-control"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Mua trà sữa, Tiền thưởng..."
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn btn-secondary"
                style={{ padding: "9px 18px" }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: "9px 20px" }}
              >
                <Save size={16} />
                <span>{submitting ? "Đang lưu..." : "Lưu thay đổi"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
