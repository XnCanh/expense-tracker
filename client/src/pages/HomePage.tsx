import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { listWalletsApi } from "../api/wallet";
import { listTransactionsApi } from "../api/transaction";
import { Wallet } from "../types/wallet";
import { Transaction } from "../types/transaction";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
}

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWalletsApi()
      .then((res) => {
        if (res.wallets.length === 0) {
          // Không còn ví nào (ví dụ vừa xóa hết) -> quay lại bước tạo ví
          navigate("/wallets/new", { replace: true });
          return;
        }
        setWallets(res.wallets);
        setTotalBalance(res.totalBalance);
        return listTransactionsApi({ limit: 10 });
      })
      .then((res) => {
        if (res) setTransactions(res.items);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Xin chào, {user?.name}</h1>
        <button onClick={logout}>Đăng xuất</button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <div style={{ background: "#f4f4f5", padding: 16, borderRadius: 8, margin: "16px 0" }}>
            <div style={{ fontSize: 14, color: "#555" }}>Tổng số dư (tất cả các ví)</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{formatVnd(totalBalance)}</div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <Link to="/transactions/new">+ Thêm giao dịch</Link>
            <Link to="/wallets/new">+ Thêm ví</Link>
            <Link to="/history">Lịch sử</Link>
            <Link to="/reports/statement">Sao kê</Link>
          </div>

          <h2>Ví của bạn</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {wallets.map((w) => (
              <li
                key={w._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  border: "1px solid #e5e5e5",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{w.name}</div>
                  {w.bankName && <div style={{ fontSize: 13, color: "#777" }}>{w.bankName}</div>}
                </div>
                <div style={{ fontWeight: 600 }}>{formatVnd(w.currentBalance)}</div>
              </li>
            ))}
          </ul>

          <h2>Giao dịch gần đây</h2>
          {transactions.length === 0 ? (
            <p style={{ color: "#777" }}>Chưa có giao dịch nào.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {transactions.map((t) => {
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
                      <div>{categoryName}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {new Date(t.date).toLocaleDateString("vi-VN")}
                        {t.note ? ` · ${t.note}` : ""}
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
          )}
        </>
      )}
    </div>
  );
}
