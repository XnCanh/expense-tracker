import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import RequireAuth from "./components/RequireAuth";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CreateFirstWalletPage from "./pages/CreateFirstWalletPage";
import AddTransactionPage from "./pages/AddTransactionPage";
import HistoryPage from "./pages/HistoryPage";
import StatementPage from "./pages/StatementPage";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/wallets/new" element={<RequireAuth><CreateFirstWalletPage /></RequireAuth>} />
                <Route path="/transactions/new" element={<RequireAuth><AddTransactionPage /></RequireAuth>} />
                <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
                <Route path="/reports/statement" element={<RequireAuth><StatementPage /></RequireAuth>} />
                <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
