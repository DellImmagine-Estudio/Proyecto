import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";

export default function App() {
  const { me, loading, login, logout } = useAuth();

  if (loading) return <p style={{ padding: 30 }}>Cargando…</p>;

  return (
    <Routes>
      <Route
        path="/login"
        element={me ? <Navigate to="/" replace /> : <LoginPage onLogin={login} />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute me={me}>
            <Dashboard me={me!} onLogout={logout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/clients"
        element={
          <ProtectedRoute me={me}>
            <ClientsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={me ? "/" : "/login"} replace />} />
    </Routes>
  );
}
