import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppUser } from "../types/auth";
import { fetchMe, loginWithGoogleIdToken } from "../api/auth";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  requiresWalletSetup: boolean;
  loginWithIdToken: (idToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresWalletSetup, setRequiresWalletSetup] = useState(false);

  // Khi app khởi động, nếu đã có token lưu sẵn -> thử lấy lại thông tin user
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then((res) => {
        setUser(res.user);
        setRequiresWalletSetup(res.requiresWalletSetup);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function loginWithIdToken(idToken: string) {
    const res = await loginWithGoogleIdToken(idToken);
    localStorage.setItem("access_token", res.accessToken);
    setUser(res.user);
    setRequiresWalletSetup(res.requiresWalletSetup);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
    setRequiresWalletSetup(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, requiresWalletSetup, loginWithIdToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return ctx;
}
