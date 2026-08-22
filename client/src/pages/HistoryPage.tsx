import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listTransactionsApi } from "../api/transaction";
import { Transaction } from "../types/transaction";
import { ArrowDownLeft, ArrowUpRight, CheckCircle } from "lucide-react";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function HistoryPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listTransactionsApi({ page, limit: 15 })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
        <div className="bento-card">
          <div className="card-header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800 }}>Lịch Sử Toàn Bộ Giao Dịch</h1>
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sắp xếp theo thực tế thời gian mới nhất</p>
            </div>
            <span className="badge-income">
              <CheckCircle size={13} />
              <span>Đồng bộ thực</span>
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Đang tải danh sách giao dịch...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-dim)" }}>
              Chưa có giao dịch nào được ghi nhận trong hệ thống.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((t) => {
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
                      padding: "12px 16px",
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
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: isIncome ? "var(--success-text)" : "var(--danger-text)",
                            background: isIncome ? "var(--success-bg)" : "var(--danger-bg)",
                            padding: "1px 6px",
                            borderRadius: 4
                          }}>
                            {isIncome ? "Thu" : "Chi"}
                          </span>
                          <span>{categoryName}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
                          {new Date(t.date).toLocaleDateString("vi-VN")}
                          {t.note ? ` · ${t.note}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="transaction-item-right" style={{ textAlign: "right" }}>
                      <div className="font-mono" style={{ fontWeight: 800, fontSize: 15, color: isIncome ? "var(--success-text)" : "var(--danger-text)" }}>
                        {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                      </div>
                      <div className="font-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                        Số dư sau GD: {formatVnd(t.balanceAfter)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pagination-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 20 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  ← Trang trước
                </button>
                <span className="font-mono pagination-text" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Trang {page} / {totalPages || 1}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
