import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { listWalletsApi, deleteWalletApi } from "../api/wallet";
import { listTransactionsApi } from "../api/transaction";
import { Wallet } from "../types/wallet";
import { Transaction } from "../types/transaction";
import { useNotification } from "../contexts/NotificationContext";
import { PlusCircle, Wallet as WalletIcon, FileSpreadsheet, CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle, Trash2 } from "lucide-react";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function HomePage() {
  const navigate = useNavigate();
  const { confirmModal, showSuccess, showError } = useNotification();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const res = await listWalletsApi();
      if (res.wallets.length === 0) {
        navigate("/wallets/new", { replace: true });
        return;
      }
      setWallets(res.wallets);
      setTotalBalance(res.totalBalance);
      const txRes = await listTransactionsApi({ limit: 8 });
      if (txRes) setTransactions(txRes.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate]);

  const handleDeleteWallet = async (w: Wallet) => {
    const isConfirmed = await confirmModal({
      title: "Xác nhận gỡ ví",
      message: `Bạn có chắc chắn muốn gỡ ví "${w.name}" không?\nLưu ý: Tất cả các giao dịch liên quan đến ví này sẽ được dọn sạch.`,
      confirmText: "Gỡ Ví",
      cancelText: "Hủy",
      isDanger: true,
    });
    if (!isConfirmed) return;

    setDeletingId(w._id);
    try {
      await deleteWalletApi(w._id);
      showSuccess(`Đã gỡ ví "${w.name}" thành công.`);
      await loadData();
    } catch (err) {
      showError("Gỡ ví thất bại, vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "20px auto", padding: "0 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
            Đang tải dữ liệu tài chính...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            {/* Top Row: Total Balance Card */}
            <div className="home-top-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
              
              <div className="bento-card" style={{
                background: "var(--hero-gradient)",
                border: "1px solid var(--border-subtle)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
                    Số Dư Khả Dụng
                  </span>
                  <span className="badge-income">
                    <CheckCircle size={13} />
                    <span>Đang hoạt động</span>
                  </span>
                </div>
                <div className="font-mono" style={{ fontSize: 34, fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                  {formatVnd(totalBalance)}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link to="/transactions/new" className="btn btn-primary" style={{ flex: 1 }}>
                    <PlusCircle size={16} />
                    <span>Ghi Thu / Chi</span>
                  </Link>
                  <Link to="/wallets/new" className="btn btn-secondary" style={{ flex: 1 }}>
                    <WalletIcon size={16} />
                    <span>Thêm Ví Mới</span>
                  </Link>
                </div>
              </div>

              <div className="bento-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>Số lượng Ví</div>
                  <div className="font-mono" style={{ fontSize: 28, fontWeight: 700, marginTop: 4, color: "var(--primary)" }}>
                    {wallets.length} <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>tài khoản</span>
                  </div>
                </div>
                <Link to="/reports/statement" className="btn btn-secondary" style={{ width: "100%" }}>
                  <FileSpreadsheet size={16} />
                  <span>Báo Cáo Sao Kê →</span>
                </Link>
              </div>

            </div>

            {/* Wallets Section */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Danh sách Ví & Tài khoản</h2>
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Tự động cân bằng số dư</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {wallets.map((w) => (
                  <div key={w._id} className="bento-card" style={{ padding: 16, position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ paddingRight: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{w.name}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 2 }}>
                          {w.bankName ? `Ngân hàng: ${w.bankName}` : "Ví tiền mặt"}
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CreditCard size={18} color="var(--primary)" />
                        {/* Nút Gỡ Ví */}
                        <button
                          onClick={() => handleDeleteWallet(w)}
                          disabled={deletingId === w._id}
                          className="btn btn-secondary"
                          title="Gỡ ví này"
                          style={{
                            padding: "4px 6px",
                            borderRadius: 6,
                            color: "var(--danger-text)",
                            border: "1px solid var(--border-subtle)",
                            background: "transparent",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={14} color="var(--danger)" />
                        </button>
                      </div>
                    </div>

                    {w.accountNumber && (
                      <div className="font-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 8 }}>
                        STK: {w.accountNumber}
                      </div>
                    )}

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Số dư hiện tại</span>
                      <span className="font-mono" style={{ fontWeight: 700, fontSize: 16, color: "var(--primary)" }}>
                        {formatVnd(w.currentBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bento-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Giao dịch gần đây</h2>
                <Link to="/history" style={{ fontSize: 12, color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}>
                  Xem tất cả →
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-dim)" }}>
                  Chưa có giao dịch nào được ghi chép.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {transactions.map((t) => {
                    const categoryName = typeof t.categoryId === "string" ? "Khác" : t.categoryId.name;
                    const isIncome = t.type === "income";

                    return (
                      <div
                        key={t._id}
                        className="transaction-item"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: "transparent",
                          border: isIncome ? "1px solid var(--success)" : "1px solid var(--danger)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isIncome ? "var(--success-bg)" : "var(--danger-bg)",
                            color: isIncome ? "var(--success-text)" : "var(--danger-text)",
                          }}>
                            {isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>{categoryName}</div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              {new Date(t.date).toLocaleDateString("vi-VN")}
                              {t.note ? ` · ${t.note}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="transaction-item-right" style={{ textAlign: "right" }}>
                          <div className="font-mono" style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: isIncome ? "var(--success-text)" : "var(--danger-text)"
                          }}>
                            {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                          </div>
                          <div className="font-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                            Số dư sau GD: {formatVnd(t.balanceAfter)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
