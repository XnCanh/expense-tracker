import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listWalletsApi } from "../api/wallet";
import { getWalletStatementApi, downloadStatementFile, WalletStatementResult } from "../api/report";
import { Wallet } from "../types/wallet";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function StatementPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletId, setWalletId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<WalletStatementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    listWalletsApi().then((res) => {
      setWallets(res.wallets);
      if (res.wallets.length > 0) setWalletId(res.wallets[0]._id);
    });
  }, []);

  async function handleFilter() {
    if (!walletId) return;
    setLoading(true);
    try {
      const res = await getWalletStatementApi({
        walletId,
        from: from || undefined,
        to: to || undefined,
        limit: 100,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(format: "excel" | "pdf") {
    if (!walletId) return;
    setExporting(format);
    try {
      await downloadStatementFile(format, { walletId, from: from || undefined, to: to || undefined });
    } catch (err) {
      alert("Xuất file thất bại.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px" }}>
        
        {/* Filter Card */}
        <div className="bento-card" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Trung Tâm Sao Kê Tài Khoản</h1>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 14, alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>Chọn ví</label>
              <select className="form-control" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>Từ ngày</label>
              <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: 6 }}>Đến ngày</label>
              <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button onClick={handleFilter} disabled={!walletId || loading} className="btn btn-primary" style={{ padding: "12px 20px" }}>
              {loading ? "Đang tính toán..." : "⚡ Xem Sao Kê"}
            </button>
          </div>
        </div>

        {/* Statement Summary 4-Column Bento */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <div className="bento-card">
                <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase" }}>Số dư đầu kỳ</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{formatVnd(result.openingBalance)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid #10b981" }}>
                <div style={{ fontSize: 12, color: "#34d399", textTransform: "uppercase" }}>Tổng Thu</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#34d399" }}>+{formatVnd(result.totalIncome)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid #f43f5e" }}>
                <div style={{ fontSize: 12, color: "#fb7185", textTransform: "uppercase" }}>Tổng Chi</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#fb7185" }}>-{formatVnd(result.totalExpense)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid #38bdf8" }}>
                <div style={{ fontSize: 12, color: "#38bdf8", textTransform: "uppercase" }}>Số dư cuối kỳ</div>
                <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 6, color: "#38bdf8" }}>{formatVnd(result.closingBalance)}</div>
              </div>
            </div>

            {/* Export Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                Chi tiết giao dịch trong kỳ ({result.transactions.total})
              </h2>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => handleExport("excel")} disabled={exporting !== null} className="btn btn-secondary">
                  <span>📊</span> {exporting === "excel" ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
                </button>
                <button onClick={() => handleExport("pdf")} disabled={exporting !== null} className="btn btn-secondary">
                  <span>📄</span> {exporting === "pdf" ? "Đang xuất..." : "Xuất PDF (.pdf)"}
                </button>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bento-card" style={{ padding: 12 }}>
              {result.transactions.items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#64748b" }}>
                  Không có phát sinh giao dịch nào trong khoảng thời gian đã chọn.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.transactions.items.map((t) => {
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
                          background: "rgba(15, 18, 29, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.03)"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>
                            <span className={isIncome ? "badge-income" : "badge-expense"} style={{ marginRight: 8 }}>
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
                          <div className="font-mono" style={{ fontWeight: 700, fontSize: 15, color: isIncome ? "#34d399" : "#fb7185" }}>
                            {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                          </div>
                          <div className="font-mono" style={{ fontSize: 11, color: "#64748b" }}>
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
