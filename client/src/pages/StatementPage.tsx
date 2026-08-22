import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { listWalletsApi } from "../api/wallet";
import { getWalletStatementApi, downloadStatementFile, WalletStatementResult } from "../api/report";
import { Wallet } from "../types/wallet";
import { FileSpreadsheet, FileText, ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

export default function StatementPage() {
  const { showSuccess, showError } = useNotification();
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
      showSuccess(`Đã tải xuống file ${format.toUpperCase()} thành công.`);
    } catch (err) {
      showError("Xuất file sao kê thất bại, vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "20px auto", padding: "0 16px" }}>
        
        {/* Filter Card */}
        <div className="bento-card" style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Trung Tâm Sao Kê Tài Khoản</h1>
          
          <div className="statement-filter-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Chọn ví</label>
              <select className="form-control" value={walletId} onChange={(e) => setWalletId(e.target.value)}>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Từ ngày</label>
              <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Đến ngày</label>
              <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <button onClick={handleFilter} disabled={!walletId || loading} className="btn btn-primary" style={{ padding: "10px 18px", width: "100%" }}>
              <Search size={16} />
              <span>{loading ? "Đang xử lý..." : "Xem Sao Kê"}</span>
            </button>
          </div>
        </div>

        {/* Statement Summary */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            <div className="statement-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div className="bento-card">
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Số dư đầu kỳ</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{formatVnd(result.openingBalance)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid var(--success)" }}>
                <div style={{ fontSize: 11, color: "var(--success-text)", textTransform: "uppercase" }}>Tổng Thu</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--success-text)" }}>+{formatVnd(result.totalIncome)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid var(--danger)" }}>
                <div style={{ fontSize: 11, color: "var(--danger-text)", textTransform: "uppercase" }}>Tổng Chi</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--danger-text)" }}>-{formatVnd(result.totalExpense)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid var(--primary)" }}>
                <div style={{ fontSize: 11, color: "var(--primary-text)", textTransform: "uppercase" }}>Số dư cuối kỳ</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--primary-text)" }}>{formatVnd(result.closingBalance)}</div>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="export-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                Chi tiết ({result.transactions.total} giao dịch)
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => handleExport("excel")} disabled={exporting !== null} className="btn btn-secondary">
                  <FileSpreadsheet size={16} />
                  <span>{exporting === "excel" ? "Đang xuất..." : "Xuất Excel"}</span>
                </button>
                <button onClick={() => handleExport("pdf")} disabled={exporting !== null} className="btn btn-secondary">
                  <FileText size={16} />
                  <span>{exporting === "pdf" ? "Đang xuất..." : "Xuất PDF"}</span>
                </button>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bento-card" style={{ padding: 8 }}>
              {result.transactions.items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text-dim)" }}>
                  Không có phát sinh giao dịch nào trong khoảng thời gian này.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {result.transactions.items.map((t) => {
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
                          padding: "10px 14px",
                          borderRadius: 10,
                          background: "transparent",
                          border: isIncome ? "1px solid var(--success)" : "1px solid var(--danger)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: isIncome ? "var(--success-bg)" : "var(--danger-bg)",
                            color: isIncome ? "var(--success-text)" : "var(--danger-text)",
                          }}>
                            {isIncome ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>
                              {categoryName}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                              {new Date(t.date).toLocaleDateString("vi-VN")}
                              {t.note ? ` · ${t.note}` : ""}
                            </div>
                          </div>
                        </div>

                        <div className="transaction-item-right" style={{ textAlign: "right" }}>
                          <div className="font-mono" style={{ fontWeight: 700, fontSize: 14, color: isIncome ? "var(--success-text)" : "var(--danger-text)" }}>
                            {isIncome ? "+" : "-"}{formatVnd(t.amount)}
                          </div>
                          <div className="font-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                            Sau GD: {formatVnd(t.balanceAfter)}
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
