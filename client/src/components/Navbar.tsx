import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { BookOpen, Home, PlusCircle, History, FileSpreadsheet, Sun, Moon, LogOut } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navLinks = [
    { path: "/", label: "Trang chủ", icon: (active: boolean) => <Home size={active ? 20 : 18} /> },
    { path: "/transactions/new", label: "Ghi chép", icon: (active: boolean) => <PlusCircle size={active ? 20 : 18} /> },
    { path: "/history", label: "Lịch sử", icon: (active: boolean) => <History size={active ? 20 : 18} /> },
    { path: "/reports/statement", label: "Sao kê", icon: (active: boolean) => <FileSpreadsheet size={active ? 20 : 18} /> },
  ];

  return (
    <>
      {/* THANH TIÊU ĐỀ TRÊN CÙNG (Máy tính & Điện thoại) */}
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
          gap: 12
        }}>
          {/* Logo thương hiệu */}
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
              <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: "var(--primary)" }}>Expense Tracker</div>
            </div>
          </Link>

          {/* Thanh điều hướng trung tâm (Chỉ hiển thị trên Máy tính) */}
          <div className="desktop-nav-links" style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className="btn"
                  style={{
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
                  {link.icon(isActive)}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Công cụ bên phải: Nút đổi giao diện Sáng/Tối + Avatar người dùng kèm Menu Popup */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Nút chuyển đổi Giao diện Sáng/Tối */}
            <button
              onClick={toggleTheme}
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: 13, borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
              title={theme === "dark" ? "Chuyển sang Giao diện Sáng" : "Chuyển sang Giao diện Tối"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Avatar người dùng với Menu Popup thả xuống */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowProfileMenu((prev) => !prev)}
                title="Tài khoản & Đăng xuất"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid var(--primary)", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--primary-bg)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    border: "2px solid var(--primary)"
                  }}>
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </button>

              {/* Popup thông tin tài khoản */}
              {showProfileMenu && (
                <>
                  {/* Lớp nền mờ để tự động đóng khi nhấn ra ngoài */}
                  <div
                    onClick={() => setShowProfileMenu(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 998 }}
                  />

                  <div
                    className="bento-card"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: 0,
                      width: 250,
                      padding: 16,
                      background: "var(--bg-surface)",
                      boxShadow: "0 12px 36px rgba(0,0,0,0.3)",
                      borderRadius: 14,
                      zIndex: 999,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      animation: "modalScaleIn 0.15s ease-out"
                    }}
                  >
                    {/* Phần thông tin người dùng */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border-subtle)", paddingBottom: 12 }}>
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "var(--primary-bg)",
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: 15
                        }}>
                          {user?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div style={{ overflow: "hidden" }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-main)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {user?.name || "Tài khoản"}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                          {user?.email || ""}
                        </div>
                      </div>
                    </div>

                    {/* Nút Đăng xuất */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="btn btn-danger"
                      style={{
                        width: "100%",
                        padding: "9px 0",
                        fontSize: 13,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        borderRadius: 8
                      }}
                    >
                      <LogOut size={15} />
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* THANH ĐIỀU HƯỚNG NỔI DẠNG CONG Ở ĐÁY MÀN HÌNH (Dành riêng cho Điện thoại) */}
      <div className="mobile-bottom-bar">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`mobile-tab ${isActive ? "active" : ""}`}
            >
              <div className="tab-icon-wrapper">
                {link.icon(isActive)}
              </div>
              <span className="tab-label">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
