import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Tổng quan", icon: "📊" },
    { path: "/transactions/new", label: "Thêm GD", icon: "⚡" },
    { path: "/history", label: "Lịch sử", icon: "🕒" },
    { path: "/reports/statement", label: "Sao kê", icon: "📑" },
  ];

  return (
    <nav style={{
      background: "rgba(15, 18, 29, 0.85)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      <div className="navbar-container" style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap"
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#fff" }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)"
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>EXPENSE<span style={{ color: "#818cf8" }}>.AI</span></div>
          </div>
        </Link>

        {/* Menu Navigation (Scrollable on small screens) */}
        <div className="navbar-links" style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="btn"
                style={{
                  background: isActive ? "rgba(99, 102, 241, 0.18)" : "transparent",
                  color: isActive ? "#818cf8" : "#94a3b8",
                  border: isActive ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
                  padding: "7px 12px",
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: 30, height: 30, borderRadius: "50%", border: "2px solid rgba(99, 102, 241, 0.5)" }}
            />
          ) : (
            <div style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12
            }}>
              {user?.name?.charAt(0) || "U"}
            </div>
          )}
          <button onClick={logout} className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: 12 }}>
            Thoát
          </button>
        </div>
      </div>
    </nav>
  );
}
