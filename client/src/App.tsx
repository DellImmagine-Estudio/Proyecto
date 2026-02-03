import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { me, loading, login, logout } = useAuth();

  if (loading) {
    return <p style={{ padding: 30, fontFamily: "system-ui" }}>Cargando…</p>;
  }

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={me ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />}
      />

      {/* Dashboard protegido */}
      <Route
        path="/"
        element={
          <ProtectedRoute me={me}>
            {me ? <Dashboard me={me} onLogout={logout} /> : null}
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={me ? "/" : "/login"} replace />} />
    </Routes>
  );
}
