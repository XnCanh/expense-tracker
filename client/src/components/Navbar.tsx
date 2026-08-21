import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { BookOpen, Home, PlusCircle, History, FileSpreadsheet, Sun, Moon, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Trang chủ", icon: <Home size={16} /> },
    { path: "/transactions/new", label: "Ghi chép", icon: <PlusCircle size={16} /> },
    { path: "/history", label: "Lịch sử", icon: <History size={16} /> },
    { path: "/reports/statement", label: "Sao kê", icon: <FileSpreadsheet size={16} /> },
  ];

  return (
    <nav style={{
      background: "var(--nav-bg)",
      borderBottom: "1px solid var(--border-subtle)",
      position: "sticky",
      top: 0,
      zIndex: 50,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
    }}>
      <div className="navbar-container" style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "10px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap"
      }}>
        {/* Facebook Style Logo with Lucide BookOpen */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--text-main)" }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff"
          }}>
            <BookOpen size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: "var(--primary)" }}>ExpenseBook</div>
          </div>
        </Link>

        {/* Center Navigation Tabs */}
        <div className="navbar-links" style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="btn"
                style={{
                  background: isActive ? "var(--primary-bg)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                  borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
                  borderRadius: isActive ? "8px 8px 0 0" : "8px",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Tools: Theme Switch + User + Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: 13, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
            title={theme === "dark" ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span style={{ fontSize: 12 }}>{theme === "dark" ? "Sáng" : "Tối"}</span>
          </button>

          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid var(--primary)" }}
            />
          ) : (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--primary-bg)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 12
            }}>
              {user?.name?.charAt(0) || "U"}
            </div>
          )}
          <button onClick={logout} className="btn btn-secondary" style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
            <LogOut size={14} />
            <span>Thoát</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
