import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";
import AccountsPage from "./pages/AccountsPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const { me, loading, login, logout } = useAuth();

  if (loading) return <p style={{ padding: 30 }}>Cargando…</p>;

  const isAuthed = !!me;
  const isAdmin = me?.role === "ADMIN";

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          isAuthed ? (
            <Navigate to={isAdmin ? "/admin" : "/"} replace />
          ) : (
            <LoginPage onLogin={login} />
          )
        }
      />

      {/* ADMIN PANEL */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute me={me}>
            {isAdmin ? <AdminPage me={me!} /> : <Navigate to="/" replace />}
          </ProtectedRoute>
        }
      />

      {/* DASHBOARD PRINCIPAL (solo usuarios normales) */}
      <Route
        path="/"
        element={
          <ProtectedRoute me={me}>
            {isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Dashboard me={me!} onLogout={logout} />
            )}
          </ProtectedRoute>
        }
      />

      {/* CLIENTES */}
      <Route
        path="/clients"
        element={
          <ProtectedRoute me={me}>
            {isAdmin ? <Navigate to="/admin" replace /> : <ClientsPage />}
          </ProtectedRoute>
        }
      />

      {/* CUENTAS */}
      <Route
        path="/accounts"
        element={
          <ProtectedRoute me={me}>
            {isAdmin ? <Navigate to="/admin" replace /> : <AccountsPage />}
          </ProtectedRoute>
        }
      />

      {/* FALLBACK */}
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthed ? (isAdmin ? "/admin" : "/") : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}
