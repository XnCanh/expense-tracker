import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { listWalletsApi } from "../api/wallet";
import { listTransactionsApi } from "../api/transaction";
import { Wallet } from "../types/wallet";
import { Transaction } from "../types/transaction";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function HomePage() {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWalletsApi()
      .then((res) => {
        if (res.wallets.length === 0) {
          navigate("/wallets/new", { replace: true });
          return;
        }
        setWallets(res.wallets);
        setTotalBalance(res.totalBalance);
        return listTransactionsApi({ limit: 8 });
      })
      .then((res) => {
        if (res) setTransactions(res.items);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
            Đang tải dữ liệu trung tâm điều khiển...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Top Bento Row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
              
              <div className="bento-card" style={{
                background: "linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                boxShadow: "0 0 35px -5px rgba(99, 102, 241, 0.2)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Tổng Số Dư Khả Dụng (Tất cả Ví)
                  </span>
                  <span className="badge-income">● Trực tuyến</span>
                </div>
                <div className="font-mono" style={{ fontSize: 38, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>
                  {formatVnd(totalBalance)}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                  <Link to="/transactions/new" className="btn btn-primary">
                    <span>⚡</span> + Ghi chép Thu / Chi
                  </Link>
                  <Link to="/wallets/new" className="btn btn-secondary">
                    <span>💳</span> + Thêm Ví mới
                  </Link>
                </div>
              </div>

              <div className="bento-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Thống kê ví</div>
                  <div className="font-mono" style={{ fontSize: 32, fontWeight: 700, marginTop: 8, color: "#818cf8" }}>
                    {wallets.length} <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 400 }}>tài khoản</span>
                  </div>
                </div>
                <Link to="/reports/statement" className="btn btn-secondary" style={{ width: "100%" }}>
                  <span>📑</span> Xem Sao Kê Toàn Bộ →
                </Link>
              </div>

            </div>

            {/* Middle Section: Danh sách Thẻ Ví */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Danh sách Ví & Tài khoản</h2>
                <span style={{ fontSize: 13, color: "#64748b" }}>Tự động đồng bộ số dư ACID</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {wallets.map((w) => (
                  <div key={w._id} className="bento-card" style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{w.name}</div>
                        <div style={{ fontSize: 12, color: "#818cf8", marginTop: 2 }}>
                          {w.bankName ? `Ngân hàng: ${w.bankName}` : "Ví tiền mặt"}
                        </div>
                      </div>
                      <span style={{ fontSize: 20 }}>💳</span>
                    </div>

                    {w.accountNumber && (
                      <div className="font-mono" style={{ fontSize: 12, color: "#64748b", marginTop: 12 }}>
                        STK: {w.accountNumber}
                      </div>
                    )}

                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Số dư hiện tại</span>
                      <span className="font-mono" style={{ fontWeight: 700, fontSize: 18, color: "#38bdf8" }}>
                        {formatVnd(w.currentBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Giao dịch gần đây */}
            <div className="bento-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>Hoạt động giao dịch gần đây</h2>
                <Link to="/history" style={{ fontSize: 13, color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
                  Xem tất cả ({transactions.length}) →
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#64748b" }}>
                  Chưa có giao dịch nào được ghi chép.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {transactions.map((t) => {
                    const categoryName = typeof t.categoryId === "string" ? "Khác" : t.categoryId.name;
                    const isIncome = t.type === "income";

                    return (
                      <div
                        key={t._id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px 16px",
                          borderRadius: 12,
                          background: "rgba(15, 18, 29, 0.6)",
                          border: "1px solid rgba(255, 255, 255, 0.04)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isIncome ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                            color: isIncome ? "#34d399" : "#fb7185",
                            fontSize: 16
                          }}>
                            {isIncome ? "↓" : "↑"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{categoryName}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              {new Date(t.date).toLocaleDateString("vi-VN")}
                              {t.note ? ` · ${t.note}` : ""}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div className="font-mono" style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: isIncome ? "#34d399" : "#fb7185"
                          }}>
                            {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                          </div>
                          <div className="font-mono" style={{ fontSize: 11, color: "#64748b" }}>
                            Số dư sau: {formatVnd(t.balanceAfter)}
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
