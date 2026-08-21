import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Tổng quan", icon: "📊" },
    { path: "/transactions/new", label: "Thêm giao dịch", icon: "⚡" },
    { path: "/history", label: "Lịch sử", icon: "🕒" },
    { path: "/reports/statement", label: "Sao kê", icon: "📑" },
  ];

  return (
    <nav style={{
      background: "rgba(15, 18, 29, 0.8)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      padding: "12px 24px"
    }}>
      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>EXPENSE<span style={{ color: "#818cf8" }}>.AI</span></div>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Agency Tracker</div>
          </div>
        </Link>

        {/* Menu Navigation */}
        <div style={{ display: "flex", gap: 8 }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="btn"
                style={{
                  background: isActive ? "rgba(99, 102, 241, 0.15)" : "transparent",
                  color: isActive ? "#818cf8" : "#94a3b8",
                  border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                  padding: "8px 14px",
                  fontSize: 13,
                }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid rgba(99, 102, 241, 0.5)" }}
            />
          ) : (
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13
            }}>
              {user?.name?.charAt(0) || "U"}
            </div>
          )}
          <button onClick={logout} className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }}>
            Đăng xuất
          </button>
        </div>
      </div>
    </nav>
  );
}
