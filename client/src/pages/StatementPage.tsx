import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWalletsApi } from "../api/wallet";
import { getWalletStatementApi, downloadStatementFile, WalletStatementResult } from "../api/report";
import { Wallet } from "../types/wallet";

function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " đ";
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
      console.error(err);
      alert("Xuất file thất bại, vui lòng thử lại.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Sao kê</h1>
        <Link to="/history">← Lịch sử giao dịch</Link>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        <label>
          Ví
          <select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            {wallets.map((w) => (
              <option key={w._id} value={w._id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Từ ngày
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Đến ngày
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button onClick={handleFilter} disabled={!walletId || loading}>
          {loading ? "Đang lọc..." : "Xem sao kê"}
        </button>
      </div>

      {result && (
        <>
          <div style={{ background: "#f4f4f5", padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ marginTop: 0 }}>{result.wallet.name}</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleExport("excel")} disabled={exporting !== null}>
                  {exporting === "excel" ? "Đang xuất..." : "Xuất Excel"}
                </button>
                <button onClick={() => handleExport("pdf")} disabled={exporting !== null}>
                  {exporting === "pdf" ? "Đang xuất..." : "Xuất PDF"}
                </button>
              </div>
            </div>
            <div>Số dư đầu kỳ: <strong>{formatVnd(result.openingBalance)}</strong></div>
            <div style={{ color: "#16a34a" }}>Tổng thu: +{formatVnd(result.totalIncome)}</div>
            <div style={{ color: "#dc2626" }}>Tổng chi: -{formatVnd(result.totalExpense)}</div>
            <div>Số dư cuối kỳ: <strong>{formatVnd(result.closingBalance)}</strong></div>
          </div>

          <h3>Chi tiết giao dịch trong kỳ ({result.transactions.total})</h3>
          {result.transactions.items.length === 0 ? (
            <p style={{ color: "#777" }}>Không có giao dịch nào trong khoảng thời gian này.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {result.transactions.items.map((t) => {
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
                      <div>{t.type === "income" ? "Thu" : "Chi"} · {categoryName}</div>
                      <div style={{ fontSize: 12, color: "#999" }}>
                        {new Date(t.date).toLocaleDateString("vi-VN")} · Số dư sau: {formatVnd(t.balanceAfter)}
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
