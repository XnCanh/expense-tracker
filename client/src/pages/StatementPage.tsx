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

// Lấy ngày đầu tháng hiện tại (YYYY-MM-DD)
const getFirstDayOfMonth = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
};

// Lấy ngày hôm nay (YYYY-MM-DD)
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function StatementPage() {
  const { showSuccess, showError } = useNotification();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletId, setWalletId] = useState("");
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(getTodayStr());
  const [result, setResult] = useState<WalletStatementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null);

  useEffect(() => {
    listWalletsApi().then((res) => {
      setWallets(res.wallets);
      if (res.wallets.length > 0) {
        const firstWalletId = res.wallets[0]._id;
        setWalletId(firstWalletId);
        // Tự động tải sao kê tháng hiện tại của ví đầu tiên
        fetchStatement(firstWalletId, getFirstDayOfMonth(), getTodayStr());
      }
    });
  }, []);

  const fetchStatement = async (wId: string, fromDate: string, toDate: string) => {
    if (!wId) return;
    setLoading(true);
    try {
      const res = await getWalletStatementApi({
        walletId: wId,
        from: fromDate,
        to: toDate,
        limit: 100,
      });
      setResult(res);
    } catch (err: any) {
      showError(err?.response?.data?.message || "Lỗi khi lấy dữ liệu sao kê.");
    } finally {
      setLoading(false);
    }
  };

  async function handleFilter() {
    if (!walletId) {
      showError("Vui lòng chọn ví cần sao kê.");
      return;
    }
    if (!from || !to) {
      showError("Vui lòng chọn đầy đủ 'Từ ngày' và 'Đến ngày'.");
      return;
    }
    if (new Date(from) > new Date(to)) {
      showError("'Từ ngày' không được lớn hơn 'Đến ngày'.");
      return;
    }

    await fetchStatement(walletId, from, to);
  }

  async function handleExport(format: "excel" | "pdf") {
    if (!walletId) {
      showError("Vui lòng chọn ví cần xuất sao kê.");
      return;
    }
    if (!from || !to) {
      showError("Vui lòng chọn khoảng thời gian cần xuất.");
      return;
    }
    if (new Date(from) > new Date(to)) {
      showError("'Từ ngày' không được lớn hơn 'Đến ngày'.");
      return;
    }

    setExporting(format);
    try {
      await downloadStatementFile(format, { walletId, from, to });
      showSuccess(`Đã tải xuống file ${format.toUpperCase()} thành công.`);
    } catch (err: any) {
      showError(err?.message || "Xuất file sao kê thất bại, vui lòng thử lại.");
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
          
          <div className="statement-filter-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr auto", gap: 10, alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Chọn ví tài khoản *
              </label>
              <select className="form-control" value={walletId} onChange={(e) => setWalletId(e.target.value)} required>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} {w.bankName ? `(${w.bankName})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Từ ngày *
              </label>
              <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                Đến ngày *
              </label>
              <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} required />
            </div>
            <button onClick={handleFilter} disabled={!walletId || loading} className="btn btn-primary" style={{ padding: "10px 18px", width: "100%" }}>
              <Search size={16} />
              <span>{loading ? "Đang tải..." : "Xem Sao Kê"}</span>
            </button>
          </div>
        </div>

        {/* Statement Summary */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            
            <div className="statement-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <div className="bento-card">
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Số Dư Đầu Kỳ</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{formatVnd(result.openingBalance)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid var(--success)" }}>
                <div style={{ fontSize: 11, color: "var(--success-text)" }}>Tổng Thu</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--success-text)" }}>+{formatVnd(result.totalIncome)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid var(--danger)" }}>
                <div style={{ fontSize: 11, color: "var(--danger-text)" }}>Tổng Chi</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--danger-text)" }}>-{formatVnd(result.totalExpense)}</div>
              </div>
              <div className="bento-card" style={{ borderLeft: "3px solid var(--primary)" }}>
                <div style={{ fontSize: 11, color: "var(--primary-text)" }}>Số Dư Cuối Kỳ</div>
                <div className="font-mono" style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: "var(--primary-text)" }}>{formatVnd(result.closingBalance)}</div>
              </div>
            </div>

            {/* Export Toolbar */}
            <div className="export-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                Chi tiết ({result.transactions.total} giao dịch - Mới nhất đến cũ nhất)
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
