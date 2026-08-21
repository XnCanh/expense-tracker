import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTransactionsApi } from "../api/transaction";
import { Transaction } from "../types/transaction";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

export default function HistoryPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listTransactionsApi({ page, limit: 20 })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Lịch sử giao dịch</h1>
        <Link to="/">← Trang chủ</Link>
      </div>
      <Link to="/reports/statement">Xem sao kê theo ví →</Link>

      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "#777" }}>Chưa có giao dịch nào.</p>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
            {items.map((t) => {
              const categoryName = typeof t.categoryId === "string" ? "" : t.categoryId.name;
              return (
                <li
                  key={t._id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.type === "income" ? "Thu" : "Chi"} · {categoryName}</div>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {new Date(t.date).toLocaleDateString("vi-VN")}
                      {t.note ? ` · ${t.note}` : ""} · Số dư sau: {formatVnd(t.balanceAfter)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: t.type === "income" ? "#16a34a" : "#dc2626" }}>
                    {t.type === "income" ? "+" : "-"}
                    {formatVnd(t.amount)}
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Trước
            </button>
            <span>
              Trang {page} / {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
