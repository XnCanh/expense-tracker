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

      <main style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
            Đang đồng bộ dữ liệu tài chính...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Top Bento Row */}
            <div className="home-top-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
              
              <div className="bento-card" style={{
                background: "linear-gradient(135deg, rgba(30, 27, 75, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                boxShadow: "0 0 35px -5px rgba(99, 102, 241, 0.2)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Tổng Số Dư Khả Dụng
                  </span>
                  <span className="badge-income">● Trực tuyến</span>
                </div>
                <div className="font-mono home-hero-balance" style={{ fontSize: 36, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em" }}>
                  {formatVnd(totalBalance)}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link to="/transactions/new" className="btn btn-primary" style={{ flex: 1 }}>
                    <span>⚡</span> + Thu / Chi
                  </Link>
                  <Link to="/wallets/new" className="btn btn-secondary" style={{ flex: 1 }}>
                    <span>💳</span> + Thêm Ví
                  </Link>
                </div>
              </div>

              <div className="bento-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" }}>Tài khoản đang quản lý</div>
                  <div className="font-mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 6, color: "#818cf8" }}>
                    {wallets.length} <span style={{ fontSize: 14, color: "#94a3b8", fontWeight: 400 }}>ví</span>
                  </div>
                </div>
                <Link to="/reports/statement" className="btn btn-secondary" style={{ width: "100%" }}>
                  <span>📑</span> Xem Sao Kê →
                </Link>
              </div>

            </div>

            {/* Middle Section: Danh sách Thẻ Ví */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Danh sách Ví & Tài khoản</h2>
                <span style={{ fontSize: 12, color: "#64748b" }}>Chuẩn ACID Safe</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {wallets.map((w) => (
                  <div key={w._id} className="bento-card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{w.name}</div>
                        <div style={{ fontSize: 12, color: "#818cf8", marginTop: 2 }}>
                          {w.bankName ? `Ngân hàng: ${w.bankName}` : "Ví tiền mặt"}
                        </div>
                      </div>
                      <span style={{ fontSize: 18 }}>💳</span>
                    </div>

                    {w.accountNumber && (
                      <div className="font-mono" style={{ fontSize: 11, color: "#64748b", marginTop: 10 }}>
                        STK: {w.accountNumber}
                      </div>
                    )}

                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>Số dư hiện tại</span>
                      <span className="font-mono" style={{ fontWeight: 700, fontSize: 17, color: "#38bdf8" }}>
                        {formatVnd(w.currentBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Section: Giao dịch gần đây */}
            <div className="bento-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Giao dịch gần đây</h2>
                <Link to="/history" style={{ fontSize: 12, color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
                  Xem tất cả →
                </Link>
              </div>

              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0", color: "#64748b" }}>
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
                          borderRadius: 12,
                          background: "rgba(15, 18, 29, 0.6)",
                          border: "1px solid rgba(255, 255, 255, 0.04)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isIncome ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                            color: isIncome ? "#34d399" : "#fb7185",
                            fontSize: 14,
                            fontWeight: 700
                          }}>
                            {isIncome ? "↓" : "↑"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{categoryName}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {new Date(t.date).toLocaleDateString("vi-VN")}
                              {t.note ? ` · ${t.note}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="transaction-item-right" style={{ textAlign: "right" }}>
                          <div className="font-mono" style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: isIncome ? "#34d399" : "#fb7185"
                          }}>
                            {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                          </div>
                          <div className="font-mono" style={{ fontSize: 11, color: "#64748b" }}>
                            Số dư: {formatVnd(t.balanceAfter)}
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
