import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CreateFirstWalletPage from "./pages/CreateFirstWalletPage";
import AddTransactionPage from "./pages/AddTransactionPage";
import HistoryPage from "./pages/HistoryPage";
import StatementPage from "./pages/StatementPage";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/wallets/new"
              element={
                <RequireAuth>
                  <CreateFirstWalletPage />
                </RequireAuth>
              }
            />
            <Route
              path="/transactions/new"
              element={
                <RequireAuth>
                  <AddTransactionPage />
                </RequireAuth>
              }
            />
            <Route
              path="/history"
              element={
                <RequireAuth>
                  <HistoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="/reports/statement"
              element={
                <RequireAuth>
                  <StatementPage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
