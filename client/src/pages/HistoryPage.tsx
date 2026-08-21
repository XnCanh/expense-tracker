import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listTransactionsApi } from "../api/transaction";
import { Transaction } from "../types/transaction";

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

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px" }}>
        <div className="bento-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800 }}>Lịch Sử Toàn Bộ Giao Dịch</h1>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Sắp xếp theo thứ tự thời gian mới nhất</p>
            </div>
            <span className="badge-income">Đồng bộ tức thì</span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              Đang tải danh sách giao dịch...
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
              Chưa có giao dịch nào được ghi nhận trong hệ thống.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((t) => {
                const categoryName = typeof t.categoryId === "string" ? "Khác" : t.categoryId.name;
                const isIncome = t.type === "income";

                return (
                  <div
                    key={t._id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      borderRadius: 12,
                      background: "rgba(15, 18, 29, 0.5)",
                      border: "1px solid rgba(255, 255, 255, 0.04)"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        <span className={isIncome ? "badge-income" : "badge-expense"} style={{ marginRight: 10 }}>
                          {isIncome ? "THU" : "CHI"}
                        </span>
                        {categoryName}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        {new Date(t.date).toLocaleDateString("vi-VN")}
                        {t.note ? ` · ${t.note}` : ""}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div className="font-mono" style={{ fontWeight: 700, fontSize: 16, color: isIncome ? "#34d399" : "#fb7185" }}>
                        {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                      </div>
                      <div className="font-mono" style={{ fontSize: 12, color: "#64748b" }}>
                        Số dư sau GD: {formatVnd(t.balanceAfter)}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 16px", fontSize: 13 }}
                >
                  ← Trang trước
                </button>
                <span className="font-mono" style={{ fontSize: 13, color: "#94a3b8" }}>
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
