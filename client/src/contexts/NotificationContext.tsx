import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmModalOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

interface NotificationContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  confirmModal: (options: ConfirmModalOptions) => Promise<boolean>;
  alertModal: (message: string, title?: string, type?: ToastType) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string | null;
    isDanger: boolean;
    type: ToastType;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const showSuccess = (message: string) => showToast(message, "success");
  const showError = (message: string) => showToast(message, "error");

  const confirmModal = (options: ConfirmModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: options.title || "Xác nhận hành động",
        message: options.message,
        confirmText: options.confirmText || "Xác nhận",
        cancelText: options.cancelText || "Hủy bỏ",
        isDanger: options.isDanger ?? true,
        type: options.isDanger ? "warning" : "info",
        resolve,
      });
    });
  };

  const alertModal = (message: string, title?: string, type: ToastType = "info"): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title: title || "Thông báo",
        message,
        confirmText: "Đồng ý",
        cancelText: null, // Không có nút hủy
        isDanger: type === "error",
        type,
        resolve: () => resolve(),
      });
    });
  };

  const handleModalClose = (confirmed: boolean) => {
    if (modalState) {
      modalState.resolve(confirmed);
      setModalState(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, showSuccess, showError, confirmModal, alertModal }}>
      {children}

      {/* TOAST CONTAINER (Top Right) */}
      <div style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        maxWidth: 380,
        width: "calc(100% - 40px)",
        pointerEvents: "none"
      }}>
        {toasts.map((t) => {
          let bg = "var(--bg-card)";
          let border = "var(--border-subtle)";
          let icon = <Info size={18} color="var(--primary)" />;

          if (t.type === "success") {
            border = "var(--success)";
            icon = <CheckCircle size={18} color="var(--success)" />;
          } else if (t.type === "error") {
            border = "var(--danger)";
            icon = <XCircle size={18} color="var(--danger)" />;
          } else if (t.type === "warning") {
            border = "#f59e0b";
            icon = <AlertTriangle size={18} color="#f59e0b" />;
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: "auto",
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                color: "var(--text-main)",
                fontSize: 13,
                fontWeight: 600,
                backdropFilter: "blur(16px)",
                animation: "toastSlideIn 0.25s ease-out"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {icon}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-dim)",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* POPUP MODAL DIALOG (Centered) */}
      {modalState && modalState.isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          animation: "modalFadeIn 0.2s ease-out"
        }}>
          <div className="bento-card" style={{
            maxWidth: 420,
            width: "100%",
            padding: 24,
            background: "var(--bg-surface)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            animation: "modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: modalState.isDanger ? "var(--danger-bg)" : "var(--primary-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {modalState.type === "error" || modalState.isDanger ? (
                  <AlertTriangle size={20} color="var(--danger)" />
                ) : modalState.type === "success" ? (
                  <CheckCircle size={20} color="var(--success)" />
                ) : (
                  <Info size={20} color="var(--primary)" />
                )}
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-main)", margin: 0 }}>
                  {modalState.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.5,
              marginBottom: 20,
              whiteSpace: "pre-line"
            }}>
              {modalState.message}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {modalState.cancelText && (
                <button
                  onClick={() => handleModalClose(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: "10px 0" }}
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                onClick={() => handleModalClose(true)}
                className={`btn ${modalState.isDanger ? "btn-danger" : "btn-primary"}`}
                style={{ flex: modalState.cancelText ? 1.4 : 1, padding: "10px 0" }}
              >
                {modalState.confirmText}
              </button>
            </div>

          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
  return ctx;
}
